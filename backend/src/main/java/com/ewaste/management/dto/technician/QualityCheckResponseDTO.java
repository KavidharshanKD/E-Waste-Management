package com.ewaste.management.dto.technician;

import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.QualityCheckResult;

import java.time.LocalDateTime;

public class QualityCheckResponseDTO {

    private Long id;
    private Long jobId;
    private Long requestId;
    private String trackingNumber;
    private Long checkedById;
    private String checkedByName;

    private Boolean functionalTestPassed;
    private Boolean powerTestPassed;
    private Boolean displayTestPassed;
    private Boolean batteryTestPassed;
    private Boolean safetyTestPassed;
    private CosmeticGrade cosmeticGrade;
    private QualityCheckResult overallResult;
    private String qualityNotes;
    private Boolean marketplaceCandidate;
    private LocalDateTime checkedAt;

    public QualityCheckResponseDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }

    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public Long getCheckedById() { return checkedById; }
    public void setCheckedById(Long checkedById) { this.checkedById = checkedById; }

    public String getCheckedByName() { return checkedByName; }
    public void setCheckedByName(String checkedByName) { this.checkedByName = checkedByName; }

    public Boolean getFunctionalTestPassed() { return functionalTestPassed; }
    public void setFunctionalTestPassed(Boolean functionalTestPassed) { this.functionalTestPassed = functionalTestPassed; }

    public Boolean getPowerTestPassed() { return powerTestPassed; }
    public void setPowerTestPassed(Boolean powerTestPassed) { this.powerTestPassed = powerTestPassed; }

    public Boolean getDisplayTestPassed() { return displayTestPassed; }
    public void setDisplayTestPassed(Boolean displayTestPassed) { this.displayTestPassed = displayTestPassed; }

    public Boolean getBatteryTestPassed() { return batteryTestPassed; }
    public void setBatteryTestPassed(Boolean batteryTestPassed) { this.batteryTestPassed = batteryTestPassed; }

    public Boolean getSafetyTestPassed() { return safetyTestPassed; }
    public void setSafetyTestPassed(Boolean safetyTestPassed) { this.safetyTestPassed = safetyTestPassed; }

    public CosmeticGrade getCosmeticGrade() { return cosmeticGrade; }
    public void setCosmeticGrade(CosmeticGrade cosmeticGrade) { this.cosmeticGrade = cosmeticGrade; }

    public QualityCheckResult getOverallResult() { return overallResult; }
    public void setOverallResult(QualityCheckResult overallResult) { this.overallResult = overallResult; }

    public String getQualityNotes() { return qualityNotes; }
    public void setQualityNotes(String qualityNotes) { this.qualityNotes = qualityNotes; }

    public Boolean getMarketplaceCandidate() { return marketplaceCandidate; }
    public void setMarketplaceCandidate(Boolean marketplaceCandidate) { this.marketplaceCandidate = marketplaceCandidate; }

    public LocalDateTime getCheckedAt() { return checkedAt; }
    public void setCheckedAt(LocalDateTime checkedAt) { this.checkedAt = checkedAt; }
}
