package com.ewaste.management.service;

import com.ewaste.management.config.RazorpayConfig;
import com.ewaste.management.dto.marketplace.OrderDetailDTO;
import com.ewaste.management.dto.marketplace.PaymentOrderResponseDTO;
import com.ewaste.management.dto.marketplace.PaymentVerificationDTO;
import com.ewaste.management.entity.MarketplaceOrder;
import com.ewaste.management.entity.Notification;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.MarketplaceOrderStatus;
import com.ewaste.management.model.enums.MarketplacePaymentStatus;
import com.ewaste.management.repository.MarketplaceOrderRepository;
import com.ewaste.management.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MarketplacePaymentService {

    private static final Logger log = LoggerFactory.getLogger(MarketplacePaymentService.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final RazorpayConfig razorpayConfig;
    private final MarketplaceOrderRepository marketplaceOrderRepository;
    private final MarketplaceOrderService marketplaceOrderService;
    private final NotificationRepository notificationRepository;
    private final HttpClient httpClient;

    public MarketplacePaymentService(RazorpayConfig razorpayConfig,
                                     MarketplaceOrderRepository marketplaceOrderRepository,
                                     MarketplaceOrderService marketplaceOrderService,
                                     NotificationRepository notificationRepository) {
        this.razorpayConfig = razorpayConfig;
        this.marketplaceOrderRepository = marketplaceOrderRepository;
        this.marketplaceOrderService = marketplaceOrderService;
        this.notificationRepository = notificationRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    /**
     * Initiates a payment session for an existing order by creating a Razorpay Order ID.
     */
    @Transactional
    public PaymentOrderResponseDTO initiatePayment(User user, Long orderId) {
        MarketplaceOrder order = getAndValidateOrderAccess(user, orderId);

        if (order.getPaymentStatus() == MarketplacePaymentStatus.PAID) {
            throw new IllegalStateException("Order #" + order.getOrderNumber() + " is already marked as PAID");
        }

        if (order.getStatus() == MarketplaceOrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot initiate payment for a CANCELLED order");
        }

        // Amount in paise (1 INR = 100 paise)
        long amountPaise = order.getTotalAmount()
                .multiply(BigDecimal.valueOf(100))
                .longValue();

        String razorpayOrderId;
        boolean isLiveMode = razorpayConfig.isLiveKeyConfigured();

        if (isLiveMode) {
            razorpayOrderId = createLiveRazorpayOrder(order.getOrderNumber(), amountPaise);
        } else {
            // High-fidelity sandbox / test simulation order
            razorpayOrderId = "order_rzp_mock_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 6);
            log.info("Generating sandbox Razorpay order ID [{}] for Order #{}", razorpayOrderId, order.getOrderNumber());
        }

        order.setRazorpayOrderId(razorpayOrderId);
        order.setPaymentMethod("RAZORPAY");
        marketplaceOrderRepository.save(order);

        String customerName = order.getRecipientName();
        String customerEmail = user.getEmail();
        String customerPhone = order.getPhoneNumber();

        return new PaymentOrderResponseDTO(
                order.getId(),
                order.getOrderNumber(),
                razorpayOrderId,
                amountPaise,
                order.getTotalAmount(),
                razorpayConfig.getCurrency(),
                razorpayConfig.getKeyId(),
                customerName,
                customerEmail,
                customerPhone,
                !isLiveMode
        );
    }

    /**
     * Verifies payment callback signature and transitions order to CONFIRMED and PAID.
     */
    @Transactional
    public OrderDetailDTO verifyPayment(User user, Long orderId, PaymentVerificationDTO verificationDto) {
        MarketplaceOrder order = getAndValidateOrderAccess(user, orderId);

        if (order.getPaymentStatus() == MarketplacePaymentStatus.PAID) {
            return marketplaceOrderService.mapToDetailDTO(order);
        }

        if (order.getStatus() == MarketplaceOrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot confirm payment for a CANCELLED order");
        }

        boolean isLiveMode = razorpayConfig.isLiveKeyConfigured();

        if (isLiveMode) {
            String rzpOrderId = order.getRazorpayOrderId() != null ? order.getRazorpayOrderId() : verificationDto.getRazorpayOrderId();
            boolean isValidSignature = verifySignature(
                    rzpOrderId,
                    verificationDto.getRazorpayPaymentId(),
                    verificationDto.getRazorpaySignature(),
                    razorpayConfig.getKeySecret()
            );

            if (!isValidSignature) {
                log.error("Invalid Razorpay cryptographic signature for Order #{}", order.getOrderNumber());
                throw new IllegalArgumentException("Payment verification failed: cryptographic signature mismatch");
            }
        } else {
            // Sandbox validation check
            if (verificationDto.getRazorpayPaymentId() == null || verificationDto.getRazorpayPaymentId().isBlank()) {
                throw new IllegalArgumentException("Payment verification failed: missing payment ID");
            }
            log.info("Sandbox Razorpay verification accepted for Order #{} with payment ID [{}]",
                    order.getOrderNumber(), verificationDto.getRazorpayPaymentId());
        }

        // Successfully verified: transition order states
        order.setPaymentStatus(MarketplacePaymentStatus.PAID);
        order.setStatus(MarketplaceOrderStatus.CONFIRMED);
        order.setPaymentMethod("RAZORPAY");
        order.setPaymentTransactionId(verificationDto.getRazorpayPaymentId());
        order.setConfirmedAt(LocalDateTime.now());

        MarketplaceOrder savedOrder = marketplaceOrderRepository.save(order);

        // Record user notification
        try {
            Notification notification = new Notification();
            notification.setUser(order.getBuyer());
            notification.setTitle("Payment Confirmed: Order #" + order.getOrderNumber());
            notification.setMessage("Payment of ₹" + order.getTotalAmount() + " successfully received via Razorpay (Ref: "
                    + verificationDto.getRazorpayPaymentId() + "). Your refurbished equipment is queued for delivery dispatch.");
            notification.setType("ORDER");
            notification.setRead(false);
            notificationRepository.save(notification);
        } catch (Exception ex) {
            log.warn("Failed to save payment confirmation notification: {}", ex.getMessage());
        }

        log.info("Order #{} successfully verified and marked as PAID (Txn: {})",
                savedOrder.getOrderNumber(), savedOrder.getPaymentTransactionId());

        return marketplaceOrderService.mapToDetailDTO(savedOrder);
    }

    public RazorpayConfig getPublicConfig() {
        RazorpayConfig publicConfig = new RazorpayConfig();
        publicConfig.setKeyId(razorpayConfig.getKeyId());
        publicConfig.setCurrency(razorpayConfig.getCurrency());
        publicConfig.setSandboxMode(!razorpayConfig.isLiveKeyConfigured());
        publicConfig.setKeySecret(""); // Never expose secret to clients
        return publicConfig;
    }

    private MarketplaceOrder getAndValidateOrderAccess(User user, Long orderId) {
        MarketplaceOrder order = marketplaceOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Marketplace order not found: ID " + orderId));

        boolean isBuyer = order.getBuyer().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == com.ewaste.management.model.enums.UserRole.ADMIN;

        if (!isBuyer && !isAdmin) {
            throw new AccessDeniedException("Access denied: You are not authorized to access Order #" + order.getOrderNumber());
        }

        return order;
    }

    private String createLiveRazorpayOrder(String receipt, long amountPaise) {
        try {
            String credentials = Base64.getEncoder().encodeToString(
                    (razorpayConfig.getKeyId() + ":" + razorpayConfig.getKeySecret()).getBytes(StandardCharsets.UTF_8)
            );

            String requestBody = String.format(
                    "{\"amount\":%d,\"currency\":\"%s\",\"receipt\":\"%s\",\"payment_capture\":1}",
                    amountPaise, razorpayConfig.getCurrency(), receipt
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Authorization", "Basic " + credentials)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                Matcher matcher = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"").matcher(response.body());
                if (matcher.find()) {
                    return matcher.group(1);
                }
            }

            log.warn("Razorpay API order creation returned status {}: {}. Falling back to sandbox order ID.",
                    response.statusCode(), response.body());
        } catch (Exception ex) {
            log.warn("Failed to contact Razorpay API ({}), falling back to sandbox order ID.", ex.getMessage());
        }

        return "order_fallback_" + System.currentTimeMillis();
    }

    private boolean verifySignature(String orderId, String paymentId, String signature, String secret) {
        if (orderId == null || paymentId == null || signature == null || secret == null) {
            return false;
        }

        try {
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            byte[] hmacBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hmacBytes) {
                hex.append(String.format("%02x", b));
            }

            return hex.toString().equalsIgnoreCase(signature);
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            log.error("Cryptographic error verifying Razorpay signature: {}", ex.getMessage());
            return false;
        }
    }
}
