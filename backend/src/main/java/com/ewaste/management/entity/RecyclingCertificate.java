package com.ewaste.management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recycling_certificates")
public class RecyclingCertificate extends BaseEntity {

    @NotBlank
    @Column(name = "certificate_number", nullable = false, unique = true, length = 100)
    private String certificateNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private DisposalRequest disposalRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recycler_id", nullable = false)
    private Recycler recycler;

    @Column(name = "total_weight_kg", precision = 10, scale = 2)
    private BigDecimal totalWeightKg;

    @Column(name = "hazardous_materials_diverted_kg", precision = 10, scale = 2)
    private BigDecimal hazardousMaterialsDivertedKg;

    @Column(name = "issue_date", nullable = false)
    private LocalDateTime issueDate = LocalDateTime.now();

    @Column(name = "certificate_url", length = 255)
    private String certificateUrl;

    public RecyclingCertificate() {}

    public String getCertificateNumber() {
        return certificateNumber;
    }

    public void setCertificateNumber(String certificateNumber) {
        this.certificateNumber = certificateNumber;
    }

    public DisposalRequest getDisposalRequest() {
        return disposalRequest;
    }

    public void setDisposalRequest(DisposalRequest disposalRequest) {
        this.disposalRequest = disposalRequest;
    }

    public Recycler getRecycler() {
        return recycler;
    }

    public void setRecycler(Recycler recycler) {
        this.recycler = recycler;
    }

    public BigDecimal getTotalWeightKg() {
        return totalWeightKg;
    }

    public void setTotalWeightKg(BigDecimal totalWeightKg) {
        this.totalWeightKg = totalWeightKg;
    }

    public BigDecimal getHazardousMaterialsDivertedKg() {
        return hazardousMaterialsDivertedKg;
    }

    public void setHazardousMaterialsDivertedKg(BigDecimal hazardousMaterialsDivertedKg) {
        this.hazardousMaterialsDivertedKg = hazardousMaterialsDivertedKg;
    }

    public LocalDateTime getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDateTime issueDate) {
        this.issueDate = issueDate;
    }

    public String getCertificateUrl() {
        return certificateUrl;
    }

    public void setCertificateUrl(String certificateUrl) {
        this.certificateUrl = certificateUrl;
    }
}
