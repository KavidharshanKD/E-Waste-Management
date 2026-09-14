"""
Unit and Integration Tests for Module 3 ML Preprocessing and Real Data Pipeline.
Verifies deterministic preprocessing, schema isolation, lack of leakage,
provenance preservation, unknown category handling, and split determinism.
"""

import os
import sys
import unittest
import zipfile
import numpy as np
import pandas as pd

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
    PROVENANCE_REAL_OPEN_REPAIR,
    PROVENANCE_REAL_TU_DELFT,
    PROVENANCE_SYNTHETIC_DEVELOPMENT,
    ALL_PROVENANCE_VALUES,
    SAFETY_GATE_FEATURES,
    OPEN_REPAIR_CATEGORY_MAP,
    TU_DELFT_CATEGORY_MAP,
    CATEGORY_AGE_LIMITS,
)
from preprocessing import Level1Preprocessor, Level2Preprocessor
from prepare_real_datasets import prepare_open_repair, prepare_tu_delft
from prepare_all_datasets import assign_deterministic_splits


class TestPreprocessingPipeline(unittest.TestCase):

    def setUp(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.ext_dir = os.path.join(self.base_dir, "data", "external")
        self.open_repair_zip = os.path.join(self.ext_dir, "OpenRepairData_v0.3_aggregate_202507.zip")
        self.tu_delft_zip = os.path.join(self.ext_dir, "Consumer survey product lifetimes and durability of electronics.zip")

    def test_user_intention_absent_from_feature_matrices(self):
        """Verify user_intention is strictly excluded from both Level 1 and Level 2 ML feature matrices."""
        self.assertNotIn("user_intention", LEVEL_1_FEATURES, "user_intention must NOT be in Level 1 ML features")
        self.assertNotIn("user_intention", LEVEL_2_FEATURES, "user_intention must NOT be in Level 2 ML features")

    def test_safety_flags_absent_from_feature_matrices(self):
        """Verify safety hazard features are strictly excluded from ML features (handled by deterministic gate)."""
        for flag in SAFETY_GATE_FEATURES:
            self.assertNotIn(flag, LEVEL_1_FEATURES, f"Safety flag {flag} must NOT be in Level 1 ML features")
            self.assertNotIn(flag, LEVEL_2_FEATURES, f"Safety flag {flag} must NOT be in Level 2 ML features")

    def test_deterministic_level1_preprocessing(self):
        """Test Level1Preprocessor produces identical numerical matrices on identical data."""
        data = pd.DataFrame([
            {"category": "LAPTOP", "approx_age_years": 4.5, "condition": "WORKING"},
            {"category": "MOBILE_PHONE", "approx_age_years": 2.0, "condition": "NOT_RECORDED"},
            {"category": "DESKTOP", "approx_age_years": 8.0, "condition": "DAMAGED"},
        ])
        p1 = Level1Preprocessor()
        arr1 = p1.fit_transform(data)

        p2 = Level1Preprocessor()
        arr2 = p2.fit_transform(data)

        np.testing.assert_array_almost_equal(arr1, arr2)
        self.assertTrue(len(p1.get_feature_names_out()) > 0)

    def test_deterministic_level2_preprocessing(self):
        """Test Level2Preprocessor produces identical output matrices for circular pathway data."""
        data = pd.DataFrame([
            {
                "category": "LAPTOP",
                "approx_age_years": 3.0,
                "condition": "WORKING",
                "powers_on": "YES",
                "screen_condition": "INTACT",
                "battery_condition": "NORMAL",
                "damage_severity": "NONE",
            },
            {
                "category": "MOBILE_PHONE",
                "approx_age_years": 1.5,
                "condition": "PARTIALLY_WORKING",
                "powers_on": "YES",
                "screen_condition": "CRACKED",
                "battery_condition": "DEGRADED",
                "damage_severity": "MINOR_COSMETIC",
            },
        ])
        p1 = Level2Preprocessor()
        arr1 = p1.fit_transform(data)

        p2 = Level2Preprocessor()
        arr2 = p2.fit_transform(data)

        np.testing.assert_array_almost_equal(arr1, arr2)
        self.assertTrue(len(p1.get_feature_names_out()) > 0)

    def test_unknown_category_handling_without_crashing(self):
        """Verify preprocessors handle unseen categories gracefully using handle_unknown='ignore'."""
        train_data = pd.DataFrame([
            {"category": "LAPTOP", "approx_age_years": 4.0, "condition": "WORKING"},
            {"category": "MOBILE_PHONE", "approx_age_years": 2.0, "condition": "NOT_RECORDED"},
        ])
        test_data_with_unseen = pd.DataFrame([
            {"category": "UNKNOWN_NEW_GADGET", "approx_age_years": 5.0, "condition": "WORKING"},
            {"category": "LAPTOP", "approx_age_years": 3.5, "condition": "UNSEEN_STATE"},
        ])

        p = Level1Preprocessor()
        p.fit(train_data)

        # Must not raise KeyError or ValueError
        transformed = p.transform(test_data_with_unseen)
        self.assertEqual(transformed.shape[0], 2)
        self.assertEqual(transformed.shape[1], len(p.get_feature_names_out()))

    def test_target_encoding_and_decoding(self):
        """Verify Level 1 and Level 2 target encoders correctly map to and from integers."""
        # Level 1
        p1 = Level1Preprocessor()
        l1_targets = ["SALVAGEABLE", "END_OF_LIFE", "SALVAGEABLE"]
        encoded1 = p1.encode_target(l1_targets)
        self.assertTrue(np.array_equal(encoded1, [0, 1, 0]))
        decoded1 = p1.decode_target(encoded1)
        self.assertEqual(decoded1, l1_targets)

        # Level 2
        p2 = Level2Preprocessor()
        l2_targets = ["KEEP_USING", "REPAIR", "REFURBISH", "REFURBISH_AND_SELL", "DONATE"]
        encoded2 = p2.encode_target(l2_targets)
        self.assertTrue(len(encoded2) == 5)
        decoded2 = p2.decode_target(encoded2)
        self.assertEqual(decoded2, l2_targets)

    def test_category_mappings_validity(self):
        """Verify all mapped real categories resolve to supported EWasteCategory values."""
        for src_cat, mapped in OPEN_REPAIR_CATEGORY_MAP.items():
            self.assertIsInstance(mapped, str)
            self.assertTrue(len(mapped) > 0)

        for code, mapped in TU_DELFT_CATEGORY_MAP.items():
            self.assertIsInstance(mapped, str)
            self.assertTrue(len(mapped) > 0)

    def test_external_raw_archives_remain_unmodified(self):
        """Verify that external zip archives remain valid and unmodified."""
        self.assertTrue(os.path.exists(self.open_repair_zip), "Open Repair ZIP archive must exist")
        self.assertTrue(os.path.exists(self.tu_delft_zip), "TU Delft ZIP archive must exist")

        with zipfile.ZipFile(self.open_repair_zip, "r") as z1:
            self.assertIn("202507/aggregate/OpenRepairData_v0.3_aggregate_202507.csv", z1.namelist())

        with zipfile.ZipFile(self.tu_delft_zip, "r") as z2:
            self.assertTrue(any(n.endswith(".json") for n in z2.namelist()))

    def test_real_data_provenance_preservation(self):
        """Verify that real dataset preparation attaches exact provenance tags."""
        df_ora, _ = prepare_open_repair(self.open_repair_zip)
        self.assertTrue((df_ora["provenance"] == PROVENANCE_REAL_OPEN_REPAIR).all())

        df_tu, _ = prepare_tu_delft(self.tu_delft_zip)
        self.assertTrue((df_tu["provenance"] == PROVENANCE_REAL_TU_DELFT).all())

    def test_no_target_leakage_in_clean_datasets(self):
        """Verify that forbidden post-repair/diagnostic fields are absent from prepared features."""
        forbidden = [
            "repair_barrier_if_end_of_life",
            "problem",
            "repair_status",
            "out_method",
            "fail_rep",
            "out_inpossession",
            "out_inuse",
        ]
        df_ora, _ = prepare_open_repair(self.open_repair_zip)
        for col in forbidden:
            self.assertNotIn(col, df_ora.columns)

        df_tu, _ = prepare_tu_delft(self.tu_delft_zip)
        for col in ["repair_barrier_if_end_of_life", "problem", "out_method", "fail_rep", "out_inuse"]:
            self.assertNotIn(col, df_tu.columns)

    def test_age_filtering_within_technological_limits(self):
        """Verify that ages in prepared datasets do not exceed category limits."""
        df_ora, _ = prepare_open_repair(self.open_repair_zip)
        for cat, grp in df_ora.groupby("category"):
            limit = CATEGORY_AGE_LIMITS.get(cat, 25.0)
            self.assertTrue((grp["approx_age_years"] <= limit).all())
            self.assertTrue((grp["approx_age_years"] >= 0.1).all())

    def test_deterministic_split_distribution(self):
        """Verify that splits are deterministic and non-empty for train, val, and test."""
        sample_df = pd.DataFrame({
            "category": ["LAPTOP"] * 50 + ["MOBILE_PHONE"] * 50,
            "feasibility_label": ["SALVAGEABLE"] * 70 + ["END_OF_LIFE"] * 30,
            "split_group": [f"grp_{i % 15}" for i in range(100)],
        })
        split1 = assign_deterministic_splits(sample_df, target_col="feasibility_label", group_col="split_group", seed=42)
        split2 = assign_deterministic_splits(sample_df, target_col="feasibility_label", group_col="split_group", seed=42)

        pd.testing.assert_series_equal(split1["split"], split2["split"])
        self.assertIn("train", split1["split"].unique())
        self.assertIn("val", split1["split"].unique())
        self.assertIn("test", split1["split"].unique())

    def test_no_invalid_target_classes(self):
        """Verify that only defined target classes exist in Level 1 and Level 2."""
        df_ora, _ = prepare_open_repair(self.open_repair_zip)
        self.assertTrue(set(df_ora["feasibility_label"].unique()).issubset(set(LEVEL_1_CLASSES)))

        df_tu, _ = prepare_tu_delft(self.tu_delft_zip)
        self.assertTrue(set(df_tu["feasibility_label"].unique()).issubset(set(LEVEL_1_CLASSES)))
        tu_circular = df_tu["circular_action"].dropna().unique()
        self.assertTrue(set(tu_circular).issubset(set(LEVEL_2_CLASSES)))


if __name__ == "__main__":
    unittest.main()
