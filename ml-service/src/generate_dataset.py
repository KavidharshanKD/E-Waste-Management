"""
Synthetic Dataset Generator for Circular E-Waste Management Recommendation
Produces a reproducible, scientifically grounded development dataset.

Usage:
    python src/generate_dataset.py --samples 10000 --seed 42
"""

import argparse
import json
import os
from datetime import datetime, timezone
from typing import Dict, Tuple, List, Any
import numpy as np
import pandas as pd

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
    ML_PREDICTIVE_FEATURES,
    SAFETY_GATE_FEATURES,
    TARGET_COLUMN,
    SAFETY_FLAG_COLUMN,
)

# Realistic category sampling distribution reflecting municipal & institutional e-waste in India
CATEGORY_WEIGHTS: Dict[str, float] = {
    "MOBILE_PHONE": 0.22,
    "LAPTOP": 0.18,
    "DESKTOP": 0.10,
    "MONITOR": 0.08,
    "TELEVISION": 0.07,
    "BATTERY": 0.06,
    "PRINTER": 0.05,
    "CHARGER": 0.05,
    "CABLE": 0.05,
    "KEYBOARD": 0.03,
    "MOUSE": 0.03,
    "REFRIGERATOR": 0.03,
    "WASHING_MACHINE": 0.02,
    "AIR_CONDITIONER": 0.02,
    "OTHER": 0.01,
}

USER_INTENTION_WEIGHTS: Dict[str, float] = {
    "KEEP_USING": 0.12,
    "REPAIR": 0.16,
    "REFURBISH": 0.14,
    "REFURBISH_AND_SELL": 0.20,
    "DONATE": 0.12,
    "RECYCLE": 0.16,
    "UNSURE": 0.10,
}


def sample_device_age(category: str, rng: np.random.Generator) -> float:
    """Sample realistic age distribution scaled to category average lifespan."""
    caps = CATEGORY_CAPABILITIES[category]
    lifespan = caps["avg_lifespan_years"]
    # Log-normal distribution produces realistic skew towards younger/moderate replacement ages
    raw_age = rng.lognormal(mean=np.log(lifespan * 0.6), sigma=0.55)
    # Clip between 0.1 and 15.0 years, rounded to 1 decimal
    return float(np.clip(np.round(raw_age, 1), 0.1, 15.0))


