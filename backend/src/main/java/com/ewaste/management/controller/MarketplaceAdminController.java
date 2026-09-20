package com.ewaste.management.controller;

import com.ewaste.management.dto.marketplace.ListingApprovalDTO;
import com.ewaste.management.dto.marketplace.ListingDetailDTO;
import com.ewaste.management.dto.marketplace.ListingSummaryDTO;
import com.ewaste.management.dto.marketplace.OrderDetailDTO;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.MarketplaceListingStatus;
import com.ewaste.management.model.enums.MarketplaceOrderStatus;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.service.MarketplaceListingService;
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
@RequestMapping("/api/admin/marketplace")
@PreAuthorize("hasRole('ADMIN')")
public class MarketplaceAdminController {

    private final MarketplaceListingService marketplaceListingService;
    private final MarketplaceOrderService marketplaceOrderService;
    private final UserRepository userRepository;

    public MarketplaceAdminController(MarketplaceListingService marketplaceListingService,
                                     MarketplaceOrderService marketplaceOrderService,
                                     UserRepository userRepository) {
        this.marketplaceListingService = marketplaceListingService;
        this.marketplaceOrderService = marketplaceOrderService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + authentication.getName()));
    }

    /**
     * View all marketplace listings across centers, filterable by listing status (e.g. PENDING_APPROVAL).
     */
    @GetMapping("/listings")
    public ResponseEntity<List<ListingSummaryDTO>> getAllListings(
            @RequestParam(value = "status", required = false) MarketplaceListingStatus status) {
        return ResponseEntity.ok(marketplaceListingService.getAdminListings(status));
    }

    /**
     * Admin review: Approve and publish to marketplace, or reject with mandatory reason.
     */
    @PostMapping("/listings/{id}/review")
    public ResponseEntity<?> reviewListing(@PathVariable("id") Long id,
                                          @Valid @RequestBody ListingApprovalDTO dto,
                                          Authentication authentication) {
        try {
            User adminUser = getAuthenticatedUser(authentication);
            ListingDetailDTO result = marketplaceListingService.reviewListing(id, dto, adminUser);
            return ResponseEntity.ok(result);
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    /**
     * View all marketplace orders across the system.
     */
    @GetMapping("/orders")
    public ResponseEntity<List<OrderDetailDTO>> getAllOrders(
            @RequestParam(value = "status", required = false) MarketplaceOrderStatus status,
            Authentication authentication) {
        User adminUser = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(marketplaceOrderService.getAllOrders(adminUser, status));
    }

    private ResponseEntity<Map<String, String>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, String> err = new HashMap<>();
        err.put("error", message);
        return ResponseEntity.status(status).body(err);
    }
}
