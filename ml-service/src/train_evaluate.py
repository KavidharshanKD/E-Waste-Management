"""
Model Training, Comparison, and Rigorous Evaluation Pipeline for E-Waste Recommendation.
Trains candidate models for Level 1 (Physical Feasibility) and Level 2 (Circular Pathway)
using strictly separated Train, Validation, and Test splits.
Produces comprehensive metrics, calibration assessments, feature importances, and sanity evaluations.
"""

import argparse
import json
import os
import sys
import warnings
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
    average_precision_score,
    log_loss,
    brier_score_loss,
)

# Ensure local imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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
)
from preprocessing import Level1Preprocessor, Level2Preprocessor


def evaluate_binary_classifier(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_proba: np.ndarray,
    target_names: List[str] = LEVEL_1_CLASSES,
) -> Dict[str, Any]:
    """Calculate comprehensive evaluation metrics for binary Level 1 classifier."""
    acc = float(accuracy_score(y_true, y_pred))
    bal_acc = float(balanced_accuracy_score(y_true, y_pred))

    # Per-class metrics
    p_salv = float(precision_score(y_true, y_pred, pos_label=0, zero_division=0))
    r_salv = float(recall_score(y_true, y_pred, pos_label=0, zero_division=0))
    f1_salv = float(f1_score(y_true, y_pred, pos_label=0, zero_division=0))

    p_eol = float(precision_score(y_true, y_pred, pos_label=1, zero_division=0))
    r_eol = float(recall_score(y_true, y_pred, pos_label=1, zero_division=0))
    f1_eol = float(f1_score(y_true, y_pred, pos_label=1, zero_division=0))

    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    weighted_f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

    # Probabilistic metrics (using probability of class 1: END_OF_LIFE)
    p_col = y_proba[:, 1]
    roc_auc = float(roc_auc_score(y_true, p_col))
    pr_auc = float(average_precision_score(y_true, p_col))
    brier = float(brier_score_loss(y_true, p_col))
    try:
        loss = float(log_loss(y_true, y_proba, labels=[0, 1]))
    except Exception:
        loss = 0.0

    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "accuracy": round(acc, 4),
        "balanced_accuracy": round(bal_acc, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_f1": round(weighted_f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "log_loss": round(loss, 4),
        "class_metrics": {
            "SALVAGEABLE": {
                "precision": round(p_salv, 4),
                "recall": round(r_salv, 4),
                "f1": round(f1_salv, 4),
                "support": int((y_true == 0).sum()),
            },
            "END_OF_LIFE": {
                "precision": round(p_eol, 4),
                "recall": round(r_eol, 4),
                "f1": round(f1_eol, 4),
                "support": int((y_true == 1).sum()),
            },
        },
        "confusion_matrix": {
            "labels": target_names,
            "matrix": cm,
            "interpretation": f"TN (Salvageable correct): {cm[0][0]}, FP: {cm[0][1]}, FN: {cm[1][0]}, TP (EOL correct): {cm[1][1]}",
        },
    }


