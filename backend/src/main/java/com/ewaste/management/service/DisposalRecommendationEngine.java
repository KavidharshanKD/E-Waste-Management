package com.ewaste.management.service;

import com.ewaste.management.dto.DisposalRecommendationResult;
import com.ewaste.management.dto.RecommendationInput;

public interface DisposalRecommendationEngine {
    DisposalRecommendationResult evaluateRecommendation(RecommendationInput input);
}
