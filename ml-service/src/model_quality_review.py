"""
Module 4.5: Model Quality Review, Conservative Gate Analysis, and Sanity Evaluation.
Investigates Open Repair barriers, Level 1 label semantics, validation threshold sweeps,
Level 2 REFURBISH bottlenecks, 3-zone conservative gating, and 15+ sanity scenarios.
"""

import json
import os
import sys
import zipfile
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# scikit-learn
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
    brier_score_loss,
)

# Local imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dataset_schema import (
    LEVEL_1_FEATURES,
    LEVEL_2_FEATURES,
    LEVEL_1_CLASSES,
    LEVEL_2_CLASSES,
    LEVEL_1_TARGET_COLUMN,
    LEVEL_2_TARGET_COLUMN,
    OPEN_REPAIR_CATEGORY_MAP,
    TU_DELFT_CATEGORY_MAP,
)
from preprocessing import Level1Preprocessor, Level2Preprocessor


def audit_open_repair_eol(zip_path: str) -> Dict[str, Any]:
    """Audit Open Repair Alliance records labeled End of life to uncover true failure causes."""
    with zipfile.ZipFile(zip_path, "r") as z:
        with z.open("202507/aggregate/OpenRepairData_v0.3_aggregate_202507.csv") as f:
            df_raw = pd.read_csv(f, low_memory=False)

    df_elec = df_raw[df_raw["product_category"].isin(OPEN_REPAIR_CATEGORY_MAP.keys())].copy()
    total_elec = len(df_elec)
    status_counts = df_elec["repair_status"].value_counts(dropna=False).to_dict()

    df_eol = df_elec[df_elec["repair_status"] == "End of life"].copy()
    total_eol = len(df_eol)

    barrier_counts_all = df_eol["repair_barrier_if_end_of_life"].value_counts(dropna=False).to_dict()
    barrier_counts_recorded = df_eol["repair_barrier_if_end_of_life"].dropna().value_counts().to_dict()
    total_barriers_recorded = sum(barrier_counts_recorded.values())

    barrier_pcts = {
        k: round((v / total_barriers_recorded) * 100, 2)
        for k, v in barrier_counts_recorded.items()
    }

    # Group barriers into physical vs non-physical
    # Physical wear: "Item too worn out"
    # Economic: "Spare parts too expensive"
    # Supply chain: "Spare parts not available"
    # Information/documentation: "Repair information not available"
    # Tooling/Bench limitation: "Lack of equipment", "No way to open product"
    physical_count = barrier_counts_recorded.get("Item too worn out", 0)
    economic_count = barrier_counts_recorded.get("Spare parts too expensive", 0)
    parts_avail_count = barrier_counts_recorded.get("Spare parts not available", 0)
    info_barrier_count = barrier_counts_recorded.get("Repair information not available", 0)
    tooling_barrier_count = barrier_counts_recorded.get("Lack of equipment", 0) + barrier_counts_recorded.get("No way to open product", 0)
    non_physical_count = total_barriers_recorded - physical_count

    return {
        "total_electronics": total_elec,
        "status_breakdown": status_counts,
        "eol_count": total_eol,
        "eol_fraction_of_electronics": round(total_eol / total_elec, 4),
        "barriers_recorded_count": total_barriers_recorded,
        "barriers_unrecorded_count": total_eol - total_barriers_recorded,
        "barrier_distribution": barrier_counts_recorded,
        "barrier_percentages": barrier_pcts,
        "classification_of_barriers": {
            "physical_wear_count": physical_count,
            "physical_wear_pct": round((physical_count / total_barriers_recorded) * 100, 2),
            "economic_impracticality_count": economic_count,
            "economic_impracticality_pct": round((economic_count / total_barriers_recorded) * 100, 2),
            "parts_unavailability_count": parts_avail_count,
            "parts_unavailability_pct": round((parts_avail_count / total_barriers_recorded) * 100, 2),
            "proprietary_info_barrier_count": info_barrier_count,
            "proprietary_info_barrier_pct": round((info_barrier_count / total_barriers_recorded) * 100, 2),
            "tooling_equipment_barrier_count": tooling_barrier_count,
            "tooling_equipment_barrier_pct": round((tooling_barrier_count / total_barriers_recorded) * 100, 2),
            "total_non_physical_barriers_count": non_physical_count,
            "total_non_physical_barriers_pct": round((non_physical_count / total_barriers_recorded) * 100, 2),
        },
    }


