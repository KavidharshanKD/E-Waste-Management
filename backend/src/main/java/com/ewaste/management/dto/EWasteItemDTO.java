package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import java.math.BigDecimal;

public class EWasteItemDTO {
    private Long id;
    private Long disposalRequestId;
    private EWasteCategory category;
    private String brand;
    private String modelName;
    private String serialNumber;
    private DeviceCondition condition;
    private BigDecimal weightKg;
    private Integer quantity;
    private String description;
    private Integer estimatedRewardPoints;

    public EWasteItemDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDisposalRequestId() { return disposalRequestId; }
    public void setDisposalRequestId(Long disposalRequestId) { this.disposalRequestId = disposalRequestId; }

    public EWasteCategory getCategory() { return category; }
    public void setCategory(EWasteCategory category) { this.category = category; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public DeviceCondition getCondition() { return condition; }
    public void setCondition(DeviceCondition condition) { this.condition = condition; }

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getEstimatedRewardPoints() { return estimatedRewardPoints; }
    public void setEstimatedRewardPoints(Integer estimatedRewardPoints) { this.estimatedRewardPoints = estimatedRewardPoints; }
}
