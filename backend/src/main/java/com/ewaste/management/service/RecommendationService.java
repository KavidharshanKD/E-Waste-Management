package com.ewaste.management.service;

import com.ewaste.management.dto.CreateEWasteRequestDTO;
import com.ewaste.management.dto.DisposalRecommendationResult;
import com.ewaste.management.dto.RecommendationInput;
import com.ewaste.management.model.enums.UserIntention;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    private final DisposalRecommendationEngine recommendationEngine;

    public RecommendationService(DisposalRecommendationEngine recommendationEngine) {
        this.recommendationEngine = recommendationEngine;
    }

    public DisposalRecommendationResult getRecommendation(RecommendationInput input) {
        return recommendationEngine.evaluateRecommendation(input);
    }

    public DisposalRecommendationResult getRecommendationFromDTO(CreateEWasteRequestDTO dto) {
        if (dto == null) {
            return recommendationEngine.evaluateRecommendation(null);
        }

        RecommendationInput input = new RecommendationInput(
                dto.getCategory(),
                dto.getApproxAgeYears(),
                dto.getCondition(),
                dto.getWorkingStatus(),
                dto.getDamageCondition(),
                dto.getBatteryCondition(),
                dto.getUserIntention() != null ? dto.getUserIntention() : UserIntention.UNSURE,
                dto.getPowersOn(),
                dto.getScreenCondition(),
                Boolean.TRUE.equals(dto.getBatterySwollen()),
                Boolean.TRUE.equals(dto.getBatteryLeaking()),
                Boolean.TRUE.equals(dto.getOverheatingEvidence()),
                Boolean.TRUE.equals(dto.getSeverePhysicalDamage()),
                dto.getFunctionalIssues()
        );

        return recommendationEngine.evaluateRecommendation(input);
    }
}
