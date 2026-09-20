package com.ewaste.management.entity;

import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.MarketplaceListingStatus;
import com.ewaste.management.model.enums.MarketplaceStockStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "marketplace_listings")
public class MarketplaceListing extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    @JsonIgnore
    private DisposalRequest disposalRequest;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnore
    private EWasteItem ewasteItem;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quality_check_id", nullable = false, unique = true)
    @JsonIgnore
    private QualityCheck qualityCheck;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restoration_job_id", nullable = false)
    @JsonIgnore
    private RestorationJob restorationJob;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "center_id", nullable = false)
    private RecyclingCenter recyclingCenter;

    @NotBlank
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private EWasteCategory category;

    @Column(name = "brand", length = 100)
    private String brand;

    @Column(name = "model", length = 100)
    private String model;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "cosmetic_grade", nullable = false, length = 20)
    private CosmeticGrade cosmeticGrade;

    @Column(name = "condition_summary", columnDefinition = "TEXT")
    private String conditionSummary;

    @Column(name = "technical_summary", columnDefinition = "TEXT")
    private String technicalSummary;

    @Column(name = "work_performed_summary", columnDefinition = "TEXT")
    private String workPerformedSummary;

    @Column(name = "parts_replaced_summary", columnDefinition = "TEXT")
    private String partsReplacedSummary;

    @NotNull
    @DecimalMin(value = "0.01", message = "Selling price must be greater than zero")
    @Column(name = "selling_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal sellingPrice;

    @Column(name = "original_reference_price", precision = 10, scale = 2)
    private BigDecimal originalReferencePrice;

    @Column(name = "warranty_days")
    private Integer warrantyDays = 0;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "stock_status", nullable = false, length = 30)
    private MarketplaceStockStatus stockStatus = MarketplaceStockStatus.AVAILABLE;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "listing_status", nullable = false, length = 30)
    private MarketplaceListingStatus listingStatus = MarketplaceListingStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by_id")
    private User rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "sold_at")
    private LocalDateTime soldAt;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<MarketplaceListingImage> images = new ArrayList<>();

    public MarketplaceListing() {}

    public void addImage(MarketplaceListingImage image) {
        images.add(image);
        image.setListing(this);
    }

    public void removeImage(MarketplaceListingImage image) {
        images.remove(image);
        image.setListing(null);
    }

    // Getters and Setters
    public DisposalRequest getDisposalRequest() { return disposalRequest; }
    public void setDisposalRequest(DisposalRequest disposalRequest) { this.disposalRequest = disposalRequest; }

    public EWasteItem getEwasteItem() { return ewasteItem; }
    public void setEwasteItem(EWasteItem ewasteItem) { this.ewasteItem = ewasteItem; }

    public QualityCheck getQualityCheck() { return qualityCheck; }
    public void setQualityCheck(QualityCheck qualityCheck) { this.qualityCheck = qualityCheck; }

    public RestorationJob getRestorationJob() { return restorationJob; }
    public void setRestorationJob(RestorationJob restorationJob) { this.restorationJob = restorationJob; }

    public RecyclingCenter getRecyclingCenter() { return recyclingCenter; }
    public void setRecyclingCenter(RecyclingCenter recyclingCenter) { this.recyclingCenter = recyclingCenter; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public EWasteCategory getCategory() { return category; }
    public void setCategory(EWasteCategory category) { this.category = category; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public CosmeticGrade getCosmeticGrade() { return cosmeticGrade; }
    public void setCosmeticGrade(CosmeticGrade cosmeticGrade) { this.cosmeticGrade = cosmeticGrade; }

    public String getConditionSummary() { return conditionSummary; }
    public void setConditionSummary(String conditionSummary) { this.conditionSummary = conditionSummary; }

    public String getTechnicalSummary() { return technicalSummary; }
    public void setTechnicalSummary(String technicalSummary) { this.technicalSummary = technicalSummary; }

    public String getWorkPerformedSummary() { return workPerformedSummary; }
    public void setWorkPerformedSummary(String workPerformedSummary) { this.workPerformedSummary = workPerformedSummary; }

    public String getPartsReplacedSummary() { return partsReplacedSummary; }
    public void setPartsReplacedSummary(String partsReplacedSummary) { this.partsReplacedSummary = partsReplacedSummary; }

    public BigDecimal getSellingPrice() { return sellingPrice; }
    public void setSellingPrice(BigDecimal sellingPrice) { this.sellingPrice = sellingPrice; }

    public BigDecimal getOriginalReferencePrice() { return originalReferencePrice; }
    public void setOriginalReferencePrice(BigDecimal originalReferencePrice) { this.originalReferencePrice = originalReferencePrice; }

    public Integer getWarrantyDays() { return warrantyDays; }
    public void setWarrantyDays(Integer warrantyDays) { this.warrantyDays = warrantyDays; }

    public MarketplaceStockStatus getStockStatus() { return stockStatus; }
    public void setStockStatus(MarketplaceStockStatus stockStatus) { this.stockStatus = stockStatus; }

    public MarketplaceListingStatus getListingStatus() { return listingStatus; }
    public void setListingStatus(MarketplaceListingStatus listingStatus) { this.listingStatus = listingStatus; }

    public User getApprovedBy() { return approvedBy; }
    public void setApprovedBy(User approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public User getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(User rejectedBy) { this.rejectedBy = rejectedBy; }

    public LocalDateTime getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(LocalDateTime rejectedAt) { this.rejectedAt = rejectedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }

    public LocalDateTime getSoldAt() { return soldAt; }
    public void setSoldAt(LocalDateTime soldAt) { this.soldAt = soldAt; }

    public List<MarketplaceListingImage> getImages() { return images; }
    public void setImages(List<MarketplaceListingImage> images) { this.images = images; }
}
