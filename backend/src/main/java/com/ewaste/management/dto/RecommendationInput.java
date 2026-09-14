package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.UserIntention;

public class RecommendationInput {
    private EWasteCategory category;
    private Integer deviceAgeYears;
    private DeviceCondition condition;
    private String workingStatus;
    private String damageCondition;
    private String batteryCondition;

    // Module 1: Extended assessment & intention
    private UserIntention userIntention = UserIntention.UNSURE;
    private Boolean powersOn;
    private String screenCondition;
    private Boolean batterySwollen = false;
    private Boolean batteryLeaking = false;
    private Boolean overheatingEvidence = false;
    private Boolean severePhysicalDamage = false;
    private String functionalIssues;

    public RecommendationInput() {}

    // Legacy constructor - preserved for backward compatibility
    public RecommendationInput(EWasteCategory category, Integer deviceAgeYears, DeviceCondition condition, String workingStatus, String damageCondition, String batteryCondition) {
        this.category = category;
        this.deviceAgeYears = deviceAgeYears;
        this.condition = condition;
        this.workingStatus = workingStatus;
        this.damageCondition = damageCondition;
        this.batteryCondition = batteryCondition;
    }

    // Extended constructor
    public RecommendationInput(EWasteCategory category, Integer deviceAgeYears, DeviceCondition condition,
                               String workingStatus, String damageCondition, String batteryCondition,
                               UserIntention userIntention, Boolean powersOn, String screenCondition,
                               Boolean batterySwollen, Boolean batteryLeaking,
                               Boolean overheatingEvidence, Boolean severePhysicalDamage,
                               String functionalIssues) {
        this.category = category;
        this.deviceAgeYears = deviceAgeYears;
        this.condition = condition;
        this.workingStatus = workingStatus;
        this.damageCondition = damageCondition;
        this.batteryCondition = batteryCondition;
        this.userIntention = userIntention != null ? userIntention : UserIntention.UNSURE;
        this.powersOn = powersOn;
        this.screenCondition = screenCondition;
        this.batterySwollen = batterySwollen != null ? batterySwollen : false;
        this.batteryLeaking = batteryLeaking != null ? batteryLeaking : false;
        this.overheatingEvidence = overheatingEvidence != null ? overheatingEvidence : false;
        this.severePhysicalDamage = severePhysicalDamage != null ? severePhysicalDamage : false;
        this.functionalIssues = functionalIssues;
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
