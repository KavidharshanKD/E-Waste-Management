package com.ewaste.management.dto.technician;

import com.ewaste.management.model.enums.RestorationJobType;
import com.ewaste.management.model.enums.RestorationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RestorationJobResponseDTO {

    private Long id;
    private Long requestId;
    private String trackingNumber;
    private Long assessmentId;
    private Long assignedTechnicianId;
    private String assignedTechnicianName;
    private RestorationJobType jobType;
    private RestorationStatus status;
    private LocalDateTime workStartedAt;
    private LocalDateTime workCompletedAt;
    private String workPerformed;
    private String partsReplaced;
    private String technicianNotes;
    private BigDecimal partsCost;
    private BigDecimal laborCost;
    private BigDecimal totalCost;
    private LocalDateTime createdAt;
    private Boolean qualityCheckCompleted;
    private Boolean marketplaceCandidate;

    public RestorationJobResponseDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public Long getAssignedTechnicianId() { return assignedTechnicianId; }
    public void setAssignedTechnicianId(Long assignedTechnicianId) { this.assignedTechnicianId = assignedTechnicianId; }

    public String getAssignedTechnicianName() { return assignedTechnicianName; }
    public void setAssignedTechnicianName(String assignedTechnicianName) { this.assignedTechnicianName = assignedTechnicianName; }

    public RestorationJobType getJobType() { return jobType; }
    public void setJobType(RestorationJobType jobType) { this.jobType = jobType; }

    public RestorationStatus getStatus() { return status; }
    public void setStatus(RestorationStatus status) { this.status = status; }

    public LocalDateTime getWorkStartedAt() { return workStartedAt; }
    public void setWorkStartedAt(LocalDateTime workStartedAt) { this.workStartedAt = workStartedAt; }

    public LocalDateTime getWorkCompletedAt() { return workCompletedAt; }
    public void setWorkCompletedAt(LocalDateTime workCompletedAt) { this.workCompletedAt = workCompletedAt; }

    public String getWorkPerformed() { return workPerformed; }
    public void setWorkPerformed(String workPerformed) { this.workPerformed = workPerformed; }

    public String getPartsReplaced() { return partsReplaced; }
    public void setPartsReplaced(String partsReplaced) { this.partsReplaced = partsReplaced; }

    public String getTechnicianNotes() { return technicianNotes; }
    public void setTechnicianNotes(String technicianNotes) { this.technicianNotes = technicianNotes; }

    public BigDecimal getPartsCost() { return partsCost; }
    public void setPartsCost(BigDecimal partsCost) { this.partsCost = partsCost; }

    public BigDecimal getLaborCost() { return laborCost; }
    public void setLaborCost(BigDecimal laborCost) { this.laborCost = laborCost; }

    public BigDecimal getTotalCost() { return totalCost; }
    public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Boolean getQualityCheckCompleted() { return qualityCheckCompleted; }
    public void setQualityCheckCompleted(Boolean qualityCheckCompleted) { this.qualityCheckCompleted = qualityCheckCompleted; }

    public Boolean getMarketplaceCandidate() { return marketplaceCandidate; }
    public void setMarketplaceCandidate(Boolean marketplaceCandidate) { this.marketplaceCandidate = marketplaceCandidate; }
}