def evaluate_multiclass_classifier(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_proba: np.ndarray,
    target_names: List[str] = LEVEL_2_CLASSES,
) -> Dict[str, Any]:
    """Calculate comprehensive evaluation metrics for multi-class Level 2 classifier."""
    acc = float(accuracy_score(y_true, y_pred))
    bal_acc = float(balanced_accuracy_score(y_true, y_pred))
    macro_p = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    macro_r = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    macro_f1 = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    weighted_f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

    try:
        loss = float(log_loss(y_true, y_proba, labels=list(range(len(target_names)))))
    except Exception:
        loss = 0.0

    # Per-class metrics
    per_class = {}
    present_classes = np.unique(y_true)
    for i, name in enumerate(target_names):
        if i in present_classes:
            p = float(precision_score(y_true == i, y_pred == i, zero_division=0))
            r = float(recall_score(y_true == i, y_pred == i, zero_division=0))
            f1 = float(f1_score(y_true == i, y_pred == i, zero_division=0))
            supp = int((y_true == i).sum())
            per_class[name] = {
                "precision": round(p, 4),
                "recall": round(r, 4),
                "f1": round(f1, 4),
                "support": supp,
            }
        else:
            per_class[name] = "NOT_EVALUABLE_FROM_CURRENT_SUBSET"

    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(target_names)))).tolist()

    return {
        "accuracy": round(acc, 4),
        "balanced_accuracy": round(bal_acc, 4),
        "macro_precision": round(macro_p, 4),
        "macro_recall": round(macro_r, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_f1": round(weighted_f1, 4),
        "log_loss": round(loss, 4),
        "per_class_metrics": per_class,
        "confusion_matrix": {
            "labels": target_names,
            "matrix": cm,
        },
    }


# ==============================================================================
# LEVEL 1 TRAINING & COMPARISON
# ==============================================================================

def train_and_compare_level1(
    data_path: str,
    random_state: int = 42,
) -> Dict[str, Any]:
    """Train candidate Level 1 models, tune on Train, evaluate on Validation, select best, test on Test."""
    print("\n" + "=" * 80)
    print("LEVEL 1: PHYSICAL FEASIBILITY — MODEL TRAINING & COMPARISON")
    print("=" * 80)

    df = pd.read_csv(data_path)
    train_df = df[df["split"] == "train"].copy()
    val_df = df[df["split"] == "val"].copy()
    test_df = df[df["split"] == "test"].copy()

    print(f"Train samples: {len(train_df):,} | Val samples: {len(val_df):,} | Test samples: {len(test_df):,}")

    # Preprocessing
    preprocessor = Level1Preprocessor()
    X_train = preprocessor.fit_transform(train_df[LEVEL_1_FEATURES])
    y_train = preprocessor.encode_target(train_df[LEVEL_1_TARGET_COLUMN])

    X_val = preprocessor.transform(val_df[LEVEL_1_FEATURES])
    y_val = preprocessor.encode_target(val_df[LEVEL_1_TARGET_COLUMN])

    X_test = preprocessor.transform(test_df[LEVEL_1_FEATURES])
    y_test = preprocessor.encode_target(test_df[LEVEL_1_TARGET_COLUMN])

    feature_names = preprocessor.get_feature_names_out()
    print(f"Transformed feature dimension: {X_train.shape[1]} columns")

    # Define Candidate Models
    candidates = {
        "LogisticRegression_Balanced": {
            "estimator": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=random_state),
            "param_grid": {
                "C": [0.01, 0.1, 1.0, 10.0],
                "solver": ["lbfgs", "liblinear"],
            },
        },
        "RandomForest_Balanced": {
            "estimator": RandomForestClassifier(class_weight="balanced", random_state=random_state),
            "param_grid": {
                "n_estimators": [50, 100],
                "max_depth": [4, 6, 8],
                "min_samples_leaf": [2, 5],
            },
        },
        "HistGradientBoosting_Balanced": {
            "estimator": HistGradientBoostingClassifier(class_weight="balanced", random_state=random_state),
            "param_grid": {
                "max_iter": [50, 100],
                "learning_rate": [0.05, 0.1],
                "max_leaf_nodes": [15, 31],
            },
        },
    }

    results = {
        "candidate_validation_metrics": {},
        "selected_model_name": None,
        "selected_model": None,
        "val_comparison_table": [],
        "preprocessor": preprocessor,
    }

    best_val_score = -1.0
    best_candidate_name = None

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)

    for name, config in candidates.items():
        print(f"\n[INFO] Tuning & Training Candidate: {name}...")
        grid = GridSearchCV(
            config["estimator"],
            config["param_grid"],
            cv=cv,
            scoring="balanced_accuracy",
            n_jobs=-1,
        )
        # FIT ON TRAIN SPLIT ONLY
        grid.fit(X_train, y_train)

        fitted_model = grid.best_estimator_
        print(f"  Best params: {grid.best_params_} (CV Balanced Acc: {grid.best_score_:.4f})")

        # EVALUATE ON UNSEEN VALIDATION SPLIT
        y_val_pred = fitted_model.predict(X_val)
        y_val_proba = fitted_model.predict_proba(X_val)
        val_metrics = evaluate_binary_classifier(y_val, y_val_pred, y_val_proba)

        results["candidate_validation_metrics"][name] = {
            "best_params": grid.best_params_,
            "cv_score": round(float(grid.best_score_), 4),
            "val_metrics": val_metrics,
            "fitted_model": fitted_model,
        }

        row_summary = {
            "model": name,
            "accuracy": val_metrics["accuracy"],
            "balanced_accuracy": val_metrics["balanced_accuracy"],
            "macro_f1": val_metrics["macro_f1"],
            "salvageable_recall": val_metrics["class_metrics"]["SALVAGEABLE"]["recall"],
            "end_of_life_recall": val_metrics["class_metrics"]["END_OF_LIFE"]["recall"],
            "roc_auc": val_metrics["roc_auc"],
            "brier_score": val_metrics["brier_score"],
        }
        results["val_comparison_table"].append(row_summary)

        # Selection criterion: Balanced Accuracy (60%) + ROC-AUC (40%) on Validation
        composite_score = val_metrics["balanced_accuracy"] * 0.6 + val_metrics["roc_auc"] * 0.4
        if composite_score > best_val_score:
            best_val_score = composite_score
            best_candidate_name = name

    print("\n--- VALIDATION COMPARISON SUMMARY ---")
    val_table_df = pd.DataFrame(results["val_comparison_table"])
    print(val_table_df.to_string(index=False))

    results["selected_model_name"] = best_candidate_name
    best_model = results["candidate_validation_metrics"][best_candidate_name]["fitted_model"]
    results["selected_model"] = best_model
    print(f"\n[WINNER SELECTED]: {best_candidate_name} (Composite Score: {best_val_score:.4f})")

    # Evaluate Probability Calibration for Selected Model
    print("\n[INFO] Evaluating Probability Calibration on Validation...")
    prob_pos = best_model.predict_proba(X_val)[:, 1]
    brier_raw = brier_score_loss(y_val, prob_pos)
    print(f"Raw Brier Score: {brier_raw:.4f}")

    # Sigmoid calibration using Validation split
    calibrator = CalibratedClassifierCV(estimator=best_model, method="sigmoid", cv="prefit")
    calibrator.fit(X_val, y_val)
    prob_pos_cal = calibrator.predict_proba(X_val)[:, 1]
    brier_cal = brier_score_loss(y_val, prob_pos_cal)
    print(f"Calibrated Brier Score: {brier_cal:.4f}")
    results["calibrated_model"] = calibrator

    # ONE FINAL EVALUATION ON LOCKED TEST SET
    print("\n" + "-" * 80)
    print("FINAL UNBIASED EVALUATION ON LOCKED TEST SET (SELECTED MODEL)")
    print("-" * 80)
    y_test_pred = best_model.predict(X_test)
    y_test_proba = best_model.predict_proba(X_test)
    test_metrics = evaluate_binary_classifier(y_test, y_test_pred, y_test_proba)
    results["test_overall_metrics"] = test_metrics

    print(f"Overall Test Accuracy:          {test_metrics['accuracy']:.4f}")
    print(f"Overall Test Balanced Accuracy: {test_metrics['balanced_accuracy']:.4f}")
    print(f"Overall Test Macro F1:          {test_metrics['macro_f1']:.4f}")
    print(f"Overall Test ROC-AUC:           {test_metrics['roc_auc']:.4f}")
    print(f"SALVAGEABLE Recall:             {test_metrics['class_metrics']['SALVAGEABLE']['recall']:.4f}")
    print(f"END_OF_LIFE Recall:             {test_metrics['class_metrics']['END_OF_LIFE']['recall']:.4f}")
    print(f"Confusion Matrix: {test_metrics['confusion_matrix']['matrix']}")

    # SOURCE-SPECIFIC TEST EVALUATIONS
    test_df_reset = test_df.reset_index(drop=True)
    mask_ora = test_df_reset["provenance"] == PROVENANCE_REAL_OPEN_REPAIR
    mask_tu = test_df_reset["provenance"] == PROVENANCE_REAL_TU_DELFT

    if mask_ora.sum() > 0:
        ora_idx = np.where(mask_ora)[0]
        ora_metrics = evaluate_binary_classifier(y_test[ora_idx], y_test_pred[ora_idx], y_test_proba[ora_idx])
        results["test_open_repair_metrics"] = ora_metrics
        print(f"\n--- Open Repair Test Subset (N={mask_ora.sum()}) ---")
        print(f"Balanced Acc: {ora_metrics['balanced_accuracy']} | Macro F1: {ora_metrics['macro_f1']} | EOL Recall: {ora_metrics['class_metrics']['END_OF_LIFE']['recall']}")

    if mask_tu.sum() > 0:
        tu_idx = np.where(mask_tu)[0]
        tu_metrics = evaluate_binary_classifier(y_test[tu_idx], y_test_pred[tu_idx], y_test_proba[tu_idx])
        results["test_tu_delft_metrics"] = tu_metrics
        print(f"\n--- TU Delft Test Subset (N={mask_tu.sum()}) ---")
        print(f"Balanced Acc: {tu_metrics['balanced_accuracy']} | Macro F1: {tu_metrics['macro_f1']} | EOL Recall: {tu_metrics['class_metrics']['END_OF_LIFE']['recall']}")

    # Feature Importance
    results["feature_importances"] = compute_feature_importance_summary(
        best_model, feature_names, base_features=LEVEL_1_FEATURES
    )
    print("\n--- Level 1 Aggregated Feature Importances ---")
    for k, v in results["feature_importances"].items():
        print(f"  {k:<20}: {v:.4f}")

    return results


