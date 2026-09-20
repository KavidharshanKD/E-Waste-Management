package com.ewaste.management.service;

import com.ewaste.management.dto.marketplace.CreateOrderDTO;
import com.ewaste.management.dto.marketplace.OrderDetailDTO;
import com.ewaste.management.dto.marketplace.OrderItemDTO;
import com.ewaste.management.entity.Cart;
import com.ewaste.management.entity.CartItem;
import com.ewaste.management.entity.MarketplaceListing;
import com.ewaste.management.entity.MarketplaceOrder;
import com.ewaste.management.entity.MarketplaceOrderItem;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.MarketplaceListingStatus;
import com.ewaste.management.model.enums.MarketplaceOrderStatus;
import com.ewaste.management.model.enums.MarketplacePaymentStatus;
import com.ewaste.management.model.enums.MarketplaceStockStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.CartItemRepository;
import com.ewaste.management.repository.CartRepository;
import com.ewaste.management.repository.MarketplaceListingRepository;
import com.ewaste.management.repository.MarketplaceOrderItemRepository;
import com.ewaste.management.repository.MarketplaceOrderRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MarketplaceOrderService {

    private final MarketplaceOrderRepository marketplaceOrderRepository;
    private final MarketplaceOrderItemRepository marketplaceOrderItemRepository;
    private final MarketplaceListingRepository marketplaceListingRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    public MarketplaceOrderService(MarketplaceOrderRepository marketplaceOrderRepository,
                                  MarketplaceOrderItemRepository marketplaceOrderItemRepository,
                                  MarketplaceListingRepository marketplaceListingRepository,
                                  CartRepository cartRepository,
                                  CartItemRepository cartItemRepository) {
        this.marketplaceOrderRepository = marketplaceOrderRepository;
        this.marketplaceOrderItemRepository = marketplaceOrderItemRepository;
        this.marketplaceListingRepository = marketplaceListingRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
    }

    /**
     * Atomically checks out one or more unique refurbished devices.
     * Uses pessimistic locking on listings to guarantee that a physical device unit cannot be double-booked.
     */
    @Transactional
    public OrderDetailDTO checkout(User buyer, CreateOrderDTO dto) {
        Optional<Cart> optionalCart = cartRepository.findByUserId(buyer.getId());
        List<Long> listingIdsToOrder = dto.getListingIds();

        if (listingIdsToOrder == null || listingIdsToOrder.isEmpty()) {
            if (optionalCart.isEmpty()) {
                throw new IllegalArgumentException("Cart is empty");
            }
            List<CartItem> cartItems = cartItemRepository.findByCartId(optionalCart.get().getId());
            if (cartItems.isEmpty()) {
                throw new IllegalArgumentException("Cart is empty");
            }
            listingIdsToOrder = cartItems.stream()
                    .map(item -> item.getListing().getId())
                    .collect(Collectors.toList());
        }

        // 1. PESSIMISTIC LOCKING: Lock the specific listings to prevent concurrent double-booking
        List<MarketplaceListing> lockedListings = marketplaceListingRepository.findAllByIdInForUpdate(listingIdsToOrder);

        if (lockedListings.size() != listingIdsToOrder.size()) {
            throw new IllegalArgumentException("One or more selected listings could not be found");
        }

        // 2. Strict validation of each locked listing
        BigDecimal subtotal = BigDecimal.ZERO;
        for (MarketplaceListing listing : lockedListings) {
            if (listing.getListingStatus() != MarketplaceListingStatus.PUBLISHED) {
                throw new IllegalStateException("Device '" + listing.getTitle() + "' is not in PUBLISHED status (status: " + listing.getListingStatus() + ")");
            }
            if (listing.getStockStatus() != MarketplaceStockStatus.AVAILABLE) {
                throw new IllegalStateException("Device '" + listing.getTitle() + "' is currently " + listing.getStockStatus() + " and unavailable for purchase");
            }
            subtotal = subtotal.add(listing.getSellingPrice());
        }

        // 3. Create MarketplaceOrder with immutable address and contact snapshot
        MarketplaceOrder order = new MarketplaceOrder();
        order.setOrderNumber(generateOrderNumber());
        order.setBuyer(buyer);
        order.setStatus(MarketplaceOrderStatus.PLACED);
        order.setPaymentStatus(MarketplacePaymentStatus.PENDING);
        order.setPaymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "DEMO_CHECKOUT");
        order.setSubtotal(subtotal);
        order.setTotalAmount(subtotal); // Free circular delivery for demo

        order.setRecipientName(dto.getRecipientName());
        order.setPhoneNumber(dto.getPhoneNumber());
        order.setAddressLine(dto.getAddressLine());
        order.setCity(dto.getCity());
        order.setState(dto.getState());
        order.setPostalCode(dto.getPostalCode());
        order.setPlacedAt(LocalDateTime.now());

        MarketplaceOrder savedOrder = marketplaceOrderRepository.save(order);

        // 4. Create snapshot order items and transition listing stock status to RESERVED
        for (MarketplaceListing listing : lockedListings) {
            MarketplaceOrderItem orderItem = new MarketplaceOrderItem(
                    savedOrder,
                    listing,
                    listing.getSellingPrice(),
                    listing.getTitle(),
                    listing.getWarrantyDays()
            );
            marketplaceOrderItemRepository.save(orderItem);
            savedOrder.addItem(orderItem);

            // Reserve inventory
            listing.setStockStatus(MarketplaceStockStatus.RESERVED);
            marketplaceListingRepository.save(listing);

            // Remove from buyer's cart if present
            if (optionalCart.isPresent()) {
                Cart cart = optionalCart.get();
                cart.getItems().removeIf(ci -> ci.getListing().getId().equals(listing.getId()));
                cartItemRepository.deleteByCartIdAndListingId(cart.getId(), listing.getId());
                cartRepository.saveAndFlush(cart);
            }
        }

        return mapToDetailDTO(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderDetailDTO getOrderDetail(User user, Long orderId) {
        MarketplaceOrder order = marketplaceOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Marketplace order not found with ID: " + orderId));

        if (user.getRole() != UserRole.ADMIN && !order.getBuyer().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied to order details");
        }

        return mapToDetailDTO(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDetailDTO> getMyOrders(User buyer) {
        List<MarketplaceOrder> orders = marketplaceOrderRepository.findByBuyerIdOrderByPlacedAtDesc(buyer.getId());
        return orders.stream().map(this::mapToDetailDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDetailDTO> getAllOrders(User adminUser, MarketplaceOrderStatus status) {
        if (adminUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only ADMIN users can view all marketplace orders");
        }
        List<MarketplaceOrder> orders;
        if (status != null) {
            orders = marketplaceOrderRepository.findByStatusOrderByPlacedAtDesc(status);
        } else {
            orders = marketplaceOrderRepository.findAll();
        }
        return orders.stream().map(this::mapToDetailDTO).collect(Collectors.toList());
    }

    /**
     * Cancels an order and automatically releases the reserved physical device units back to AVAILABLE stock.
     */
    @Transactional
    public OrderDetailDTO cancelOrder(User user, Long orderId, String reason) {
        MarketplaceOrder order = marketplaceOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if (user.getRole() != UserRole.ADMIN && !order.getBuyer().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied to cancel this order");
        }

        if (order.getStatus() == MarketplaceOrderStatus.SHIPPED || order.getStatus() == MarketplaceOrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel order in " + order.getStatus() + " status");
        }

        if (order.getStatus() == MarketplaceOrderStatus.CANCELLED) {
            return mapToDetailDTO(order);
        }

        order.setStatus(MarketplaceOrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order.setCancellationReason(reason);

        // Release inventory reservation
        List<MarketplaceOrderItem> items = marketplaceOrderItemRepository.findByOrderId(order.getId());
        for (MarketplaceOrderItem item : items) {
            MarketplaceListing listing = marketplaceListingRepository.findByIdForUpdate(item.getListing().getId())
                    .orElse(null);
            if (listing != null && listing.getStockStatus() == MarketplaceStockStatus.RESERVED) {
                listing.setStockStatus(MarketplaceStockStatus.AVAILABLE);
                marketplaceListingRepository.save(listing);
            }
        }

        MarketplaceOrder saved = marketplaceOrderRepository.save(order);
        return mapToDetailDTO(saved);
    }

    /**
     * Updates order fulfillment status (e.g. CONFIRMED, SHIPPED, DELIVERED).
     * When status reaches DELIVERED, device unit is formally marked SOLD.
     */
    @Transactional
    public OrderDetailDTO fulfillOrder(User operator, Long orderId, MarketplaceOrderStatus newStatus) {
        if (operator.getRole() != UserRole.ADMIN && operator.getRole() != UserRole.RECYCLER) {
            throw new AccessDeniedException("Only authorized recyclers or admins can update order fulfillment status");
        }

        MarketplaceOrder order = marketplaceOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if (order.getStatus() == MarketplaceOrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update status of a cancelled order");
        }

        order.setStatus(newStatus);
        LocalDateTime now = LocalDateTime.now();

        if (newStatus == MarketplaceOrderStatus.CONFIRMED) {
            order.setConfirmedAt(now);
        } else if (newStatus == MarketplaceOrderStatus.SHIPPED) {
            order.setShippedAt(now);
        } else if (newStatus == MarketplaceOrderStatus.DELIVERED) {
            order.setDeliveredAt(now);
            order.setPaymentStatus(MarketplacePaymentStatus.PAID);

            // Device is permanently sold to customer for its second life
            List<MarketplaceOrderItem> items = marketplaceOrderItemRepository.findByOrderId(order.getId());
            for (MarketplaceOrderItem item : items) {
                MarketplaceListing listing = marketplaceListingRepository.findByIdForUpdate(item.getListing().getId())
                        .orElse(null);
                if (listing != null) {
                    listing.setStockStatus(MarketplaceStockStatus.SOLD);
                    listing.setSoldAt(now);
                    marketplaceListingRepository.save(listing);
                }
            }
        } else if (newStatus == MarketplaceOrderStatus.CANCELLED) {
            return cancelOrder(operator, orderId, "Cancelled by operations staff");
        }

        MarketplaceOrder saved = marketplaceOrderRepository.save(order);
        return mapToDetailDTO(saved);
    }

    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    public OrderDetailDTO mapToDetailDTO(MarketplaceOrder order) {
        OrderDetailDTO dto = new OrderDetailDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setStatus(order.getStatus());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setSubtotal(order.getSubtotal());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setRecipientName(order.getRecipientName());
        dto.setPhoneNumber(order.getPhoneNumber());
        dto.setAddressLine(order.getAddressLine());
        dto.setCity(order.getCity());
        dto.setState(order.getState());
        dto.setPostalCode(order.getPostalCode());
        dto.setPlacedAt(order.getPlacedAt());
        dto.setConfirmedAt(order.getConfirmedAt());
        dto.setShippedAt(order.getShippedAt());
        dto.setDeliveredAt(order.getDeliveredAt());
        dto.setCancelledAt(order.getCancelledAt());
        dto.setCancellationReason(order.getCancellationReason());

        List<MarketplaceOrderItem> items = marketplaceOrderItemRepository.findByOrderId(order.getId());
        List<OrderItemDTO> itemDtos = items.stream()
                .map(item -> new OrderItemDTO(
                        item.getId(),
                        item.getListing().getId(),
                        item.getTitleSnapshot(),
                        item.getPriceAtPurchase(),
                        item.getWarrantyDaysSnapshot()))
                .collect(Collectors.toList());
        dto.setItems(itemDtos);

        return dto;
    }
}
