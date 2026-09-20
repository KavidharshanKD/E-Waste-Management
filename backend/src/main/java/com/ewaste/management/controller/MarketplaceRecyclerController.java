package com.ewaste.management.controller;

import com.ewaste.management.dto.marketplace.CreateListingDraftDTO;
import com.ewaste.management.dto.marketplace.ListingDetailDTO;
import com.ewaste.management.dto.marketplace.ListingSummaryDTO;
import com.ewaste.management.dto.marketplace.MarketplaceCandidateDTO;
import com.ewaste.management.dto.marketplace.OrderDetailDTO;
import com.ewaste.management.dto.marketplace.UpdateListingDraftDTO;
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
@RequestMapping("/api/recycler/marketplace")
@PreAuthorize("hasAnyRole('RECYCLER', 'ADMIN')")
public class MarketplaceRecyclerController {

    private final MarketplaceListingService marketplaceListingService;
    private final MarketplaceOrderService marketplaceOrderService;
    private final UserRepository userRepository;

    public MarketplaceRecyclerController(MarketplaceListingService marketplaceListingService,
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
     * Retrieves devices that passed physical quality check and are marked as marketplace candidates.
     */
    @GetMapping("/candidates")
    public ResponseEntity<List<MarketplaceCandidateDTO>> getEligibleCandidates(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(marketplaceListingService.getEligibleCandidates(user));
    }

    /**
     * Creates a draft listing for an eligible refurbished device.
     */
    @PostMapping("/listings")
    public ResponseEntity<?> createDraft(@Valid @RequestBody CreateListingDraftDTO dto,
                                        Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            ListingDetailDTO listing = marketplaceListingService.createDraft(dto, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(listing);
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    /**
     * Lists listings for the current recycler facility.
     */
    @GetMapping("/listings")
    public ResponseEntity<List<ListingSummaryDTO>> getCenterListings(
            @RequestParam(value = "status", required = false) MarketplaceListingStatus status,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(marketplaceListingService.getMyCenterListings(user, status));
    }

    /**
     * Gets full detail of a listing for management.
     */
    @GetMapping("/listings/{id}")
    public ResponseEntity<?> getListingDetail(@PathVariable("id") Long id,
                                             Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            return ResponseEntity.ok(marketplaceListingService.getListingDetailForManagement(id, user));
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    /**
     * Updates an editable draft or rejected listing.
     */
    @PutMapping("/listings/{id}")
    public ResponseEntity<?> updateDraft(@PathVariable("id") Long id,
                                         @Valid @RequestBody UpdateListingDraftDTO dto,
                                         Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            return ResponseEntity.ok(marketplaceListingService.updateDraft(id, dto, user));
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    /**
     * Submits a draft listing for Admin approval.
     */
    @PostMapping("/listings/{id}/submit")
    public ResponseEntity<?> submitForApproval(@PathVariable("id") Long id,
                                               Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            return ResponseEntity.ok(marketplaceListingService.submitForApproval(id, user));
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    /**
     * Withdraws a listing from active status.
     */
    @PostMapping("/listings/{id}/withdraw")
    public ResponseEntity<?> withdrawListing(@PathVariable("id") Long id,
                                             Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            return ResponseEntity.ok(marketplaceListingService.withdrawListing(id, user));
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    /**
     * Updates order fulfillment status (CONFIRMED, SHIPPED, DELIVERED).
     */
    @PostMapping("/orders/{id}/fulfill")
    public ResponseEntity<?> fulfillOrder(@PathVariable("id") Long id,
                                          @RequestParam("status") MarketplaceOrderStatus status,
                                          Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            return ResponseEntity.ok(marketplaceOrderService.fulfillOrder(user, id, status));
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