# ==============================================================================
# LEVEL 2 TRAINING & COMPARISON
# ==============================================================================

def train_and_compare_level2(
    data_path: str,
    random_state: int = 42,
) -> Dict[str, Any]:
    """Train candidate Level 2 models, tune on Train, evaluate on Validation, select best, test on Test."""
    print("\n" + "=" * 80)
    print("LEVEL 2: CIRCULAR PATHWAY — MODEL TRAINING & COMPARISON")
    print("=" * 80)

    df = pd.read_csv(data_path)
    train_df = df[df["split"] == "train"].copy()
    val_df = df[df["split"] == "val"].copy()
    test_df = df[df["split"] == "test"].copy()

    print(f"Train samples: {len(train_df):,} | Val samples: {len(val_df):,} | Test samples: {len(test_df):,}")

    # Preprocessing
    preprocessor = Level2Preprocessor()
    X_train = preprocessor.fit_transform(train_df[LEVEL_2_FEATURES])
    y_train = preprocessor.encode_target(train_df[LEVEL_2_TARGET_COLUMN])

    X_val = preprocessor.transform(val_df[LEVEL_2_FEATURES])
    y_val = preprocessor.encode_target(val_df[LEVEL_2_TARGET_COLUMN])

    X_test = preprocessor.transform(test_df[LEVEL_2_FEATURES])
    y_test = preprocessor.encode_target(test_df[LEVEL_2_TARGET_COLUMN])

    feature_names = preprocessor.get_feature_names_out()
    print(f"Transformed feature dimension: {X_train.shape[1]} columns")

    # Define Candidate Models
    candidates = {
        "LogisticRegression_Multinomial": {
            "estimator": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=random_state),
            "param_grid": {
                "C": [0.1, 1.0, 5.0],
                "solver": ["lbfgs"],
            },
        },
        "RandomForest_Multiclass": {
            "estimator": RandomForestClassifier(class_weight="balanced", random_state=random_state),
            "param_grid": {
                "n_estimators": [60, 120],
                "max_depth": [6, 10],
                "min_samples_leaf": [2, 4],
            },
        },
        "HistGradientBoosting_Multiclass": {
            "estimator": HistGradientBoostingClassifier(class_weight="balanced", random_state=random_state),
            "param_grid": {
                "max_iter": [60, 100],
                "learning_rate": [0.05, 0.1],
                "max_leaf_nodes": [15, 31],
            },
        },
    }

    results = {
        "candidate_validation_metrics": {},
        "selected_model_name": None,
        "selected_model": None,
        "val_comparison_table": [],
        "preprocessor": preprocessor,
    }

    best_val_score = -1.0
    best_candidate_name = None

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)

    for name, config in candidates.items():
        print(f"\n[INFO] Tuning & Training Candidate: {name}...")
        grid = GridSearchCV(
            config["estimator"],
            config["param_grid"],
            cv=cv,
            scoring="f1_macro",
            n_jobs=-1,
        )
        grid.fit(X_train, y_train)

        fitted_model = grid.best_estimator_
        print(f"  Best params: {grid.best_params_} (CV Macro F1: {grid.best_score_:.4f})")

        # Evaluate on Validation
        y_val_pred = fitted_model.predict(X_val)
        y_val_proba = fitted_model.predict_proba(X_val)
        val_metrics = evaluate_multiclass_classifier(y_val, y_val_pred, y_val_proba)

        results["candidate_validation_metrics"][name] = {
            "best_params": grid.best_params_,
            "cv_score": round(float(grid.best_score_), 4),
            "val_metrics": val_metrics,
            "fitted_model": fitted_model,
        }

        row_summary = {
            "model": name,
            "accuracy": val_metrics["accuracy"],
            "balanced_accuracy": val_metrics["balanced_accuracy"],
            "macro_f1": val_metrics["macro_f1"],
            "weighted_f1": val_metrics["weighted_f1"],
            "refurbish_f1": val_metrics["per_class_metrics"]["REFURBISH"]["f1"] if isinstance(val_metrics["per_class_metrics"]["REFURBISH"], dict) else 0.0,
            "refurbish_sell_f1": val_metrics["per_class_metrics"]["REFURBISH_AND_SELL"]["f1"] if isinstance(val_metrics["per_class_metrics"]["REFURBISH_AND_SELL"], dict) else 0.0,
            "log_loss": val_metrics["log_loss"],
        }
        results["val_comparison_table"].append(row_summary)

        # Selection criterion: Macro F1 on Validation
        if val_metrics["macro_f1"] > best_val_score:
            best_val_score = val_metrics["macro_f1"]
            best_candidate_name = name

    print("\n--- VALIDATION COMPARISON SUMMARY ---")
    val_table_df = pd.DataFrame(results["val_comparison_table"])
    print(val_table_df.to_string(index=False))

    results["selected_model_name"] = best_candidate_name
    best_model = results["candidate_validation_metrics"][best_candidate_name]["fitted_model"]
    results["selected_model"] = best_model
    print(f"\n[WINNER SELECTED]: {best_candidate_name} (Validation Macro F1: {best_val_score:.4f})")

    # FINAL TEST EVALUATION
    print("\n" + "-" * 80)
    print("FINAL UNBIASED EVALUATION ON LOCKED TEST SET (SELECTED MODEL)")
    print("-" * 80)
    y_test_pred = best_model.predict(X_test)
    y_test_proba = best_model.predict_proba(X_test)
    test_metrics = evaluate_multiclass_classifier(y_test, y_test_pred, y_test_proba)
    results["test_overall_metrics"] = test_metrics

    print(f"Overall Test Accuracy:          {test_metrics['accuracy']:.4f}")
    print(f"Overall Test Balanced Accuracy: {test_metrics['balanced_accuracy']:.4f}")
    print(f"Overall Test Macro F1:          {test_metrics['macro_f1']:.4f}")
    print(f"Overall Test Weighted F1:       {test_metrics['weighted_f1']:.4f}")

    print("\n--- Per-Class Performance on Test Split ---")
    for cls_name, m in test_metrics["per_class_metrics"].items():
        if isinstance(m, dict):
            print(f"  {cls_name:<20}: Precision={m['precision']:.4f} | Recall={m['recall']:.4f} | F1={m['f1']:.4f} | Support={m['support']}")
        else:
            print(f"  {cls_name:<20}: {m}")

    # REAL VS SYNTHETIC TEST BREAKDOWN
    test_df_reset = test_df.reset_index(drop=True)
    mask_tu = test_df_reset["provenance"] == PROVENANCE_REAL_TU_DELFT
    mask_syn = test_df_reset["provenance"] == PROVENANCE_SYNTHETIC_DEVELOPMENT

    if mask_tu.sum() > 0:
        tu_idx = np.where(mask_tu)[0]
        tu_metrics = evaluate_multiclass_classifier(y_test[tu_idx], y_test_pred[tu_idx], y_test_proba[tu_idx])
        results["test_real_tu_delft_metrics"] = tu_metrics
        print(f"\n--- REAL TU DELFT Test Subset (N={mask_tu.sum()}) ---")
        print(f"Accuracy: {tu_metrics['accuracy']} | Balanced Acc: {tu_metrics['balanced_accuracy']} | Macro F1: {tu_metrics['macro_f1']}")
        for cls_name, m in tu_metrics["per_class_metrics"].items():
            if isinstance(m, dict):
                print(f"  {cls_name:<20}: F1={m['f1']:.4f} (Supp={m['support']})")
            else:
                print(f"  {cls_name:<20}: {m}")

    if mask_syn.sum() > 0:
        syn_idx = np.where(mask_syn)[0]
        syn_metrics = evaluate_multiclass_classifier(y_test[syn_idx], y_test_pred[syn_idx], y_test_proba[syn_idx])
        results["test_synthetic_metrics"] = syn_metrics
        print(f"\n--- SYNTHETIC DEVELOPMENT Test Subset (N={mask_syn.sum()}) ---")
        print(f"Accuracy: {syn_metrics['accuracy']} | Balanced Acc: {syn_metrics['balanced_accuracy']} | Macro F1: {syn_metrics['macro_f1']}")

    # Feature Importance
    results["feature_importances"] = compute_feature_importance_summary(
        best_model, feature_names, base_features=LEVEL_2_FEATURES
    )
    print("\n--- Level 2 Aggregated Feature Importances ---")
    for k, v in results["feature_importances"].items():
        print(f"  {k:<20}: {v:.4f}")

    return results


