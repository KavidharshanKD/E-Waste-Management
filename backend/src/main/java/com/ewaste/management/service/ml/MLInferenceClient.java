package com.ewaste.management.service.ml;

import com.ewaste.management.config.MLServiceProperties;
import com.ewaste.management.dto.ml.MLPredictRequest;
import com.ewaste.management.dto.ml.MLPredictResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.ResourceAccessException;

import java.time.Duration;
import java.util.Set;

/**
 * HTTP Client communicating with the standalone FastAPI ML Inference Service.
 * Built with Spring 3.4's native RestClient with configured connect and read timeouts.
 */
@Component
public class MLInferenceClient implements MLInferenceProvider {

    private static final Logger log = LoggerFactory.getLogger(MLInferenceClient.class);

    private static final Set<String> ALLOWED_RECOVERY_STATUSES = Set.of(
            "RECOVERY_FEASIBLE", "AMBIGUOUS_TRIAGE", "RECOVERY_UNLIKELY", "SPECIAL_HANDLING"
    );

    private static final Set<String> ALLOWED_MARKETPLACE_ELIGIBILITIES = Set.of(
            "NOT_ASSESSED", "TECHNICIAN_REVIEW_REQUIRED"
    );

    private final MLServiceProperties properties;
    private final RestClient restClient;

    public MLInferenceClient(MLServiceProperties properties) {
        this.properties = properties;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(properties.getConnectTimeoutMs()));
        requestFactory.setReadTimeout(Duration.ofMillis(properties.getReadTimeoutMs()));

        this.restClient = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * Sends POST /predict request to FastAPI and returns validated MLPredictResponse.
     * Throws MLClientException if request fails, times out, or response violates contract.
     */
    public MLPredictResponse predict(MLPredictRequest request) {
        if (!properties.isEnabled()) {
            throw new MLClientException("ML service is disabled by configuration", "ML_DISABLED");
        }

        long startTime = System.currentTimeMillis();
        try {
            log.info("Sending prediction request to ML service: category={}, condition={}",
                    request.getCategory(), request.getCondition());

            MLPredictResponse response = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        String body = new String(res.getBody().readAllBytes());
                        log.error("ML service 4xx Client Error: status={}, body={}", res.getStatusCode(), body);
                        throw new MLClientException("ML service rejected request: " + body, "CLIENT_CONTRACT_ERROR", res.getStatusCode().value());
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                        String body = new String(res.getBody().readAllBytes());
                        log.error("ML service 5xx Server Error: status={}, body={}", res.getStatusCode(), body);
                        throw new MLClientException("ML service internal error: " + body, "SERVER_ERROR", res.getStatusCode().value());
                    })
                    .body(MLPredictResponse.class);

            long duration = System.currentTimeMillis() - startTime;
            log.info("ML inference response received in {}ms: modelVersion={}, recoveryStatus={}, displayRecommendation={}",
                    duration,
                    response != null ? response.getModelVersion() : "null",
                    response != null ? response.getRecoveryStatus() : "null",
                    response != null ? response.getDisplayRecommendation() : "null");

            validateResponse(response);
            return response;

        } catch (ResourceAccessException e) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("ML service network/timeout error after {}ms: {}", duration, e.getMessage());
            throw new MLClientException("ML service network or timeout failure: " + e.getMessage(), "NETWORK_OR_TIMEOUT", e);
        } catch (MLClientException e) {
            throw e;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("ML inference unexpected exception after {}ms: {}", duration, e.getMessage());
            throw new MLClientException("Unexpected error during ML inference: " + e.getMessage(), "UNEXPECTED_ERROR", e);
        }
    }

    /**
     * Validates the integrity of the response from the remote ML service.
     */
    public void validateResponse(MLPredictResponse response) {
        if (response == null) {
            throw new MLClientException("ML response is null", "RESPONSE_NULL");
        }

        if (response.getModelVersion() == null || response.getModelVersion().isBlank()) {
            throw new MLClientException("ML response missing model_version", "INVALID_RESPONSE_SCHEMA");
        }

        if (response.getDisplayRecommendation() == null || response.getDisplayRecommendation().isBlank()) {
            throw new MLClientException("ML response missing display_recommendation", "INVALID_RESPONSE_SCHEMA");
        }

        if (response.getRecommendedAction() == null || response.getRecommendedAction().isBlank()) {
            throw new MLClientException("ML response missing recommended_action", "INVALID_RESPONSE_SCHEMA");
        }

        if (response.getExplanation() == null || response.getExplanation().isBlank()) {
            throw new MLClientException("ML response missing explanation", "INVALID_RESPONSE_SCHEMA");
        }

        if (response.getConfidenceLevel() == null || response.getConfidenceLevel().isBlank()) {
            throw new MLClientException("ML response missing confidence_level", "INVALID_RESPONSE_SCHEMA");
        }

        // Validate recovery probability bounds if present
        if (response.getRecoveryProbability() != null) {
            double p = response.getRecoveryProbability();
            if (p < 0.0 || p > 1.0 || Double.isNaN(p)) {
                throw new MLClientException("Invalid recovery_probability: " + p, "INVALID_PROBABILITY");
            }
        }

        // Validate pathway probability bounds if present
        if (response.getPathwayProbability() != null) {
            double p = response.getPathwayProbability();
            if (p < 0.0 || p > 1.0 || Double.isNaN(p)) {
                throw new MLClientException("Invalid pathway_probability: " + p, "INVALID_PROBABILITY");
            }
        }

        // Validate recovery status
        if (response.getRecoveryStatus() != null && !ALLOWED_RECOVERY_STATUSES.contains(response.getRecoveryStatus())) {
            throw new MLClientException("Unknown recovery_status: " + response.getRecoveryStatus(), "INVALID_STATUS");
        }

        // Validate marketplace eligibility
        if (response.getMarketplaceEligibility() != null && !ALLOWED_MARKETPLACE_ELIGIBILITIES.contains(response.getMarketplaceEligibility())) {
            throw new MLClientException("Unauthorized marketplace_eligibility: " + response.getMarketplaceEligibility(), "SECURITY_VIOLATION");
        }

        // Check safety gate consistency
        if (Boolean.TRUE.equals(response.getSafetyGateTriggered())) {
            if (!"SPECIAL_HANDLING".equals(response.getDisplayRecommendation())) {
                throw new MLClientException("Inconsistent safety gate response", "INCONSISTENT_SAFETY");
            }
        }
    }
}
