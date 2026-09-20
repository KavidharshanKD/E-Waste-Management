package com.ewaste.management.dto.marketplace;

import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.EWasteCategory;

import java.time.LocalDateTime;

public class MarketplaceCandidateDTO {
    private Long qualityCheckId;
    private Long jobId;
    private Long requestId;
    private Long itemId;
    private Long centerId;
    private String centerName;
    private EWasteCategory category;
    private String brand;
    private String model;
    private CosmeticGrade cosmeticGrade;
    private String technicianNotes;
    private String partsReplaced;
    private LocalDateTime qcCompletedAt;

    public MarketplaceCandidateDTO() {
    }

    public Long getQualityCheckId() {
        return qualityCheckId;
    }

    public void setQualityCheckId(Long qualityCheckId) {
        this.qualityCheckId = qualityCheckId;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
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

    public String getTechnicianNotes() {
        return technicianNotes;
    }

    public void setTechnicianNotes(String technicianNotes) {
        this.technicianNotes = technicianNotes;
    }

    public String getPartsReplaced() {
        return partsReplaced;
    }

    public void setPartsReplaced(String partsReplaced) {
        this.partsReplaced = partsReplaced;
    }

    public LocalDateTime getQcCompletedAt() {
        return qcCompletedAt;
    }

    public void setQcCompletedAt(LocalDateTime qcCompletedAt) {
        this.qcCompletedAt = qcCompletedAt;
    }
}