def sample_condition_and_status(
    category: str, age: float, rng: np.random.Generator
) -> Tuple[str, str, str, str, str]:
    """Sample category-aware operating condition, power, screen, battery, and damage."""
    caps = CATEGORY_CAPABILITIES[category]
    lifespan = caps["avg_lifespan_years"]
    age_ratio = age / lifespan

    # Age heavily influences condition probability
    if age_ratio < 0.4:
        cond_probs = [0.60, 0.25, 0.08, 0.05, 0.02]
    elif age_ratio < 0.9:
        cond_probs = [0.35, 0.35, 0.15, 0.12, 0.03]
    elif age_ratio < 1.5:
        cond_probs = [0.15, 0.30, 0.25, 0.25, 0.05]
    else:
        cond_probs = [0.05, 0.15, 0.30, 0.42, 0.08]

    condition = rng.choice(DEVICE_CONDITIONS, p=cond_probs)

    # Power status
    if not caps["is_powered"]:
        powers_on = "NOT_APPLICABLE"
    elif condition == "WORKING":
        powers_on = "YES" if rng.random() > 0.02 else "NO"
    elif condition == "PARTIALLY_WORKING":
        powers_on = "YES" if rng.random() > 0.20 else "NO"
    elif condition in ["DAMAGED", "HAZARDOUS"]:
        powers_on = "YES" if rng.random() > 0.55 else "NO"
    else:  # NOT_WORKING
        powers_on = "NO" if rng.random() > 0.10 else "YES"

    # Screen condition
    if not caps["has_screen"]:
        screen_cond = "NOT_APPLICABLE"
    elif condition == "WORKING":
        screen_cond = rng.choice(
            ["INTACT", "MINOR_SCRATCHES", "CRACKED"], p=[0.75, 0.22, 0.03]
        )
    elif condition == "PARTIALLY_WORKING":
        screen_cond = rng.choice(
            ["INTACT", "MINOR_SCRATCHES", "CRACKED", "DEAD_PIXELS_BLEED"],
            p=[0.35, 0.30, 0.25, 0.10],
        )
    else:
        screen_cond = rng.choice(
            ["INTACT", "MINOR_SCRATCHES", "CRACKED", "DEAD_PIXELS_BLEED", "SHATTERED_NOT_WORKING"],
            p=[0.15, 0.15, 0.30, 0.20, 0.20],
        )

    # Battery condition
    if not caps["has_battery"]:
        battery_cond = "NOT_APPLICABLE"
    elif age_ratio < 0.5:
        battery_cond = rng.choice(["NORMAL", "DEGRADED", "DEAD"], p=[0.80, 0.17, 0.03])
    elif age_ratio < 1.0:
        battery_cond = rng.choice(["NORMAL", "DEGRADED", "DEAD"], p=[0.40, 0.48, 0.12])
    else:
        battery_cond = rng.choice(["NORMAL", "DEGRADED", "DEAD"], p=[0.15, 0.45, 0.40])

    # Physical damage severity
    if condition == "WORKING":
        damage_sev = rng.choice(["NONE", "MINOR_COSMETIC"], p=[0.70, 0.30])
    elif condition == "PARTIALLY_WORKING":
        damage_sev = rng.choice(["NONE", "MINOR_COSMETIC", "MODERATE"], p=[0.25, 0.55, 0.20])
    elif condition == "DAMAGED":
        damage_sev = rng.choice(["MINOR_COSMETIC", "MODERATE", "HEAVY"], p=[0.15, 0.50, 0.35])
    else:
        damage_sev = rng.choice(["NONE", "MINOR_COSMETIC", "MODERATE", "HEAVY"], p=[0.10, 0.20, 0.35, 0.35])

    return condition, powers_on, screen_cond, battery_cond, damage_sev


def sample_safety_flags(
    category: str, condition: str, rng: np.random.Generator
) -> Tuple[bool, bool, bool, bool]:
    """Sample deterministic safety flags. Elevated for HAZARDOUS and battery-bearing items."""
    has_battery = CATEGORY_CAPABILITIES[category]["has_battery"]
    is_hazardous = condition == "HAZARDOUS"

    if is_hazardous:
        # High probability of one or more physical safety hazards
        battery_swollen = (rng.random() < 0.65) if has_battery else False
        battery_leaking = (rng.random() < 0.40) if has_battery else False
        overheating_ev = rng.random() < 0.35
        severe_damage = rng.random() < 0.45
        # Ensure at least one flag is true if condition is HAZARDOUS
        if not (battery_swollen or battery_leaking or overheating_ev or severe_damage):
            if has_battery:
                battery_swollen = True
            else:
                severe_damage = True
    else:
        # Realistic small occurrence in general population (< 1.5% individually)
        battery_swollen = (rng.random() < 0.018) if has_battery else False
        battery_leaking = (rng.random() < 0.008) if has_battery else False
        overheating_ev = rng.random() < 0.012
        severe_damage = rng.random() < 0.015

    return bool(battery_swollen), bool(battery_leaking), bool(overheating_ev), bool(severe_damage)


