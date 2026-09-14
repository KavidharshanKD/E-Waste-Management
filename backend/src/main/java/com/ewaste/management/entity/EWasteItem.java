package com.ewaste.management.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.UserIntention;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Entity
@Table(name = "ewaste_items")
public class EWasteItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    @JsonBackReference
    private DisposalRequest disposalRequest;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private EWasteCategory category;

    @Column(name = "device_name", length = 150)
    private String deviceName;

    @Column(name = "brand", length = 100)
    private String brand;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "approx_age_years")
    private Integer approxAgeYears;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "condition", nullable = false, length = 30)
    private DeviceCondition condition;

    @Column(name = "working_status", length = 50)
    private String workingStatus;

    @Column(name = "damage_condition", length = 50)
    private String damageCondition;

    @Column(name = "battery_condition", length = 50)
    private String batteryCondition;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_intention", length = 30)
    private UserIntention userIntention = UserIntention.UNSURE;

    @Column(name = "powers_on")
    private Boolean powersOn;

    @Column(name = "screen_condition", length = 50)
    private String screenCondition;

    @Column(name = "battery_swollen")
    private Boolean batterySwollen = false;

    @Column(name = "battery_leaking")
    private Boolean batteryLeaking = false;

    @Column(name = "overheating_evidence")
    private Boolean overheatingEvidence = false;

    @Column(name = "severe_physical_damage")
    private Boolean severePhysicalDamage = false;

    @Column(name = "functional_issues", length = 500)
    private String functionalIssues;

    @Column(name = "weight_kg", precision = 8, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "estimated_reward_points")
    private Integer estimatedRewardPoints = 0;

    public EWasteItem() {}

    public DisposalRequest getDisposalRequest() {
        return disposalRequest;
    }

    public void setDisposalRequest(DisposalRequest disposalRequest) {
        this.disposalRequest = disposalRequest;
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

    public String getModelName() {
        return modelName;
    }

    public void setModelName(String modelName) {
        this.modelName = modelName;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public DeviceCondition getCondition() {
        return condition;
    }

    public void setCondition(DeviceCondition condition) {
        this.condition = condition;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public Integer getApproxAgeYears() {
        return approxAgeYears;
    }

    public void setApproxAgeYears(Integer approxAgeYears) {
        this.approxAgeYears = approxAgeYears;
    }

    public String getWorkingStatus() {
        return workingStatus;
    }

    public void setWorkingStatus(String workingStatus) {
        this.workingStatus = workingStatus;
    }

    public String getDamageCondition() {
        return damageCondition;
    }

    public void setDamageCondition(String damageCondition) {
        this.damageCondition = damageCondition;
    }

    public String getBatteryCondition() {
        return batteryCondition;
    }

    public void setBatteryCondition(String batteryCondition) {
        this.batteryCondition = batteryCondition;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getEstimatedRewardPoints() {
        return estimatedRewardPoints;
    }

    public void setEstimatedRewardPoints(Integer estimatedRewardPoints) {
        this.estimatedRewardPoints = estimatedRewardPoints;
    }

    public UserIntention getUserIntention() {
        return userIntention;
    }

    public void setUserIntention(UserIntention userIntention) {
        this.userIntention = userIntention;
    }

    public Boolean getPowersOn() {
        return powersOn;
    }

    public void setPowersOn(Boolean powersOn) {
        this.powersOn = powersOn;
    }

    public String getScreenCondition() {
        return screenCondition;
    }

    public void setScreenCondition(String screenCondition) {
        this.screenCondition = screenCondition;
    }

    public Boolean getBatterySwollen() {
        return batterySwollen;
    }

    public void setBatterySwollen(Boolean batterySwollen) {
        this.batterySwollen = batterySwollen;
    }

    public Boolean getBatteryLeaking() {
        return batteryLeaking;
    }

    public void setBatteryLeaking(Boolean batteryLeaking) {
        this.batteryLeaking = batteryLeaking;
    }

    public Boolean getOverheatingEvidence() {
        return overheatingEvidence;
    }

    public void setOverheatingEvidence(Boolean overheatingEvidence) {
        this.overheatingEvidence = overheatingEvidence;
    }

    public Boolean getSeverePhysicalDamage() {
        return severePhysicalDamage;
    }

    public void setSeverePhysicalDamage(Boolean severePhysicalDamage) {
        this.severePhysicalDamage = severePhysicalDamage;
    }

    public String getFunctionalIssues() {
        return functionalIssues;
    }

    public void setFunctionalIssues(String functionalIssues) {
        this.functionalIssues = functionalIssues;
    }
}
