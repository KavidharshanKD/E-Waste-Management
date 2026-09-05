package com.ewaste.management.dto;

import java.time.LocalDateTime;

public class PublicCertificateVerifyDTO {
    private String certificateNumber;
    private String trackingNumber;
    private String category;
    private Integer quantity;
    private String finalDisposalMethod;
    private LocalDateTime issueDate;
    private String recyclingCenter;
    private String status;
    private boolean isValid;
    private boolean isOfficialRecycler;
    private String disclaimer;

    public PublicCertificateVerifyDTO() {}

    public String getCertificateNumber() { return certificateNumber; }
    public void setCertificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getFinalDisposalMethod() { return finalDisposalMethod; }
    public void setFinalDisposalMethod(String finalDisposalMethod) { this.finalDisposalMethod = finalDisposalMethod; }

    public LocalDateTime getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDateTime issueDate) { this.issueDate = issueDate; }

    public String getRecyclingCenter() { return recyclingCenter; }
    public void setRecyclingCenter(String recyclingCenter) { this.recyclingCenter = recyclingCenter; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isValid() { return isValid; }
    public void setValid(boolean valid) { isValid = valid; }

    public boolean isOfficialRecycler() { return isOfficialRecycler; }
    public void setOfficialRecycler(boolean officialRecycler) { isOfficialRecycler = officialRecycler; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
}
