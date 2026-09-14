package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.UserIntention;
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
    private String damageCondition;
    private String batteryCondition;
    private BigDecimal weightKg;
    private Integer quantity;
    private String description;
    private String imageUrl;
    private Integer estimatedRewardPoints;

    // Module 1: Extended assessment & intention
    private UserIntention userIntention;
    private Boolean powersOn;
    private String screenCondition;
    private Boolean batterySwollen;
    private Boolean batteryLeaking;
    private Boolean overheatingEvidence;
    private Boolean severePhysicalDamage;
    private String functionalIssues;

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

    public String getDamageCondition() { return damageCondition; }
    public void setDamageCondition(String damageCondition) { this.damageCondition = damageCondition; }

    public String getBatteryCondition() { return batteryCondition; }
    public void setBatteryCondition(String batteryCondition) { this.batteryCondition = batteryCondition; }

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

    public UserIntention getUserIntention() { return userIntention; }
    public void setUserIntention(UserIntention userIntention) { this.userIntention = userIntention; }

    public Boolean getPowersOn() { return powersOn; }
    public void setPowersOn(Boolean powersOn) { this.powersOn = powersOn; }

    public String getScreenCondition() { return screenCondition; }
    public void setScreenCondition(String screenCondition) { this.screenCondition = screenCondition; }

    public Boolean getBatterySwollen() { return batterySwollen; }
    public void setBatterySwollen(Boolean batterySwollen) { this.batterySwollen = batterySwollen; }

    public Boolean getBatteryLeaking() { return batteryLeaking; }
    public void setBatteryLeaking(Boolean batteryLeaking) { this.batteryLeaking = batteryLeaking; }

    public Boolean getOverheatingEvidence() { return overheatingEvidence; }
    public void setOverheatingEvidence(Boolean overheatingEvidence) { this.overheatingEvidence = overheatingEvidence; }

    public Boolean getSeverePhysicalDamage() { return severePhysicalDamage; }
    public void setSeverePhysicalDamage(Boolean severePhysicalDamage) { this.severePhysicalDamage = severePhysicalDamage; }

    public String getFunctionalIssues() { return functionalIssues; }
    public void setFunctionalIssues(String functionalIssues) { this.functionalIssues = functionalIssues; }
}