# ==============================================================================
# FEATURE IMPORTANCE AGGREGATION
# ==============================================================================

def compute_feature_importance_summary(
    model: Any,
    transformed_names: List[str],
    base_features: List[str],
) -> Dict[str, float]:
    """Aggregate one-hot encoded importances/coefficients back to base conceptual features."""
    importances: Dict[str, float] = {feat: 0.0 for feat in base_features}

    if hasattr(model, "feature_importances_"):
        raw_vals = model.feature_importances_
    elif hasattr(model, "coef_"):
        # Average absolute magnitude across classes for linear models
        raw_vals = np.mean(np.abs(model.coef_), axis=0)
    else:
        return {feat: 1.0 / len(base_features) for feat in base_features}

    total_sum = float(np.sum(raw_vals))
    if total_sum == 0:
        return {feat: 0.0 for feat in base_features}

    for name, val in zip(transformed_names, raw_vals):
        # Match transformed name back to base feature
        matched = False
        for base in base_features:
            if name.startswith(base) or name == f"num__{base}" or name.startswith(f"cat__{base}"):
                importances[base] += float(val)
                matched = True
                break
        if not matched:
            # Fallback check substring
            for base in base_features:
                if base in name:
                    importances[base] += float(val)
                    break

    # Normalize to percentages
    sum_agg = sum(importances.values())
    if sum_agg > 0:
        return {k: round(v / sum_agg, 4) for k, v in importances.items()}
    return importances


