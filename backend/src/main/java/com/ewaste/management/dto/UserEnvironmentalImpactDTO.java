package com.ewaste.management.dto;

import java.math.BigDecimal;

public class UserEnvironmentalImpactDTO {
    private Long totalDisposedDevices;
    private Long reusedOrDonatedDevices;
    private Long completedRequests;
    private Integer greenPoints;
    private BigDecimal estimatedLandfillDiversionKg;
    private BigDecimal estimatedCo2ReductionKg;
    private boolean hasValidFactors;
    private String factorSourceReference;

    public UserEnvironmentalImpactDTO() {}

    public Long getTotalDisposedDevices() { return totalDisposedDevices; }
    public void setTotalDisposedDevices(Long totalDisposedDevices) { this.totalDisposedDevices = totalDisposedDevices; }

    public Long getReusedOrDonatedDevices() { return reusedOrDonatedDevices; }
    public void setReusedOrDonatedDevices(Long reusedOrDonatedDevices) { this.reusedOrDonatedDevices = reusedOrDonatedDevices; }

    public Long getCompletedRequests() { return completedRequests; }
    public void setCompletedRequests(Long completedRequests) { this.completedRequests = completedRequests; }

    public Integer getGreenPoints() { return greenPoints; }
    public void setGreenPoints(Integer greenPoints) { this.greenPoints = greenPoints; }

    public BigDecimal getEstimatedLandfillDiversionKg() { return estimatedLandfillDiversionKg; }
    public void setEstimatedLandfillDiversionKg(BigDecimal estimatedLandfillDiversionKg) { this.estimatedLandfillDiversionKg = estimatedLandfillDiversionKg; }

    public BigDecimal getEstimatedCo2ReductionKg() { return estimatedCo2ReductionKg; }
    public void setEstimatedCo2ReductionKg(BigDecimal estimatedCo2ReductionKg) { this.estimatedCo2ReductionKg = estimatedCo2ReductionKg; }

    public boolean isHasValidFactors() { return hasValidFactors; }
    public void setHasValidFactors(boolean hasValidFactors) { this.hasValidFactors = hasValidFactors; }

    public String getFactorSourceReference() { return factorSourceReference; }
    public void setFactorSourceReference(String factorSourceReference) { this.factorSourceReference = factorSourceReference; }
}
