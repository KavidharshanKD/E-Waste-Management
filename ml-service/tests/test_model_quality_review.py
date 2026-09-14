"""
Unit Tests for Module 4.5: Model Quality Review, Conservative Gate, and Sanity Evaluation.
Validates:
1. Deterministic safety gate priority and quarantine behavior.
2. Zero leakage of user intention or safety hazards into feature pipelines.
3. Probability calibration improves Brier score.
4. Threshold sweep and 3-zone conservative gate behavior.
5. Salvage-preservation of the 5-year cracked laptop benchmark.
6. Execution of the complete 15-scenario sanity suite.
7. Test-set isolation (threshold selection strictly on validation data).
"""

import os
import sys
import unittest
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import brier_score_loss

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Add src to path
SRC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from dataset_schema import (
    LEVEL_1_FEATURES,
    LEVEL_2_FEATURES,
    LEVEL_1_CLASSES,
    LEVEL_2_CLASSES,
    LEVEL_1_TARGET_COLUMN,
    LEVEL_2_TARGET_COLUMN,
    USER_INTENTIONS,
    SAFETY_GATE_FEATURES,
)
from preprocessing import Level1Preprocessor, Level2Preprocessor
from model_quality_review import (
    check_safety_gate,
    apply_conservative_gate,
    evaluate_threshold_sweep,
    SANITY_15_SCENARIOS,
    execute_sanity_evaluation,
)


