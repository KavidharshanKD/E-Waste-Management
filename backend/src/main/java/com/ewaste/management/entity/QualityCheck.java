package com.ewaste.management.entity;

import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.QualityCheckResult;
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

import java.time.LocalDateTime;

@Entity
@Table(name = "quality_checks")
public class QualityCheck extends BaseEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false, unique = true)
    private RestorationJob restorationJob;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by_id", nullable = false)
    private User checkedBy;

    @Column(name = "functional_test_passed", nullable = false)
    private Boolean functionalTestPassed = false;

    @Column(name = "power_test_passed", nullable = false)
    private Boolean powerTestPassed = false;

    @Column(name = "display_test_passed")
    private Boolean displayTestPassed;

    @Column(name = "battery_test_passed")
    private Boolean batteryTestPassed;

    @Column(name = "safety_test_passed", nullable = false)
    private Boolean safetyTestPassed = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "cosmetic_grade", length = 20)
    private CosmeticGrade cosmeticGrade;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "overall_result", nullable = false, length = 30)
    private QualityCheckResult overallResult;

    @Column(name = "quality_notes", columnDefinition = "TEXT")
    private String qualityNotes;

    @Column(name = "marketplace_candidate", nullable = false)
    private Boolean marketplaceCandidate = false;

    @Column(name = "checked_at", nullable = false)
    private LocalDateTime checkedAt = LocalDateTime.now();

    public QualityCheck() {}

    public RestorationJob getRestorationJob() {
        return restorationJob;
    }

    public void setRestorationJob(RestorationJob restorationJob) {
        this.restorationJob = restorationJob;
    }

    public User getCheckedBy() {
        return checkedBy;
    }

    public void setCheckedBy(User checkedBy) {
        this.checkedBy = checkedBy;
    }

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

    public Boolean getMarketplaceCandidate() {
        return marketplaceCandidate;
    }

    public void setMarketplaceCandidate(Boolean marketplaceCandidate) {
        this.marketplaceCandidate = marketplaceCandidate;
    }

    public LocalDateTime getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(LocalDateTime checkedAt) {
        this.checkedAt = checkedAt;
    }
}
