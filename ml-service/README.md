# Smart E-Waste Machine Learning Subsystem (`ml-service`)

Smart E-Waste Management uses a locally trained hierarchical machine learning pipeline grounded in Open Repair Alliance and TU Delft lifecycle data. A calibrated recovery-feasibility classifier and circular-pathway classifier provide explainable device disposition recommendations, while hazardous-device rules and technician review protect safety-critical and diagnostically uncertain cases.

> [!NOTE]
> **Scientific Integrity & Scope**: The platform does **not** claim that AI automatically determines exact resale prices or fully diagnoses internal hardware faults without technician inspection. Marketplace commercial eligibility, cosmetic grading (Grade A/B/C), and secondary pricing are human-governed (Option A: Technician & Admin Appraisal).

---

## Production Decision Architecture

The system executes a 4-stage recommendation pipeline:
1. **Stage 0: Deterministic Safety Gate**: Hardware safety screening for thermal and chemical hazard flags (`battery_swollen`, `battery_leaking`, `overheating_evidence`, `severe_physical_damage`) routing deterministically to `SPECIAL_HANDLING`. All downstream ML models are completely bypassed.
2. **Stage 1: Recovery Feasibility ML (Calibrated Logistic Regression)**: Evaluates community-level recovery likelihood using a 3-zone conservative triage gate ($P < 0.35 \rightarrow$ `RECOVERY_FEASIBLE`; $0.35 \le P < 0.70 \rightarrow$ `AMBIGUOUS_TRIAGE` with mandatory technician review; $P \ge 0.70 \rightarrow$ `RECOVERY_UNLIKELY` candidate for responsible material recycling).
3. **Stage 2: Circular Pathway ML (Multi-Class Random Forest)**: Evaluates circular actions across `KEEP_USING`, `REPAIR`, `REFURBISH`, `REFURBISH_AND_SELL`, and `DONATE`.
   - **`RESTORE` Abstraction**: Maps both `REPAIR` and `REFURBISH` into a unified citizen-facing recommendation (`RESTORE`) requiring bench technician triage to select single-part repair vs full refurbishment.
   - **`POTENTIAL_RESALE_CANDIDATE`**: Highlights resale potential while mandating human appraisal for marketplace listing.
4. **Stage 3: User Intention Policy Layer**: Validates citizen preference against technical feasibility without allowing user intention to override safety hazards or high-confidence recycling warnings.

---

## Standalone Inference Service

The ML service is packaged as a standalone Python FastAPI microservice:
- **Endpoints**:
  - `GET /health`: Health and readiness probe.
  - `GET /version`: Model versioning and configuration metadata.
  - `POST /predict`: Full hierarchical recommendation inference.

### Quickstart (Local Execution)

```powershell
# 1. Install dependencies
pip install -r ml-service/requirements.txt

# 2. Export production models
python ml-service/src/export_production_models.py

# 3. Start inference server
cd ml-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Running Tests

```powershell
python -m unittest discover -s ml-service/tests
```
*(67 tests passing covering data validation, preprocessing, model training, conservative gating, and FastAPI inference).*

---

## Directory Structure

```
ml-service/
├── Dockerfile                  # Container packaging for deployment
├── README.md                   # ML subsystem overview & positioning
├── requirements.txt            # Pinned dependencies
├── app/                        # Standalone FastAPI inference application
│   ├── __init__.py
│   ├── config.py               # Versioned thresholds & constants
│   ├── explanations.py         # Deterministic explanation builder
│   ├── inference.py            # Model manager & pipeline execution
│   ├── main.py                 # FastAPI application routes
│   ├── pipelines.py            # Canonical pipeline wrapper classes
│   ├── policy.py               # User intention policy evaluation
│   ├── safety.py               # Stage 0 deterministic safety gate
│   └── schemas.py              # Pydantic request/response schemas
├── data/                       # Dataset directories (external/processed git-ignored)
├── models/                     # Versioned models & manifest
│   ├── level1_recovery_pipeline.joblib (git-ignored)
│   ├── level2_pathway_pipeline.joblib  (git-ignored)
│   └── model_manifest.json     # Tracked metadata
├── src/                        # Dataset generation & training pipelines
│   ├── dataset_schema.py
│   ├── export_production_models.py
│   ├── model_quality_review.py
│   ├── preprocessing.py
│   └── train_evaluate.py
└── tests/                      # Unit and integration test suite
    ├── test_dataset_generation.py
    ├── test_inference_service.py
    ├── test_model_quality_review.py
    ├── test_model_training.py
    └── test_preprocessing_pipeline.py
```
