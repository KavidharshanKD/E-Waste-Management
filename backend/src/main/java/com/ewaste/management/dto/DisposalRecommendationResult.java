package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.RecommendationSource;

public class DisposalRecommendationResult {
    private DisposalAction recommendedAction;
    private String explanation;
    private String handlingAdvice;
    private String disclaimer = "Notice: This automated recommendation is advisory and does not replace professional recycling facility inspection.";

    // Module 6: ML Hybrid Orchestration & Audit Metadata
    private RecommendationSource recommendationSource = RecommendationSource.RULE_BASED_FALLBACK;
    private String modelVersion;
    private String recoveryStatus;
    private Double recoveryProbability;
    private String rawPathway;
    private String displayRecommendation;
    private Double pathwayProbability;
    private String confidenceLevel;
    private Boolean technicianReviewRequired = false;
    private Boolean inspectionRecommended = false;
    private String marketplaceEligibility = "NOT_ASSESSED";
    private String mlExplanation;

    public DisposalRecommendationResult() {}

    public DisposalRecommendationResult(DisposalAction recommendedAction, String explanation, String handlingAdvice) {
        this.recommendedAction = recommendedAction;
        this.explanation = explanation;
        this.handlingAdvice = handlingAdvice;
    }

    public DisposalRecommendationResult(DisposalAction recommendedAction, String explanation, String handlingAdvice, String disclaimer) {
        this.recommendedAction = recommendedAction;
        this.explanation = explanation;
        this.handlingAdvice = handlingAdvice;
        if (disclaimer != null) {
            this.disclaimer = disclaimer;
        }
    }

    public DisposalAction getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(DisposalAction recommendedAction) {
        this.recommendedAction = recommendedAction;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getHandlingAdvice() {
        return handlingAdvice;
    }

    public void setHandlingAdvice(String handlingAdvice) {
        this.handlingAdvice = handlingAdvice;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public RecommendationSource getRecommendationSource() {
        return recommendationSource;
    }

    public void setRecommendationSource(RecommendationSource recommendationSource) {
        this.recommendationSource = recommendationSource;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public String getRecoveryStatus() {
        return recoveryStatus;
    }

    public void setRecoveryStatus(String recoveryStatus) {
        this.recoveryStatus = recoveryStatus;
    }

    public Double getRecoveryProbability() {
        return recoveryProbability;
    }

    public void setRecoveryProbability(Double recoveryProbability) {
        this.recoveryProbability = recoveryProbability;
    }

    public String getRawPathway() {
        return rawPathway;
    }

    public void setRawPathway(String rawPathway) {
        this.rawPathway = rawPathway;
    }

    public String getDisplayRecommendation() {
        return displayRecommendation;
    }

    public void setDisplayRecommendation(String displayRecommendation) {
        this.displayRecommendation = displayRecommendation;
    }

    public Double getPathwayProbability() {
        return pathwayProbability;
    }

    public void setPathwayProbability(Double pathwayProbability) {
        this.pathwayProbability = pathwayProbability;
    }

    public String getConfidenceLevel() {
        return confidenceLevel;
    }

    public void setConfidenceLevel(String confidenceLevel) {
        this.confidenceLevel = confidenceLevel;
    }

    public Boolean getTechnicianReviewRequired() {
        return technicianReviewRequired;
    }

    public void setTechnicianReviewRequired(Boolean technicianReviewRequired) {
        this.technicianReviewRequired = technicianReviewRequired;
    }

    public Boolean getInspectionRecommended() {
        return inspectionRecommended;
    }

    public void setInspectionRecommended(Boolean inspectionRecommended) {
        this.inspectionRecommended = inspectionRecommended;
    }

    public String getMarketplaceEligibility() {
        return marketplaceEligibility;
    }

    public void setMarketplaceEligibility(String marketplaceEligibility) {
        this.marketplaceEligibility = marketplaceEligibility;
    }

    public String getMlExplanation() {
        return mlExplanation;
    }

    public void setMlExplanation(String mlExplanation) {
        this.mlExplanation = mlExplanation;
    }
}