class TestModelQualityReview(unittest.TestCase):
    """Test suite for ML model quality review and conservative triage gating."""

    @classmethod
    def setUpClass(cls):
        """Load datasets and prepare preprocessors and models."""
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        proc_dir = os.path.join(base_dir, "data", "processed")

        l1_path = os.path.join(proc_dir, "physical_feasibility_real.csv")
        l2_path = os.path.join(proc_dir, "circular_pathway_development.csv")

        cls.l1_df = pd.read_csv(l1_path)
        cls.l2_df = pd.read_csv(l2_path)

        cls.l1_train = cls.l1_df[cls.l1_df["split"] == "train"].copy()
        cls.l1_val = cls.l1_df[cls.l1_df["split"] == "val"].copy()
        cls.l1_test = cls.l1_df[cls.l1_df["split"] == "test"].copy()

        cls.l2_train = cls.l2_df[cls.l2_df["split"] == "train"].copy()
        cls.l2_val = cls.l2_df[cls.l2_df["split"] == "val"].copy()
        cls.l2_test = cls.l2_df[cls.l2_df["split"] == "test"].copy()

        # Fit preprocessors
        cls.l1_prep = Level1Preprocessor()
        cls.X1_train = cls.l1_prep.fit_transform(cls.l1_train[LEVEL_1_FEATURES])
        cls.y1_train = cls.l1_prep.encode_target(cls.l1_train[LEVEL_1_TARGET_COLUMN])
        cls.X1_val = cls.l1_prep.transform(cls.l1_val[LEVEL_1_FEATURES])
        cls.y1_val = cls.l1_prep.encode_target(cls.l1_val[LEVEL_1_TARGET_COLUMN])

        cls.l2_prep = Level2Preprocessor()
        cls.X2_train = cls.l2_prep.fit_transform(cls.l2_train[LEVEL_2_FEATURES])
        cls.y2_train = cls.l2_prep.encode_target(cls.l2_train[LEVEL_2_TARGET_COLUMN])

        # Train Level 1 Logistic Regression candidate
        cls.l1_model = LogisticRegression(class_weight="balanced", C=0.1, max_iter=1000, random_state=42)
        cls.l1_model.fit(cls.X1_train, cls.y1_train)

        # Calibrate Level 1 model on validation data
        cls.l1_cal = CalibratedClassifierCV(estimator=cls.l1_model, method="sigmoid", cv="prefit")
        cls.l1_cal.fit(cls.X1_val, cls.y1_val)

        # Train Level 2 model
        from sklearn.ensemble import RandomForestClassifier
        cls.l2_model = RandomForestClassifier(class_weight="balanced", n_estimators=50, max_depth=6, random_state=42)
        cls.l2_model.fit(cls.X2_train, cls.y2_train)

    def test_01_safety_gate_deterministic_interception(self):
        """Test that safety hazards immediately trigger SPECIAL_HANDLING without ML."""
        hazardous_devices = [
            {"battery_swollen": True, "category": "MOBILE_PHONE", "approx_age_years": 1.0},
            {"battery_leaking": True, "category": "LAPTOP", "approx_age_years": 2.0},
            {"overheating_evidence": True, "category": "DESKTOP", "approx_age_years": 3.0},
            {"severe_physical_damage": True, "category": "TABLET", "approx_age_years": 0.5},
        ]
        for dev in hazardous_devices:
            is_hazard, action, reason = check_safety_gate(dev)
            self.assertTrue(is_hazard, f"Device failed to trigger safety gate: {dev}")
            self.assertEqual(action, "SPECIAL_HANDLING")
            self.assertIsNotNone(reason)

        # Clear device should NOT trigger
        clean_dev = {"category": "LAPTOP", "approx_age_years": 2.0, "powers_on": "YES"}
        is_hazard, action, reason = check_safety_gate(clean_dev)
        self.assertFalse(is_hazard)
        self.assertIsNone(action)

    def test_02_feature_pipeline_zero_leakage(self):
        """Verify that user intention and safety flags are strictly excluded from ML feature inputs."""
        for feat in LEVEL_1_FEATURES:
            self.assertNotIn(feat, SAFETY_GATE_FEATURES)
            self.assertNotEqual(feat, "user_intention")

        for feat in LEVEL_2_FEATURES:
            self.assertNotIn(feat, SAFETY_GATE_FEATURES)
            self.assertNotEqual(feat, "user_intention")

    def test_03_probability_calibration_improves_brier_score(self):
        """Verify that Platt calibration significantly improves Brier score on validation data."""
        raw_val_proba = self.l1_model.predict_proba(self.X1_val)[:, 1]
        cal_val_proba = self.l1_cal.predict_proba(self.X1_val)[:, 1]

        brier_raw = brier_score_loss(self.y1_val, raw_val_proba)
        brier_cal = brier_score_loss(self.y1_val, cal_val_proba)

        self.assertLess(brier_cal, brier_raw, "Calibrated Brier score should be lower (better) than raw.")
        self.assertLess(brier_cal, 0.19, "Calibrated Brier score should be under 0.19 on validation.")

    def test_04_conservative_3zone_gate_behavior(self):
        """Verify 3-zone conservative gate routing rules."""
        # Low EOL (< 0.35) -> Zone 1
        g1 = apply_conservative_gate(0.15, t_low=0.35, t_high=0.70)
        self.assertEqual(g1["gate_decision"], "RECOVERY_FEASIBLE")
        self.assertTrue(g1["allow_level2"])
        self.assertFalse(g1["technician_review_required"])
        self.assertEqual(g1["routing"], "LEVEL_2_CIRCULAR_PATHWAY")

        # Ambiguous EOL (0.35 to 0.70) -> Zone 2
        g2 = apply_conservative_gate(0.55, t_low=0.35, t_high=0.70)
        self.assertEqual(g2["gate_decision"], "AMBIGUOUS_TRIAGE")
        self.assertTrue(g2["allow_level2"])
        self.assertTrue(g2["technician_review_required"])
        self.assertEqual(g2["routing"], "LEVEL_2_WITH_TECHNICIAN_REVIEW")

        # High EOL (>= 0.70) -> Zone 3
        g3 = apply_conservative_gate(0.85, t_low=0.35, t_high=0.70)
        self.assertEqual(g3["gate_decision"], "RECOVERY_UNLIKELY")
        self.assertFalse(g3["allow_level2"])
        self.assertEqual(g3["routing"], "RECYCLE")

    def test_05_salvage_preservation_benchmark_laptop(self):
        """Verify that Scenario 07 (5-year laptop with cracked screen) is NOT falsely recycled."""
        scenario_07 = next(s for s in SANITY_15_SCENARIOS if s["id"] == "SCENARIO_07")
        results = execute_sanity_evaluation(
            self.l1_model,
            self.l1_cal,
            self.l1_prep,
            self.l2_model,
            self.l2_prep,
            t_low=0.35,
            t_high=0.70,
        )
        res_07 = next(r for r in results if r["id"] == "SCENARIO_07")

        # Must not be recycled
        self.assertNotEqual(res_07["final_recommendation"], "RECYCLE")
        # Must be routed to Zone 2 or Zone 1
        self.assertIn(res_07["conservative_gate"]["gate_decision"], ["AMBIGUOUS_TRIAGE", "RECOVERY_FEASIBLE"])
        # Level 2 must recommend REPAIR
        self.assertIn("REPAIR", res_07["final_recommendation"])
        self.assertTrue(res_07["domain_verdict"].startswith("PASS"))

    def test_06_complete_15_scenario_execution(self):
        """Verify that all 15 scenarios execute successfully through the pipeline."""
        results = execute_sanity_evaluation(
            self.l1_model,
            self.l1_cal,
            self.l1_prep,
            self.l2_model,
            self.l2_prep,
            t_low=0.35,
            t_high=0.70,
        )
        self.assertEqual(len(results), 15, "All 15 scenarios must be evaluated.")

        # Scenario 05 must be quarantined by safety gate
        res_05 = next(r for r in results if r["id"] == "SCENARIO_05")
        self.assertTrue(res_05["safety_gate"]["triggered"])
        self.assertEqual(res_05["final_recommendation"], "SPECIAL_HANDLING")

        # Check that all scenarios pass domain verification
        for r in results:
            self.assertTrue(r["domain_verdict"].startswith("PASS"), f"Scenario {r['id']} failed domain verdict: {r['domain_verdict']}")

    def test_07_validation_only_threshold_sweep_isolation(self):
        """Verify that threshold sweep functions execute on validation split without accessing test split."""
        cal_val_proba = self.l1_cal.predict_proba(self.X1_val)[:, 1]
        sweep_results = evaluate_threshold_sweep(self.y1_val, cal_val_proba)

        self.assertGreater(len(sweep_results), 5)
        # Check false recycling rate at threshold 0.70
        t70 = next(r for r in sweep_results if abs(r["threshold"] - 0.70) < 1e-4)
        self.assertLess(t70["false_recycling_rate"], 0.02, "False recycling rate at T=0.70 should be under 2%.")


if __name__ == "__main__":
    unittest.main()
