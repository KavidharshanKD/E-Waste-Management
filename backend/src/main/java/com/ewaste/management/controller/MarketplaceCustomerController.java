package com.ewaste.management.controller;

import com.ewaste.management.dto.marketplace.CartDTO;
import com.ewaste.management.dto.marketplace.CreateOrderDTO;
import com.ewaste.management.dto.marketplace.OrderDetailDTO;
import com.ewaste.management.entity.User;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.service.MarketplaceCartService;
import com.ewaste.management.service.MarketplaceOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/marketplace")
@PreAuthorize("isAuthenticated()")
public class MarketplaceCustomerController {

    private final MarketplaceCartService marketplaceCartService;
    private final MarketplaceOrderService marketplaceOrderService;
    private final UserRepository userRepository;

    public MarketplaceCustomerController(MarketplaceCartService marketplaceCartService,
                                         MarketplaceOrderService marketplaceOrderService,
                                         UserRepository userRepository) {
        this.marketplaceCartService = marketplaceCartService;
        this.marketplaceOrderService = marketplaceOrderService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + authentication.getName()));
    }

    // =========================================================================
    // CART OPERATIONS
    // =========================================================================

    @GetMapping("/cart")
    public ResponseEntity<CartDTO> getCart(Authentication authentication) {
        User buyer = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(marketplaceCartService.getCart(buyer));
    }

    @PostMapping("/cart/items")
    public ResponseEntity<?> addToCart(@RequestParam("listingId") Long listingId,
                                       Authentication authentication) {
        try {
            User buyer = getAuthenticatedUser(authentication);
            return ResponseEntity.ok(marketplaceCartService.addToCart(buyer, listingId));
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @DeleteMapping("/cart/items/{listingId}")
    public ResponseEntity<CartDTO> removeFromCart(@PathVariable("listingId") Long listingId,
                                                 Authentication authentication) {
        User buyer = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(marketplaceCartService.removeFromCart(buyer, listingId));
    }

    @DeleteMapping("/cart")
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        User buyer = getAuthenticatedUser(authentication);
        marketplaceCartService.clearCart(buyer);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // ORDER OPERATIONS
    // =========================================================================

    @PostMapping("/orders")
    public ResponseEntity<?> checkout(@Valid @RequestBody CreateOrderDTO dto,
                                      Authentication authentication) {
        try {
            User buyer = getAuthenticatedUser(authentication);
            OrderDetailDTO order = marketplaceOrderService.checkout(buyer, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDetailDTO>> getMyOrders(Authentication authentication) {
        User buyer = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(marketplaceOrderService.getMyOrders(buyer));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrderDetail(@PathVariable("id") Long id,
                                            Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            return ResponseEntity.ok(marketplaceOrderService.getOrderDetail(user, id));
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable("id") Long id,
                                         @RequestParam(value = "reason", required = false, defaultValue = "Cancelled by user") String reason,
                                         Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            return ResponseEntity.ok(marketplaceOrderService.cancelOrder(user, id, reason));
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    private ResponseEntity<Map<String, String>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, String> err = new HashMap<>();
        err.put("error", message);
        return ResponseEntity.status(status).body(err);
    }
}
