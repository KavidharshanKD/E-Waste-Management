package com.ewaste.management.dto;

import com.ewaste.management.model.enums.DisposalAction;

public class DisposalRecommendationResult {
    private DisposalAction recommendedAction;
    private String explanation;
    private String handlingAdvice;
    private String disclaimer = "Notice: This automated recommendation is advisory and does not replace professional recycling facility inspection.";

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
}
