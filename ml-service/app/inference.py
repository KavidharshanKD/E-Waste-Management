"""
Inference Engine and Model Lifecycle Manager.
Loads serialized pipelines once at startup and executes calibrated Level 1 and Level 2 predictions.
Implements the 3-zone conservative gate, RESTORE abstraction, and confidence evaluation.
"""

import json
import os
from typing import Dict, Any, List, Tuple, Optional
import joblib
import numpy as np
import pandas as pd

from app.config import (
    LEVEL_1_MODEL_PATH,
    LEVEL_2_MODEL_PATH,
    MODEL_MANIFEST_PATH,
    EOL_RECOVERY_FEASIBLE_THRESHOLD,
    EOL_RECOVERY_UNLIKELY_THRESHOLD,
    CONFIDENCE_HIGH_THRESHOLD,
    CONFIDENCE_MEDIUM_THRESHOLD,
    STATUS_RECOVERY_FEASIBLE,
    STATUS_AMBIGUOUS_TRIAGE,
    STATUS_RECOVERY_UNLIKELY,
    ACTION_RESTORE,
    ACTION_POTENTIAL_RESALE,
    ACTION_KEEP_USING,
    ACTION_DONATE,
    ACTION_RECYCLE,
    MARKETPLACE_NOT_ASSESSED,
    MARKETPLACE_TECHNICIAN_REVIEW_REQUIRED,
)
from app.schemas import PredictRequest


class ModelManager:
    """Manages loaded pipeline models and metadata in application memory."""

    def __init__(self):
        self.is_loaded: bool = False
        self.manifest: Dict[str, Any] = {}
        self.level1_pipeline: Any = None
        self.level2_pipeline: Any = None

    def load_models(self) -> None:
        """Load joblib models and manifest into memory once at application startup."""
        if self.is_loaded:
            return

        if not os.path.exists(LEVEL_1_MODEL_PATH):
            raise FileNotFoundError(f"Level 1 model not found at {LEVEL_1_MODEL_PATH}. Run export_production_models.py first.")
        if not os.path.exists(LEVEL_2_MODEL_PATH):
            raise FileNotFoundError(f"Level 2 model not found at {LEVEL_2_MODEL_PATH}. Run export_production_models.py first.")
        if not os.path.exists(MODEL_MANIFEST_PATH):
            raise FileNotFoundError(f"Model manifest not found at {MODEL_MANIFEST_PATH}. Run export_production_models.py first.")

        self.level1_pipeline = joblib.load(LEVEL_1_MODEL_PATH)
        self.level2_pipeline = joblib.load(LEVEL_2_MODEL_PATH)

        with open(MODEL_MANIFEST_PATH, "r", encoding="utf-8") as f:
            self.manifest = json.load(f)

        self.is_loaded = True

    def predict_level1(self, req: PredictRequest) -> Tuple[float, str, bool, bool]:
        """
        Execute calibrated Level 1 recovery feasibility inference.
        Returns:
            (p_eol: float, recovery_status: str, technician_review_required: bool, allow_level2: bool)
        """
        if not self.is_loaded:
            raise RuntimeError("ModelManager models are not loaded.")

        df_l1 = pd.DataFrame([{
            "category": req.category,
            "approx_age_years": float(req.approx_age_years),
            "condition": req.condition,
        }])

        probas = self.level1_pipeline.predict_proba(df_l1)[0]
        p_eol = float(probas[1])

        # 3-Zone Conservative Triage Gate
        if p_eol >= EOL_RECOVERY_UNLIKELY_THRESHOLD:
            # Zone 3: Confirmed Recovery Unlikely
            return p_eol, STATUS_RECOVERY_UNLIKELY, False, False
        elif p_eol >= EOL_RECOVERY_FEASIBLE_THRESHOLD:
            # Zone 2: Ambiguous Triage (Salvage Protected)
            return p_eol, STATUS_AMBIGUOUS_TRIAGE, True, True
        else:
            # Zone 1: Confirmed Recovery Feasible
            return p_eol, STATUS_RECOVERY_FEASIBLE, False, True

    def predict_level2(
        self, req: PredictRequest
    ) -> Tuple[str, str, float, str, bool, bool, str, Dict[str, float]]:
        """
        Execute Level 2 circular pathway inference.
        Returns:
            (raw_pathway: str, display_rec: str, pathway_prob: float,
             confidence_level: str, technician_review: bool, inspection_rec: bool,
             marketplace_status: str, pathway_probabilities: Dict[str, float])
        """
        if not self.is_loaded:
            raise RuntimeError("ModelManager models are not loaded.")

        df_l2 = pd.DataFrame([{
            "category": req.category,
            "approx_age_years": float(req.approx_age_years),
            "condition": req.condition,
            "powers_on": req.powers_on or "YES",
            "screen_condition": req.screen_condition or "INTACT",
            "battery_condition": req.battery_condition or "NORMAL",
            "damage_severity": req.damage_severity or "NONE",
        }])

        probas = self.level2_pipeline.predict_proba(df_l2)[0]
        classes = self.level2_pipeline.classes_

        pred_idx = int(np.argmax(probas))
        raw_pathway = classes[pred_idx]
        max_prob = float(probas[pred_idx])

        proba_dist = {cls_name: round(float(p), 4) for cls_name, p in zip(classes, probas)}

        # Confidence Level determination
        if max_prob < CONFIDENCE_MEDIUM_THRESHOLD:
            confidence_level = "LOW"
            inspection_recommended = True
            technician_review = True
        elif max_prob < CONFIDENCE_HIGH_THRESHOLD:
            confidence_level = "MEDIUM"
            inspection_recommended = False
            technician_review = False
        else:
            confidence_level = "HIGH"
            inspection_recommended = False
            technician_review = False

        # Apply Intake Abstractions
        if raw_pathway in ["REPAIR", "REFURBISH"]:
            display_rec = ACTION_RESTORE
            technician_review = True
            marketplace_status = MARKETPLACE_NOT_ASSESSED
        elif raw_pathway == "REFURBISH_AND_SELL":
            display_rec = ACTION_POTENTIAL_RESALE
            technician_review = True
            marketplace_status = MARKETPLACE_TECHNICIAN_REVIEW_REQUIRED
        elif raw_pathway == ACTION_KEEP_USING:
            display_rec = ACTION_KEEP_USING
            marketplace_status = MARKETPLACE_NOT_ASSESSED
        elif raw_pathway == ACTION_DONATE:
            display_rec = ACTION_DONATE
            marketplace_status = MARKETPLACE_NOT_ASSESSED
        else:
            display_rec = raw_pathway
            marketplace_status = MARKETPLACE_NOT_ASSESSED

        return (
            raw_pathway,
            display_rec,
            round(max_prob, 4),
            confidence_level,
            technician_review,
            inspection_recommended,
            marketplace_status,
            proba_dist,
        )


# Global singleton instance
model_manager = ModelManager()
