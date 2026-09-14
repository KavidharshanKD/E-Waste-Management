"""
Unit and Integration Tests for Synthetic Dataset Generation
Tested using Python standard unittest library.
"""

import os
import sys
import unittest
import numpy as np
import pandas as pd

# Add src to path for imports
SRC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from dataset_schema import (
    EWASTE_CATEGORIES,
    DEVICE_CONDITIONS,
    USER_INTENTIONS,
    SCREEN_CONDITIONS,
    BATTERY_CONDITIONS,
    POWERS_ON_VALUES,
    DAMAGE_SEVERITIES,
    ML_TARGET_CLASSES,
    SAFETY_TARGET,
    ALL_TARGET_CLASSES,
    CATEGORY_CAPABILITIES,
)
from generate_dataset import generate_dataset, audit_dataset
from validate_dataset import validate_dataset_invariants


class TestDatasetGeneration(unittest.TestCase):

    def test_reproducibility_with_fixed_seed(self):
        """Test that identical seeds yield bit-for-bit identical datasets."""
        df1 = generate_dataset(n_samples=200, seed=123)
        df2 = generate_dataset(n_samples=200, seed=123)
        pd.testing.assert_frame_equal(df1, df2)

    def test_different_seeds_yield_different_data(self):
        """Test that different random seeds produce different random samples."""
        df1 = generate_dataset(n_samples=100, seed=42)
        df2 = generate_dataset(n_samples=100, seed=99)
        self.assertFalse(df1["sample_id"].equals(df2["sample_id"]))

    def test_requested_sample_count(self):
        """Test that the generator respects configurable sample count."""
        for count in [50, 250, 1000]:
            df = generate_dataset(n_samples=count, seed=42)
            self.assertEqual(len(df), count)

    def test_all_invariants_pass_on_generated_data(self):
        """Test that generated dataset satisfies all physical and safety invariants."""
        df = generate_dataset(n_samples=1000, seed=42)
        is_valid, errors = validate_dataset_invariants(df)
        self.assertTrue(is_valid, f"Validation failed with errors: {errors}")

    def test_no_negative_or_extreme_ages(self):
        """Test that age distribution is strictly within [0.1, 15.0] years."""
        df = generate_dataset(n_samples=500, seed=42)
        self.assertTrue((df["approx_age_years"] >= 0.1).all())
        self.assertTrue((df["approx_age_years"] <= 15.0).all())

    def test_enum_value_integrity(self):
        """Test that all categorical columns strictly belong to allowed enum sets."""
        df = generate_dataset(n_samples=500, seed=42)
        self.assertTrue(set(df["category"]).issubset(set(EWASTE_CATEGORIES)))
        self.assertTrue(set(df["condition"]).issubset(set(DEVICE_CONDITIONS)))
        self.assertTrue(set(df["user_intention"]).issubset(set(USER_INTENTIONS)))
        self.assertTrue(set(df["screen_condition"]).issubset(set(SCREEN_CONDITIONS)))
        self.assertTrue(set(df["battery_condition"]).issubset(set(BATTERY_CONDITIONS)))
        self.assertTrue(set(df["powers_on"]).issubset(set(POWERS_ON_VALUES)))
        self.assertTrue(set(df["damage_severity"]).issubset(set(DAMAGE_SEVERITIES)))
        self.assertTrue(set(df["recommended_action"]).issubset(set(ALL_TARGET_CLASSES)))

    def test_category_aware_capability_n_a_handling(self):
        """Test that non-screen, non-battery, and non-powered items correctly assign NOT_APPLICABLE."""
        df = generate_dataset(n_samples=1000, seed=42)

        # Cable: no screen, no battery, not powered
        cables = df[df["category"] == "CABLE"]
        if len(cables) > 0:
            self.assertTrue((cables["screen_condition"] == "NOT_APPLICABLE").all())
            self.assertTrue((cables["battery_condition"] == "NOT_APPLICABLE").all())
            self.assertTrue((cables["powers_on"] == "NOT_APPLICABLE").all())

        # Desktop: powered, but no screen, no battery
        desktops = df[df["category"] == "DESKTOP"]
        if len(desktops) > 0:
            self.assertTrue((desktops["screen_condition"] == "NOT_APPLICABLE").all())
            self.assertTrue((desktops["battery_condition"] == "NOT_APPLICABLE").all())
            self.assertTrue(set(desktops["powers_on"]).issubset({"YES", "NO"}))

        # Laptop: has screen, has battery, is powered
        laptops = df[df["category"] == "LAPTOP"]
        if len(laptops) > 0:
            self.assertFalse((laptops["screen_condition"] == "NOT_APPLICABLE").any())
            self.assertFalse((laptops["battery_condition"] == "NOT_APPLICABLE").any())
            self.assertTrue(set(laptops["powers_on"]).issubset({"YES", "NO"}))

    def test_deterministic_safety_gate_invariant(self):
        """Test that all safety hazard flags guarantee SPECIAL_HANDLING outcome."""
        df = generate_dataset(n_samples=1500, seed=42)
        hazards = df[df["is_safety_hazard"] == True]
        self.assertGreater(len(hazards), 0)
        self.assertTrue((hazards["recommended_action"] == SAFETY_TARGET).all())

    def test_user_intention_is_not_blindly_coupled_to_target(self):
        """Test that user_intention is not identical to target (realistically decoupled)."""
        df = generate_dataset(n_samples=2000, seed=42)
        match_rate = (df["user_intention"] == df["recommended_action"]).mean()
        # Realistic match rate should be between 10% and 45% (never 0% and never 100%)
        self.assertGreater(match_rate, 0.10)
        self.assertLess(match_rate, 0.45)

    def test_no_missing_or_null_values(self):
        """Test that all generated columns have 0 NaN/null values."""
        df = generate_dataset(n_samples=1000, seed=42)
        null_counts = df.isnull().sum()
        self.assertEqual(int(null_counts.sum()), 0)

    def test_audit_summary_structure(self):
        """Test that audit_dataset produces required statistical metadata."""
        df = generate_dataset(n_samples=500, seed=42)
        audit = audit_dataset(df)
        self.assertEqual(audit["total_records"], 500)
        self.assertIn("category_distribution_pct", audit)
        self.assertIn("target_distribution_pct", audit)
        self.assertIn("user_intention_target_match_rate_pct", audit)


if __name__ == "__main__":
    unittest.main()
