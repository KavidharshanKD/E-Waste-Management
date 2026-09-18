package com.ewaste.management.entity;

import com.ewaste.management.model.enums.RestorationJobType;
import com.ewaste.management.model.enums.RestorationStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "restoration_jobs")
public class RestorationJob extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private DisposalRequest disposalRequest;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private DeviceAssessment assessment;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_technician_id", nullable = false)
    private User assignedTechnician;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", nullable = false, length = 30)
    private RestorationJobType jobType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RestorationStatus status = RestorationStatus.PENDING;

    @Column(name = "work_started_at")
    private LocalDateTime workStartedAt;

    @Column(name = "work_completed_at")
    private LocalDateTime workCompletedAt;

    @Column(name = "work_performed", columnDefinition = "TEXT")
    private String workPerformed;

    @Column(name = "parts_replaced", length = 500)
    private String partsReplaced;

    @Column(name = "technician_notes", columnDefinition = "TEXT")
    private String technicianNotes;

    @Column(name = "parts_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal partsCost = BigDecimal.ZERO;

    @Column(name = "labor_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal laborCost = BigDecimal.ZERO;

    @Column(name = "total_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalCost = BigDecimal.ZERO;

    @OneToOne(mappedBy = "restorationJob", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private QualityCheck qualityCheck;

    public RestorationJob() {}

    public DisposalRequest getDisposalRequest() {
        return disposalRequest;
    }

    public void setDisposalRequest(DisposalRequest disposalRequest) {
        this.disposalRequest = disposalRequest;
    }

    public DeviceAssessment getAssessment() {
        return assessment;
    }

    public void setAssessment(DeviceAssessment assessment) {
        this.assessment = assessment;
    }

    public User getAssignedTechnician() {
        return assignedTechnician;
    }

    public void setAssignedTechnician(User assignedTechnician) {
        this.assignedTechnician = assignedTechnician;
    }

    public RestorationJobType getJobType() {
        return jobType;
    }

    public void setJobType(RestorationJobType jobType) {
        this.jobType = jobType;
    }

    public RestorationStatus getStatus() {
        return status;
    }

    public void setStatus(RestorationStatus status) {
        this.status = status;
    }

    public LocalDateTime getWorkStartedAt() {
        return workStartedAt;
    }

    public void setWorkStartedAt(LocalDateTime workStartedAt) {
        this.workStartedAt = workStartedAt;
    }

    public LocalDateTime getWorkCompletedAt() {
        return workCompletedAt;
    }

    public void setWorkCompletedAt(LocalDateTime workCompletedAt) {
        this.workCompletedAt = workCompletedAt;
    }

    public String getWorkPerformed() {
        return workPerformed;
    }

    public void setWorkPerformed(String workPerformed) {
        this.workPerformed = workPerformed;
    }

    public String getPartsReplaced() {
        return partsReplaced;
    }

    public void setPartsReplaced(String partsReplaced) {
        this.partsReplaced = partsReplaced;
    }

    public String getTechnicianNotes() {
        return technicianNotes;
    }

    public void setTechnicianNotes(String technicianNotes) {
        this.technicianNotes = technicianNotes;
    }

    public BigDecimal getPartsCost() {
        return partsCost;
    }

    public void setPartsCost(BigDecimal partsCost) {
        this.partsCost = partsCost != null ? partsCost : BigDecimal.ZERO;
        recalculateTotal();
    }

    public BigDecimal getLaborCost() {
        return laborCost;
    }

    public void setLaborCost(BigDecimal laborCost) {
        this.laborCost = laborCost != null ? laborCost : BigDecimal.ZERO;
        recalculateTotal();
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost != null ? totalCost : BigDecimal.ZERO;
    }

    public QualityCheck getQualityCheck() {
        return qualityCheck;
    }

    public void setQualityCheck(QualityCheck qualityCheck) {
        this.qualityCheck = qualityCheck;
    }

    public void recalculateTotal() {
        BigDecimal parts = this.partsCost != null ? this.partsCost : BigDecimal.ZERO;
        BigDecimal labor = this.laborCost != null ? this.laborCost : BigDecimal.ZERO;
        this.totalCost = parts.add(labor);
    }
}
