package com.ewaste.management.dto.marketplace;

import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.MarketplaceListingStatus;
import com.ewaste.management.model.enums.MarketplaceStockStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ListingDetailDTO {
    private Long id;
    private String title;
    private String description;
    private EWasteCategory category;
    private String brand;
    private String model;
    private CosmeticGrade cosmeticGrade;
    private String conditionSummary;
    private String technicalSummary;
    private String workPerformedSummary;
    private String partsReplacedSummary;
    private BigDecimal sellingPrice;
    private BigDecimal originalReferencePrice;
    private Integer warrantyDays;
    private MarketplaceStockStatus stockStatus;
    private MarketplaceListingStatus listingStatus;
    private Long centerId;
    private String centerName;
    private String centerCity;
    private String centerState;
    private LocalDateTime publishedAt;
    private List<ListingImageDTO> images = new ArrayList<>();
    private DeviceJourneyDTO deviceJourney;

    public ListingDetailDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public EWasteCategory getCategory() {
        return category;
    }

    public void setCategory(EWasteCategory category) {
        this.category = category;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public CosmeticGrade getCosmeticGrade() {
        return cosmeticGrade;
    }

    public void setCosmeticGrade(CosmeticGrade cosmeticGrade) {
        this.cosmeticGrade = cosmeticGrade;
    }

    public String getConditionSummary() {
        return conditionSummary;
    }

    public void setConditionSummary(String conditionSummary) {
        this.conditionSummary = conditionSummary;
    }

    public String getTechnicalSummary() {
        return technicalSummary;
    }

    public void setTechnicalSummary(String technicalSummary) {
        this.technicalSummary = technicalSummary;
    }

    public String getWorkPerformedSummary() {
        return workPerformedSummary;
    }

    public void setWorkPerformedSummary(String workPerformedSummary) {
        this.workPerformedSummary = workPerformedSummary;
    }

    public String getPartsReplacedSummary() {
        return partsReplacedSummary;
    }

    public void setPartsReplacedSummary(String partsReplacedSummary) {
        this.partsReplacedSummary = partsReplacedSummary;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public BigDecimal getOriginalReferencePrice() {
        return originalReferencePrice;
    }

    public void setOriginalReferencePrice(BigDecimal originalReferencePrice) {
        this.originalReferencePrice = originalReferencePrice;
    }

    public Integer getWarrantyDays() {
        return warrantyDays;
    }

    public void setWarrantyDays(Integer warrantyDays) {
        this.warrantyDays = warrantyDays;
    }

    public MarketplaceStockStatus getStockStatus() {
        return stockStatus;
    }

    public void setStockStatus(MarketplaceStockStatus stockStatus) {
        this.stockStatus = stockStatus;
    }

    public MarketplaceListingStatus getListingStatus() {
        return listingStatus;
    }

    public void setListingStatus(MarketplaceListingStatus listingStatus) {
        this.listingStatus = listingStatus;
    }

    public Long getCenterId() {
        return centerId;
    }

    public void setCenterId(Long centerId) {
        this.centerId = centerId;
    }

    public String getCenterName() {
        return centerName;
    }

    public void setCenterName(String centerName) {
        this.centerName = centerName;
    }

    public String getCenterCity() {
        return centerCity;
    }

    public void setCenterCity(String centerCity) {
        this.centerCity = centerCity;
    }

    public String getCenterState() {
        return centerState;
    }

    public void setCenterState(String centerState) {
        this.centerState = centerState;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public List<ListingImageDTO> getImages() {
        return images;
    }

    public void setImages(List<ListingImageDTO> images) {
        this.images = images;
    }

    public DeviceJourneyDTO getDeviceJourney() {
        return deviceJourney;
    }

    public void setDeviceJourney(DeviceJourneyDTO deviceJourney) {
        this.deviceJourney = deviceJourney;
    }
}
