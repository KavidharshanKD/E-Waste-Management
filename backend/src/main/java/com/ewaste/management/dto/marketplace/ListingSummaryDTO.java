package com.ewaste.management.dto.marketplace;

import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.MarketplaceListingStatus;
import com.ewaste.management.model.enums.MarketplaceStockStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ListingSummaryDTO {
    private Long id;
    private String title;
    private EWasteCategory category;
    private String brand;
    private String model;
    private CosmeticGrade cosmeticGrade;
    private BigDecimal sellingPrice;
    private BigDecimal originalReferencePrice;
    private Integer warrantyDays;
    private MarketplaceStockStatus stockStatus;
    private MarketplaceListingStatus listingStatus;
    private String primaryImageUrl;
    private Long centerId;
    private String centerName;
    private String centerCity;
    private LocalDateTime publishedAt;

    public ListingSummaryDTO() {
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

    public String getPrimaryImageUrl() {
        return primaryImageUrl;
    }

    public void setPrimaryImageUrl(String primaryImageUrl) {
        this.primaryImageUrl = primaryImageUrl;
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

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }
}
