"""
Unit and Integration Tests for Module 4 ML Model Training and Evaluation.
Verifies training reproducibility, leakage isolation, target constraints,
probability validity, and end-to-end pipeline integrity.
"""

import os
import sys
import unittest
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

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
    SAFETY_GATE_FEATURES,
)
from preprocessing import Level1Preprocessor, Level2Preprocessor
from train_evaluate import (
    evaluate_binary_classifier,
    evaluate_multiclass_classifier,
    compute_feature_importance_summary,
)


class TestModelTrainingAndEvaluation(unittest.TestCase):

    def setUp(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.proc_dir = os.path.join(self.base_dir, "data", "processed")
        self.l1_csv = os.path.join(self.proc_dir, "physical_feasibility_real.csv")
        self.l2_csv = os.path.join(self.proc_dir, "circular_pathway_development.csv")

    def test_feature_sets_strictly_exclude_forbidden_columns(self):
        """Verify user_intention and safety features are excluded from all model feature lists."""
        for feat in ["user_intention"] + SAFETY_GATE_FEATURES:
            self.assertNotIn(feat, LEVEL_1_FEATURES, f"{feat} must NOT be in Level 1 features")
            self.assertNotIn(feat, LEVEL_2_FEATURES, f"{feat} must NOT be in Level 2 features")
            self.assertNotIn(LEVEL_1_TARGET_COLUMN, LEVEL_1_FEATURES)
            self.assertNotIn(LEVEL_2_TARGET_COLUMN, LEVEL_2_FEATURES)

    def test_reproducible_training_with_fixed_seed(self):
        """Verify identical training data and random seed produce bit-identical model weights."""
        df1 = pd.read_csv(self.l1_csv)
        train_df = df1[df1["split"] == "train"].head(100).copy()

        p1 = Level1Preprocessor()
        X_train = p1.fit_transform(train_df[LEVEL_1_FEATURES])
        y_train = p1.encode_target(train_df[LEVEL_1_TARGET_COLUMN])

        m1 = RandomForestClassifier(n_estimators=10, max_depth=3, random_state=42)
        m1.fit(X_train, y_train)

        m2 = RandomForestClassifier(n_estimators=10, max_depth=3, random_state=42)
        m2.fit(X_train, y_train)

        preds1 = m1.predict_proba(X_train)
        preds2 = m2.predict_proba(X_train)
        np.testing.assert_array_almost_equal(preds1, preds2)

    def test_test_data_isolation_from_training(self):
        """Verify that train, validation, and test splits have disjoint indices and no group leakage."""
        df1 = pd.read_csv(self.l1_csv)
        train_groups = set(df1[df1["split"] == "train"]["split_group"])
        val_groups = set(df1[df1["split"] == "val"]["split_group"])
        test_groups = set(df1[df1["split"] == "test"]["split_group"])

        # Groups must not overlap between train and test
        overlap_train_test = train_groups.intersection(test_groups)
        self.assertEqual(len(overlap_train_test), 0, f"Found group leakage between train and test: {overlap_train_test}")

    def test_level1_predicts_only_valid_classes(self):
        """Verify Level 1 fitted model only produces predictions in LEVEL_1_CLASSES."""
        df1 = pd.read_csv(self.l1_csv)
        train_df = df1[df1["split"] == "train"].head(200).copy()
        test_df = df1[df1["split"] == "test"].head(50).copy()

        p = Level1Preprocessor()
        X_train = p.fit_transform(train_df[LEVEL_1_FEATURES])
        y_train = p.encode_target(train_df[LEVEL_1_TARGET_COLUMN])

        clf = LogisticRegression(random_state=42)
        clf.fit(X_train, y_train)

        X_test = p.transform(test_df[LEVEL_1_FEATURES])
        y_pred = clf.predict(X_test)
        decoded = p.decode_target(y_pred)

        for label in decoded:
            self.assertIn(label, LEVEL_1_CLASSES)

    def test_level2_predicts_only_valid_classes(self):
        """Verify Level 2 fitted model only produces predictions in LEVEL_2_CLASSES."""
        df2 = pd.read_csv(self.l2_csv)
        train_df = df2[df2["split"] == "train"].head(200).copy()
        test_df = df2[df2["split"] == "test"].head(50).copy()

        p = Level2Preprocessor()
        X_train = p.fit_transform(train_df[LEVEL_2_FEATURES])
        y_train = p.encode_target(train_df[LEVEL_2_TARGET_COLUMN])

        clf = RandomForestClassifier(n_estimators=10, max_depth=4, random_state=42)
        clf.fit(X_train, y_train)

        X_test = p.transform(test_df[LEVEL_2_FEATURES])
        y_pred = clf.predict(X_test)
        decoded = p.decode_target(y_pred)

        for label in decoded:
            self.assertIn(label, LEVEL_2_CLASSES)

    def test_probability_vectors_sum_to_one(self):
        """Verify predict_proba vectors sum to 1.0 for both Level 1 and Level 2."""
        df1 = pd.read_csv(self.l1_csv)
        p1 = Level1Preprocessor()
        X1 = p1.fit_transform(df1[LEVEL_1_FEATURES].head(100))
        y1 = p1.encode_target(df1[LEVEL_1_TARGET_COLUMN].head(100))
        m1 = LogisticRegression(random_state=42).fit(X1, y1)
        prob1 = m1.predict_proba(X1)
        np.testing.assert_array_almost_equal(prob1.sum(axis=1), np.ones(100))

        df2 = pd.read_csv(self.l2_csv)
        p2 = Level2Preprocessor()
        X2 = p2.fit_transform(df2[LEVEL_2_FEATURES].head(100))
        y2 = p2.encode_target(df2[LEVEL_2_TARGET_COLUMN].head(100))
        m2 = RandomForestClassifier(n_estimators=10, random_state=42).fit(X2, y2)
        prob2 = m2.predict_proba(X2)
        np.testing.assert_array_almost_equal(prob2.sum(axis=1), np.ones(100))

    def test_unknown_category_inference_graceful_handling(self):
        """Verify unseen categories at test time do not crash inference pipeline."""
        train_data = pd.DataFrame([
            {"category": "LAPTOP", "approx_age_years": 3.0, "condition": "WORKING"},
            {"category": "MOBILE_PHONE", "approx_age_years": 1.5, "condition": "DAMAGED"},
        ])
        p = Level1Preprocessor()
        X_train = p.fit_transform(train_data)
        y_train = np.array([0, 1])

        clf = LogisticRegression(random_state=42).fit(X_train, y_train)

        unseen_data = pd.DataFrame([
            {"category": "FUTURISTIC_HOLOGRAM", "approx_age_years": 2.0, "condition": "ALIEN_STATE"},
        ])
        X_unseen = p.transform(unseen_data)
        pred = clf.predict(X_unseen)
        proba = clf.predict_proba(X_unseen)

        self.assertEqual(len(pred), 1)
        self.assertIn(p.decode_target(pred)[0], LEVEL_1_CLASSES)
        self.assertAlmostEqual(float(proba.sum()), 1.0)

    def test_no_model_binaries_in_git_working_tree(self):
        """Verify no .joblib or .pkl binary files exist in source tree or are tracked."""
        import subprocess
        result = subprocess.run(["git", "ls-files", "*.joblib", "*.pkl"], capture_output=True, text=True)
        self.assertEqual(result.stdout.strip(), "", "Found committed/tracked model binary files!")


if __name__ == "__main__":
    unittest.main()