def compute_ground_truth(
    category: str,
    age: float,
    condition: str,
    user_intention: str,
    powers_on: str,
    screen_condition: str,
    battery_condition: str,
    damage_severity: str,
    is_safety_hazard: bool,
    rng: np.random.Generator,
) -> str:
    """
    Compute realistic ground-truth label using multi-dimensional score synthesis.
    
    Architecture:
    - If is_safety_hazard == True -> DETERMINISTIC SAFETY GATE returns SPECIAL_HANDLING.
    - Otherwise -> Evaluates competing circular lifecycle scores with controlled noise.
    """
    # 1. LAYER 1: DETERMINISTIC SAFETY GATE
    if is_safety_hazard or condition == "HAZARDOUS":
        return SAFETY_TARGET

    caps = CATEGORY_CAPABILITIES[category]
    lifespan = caps["avg_lifespan_years"]
    age_ratio = age / lifespan
    resale_demand = caps["resale_demand"]  # HIGH, MEDIUM, LOW, NONE
    repairability_base = caps["repairability_base"]
    donation_utility = caps["donation_utility"]

    # 2. LATENT ATTRIBUTE SCORES
    # Condition utility score [0.0 - 1.0]
    cond_weights = {
        "WORKING": 1.0,
        "PARTIALLY_WORKING": 0.55,
        "DAMAGED": 0.25,
        "NOT_WORKING": 0.05,
    }
    base_utility = cond_weights.get(condition, 0.5)

    # Power penalty
    if powers_on == "NO":
        base_utility *= 0.35

    # Screen penalty
    if screen_condition == "CRACKED":
        base_utility *= 0.70
    elif screen_condition == "DEAD_PIXELS_BLEED":
        base_utility *= 0.50
    elif screen_condition == "SHATTERED_NOT_WORKING":
        base_utility *= 0.20

    # Battery penalty
    if battery_condition == "DEGRADED":
        base_utility *= 0.85
    elif battery_condition == "DEAD":
        base_utility *= 0.60

    # Age depreciation factor [exp(-1.2 * age_ratio)]
    depreciation = np.exp(-1.1 * age_ratio)
    remaining_utility = base_utility * depreciation

    # Repair feasibility score
    repair_feasibility = repairability_base * (1.0 - (age_ratio * 0.45))
    if damage_severity == "HEAVY":
        repair_feasibility *= 0.40
    elif damage_severity == "MODERATE":
        repair_feasibility *= 0.75

    # Commercial resale viability
    demand_multipliers = {"HIGH": 1.0, "MEDIUM": 0.65, "LOW": 0.25, "NONE": 0.0}
    commercial_viability = (
        demand_multipliers[resale_demand]
        * remaining_utility
        * (0.9 if repair_feasibility > 0.4 else 0.4)
    )

    # 3. CLASS LOGITS SYNTHESIS
    # KEEP_USING: high utility + young/moderate age
    logit_keep_using = 3.6 * remaining_utility - 1.0 * (age_ratio ** 1.2) + (0.8 if remaining_utility > 0.55 else 0.0)
    if condition != "WORKING":
        logit_keep_using -= 2.2

    # REPAIR: targeted defect (cracked screen, degraded battery, minor damage) on repairable item
    logit_repair = 2.8 * repair_feasibility + 1.8 * (1.0 - abs(base_utility - 0.55)) - 0.7 * age_ratio
    if condition not in ["PARTIALLY_WORKING", "WORKING", "DAMAGED"]:
        logit_repair -= 1.5

    # REFURBISH: moderate age + repairable core structure
    logit_refurbish = 2.0 * repair_feasibility + 1.0 * (0.8 - abs(age_ratio - 0.7)) + 0.8 * float(base_utility > 0.2)
    if condition == "NOT_WORKING" and repair_feasibility < 0.4:
        logit_refurbish -= 1.5

    # REFURBISH_AND_SELL: high resale demand + recoverable
    logit_refurbish_sell = 4.2 * commercial_viability + 2.2 * repair_feasibility - 0.9 * (age_ratio ** 1.1)
    if resale_demand in ["LOW", "NONE"]:
        logit_refurbish_sell -= 3.0

    # DONATE: working older equipment with high donation utility
    logit_donate = 2.4 * donation_utility + 1.6 * base_utility - 1.0 * abs(age_ratio - 0.6) - 0.8 * commercial_viability
    if condition not in ["WORKING", "PARTIALLY_WORKING"]:
        logit_donate -= 2.0

    # RECYCLE: low utility, high age, low repairability, or non-functional
    logit_recycle = 1.8 * (age_ratio ** 1.1) + 2.2 * (1.0 - base_utility) + 1.2 * (1.0 - repair_feasibility)
    if not caps["is_powered"] and not caps["has_screen"] and not caps["has_battery"]:
        # Simple accessories (cables, old mouse) naturally recycle
        logit_recycle += 1.2

    logits = np.array([
        logit_keep_using,
        logit_repair,
        logit_refurbish,
        logit_refurbish_sell,
        logit_donate,
        logit_recycle,
    ])

    # 4. USER INTENTION INFLUENCE (Realistic prior without deterministic domination)
    # Adds a modest boost (+0.3 to +0.5) to the preferred class if technically feasible
    intent_boost = 0.45
    intent_map = {
        "KEEP_USING": 0,
        "REPAIR": 1,
        "REFURBISH": 2,
        "REFURBISH_AND_SELL": 3,
        "DONATE": 4,
        "RECYCLE": 5,
    }
    if user_intention in intent_map:
        idx = intent_map[user_intention]
        # Only boost if the option has at least non-negative baseline feasibility
        if logits[idx] > -1.5:
            logits[idx] += intent_boost

    # 5. CONTROLLED PROBABILISTIC NOISE
    # Simulates real-world technician assessment subjectivity and unobserved variables
    noise = rng.normal(0, 0.18, size=len(logits))
    final_scores = logits + noise

    chosen_idx = int(np.argmax(final_scores))
    return ML_TARGET_CLASSES[chosen_idx]


