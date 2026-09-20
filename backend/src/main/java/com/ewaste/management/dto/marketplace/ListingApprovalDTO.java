package com.ewaste.management.dto.marketplace;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ListingApprovalDTO {

    @NotNull(message = "Approval decision is required")
    private Boolean approved;

    private String rejectionReason;

    @DecimalMin(value = "0.01", message = "Adjusted selling price must be greater than zero")
    private BigDecimal adjustedSellingPrice;

    public ListingApprovalDTO() {
    }

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public BigDecimal getAdjustedSellingPrice() {
        return adjustedSellingPrice;
    }

    public void setAdjustedSellingPrice(BigDecimal adjustedSellingPrice) {
        this.adjustedSellingPrice = adjustedSellingPrice;
    }
}
