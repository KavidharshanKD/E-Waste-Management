package com.ewaste.management.controller;

import com.ewaste.management.config.RazorpayConfig;
import com.ewaste.management.dto.marketplace.OrderDetailDTO;
import com.ewaste.management.dto.marketplace.PaymentOrderResponseDTO;
import com.ewaste.management.dto.marketplace.PaymentVerificationDTO;
import com.ewaste.management.entity.User;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.service.MarketplacePaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/marketplace/payments")
@PreAuthorize("isAuthenticated()")
public class MarketplacePaymentController {

    private final MarketplacePaymentService marketplacePaymentService;
    private final UserRepository userRepository;

    public MarketplacePaymentController(MarketplacePaymentService marketplacePaymentService,
                                        UserRepository userRepository) {
        this.marketplacePaymentService = marketplacePaymentService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + authentication.getName()));
    }

    @PostMapping("/initiate/{orderId}")
    public ResponseEntity<?> initiatePayment(@PathVariable("orderId") Long orderId,
                                            Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            PaymentOrderResponseDTO response = marketplacePaymentService.initiatePayment(user, orderId);
            return ResponseEntity.ok(response);
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        } catch (Exception ex) {
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to initiate payment session: " + ex.getMessage());
        }
    }

    @PostMapping("/verify/{orderId}")
    public ResponseEntity<?> verifyPayment(@PathVariable("orderId") Long orderId,
                                          @Valid @RequestBody PaymentVerificationDTO verificationDto,
                                          Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            OrderDetailDTO order = marketplacePaymentService.verifyPayment(user, orderId, verificationDto);
            return ResponseEntity.ok(order);
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        } catch (Exception ex) {
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to verify payment: " + ex.getMessage());
        }
    }

    @GetMapping("/config")
    public ResponseEntity<RazorpayConfig> getPublicConfig() {
        return ResponseEntity.ok(marketplacePaymentService.getPublicConfig());
    }

    private ResponseEntity<Map<String, String>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, String> err = new HashMap<>();
        err.put("error", message);
        return ResponseEntity.status(status).body(err);
    }
}