def generate_dataset(n_samples: int = 10000, seed: int = 42) -> pd.DataFrame:
    """Generate the full synthetic dataset with reproducible random seed."""
    rng = np.random.default_rng(seed)

    categories = list(CATEGORY_WEIGHTS.keys())
    cat_probs = list(CATEGORY_WEIGHTS.values())
    cat_probs = np.array(cat_probs) / np.sum(cat_probs)

    intentions = list(USER_INTENTION_WEIGHTS.keys())
    intent_probs = list(USER_INTENTION_WEIGHTS.values())
    intent_probs = np.array(intent_probs) / np.sum(intent_probs)

    records = []

    for i in range(n_samples):
        # Sample Category
        cat = rng.choice(categories, p=cat_probs)

        # Sample Age
        age = sample_device_age(cat, rng)

        # Sample Condition and Physical Status
        condition, powers_on, screen_cond, battery_cond, damage_sev = sample_condition_and_status(
            cat, age, rng
        )

        # Sample Safety Flags
        swollen, leaking, overheat, severe_dmg = sample_safety_flags(cat, condition, rng)
        is_hazard = swollen or leaking or overheat or severe_dmg or (condition == "HAZARDOUS")

        # Sample User Intention
        # Heavily broken / hazardous devices have higher probability of RECYCLE / UNSURE intent
        if is_hazard or condition in ["DAMAGED", "NOT_WORKING"]:
            local_intent_probs = np.array([0.05, 0.15, 0.10, 0.15, 0.05, 0.35, 0.15])
            user_intent = rng.choice(intentions, p=local_intent_probs / np.sum(local_intent_probs))
        else:
            user_intent = rng.choice(intentions, p=intent_probs)

        # Compute Ground Truth
        recommended_action = compute_ground_truth(
            cat, age, condition, user_intent,
            powers_on, screen_cond, battery_cond, damage_sev,
            is_hazard, rng
        )

        records.append({
            "sample_id": f"DEV-{seed}-{i+1:06d}",
            "category": cat,
            "approx_age_years": age,
            "condition": condition,
            "user_intention": user_intent,
            "powers_on": powers_on,
            "screen_condition": screen_cond,
            "battery_condition": battery_cond,
            "damage_severity": damage_sev,
            "battery_swollen": swollen,
            "battery_leaking": leaking,
            "overheating_evidence": overheat,
            "severe_physical_damage": severe_dmg,
            "is_safety_hazard": is_hazard,
            "recommended_action": recommended_action,
        })

    df = pd.DataFrame(records)
    return df


