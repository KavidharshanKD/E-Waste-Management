"""
Standalone Production FastAPI Inference Service for E-Waste Recommendations.
Exposes /health, /version, and /predict endpoints.
Executes deterministic safety gate, calibrated Level 1, Level 2 circular pathway, and intention policy.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    SERVICE_NAME,
    SERVICE_VERSION,
    MODEL_VERSION,
    DATASET_VERSION,
    ACTION_SPECIAL_HANDLING,
    ACTION_RECYCLE,
    STATUS_SPECIAL_HANDLING,
    STATUS_RECOVERY_UNLIKELY,
    MARKETPLACE_NOT_ASSESSED,
)
from app.schemas import (
    PredictRequest,
    PredictResponse,
    HealthResponse,
    VersionResponse,
)
from app.safety import evaluate_safety_gate
from app.inference import model_manager
from app.policy import evaluate_user_intention_policy
from app.explanations import build_explanation


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load production ML pipelines into memory once at application startup."""
    try:
        model_manager.load_models()
        print(f"[INFO] {SERVICE_NAME} v{SERVICE_VERSION} initialized successfully. Models loaded.")
    except Exception as e:
        print(f"[FATAL] Failed to load production ML models on startup: {e}")
        # Allow server to start so /health can report unhealthy status rather than ungraceful crash
    yield


app = FastAPI(
    title="Smart E-Waste Recommendation Inference Service",
    description="Standalone Python ML inference service for recovery feasibility and circular pathway disposition.",
    version=SERVICE_VERSION,
    lifespan=lifespan,
)

# CORS configuration for internal microservice communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["Monitoring"])
async def health_check():
    """Service health and model readiness probe."""
    is_healthy = model_manager.is_loaded
    return HealthResponse(
        status="UP" if is_healthy else "DEGRADED",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        models_loaded=is_healthy,
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/version", response_model=VersionResponse, tags=["Monitoring"])
async def version_info():
    """Safe model metadata, configuration thresholds, and versioning info."""
    if not model_manager.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Models not loaded. Run export_production_models.py.",
        )

    manifest = model_manager.manifest
    return VersionResponse(
        service_name=SERVICE_NAME,
        service_version=SERVICE_VERSION,
        model_version=manifest.get("model_version", MODEL_VERSION),
        dataset_version=manifest.get("dataset_version", DATASET_VERSION),
        git_commit=manifest.get("git_commit", "UNKNOWN"),
        level1_algorithm=manifest.get("level1_model", {}).get("algorithm", "LogisticRegression"),
        level2_algorithm=manifest.get("level2_model", {}).get("algorithm", "RandomForest"),
        thresholds=manifest.get("level1_model", {}).get("conservative_gate_thresholds", {}),
        marketplace_policy=manifest.get("marketplace_policy", {}).get("mode", "OPTION_A_HUMAN_IN_THE_LOOP"),
    )


