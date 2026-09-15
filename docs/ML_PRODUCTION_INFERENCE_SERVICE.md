# Standalone Production ML Inference Service Documentation
## Module 5: Architecture, Serialization, REST Endpoints, and Operational Guide

**Service Name:** `ewaste-ml-inference-service`  
**Version:** `1.0.0`  
**Dataset Grounding:** Open Repair Alliance (202507) & TU Delft Consumer Durability Survey  
**Framework:** FastAPI + scikit-learn + joblib + Pydantic v2  
**Containerization:** Docker (Python 3.11-slim)  
**Status:** Validated, Tested (67 Tests Passing), Ready for Module 6 Integration  

---

## 1. System Architecture

The Smart E-Waste Management System implements a locally trained, hierarchical, hybrid machine learning intelligence pipeline. It rejects naive single-model classification in favor of a 4-stage decision pipeline that combines physical safety screening, probabilistic recovery gating, multi-class circular disposition, and a post-ML policy layer:

```
                                USER INTAKE REQUEST
                                         │
                                         ▼
                        [STAGE 0: DETERMINISTIC SAFETY GATE]
                (Battery swelling, leakage, overheating, severe crushing)
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
                      HAZARD                           CLEAR
                         │                               │
                         ▼                               ▼
              [SPECIAL_HANDLING]             [STAGE 1: RECOVERY FEASIBILITY]
            (Immediate Quarantine;         (Calibrated Logistic Regression)
               ML Bypassed)                              │
                                         ┌───────────────┼───────────────┐
                                         ▼               ▼               ▼
                                   P(EOL) < 0.35   0.35 <= P < 0.70  P >= 0.70
                                   RECOVERY_FEASIBLE AMBIGUOUS_TRIAGE RECOVERY_UNLIKELY
                                         │               │               │
                                         │       ┌───────┴───────┐       ▼
                                         │       │ Flag:         │   [RECYCLE]
                                         │       │ Technician    │ (Direct Material
                                         │       │ Review Req.   │  Recovery)
                                         │       └───────┬───────┘
                                         ▼               ▼
                                   [STAGE 2: CIRCULAR PATHWAY ML]
                                   (Multi-Class Random Forest)
                                         │
                         ┌───────────────┼───────────────┐
                         ▼               ▼               ▼
                  REPAIR / REFURBISH   REFURBISH_AND_SELL OTHER
                         │               │               │
                         ▼               ▼               ▼
                     [RESTORE]       [POTENTIAL_RESALE]  KEEP_USING
                  (Citizen display;  (Human technician   DONATE
                   technician bench   appraisal req.)
                   determines fix)
                                         │
                                         ▼
                         [STAGE 3: USER INTENTION POLICY LAYER]
                    (Cannot override Safety, High-EOL, or Tech Review;
                     determines preference compatibility)
                                         │
                                         ▼
                         [EXPLAINABLE STRUCTURED ADVICE]
```

---

## 2. Production Model Artifacts

Production artifacts are bundled into self-contained, versioned pipelines that encapsulate both scikit-learn preprocessing transformers and calibrated estimators:

| Artifact File | Contents | Features Encapsulated | Model Algorithm |
|---|---|---|---|
| `ml-service/models/level1_recovery_pipeline.joblib` | `Level1Preprocessor` + Calibrated Model | `category`, `approx_age_years`, `condition` | Logistic Regression ($C=0.1$, balanced) + Sigmoid (Platt) Calibration |
| `ml-service/models/level2_pathway_pipeline.joblib` | `Level2Preprocessor` + Fitted Estimator | `category`, `approx_age_years`, `condition`, `powers_on`, `screen_condition`, `battery_condition`, `damage_severity` | Random Forest ($n=100$, depth=8, leaf=3, balanced) |
| `ml-service/models/model_manifest.json` | Non-sensitive JSON metadata | Thresholds, algorithms, classes, git commit hash | N/A |

### Zero-Binary Git Policy
All binary artifacts (`*.joblib`, `*.pkl`) are strictly ignored in `.gitignore`. The repository stores only the reproducible export script (`export_production_models.py`), training source code, and configuration. Binary models are generated on build or runtime.

---

## 3. Training and Serialization Procedure

To reproducibly train and export the production model artifacts:

