package com.ewaste.management.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RecyclingCertificateDTO {
    private Long id;
    private String certificateNumber;
    private Long disposalRequestId;
    private String trackingNumber;
    private String userName;
    private String userEmail;
    private String category;
    private Integer quantity;
    private String finalDisposalMethod;
    private Long recyclerId;
    private String recyclerCompanyName;
    private String recyclingCenter;
    private String status;
    private BigDecimal totalWeightKg;
    private BigDecimal hazardousMaterialsDivertedKg;
    private LocalDateTime issueDate;
    private String certificateUrl;
    private String verificationUrl;
    private boolean isOfficialRecycler;
    private String disclaimer;

    public RecyclingCertificateDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }

    public Long getDisposalRequestId() { return disposalRequestId; }
    public void setDisposalRequestId(Long disposalRequestId) { this.disposalRequestId = disposalRequestId; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getFinalDisposalMethod() { return finalDisposalMethod; }
    public void setFinalDisposalMethod(String finalDisposalMethod) { this.finalDisposalMethod = finalDisposalMethod; }

    public Long getRecyclerId() { return recyclerId; }
    public void setRecyclerId(Long recyclerId) { this.recyclerId = recyclerId; }

    public String getRecyclerCompanyName() { return recyclerCompanyName; }
    public void setRecyclerCompanyName(String recyclerCompanyName) { this.recyclerCompanyName = recyclerCompanyName; }

    public String getRecyclingCenter() { return recyclingCenter; }
    public void setRecyclingCenter(String recyclingCenter) { this.recyclingCenter = recyclingCenter; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getTotalWeightKg() { return totalWeightKg; }
    public void setTotalWeightKg(BigDecimal totalWeightKg) { this.totalWeightKg = totalWeightKg; }

    public BigDecimal getHazardousMaterialsDivertedKg() { return hazardousMaterialsDivertedKg; }
    public void setHazardousMaterialsDivertedKg(BigDecimal hazardousMaterialsDivertedKg) { this.hazardousMaterialsDivertedKg = hazardousMaterialsDivertedKg; }

    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }

    public String getVerificationUrl() { return verificationUrl; }
    public void setVerificationUrl(String verificationUrl) { this.verificationUrl = verificationUrl; }

    public boolean isOfficialRecycler() { return isOfficialRecycler; }
    public void setOfficialRecycler(boolean officialRecycler) { isOfficialRecycler = officialRecycler; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
}
