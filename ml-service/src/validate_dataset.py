"""
Dataset Validator for Device Lifecycle Synthetic Data
Runs strict invariant and physical integrity checks.
"""

import sys
from typing import List, Tuple
import pandas as pd

from dataset_schema import (
    EWASTE_CATEGORIES,
    DEVICE_CONDITIONS,
    USER_INTENTIONS,
    SCREEN_CONDITIONS,
    BATTERY_CONDITIONS,
    POWERS_ON_VALUES,
    DAMAGE_SEVERITIES,
    ALL_TARGET_CLASSES,
    CATEGORY_CAPABILITIES,
    SAFETY_TARGET,
)


def validate_dataset_invariants(df: pd.DataFrame) -> Tuple[bool, List[str]]:
    """
    Validates all physical, logical, and safety invariants on the dataset.
    Returns (is_valid, list_of_errors).
    """
    errors: List[str] = []

    # 1. Row count check
    if len(df) == 0:
        errors.append("Dataset is empty (0 rows).")
        return False, errors

    # 2. Check required columns
    required_cols = [
        "sample_id", "category", "approx_age_years", "condition", "user_intention",
        "powers_on", "screen_condition", "battery_condition", "damage_severity",
        "battery_swollen", "battery_leaking", "overheating_evidence",
        "severe_physical_damage", "is_safety_hazard", "recommended_action"
    ]
    missing_cols = set(required_cols) - set(df.columns)
    if missing_cols:
        errors.append(f"Missing mandatory columns: {missing_cols}")

    # 3. Check null values
    for col in required_cols:
        if col in df.columns:
            null_count = df[col].isnull().sum()
            if null_count > 0:
                errors.append(f"Column '{col}' has {null_count} unexpected null values.")

    # 4. Age range validation
    if "approx_age_years" in df.columns:
        invalid_ages = df[(df["approx_age_years"] < 0) | (df["approx_age_years"] > 25.0)]
        if len(invalid_ages) > 0:
            errors.append(f"Found {len(invalid_ages)} records with invalid age (<0 or >25).")

    # 5. Enum membership checks
    if "category" in df.columns:
        invalid_cats = set(df["category"]) - set(EWASTE_CATEGORIES)
        if invalid_cats:
            errors.append(f"Invalid categories detected: {invalid_cats}")

    if "condition" in df.columns:
        invalid_conds = set(df["condition"]) - set(DEVICE_CONDITIONS)
        if invalid_conds:
            errors.append(f"Invalid conditions detected: {invalid_conds}")

    if "user_intention" in df.columns:
        invalid_intents = set(df["user_intention"]) - set(USER_INTENTIONS)
        if invalid_intents:
            errors.append(f"Invalid user intentions detected: {invalid_intents}")

    if "screen_condition" in df.columns:
        invalid_screens = set(df["screen_condition"]) - set(SCREEN_CONDITIONS)
        if invalid_screens:
            errors.append(f"Invalid screen conditions detected: {invalid_screens}")

    if "battery_condition" in df.columns:
        invalid_batteries = set(df["battery_condition"]) - set(BATTERY_CONDITIONS)
        if invalid_batteries:
            errors.append(f"Invalid battery conditions detected: {invalid_batteries}")

    if "powers_on" in df.columns:
        invalid_powers = set(df["powers_on"]) - set(POWERS_ON_VALUES)
        if invalid_powers:
            errors.append(f"Invalid powers_on values detected: {invalid_powers}")

    if "damage_severity" in df.columns:
        invalid_damages = set(df["damage_severity"]) - set(DAMAGE_SEVERITIES)
        if invalid_damages:
            errors.append(f"Invalid damage severities detected: {invalid_damages}")

    if "recommended_action" in df.columns:
        invalid_targets = set(df["recommended_action"]) - set(ALL_TARGET_CLASSES)
        if invalid_targets:
            errors.append(f"Invalid recommended_action targets detected: {invalid_targets}")

    # 6. Category-Aware Capability Validations
    for category, caps in CATEGORY_CAPABILITIES.items():
        cat_df = df[df["category"] == category]
        if len(cat_df) == 0:
            continue

        # No screen -> must be NOT_APPLICABLE
        if not caps["has_screen"]:
            non_na_screens = cat_df[cat_df["screen_condition"] != "NOT_APPLICABLE"]
            if len(non_na_screens) > 0:
                errors.append(
                    f"Category '{category}' cannot have screens, but {len(non_na_screens)} records have screen_condition != NOT_APPLICABLE."
                )

        # No battery -> must be NOT_APPLICABLE
        if not caps["has_battery"]:
            non_na_batteries = cat_df[cat_df["battery_condition"] != "NOT_APPLICABLE"]
            if len(non_na_batteries) > 0:
                errors.append(
                    f"Category '{category}' cannot have battery, but {len(non_na_batteries)} records have battery_condition != NOT_APPLICABLE."
                )

        # Non-powered -> must be NOT_APPLICABLE
        if not caps["is_powered"]:
            non_na_powers = cat_df[cat_df["powers_on"] != "NOT_APPLICABLE"]
            if len(non_na_powers) > 0:
                errors.append(
                    f"Category '{category}' is non-powered, but {len(non_na_powers)} records have powers_on != NOT_APPLICABLE."
                )

    # 7. Safety Gate Deterministic Invariants
    # Invariant: is_safety_hazard == True MUST produce recommended_action == SPECIAL_HANDLING
    hazard_df = df[df["is_safety_hazard"] == True]
    non_special_hazards = hazard_df[hazard_df["recommended_action"] != SAFETY_TARGET]
    if len(non_special_hazards) > 0:
        errors.append(
            f"Safety Gate Violation: {len(non_special_hazards)} hazardous records failed to route to {SAFETY_TARGET}."
        )

    # Invariant: Any physical hazard flag set to True MUST set is_safety_hazard == True
    flag_violations = df[
        (df["battery_swollen"] | df["battery_leaking"] | df["overheating_evidence"] | df["severe_physical_damage"])
        & (~df["is_safety_hazard"])
    ]
    if len(flag_violations) > 0:
        errors.append(
            f"Safety Gate Violation: {len(flag_violations)} records have safety flags=True but is_safety_hazard=False."
        )

    # Invariant: HAZARDOUS condition must set is_safety_hazard == True
    cond_violations = df[(df["condition"] == "HAZARDOUS") & (~df["is_safety_hazard"])]
    if len(cond_violations) > 0:
        errors.append(
            f"Safety Gate Violation: {len(cond_violations)} records with condition=HAZARDOUS have is_safety_hazard=False."
        )

    return len(errors) == 0, errors


def main():
    import os

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_dir, "data", "generated", "device_lifecycle_synthetic.csv")

    if not os.path.exists(csv_path):
        print(f"[ERROR] Dataset file not found at: {csv_path}")
        sys.exit(1)

    print(f"[INFO] Validating dataset at: {csv_path}...")
    df = pd.read_csv(csv_path)
    is_valid, errors = validate_dataset_invariants(df)

    if is_valid:
        print(f"[SUCCESS] Dataset passed all integrity and physical invariant checks ({len(df)} records).")
        sys.exit(0)
    else:
        print(f"[FAILURE] Found {len(errors)} validation errors:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
