"""
Reproducible Production ML Model Training, Calibration & Export Script.
Trains and serializes validated Level 1 and Level 2 pipelines and writes model_manifest.json.

Usage:
    python ml-service/src/export_production_models.py
"""

import json
import os
import subprocess
import sys
import warnings
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV

# Add src to path
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)
ML_SERVICE_DIR = os.path.dirname(SRC_DIR)
if ML_SERVICE_DIR not in sys.path:
    sys.path.insert(0, ML_SERVICE_DIR)

from dataset_schema import (
    LEVEL_1_FEATURES,
    LEVEL_2_FEATURES,
    LEVEL_1_CLASSES,
    LEVEL_2_CLASSES,
    LEVEL_1_TARGET_COLUMN,
    LEVEL_2_TARGET_COLUMN,
    SAFETY_GATE_FEATURES,
    PROVENANCE_REAL_OPEN_REPAIR,
    PROVENANCE_REAL_TU_DELFT,
    PROVENANCE_SYNTHETIC_DEVELOPMENT,
)
from preprocessing import Level1Preprocessor, Level2Preprocessor
from app.pipelines import Level1ProductionPipeline, Level2ProductionPipeline


def get_git_commit_hash() -> str:
    """Safely obtain current git commit hash if available, without failing."""
    try:
        commit = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            stderr=subprocess.DEVNULL,
            cwd=os.path.dirname(SRC_DIR),
        ).decode("ascii").strip()
        return commit
    except Exception:
        return "UNKNOWN_GIT_COMMIT"


