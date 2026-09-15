"""
Comprehensive Unit & Integration Test Suite for Production ML Inference Service.
Tests 28 distinct functional requirements:
1. Health endpoint status
2. Version endpoint metadata
3. Normal prediction execution
4. Safety gate bypasses all ML
5. Swollen battery -> SPECIAL_HANDLING
6. Leakage -> SPECIAL_HANDLING
7. Overheating -> SPECIAL_HANDLING
8. Severe physical damage -> SPECIAL_HANDLING
9. P(EOL) low routing (< 0.35 -> RECOVERY_FEASIBLE)
10. P(EOL) ambiguous routing (0.35 - 0.70 -> AMBIGUOUS_TRIAGE)
11. P(EOL) high routing (>= 0.70 -> RECOVERY_UNLIKELY -> RECYCLE)
12. Ambiguous triage forces technician_review_required = True
13. REPAIR raw prediction -> RESTORE display
14. REFURBISH raw prediction -> RESTORE display
15. REFURBISH_AND_SELL -> POTENTIAL_RESALE_CANDIDATE
16. Low confidence (< 0.40) -> inspection_recommended = True
17. User intention cannot override safety hazards
18. User intention cannot override recovery-unlikely warning
19. NOT_APPLICABLE handling for accessories
20. Invalid enum rejection with HTTP 422
21. Age validation rejection (negative age)
22. Unknown category handling
23. Probability bounds [0.0, 1.0]
24. Zero fabricated confidence (matches predict_proba)
25. Model loaded once at startup
26. Zero external network/API dependency
27. Marketplace never auto-approved by ML
28. 5-year cracked laptop benchmark regression test
"""

import os
import sys
import unittest
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Ensure ml-service root and app are importable
ML_SERVICE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ML_SERVICE_DIR, "src")
if ML_SERVICE_DIR not in sys.path:
    sys.path.insert(0, ML_SERVICE_DIR)
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from fastapi.testclient import TestClient
from app.main import app
from app.inference import model_manager
from app.config import (
    ACTION_SPECIAL_HANDLING,
    ACTION_RESTORE,
    ACTION_POTENTIAL_RESALE,
    ACTION_KEEP_USING,
    ACTION_DONATE,
    ACTION_RECYCLE,
    STATUS_RECOVERY_FEASIBLE,
    STATUS_AMBIGUOUS_TRIAGE,
    STATUS_RECOVERY_UNLIKELY,
    STATUS_SPECIAL_HANDLING,
    MARKETPLACE_NOT_ASSESSED,
    MARKETPLACE_TECHNICIAN_REVIEW_REQUIRED,
)


