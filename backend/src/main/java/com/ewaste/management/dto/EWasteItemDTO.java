package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import java.math.BigDecimal;

public class EWasteItemDTO {
    private Long id;
    private Long disposalRequestId;
    private EWasteCategory category;
    private String deviceName;
    private String brand;
    private String modelName;
    private String serialNumber;
    private Integer approxAgeYears;
    private DeviceCondition condition;
    private String workingStatus;
    private BigDecimal weightKg;
    private Integer quantity;
    private String description;
    private String imageUrl;
    private Integer estimatedRewardPoints;

    public EWasteItemDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDisposalRequestId() { return disposalRequestId; }
    public void setDisposalRequestId(Long disposalRequestId) { this.disposalRequestId = disposalRequestId; }

    public EWasteCategory getCategory() { return category; }
    public void setCategory(EWasteCategory category) { this.category = category; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public Integer getApproxAgeYears() { return approxAgeYears; }
    public void setApproxAgeYears(Integer approxAgeYears) { this.approxAgeYears = approxAgeYears; }

    public DeviceCondition getCondition() { return condition; }
    public void setCondition(DeviceCondition condition) { this.condition = condition; }

    public String getWorkingStatus() { return workingStatus; }
    public void setWorkingStatus(String workingStatus) { this.workingStatus = workingStatus; }

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Integer getEstimatedRewardPoints() { return estimatedRewardPoints; }
    public void setEstimatedRewardPoints(Integer estimatedRewardPoints) { this.estimatedRewardPoints = estimatedRewardPoints; }
}
