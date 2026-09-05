package com.ewaste.management.dto;

import java.math.BigDecimal;
import java.util.Map;

public class AdminAnalyticsDTO {
    // Measurable Application Statistics
    private Long totalItemsCollected;
    private Long totalQuantity;
    private Long totalCompletedRequests;
    private Long reusedDevices;
    private Long repairedRefurbishedDevices;
    private Long recycledDevices;
    private Long specialHandlingDevices;

    // Distributions & Trends for Charts
    private Map<String, Long> categoryDistribution;
    private Map<String, Long> disposalMethodDistribution;
    private Map<String, Long> requestStatusDistribution;
    private Map<String, Long> monthlyCollectionTrend;
    private Map<String, Long> topCitiesDistribution;

    // Configurable Estimates
    private BigDecimal estimatedLandfillDiversionKg;
    private BigDecimal estimatedCo2ReductionKg;
    private BigDecimal estimatedRecoveredMetalsKg;
    private BigDecimal estimatedRecoveredPlasticsKg;
    private boolean hasValidFactors;
    private String factorSourceReference;

    public AdminAnalyticsDTO() {}

    public Long getTotalItemsCollected() { return totalItemsCollected; }
    public void setTotalItemsCollected(Long totalItemsCollected) { this.totalItemsCollected = totalItemsCollected; }

    public Long getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(Long totalQuantity) { this.totalQuantity = totalQuantity; }

    public Long getTotalCompletedRequests() { return totalCompletedRequests; }
    public void setTotalCompletedRequests(Long totalCompletedRequests) { this.totalCompletedRequests = totalCompletedRequests; }

    public Long getReusedDevices() { return reusedDevices; }
    public void setReusedDevices(Long reusedDevices) { this.reusedDevices = reusedDevices; }

    public Long getRepairedRefurbishedDevices() { return repairedRefurbishedDevices; }
    public void setRepairedRefurbishedDevices(Long repairedRefurbishedDevices) { this.repairedRefurbishedDevices = repairedRefurbishedDevices; }

    public Long getRecycledDevices() { return recycledDevices; }
    public void setRecycledDevices(Long recycledDevices) { this.recycledDevices = recycledDevices; }

    public Long getSpecialHandlingDevices() { return specialHandlingDevices; }
    public void setSpecialHandlingDevices(Long specialHandlingDevices) { this.specialHandlingDevices = specialHandlingDevices; }

    public Map<String, Long> getCategoryDistribution() { return categoryDistribution; }
    public void setCategoryDistribution(Map<String, Long> categoryDistribution) { this.categoryDistribution = categoryDistribution; }

    public Map<String, Long> getDisposalMethodDistribution() { return disposalMethodDistribution; }
    public void setDisposalMethodDistribution(Map<String, Long> disposalMethodDistribution) { this.disposalMethodDistribution = disposalMethodDistribution; }

    public Map<String, Long> getRequestStatusDistribution() { return requestStatusDistribution; }
    public void setRequestStatusDistribution(Map<String, Long> requestStatusDistribution) { this.requestStatusDistribution = requestStatusDistribution; }

    public Map<String, Long> getMonthlyCollectionTrend() { return monthlyCollectionTrend; }
    public void setMonthlyCollectionTrend(Map<String, Long> monthlyCollectionTrend) { this.monthlyCollectionTrend = monthlyCollectionTrend; }

    public Map<String, Long> getTopCitiesDistribution() { return topCitiesDistribution; }
    public void setTopCitiesDistribution(Map<String, Long> topCitiesDistribution) { this.topCitiesDistribution = topCitiesDistribution; }

    public BigDecimal getEstimatedLandfillDiversionKg() { return estimatedLandfillDiversionKg; }
    public void setEstimatedLandfillDiversionKg(BigDecimal estimatedLandfillDiversionKg) { this.estimatedLandfillDiversionKg = estimatedLandfillDiversionKg; }

    public BigDecimal getEstimatedCo2ReductionKg() { return estimatedCo2ReductionKg; }
    public void setEstimatedCo2ReductionKg(BigDecimal estimatedCo2ReductionKg) { this.estimatedCo2ReductionKg = estimatedCo2ReductionKg; }

    public BigDecimal getEstimatedRecoveredMetalsKg() { return estimatedRecoveredMetalsKg; }
    public void setEstimatedRecoveredMetalsKg(BigDecimal estimatedRecoveredMetalsKg) { this.estimatedRecoveredMetalsKg = estimatedRecoveredMetalsKg; }

    public BigDecimal getEstimatedRecoveredPlasticsKg() { return estimatedRecoveredPlasticsKg; }
    public void setEstimatedRecoveredPlasticsKg(BigDecimal estimatedRecoveredPlasticsKg) { this.estimatedRecoveredPlasticsKg = estimatedRecoveredPlasticsKg; }

    public boolean isHasValidFactors() { return hasValidFactors; }
    public void setHasValidFactors(boolean hasValidFactors) { this.hasValidFactors = hasValidFactors; }

    public String getFactorSourceReference() { return factorSourceReference; }
    public void setFactorSourceReference(String factorSourceReference) { this.factorSourceReference = factorSourceReference; }
}