```powershell
# From the repository root
python ml-service/src/export_production_models.py
```

The script performs the following:
1. Loads the processed real dataset `physical_feasibility_real.csv` and circular dataset `circular_pathway_development.csv`.
2. Fits `Level1Preprocessor` on Train split, trains `LogisticRegression(C=0.1, class_weight='balanced')`, and applies Platt scaling calibration on the Validation split.
3. Fits `Level2Preprocessor` on Train split and fits `RandomForestClassifier(n_estimators=100, max_depth=8, min_samples_leaf=3)`.
4. Serializes both pipelines via `joblib.dump` into `ml-service/models/`.
5. Automatically generates `ml-service/models/model_manifest.json` with the current Git commit hash and UTC timestamp.
6. Runs deserialization and inference verification against benchmark hardware scenarios.

---

## 4. Model Versioning & Manifest Schema

The manifest file `ml-service/models/model_manifest.json` provides an immutable record of active model configuration:

```json
{
  "service_name": "ewaste-ml-inference-service",
  "model_version": "1.0.0",
  "dataset_version": "2025.07",
  "training_timestamp_utc": "2026-09-15T10:12:48.330440+00:00",
  "git_commit": "f0cb4ca",
  "level1_model": {
    "name": "RecoveryFeasibilityClassifier",
    "algorithm": "LogisticRegression(C=0.1, class_weight='balanced')",
    "calibration_method": "CalibratedClassifierCV(method='sigmoid', cv='prefit')",
    "target_column": "feasibility_label",
    "classes": ["SALVAGEABLE", "END_OF_LIFE"],
    "features": ["category", "approx_age_years", "condition"],
    "conservative_gate_thresholds": {
      "recovery_feasible_upper": 0.35,
      "recovery_unlikely_lower": 0.70
    }
  },
  "level2_model": {
    "name": "CircularPathwayClassifier",
    "algorithm": "RandomForestClassifier(n_estimators=100, max_depth=8, min_samples_leaf=3, class_weight='balanced')",
    "target_column": "circular_action",
    "classes": ["KEEP_USING", "REPAIR", "REFURBISH", "REFURBISH_AND_SELL", "DONATE"],
    "features": [
      "category", "approx_age_years", "condition", "powers_on",
      "screen_condition", "battery_condition", "damage_severity"
    ],
    "confidence_thresholds": {
      "high": 0.70,
      "medium": 0.40,
      "low": 0.0
    }
  }
}
```

---

## 5. Stage 0: Deterministic Safety Gate

Safety is paramount and evaluated **above and before all ML models**.  
If any of the following conditions are reported:
- `battery_swollen: true`
- `battery_leaking: true`
- `overheating_evidence: true`
- `severe_physical_damage: true` or `condition: "HAZARDOUS"`

The service **immediately intercepts** the request:
- Returns `recommended_action: "SPECIAL_HANDLING"`.
- `safety_gate_triggered: true` with non-exaggerated, clear hazard descriptions.
- `recovery_status: "SPECIAL_HANDLING"`.
- **Level 1 and Level 2 ML models are completely bypassed.**

---

## 6. Stage 1: Level 1 Recovery Feasibility Semantics

In real-world data (Open Repair Alliance), **85.7% of End-of-Life records represent non-physical barriers** (spare parts too expensive, lack of schematics, community repair time limits). Level 1 therefore does NOT indicate physical molecular impossibility; it represents **Recovery Feasibility in a municipal/community operational setting**.

Internal semantic states:
- `RECOVERY_FEASIBLE`: High confidence of operational recovery.
- `AMBIGUOUS_TRIAGE`: Unclear physical recovery potential; salvage must be protected.
- `RECOVERY_UNLIKELY`: High confidence of severe terminal failure; candidate for materials recycling.

---

## 7. 3-Zone Conservative Triage Gating

To eliminate premature destruction of repairable hardware (Error B), the service applies a 3-zone conservative triage gate using calibrated probability $P(\text{EOL})$:

