package com.ewaste.management.dto.technician;

import com.ewaste.management.model.enums.RepairabilityStatus;
import com.ewaste.management.model.enums.TechnicianDecision;

import java.time.LocalDateTime;

public class AssessmentResponseDTO {

    private Long id;
    private Long requestId;
    private String trackingNumber;
    private Long assessedById;
    private String assessedByName;

    // Physical Diagnostic Findings
    private String powerStatus;
    private String screenAssessment;
    private String batteryAssessment;
    private String physicalCondition;
    private String functionalAssessment;
    private String diagnosedIssues;
    private RepairabilityStatus repairabilityStatus;
    private TechnicianDecision technicianDecision;
    private Boolean safetyHazardFound;
    private String safetyNotes;
    private Boolean recommendedForMarketplace;
    private String assessmentNotes;
    private LocalDateTime assessedAt;

    // Preserved ML Audit Context for Side-by-Side Comparison
    private String mlDisplayRecommendation;
    private String mlRawPathway;
    private String mlConfidenceLevel;
    private String mlRecoveryStatus;
    private Double mlRecoveryProbability;
    private Boolean mlTechnicianReviewRequired;
    private String mlExplanation;

    public AssessmentResponseDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public Long getAssessedById() { return assessedById; }
    public void setAssessedById(Long assessedById) { this.assessedById = assessedById; }

    public String getAssessedByName() { return assessedByName; }
    public void setAssessedByName(String assessedByName) { this.assessedByName = assessedByName; }

    public String getPowerStatus() { return powerStatus; }
    public void setPowerStatus(String powerStatus) { this.powerStatus = powerStatus; }

    public String getScreenAssessment() { return screenAssessment; }
    public void setScreenAssessment(String screenAssessment) { this.screenAssessment = screenAssessment; }

    public String getBatteryAssessment() { return batteryAssessment; }
    public void setBatteryAssessment(String batteryAssessment) { this.batteryAssessment = batteryAssessment; }

    public String getPhysicalCondition() { return physicalCondition; }
    public void setPhysicalCondition(String physicalCondition) { this.physicalCondition = physicalCondition; }

    public String getFunctionalAssessment() { return functionalAssessment; }
    public void setFunctionalAssessment(String functionalAssessment) { this.functionalAssessment = functionalAssessment; }

    public String getDiagnosedIssues() { return diagnosedIssues; }
    public void setDiagnosedIssues(String diagnosedIssues) { this.diagnosedIssues = diagnosedIssues; }

    public RepairabilityStatus getRepairabilityStatus() { return repairabilityStatus; }
    public void setRepairabilityStatus(RepairabilityStatus repairabilityStatus) { this.repairabilityStatus = repairabilityStatus; }

    public TechnicianDecision getTechnicianDecision() { return technicianDecision; }
    public void setTechnicianDecision(TechnicianDecision technicianDecision) { this.technicianDecision = technicianDecision; }

    public Boolean getSafetyHazardFound() { return safetyHazardFound; }
    public void setSafetyHazardFound(Boolean safetyHazardFound) { this.safetyHazardFound = safetyHazardFound; }

    public String getSafetyNotes() { return safetyNotes; }
    public void setSafetyNotes(String safetyNotes) { this.safetyNotes = safetyNotes; }

    public Boolean getRecommendedForMarketplace() { return recommendedForMarketplace; }
    public void setRecommendedForMarketplace(Boolean recommendedForMarketplace) { this.recommendedForMarketplace = recommendedForMarketplace; }

    public String getAssessmentNotes() { return assessmentNotes; }
    public void setAssessmentNotes(String assessmentNotes) { this.assessmentNotes = assessmentNotes; }

    public LocalDateTime getAssessedAt() { return assessedAt; }
    public void setAssessedAt(LocalDateTime assessedAt) { this.assessedAt = assessedAt; }

    public String getMlDisplayRecommendation() { return mlDisplayRecommendation; }
    public void setMlDisplayRecommendation(String mlDisplayRecommendation) { this.mlDisplayRecommendation = mlDisplayRecommendation; }

    public String getMlRawPathway() { return mlRawPathway; }
    public void setMlRawPathway(String mlRawPathway) { this.mlRawPathway = mlRawPathway; }

    public String getMlConfidenceLevel() { return mlConfidenceLevel; }
    public void setMlConfidenceLevel(String mlConfidenceLevel) { this.mlConfidenceLevel = mlConfidenceLevel; }

    public String getMlRecoveryStatus() { return mlRecoveryStatus; }
    public void setMlRecoveryStatus(String mlRecoveryStatus) { this.mlRecoveryStatus = mlRecoveryStatus; }

    public Double getMlRecoveryProbability() { return mlRecoveryProbability; }
    public void setMlRecoveryProbability(Double mlRecoveryProbability) { this.mlRecoveryProbability = mlRecoveryProbability; }

    public Boolean getMlTechnicianReviewRequired() { return mlTechnicianReviewRequired; }
    public void setMlTechnicianReviewRequired(Boolean mlTechnicianReviewRequired) { this.mlTechnicianReviewRequired = mlTechnicianReviewRequired; }

    public String getMlExplanation() { return mlExplanation; }
    public void setMlExplanation(String mlExplanation) { this.mlExplanation = mlExplanation; }
}
