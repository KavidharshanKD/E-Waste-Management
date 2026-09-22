# Frontend ML Recommendation API Contract Documentation

## 1. Overview & Core Decision Principles

In the Smart E-Waste Management System (Modules 1, 6, and 7):
- **Option A Decision Model**: ML serves as an advisory decision support system identifying circular pathway candidates.
- **ML Does NOT**:
  - Automatically diagnose internal hardware faults with technician-level certainty.
  - Automatically determine commercial selling price or marketplace profitability.
  - Automatically publish devices to the marketplace.
- **Human Operational In-The-Loop**:
  - Physical inspection and repairability verification is executed by authorized facility technicians after collection.
  - Marketplace publishing is authorized by administrators.

---

## 2. API Endpoints Exposing ML Recommendations

ML evaluation is automatically triggered when a user or institution registers a device:

1. **User E-Waste Submission**:
   - `POST /api/user/ewaste` (JSON or Multipart with photo)
   - Response: `DisposalRequestDTO` (includes embedded recommendation and ML audit metadata)
2. **User E-Waste Request Retrieval**:
   - `GET /api/user/ewaste/{id}`
   - Response: `DisposalRequestDTO`
3. **Public Tracking**:
   - `GET /api/public/track/{trackingNumber}`
   - Response: `PublicTrackDTO` (includes `recommendedAction` and `processingStage`)
4. **Technician Assessment Console**:
   - `GET /api/recycler/requests/{id}/assessment`
   - Response: `AssessmentResponseDTO` (compares initial ML recommendation side-by-side with physical diagnostic findings)

---

## 3. Actual Backend ML Contract Fields

The recommendation response is encapsulated in `DisposalRecommendationResult` and mapped into `DisposalRequestDTO` and `AssessmentResponseDTO`:

| Field Name | Type | Enum / Allowed Values | Backend Source | Description |
|---|---|---|---|---|
| `recommendedAction` | `DisposalAction` | `REUSE`, `REPAIR`, `DONATE`, `REFURBISH`, `RECYCLE`, `SPECIAL_HANDLING` | `DisposalAction.java` | Final resolved recommendation after safety checks and human priors. |
| `explanation` | `string` | Free text | Backend Service | User-friendly explanation of why the action was recommended. |
| `handlingAdvice` | `string` | Free text (optional) | Backend Service | Specific safety or packaging warnings (e.g. hazardous battery handling). |
| `disclaimer` | `string` | Fixed string | Backend Service | Advisory disclaimer indicating that automated evaluation does not replace inspection. |
| `recommendationSource` | `RecommendationSource` | `ML`, `RULE_BASED_FALLBACK`, `SAFETY_RULE` | `RecommendationSource.java` | Origin of the recommendation (indicates whether ML service or fallback rule was used). |
| `modelVersion` | `string` | e.g. `"fastapi-rf-v1.0.0"` or `null` | ML Client | Model version identifier if resolved via ML inference. |
| `recoveryStatus` | `string` | `"RECOVERABLE"`, `"NON_RECOVERABLE"` | ML Output | Binary macro recovery classification. |
| `recoveryProbability` | `Double` | `0.00` to `1.00` | ML Output | Model confidence probability of circular recoverability. |
| `rawPathway` | `string` | `"REPAIR"`, `"REFURBISH"`, `"RECYCLE"`, `"SPECIAL_HANDLING"` | ML Output | Unadjusted algorithmic output prior to intention arbitration. |
| `displayRecommendation` | `string` | e.g. `"REFURBISH"` | ML Mapper | Formatted display recommendation. |
| `pathwayProbability` | `Double` | `0.00` to `1.00` | ML Output | Probability score assigned to the chosen circular pathway. |
| `confidenceLevel` | `string` | `"HIGH"`, `"MEDIUM"`, `"LOW"` | ML Mapper | Confidence bracket derived from probability score. |
| `technicianReviewRequired` | `Boolean` | `true`, `false` | ML Rules | Set to `true` when confidence is borderline or conflict exists with user intention. |
| `inspectionRecommended` | `Boolean` | `true`, `false` | ML Rules | Set to `true` when physical bench diagnostics are recommended. |
| `marketplaceEligibility` | `string` | `"ELIGIBLE_FOR_ASSESSMENT"`, `"NOT_ELIGIBLE"`, `"NOT_ASSESSED"` | ML Mapper | Advisory eligibility indicating whether device should be assessed for refurbishment resale. |
| `mlExplanation` | `string` | Free text | ML Client | Technical model diagnostic explanation. |

---

## 4. Example Response Payloads

### 4.1. High-Confidence ML Inference (Refurbish Candidate)
```json
{
  "recommendedAction": "REFURBISH",
  "explanation": "Device is 2 years old, powers on, and has an intact display. Strong candidate for circular component renewal.",
  "handlingAdvice": "Wipe device storage and pack with original charger if available.",
  "recommendationSource": "ML",
  "modelVersion": "fastapi-rf-v1.0.0",
  "recoveryStatus": "RECOVERABLE",
  "recoveryProbability": 0.89,
  "rawPathway": "REFURBISH",
  "pathwayProbability": 0.82,
  "confidenceLevel": "HIGH",
  "technicianReviewRequired": false,
  "inspectionRecommended": true,
  "marketplaceEligibility": "ELIGIBLE_FOR_ASSESSMENT",
  "mlExplanation": "Feature weights indicate low age and functioning power subsystem justify refurbishment pathway."
}
```

### 4.2. Safety Rule Bypass (Deterministic Swollen Battery Hazard)
```json
{
  "recommendedAction": "SPECIAL_HANDLING",
  "explanation": "CRITICAL HAZARD: Physical assessment indicated a swollen or leaking battery. Direct ML inference was bypassed for operator safety.",
  "handlingAdvice": "Do not attempt to charge or power on this device. Place in a fireproof container away from flammable materials.",
  "recommendationSource": "SAFETY_RULE",
  "modelVersion": null,
  "confidenceLevel": "HIGH",
  "technicianReviewRequired": true,
  "inspectionRecommended": true,
  "marketplaceEligibility": "NOT_ELIGIBLE"
}
```

### 4.3. Rule-Based Fallback (Offline ML Service)
```json
{
  "recommendedAction": "REPAIR",
  "explanation": "Evaluated using deterministic circular rules based on device category, physical condition, and user intention.",
  "recommendationSource": "RULE_BASED_FALLBACK",
  "modelVersion": null,
  "recoveryProbability": null,
  "confidenceLevel": "MEDIUM",
  "technicianReviewRequired": true,
  "marketplaceEligibility": "NOT_ASSESSED"
}
```

---

## 5. Fields Explicitly Unavailable / NOT Implemented

The following fields do **NOT** exist in the backend and must **NEVER** be fabricated or assumed by frontend components:
- **No Automated Resale Price**: The ML service does not predict selling prices (prices are manually drafted by facilities and approved by admins).
- **No Image Computer Vision Fault Detection**: Images are uploaded for human visual inspection, not analyzed by neural vision models.
- **No Automated Marketplace Approval**: Neither ML nor physical assessment can autonomously publish a listing.
- **No Fabricated Confidence**: When `recommendationSource === "RULE_BASED_FALLBACK"`, `recoveryProbability` is null; the frontend must not generate synthetic percentages.
