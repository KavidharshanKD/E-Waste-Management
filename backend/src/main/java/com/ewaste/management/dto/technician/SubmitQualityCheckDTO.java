package com.ewaste.management.dto.technician;

import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.QualityCheckResult;
import jakarta.validation.constraints.NotNull;

public class SubmitQualityCheckDTO {

    @NotNull(message = "Functional test result is required")
    private Boolean functionalTestPassed;

    @NotNull(message = "Power test result is required")
    private Boolean powerTestPassed;

    private Boolean displayTestPassed;
    private Boolean batteryTestPassed;

    @NotNull(message = "Safety test result is required")
    private Boolean safetyTestPassed;

    private CosmeticGrade cosmeticGrade;

    @NotNull(message = "Overall quality result is required")
    private QualityCheckResult overallResult;

    private String qualityNotes;

    public SubmitQualityCheckDTO() {}

    public Boolean getFunctionalTestPassed() {
        return functionalTestPassed;
    }

    public void setFunctionalTestPassed(Boolean functionalTestPassed) {
        this.functionalTestPassed = functionalTestPassed;
    }

    public Boolean getPowerTestPassed() {
        return powerTestPassed;
    }

    public void setPowerTestPassed(Boolean powerTestPassed) {
        this.powerTestPassed = powerTestPassed;
    }

    public Boolean getDisplayTestPassed() {
        return displayTestPassed;
    }

    public void setDisplayTestPassed(Boolean displayTestPassed) {
        this.displayTestPassed = displayTestPassed;
    }

    public Boolean getBatteryTestPassed() {
        return batteryTestPassed;
    }

    public void setBatteryTestPassed(Boolean batteryTestPassed) {
        this.batteryTestPassed = batteryTestPassed;
    }

    public Boolean getSafetyTestPassed() {
        return safetyTestPassed;
    }

    public void setSafetyTestPassed(Boolean safetyTestPassed) {
        this.safetyTestPassed = safetyTestPassed;
    }

    public CosmeticGrade getCosmeticGrade() {
        return cosmeticGrade;
    }

    public void setCosmeticGrade(CosmeticGrade cosmeticGrade) {
        this.cosmeticGrade = cosmeticGrade;
    }

    public QualityCheckResult getOverallResult() {
        return overallResult;
    }

    public void setOverallResult(QualityCheckResult overallResult) {
        this.overallResult = overallResult;
    }

    public String getQualityNotes() {
        return qualityNotes;
    }

    public void setQualityNotes(String qualityNotes) {
        this.qualityNotes = qualityNotes;
    }
}
