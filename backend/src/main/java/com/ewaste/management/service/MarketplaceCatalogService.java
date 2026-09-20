package com.ewaste.management.service;

import com.ewaste.management.dto.marketplace.DeviceJourneyDTO;
import com.ewaste.management.dto.marketplace.ListingDetailDTO;
import com.ewaste.management.dto.marketplace.ListingSummaryDTO;
import com.ewaste.management.entity.MarketplaceListing;
import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.MarketplaceListingStatus;
import com.ewaste.management.model.enums.MarketplaceStockStatus;
import com.ewaste.management.repository.MarketplaceListingRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class MarketplaceCatalogService {

    private final MarketplaceListingRepository marketplaceListingRepository;
    private final MarketplaceListingService marketplaceListingService;

    public MarketplaceCatalogService(MarketplaceListingRepository marketplaceListingRepository,
                                     MarketplaceListingService marketplaceListingService) {
        this.marketplaceListingRepository = marketplaceListingRepository;
        this.marketplaceListingService = marketplaceListingService;
    }

    /**
     * Search and browse publicly published and available marketplace listings.
     */
    @Transactional(readOnly = true)
    public Page<ListingSummaryDTO> searchCatalog(EWasteCategory category,
                                                 String brand,
                                                 CosmeticGrade cosmeticGrade,
                                                 BigDecimal minPrice,
                                                 BigDecimal maxPrice,
                                                 String query,
                                                 Pageable pageable) {
        Specification<MarketplaceListing> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("listingStatus"), MarketplaceListingStatus.PUBLISHED));
            predicates.add(cb.equal(root.get("stockStatus"), MarketplaceStockStatus.AVAILABLE));

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (brand != null && !brand.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("brand")), "%" + brand.trim().toLowerCase() + "%"));
            }

            if (cosmeticGrade != null) {
                predicates.add(cb.equal(root.get("cosmeticGrade"), cosmeticGrade));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("sellingPrice"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("sellingPrice"), maxPrice));
            }

            if (query != null && !query.isBlank()) {
                String searchPattern = "%" + query.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), searchPattern);
                Predicate brandMatch = cb.like(cb.lower(root.get("brand")), searchPattern);
                Predicate modelMatch = cb.like(cb.lower(root.get("model")), searchPattern);
                predicates.add(cb.or(titleMatch, brandMatch, modelMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return marketplaceListingRepository.findAll(spec, pageable)
                .map(marketplaceListingService::mapToSummaryDTO);
    }

    /**
     * Retrieves public details of a published listing, complete with its verified circular device journey.
     */
    @Transactional(readOnly = true)
    public ListingDetailDTO getPublicListingDetail(Long id) {
        MarketplaceListing listing = marketplaceListingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Marketplace listing not found with ID: " + id));

        if (listing.getListingStatus() != MarketplaceListingStatus.PUBLISHED) {
            throw new IllegalArgumentException("Listing is not currently available on the marketplace");
        }

        return marketplaceListingService.mapToDetailDTO(listing);
    }

    /**
     * Retrieves the circular journey of a device without exposing donor PII.
     */
    @Transactional(readOnly = true)
    public DeviceJourneyDTO getPublicDeviceJourney(Long listingId) {
        MarketplaceListing listing = marketplaceListingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Marketplace listing not found with ID: " + listingId));

        if (listing.getListingStatus() != MarketplaceListingStatus.PUBLISHED) {
            throw new IllegalArgumentException("Listing journey is only accessible for published listings");
        }

        return marketplaceListingService.buildDeviceJourney(listing);
    }
}
