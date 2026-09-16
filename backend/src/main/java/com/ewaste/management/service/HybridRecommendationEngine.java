package com.ewaste.management.service;

import com.ewaste.management.config.MLServiceProperties;
import com.ewaste.management.dto.DisposalRecommendationResult;
import com.ewaste.management.dto.RecommendationInput;
import com.ewaste.management.dto.ml.MLPredictRequest;
import com.ewaste.management.dto.ml.MLPredictResponse;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.RecommendationSource;
import com.ewaste.management.service.ml.MLClientException;
import com.ewaste.management.service.ml.MLContractMapper;
import com.ewaste.management.service.ml.MLInferenceClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Hybrid Recommendation Engine implementing the 3-tier recommendation precedence:
 *
 * Tier 1: Deterministic Java Safety Rules (HAZARDOUS, battery swollen/leaking, overheating, severe damage)
 *         -> SPECIAL_HANDLING (ML bypassed, source = SAFETY_RULE).
 *
 * Tier 2: ML Inference Service (FastAPI /predict via MLInferenceClient)
 *         -> Validated ML Recommendation (source = ML).
 *
 * Tier 3: Resilient Fallback to RuleBasedRecommendationEngine
 *         -> Executed when ML is disabled, times out, network error, 5xx, or returns invalid schema
 *         -> (source = RULE_BASED_FALLBACK).
 */
@Component
@Primary
public class HybridRecommendationEngine implements DisposalRecommendationEngine {

    private static final Logger log = LoggerFactory.getLogger(HybridRecommendationEngine.class);

    private final MLServiceProperties mlProperties;
    private final com.ewaste.management.service.ml.MLInferenceProvider mlClient;
    private final MLContractMapper contractMapper;
    private final RuleBasedRecommendationEngine ruleBasedEngine;

    public HybridRecommendationEngine(MLServiceProperties mlProperties,
                                      com.ewaste.management.service.ml.MLInferenceProvider mlClient,
                                      MLContractMapper contractMapper,
                                      RuleBasedRecommendationEngine ruleBasedEngine) {
        this.mlProperties = mlProperties;
        this.mlClient = mlClient;
        this.contractMapper = contractMapper;
        this.ruleBasedEngine = ruleBasedEngine;
    }

    @Override
    public DisposalRecommendationResult evaluateRecommendation(RecommendationInput input) {
        if (input == null) {
            DisposalRecommendationResult fallback = ruleBasedEngine.evaluateRecommendation(null);
            fallback.setRecommendationSource(RecommendationSource.RULE_BASED_FALLBACK);
            return fallback;
        }

        // =====================================================================
        // TIER 1: DETERMINISTIC JAVA SAFETY GATE (Precedence 1 - SAFETY WINS)
        // =====================================================================
        if (isDeterministicSafetyHazard(input)) {
            log.info("Deterministic safety hazard detected for category={}. SPECIAL_HANDLING awarded immediately (ML bypassed).",
                    input.getCategory());

            DisposalRecommendationResult safetyResult = ruleBasedEngine.evaluateRecommendation(input);
            safetyResult.setRecommendedAction(DisposalAction.SPECIAL_HANDLING);
            safetyResult.setRecommendationSource(RecommendationSource.SAFETY_RULE);
            safetyResult.setDisplayRecommendation("SPECIAL_HANDLING");
            safetyResult.setRecoveryStatus("SPECIAL_HANDLING");
            safetyResult.setConfidenceLevel("HIGH");
            safetyResult.setTechnicianReviewRequired(true);
            safetyResult.setInspectionRecommended(true);
            safetyResult.setMarketplaceEligibility("NOT_ASSESSED");
            safetyResult.setMlExplanation("Safety Gate Triggered: Device contains hazardous, swollen, leaking, or overheated components.");
            return safetyResult;
        }

        // =====================================================================
        // TIER 2: ML INFERENCE SERVICE (Precedence 2)
        // =====================================================================
        if (mlProperties.isEnabled()) {
            try {
                MLPredictRequest mlRequest = contractMapper.toMLRequest(input);
                MLPredictResponse mlResponse = mlClient.predict(mlRequest);

                return mapMLResponseToResult(mlResponse);

            } catch (MLClientException e) {
                log.warn("ML Inference unavailable or rejected (reason={}): {}. Falling back to RuleBasedRecommendationEngine.",
                        e.getReasonCategory(), e.getMessage());
            } catch (Exception e) {
                log.warn("Unexpected failure during ML recommendation orchestration: {}. Falling back to RuleBasedRecommendationEngine.",
                        e.getMessage());
            }
        } else {
            log.debug("ML Service is disabled by configuration. Using RuleBasedRecommendationEngine immediately.");
        }

        // =====================================================================
        // TIER 3: DETERMINISTIC RULE-BASED FALLBACK (Precedence 3)
        // =====================================================================
        DisposalRecommendationResult fallbackResult = ruleBasedEngine.evaluateRecommendation(input);
        fallbackResult.setRecommendationSource(RecommendationSource.RULE_BASED_FALLBACK);
        fallbackResult.setDisplayRecommendation(fallbackResult.getRecommendedAction().name());
        fallbackResult.setConfidenceLevel("MEDIUM");
        fallbackResult.setMarketplaceEligibility("NOT_ASSESSED");
        return fallbackResult;
    }