def audit_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """Perform rigorous quality and statistical audit on the generated dataset."""
    total_rows = len(df)
    duplicates = int(df.duplicated(subset=ML_PREDICTIVE_FEATURES).sum())
    missing_counts = df.isnull().sum().to_dict()

    cat_dist = (df["category"].value_counts(normalize=True) * 100).round(2).to_dict()
    cond_dist = (df["condition"].value_counts(normalize=True) * 100).round(2).to_dict()
    intent_dist = (df["user_intention"].value_counts(normalize=True) * 100).round(2).to_dict()
    target_dist = (df["recommended_action"].value_counts(normalize=True) * 100).round(2).to_dict()
    hazard_count = int(df["is_safety_hazard"].sum())
    hazard_rate = round((hazard_count / total_rows) * 100, 2)

    # Calculate user_intention vs target alignment percentage
    match_count = int((df["user_intention"] == df["recommended_action"]).sum())
    match_rate = round((match_count / total_rows) * 100, 2)

    audit_summary = {
        "total_records": total_rows,
        "duplicate_predictive_vectors": duplicates,
        "missing_values_by_column": {k: int(v) for k, v in missing_counts.items() if v > 0},
        "hazardous_safety_gate_count": hazard_count,
        "hazardous_safety_gate_rate_pct": hazard_rate,
        "user_intention_target_match_rate_pct": match_rate,
        "category_distribution_pct": cat_dist,
        "condition_distribution_pct": cond_dist,
        "user_intention_distribution_pct": intent_dist,
        "target_distribution_pct": target_dist,
    }
    return audit_summary


def print_audit_report(summary: Dict[str, Any]):
    """Print clean terminal audit summary."""
    print("=" * 70)
    print("  DEVELOPMENT SYNTHETIC DATASET AUDIT REPORT (MODULE 2)")
    print("=" * 70)
    print(f"Total Generated Samples:             {summary['total_records']}")
    print(f"Duplicate Feature Vectors:           {summary['duplicate_predictive_vectors']}")
    print(f"Missing (Null) Values:               {len(summary['missing_values_by_column'])} columns")
    print(f"Safety Gate Interceptions:           {summary['hazardous_safety_gate_count']} ({summary['hazardous_safety_gate_rate_pct']}%)")
    print(f"User-Intention vs Target Match Rate: {summary['user_intention_target_match_rate_pct']}% (Realistically decoupled)")
    print("\n--- TARGET ACTION DISTRIBUTION ---")
    for action, pct in summary["target_distribution_pct"].items():
        print(f"  {action:<22} : {pct:>5.2f}%")
    print("\n--- TOP CATEGORY REPRESENTATION ---")
    for cat, pct in list(summary["category_distribution_pct"].items())[:6]:
        print(f"  {cat:<22} : {pct:>5.2f}%")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic development e-waste dataset.")
    parser.add_argument("--samples", type=int, default=10000, help="Number of samples to generate (default: 10000)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility (default: 42)")
    parser.add_argument("--output-dir", type=str, default="data/generated", help="Output directory")

    args = parser.parse_args()

    # Determine paths relative to ml-service directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(base_dir, args.output_dir)
    os.makedirs(target_dir, exist_ok=True)

    csv_path = os.path.join(target_dir, "device_lifecycle_synthetic.csv")
    meta_path = os.path.join(target_dir, "dataset_metadata.json")

    print(f"\n[INFO] Generating {args.samples} synthetic samples with seed {args.seed}...")
    df = generate_dataset(n_samples=args.samples, seed=args.seed)

    # Save CSV
    df.to_csv(csv_path, index=False)
    print(f"[INFO] Dataset saved to: {csv_path}")

    # Audit & Metadata
    audit = audit_dataset(df)
    metadata = {
        "dataset_name": "device_lifecycle_synthetic",
        "dataset_type": "DEVELOPMENT_SYNTHETIC_DATA",
        "generation_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "random_seed": args.seed,
        "sample_count": args.samples,
        "ml_predictive_features": ML_PREDICTIVE_FEATURES,
        "safety_gate_features": SAFETY_GATE_FEATURES,
        "target_column": TARGET_COLUMN,
        "audit_statistics": audit,
    }

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[INFO] Metadata saved to: {meta_path}\n")

    print_audit_report(audit)


if __name__ == "__main__":
    main()
