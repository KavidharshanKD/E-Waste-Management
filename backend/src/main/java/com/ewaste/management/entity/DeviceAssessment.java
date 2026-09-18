package com.ewaste.management.entity;

import com.ewaste.management.model.enums.RepairabilityStatus;
import com.ewaste.management.model.enums.TechnicianDecision;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "device_assessments")
public class DeviceAssessment extends BaseEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private DisposalRequest disposalRequest;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessed_by_id", nullable = false)
    private User assessedBy;

    @NotBlank
    @Column(name = "power_status", nullable = false, length = 50)
    private String powerStatus;

    @Column(name = "screen_assessment", length = 50)
    private String screenAssessment;

    @Column(name = "battery_assessment", length = 50)
    private String batteryAssessment;

    @NotBlank
    @Column(name = "physical_condition", nullable = false, length = 50)
    private String physicalCondition;

    @Column(name = "functional_assessment", length = 500)
    private String functionalAssessment;

    @Column(name = "diagnosed_issues", length = 500)
    private String diagnosedIssues;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "repairability_status", nullable = false, length = 50)
    private RepairabilityStatus repairabilityStatus;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "technician_decision", nullable = false, length = 50)
    private TechnicianDecision technicianDecision;

    @Column(name = "safety_hazard_found", nullable = false)
    private Boolean safetyHazardFound = false;

    @Column(name = "safety_notes", length = 500)
    private String safetyNotes;

    @Column(name = "recommended_for_marketplace", nullable = false)
    private Boolean recommendedForMarketplace = false;

    @Column(name = "assessment_notes", columnDefinition = "TEXT")
    private String assessmentNotes;

    @Column(name = "assessed_at", nullable = false)
    private LocalDateTime assessedAt = LocalDateTime.now();

    public DeviceAssessment() {}

    public DisposalRequest getDisposalRequest() {
        return disposalRequest;
    }

    public void setDisposalRequest(DisposalRequest disposalRequest) {
        this.disposalRequest = disposalRequest;
    }

    public User getAssessedBy() {
        return assessedBy;
    }

    public void setAssessedBy(User assessedBy) {
        this.assessedBy = assessedBy;
    }

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

    public LocalDateTime getAssessedAt() {
        return assessedAt;
    }

    public void setAssessedAt(LocalDateTime assessedAt) {
        this.assessedAt = assessedAt;
    }
}