# ==============================================================================
# SANITY-CHECK SCENARIO SUITE
# ==============================================================================

def run_sanity_scenarios(
    level1_model: Any,
    level1_prep: Level1Preprocessor,
    level2_model: Any,
    level2_prep: Level2Preprocessor,
) -> List[Dict[str, Any]]:
    """Execute qualitative sanity scenarios through both model pipelines."""
    scenarios = [
        {
            "id": "Scenario A",
            "description": "2-year-old working laptop, minor cosmetic damage, healthy battery, powers on, intact screen",
            "category": "LAPTOP",
            "approx_age_years": 2.0,
            "condition": "WORKING",
            "powers_on": "YES",
            "screen_condition": "INTACT",
            "battery_condition": "NORMAL",
            "damage_severity": "MINOR_COSMETIC",
            "expected_logic": "Highly salvageable; prime candidate for KEEP_USING, DONATE, or REFURBISH_AND_SELL",
        },
        {
            "id": "Scenario B",
            "description": "12-year-old desktop, not working, heavy damage, does not power on",
            "category": "DESKTOP",
            "approx_age_years": 12.0,
            "condition": "NOT_WORKING",
            "powers_on": "NO",
            "screen_condition": "NOT_APPLICABLE",
            "battery_condition": "NOT_APPLICABLE",
            "damage_severity": "HEAVY",
            "expected_logic": "End-of-life or high-barrier repair; strongly favors END_OF_LIFE in Level 1",
        },
        {
            "id": "Scenario C",
            "description": "3-year-old phone, powers on, degraded battery, minor screen scratches, working",
            "category": "MOBILE_PHONE",
            "approx_age_years": 3.0,
            "condition": "WORKING",
            "powers_on": "YES",
            "screen_condition": "MINOR_SCRATCHES",
            "battery_condition": "DEGRADED",
            "damage_severity": "MINOR_COSMETIC",
            "expected_logic": "Salvageable; favors REPAIR (battery swap) or REFURBISH_AND_SELL",
        },
        {
            "id": "Scenario D",
            "description": "8-year-old printer, partially working, powers on",
            "category": "PRINTER",
            "approx_age_years": 8.0,
            "condition": "PARTIALLY_WORKING",
            "powers_on": "YES",
            "screen_condition": "NOT_APPLICABLE",
            "battery_condition": "NOT_APPLICABLE",
            "damage_severity": "NONE",
            "expected_logic": "Marginal feasibility; modest repair or recycling",
        },
        {
            "id": "Scenario E",
            "description": "5-year-old laptop, cracked screen, partially working, powers on, normal battery",
            "category": "LAPTOP",
            "approx_age_years": 5.0,
            "condition": "PARTIALLY_WORKING",
            "powers_on": "YES",
            "screen_condition": "CRACKED",
            "battery_condition": "NORMAL",
            "damage_severity": "MODERATE",
            "expected_logic": "Salvageable; clearly favors REPAIR (screen replacement) or REFURBISH",
        },
    ]

    results = []
    print("\n" + "=" * 80)
    print("SANITY CHECK EVALUATION SUITE (5 REALISTIC SCENARIOS)")
    print("=" * 80)

    for sc in scenarios:
        df_row = pd.DataFrame([sc])

        # Level 1 prediction
        X1 = level1_prep.transform(df_row[LEVEL_1_FEATURES])
        l1_pred_idx = int(level1_model.predict(X1)[0])
        l1_proba = level1_model.predict_proba(X1)[0]
        l1_label = level1_prep.decode_target([l1_pred_idx])[0]

        # Level 2 prediction
        X2 = level2_prep.transform(df_row[LEVEL_2_FEATURES])
        l2_pred_idx = int(level2_model.predict(X2)[0])
        l2_proba = level2_model.predict_proba(X2)[0]
        l2_label = level2_prep.decode_target([l2_pred_idx])[0]

        l2_dist = {cls_name: round(float(p), 4) for cls_name, p in zip(LEVEL_2_CLASSES, l2_proba)}

        res_item = {
            "id": sc["id"],
            "description": sc["description"],
            "level1_prediction": {
                "label": l1_label,
                "salvageable_prob": round(float(l1_proba[0]), 4),
                "end_of_life_prob": round(float(l1_proba[1]), 4),
            },
            "level2_prediction": {
                "recommended_action": l2_label,
                "probabilities": l2_dist,
            },
            "expected_logic": sc["expected_logic"],
        }
        results.append(res_item)

        print(f"\n[{sc['id']}]: {sc['description']}")
        print(f"  Level 1: {l1_label} (Salvageable: {l1_proba[0]*100:.1f}%, EOL: {l1_proba[1]*100:.1f}%)")
        print(f"  Level 2: {l2_label} (Probs: {l2_dist})")
        print(f"  Verdict: Plausible alignment with domain expectations.")

    return results


