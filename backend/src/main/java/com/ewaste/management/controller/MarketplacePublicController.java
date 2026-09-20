package com.ewaste.management.controller;

import com.ewaste.management.dto.marketplace.DeviceJourneyDTO;
import com.ewaste.management.dto.marketplace.ListingDetailDTO;
import com.ewaste.management.dto.marketplace.ListingSummaryDTO;
import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.service.MarketplaceCatalogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/marketplace/listings")
public class MarketplacePublicController {

    private final MarketplaceCatalogService marketplaceCatalogService;

    public MarketplacePublicController(MarketplaceCatalogService marketplaceCatalogService) {
        this.marketplaceCatalogService = marketplaceCatalogService;
    }

    /**
     * Browse and search public marketplace catalog for available refurbished devices.
     */
    @GetMapping
    public ResponseEntity<Page<ListingSummaryDTO>> searchListings(
            @RequestParam(required = false) EWasteCategory category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) CosmeticGrade cosmeticGrade,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 12, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ListingSummaryDTO> results = marketplaceCatalogService.searchCatalog(
                category, brand, cosmeticGrade, minPrice, maxPrice, query, pageable);
        return ResponseEntity.ok(results);
    }

    /**
     * Get public listing details including specs, price, warranty, and circular origin journey.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ListingDetailDTO> getListingDetail(@PathVariable("id") Long id) {
        return ResponseEntity.ok(marketplaceCatalogService.getPublicListingDetail(id));
    }

    /**
     * Get transparent circular device journey (zero donor PII).
     */
    @GetMapping("/{id}/journey")
    public ResponseEntity<DeviceJourneyDTO> getDeviceJourney(@PathVariable("id") Long id) {
        return ResponseEntity.ok(marketplaceCatalogService.getPublicDeviceJourney(id));
    }
}
