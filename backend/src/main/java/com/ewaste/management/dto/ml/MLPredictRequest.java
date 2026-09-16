package com.ewaste.management.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;

public class MLPredictRequest {

    @JsonProperty("category")
    private String category;

    @JsonProperty("approx_age_years")
    private Double approxAgeYears;

    @JsonProperty("condition")
    private String condition;

    @JsonProperty("user_intention")
    private String userIntention;

    @JsonProperty("powers_on")
    private String powersOn;

    @JsonProperty("screen_condition")
    private String screenCondition;

    @JsonProperty("battery_condition")
    private String batteryCondition;

    @JsonProperty("damage_severity")
    private String damageSeverity;

    @JsonProperty("battery_swollen")
    private Boolean batterySwollen;

    @JsonProperty("battery_leaking")
    private Boolean batteryLeaking;

    @JsonProperty("overheating_evidence")
    private Boolean overheatingEvidence;

    @JsonProperty("severe_physical_damage")
    private Boolean severePhysicalDamage;

    public MLPredictRequest() {}

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getApproxAgeYears() {
        return approxAgeYears;
    }

    public void setApproxAgeYears(Double approxAgeYears) {
        this.approxAgeYears = approxAgeYears;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public String getUserIntention() {
        return userIntention;
    }

    public void setUserIntention(String userIntention) {
        this.userIntention = userIntention;
    }

    public String getPowersOn() {
        return powersOn;
    }

    public void setPowersOn(String powersOn) {
        this.powersOn = powersOn;
    }

    public String getScreenCondition() {
        return screenCondition;
    }

    public void setScreenCondition(String screenCondition) {
        this.screenCondition = screenCondition;
    }

    public String getBatteryCondition() {
        return batteryCondition;
    }

    public void setBatteryCondition(String batteryCondition) {
        this.batteryCondition = batteryCondition;
    }

    public String getDamageSeverity() {
        return damageSeverity;
    }

    public void setDamageSeverity(String damageSeverity) {
        this.damageSeverity = damageSeverity;
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
}