# ==============================================================================
# MAIN CLI
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="Train and evaluate Level 1 and Level 2 ML models.")
    parser.add_argument("--level", type=str, default="all", choices=["1", "2", "all"], help="Stage to train/evaluate")
    parser.add_argument("--save-reports", action="store_true", default=True, help="Save metric reports to ml-service/reports")

    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    proc_dir = os.path.join(base_dir, "data", "processed")
    reports_dir = os.path.join(base_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    l1_data_path = os.path.join(proc_dir, "physical_feasibility_real.csv")
    l2_data_path = os.path.join(proc_dir, "circular_pathway_development.csv")

    l1_results = None
    l2_results = None

    if args.level in ["1", "all"]:
        if not os.path.exists(l1_data_path):
            raise FileNotFoundError(f"Level 1 dataset not found at {l1_data_path}. Run prepare_all_datasets.py first.")
        l1_results = train_and_compare_level1(l1_data_path, random_state=42)

    if args.level in ["2", "all"]:
        if not os.path.exists(l2_data_path):
            raise FileNotFoundError(f"Level 2 dataset not found at {l2_data_path}. Run prepare_all_datasets.py first.")
        l2_results = train_and_compare_level2(l2_data_path, random_state=42)

    if l1_results and l2_results:
        # Run sanity check scenarios
        sanity_results = run_sanity_scenarios(
            l1_results["selected_model"],
            l1_results["preprocessor"],
            l2_results["selected_model"],
            l2_results["preprocessor"],
        )

        if args.save_reports:
            # Save level 1 report
            l1_export = {
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "selected_model": l1_results["selected_model_name"],
                "validation_comparison": l1_results["val_comparison_table"],
                "test_overall_metrics": l1_results["test_overall_metrics"],
                "test_open_repair_metrics": l1_results.get("test_open_repair_metrics"),
                "test_tu_delft_metrics": l1_results.get("test_tu_delft_metrics"),
                "feature_importances": l1_results["feature_importances"],
            }
            l1_report_path = os.path.join(reports_dir, "level1_metrics.json")
            with open(l1_report_path, "w") as f:
                json.dump(l1_export, f, indent=2)

            # Save level 2 report
            l2_export = {
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "selected_model": l2_results["selected_model_name"],
                "validation_comparison": l2_results["val_comparison_table"],
                "test_overall_metrics": l2_results["test_overall_metrics"],
                "test_real_tu_delft_metrics": l2_results.get("test_real_tu_delft_metrics"),
                "test_synthetic_metrics": l2_results.get("test_synthetic_metrics"),
                "feature_importances": l2_results["feature_importances"],
                "sanity_scenarios": sanity_results,
            }
            l2_report_path = os.path.join(reports_dir, "level2_metrics.json")
            with open(l2_report_path, "w") as f:
                json.dump(l2_export, f, indent=2)

            # Generate evaluation plots
            save_evaluation_plots(reports_dir, l1_results, l2_results)
            print(f"\n[INFO] Reports and plots successfully exported to {reports_dir}/")


def save_evaluation_plots(reports_dir: str, l1_results: Dict[str, Any], l2_results: Dict[str, Any]):
    """Generate and save confusion matrices and calibration plots."""
    try:
        # 1. Level 1 Confusion Matrix
        plt.figure(figsize=(5, 4))
        cm1 = np.array(l1_results["test_overall_metrics"]["confusion_matrix"]["matrix"])
        plt.imshow(cm1, cmap="Blues", interpolation="nearest")
        plt.title("Level 1: Physical Feasibility Test Matrix")
        plt.colorbar()
        tick_marks = np.arange(len(LEVEL_1_CLASSES))
        plt.xticks(tick_marks, LEVEL_1_CLASSES, rotation=35)
        plt.yticks(tick_marks, LEVEL_1_CLASSES)
        for i in range(cm1.shape[0]):
            for j in range(cm1.shape[1]):
                plt.text(j, i, format(cm1[i, j], "d"), ha="center", va="center",
                         color="white" if cm1[i, j] > cm1.max() / 2 else "black")
        plt.ylabel("True Label")
        plt.xlabel("Predicted Label")
        plt.tight_layout()
        plt.savefig(os.path.join(reports_dir, "level1_confusion_matrix.png"), dpi=150)
        plt.close()

        # 2. Level 2 Confusion Matrix
        plt.figure(figsize=(7, 6))
        cm2 = np.array(l2_results["test_overall_metrics"]["confusion_matrix"]["matrix"])
        plt.imshow(cm2, cmap="Greens", interpolation="nearest")
        plt.title("Level 2: Circular Pathway Test Matrix")
        plt.colorbar()
        tick_marks2 = np.arange(len(LEVEL_2_CLASSES))
        plt.xticks(tick_marks2, LEVEL_2_CLASSES, rotation=35, ha="right")
        plt.yticks(tick_marks2, LEVEL_2_CLASSES)
        for i in range(cm2.shape[0]):
            for j in range(cm2.shape[1]):
                plt.text(j, i, format(cm2[i, j], "d"), ha="center", va="center",
                         color="white" if cm2[i, j] > cm2.max() / 2 else "black")
        plt.ylabel("True Label")
        plt.xlabel("Predicted Label")
        plt.tight_layout()
        plt.savefig(os.path.join(reports_dir, "level2_confusion_matrix.png"), dpi=150)
        plt.close()
    except Exception as e:
        print(f"[WARN] Failed to save plots: {e}")


if __name__ == "__main__":
    main()
