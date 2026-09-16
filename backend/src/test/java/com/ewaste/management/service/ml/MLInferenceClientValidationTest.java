package com.ewaste.management.service.ml;

import com.ewaste.management.config.MLServiceProperties;
import com.ewaste.management.dto.ml.MLPredictRequest;
import com.ewaste.management.dto.ml.MLPredictResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MLInferenceClientValidationTest {

    private MLInferenceClient client;
    private MLServiceProperties properties;

    @BeforeEach
    void setUp() {
        properties = new MLServiceProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("http://localhost:8000");
        client = new MLInferenceClient(properties);
    }

    @Test
    @DisplayName("Valid response passes validation")
    void testValidResponsePasses() {
        MLPredictResponse response = new MLPredictResponse();
        response.setModelVersion("1.0.0");
        response.setDisplayRecommendation("RESTORE");
        response.setRecommendedAction("REPAIR");
        response.setExplanation("Device feasible for restoration");
        response.setConfidenceLevel("HIGH");
        response.setRecoveryStatus("RECOVERY_FEASIBLE");
        response.setRecoveryProbability(0.25);
        response.setPathwayProbability(0.85);
        response.setMarketplaceEligibility("TECHNICIAN_REVIEW_REQUIRED");
        response.setSafetyGateTriggered(false);

        assertDoesNotThrow(() -> client.validateResponse(response));
    }

    @Test
    @DisplayName("Null response throws MLClientException")
    void testNullResponseThrows() {
        MLClientException ex = assertThrows(MLClientException.class, () -> client.validateResponse(null));
        assertEquals("RESPONSE_NULL", ex.getReasonCategory());
    }

    @Test
    @DisplayName("Missing model version throws MLClientException")
    void testMissingModelVersionThrows() {
        MLPredictResponse response = new MLPredictResponse();
        response.setDisplayRecommendation("RESTORE");
        response.setRecommendedAction("REPAIR");
        response.setExplanation("Valid explanation");
        response.setConfidenceLevel("HIGH");

        MLClientException ex = assertThrows(MLClientException.class, () -> client.validateResponse(response));
        assertEquals("INVALID_RESPONSE_SCHEMA", ex.getReasonCategory());
    }

    @Test
    @DisplayName("Invalid probability > 1.0 throws MLClientException")
    void testInvalidProbabilityOverOneThrows() {
        MLPredictResponse response = new MLPredictResponse();
        response.setModelVersion("1.0.0");
        response.setDisplayRecommendation("RESTORE");
        response.setRecommendedAction("REPAIR");
        response.setExplanation("Valid explanation");
        response.setConfidenceLevel("HIGH");
        response.setRecoveryProbability(1.25); // Invalid!

        MLClientException ex = assertThrows(MLClientException.class, () -> client.validateResponse(response));
        assertEquals("INVALID_PROBABILITY", ex.getReasonCategory());
    }

    @Test
    @DisplayName("Invalid negative probability throws MLClientException")
    void testNegativeProbabilityThrows() {
        MLPredictResponse response = new MLPredictResponse();
        response.setModelVersion("1.0.0");
        response.setDisplayRecommendation("RESTORE");
        response.setRecommendedAction("REPAIR");
        response.setExplanation("Valid explanation");
        response.setConfidenceLevel("HIGH");
        response.setPathwayProbability(-0.05); // Invalid!

        MLClientException ex = assertThrows(MLClientException.class, () -> client.validateResponse(response));
        assertEquals("INVALID_PROBABILITY", ex.getReasonCategory());
    }

    @Test
    @DisplayName("Unknown recovery status throws MLClientException")
    void testUnknownRecoveryStatusThrows() {
        MLPredictResponse response = new MLPredictResponse();
        response.setModelVersion("1.0.0");
        response.setDisplayRecommendation("RESTORE");
        response.setRecommendedAction("REPAIR");
        response.setExplanation("Valid explanation");
        response.setConfidenceLevel("HIGH");
        response.setRecoveryStatus("FABRICATED_STATUS"); // Unknown!

        MLClientException ex = assertThrows(MLClientException.class, () -> client.validateResponse(response));
        assertEquals("INVALID_STATUS", ex.getReasonCategory());
    }

    @Test
    @DisplayName("Marketplace eligibility auto-approval attempt triggers SECURITY_VIOLATION")
    void testUnauthorizedMarketplaceEligibilityThrows() {
        MLPredictResponse response = new MLPredictResponse();
        response.setModelVersion("1.0.0");
        response.setDisplayRecommendation("RESTORE");
        response.setRecommendedAction("REPAIR");
        response.setExplanation("Valid explanation");
        response.setConfidenceLevel("HIGH");
        response.setMarketplaceEligibility("APPROVED_FOR_SALE"); // Forbidden automated approval!

        MLClientException ex = assertThrows(MLClientException.class, () -> client.validateResponse(response));
        assertEquals("SECURITY_VIOLATION", ex.getReasonCategory());
    }

    @Test
    @DisplayName("Inconsistent safety gate flag throws MLClientException")
    void testInconsistentSafetyGateThrows() {
        MLPredictResponse response = new MLPredictResponse();
        response.setModelVersion("1.0.0");
        response.setSafetyGateTriggered(true);
        response.setDisplayRecommendation("RESTORE"); // Inconsistent! Should be SPECIAL_HANDLING
        response.setRecommendedAction("REPAIR");
        response.setExplanation("Safety triggered but action is restore");
        response.setConfidenceLevel("HIGH");

        MLClientException ex = assertThrows(MLClientException.class, () -> client.validateResponse(response));
        assertEquals("INCONSISTENT_SAFETY", ex.getReasonCategory());
    }

    @Test
    @DisplayName("Disabled ML service throws MLClientException without attempting connection")
    void testDisabledServiceThrowsImmediately() {
        properties.setEnabled(false);
        MLInferenceClient disabledClient = new MLInferenceClient(properties);

        MLPredictRequest request = new MLPredictRequest();
        request.setCategory("LAPTOP");

        MLClientException ex = assertThrows(MLClientException.class, () -> disabledClient.predict(request));
        assertEquals("ML_DISABLED", ex.getReasonCategory());
    }
}