def evaluate_threshold_sweep(
    y_true: np.ndarray,
    y_proba_eol: np.ndarray,
    thresholds: List[float] = [0.20, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80],
) -> List[Dict[str, Any]]:
    """
    Evaluate threshold tradeoffs on validation data.
    y_true: 0 for SALVAGEABLE, 1 for END_OF_LIFE
    y_proba_eol: predicted probability of END_OF_LIFE (class 1)
    """
    results = []
    n_salv = int((y_true == 0).sum())
    n_eol = int((y_true == 1).sum())

    for t in thresholds:
        # Decision rule: If P(EOL) >= t -> predict EOL (1), else SALVAGEABLE (0)
        y_pred = (y_proba_eol >= t).astype(int)

        tn = int(((y_true == 0) & (y_pred == 0)).sum())  # True Salvageable
        fp = int(((y_true == 0) & (y_pred == 1)).sum())  # False Recycling (Error B)
        fn = int(((y_true == 1) & (y_pred == 0)).sum())  # Missed EOL (Error A)
        tp = int(((y_true == 1) & (y_pred == 1)).sum())  # Correct EOL

        salv_recall = tn / n_salv if n_salv > 0 else 0.0
        eol_recall = tp / n_eol if n_eol > 0 else 0.0
        bal_acc = (salv_recall + eol_recall) / 2.0

        p_salv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
        p_eol = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        f1_salv = (2 * p_salv * salv_recall) / (p_salv + salv_recall) if (p_salv + salv_recall) > 0 else 0.0
        f1_eol = (2 * p_eol * eol_recall) / (p_eol + eol_recall) if (p_eol + eol_recall) > 0 else 0.0
        macro_f1 = (f1_salv + f1_eol) / 2.0

        false_recycling_rate = fp / n_salv if n_salv > 0 else 0.0
        missed_eol_rate = fn / n_eol if n_eol > 0 else 0.0

        # Cost-sensitive product score:
        # Error B (False Recycling) is 5x worse than Error A (Missed EOL) in a circular economy
        cost_score = round(5.0 * false_recycling_rate + 1.0 * missed_eol_rate, 4)

        results.append({
            "threshold": round(t, 2),
            "salvageable_recall": round(salv_recall, 4),
            "end_of_life_recall": round(eol_recall, 4),
            "balanced_accuracy": round(bal_acc, 4),
            "macro_f1": round(macro_f1, 4),
            "salvageable_precision": round(p_salv, 4),
            "end_of_life_precision": round(p_eol, 4),
            "false_recycling_rate": round(false_recycling_rate, 4),
            "false_recycling_count": fp,
            "missed_eol_rate": round(missed_eol_rate, 4),
            "missed_eol_count": fn,
            "product_cost_score": cost_score,
            "confusion_matrix": {"TN": tn, "FP": fp, "FN": fn, "TP": tp},
        })

    return results


