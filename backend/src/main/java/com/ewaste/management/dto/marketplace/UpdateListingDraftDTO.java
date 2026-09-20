package com.ewaste.management.dto.marketplace;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.List;

public class UpdateListingDraftDTO {

    private String title;
    private String description;

    @DecimalMin(value = "0.01", message = "Selling price must be greater than zero")
    private BigDecimal sellingPrice;

    private BigDecimal originalReferencePrice;
    private Integer warrantyDays;
    private String conditionSummary;
    private String technicalSummary;
    private List<String> imageUrls;

    public UpdateListingDraftDTO() {
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

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }
}
