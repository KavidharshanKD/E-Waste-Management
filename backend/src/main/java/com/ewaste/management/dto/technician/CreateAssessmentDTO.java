package com.ewaste.management.dto.technician;

import com.ewaste.management.model.enums.RepairabilityStatus;
import com.ewaste.management.model.enums.TechnicianDecision;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateAssessmentDTO {

    @NotBlank(message = "Power status is required")
    private String powerStatus;

    private String screenAssessment;
    private String batteryAssessment;

    @NotBlank(message = "Physical condition is required")
    private String physicalCondition;

    private String functionalAssessment;
    private String diagnosedIssues;

    @NotNull(message = "Repairability status is required")
    private RepairabilityStatus repairabilityStatus;

    @NotNull(message = "Technician decision is required")
    private TechnicianDecision technicianDecision;

    private Boolean safetyHazardFound = false;
    private String safetyNotes;
    private Boolean recommendedForMarketplace = false;
    private String assessmentNotes;

    public CreateAssessmentDTO() {}

    public String getPowerStatus() {
        return powerStatus;
    }

    public void setPowerStatus(String powerStatus) {
        this.powerStatus = powerStatus;
    }

    public String getScreenAssessment() {
        return screenAssessment;
    }

    public void setScreenAssessment(String screenAssessment) {
        this.screenAssessment = screenAssessment;
    }

    public String getBatteryAssessment() {
        return batteryAssessment;
    }

    public void setBatteryAssessment(String batteryAssessment) {
        this.batteryAssessment = batteryAssessment;
    }

    public String getPhysicalCondition() {
        return physicalCondition;
    }

    public void setPhysicalCondition(String physicalCondition) {
        this.physicalCondition = physicalCondition;
    }

    public String getFunctionalAssessment() {
        return functionalAssessment;
    }

    public void setFunctionalAssessment(String functionalAssessment) {
        this.functionalAssessment = functionalAssessment;
    }

    public String getDiagnosedIssues() {
        return diagnosedIssues;
    }

    public void setDiagnosedIssues(String diagnosedIssues) {
        this.diagnosedIssues = diagnosedIssues;
    }

    public RepairabilityStatus getRepairabilityStatus() {
        return repairabilityStatus;
    }

    public void setRepairabilityStatus(RepairabilityStatus repairabilityStatus) {
        this.repairabilityStatus = repairabilityStatus;
    }

    public TechnicianDecision getTechnicianDecision() {
        return technicianDecision;
    }

    public void setTechnicianDecision(TechnicianDecision technicianDecision) {
        this.technicianDecision = technicianDecision;
    }

    public Boolean getSafetyHazardFound() {
        return safetyHazardFound;
    }

    public void setSafetyHazardFound(Boolean safetyHazardFound) {
        this.safetyHazardFound = safetyHazardFound;
    }

    public String getSafetyNotes() {
        return safetyNotes;
    }

    public void setSafetyNotes(String safetyNotes) {
        this.safetyNotes = safetyNotes;
    }

    public Boolean getRecommendedForMarketplace() {
        return recommendedForMarketplace;
    }

    public void setRecommendedForMarketplace(Boolean recommendedForMarketplace) {
        this.recommendedForMarketplace = recommendedForMarketplace;
    }

    public String getAssessmentNotes() {
        return assessmentNotes;
    }

    public void setAssessmentNotes(String assessmentNotes) {
        this.assessmentNotes = assessmentNotes;
    }
}