    /**
     * Stage 0 Deterministic Safety Gate in Java.
     * Evaluates whether device presents fire, chemical, or hazardous handling risks.
     */
    public boolean isDeterministicSafetyHazard(RecommendationInput input) {
        if (input.getCondition() == DeviceCondition.HAZARDOUS) {
            return true;
        }
        if (Boolean.TRUE.equals(input.getBatterySwollen()) ||
            Boolean.TRUE.equals(input.getBatteryLeaking()) ||
            Boolean.TRUE.equals(input.getOverheatingEvidence()) ||
            Boolean.TRUE.equals(input.getSeverePhysicalDamage())) {
            return true;
        }

        String batteryCond = input.getBatteryCondition() != null ? input.getBatteryCondition().toLowerCase() : "";
        String damageCond = input.getDamageCondition() != null ? input.getDamageCondition().toLowerCase() : "";

        return batteryCond.contains("swollen") ||
               batteryCond.contains("leak") ||
               batteryCond.contains("hazard") ||
               batteryCond.contains("bloated") ||
               damageCond.contains("leak") ||
               damageCond.contains("fire") ||
               damageCond.contains("hazard");
    }

    /**
     * Converts a validated ML response into a DisposalRecommendationResult.
     * Maps display action RESTORE and POTENTIAL_RESALE_CANDIDATE to valid backend DisposalAction enums.
     */
    private DisposalRecommendationResult mapMLResponseToResult(MLPredictResponse response) {
        DisposalRecommendationResult result = new DisposalRecommendationResult();

        result.setRecommendationSource(RecommendationSource.ML);
        result.setModelVersion(response.getModelVersion());
        result.setRecoveryStatus(response.getRecoveryStatus());
        result.setRecoveryProbability(response.getRecoveryProbability());
        result.setRawPathway(response.getRawPathwayPrediction());
        result.setDisplayRecommendation(response.getDisplayRecommendation());
        result.setPathwayProbability(response.getPathwayProbability());
        result.setConfidenceLevel(response.getConfidenceLevel());
        result.setTechnicianReviewRequired(Boolean.TRUE.equals(response.getTechnicianReviewRequired()));
        result.setInspectionRecommended(Boolean.TRUE.equals(response.getInspectionRecommended()));
        result.setMarketplaceEligibility(response.getMarketplaceEligibility());
        result.setMlExplanation(response.getExplanation());

        result.setExplanation(response.getExplanation());
        result.setHandlingAdvice(deriveHandlingAdvice(response.getDisplayRecommendation(), response.getTechnicianReviewRequired()));

        // Authoritative DisposalAction mapping
        DisposalAction authoritativeAction = mapToAuthoritativeDisposalAction(
                response.getDisplayRecommendation(),
                response.getRawPathwayPrediction(),
                response.getRecommendedAction()
        );
        result.setRecommendedAction(authoritativeAction);

        return result;
    }

    /**
     * Maps ML display recommendation & raw pathway to the existing backend DisposalAction enum.
     */
    public DisposalAction mapToAuthoritativeDisposalAction(String displayRec, String rawPathway, String recommendedAction) {
        if ("SPECIAL_HANDLING".equalsIgnoreCase(displayRec) || "SPECIAL_HANDLING".equalsIgnoreCase(recommendedAction)) {
            return DisposalAction.SPECIAL_HANDLING;
        }

        if ("RESTORE".equalsIgnoreCase(displayRec) || "RESTORE".equalsIgnoreCase(recommendedAction)) {
            if ("REFURBISH".equalsIgnoreCase(rawPathway)) {
                return DisposalAction.REFURBISH;
            }
            return DisposalAction.REPAIR;
        }

        if ("POTENTIAL_RESALE_CANDIDATE".equalsIgnoreCase(displayRec)) {
            return DisposalAction.REFURBISH;
        }

        if ("KEEP_USING".equalsIgnoreCase(displayRec)) {
            return DisposalAction.REUSE;
        }

        if ("DONATE".equalsIgnoreCase(displayRec)) {
            return DisposalAction.DONATE;
        }

        if ("REPAIR".equalsIgnoreCase(displayRec) || "REPAIR".equalsIgnoreCase(rawPathway)) {
            return DisposalAction.REPAIR;
        }

        if ("REFURBISH".equalsIgnoreCase(displayRec) || "REFURBISH".equalsIgnoreCase(rawPathway)) {
            return DisposalAction.REFURBISH;
        }

        return DisposalAction.RECYCLE;
    }

    private String deriveHandlingAdvice(String displayRecommendation, Boolean technicianReviewRequired) {
        if ("SPECIAL_HANDLING".equalsIgnoreCase(displayRecommendation)) {
            return "Do not power on or attempt to charge this device. Place in non-conductive, insulated packaging and request specialized hazardous waste pickup.";
        }
        if ("RESTORE".equalsIgnoreCase(displayRecommendation) || "POTENTIAL_RESALE_CANDIDATE".equalsIgnoreCase(displayRecommendation)) {
            if (Boolean.TRUE.equals(technicianReviewRequired)) {
                return "Device shows potential for restoration or refurbishment. A qualified technician will inspect component health prior to secondary processing.";
            }
            return "Backup important data and preserve removable cords or accessories for refurbishment assessment.";
        }
        if ("DONATE".equalsIgnoreCase(displayRecommendation) || "KEEP_USING".equalsIgnoreCase(displayRecommendation)) {
            return "Ensure all confidential personal data and cloud accounts are wiped before transferring the device.";
        }
        return "Separate removable cables and deliver to an authorized e-waste collection center for certified material recycling.";
    }
}
