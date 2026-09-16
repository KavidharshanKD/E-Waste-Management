package com.ewaste.management.service;

import com.ewaste.management.config.MLServiceProperties;
import com.ewaste.management.dto.DisposalRecommendationResult;
import com.ewaste.management.dto.RecommendationInput;
import com.ewaste.management.dto.ml.MLPredictRequest;
import com.ewaste.management.dto.ml.MLPredictResponse;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.RecommendationSource;
import com.ewaste.management.model.enums.UserIntention;
import com.ewaste.management.service.ml.MLClientException;
import com.ewaste.management.service.ml.MLContractMapper;
import com.ewaste.management.service.ml.MLInferenceProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HybridRecommendationEngineTest {

    @Mock
    private MLInferenceProvider mlClient;

    private MLServiceProperties properties;
    private MLContractMapper mapper;
    private RuleBasedRecommendationEngine ruleBasedEngine;
    private HybridRecommendationEngine hybridEngine;

    @BeforeEach
    void setUp() {
        properties = new MLServiceProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("http://localhost:8000");

        mapper = new MLContractMapper();
        ruleBasedEngine = new RuleBasedRecommendationEngine();
        hybridEngine = new HybridRecommendationEngine(properties, mlClient, mapper, ruleBasedEngine);
    }

    @Test
    @DisplayName("Tier 1: Swollen battery directly triggers SPECIAL_HANDLING (ML client is NEVER invoked)")
    void testTier1SwollenBatteryDirectlyBypassesML() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.MOBILE_PHONE);
        input.setDeviceAgeYears(2);
        input.setCondition(DeviceCondition.WORKING);
        input.setBatterySwollen(true);

        DisposalRecommendationResult result = hybridEngine.evaluateRecommendation(input);

        assertEquals(DisposalAction.SPECIAL_HANDLING, result.getRecommendedAction());
        assertEquals(RecommendationSource.SAFETY_RULE, result.getRecommendationSource());
        assertEquals("SPECIAL_HANDLING", result.getDisplayRecommendation());
        assertTrue(result.getTechnicianReviewRequired());
        assertTrue(result.getInspectionRecommended());
        assertEquals("NOT_ASSESSED", result.getMarketplaceEligibility());

        // CRITICAL: ML Client must not be called
        verify(mlClient, never()).predict(any());
    }

    @Test
    @DisplayName("Tier 1: Leaking battery directly triggers SPECIAL_HANDLING (ML bypassed)")
    void testTier1LeakingBatteryDirectlyBypassesML() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.LAPTOP);
        input.setDeviceAgeYears(3);
        input.setCondition(DeviceCondition.PARTIALLY_WORKING);
        input.setBatteryLeaking(true);

        DisposalRecommendationResult result = hybridEngine.evaluateRecommendation(input);

        assertEquals(DisposalAction.SPECIAL_HANDLING, result.getRecommendedAction());
        assertEquals(RecommendationSource.SAFETY_RULE, result.getRecommendationSource());
        verify(mlClient, never()).predict(any());
    }

    @Test
    @DisplayName("Tier 1: Severe physical damage directly triggers SPECIAL_HANDLING (ML bypassed)")
    void testTier1SeverePhysicalDamageDirectlyBypassesML() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.MONITOR);
        input.setDeviceAgeYears(1);
        input.setCondition(DeviceCondition.DAMAGED);
        input.setSeverePhysicalDamage(true);

        DisposalRecommendationResult result = hybridEngine.evaluateRecommendation(input);

        assertEquals(DisposalAction.SPECIAL_HANDLING, result.getRecommendedAction());
        assertEquals(RecommendationSource.SAFETY_RULE, result.getRecommendationSource());
        verify(mlClient, never()).predict(any());
    }

    @Test
    @DisplayName("Tier 2: Valid ML RESTORE response maps to REPAIR/REFURBISH with ML source and audit fields")
    void testTier2MLSuccessRestore() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.LAPTOP);
        input.setDeviceAgeYears(5);
        input.setCondition(DeviceCondition.PARTIALLY_WORKING);
        input.setUserIntention(UserIntention.REPAIR);
        input.setPowersOn(true);
        input.setScreenCondition("CRACKED");

        MLPredictResponse mockResponse = new MLPredictResponse();
        mockResponse.setModelVersion("1.0.0");
        mockResponse.setSafetyGateTriggered(false);
        mockResponse.setRecoveryStatus("AMBIGUOUS_TRIAGE");
        mockResponse.setRecoveryProbability(0.55);
        mockResponse.setRawPathwayPrediction("REPAIR");
        mockResponse.setDisplayRecommendation("RESTORE");
        mockResponse.setPathwayProbability(0.82);
        mockResponse.setConfidenceLevel("HIGH");
        mockResponse.setTechnicianReviewRequired(true);
        mockResponse.setInspectionRecommended(true);
        mockResponse.setUserIntention("REPAIR");
        mockResponse.setIntentionCompatibility("COMPATIBLE");
        mockResponse.setRecommendedAction("RESTORE");
        mockResponse.setExplanation("Device shows repairability potential.");
        mockResponse.setMarketplaceEligibility("TECHNICIAN_REVIEW_REQUIRED");

        when(mlClient.predict(any(MLPredictRequest.class))).thenReturn(mockResponse);

        DisposalRecommendationResult result = hybridEngine.evaluateRecommendation(input);

        assertEquals(RecommendationSource.ML, result.getRecommendationSource());
        assertEquals("RESTORE", result.getDisplayRecommendation());
        assertEquals(DisposalAction.REPAIR, result.getRecommendedAction());
        assertEquals("1.0.0", result.getModelVersion());
        assertEquals("AMBIGUOUS_TRIAGE", result.getRecoveryStatus());
        assertEquals(0.55, result.getRecoveryProbability());
        assertEquals("REPAIR", result.getRawPathway());
        assertEquals(0.82, result.getPathwayProbability());
        assertEquals("HIGH", result.getConfidenceLevel());
        assertTrue(result.getTechnicianReviewRequired());
        assertTrue(result.getInspectionRecommended());
        assertEquals("TECHNICIAN_REVIEW_REQUIRED", result.getMarketplaceEligibility());
    }

    @Test
    @DisplayName("Tier 2: Potential resale candidate sets REFURBISH action, preserving TECHNICIAN_REVIEW_REQUIRED")
    void testTier2MLPotentialResaleCandidate() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.MOBILE_PHONE);
        input.setDeviceAgeYears(1);
        input.setCondition(DeviceCondition.WORKING);
        input.setUserIntention(UserIntention.REFURBISH_AND_SELL);

        MLPredictResponse mockResponse = new MLPredictResponse();
        mockResponse.setModelVersion("1.0.0");
        mockResponse.setDisplayRecommendation("POTENTIAL_RESALE_CANDIDATE");
        mockResponse.setRawPathwayPrediction("REFURBISH_AND_SELL");
        mockResponse.setRecommendedAction("REFURBISH");
        mockResponse.setRecoveryStatus("RECOVERY_FEASIBLE");
        mockResponse.setRecoveryProbability(0.12);
        mockResponse.setConfidenceLevel("HIGH");
        mockResponse.setTechnicianReviewRequired(true);
        mockResponse.setInspectionRecommended(false);
        mockResponse.setMarketplaceEligibility("TECHNICIAN_REVIEW_REQUIRED");
        mockResponse.setExplanation("Device feasible for commercial refurbishing subject to technician audit.");

        when(mlClient.predict(any(MLPredictRequest.class))).thenReturn(mockResponse);

        DisposalRecommendationResult result = hybridEngine.evaluateRecommendation(input);

        assertEquals(RecommendationSource.ML, result.getRecommendationSource());
        assertEquals(DisposalAction.REFURBISH, result.getRecommendedAction());
        assertEquals("POTENTIAL_RESALE_CANDIDATE", result.getDisplayRecommendation());
        assertEquals("TECHNICIAN_REVIEW_REQUIRED", result.getMarketplaceEligibility());
    }

    @Test
    @DisplayName("Tier 3: ML service disabled falls back immediately to RuleBasedRecommendationEngine")
    void testTier3MLDisabledFallback() {
        properties.setEnabled(false);

        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.DESKTOP);
        input.setDeviceAgeYears(2);
        input.setCondition(DeviceCondition.WORKING);

        DisposalRecommendationResult result = hybridEngine.evaluateRecommendation(input);

        assertEquals(RecommendationSource.RULE_BASED_FALLBACK, result.getRecommendationSource());
        assertEquals(DisposalAction.REUSE, result.getRecommendedAction());
        verify(mlClient, never()).predict(any());
    }

    @Test
    @DisplayName("Tier 3: Connection refused / network error triggers resilient fallback")
    void testTier3ConnectionRefusedFallback() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.DESKTOP);
        input.setDeviceAgeYears(2);
        input.setCondition(DeviceCondition.WORKING);

        when(mlClient.predict(any(MLPredictRequest.class)))
                .thenThrow(new MLClientException("Connection refused", "NETWORK_OR_TIMEOUT"));

        DisposalRecommendationResult result = hybridEngine.evaluateRecommendation(input);

        assertEquals(RecommendationSource.RULE_BASED_FALLBACK, result.getRecommendationSource());
        assertEquals(DisposalAction.REUSE, result.getRecommendedAction());
    }

    @Test
    @DisplayName("Tier 3: HTTP 500 server error triggers resilient fallback")
    void testTier3Http500Fallback() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.TELEVISION);
        input.setDeviceAgeYears(4);
        input.setCondition(DeviceCondition.WORKING);

        when(mlClient.predict(any(MLPredictRequest.class)))
                .thenThrow(new MLClientException("Internal Server Error", "SERVER_ERROR", 500));

        DisposalRecommendationResult result = hybridEngine.evaluateRecommendation(input);

        assertEquals(RecommendationSource.RULE_BASED_FALLBACK, result.getRecommendationSource());
        assertEquals(DisposalAction.DONATE, result.getRecommendedAction());
    }

    @Test
    @DisplayName("Tier 3: Malformed response / invalid probability triggers resilient fallback")
    void testTier3MalformedResponseFallback() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.KEYBOARD);
        input.setDeviceAgeYears(1);
        input.setCondition(DeviceCondition.WORKING);

        when(mlClient.predict(any(MLPredictRequest.class)))
                .thenThrow(new MLClientException("Invalid probability: 1.5", "INVALID_PROBABILITY"));

        DisposalRecommendationResult result = hybridEngine.evaluateRecommendation(input);

        assertEquals(RecommendationSource.RULE_BASED_FALLBACK, result.getRecommendationSource());
    }

    @Test
    @DisplayName("Regression Benchmark: 5-year cracked laptop with ML unavailable returns safe fallback without crash")
    void test5YearLaptopBenchmarkFallback() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.LAPTOP);
        input.setDeviceAgeYears(5);
        input.setCondition(DeviceCondition.PARTIALLY_WORKING);
        input.setUserIntention(UserIntention.REPAIR);
        input.setPowersOn(true);
        input.setScreenCondition("CRACKED");

        when(mlClient.predict(any(MLPredictRequest.class)))
                .thenThrow(new MLClientException("ML offline", "NETWORK_OR_TIMEOUT"));

        DisposalRecommendationResult result = hybridEngine.evaluateRecommendation(input);

        assertNotNull(result);
        assertEquals(RecommendationSource.RULE_BASED_FALLBACK, result.getRecommendationSource());
        assertEquals(DisposalAction.REFURBISH, result.getRecommendedAction());
        assertNotNull(result.getExplanation());
        assertNotNull(result.getHandlingAdvice());
    }
}
