package com.ewaste.management.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class MLPredictResponse {

    @JsonProperty("model_version")
    private String modelVersion;

    @JsonProperty("safety_gate_triggered")
    private Boolean safetyGateTriggered;

    @JsonProperty("safety_reasons")
    private List<String> safetyReasons;

    @JsonProperty("recovery_status")
    private String recoveryStatus;

    @JsonProperty("recovery_probability")
    private Double recoveryProbability;

    @JsonProperty("raw_pathway_prediction")
    private String rawPathwayPrediction;

    @JsonProperty("display_recommendation")
    private String displayRecommendation;

    @JsonProperty("pathway_probability")
    private Double pathwayProbability;

    @JsonProperty("pathway_probabilities")
    private Map<String, Double> pathwayProbabilities;

    @JsonProperty("confidence_level")
    private String confidenceLevel;

    @JsonProperty("technician_review_required")
    private Boolean technicianReviewRequired;

    @JsonProperty("inspection_recommended")
    private Boolean inspectionRecommended;

    @JsonProperty("user_intention")
    private String userIntention;

    @JsonProperty("intention_compatibility")
    private String intentionCompatibility;

    @JsonProperty("recommended_action")
    private String recommendedAction;

    @JsonProperty("explanation")
    private String explanation;

    @JsonProperty("marketplace_eligibility")
    private String marketplaceEligibility;

    public MLPredictResponse() {}

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public Boolean getSafetyGateTriggered() {
        return safetyGateTriggered;
    }

    public void setSafetyGateTriggered(Boolean safetyGateTriggered) {
        this.safetyGateTriggered = safetyGateTriggered;
    }

    public List<String> getSafetyReasons() {
        return safetyReasons;
    }

    public void setSafetyReasons(List<String> safetyReasons) {
        this.safetyReasons = safetyReasons;
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

    public String getRawPathwayPrediction() {
        return rawPathwayPrediction;
    }

    public void setRawPathwayPrediction(String rawPathwayPrediction) {
        this.rawPathwayPrediction = rawPathwayPrediction;
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

    public Map<String, Double> getPathwayProbabilities() {
        return pathwayProbabilities;
    }

    public void setPathwayProbabilities(Map<String, Double> pathwayProbabilities) {
        this.pathwayProbabilities = pathwayProbabilities;
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

    public String getUserIntention() {
        return userIntention;
    }

    public void setUserIntention(String userIntention) {
        this.userIntention = userIntention;
    }

    public String getIntentionCompatibility() {
        return intentionCompatibility;
    }

    public void setIntentionCompatibility(String intentionCompatibility) {
        this.intentionCompatibility = intentionCompatibility;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(String recommendedAction) {
        this.recommendedAction = recommendedAction;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getMarketplaceEligibility() {
        return marketplaceEligibility;
    }

    public void setMarketplaceEligibility(String marketplaceEligibility) {
        this.marketplaceEligibility = marketplaceEligibility;
    }
}