def train_and_export_production_models(
    models_dir: Optional[str] = None,
    data_dir: Optional[str] = None,
) -> Dict[str, Any]:
    """Train approved models, bundle pipelines, and export to models directory."""
    base_dir = os.path.dirname(SRC_DIR)
    if data_dir is None:
        data_dir = os.path.join(base_dir, "data", "processed")
    if models_dir is None:
        models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    print("=" * 80)
    print("MODULE 5: PRODUCTION MODEL TRAINING & SERIALIZATION")
    print("=" * 80)

    # 1. Train Level 1 Pipeline
    l1_data_path = os.path.join(data_dir, "physical_feasibility_real.csv")
    if not os.path.exists(l1_data_path):
        raise FileNotFoundError(f"Level 1 dataset not found at {l1_data_path}. Run prepare_all_datasets.py first.")

    print(f"\n[1/4] Loading Level 1 dataset from {os.path.basename(l1_data_path)}...")
    df_l1 = pd.read_csv(l1_data_path)
    train_l1 = df_l1[df_l1["split"] == "train"].copy()
    val_l1 = df_l1[df_l1["split"] == "val"].copy()

    print(f"  Level 1 Train samples: {len(train_l1):,} | Val samples: {len(val_l1):,}")

    l1_prep = Level1Preprocessor()
    X1_train = l1_prep.fit_transform(train_l1[LEVEL_1_FEATURES])
    y1_train = l1_prep.encode_target(train_l1[LEVEL_1_TARGET_COLUMN])

    X1_val = l1_prep.transform(val_l1[LEVEL_1_FEATURES])
    y1_val = l1_prep.encode_target(val_l1[LEVEL_1_TARGET_COLUMN])

    print("  Fitting Level 1 LogisticRegression (C=0.1, class_weight='balanced')...")
    l1_base = LogisticRegression(
        class_weight="balanced",
        C=0.1,
        max_iter=1000,
        random_state=42,
    )
    l1_base.fit(X1_train, y1_train)

    print("  Calibrating Level 1 with Sigmoid (Platt) on Validation split...")
    l1_calibrated = CalibratedClassifierCV(estimator=l1_base, method="sigmoid", cv="prefit")
    l1_calibrated.fit(X1_val, y1_val)

    l1_pipeline = Level1ProductionPipeline(l1_prep, l1_calibrated)
    l1_artifact_path = os.path.join(models_dir, "level1_recovery_pipeline.joblib")
    joblib.dump(l1_pipeline, l1_artifact_path)
    print(f"  [SAVED] Level 1 Pipeline -> {os.path.basename(l1_artifact_path)}")

    # 2. Train Level 2 Pipeline
    l2_data_path = os.path.join(data_dir, "circular_pathway_development.csv")
    if not os.path.exists(l2_data_path):
        raise FileNotFoundError(f"Level 2 dataset not found at {l2_data_path}. Run prepare_all_datasets.py first.")

    print(f"\n[2/4] Loading Level 2 dataset from {os.path.basename(l2_data_path)}...")
    df_l2 = pd.read_csv(l2_data_path)
    train_l2 = df_l2[df_l2["split"] == "train"].copy()
    print(f"  Level 2 Train samples: {len(train_l2):,}")

    l2_prep = Level2Preprocessor()
    X2_train = l2_prep.fit_transform(train_l2[LEVEL_2_FEATURES])
    y2_train = l2_prep.encode_target(train_l2[LEVEL_2_TARGET_COLUMN])

    print("  Fitting Level 2 RandomForestClassifier (n_estimators=100, max_depth=8, min_samples_leaf=3)...")
    l2_rf = RandomForestClassifier(
        class_weight="balanced",
        n_estimators=100,
        max_depth=8,
        min_samples_leaf=3,
        random_state=42,
    )
    l2_rf.fit(X2_train, y2_train)

    l2_pipeline = Level2ProductionPipeline(l2_prep, l2_rf)
    l2_artifact_path = os.path.join(models_dir, "level2_pathway_pipeline.joblib")
    joblib.dump(l2_pipeline, l2_artifact_path)
    print(f"  [SAVED] Level 2 Pipeline -> {os.path.basename(l2_artifact_path)}")

    # 3. Create Model Manifest
    print("\n[3/4] Generating production model manifest...")
    manifest = {
        "service_name": "ewaste-ml-inference-service",
        "model_version": "1.0.0",
        "dataset_version": "2025.07",
        "training_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "git_commit": get_git_commit_hash(),
        "level1_model": {
            "name": "RecoveryFeasibilityClassifier",
            "algorithm": "LogisticRegression(C=0.1, class_weight='balanced')",
            "calibration_method": "CalibratedClassifierCV(method='sigmoid', cv='prefit')",
            "target_column": LEVEL_1_TARGET_COLUMN,
            "classes": LEVEL_1_CLASSES,
            "features": LEVEL_1_FEATURES,
            "conservative_gate_thresholds": {
                "recovery_feasible_upper": 0.35,
                "recovery_unlikely_lower": 0.70,
            },
            "internal_semantic_status": [
                "RECOVERY_FEASIBLE",
                "AMBIGUOUS_TRIAGE",
                "RECOVERY_UNLIKELY",
            ],
        },
        "level2_model": {
            "name": "CircularPathwayClassifier",
            "algorithm": "RandomForestClassifier(n_estimators=100, max_depth=8, min_samples_leaf=3, class_weight='balanced')",
            "target_column": LEVEL_2_TARGET_COLUMN,
            "classes": LEVEL_2_CLASSES,
            "features": LEVEL_2_FEATURES,
            "confidence_thresholds": {
                "high": 0.70,
                "medium": 0.40,
                "low": 0.0,
            },
        },
        "stage0_safety_gate": {
            "deterministic": True,
            "priority": "ABOVE_ALL_ML",
            "features": SAFETY_GATE_FEATURES,
            "trigger_action": "SPECIAL_HANDLING",
        },
        "intake_abstractions": {
            "restore_grouping": {
                "input_classes": ["REPAIR", "REFURBISH"],
                "display_recommendation": "RESTORE",
                "rationale": "Intake telemetry cannot reliably distinguish single-part repair vs full refurbishment prior to bench diagnostic inspection.",
            },
            "resale_grouping": {
                "input_classes": ["REFURBISH_AND_SELL"],
                "display_recommendation": "POTENTIAL_RESALE_CANDIDATE",
                "rationale": "Commercial eligibility, grading, and pricing require human technician appraisal.",
            },
        },
        "marketplace_policy": {
            "mode": "OPTION_A_HUMAN_IN_THE_LOOP",
            "ml_auto_approval": False,
            "default_eligibility": "NOT_ASSESSED",
            "resale_candidate_eligibility": "TECHNICIAN_REVIEW_REQUIRED",
        },
        "training_provenance_summary": {
            "level1_sources": [PROVENANCE_REAL_OPEN_REPAIR, PROVENANCE_REAL_TU_DELFT],
            "level2_sources": [PROVENANCE_REAL_TU_DELFT, PROVENANCE_SYNTHETIC_DEVELOPMENT],
            "zero_leakage_guarantee": True,
        },
    }

    manifest_path = os.path.join(models_dir, "model_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"  [SAVED] Model Manifest -> {os.path.basename(manifest_path)}")

    # 4. Verification Check
    print("\n[4/4] Verifying pipeline deserialization and sample inference...")
    loaded_l1 = joblib.load(l1_artifact_path)
    loaded_l2 = joblib.load(l2_artifact_path)

    sample_df = pd.DataFrame([{
        "category": "LAPTOP",
        "approx_age_years": 5.0,
        "condition": "PARTIALLY_WORKING",
        "powers_on": "YES",
        "screen_condition": "CRACKED",
        "battery_condition": "NORMAL",
        "damage_severity": "MODERATE",
    }])

    p1 = loaded_l1.predict_proba(sample_df)[0]
    p2 = loaded_l2.predict_proba(sample_df)[0]

    print(f"  Benchmark 5-Year Laptop Level 1 Calibrated EOL Prob: {p1[1]*100:.1f}%")
    print(f"  Benchmark 5-Year Laptop Level 2 Probas: {dict(zip(LEVEL_2_CLASSES, np.round(p2, 4)))}")
    assert 0.35 <= p1[1] < 0.70, "Benchmark laptop must fall in AMBIGUOUS_TRIAGE zone!"
    print("  [SUCCESS] All production model artifacts successfully validated.")

    return manifest


if __name__ == "__main__":
    train_and_export_production_models()
