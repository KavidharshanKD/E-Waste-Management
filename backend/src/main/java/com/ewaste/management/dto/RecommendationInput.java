package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;

public class RecommendationInput {
    private EWasteCategory category;
    private Integer deviceAgeYears;
    private DeviceCondition condition;
    private String workingStatus;
    private String damageCondition;
    private String batteryCondition;

    public RecommendationInput() {}

    public RecommendationInput(EWasteCategory category, Integer deviceAgeYears, DeviceCondition condition, String workingStatus, String damageCondition, String batteryCondition) {
        this.category = category;
        this.deviceAgeYears = deviceAgeYears;
        this.condition = condition;
        this.workingStatus = workingStatus;
        this.damageCondition = damageCondition;
        this.batteryCondition = batteryCondition;
    }

    public EWasteCategory getCategory() { return category; }
    public void setCategory(EWasteCategory category) { this.category = category; }

    public Integer getDeviceAgeYears() { return deviceAgeYears; }
    public void setDeviceAgeYears(Integer deviceAgeYears) { this.deviceAgeYears = deviceAgeYears; }

    public DeviceCondition getCondition() { return condition; }
    public void setCondition(DeviceCondition condition) { this.condition = condition; }

    public String getWorkingStatus() { return workingStatus; }
    public void setWorkingStatus(String workingStatus) { this.workingStatus = workingStatus; }

    public String getDamageCondition() { return damageCondition; }
    public void setDamageCondition(String damageCondition) { this.damageCondition = damageCondition; }

    public String getBatteryCondition() { return batteryCondition; }
    public void setBatteryCondition(String batteryCondition) { this.batteryCondition = batteryCondition; }
}
