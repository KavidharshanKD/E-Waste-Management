package com.ewaste.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Entity
@Table(name = "marketplace_order_items")
public class MarketplaceOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private MarketplaceOrder order;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private MarketplaceListing listing;

    @NotNull
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    @Column(name = "price_at_purchase", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtPurchase;

    @NotBlank
    @Column(name = "title_snapshot", nullable = false, length = 200)
    private String titleSnapshot;

    @Column(name = "warranty_days_snapshot")
    private Integer warrantyDaysSnapshot = 0;

    public MarketplaceOrderItem() {
    }

    public MarketplaceOrderItem(MarketplaceOrder order, MarketplaceListing listing, BigDecimal priceAtPurchase, String titleSnapshot, Integer warrantyDaysSnapshot) {
        this.order = order;
        this.listing = listing;
        this.priceAtPurchase = priceAtPurchase;
        this.titleSnapshot = titleSnapshot;
        this.warrantyDaysSnapshot = warrantyDaysSnapshot != null ? warrantyDaysSnapshot : 0;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MarketplaceOrder getOrder() {
        return order;
    }

    public void setOrder(MarketplaceOrder order) {
        this.order = order;
    }

    public MarketplaceListing getListing() {
        return listing;
    }

    public void setListing(MarketplaceListing listing) {
        this.listing = listing;
    }

    public BigDecimal getPriceAtPurchase() {
        return priceAtPurchase;
    }

    public void setPriceAtPurchase(BigDecimal priceAtPurchase) {
        this.priceAtPurchase = priceAtPurchase;
    }

    public String getTitleSnapshot() {
        return titleSnapshot;
    }

    public void setTitleSnapshot(String titleSnapshot) {
        this.titleSnapshot = titleSnapshot;
    }

    public Integer getWarrantyDaysSnapshot() {
        return warrantyDaysSnapshot;
    }

    public void setWarrantyDaysSnapshot(Integer warrantyDaysSnapshot) {
        this.warrantyDaysSnapshot = warrantyDaysSnapshot;
    }
}
