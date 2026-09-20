package com.ewaste.management.service;

import com.ewaste.management.dto.marketplace.CreateListingDraftDTO;
import com.ewaste.management.dto.marketplace.DeviceJourneyDTO;
import com.ewaste.management.dto.marketplace.DeviceJourneyEventDTO;
import com.ewaste.management.dto.marketplace.ListingApprovalDTO;
import com.ewaste.management.dto.marketplace.ListingDetailDTO;
import com.ewaste.management.dto.marketplace.ListingImageDTO;
import com.ewaste.management.dto.marketplace.ListingSummaryDTO;
import com.ewaste.management.dto.marketplace.MarketplaceCandidateDTO;
import com.ewaste.management.dto.marketplace.UpdateListingDraftDTO;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.MarketplaceListing;
import com.ewaste.management.entity.MarketplaceListingImage;
import com.ewaste.management.entity.QualityCheck;
import com.ewaste.management.entity.Recycler;
import com.ewaste.management.entity.RestorationJob;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.MarketplaceListingStatus;
import com.ewaste.management.model.enums.MarketplaceStockStatus;
import com.ewaste.management.model.enums.QualityCheckResult;
import com.ewaste.management.model.enums.RestorationStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.MarketplaceListingImageRepository;
import com.ewaste.management.repository.MarketplaceListingRepository;
import com.ewaste.management.repository.QualityCheckRepository;
import com.ewaste.management.repository.RecyclerRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MarketplaceListingService {

    private final MarketplaceListingRepository marketplaceListingRepository;
    private final MarketplaceListingImageRepository marketplaceListingImageRepository;
    private final QualityCheckRepository qualityCheckRepository;
    private final RecyclerRepository recyclerRepository;

    public MarketplaceListingService(MarketplaceListingRepository marketplaceListingRepository,
                                     MarketplaceListingImageRepository marketplaceListingImageRepository,
                                     QualityCheckRepository qualityCheckRepository,
                                     RecyclerRepository recyclerRepository) {
        this.marketplaceListingRepository = marketplaceListingRepository;
        this.marketplaceListingImageRepository = marketplaceListingImageRepository;
        this.qualityCheckRepository = qualityCheckRepository;
        this.recyclerRepository = recyclerRepository;
    }

    /**
     * Finds devices that passed physical quality check, are marked as marketplace candidates,
     * and have not yet had a marketplace listing created.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceCandidateDTO> getEligibleCandidates(User currentUser) {
        List<QualityCheck> candidates = qualityCheckRepository
                .findByOverallResultAndMarketplaceCandidateTrue(QualityCheckResult.PASS);

        Long userCenterId = resolveUserCenterId(currentUser);

        return candidates.stream()
                .filter(qc -> !marketplaceListingRepository.existsByQualityCheckId(qc.getId()))
                .filter(qc -> qc.getRestorationJob() != null
                        && qc.getRestorationJob().getStatus() == RestorationStatus.COMPLETED)
                .filter(qc -> {
                    if (currentUser.getRole() == UserRole.ADMIN) {
                        return true;
                    }
                    if (userCenterId == null) {
                        return false;
                    }
                    return qc.getRestorationJob().getDisposalRequest() != null
                            && qc.getRestorationJob().getDisposalRequest().getCenter() != null
                            && userCenterId.equals(qc.getRestorationJob().getDisposalRequest().getCenter().getId());
                })
                .map(this::mapToCandidateDTO)
                .collect(Collectors.toList());
    }

    /**
     * Creates a draft marketplace listing from a verified quality-checked refurbished device.
     */
    @Transactional
    public ListingDetailDTO createDraft(CreateListingDraftDTO dto, User currentUser) {
        if (currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.RECYCLER) {
            throw new AccessDeniedException("Only authorized recyclers or admins can create marketplace listings");
        }

        QualityCheck qc = qualityCheckRepository.findById(dto.getQualityCheckId())
                .orElseThrow(() -> new IllegalArgumentException("Quality check record not found with ID: " + dto.getQualityCheckId()));

        if (qc.getOverallResult() != QualityCheckResult.PASS) {
            throw new IllegalArgumentException("Cannot list device: Quality check did not PASS (result: " + qc.getOverallResult() + ")");
        }

        if (Boolean.FALSE.equals(qc.getMarketplaceCandidate())) {
            throw new IllegalArgumentException("Cannot list device: Quality check did not designate device as marketplaceCandidate");
        }

        RestorationJob job = qc.getRestorationJob();
        if (job == null || job.getStatus() != RestorationStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot list device: Restoration job is not in COMPLETED status");
        }

        if (marketplaceListingRepository.existsByQualityCheckId(qc.getId())) {
            throw new IllegalStateException("A marketplace listing already exists for quality check ID: " + qc.getId());
        }

        if (dto.getSellingPrice() == null || dto.getSellingPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Selling price must be explicitly entered and greater than zero");
        }

        if (job.getDisposalRequest().getCenter() == null) {
            throw new IllegalStateException("Associated disposal request has no assigned recycling center");
        }

        // Authority check for recyclers
        if (currentUser.getRole() == UserRole.RECYCLER) {
            Long userCenterId = resolveUserCenterId(currentUser);
            if (userCenterId == null || !userCenterId.equals(job.getDisposalRequest().getCenter().getId())) {
                throw new AccessDeniedException("You can only create listings for devices processed at your assigned facility");
            }
        }

        EWasteItem item = (job.getDisposalRequest().getItems() != null && !job.getDisposalRequest().getItems().isEmpty())
                ? job.getDisposalRequest().getItems().get(0)
                : null;
        if (item == null) {
            throw new IllegalStateException("Disposal request has no associated e-waste item");
        }

        MarketplaceListing listing = new MarketplaceListing();
        listing.setDisposalRequest(job.getDisposalRequest());
        listing.setEwasteItem(item);
        listing.setQualityCheck(qc);
        listing.setRestorationJob(job);
        listing.setRecyclingCenter(job.getDisposalRequest().getCenter());

        listing.setTitle(dto.getTitle());
        listing.setDescription(dto.getDescription());
        listing.setCategory(item.getCategory());
        listing.setBrand(item.getBrand());
        listing.setModel(item.getModelName());
        listing.setCosmeticGrade(qc.getCosmeticGrade());

        listing.setConditionSummary(dto.getConditionSummary());
        listing.setTechnicalSummary(dto.getTechnicalSummary());
        listing.setWorkPerformedSummary(job.getWorkPerformed() != null ? job.getWorkPerformed() : job.getTechnicianNotes());
        listing.setPartsReplacedSummary(job.getPartsReplaced());

        listing.setSellingPrice(dto.getSellingPrice());
        listing.setOriginalReferencePrice(dto.getOriginalReferencePrice());
        listing.setWarrantyDays(dto.getWarrantyDays() != null ? dto.getWarrantyDays() : 0);

        listing.setStockStatus(MarketplaceStockStatus.AVAILABLE);
        listing.setListingStatus(MarketplaceListingStatus.DRAFT);

        if (dto.getImageUrls() != null && !dto.getImageUrls().isEmpty()) {
            for (int i = 0; i < dto.getImageUrls().size(); i++) {
                String url = dto.getImageUrls().get(i);
                listing.addImage(new MarketplaceListingImage(listing, url, i, i == 0));
            }
        }

        MarketplaceListing saved = marketplaceListingRepository.save(listing);
        return mapToDetailDTO(saved);
    }

    /**
     * Updates an existing draft or rejected listing.
     */
    @Transactional
    public ListingDetailDTO updateDraft(Long listingId, UpdateListingDraftDTO dto, User currentUser) {
        MarketplaceListing listing = getListingAndValidateAuthority(listingId, currentUser);

        if (listing.getListingStatus() != MarketplaceListingStatus.DRAFT
                && listing.getListingStatus() != MarketplaceListingStatus.REJECTED) {
            throw new IllegalStateException("Only DRAFT or REJECTED listings can be modified. Current status: " + listing.getListingStatus());
        }

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            listing.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            listing.setDescription(dto.getDescription());
        }
        if (dto.getSellingPrice() != null) {
            if (dto.getSellingPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Selling price must be greater than zero");
            }
            listing.setSellingPrice(dto.getSellingPrice());
        }
        if (dto.getOriginalReferencePrice() != null) {
            listing.setOriginalReferencePrice(dto.getOriginalReferencePrice());
        }
        if (dto.getWarrantyDays() != null) {
            listing.setWarrantyDays(dto.getWarrantyDays());
        }
        if (dto.getConditionSummary() != null) {
            listing.setConditionSummary(dto.getConditionSummary());
        }
        if (dto.getTechnicalSummary() != null) {
            listing.setTechnicalSummary(dto.getTechnicalSummary());
        }

        if (dto.getImageUrls() != null) {
            listing.getImages().clear();
            for (int i = 0; i < dto.getImageUrls().size(); i++) {
                String url = dto.getImageUrls().get(i);
                listing.addImage(new MarketplaceListingImage(listing, url, i, i == 0));
            }
        }

        MarketplaceListing saved = marketplaceListingRepository.save(listing);
        return mapToDetailDTO(saved);
    }

    /**
     * Submits a draft listing for Admin approval.
     */
    @Transactional
    public ListingDetailDTO submitForApproval(Long listingId, User currentUser) {
        MarketplaceListing listing = getListingAndValidateAuthority(listingId, currentUser);

        if (listing.getListingStatus() != MarketplaceListingStatus.DRAFT
                && listing.getListingStatus() != MarketplaceListingStatus.REJECTED) {
            throw new IllegalStateException("Only DRAFT or REJECTED listings can be submitted for approval");
        }

        if (listing.getSellingPrice() == null || listing.getSellingPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Selling price must be greater than zero before submitting");
        }

        listing.setListingStatus(MarketplaceListingStatus.PENDING_APPROVAL);
        MarketplaceListing saved = marketplaceListingRepository.save(listing);
        return mapToDetailDTO(saved);
    }

    /**
     * Admin review: Approve and publish, or reject with mandatory reason.
     */
    @Transactional
    public ListingDetailDTO reviewListing(Long listingId, ListingApprovalDTO dto, User adminUser) {
        if (adminUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only ADMIN users can approve or reject marketplace listings");
        }

        MarketplaceListing listing = marketplaceListingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Marketplace listing not found with ID: " + listingId));

        if (listing.getListingStatus() != MarketplaceListingStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Listing must be in PENDING_APPROVAL status to review. Current status: " + listing.getListingStatus());
        }

        if (Boolean.TRUE.equals(dto.getApproved())) {
            if (dto.getAdjustedSellingPrice() != null) {
                if (dto.getAdjustedSellingPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new IllegalArgumentException("Adjusted selling price must be greater than zero");
                }
                listing.setSellingPrice(dto.getAdjustedSellingPrice());
            }

            listing.setListingStatus(MarketplaceListingStatus.PUBLISHED);
            listing.setStockStatus(MarketplaceStockStatus.AVAILABLE);
            listing.setApprovedBy(adminUser);
            listing.setApprovedAt(LocalDateTime.now());
            listing.setPublishedAt(LocalDateTime.now());
            listing.setRejectedBy(null);
            listing.setRejectedAt(null);
            listing.setRejectionReason(null);
        } else {
            if (dto.getRejectionReason() == null || dto.getRejectionReason().isBlank()) {
                throw new IllegalArgumentException("Rejection reason is mandatory when rejecting a listing");
            }
            listing.setListingStatus(MarketplaceListingStatus.REJECTED);
            listing.setRejectedBy(adminUser);
            listing.setRejectedAt(LocalDateTime.now());
            listing.setRejectionReason(dto.getRejectionReason());
        }

        MarketplaceListing saved = marketplaceListingRepository.save(listing);
        return mapToDetailDTO(saved);
    }

    /**
     * Withdraws a listing from the marketplace.
     */
    @Transactional
    public ListingDetailDTO withdrawListing(Long listingId, User currentUser) {
        MarketplaceListing listing = getListingAndValidateAuthority(listingId, currentUser);

        if (listing.getStockStatus() == MarketplaceStockStatus.SOLD) {
            throw new IllegalStateException("Cannot withdraw a listing that has already been SOLD");
        }

        listing.setListingStatus(MarketplaceListingStatus.WITHDRAWN);
        MarketplaceListing saved = marketplaceListingRepository.save(listing);
        return mapToDetailDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<ListingSummaryDTO> getMyCenterListings(User currentUser, MarketplaceListingStatus status) {
        Long userCenterId = resolveUserCenterId(currentUser);
        List<MarketplaceListing> listings;

        if (currentUser.getRole() == UserRole.ADMIN) {
            if (status != null) {
                listings = marketplaceListingRepository.findByListingStatus(status);
            } else {
                listings = marketplaceListingRepository.findAll();
            }
        } else {
            if (userCenterId == null) {
                return List.of();
            }
            if (status != null) {
                listings = marketplaceListingRepository.findByRecyclingCenterIdAndListingStatus(userCenterId, status);
            } else {
                listings = marketplaceListingRepository.findByRecyclingCenterId(userCenterId);
            }
        }

        return listings.stream().map(this::mapToSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ListingSummaryDTO> getAdminListings(MarketplaceListingStatus status) {
        List<MarketplaceListing> listings;
        if (status != null) {
            listings = marketplaceListingRepository.findByListingStatus(status);
        } else {
            listings = marketplaceListingRepository.findAll();
        }
        return listings.stream().map(this::mapToSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ListingDetailDTO getListingDetailForManagement(Long listingId, User currentUser) {
        MarketplaceListing listing = getListingAndValidateAuthority(listingId, currentUser);
        return mapToDetailDTO(listing);
    }

    // =========================================================================
    // HELPER & MAPPING METHODS
    // =========================================================================

    private MarketplaceListing getListingAndValidateAuthority(Long listingId, User currentUser) {
        MarketplaceListing listing = marketplaceListingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Marketplace listing not found with ID: " + listingId));

        if (currentUser.getRole() == UserRole.ADMIN) {
            return listing;
        }

        if (currentUser.getRole() != UserRole.RECYCLER) {
            throw new AccessDeniedException("Access denied to marketplace management");
        }

        Long userCenterId = resolveUserCenterId(currentUser);
        if (userCenterId == null || !userCenterId.equals(listing.getRecyclingCenter().getId())) {
            throw new AccessDeniedException("Access denied: Listing does not belong to your assigned recycling facility");
        }

        return listing;
    }

    private Long resolveUserCenterId(User user) {
        if (user.getRole() != UserRole.RECYCLER) {
            return null;
        }
        return recyclerRepository.findByUserId(user.getId())
                .filter(r -> r.getCenter() != null)
                .map(r -> r.getCenter().getId())
                .orElse(null);
    }

    public MarketplaceCandidateDTO mapToCandidateDTO(QualityCheck qc) {
        MarketplaceCandidateDTO dto = new MarketplaceCandidateDTO();
        dto.setQualityCheckId(qc.getId());
        dto.setJobId(qc.getRestorationJob().getId());
        dto.setRequestId(qc.getRestorationJob().getDisposalRequest().getId());

        List<EWasteItem> items = qc.getRestorationJob().getDisposalRequest().getItems();
        if (items != null && !items.isEmpty()) {
            EWasteItem item = items.get(0);
            dto.setItemId(item.getId());
            dto.setCategory(item.getCategory());
            dto.setBrand(item.getBrand());
            dto.setModel(item.getModelName());
        }

        if (qc.getRestorationJob().getDisposalRequest().getCenter() != null) {
            dto.setCenterId(qc.getRestorationJob().getDisposalRequest().getCenter().getId());
            dto.setCenterName(qc.getRestorationJob().getDisposalRequest().getCenter().getName());
        }

        dto.setCosmeticGrade(qc.getCosmeticGrade());
        dto.setTechnicianNotes(qc.getQualityNotes());
        dto.setPartsReplaced(qc.getRestorationJob().getPartsReplaced());
        dto.setQcCompletedAt(qc.getCheckedAt());
        return dto;
    }

    public ListingSummaryDTO mapToSummaryDTO(MarketplaceListing listing) {
        ListingSummaryDTO dto = new ListingSummaryDTO();
        dto.setId(listing.getId());
        dto.setTitle(listing.getTitle());
        dto.setCategory(listing.getCategory());
        dto.setBrand(listing.getBrand());
        dto.setModel(listing.getModel());
        dto.setCosmeticGrade(listing.getCosmeticGrade());
        dto.setSellingPrice(listing.getSellingPrice());
        dto.setOriginalReferencePrice(listing.getOriginalReferencePrice());
        dto.setWarrantyDays(listing.getWarrantyDays());
        dto.setStockStatus(listing.getStockStatus());
        dto.setListingStatus(listing.getListingStatus());
        dto.setCenterId(listing.getRecyclingCenter().getId());
        dto.setCenterName(listing.getRecyclingCenter().getName());
        dto.setCenterCity(listing.getRecyclingCenter().getCity());
        dto.setPublishedAt(listing.getPublishedAt());

        if (listing.getImages() != null && !listing.getImages().isEmpty()) {
            dto.setPrimaryImageUrl(listing.getImages().get(0).getImageUrl());
        }
        return dto;
    }

    public ListingDetailDTO mapToDetailDTO(MarketplaceListing listing) {
        ListingDetailDTO dto = new ListingDetailDTO();
        dto.setId(listing.getId());
        dto.setTitle(listing.getTitle());
        dto.setDescription(listing.getDescription());
        dto.setCategory(listing.getCategory());
        dto.setBrand(listing.getBrand());
        dto.setModel(listing.getModel());
        dto.setCosmeticGrade(listing.getCosmeticGrade());
        dto.setConditionSummary(listing.getConditionSummary());
        dto.setTechnicalSummary(listing.getTechnicalSummary());
        dto.setWorkPerformedSummary(listing.getWorkPerformedSummary());
        dto.setPartsReplacedSummary(listing.getPartsReplacedSummary());
        dto.setSellingPrice(listing.getSellingPrice());
        dto.setOriginalReferencePrice(listing.getOriginalReferencePrice());
        dto.setWarrantyDays(listing.getWarrantyDays());
        dto.setStockStatus(listing.getStockStatus());
        dto.setListingStatus(listing.getListingStatus());
        dto.setCenterId(listing.getRecyclingCenter().getId());
        dto.setCenterName(listing.getRecyclingCenter().getName());
        dto.setCenterCity(listing.getRecyclingCenter().getCity());
        dto.setCenterState(listing.getRecyclingCenter().getState());
        dto.setPublishedAt(listing.getPublishedAt());

        if (listing.getImages() != null) {
            List<ListingImageDTO> imgDtos = listing.getImages().stream()
                    .map(img -> new ListingImageDTO(img.getId(), img.getImageUrl(), img.getSortOrder(), img.getIsPrimary()))
                    .collect(Collectors.toList());
            dto.setImages(imgDtos);
        }

        dto.setDeviceJourney(buildDeviceJourney(listing));
        return dto;
    }

    public DeviceJourneyDTO buildDeviceJourney(MarketplaceListing listing) {
        DeviceJourneyDTO journey = new DeviceJourneyDTO();
        journey.setSerialOrTrackingReference("CR-" + listing.getDisposalRequest().getId() + "-ITM" + listing.getEwasteItem().getId());
        journey.setCategory(listing.getCategory());
        journey.setBrand(listing.getBrand());
        journey.setModel(listing.getModel());
        journey.setCosmeticGrade(listing.getCosmeticGrade());

        String centerName = listing.getRecyclingCenter().getName();

        // 1. Citizen Collection / Inward
        journey.addEvent(new DeviceJourneyEventDTO(
                "INTAKE",
                "Certified Circular Drop-Off / Intake",
                "Device received via verified e-waste recovery channel and booked into facility inventory.",
                centerName,
                listing.getDisposalRequest().getCreatedAt()
        ));

        // 2. Physical Inspection
        if (listing.getRestorationJob() != null) {
            journey.addEvent(new DeviceJourneyEventDTO(
                    "DIAGNOSTIC",
                    "Hardware Diagnostic & Assessment",
                    "Certified technician performed comprehensive physical assessment and designated device for restorative circular pathway.",
                    centerName,
                    listing.getRestorationJob().getCreatedAt()
            ));

            // 3. Restoration
            LocalDateTime restorationTime = listing.getRestorationJob().getWorkCompletedAt() != null
                    ? listing.getRestorationJob().getWorkCompletedAt()
                    : listing.getRestorationJob().getUpdatedAt();
            journey.addEvent(new DeviceJourneyEventDTO(
                    "RESTORATION",
                    "Precision Restoration & Rework",
                    "Restoration completed. Parts replaced: "
                            + (listing.getPartsReplacedSummary() != null ? listing.getPartsReplacedSummary() : "None")
                            + ". Work summary: " + (listing.getWorkPerformedSummary() != null ? listing.getWorkPerformedSummary() : "Standard restoration"),
                    centerName,
                    restorationTime
            ));
        }

        // 4. Quality Certification
        if (listing.getQualityCheck() != null) {
            journey.addEvent(new DeviceJourneyEventDTO(
                    "QUALITY_CERTIFICATION",
                    "Multi-Point Quality & Safety Verification",
                    "Full functional, display, battery, and electrical safety testing passed. Certified cosmetic grade: "
                            + listing.getCosmeticGrade(),
                    centerName,
                    listing.getQualityCheck().getCheckedAt()
            ));
        }

        // 5. Marketplace Listing
        if (listing.getPublishedAt() != null) {
            journey.addEvent(new DeviceJourneyEventDTO(
                    "MARKETPLACE_LISTING",
                    "Commercial Second-Life Listing",
                    "Admin reviewed and certified listing for public circular reuse purchase.",
                    centerName,
                    listing.getPublishedAt()
            ));
        }

        return journey;
    }
}