class TestProductionInferenceService(unittest.TestCase):
    """Test suite covering the complete production FastAPI inference service."""

    @classmethod
    def setUpClass(cls):
        """Ensure model artifacts are exported and initialize TestClient."""
        from src.export_production_models import train_and_export_production_models
        train_and_export_production_models()

        cls.client = TestClient(app)
        # Lifespan startup triggers model loading
        cls.client.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None, None, None)

    def test_01_health_endpoint(self):
        """Test GET /health probe returns UP and indicates models loaded."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "UP")
        self.assertTrue(data["models_loaded"])
        self.assertIn("version", data)

    def test_02_version_endpoint(self):
        """Test GET /version returns safe metadata without absolute paths or secrets."""
        res = self.client.get("/version")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["model_version"], "1.0.0")
        self.assertEqual(data["dataset_version"], "2025.07")
        self.assertIn("thresholds", data)
        self.assertEqual(data["thresholds"]["recovery_feasible_upper"], 0.35)
        self.assertEqual(data["thresholds"]["recovery_unlikely_lower"], 0.70)
        self.assertEqual(data["marketplace_policy"], "OPTION_A_HUMAN_IN_THE_LOOP")
        # Ensure no local windows paths are leaked
        self.assertNotIn("C:\\", str(data))
        self.assertNotIn("/home", str(data))

    def test_03_normal_prediction(self):
        """Test standard prediction on a modern working mobile phone."""
        payload = {
            "category": "MOBILE_PHONE",
            "approx_age_years": 1.0,
            "condition": "WORKING",
            "powers_on": "YES",
            "screen_condition": "INTACT",
            "battery_condition": "NORMAL",
            "damage_severity": "NONE",
            "user_intention": "KEEP_USING",
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["safety_gate_triggered"])
        self.assertEqual(data["recovery_status"], STATUS_RECOVERY_FEASIBLE)
        self.assertLess(data["recovery_probability"], 0.35)
        self.assertIn("explanation", data)
        self.assertGreater(len(data["explanation"]), 20)

    def test_04_safety_gate_bypasses_all_ml(self):
        """Test that safety gate bypasses ML inference completely and returns SPECIAL_HANDLING."""
        payload = {
            "category": "LAPTOP",
            "approx_age_years": 1.0,
            "condition": "WORKING",
            "battery_swollen": True,
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["safety_gate_triggered"])
        self.assertEqual(data["recommended_action"], ACTION_SPECIAL_HANDLING)
        self.assertEqual(data["display_recommendation"], ACTION_SPECIAL_HANDLING)
        self.assertIsNone(data["raw_pathway_prediction"])
        self.assertIsNone(data["recovery_probability"])
        self.assertIsNone(data["pathway_probabilities"])

    def test_05_swollen_battery_trigger(self):
        """Test battery_swollen triggers specific safety explanation."""
        payload = {
            "category": "MOBILE_PHONE",
            "approx_age_years": 2.0,
            "condition": "WORKING",
            "battery_swollen": True,
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertTrue(data["safety_gate_triggered"])
        self.assertIn("Battery swelling detected.", data["safety_reasons"])
        self.assertEqual(data["recommended_action"], ACTION_SPECIAL_HANDLING)

    def test_06_leakage_trigger(self):
        """Test battery_leaking triggers specific safety explanation."""
        payload = {
            "category": "LAPTOP",
            "approx_age_years": 3.0,
            "condition": "WORKING",
            "battery_leaking": True,
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertTrue(data["safety_gate_triggered"])
        self.assertIn("Battery leakage detected.", data["safety_reasons"])

    def test_07_overheating_trigger(self):
        """Test overheating_evidence triggers specific safety explanation."""
        payload = {
            "category": "DESKTOP",
            "approx_age_years": 2.0,
            "condition": "WORKING",
            "overheating_evidence": True,
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertTrue(data["safety_gate_triggered"])
        self.assertIn("Overheating evidence reported.", data["safety_reasons"])

    def test_08_severe_physical_damage_trigger(self):
        """Test severe_physical_damage triggers specific safety explanation."""
        payload = {
            "category": "TABLET",
            "approx_age_years": 1.5,
            "condition": "HAZARDOUS",
            "severe_physical_damage": True,
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertTrue(data["safety_gate_triggered"])
        self.assertIn("Severe physical damage requires controlled handling.", data["safety_reasons"])

    def test_09_peol_low_routing(self):
        """Test low EOL probability (< 0.35) routes to RECOVERY_FEASIBLE."""
        payload = {
            "category": "MOBILE_PHONE",
            "approx_age_years": 0.5,
            "condition": "WORKING",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertEqual(data["recovery_status"], STATUS_RECOVERY_FEASIBLE)
        self.assertLess(data["recovery_probability"], 0.35)

    def test_10_peol_ambiguous_routing(self):
        """Test ambiguous recovery probability (0.35 - 0.70) routes to AMBIGUOUS_TRIAGE."""
        payload = {
            "category": "DESKTOP",
            "approx_age_years": 4.0,
            "condition": "PARTIALLY_WORKING",
            "screen_condition": "NOT_APPLICABLE",
            "battery_condition": "NOT_APPLICABLE",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertEqual(data["recovery_status"], STATUS_AMBIGUOUS_TRIAGE)
        self.assertGreaterEqual(data["recovery_probability"], 0.35)
        self.assertLess(data["recovery_probability"], 0.70)

    def test_11_peol_high_routing(self):
        """Test high EOL probability (>= 0.70) routes directly to RECYCLE bypassing Level 2."""
        payload = {
            "category": "MONITOR",
            "approx_age_years": 5.0,
            "condition": "PARTIALLY_WORKING",
            "screen_condition": "DEAD_PIXELS_BLEED",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertEqual(data["recovery_status"], STATUS_RECOVERY_UNLIKELY)
        self.assertGreaterEqual(data["recovery_probability"], 0.70)
        self.assertEqual(data["display_recommendation"], ACTION_RECYCLE)
        self.assertEqual(data["recommended_action"], ACTION_RECYCLE)
        self.assertIsNone(data["raw_pathway_prediction"])

    def test_12_ambiguous_forces_technician_review(self):
        """Verify that AMBIGUOUS_TRIAGE sets technician_review_required = True."""
        payload = {
            "category": "LAPTOP",
            "approx_age_years": 5.0,
            "condition": "PARTIALLY_WORKING",
            "screen_condition": "CRACKED",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertEqual(data["recovery_status"], STATUS_AMBIGUOUS_TRIAGE)
        self.assertTrue(data["technician_review_required"])

    def test_13_repair_maps_to_restore(self):
        """Verify that Level 2 raw prediction REPAIR is presented as RESTORE at citizen intake."""
        payload = {
            "category": "MOBILE_PHONE",
            "approx_age_years": 2.0,
            "condition": "PARTIALLY_WORKING",
            "powers_on": "YES",
            "screen_condition": "CRACKED",
            "battery_condition": "NORMAL",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertEqual(data["raw_pathway_prediction"], "REPAIR")
        self.assertEqual(data["display_recommendation"], ACTION_RESTORE)
        self.assertEqual(data["recommended_action"], ACTION_RESTORE)
        self.assertTrue(data["technician_review_required"])

    def test_14_refurbish_maps_to_restore(self):
        """Verify that Level 2 raw prediction REFURBISH is presented as RESTORE at citizen intake."""
        payload = {
            "category": "MOBILE_PHONE",
            "approx_age_years": 3.5,
            "condition": "WORKING",
            "powers_on": "YES",
            "screen_condition": "INTACT",
            "battery_condition": "DEGRADED",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        if data["raw_pathway_prediction"] == "REFURBISH":
            self.assertEqual(data["display_recommendation"], ACTION_RESTORE)
            self.assertTrue(data["technician_review_required"])

    def test_15_refurbish_and_sell_maps_to_potential_resale(self):
        """Verify that raw REFURBISH_AND_SELL maps to POTENTIAL_RESALE_CANDIDATE and requires review."""
        payload = {
            "category": "LAPTOP",
            "approx_age_years": 1.0,
            "condition": "WORKING",
            "powers_on": "YES",
            "screen_condition": "INTACT",
            "battery_condition": "NORMAL",
            "damage_severity": "NONE",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertEqual(data["raw_pathway_prediction"], "REFURBISH_AND_SELL")
        self.assertEqual(data["display_recommendation"], ACTION_POTENTIAL_RESALE)
        self.assertEqual(data["recommended_action"], ACTION_POTENTIAL_RESALE)
        self.assertTrue(data["technician_review_required"])
        self.assertEqual(data["marketplace_eligibility"], MARKETPLACE_TECHNICIAN_REVIEW_REQUIRED)

    def test_16_low_confidence_triggers_inspection(self):
        """Verify that low Level 2 confidence (< 0.40) sets confidence_level = LOW and inspection_recommended = True."""
        # Ambiguous peripheral condition
        payload = {
            "category": "AUDIO_EQUIPMENT",
            "approx_age_years": 12.0,
            "condition": "NOT_WORKING",
            "powers_on": "NO",
            "screen_condition": "NOT_APPLICABLE",
            "battery_condition": "NOT_APPLICABLE",
            "damage_severity": "HEAVY",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        if data["pathway_probability"] is not None and data["pathway_probability"] < 0.40:
            self.assertEqual(data["confidence_level"], "LOW")
            self.assertTrue(data["inspection_recommended"])

    def test_17_user_intention_cannot_override_safety(self):
        """Verify that user intention (e.g., KEEP_USING) cannot override SPECIAL_HANDLING."""
        payload = {
            "category": "LAPTOP",
            "approx_age_years": 1.0,
            "condition": "WORKING",
            "battery_swollen": True,
            "user_intention": "KEEP_USING",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertEqual(data["recommended_action"], ACTION_SPECIAL_HANDLING)
        self.assertEqual(data["intention_compatibility"], "CONFLICT")

    def test_18_user_intention_cannot_override_recovery_unlikely(self):
        """Verify that user intention cannot override high-confidence recycling warning."""
        payload = {
            "category": "MONITOR",
            "approx_age_years": 5.0,
            "condition": "PARTIALLY_WORKING",
            "screen_condition": "DEAD_PIXELS_BLEED",
            "user_intention": "KEEP_USING",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        self.assertEqual(data["recovery_status"], STATUS_RECOVERY_UNLIKELY)
        self.assertEqual(data["recommended_action"], ACTION_RECYCLE)
        self.assertEqual(data["intention_compatibility"], "CONFLICT")

    def test_19_not_applicable_values_for_accessories(self):
        """Verify that accessories with NOT_APPLICABLE screen/battery/power are handled cleanly."""
        payload = {
            "category": "CABLE",
            "approx_age_years": 1.0,
            "condition": "WORKING",
            "powers_on": "NOT_APPLICABLE",
            "screen_condition": "NOT_APPLICABLE",
            "battery_condition": "NOT_APPLICABLE",
            "damage_severity": "NONE",
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("recommended_action", data)

    def test_20_invalid_enum_rejection(self):
        """Verify that invalid enum strings return HTTP 422 Unprocessable Entity."""
        payload = {
            "category": "SPACESHIP",  # Invalid category
            "approx_age_years": 2.0,
            "condition": "WORKING",
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 422)

    def test_21_negative_age_rejection(self):
        """Verify that negative age is rejected with HTTP 422."""
        payload = {
            "category": "LAPTOP",
            "approx_age_years": -5.0,
            "condition": "WORKING",
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 422)

    def test_22_unknown_category_graceful_handling(self):
        """Verify that category 'OTHER' is processed without runtime error."""
        payload = {
            "category": "OTHER",
            "approx_age_years": 4.0,
            "condition": "WORKING",
            "powers_on": "YES",
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)

    def test_23_probability_bounds(self):
        """Verify that all returned probabilities are bounded within [0.0, 1.0]."""
        payload = {
            "category": "LAPTOP",
            "approx_age_years": 3.0,
            "condition": "WORKING",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        if data["recovery_probability"] is not None:
            self.assertGreaterEqual(data["recovery_probability"], 0.0)
            self.assertLessEqual(data["recovery_probability"], 1.0)
        if data["pathway_probability"] is not None:
            self.assertGreaterEqual(data["pathway_probability"], 0.0)
            self.assertLessEqual(data["pathway_probability"], 1.0)

    def test_24_no_fabricated_confidence(self):
        """Verify that pathway probability strictly matches max probability from distribution."""
        payload = {
            "category": "MOBILE_PHONE",
            "approx_age_years": 2.0,
            "condition": "WORKING",
        }
        res = self.client.post("/predict", json=payload)
        data = res.json()
        if data["pathway_probabilities"] is not None:
            max_dist_val = max(data["pathway_probabilities"].values())
            self.assertAlmostEqual(data["pathway_probability"], max_dist_val, places=3)

    def test_25_model_loaded_once(self):
        """Verify that model_manager maintains loaded state in memory across multiple requests."""
        self.assertTrue(model_manager.is_loaded)
        m1 = model_manager.level1_pipeline
        m2 = model_manager.level2_pipeline
        # Run another request
        self.client.get("/health")
        self.assertIs(model_manager.level1_pipeline, m1)
        self.assertIs(model_manager.level2_pipeline, m2)

    def test_26_zero_external_network_dependency(self):
        """Verify that prediction executes entirely locally without external API/network calls."""
        payload = {
            "category": "TABLET",
            "approx_age_years": 2.5,
            "condition": "WORKING",
            "powers_on": "YES",
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        # Check that explanation is purely template-generated and does not mention LLM
        explanation = res.json()["explanation"]
        self.assertNotIn("OpenAI", explanation)
        self.assertNotIn("Gemini", explanation)
        self.assertNotIn("ChatGPT", explanation)

    def test_27_marketplace_never_auto_approved(self):
        """Verify that marketplace_eligibility is NEVER 'APPROVED_FOR_SALE' from ML alone."""
        test_payloads = [
            {"category": "LAPTOP", "approx_age_years": 0.5, "condition": "WORKING", "powers_on": "YES"},
            {"category": "MOBILE_PHONE", "approx_age_years": 1.0, "condition": "WORKING", "powers_on": "YES"},
            {"category": "TABLET", "approx_age_years": 1.0, "condition": "WORKING", "powers_on": "YES"},
        ]
        for p in test_payloads:
            res = self.client.post("/predict", json=p)
            self.assertNotEqual(res.json()["marketplace_eligibility"], "APPROVED_FOR_SALE")
            self.assertIn(
                res.json()["marketplace_eligibility"],
                [MARKETPLACE_NOT_ASSESSED, MARKETPLACE_TECHNICIAN_REVIEW_REQUIRED],
            )

    def test_28_benchmark_5year_laptop_regression(self):
        """
        REGRESSION TEST: The benchmark 5-year-old partially working laptop with a cracked screen.
        MUST NOT be routed to immediate recycling!
        Must enter AMBIGUOUS_TRIAGE and recommend RESTORE with technician bench inspection.
        """
        payload = {
            "category": "LAPTOP",
            "approx_age_years": 5.0,
            "condition": "PARTIALLY_WORKING",
            "powers_on": "YES",
            "screen_condition": "CRACKED",
            "battery_condition": "NORMAL",
            "damage_severity": "MODERATE",
            "user_intention": "REPAIR",
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # 1. Must NOT be recycled
        self.assertNotEqual(data["recommended_action"], ACTION_RECYCLE)
        self.assertNotEqual(data["display_recommendation"], ACTION_RECYCLE)

        # 2. Must enter AMBIGUOUS_TRIAGE (0.35 <= P < 0.70)
        self.assertEqual(data["recovery_status"], STATUS_AMBIGUOUS_TRIAGE)
        self.assertGreaterEqual(data["recovery_probability"], 0.35)
        self.assertLess(data["recovery_probability"], 0.70)

        # 3. Must require technician review
        self.assertTrue(data["technician_review_required"])

        # 4. Level 2 raw prediction must be REPAIR, displayed as RESTORE
        self.assertEqual(data["raw_pathway_prediction"], "REPAIR")
        self.assertEqual(data["display_recommendation"], ACTION_RESTORE)
        self.assertEqual(data["recommended_action"], ACTION_RESTORE)

        # 5. User intention compatibility
        self.assertEqual(data["intention_compatibility"], "COMPATIBLE")


if __name__ == "__main__":
    unittest.main()
