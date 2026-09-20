package com.ewaste.management.dto.marketplace;

import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.MarketplaceStockStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CartItemDTO {
    private Long id;
    private Long listingId;
    private String title;
    private EWasteCategory category;
    private String brand;
    private String model;
    private CosmeticGrade cosmeticGrade;
    private BigDecimal price;
    private String imageUrl;
    private MarketplaceStockStatus stockStatus;
    private boolean available;
    private LocalDateTime addedAt;

    public CartItemDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getListingId() {
        return listingId;
    }

    public void setListingId(Long listingId) {
        this.listingId = listingId;
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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public MarketplaceStockStatus getStockStatus() {
        return stockStatus;
    }

    public void setStockStatus(MarketplaceStockStatus stockStatus) {
        this.stockStatus = stockStatus;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public LocalDateTime getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(LocalDateTime addedAt) {
        this.addedAt = addedAt;
    }
}
