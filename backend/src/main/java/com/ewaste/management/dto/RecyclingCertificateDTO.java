package com.ewaste.management.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RecyclingCertificateDTO {
    private Long id;
    private String certificateNumber;
    private Long disposalRequestId;
    private String trackingNumber;
    private Long recyclerId;
    private String recyclerCompanyName;
    private BigDecimal totalWeightKg;
    private BigDecimal hazardousMaterialsDivertedKg;
    private LocalDateTime issueDate;
    private String certificateUrl;

    public RecyclingCertificateDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }

    public Long getDisposalRequestId() { return disposalRequestId; }
    public void setDisposalRequestId(Long disposalRequestId) { this.disposalRequestId = disposalRequestId; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public Long getRecyclerId() { return recyclerId; }
    public void setRecyclerId(Long recyclerId) { this.recyclerId = recyclerId; }

    public String getRecyclerCompanyName() { return recyclerCompanyName; }
    public void setRecyclerCompanyName(String recyclerCompanyName) { this.recyclerCompanyName = recyclerCompanyName; }

    public BigDecimal getTotalWeightKg() { return totalWeightKg; }
    public void setTotalWeightKg(BigDecimal totalWeightKg) { this.totalWeightKg = totalWeightKg; }

    public BigDecimal getHazardousMaterialsDivertedKg() { return hazardousMaterialsDivertedKg; }
    public void setHazardousMaterialsDivertedKg(BigDecimal hazardousMaterialsDivertedKg) { this.hazardousMaterialsDivertedKg = hazardousMaterialsDivertedKg; }

    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }
}