| Calibrated $P(\text{EOL})$ | Triage Zone | Gate Action | Technician Review |
|---|---|---|---|
| **$P < 0.35$** | **Zone 1: `RECOVERY_FEASIBLE`** | Forwards directly to Level 2 circular pathway | Conditional on Level 2 |
| **$0.35 \le P < 0.70$** | **Zone 2: `AMBIGUOUS_TRIAGE`** | **DO NOT RECYCLE.** Evaluated by Level 2; flagged for bench review | **MANDATORY (`true`)** |
| **$P \ge 0.70$** | **Zone 3: `RECOVERY_UNLIKELY`** | Bypasses Level 2; direct candidate for responsible `RECYCLE` | False (Direct Recycling) |

*Thresholds are stored in `app/config.py` and documented in `model_manifest.json`.*

---

## 8. Stage 2: Level 2 Circular Pathway Model

Salvageable devices are evaluated by a multi-class Random Forest predicting disposition across:
- `KEEP_USING` (healthy hardware)
- `REPAIR` (component replacement)
- `REFURBISH` (comprehensive overhaul)
- `REFURBISH_AND_SELL` (high recovery resale)
- `DONATE` (educational/community utility)

---

## 9. Citizen-Facing `RESTORE` Abstraction

Deciding between a single-part replacement (`REPAIR`) versus a multi-stage overhaul (`REFURBISH`) requires physical teardown and diagnostic bench equipment. Citizen self-service intake telemetry cannot distinguish them.

Therefore, the service implements the **`RESTORE` Abstraction**:
- Both raw `REPAIR` and `REFURBISH` predictions are presented to citizens as **`display_recommendation: "RESTORE"`**.
- `technician_review_required` is set to `true`.
- The explanation states:  
  *"The device appears suitable for restoration. A technician inspection will determine whether a targeted repair or full refurbishment is most appropriate."*
- Raw ML predictions are preserved in `raw_pathway_prediction` for auditability.

---

## 10. `POTENTIAL_RESALE_CANDIDATE` & Marketplace Policy

When the model predicts `REFURBISH_AND_SELL`:
- Presented to citizens as: **`display_recommendation: "POTENTIAL_RESALE_CANDIDATE"`**.
- Commercial marketplace status: **`marketplace_eligibility: "TECHNICIAN_REVIEW_REQUIRED"`**.
- **Crucial Rule:** The ML model **NEVER** automatically approves a device for commercial sale. Marketplace listing, cosmetic grading (A/B/C), functional testing, and selling price require **human technician/admin appraisal (Option A)**.

---

## 11. Confidence Handling

Confidence is computed directly from scikit-learn `predict_proba`:
- **HIGH ($\ge 0.70$)**: Strong model probability.
- **MEDIUM ($0.40 \le P < 0.70$)**: Moderate model probability.
- **LOW ($P < 0.40$)**: High uncertainty; forces `confidence_level: "LOW"`, `inspection_recommended: true`, and `technician_review_required: true`.
- Zero artificial confidence scores are ever fabricated.

---

## 12. Stage 3: User Intention Policy Layer

Citizen preference (`user_intention`) is evaluated deterministically against technical feasibility:
1. **Safety Precedence**: Stated user preference (even `KEEP_USING`) **CANNOT** override safety hazards. `SPECIAL_HANDLING` is immutable.
2. **Terminal Hardware Warning**: Stated intention **CANNOT** override high-confidence recycling ($P(\text{EOL}) \ge 0.70$). Stating `KEEP_USING` flags an `intention_compatibility: "CONFLICT"`.
3. **Respecting User Choice on Functional Gear**: If ML recommends `KEEP_USING` but citizen chooses `DONATE` or `RECYCLE`, the service marks `intention_compatibility: "COMPATIBLE"` and honors their social or recycling choice.
4. **Unsure Intention**: Defaults seamlessly to the ML recommendation (`intention_compatibility: "NOT_APPLICABLE"`).

---

## 13. Deterministic Explainability

Explanations are constructed deterministically without external LLM APIs (OpenAI/Gemini/Claude). They combine:
1. Hardware physical baseline (category, age, condition).
2. Level 1 recovery status and probability.
3. Level 2 circular pathway advice.
4. Mandatory technician diagnostic notes where uncertainty exists.
5. User intention policy alignment notes.

---

## 14. API Contract & Schemas