@app.post("/predict", response_model=PredictResponse, tags=["Recommendation"])
async def predict_device_recommendation(request: PredictRequest):
    """
    Execute full hierarchical recommendation pipeline:
    1. Stage 0: Deterministic Safety Gate
    2. Stage 1: Level 1 Recovery Feasibility ML (Calibrated Logistic Regression)
    3. Stage 2: Level 2 Circular Pathway ML (Random Forest with RESTORE abstraction)
    4. Stage 3: User Intention Policy Layer
    5. Structured Explainability Generation
    """
    if not model_manager.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Inference engine unavailable. Production models not loaded.",
        )

    # --------------------------------------------------------------------------
    # STAGE 0: DETERMINISTIC SAFETY GATE (ABOVE AND BEFORE ALL ML)
    # --------------------------------------------------------------------------
    is_hazardous, safety_reasons = evaluate_safety_gate(request)
    if is_hazardous:
        explanation = build_explanation(
            category=request.category,
            age=request.approx_age_years,
            condition=request.condition,
            powers_on=request.powers_on,
            screen=request.screen_condition,
            battery=request.battery_condition,
            damage=request.damage_severity,
            safety_triggered=True,
            safety_reasons=safety_reasons,
            recovery_status=STATUS_SPECIAL_HANDLING,
            recovery_prob=None,
            display_rec=ACTION_SPECIAL_HANDLING,
            raw_pathway=None,
            confidence_level="HIGH",
            technician_review=True,
            policy_note="Immediate safety quarantine enforced. ML models bypassed.",
        )
        return PredictResponse(
            model_version=model_manager.manifest.get("model_version", MODEL_VERSION),
            safety_gate_triggered=True,
            safety_reasons=safety_reasons,
            recovery_status=STATUS_SPECIAL_HANDLING,
            recovery_probability=None,
            raw_pathway_prediction=None,
            display_recommendation=ACTION_SPECIAL_HANDLING,
            pathway_probability=None,
            confidence_level="HIGH",
            technician_review_required=True,
            inspection_recommended=False,
            user_intention=request.user_intention,
            intention_compatibility="NOT_APPLICABLE" if request.user_intention == "UNSURE" else "CONFLICT",
            recommended_action=ACTION_SPECIAL_HANDLING,
            explanation=explanation,
            marketplace_eligibility=MARKETPLACE_NOT_ASSESSED,
            pathway_probabilities=None,
        )

    # --------------------------------------------------------------------------
    # STAGE 1: RECOVERY FEASIBILITY ML (CALIBRATED LOGISTIC REGRESSION)
    # --------------------------------------------------------------------------
    p_eol, recovery_status, l1_tech_review, allow_level2 = model_manager.predict_level1(request)

    # --------------------------------------------------------------------------
    # STAGE 2: CIRCULAR PATHWAY ML (RANDOM FOREST WITH RESTORE ABSTRACTION)
    # --------------------------------------------------------------------------
    if not allow_level2:
        # High confidence end-of-life (Zone 3: P(EOL) >= 0.70)
        raw_pathway = None
        display_rec = ACTION_RECYCLE
        pathway_prob = None
        confidence_level = "HIGH"
        technician_review = False
        inspection_rec = False
        marketplace_status = MARKETPLACE_NOT_ASSESSED
        pathway_probas = None
    else:
        (
            raw_pathway,
            display_rec,
            pathway_prob,
            confidence_level,
            l2_tech_review,
            inspection_rec,
            marketplace_status,
            pathway_probas,
        ) = model_manager.predict_level2(request)
        technician_review = l1_tech_review or l2_tech_review

    # --------------------------------------------------------------------------
    # STAGE 3: USER INTENTION POLICY LAYER
    # --------------------------------------------------------------------------
    final_action, intention_compat, policy_note = evaluate_user_intention_policy(
        display_rec=display_rec,
        recovery_status=recovery_status,
        technician_review_required=technician_review,
        user_intention=request.user_intention,
    )

    # --------------------------------------------------------------------------
    # STRUCTURED EXPLANATION GENERATION
    # --------------------------------------------------------------------------
    explanation = build_explanation(
        category=request.category,
        age=request.approx_age_years,
        condition=request.condition,
        powers_on=request.powers_on,
        screen=request.screen_condition,
        battery=request.battery_condition,
        damage=request.damage_severity,
        safety_triggered=False,
        safety_reasons=[],
        recovery_status=recovery_status,
        recovery_prob=p_eol,
        display_rec=display_rec,
        raw_pathway=raw_pathway,
        confidence_level=confidence_level,
        technician_review=technician_review,
        policy_note=policy_note,
    )

    return PredictResponse(
        model_version=model_manager.manifest.get("model_version", MODEL_VERSION),
        safety_gate_triggered=False,
        safety_reasons=[],
        recovery_status=recovery_status,
        recovery_probability=round(p_eol, 4),
        raw_pathway_prediction=raw_pathway,
        display_recommendation=display_rec,
        pathway_probability=pathway_prob,
        confidence_level=confidence_level,
        technician_review_required=technician_review,
        inspection_recommended=inspection_rec,
        user_intention=request.user_intention,
        intention_compatibility=intention_compat,
        recommended_action=final_action,
        explanation=explanation,
        marketplace_eligibility=marketplace_status,
        pathway_probabilities=pathway_probas,
    )
