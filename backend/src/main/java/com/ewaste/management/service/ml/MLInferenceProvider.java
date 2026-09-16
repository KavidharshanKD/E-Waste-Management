package com.ewaste.management.service.ml;

import com.ewaste.management.dto.ml.MLPredictRequest;
import com.ewaste.management.dto.ml.MLPredictResponse;

public interface MLInferenceProvider {
    MLPredictResponse predict(MLPredictRequest request);
    void validateResponse(MLPredictResponse response);
}