### `POST /predict` Request Body
```json
{
  "category": "LAPTOP",
  "approx_age_years": 5.0,
  "condition": "PARTIALLY_WORKING",
  "user_intention": "REPAIR",
  "powers_on": "YES",
  "screen_condition": "CRACKED",
  "battery_condition": "NORMAL",
  "damage_severity": "MODERATE",
  "battery_swollen": false,
  "battery_leaking": false,
  "overheating_evidence": false,
  "severe_physical_damage": false
}
```

### `POST /predict` Response Body
```json
{
  "model_version": "1.0.0",
  "safety_gate_triggered": false,
  "safety_reasons": [],
  "recovery_status": "AMBIGUOUS_TRIAGE",
  "recovery_probability": 0.5658,
  "raw_pathway_prediction": "REPAIR",
  "display_recommendation": "RESTORE",
  "pathway_probability": 0.5234,
  "confidence_level": "MEDIUM",
  "technician_review_required": true,
  "inspection_recommended": false,
  "user_intention": "REPAIR",
  "intention_compatibility": "COMPATIBLE",
  "recommended_action": "RESTORE",
  "explanation": "Based on the reported LAPTOP (5.0 years old, condition: PARTIALLY_WORKING): The device falls into the recovery uncertainty range (56.6% hurdle probability). Physical salvage is protected and technician triage is recommended before any recycling decision. Reported operational telemetry indicates the hardware is suitable for restoration. A technician inspection will determine whether a targeted repair or full refurbishment is most appropriate. Technician bench triage is required to confirm diagnostic status. Policy Note: User preference aligns with device restoration.",
  "marketplace_eligibility": "NOT_ASSESSED",
  "pathway_probabilities": {
    "KEEP_USING": 0.008,
    "REPAIR": 0.5234,
    "REFURBISH": 0.2046,
    "REFURBISH_AND_SELL": 0.0254,
    "DONATE": 0.2387
  }
}
```

---

## 15. Local Execution Guide (Windows / Linux)

### 1. Install Dependencies
```powershell
pip install -r ml-service/requirements.txt
```

### 2. Export Production Models (if not already exported)
```powershell
python ml-service/src/export_production_models.py
```

### 3. Start FastAPI Inference Server
```powershell
# Run from ml-service directory
cd ml-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Probe Health & Version
```powershell
curl http://localhost:8000/health
curl http://localhost:8000/version
```

### 5. Execute Prediction Request
```powershell
curl -X POST http://localhost:8000/predict `
  -H "Content-Type: application/json" `
  -d '{
    "category": "LAPTOP",
    "approx_age_years": 5.0,
    "condition": "PARTIALLY_WORKING",
    "powers_on": "YES",
    "screen_condition": "CRACKED",
    "battery_condition": "NORMAL",
    "damage_severity": "MODERATE",
    "user_intention": "REPAIR"
  }'
```

---

## 16. Docker Execution Guide

### Build Container Image
```bash
docker build -t ewaste-ml-service:1.0.0 -f ml-service/Dockerfile ml-service/
```

### Run Container
```bash
docker run -d -p 8000:8000 -e PORT=8000 --name ewaste-ml-service ewaste-ml-service:1.0.0
```

### Container Healthcheck Probe
```bash
curl http://localhost:8000/health
```

---

## 17. Regression Benchmark Verification

The 5-year-old laptop with a cracked screen was verified across test suites:
- **Module 4 Outcome**: Falsely classified as End-of-Life ($P(\text{EOL}) \approx 78.7\%$) and routed directly to recycling.
- **Module 5 Outcome**: Correctly identified in **`AMBIGUOUS_TRIAGE`** ($P(\text{EOL}) = 56.58\%$). Salvage is protected. Evaluated by Level 2 as `REPAIR` (52.34%), mapped to **`display_recommendation: "RESTORE"`** with **`technician_review_required: true`**.

---

## 18. Future Work: Commercial Refurbishment ML Extension

Marketplace pricing intelligence requires genuine commercial ITAD datasets:
- **Future Inputs**: Device SKU/model, technician labor benchmark hours, real-time parts replacement pricing, secondary marketplace transaction distributions (Cashify, BackMarket, Swappa), battery cycle count.
- **Future Capabilities**: Automated cosmetic grade appraisal (Grade A/B/C), expected profit optimization ($\text{Resale Value} - \text{Parts Cost} - \text{Labor Cost} > 0$), and automated warranty tiering.
- **Current Production Status**: Human technician/admin manual appraisal (Option A).