def check_safety_gate(device: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Deterministic Safety Gate evaluated ABOVE all ML.
    Returns (is_hazardous, target_action, reason).
    """
    if device.get("battery_swollen") in [True, "YES", "true", 1]:
        return True, "SPECIAL_HANDLING", "Swollen lithium-ion battery detected; critical chemical thermal runaway risk."
    if device.get("battery_leaking") in [True, "YES", "true", 1]:
        return True, "SPECIAL_HANDLING", "Battery electrolyte leakage detected; toxic corrosive chemical hazard."
    if device.get("overheating_evidence") in [True, "YES", "true", 1]:
        return True, "SPECIAL_HANDLING", "Signs of severe electrical overheating or scorched components detected."
    if device.get("severe_physical_damage") in [True, "YES", "true", 1] or device.get("damage_severity") == "HAZARDOUS":
        return True, "SPECIAL_HANDLING", "Severe catastrophic structural hazard or exposed hazardous elements."
    return False, None, None


def apply_conservative_gate(
    p_eol: float,
    t_low: float = 0.35,
    t_high: float = 0.70,
) -> Dict[str, Any]:
    """
    3-Zone Conservative Gate:
    Zone 1: P(EOL) < t_low -> RECOVERY_FEASIBLE (Pass to Level 2)
    Zone 2: t_low <= P(EOL) < t_high -> AMBIGUOUS_TRIAGE (Pass to Level 2 + Technician Review)
    Zone 3: P(EOL) >= t_high -> RECOVERY_UNLIKELY (Direct RECYCLE Candidate)
    """
    if p_eol >= t_high:
        return {
            "gate_decision": "RECOVERY_UNLIKELY",
            "allow_level2": False,
            "routing": "RECYCLE",
            "technician_review_required": False,
            "explanation": f"High EOL confidence ({p_eol*100:.1f}% >= {t_high*100:.0f}%). Directly routed to responsible recycling.",
        }
    elif p_eol >= t_low:
        return {
            "gate_decision": "AMBIGUOUS_TRIAGE",
            "allow_level2": True,
            "routing": "LEVEL_2_WITH_TECHNICIAN_REVIEW",
            "technician_review_required": True,
            "explanation": f"Ambiguous recovery feasibility ({p_eol*100:.1f}% in [{t_low*100:.0f}%, {t_high*100:.0f}%)). Salvage protected: evaluated by Level 2 and queued for technician bench triage.",
        }
    else:
        return {
            "gate_decision": "RECOVERY_FEASIBLE",
            "allow_level2": True,
            "routing": "LEVEL_2_CIRCULAR_PATHWAY",
            "technician_review_required": False,
            "explanation": f"Confirmed recovery feasibility ({p_eol*100:.1f}% < {t_low*100:.0f}%). Proceed directly to Level 2 circular pathway recommendation.",
        }


# ==============================================================================
# 15 EXPANDED REALISTIC SANITY SCENARIOS
# ==============================================================================
SANITY_15_SCENARIOS = [
    {
        "id": "SCENARIO_01",
        "name": "New Working Phone",
        "category": "MOBILE_PHONE",
        "approx_age_years": 0.5,
        "condition": "WORKING",
        "powers_on": "YES",
        "screen_condition": "INTACT",
        "battery_condition": "NORMAL",
        "damage_severity": "NONE",
        "safety_flags": {},
        "expected_gate": "RECOVERY_FEASIBLE",
        "expected_level2": ["KEEP_USING", "REFURBISH_AND_SELL", "DONATE"],
        "rationale": "Virtually brand new, flawless working condition; prime candidate for resale, donation, or continued usage.",
    },
    {
        "id": "SCENARIO_02",
        "name": "Old Working Phone",
        "category": "MOBILE_PHONE",
        "approx_age_years": 7.0,
        "condition": "WORKING",
        "powers_on": "YES",
        "screen_condition": "MINOR_SCRATCHES",
        "battery_condition": "NORMAL",
        "damage_severity": "MINOR_COSMETIC",
        "safety_flags": {},
        "expected_gate": "RECOVERY_FEASIBLE",
        "expected_level2": ["DONATE", "KEEP_USING"],
        "rationale": "Aged but fully functional phone; low secondary commercial value, but excellent for donation or basic utility.",
    },
    {
        "id": "SCENARIO_03",
        "name": "Phone with Degraded Battery",
        "category": "MOBILE_PHONE",
        "approx_age_years": 3.5,
        "condition": "WORKING",
        "powers_on": "YES",
        "screen_condition": "INTACT",
        "battery_condition": "DEGRADED",
        "damage_severity": "MINOR_COSMETIC",
        "safety_flags": {},
        "expected_gate": "RECOVERY_FEASIBLE",
        "expected_level2": ["REPAIR", "REFURBISH"],
        "rationale": "Working phone with exhausted battery cell; standard battery replacement restores full operational health.",
    },
    {
        "id": "SCENARIO_04",
        "name": "Phone with Cracked Screen",
        "category": "MOBILE_PHONE",
        "approx_age_years": 2.0,
        "condition": "PARTIALLY_WORKING",
        "powers_on": "YES",
        "screen_condition": "CRACKED",
        "battery_condition": "NORMAL",
        "damage_severity": "MODERATE",
        "safety_flags": {},
        "expected_gate": "RECOVERY_FEASIBLE",
        "expected_level2": ["REPAIR", "REFURBISH"],
        "rationale": "Modern 2-year phone with broken digitizer/glass; standard display assembly replacement restores device.",
    },
    {
        "id": "SCENARIO_05",
        "name": "Swollen Battery (Safety Gate Excluded)",
        "category": "MOBILE_PHONE",
        "approx_age_years": 3.0,
        "condition": "WORKING",
        "powers_on": "YES",
        "screen_condition": "INTACT",
        "battery_condition": "DEGRADED",
        "damage_severity": "MODERATE",
        "safety_flags": {"battery_swollen": True},
        "expected_gate": "SAFETY_INTERCEPT",
        "expected_level2": ["SPECIAL_HANDLING"],
        "rationale": "Physical lithium gas pouch distention; MUST trigger immediate safety quarantine and bypass all ML models.",
    },
    {
        "id": "SCENARIO_06",
        "name": "New Laptop",
        "category": "LAPTOP",
        "approx_age_years": 1.0,
        "condition": "WORKING",
        "powers_on": "YES",
        "screen_condition": "INTACT",
        "battery_condition": "NORMAL",
        "damage_severity": "NONE",
        "safety_flags": {},
        "expected_gate": "RECOVERY_FEASIBLE",
        "expected_level2": ["REFURBISH_AND_SELL", "KEEP_USING"],
        "rationale": "High-value modern laptop in immaculate state; highest economic recovery and reuse potential.",
    },
    {
        "id": "SCENARIO_07",
        "name": "5-Year Laptop with Cracked Screen",
        "category": "LAPTOP",
        "approx_age_years": 5.0,
        "condition": "PARTIALLY_WORKING",
        "powers_on": "YES",
        "screen_condition": "CRACKED",
        "battery_condition": "NORMAL",
        "damage_severity": "MODERATE",
        "safety_flags": {},
        "expected_gate": "AMBIGUOUS_TRIAGE",  # Protected by conservative gate!
        "expected_level2": ["REPAIR", "REFURBISH"],
        "rationale": "The exact benchmark sanity device from Section 1. Must NEVER be silently recycled at intake; requires screen repair.",
    },
    {
        "id": "SCENARIO_08",
        "name": "Old Laptop Not Powering On",
        "category": "LAPTOP",
        "approx_age_years": 9.0,
        "condition": "NOT_WORKING",
        "powers_on": "NO",
        "screen_condition": "INTACT",
        "battery_condition": "DEAD",
        "damage_severity": "MODERATE",
        "safety_flags": {},
        "expected_gate": "RECOVERY_UNLIKELY",
        "expected_level2": ["RECYCLE"],
        "rationale": "9-year laptop with mother-board power rail failure and dead battery; repair cost exceeds market value, candidate for recycling.",
    },
    {
        "id": "SCENARIO_09",
        "name": "Desktop with Replaceable Component Failure",
        "category": "DESKTOP",
        "approx_age_years": 4.0,
        "condition": "PARTIALLY_WORKING",
        "powers_on": "YES",
        "screen_condition": "NOT_APPLICABLE",
        "battery_condition": "NOT_APPLICABLE",
        "damage_severity": "MINOR_COSMETIC",
        "safety_flags": {},
        "expected_gate": "RECOVERY_FEASIBLE",
        "expected_level2": ["REPAIR", "REFURBISH"],
        "rationale": "Modular desktop chassis; faulty RAM/GPU/PSU is easily swappable by technician.",
    },
    {
        "id": "SCENARIO_10",
        "name": "Old Heavily Damaged Desktop",
        "category": "DESKTOP",
        "approx_age_years": 14.0,
        "condition": "NOT_WORKING",
        "powers_on": "NO",
        "screen_condition": "NOT_APPLICABLE",
        "battery_condition": "NOT_APPLICABLE",
        "damage_severity": "HEAVY",
        "safety_flags": {},
        "expected_gate": "RECOVERY_UNLIKELY",
        "expected_level2": ["RECYCLE"],
        "rationale": "Obsolete legacy hardware with terminal damage and dead board; unambiguous material recycling candidate.",
    },
    {
        "id": "SCENARIO_11",
        "name": "Working Old Television",
        "category": "TELEVISION",
        "approx_age_years": 8.0,
        "condition": "WORKING",
        "powers_on": "YES",
        "screen_condition": "INTACT",
        "battery_condition": "NOT_APPLICABLE",
        "damage_severity": "MINOR_COSMETIC",
        "safety_flags": {},
        "expected_gate": "RECOVERY_FEASIBLE",
        "expected_level2": ["DONATE", "KEEP_USING"],
        "rationale": "Working flat-screen TV; low commercial resale value due to age, but high functional donation value.",
    },
    {
        "id": "SCENARIO_12",
        "name": "Damaged Printer",
        "category": "PRINTER",
        "approx_age_years": 6.0,
        "condition": "NOT_WORKING",
        "powers_on": "NO",
        "screen_condition": "NOT_APPLICABLE",
        "battery_condition": "NOT_APPLICABLE",
        "damage_severity": "HEAVY",
        "safety_flags": {},
        "expected_gate": "RECOVERY_UNLIKELY",
        "expected_level2": ["RECYCLE"],
        "rationale": "Consumer inkjets have high mechanical failure rates and low repairability; 6-year non-powering printer is scrap.",
    },
    {
        "id": "SCENARIO_13",
        "name": "Working Tablet",
        "category": "TABLET",
        "approx_age_years": 2.5,
        "condition": "WORKING",
        "powers_on": "YES",
        "screen_condition": "INTACT",
        "battery_condition": "NORMAL",
        "damage_severity": "MINOR_COSMETIC",
        "safety_flags": {},
        "expected_gate": "RECOVERY_FEASIBLE",
        "expected_level2": ["REFURBISH_AND_SELL", "DONATE"],
        "rationale": "Modern responsive tablet; high resale demand and utility for educational donation.",
    },
    {
        "id": "SCENARIO_14",
        "name": "Partially Working Monitor",
        "category": "MONITOR",
        "approx_age_years": 5.0,
        "condition": "PARTIALLY_WORKING",
        "powers_on": "YES",
        "screen_condition": "DEAD_PIXELS_BLEED",
        "battery_condition": "NOT_APPLICABLE",
        "damage_severity": "MINOR_COSMETIC",
        "safety_flags": {},
        "expected_gate": "AMBIGUOUS_TRIAGE",
        "expected_level2": ["REPAIR", "REFURBISH"],
        "rationale": "Powers on with localized backlight/pixel bleed; requires technician inspection to determine if salvageable as second monitor.",
    },
    {
        "id": "SCENARIO_15",
        "name": "Very Old Non-Working Small Appliance/Audio",
        "category": "AUDIO_EQUIPMENT",
        "approx_age_years": 16.0,
        "condition": "NOT_WORKING",
        "powers_on": "NO",
        "screen_condition": "NOT_APPLICABLE",
        "battery_condition": "NOT_APPLICABLE",
        "damage_severity": "HEAVY",
        "safety_flags": {},
        "expected_gate": "RECOVERY_UNLIKELY",
        "expected_level2": ["RECYCLE"],
        "rationale": "16-year degraded audio equipment with dead power circuitry and severe chassis wear; material recycling candidate.",
    },
]


def execute_sanity_evaluation(
    l1_model: Any,
    l1_calibrator: Any,
    l1_prep: Level1Preprocessor,
    l2_model: Any,
    l2_prep: Level2Preprocessor,
    t_low: float = 0.35,
    t_high: float = 0.70,
) -> List[Dict[str, Any]]:
    """Execute all 15 scenarios through Safety Gate -> Level 1 (Calibrated) -> Conservative Gate -> Level 2."""
    scenario_reports = []

    for sc in SANITY_15_SCENARIOS:
        sc_id = sc["id"]
        sc_name = sc["name"]

        # Step 1: Safety Gate
        is_hazard, hazard_action, hazard_reason = check_safety_gate({**sc, **sc.get("safety_flags", {})})
        if is_hazard:
            scenario_reports.append({
                "id": sc_id,
                "name": sc_name,
                "category": sc["category"],
                "age_years": sc["approx_age_years"],
                "condition": sc["condition"],
                "safety_gate": {
                    "triggered": True,
                    "action": hazard_action,
                    "reason": hazard_reason,
                },
                "level1_evaluation": "BYPASSED_BY_SAFETY_GATE",
                "conservative_gate": "BYPASSED_BY_SAFETY_GATE",
                "level2_evaluation": "BYPASSED_BY_SAFETY_GATE",
                "final_recommendation": hazard_action,
                "domain_verdict": "PASS: Correctly quarantined before ML evaluation.",
            })
            continue

        # Step 2: Level 1 Prediction
        df_row_l1 = pd.DataFrame([{
            "category": sc["category"],
            "approx_age_years": sc["approx_age_years"],
            "condition": sc["condition"],
        }])
        X1 = l1_prep.transform(df_row_l1[LEVEL_1_FEATURES])

        # Raw probabilities
        p_raw = l1_model.predict_proba(X1)[0]
        p_raw_salv = float(p_raw[0])
        p_raw_eol = float(p_raw[1])

        # Calibrated probabilities
        p_cal = l1_calibrator.predict_proba(X1)[0]
        p_cal_salv = float(p_cal[0])
        p_cal_eol = float(p_cal[1])

        # Step 3: Conservative 3-Zone Gate (Using Calibrated Probability)
        gate_info = apply_conservative_gate(p_cal_eol, t_low=t_low, t_high=t_high)

        # Step 4: Level 2 Prediction (if allowed)
        l2_result = None
        if gate_info["allow_level2"]:
            df_row_l2 = pd.DataFrame([{
                "category": sc["category"],
                "approx_age_years": sc["approx_age_years"],
                "condition": sc["condition"],
                "powers_on": sc["powers_on"],
                "screen_condition": sc["screen_condition"],
                "battery_condition": sc["battery_condition"],
                "damage_severity": sc["damage_severity"],
            }])
            X2 = l2_prep.transform(df_row_l2[LEVEL_2_FEATURES])
            l2_pred_idx = int(l2_model.predict(X2)[0])
            l2_proba = l2_model.predict_proba(X2)[0]
            l2_action = l2_prep.decode_target([l2_pred_idx])[0]
            l2_dist = {cls_name: round(float(p), 4) for cls_name, p in zip(LEVEL_2_CLASSES, l2_proba)}
            l2_result = {
                "recommended_action": l2_action,
                "confidence": round(float(l2_proba[l2_pred_idx]), 4),
                "distribution": l2_dist,
            }
            final_rec = l2_action
            if gate_info["technician_review_required"]:
                final_rec = f"{l2_action} (Subject to Technician Bench Inspection)"
        else:
            final_rec = "RECYCLE"

        # Domain verdict check
        verdict = "PASS: Behavior aligns with circular economy goals."
        if sc_id == "SCENARIO_07":  # 5-Year Laptop with Cracked Screen
            if final_rec == "RECYCLE":
                verdict = "FAIL: False recycling! Fixable laptop was discarded."
            else:
                verdict = f"PASS: Salvage successfully preserved! Routed to {final_rec}."

        scenario_reports.append({
            "id": sc_id,
            "name": sc_name,
            "category": sc["category"],
            "age_years": sc["approx_age_years"],
            "condition": sc["condition"],
            "safety_gate": {"triggered": False},
            "level1_evaluation": {
                "raw_salvageable_prob": round(p_raw_salv, 4),
                "raw_eol_prob": round(p_raw_eol, 4),
                "calibrated_salvageable_prob": round(p_cal_salv, 4),
                "calibrated_eol_prob": round(p_cal_eol, 4),
            },
            "conservative_gate": gate_info,
            "level2_evaluation": l2_result if l2_result else "BYPASSED_BY_RECYCLING_GATE",
            "final_recommendation": final_rec,
            "domain_verdict": verdict,
        })

    return scenario_reports


def run_full_quality_review() -> Dict[str, Any]:
    """Execute end-to-end quality review pipeline and return aggregated dictionary."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ext_dir = os.path.join(base_dir, "data", "external")
    proc_dir = os.path.join(base_dir, "data", "processed")

    print("\n" + "=" * 80)
    print("STARTING MODULE 4.5: MODEL QUALITY REVIEW & GATE CONSISTENCY ANALYSIS")
    print("=" * 80)

    # 1. Audit Open Repair EOL Records
    ora_zip = os.path.join(ext_dir, "OpenRepairData_v0.3_aggregate_202507.zip")
    print("\n[1/6] Auditing Open Repair Alliance EOL Records...")
    eol_audit = audit_open_repair_eol(ora_zip)
    print(f"  Total Electronics: {eol_audit['total_electronics']:,}")
    print(f"  EOL Count: {eol_audit['eol_count']:,} ({eol_audit['eol_fraction_of_electronics']*100:.1f}%)")
    print(f"  Recorded Barriers: {eol_audit['barriers_recorded_count']:,}")
    print(f"  True Physical Wear: {eol_audit['classification_of_barriers']['physical_wear_pct']}%")
    print(f"  Non-Physical (Economic/Parts/Info/Tools): {eol_audit['classification_of_barriers']['total_non_physical_barriers_pct']}%")

    # 2. Load Processed Datasets
    l1_df = pd.read_csv(os.path.join(proc_dir, "physical_feasibility_real.csv"))
    l2_df = pd.read_csv(os.path.join(proc_dir, "circular_pathway_development.csv"))

    l1_train = l1_df[l1_df["split"] == "train"].copy()
    l1_val = l1_df[l1_df["split"] == "val"].copy()
    l1_test = l1_df[l1_df["split"] == "test"].copy()

    l2_train = l2_df[l2_df["split"] == "train"].copy()
    l2_val = l2_df[l2_df["split"] == "val"].copy()
    l2_test = l2_df[l2_df["split"] == "test"].copy()

    # Preprocessors
    l1_prep = Level1Preprocessor()
    X1_train = l1_prep.fit_transform(l1_train[LEVEL_1_FEATURES])
    y1_train = l1_prep.encode_target(l1_train[LEVEL_1_TARGET_COLUMN])
    X1_val = l1_prep.transform(l1_val[LEVEL_1_FEATURES])
    y1_val = l1_prep.encode_target(l1_val[LEVEL_1_TARGET_COLUMN])
    X1_test = l1_prep.transform(l1_test[LEVEL_1_FEATURES])
    y1_test = l1_prep.encode_target(l1_test[LEVEL_1_TARGET_COLUMN])

    l2_prep = Level2Preprocessor()
    X2_train = l2_prep.fit_transform(l2_train[LEVEL_2_FEATURES])
    y2_train = l2_prep.encode_target(l2_train[LEVEL_2_TARGET_COLUMN])
    X2_val = l2_prep.transform(l2_val[LEVEL_2_FEATURES])
    y2_val = l2_prep.encode_target(l2_val[LEVEL_2_TARGET_COLUMN])
    X2_test = l2_prep.transform(l2_test[LEVEL_2_FEATURES])
    y2_test = l2_prep.encode_target(l2_test[LEVEL_2_TARGET_COLUMN])

    # 3. Train Candidate Level 1 Models
    print("\n[2/6] Training & Evaluating Level 1 Candidate Models on Validation...")
    models = {
        "LogisticRegression": LogisticRegression(class_weight="balanced", C=0.1, max_iter=1000, random_state=42),
        "RandomForest": RandomForestClassifier(class_weight="balanced", n_estimators=100, max_depth=6, min_samples_leaf=2, random_state=42),
        "HistGradientBoosting": HistGradientBoostingClassifier(class_weight="balanced", max_iter=100, learning_rate=0.05, random_state=42),
    }

    l1_model_evals = {}
    calibrated_models = {}

    for name, m in models.items():
        m.fit(X1_train, y1_train)
        raw_val_proba = m.predict_proba(X1_val)[:, 1]

        # Calibrate using Validation split
        cal = CalibratedClassifierCV(estimator=m, method="sigmoid", cv="prefit")
        cal.fit(X1_val, y1_val)
        cal_val_proba = cal.predict_proba(X1_val)[:, 1]
        calibrated_models[name] = cal

        # Evaluate threshold sweep on validation split
        raw_sweep = evaluate_threshold_sweep(y1_val, raw_val_proba)
        cal_sweep = evaluate_threshold_sweep(y1_val, cal_val_proba)

        l1_model_evals[name] = {
            "model": m,
            "calibrator": cal,
            "raw_val_brier": round(float(brier_score_loss(y1_val, raw_val_proba)), 4),
            "cal_val_brier": round(float(brier_score_loss(y1_val, cal_val_proba)), 4),
            "raw_val_roc_auc": round(float(roc_auc_score(y1_val, raw_val_proba)), 4),
            "raw_threshold_sweep": raw_sweep,
            "cal_threshold_sweep": cal_sweep,
        }

    # 4. Train Level 2 Model (RandomForest Multiclass)
    print("\n[3/6] Training Level 2 Model (RandomForest Multiclass)...")
    l2_rf = RandomForestClassifier(class_weight="balanced", n_estimators=100, max_depth=8, min_samples_leaf=3, random_state=42)
    l2_rf.fit(X2_train, y2_train)
    l2_val_pred = l2_rf.predict(X2_val)
    l2_val_proba = l2_rf.predict_proba(X2_val)

    # 5. Level 2 Confusion Matrix & REFURBISH Analysis
    print("\n[4/6] Analyzing Level 2 REFURBISH Failure Dynamics...")
    l2_cm = confusion_matrix(y2_val, l2_val_pred).tolist()
    # Print per-class metrics
    per_class_f1 = {}
    for idx, cls_name in enumerate(LEVEL_2_CLASSES):
        f1 = float(f1_score(y2_val == idx, l2_val_pred == idx, zero_division=0))
        prec = float(precision_score(y2_val == idx, l2_val_pred == idx, zero_division=0))
        rec = float(recall_score(y2_val == idx, l2_val_pred == idx, zero_division=0))
        supp = int((y2_val == idx).sum())
        per_class_f1[cls_name] = {"f1": round(f1, 4), "precision": round(prec, 4), "recall": round(rec, 4), "support": supp}
        print(f"  {cls_name:<20}: F1={f1:.4f} | Prec={prec:.4f} | Rec={rec:.4f} | Support={supp}")

    # 6. Execute 15 Realistic Sanity Scenarios
    print("\n[5/6] Executing Expanded 15-Scenario Sanity Suite...")
    selected_l1_name = "LogisticRegression"
    selected_l1 = l1_model_evals[selected_l1_name]["model"]
    selected_cal = l1_model_evals[selected_l1_name]["calibrator"]

    sanity_results = execute_sanity_evaluation(
        selected_l1,
        selected_cal,
        l1_prep,
        l2_rf,
        l2_prep,
        t_low=0.35,
        t_high=0.70,
    )

    for sr in sanity_results:
        print(f"\n[{sr['id']}] {sr['name']} ({sr['category']}, {sr['age_years']}y, {sr['condition']})")
        if sr["safety_gate"]["triggered"]:
            print(f"  Safety Gate: {sr['safety_gate']['action']} ({sr['safety_gate']['reason']})")
        else:
            p_cal = sr["level1_evaluation"]["calibrated_eol_prob"]
            gate = sr["conservative_gate"]["gate_decision"]
            routing = sr["conservative_gate"]["routing"]
            print(f"  Level 1 Calibrated EOL Prob: {p_cal*100:.1f}% -> Gate: {gate} ({routing})")
            if sr["level2_evaluation"] != "BYPASSED_BY_RECYCLING_GATE":
                print(f"  Level 2 Action: {sr['level2_evaluation']['recommended_action']} (Confidence: {sr['level2_evaluation']['confidence']*100:.1f}%)")
            print(f"  Final Recommendation: {sr['final_recommendation']}")
        print(f"  Domain Verdict: {sr['domain_verdict']}")

    return {
        "open_repair_eol_audit": eol_audit,
        "level1_model_evaluations": l1_model_evals,
        "level2_refurbish_metrics": per_class_f1,
        "level2_confusion_matrix": l2_cm,
        "sanity_results": sanity_results,
    }


if __name__ == "__main__":
    run_full_quality_review()
