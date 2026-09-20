package com.ewaste.management.dto.marketplace;

import java.math.BigDecimal;

public class OrderItemDTO {
    private Long id;
    private Long listingId;
    private String titleSnapshot;
    private BigDecimal priceAtPurchase;
    private Integer warrantyDaysSnapshot;

    public OrderItemDTO() {
    }

    public OrderItemDTO(Long id, Long listingId, String titleSnapshot, BigDecimal priceAtPurchase, Integer warrantyDaysSnapshot) {
        this.id = id;
        this.listingId = listingId;
        this.titleSnapshot = titleSnapshot;
        this.priceAtPurchase = priceAtPurchase;
        this.warrantyDaysSnapshot = warrantyDaysSnapshot;
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

    public String getTitleSnapshot() {
        return titleSnapshot;
    }

    public void setTitleSnapshot(String titleSnapshot) {
        this.titleSnapshot = titleSnapshot;
    }

    public BigDecimal getPriceAtPurchase() {
        return priceAtPurchase;
    }

    public void setPriceAtPurchase(BigDecimal priceAtPurchase) {
        this.priceAtPurchase = priceAtPurchase;
    }

    public Integer getWarrantyDaysSnapshot() {
        return warrantyDaysSnapshot;
    }

    public void setWarrantyDaysSnapshot(Integer warrantyDaysSnapshot) {
        this.warrantyDaysSnapshot = warrantyDaysSnapshot;
    }
}
