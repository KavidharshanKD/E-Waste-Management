"""
Orchestrator for Dataset Preparation, Splitting, and Manifest Generation.
Processes Real Open Repair & TU Delft datasets into Level 1 (Physical Feasibility),
prepares Level 2 (Circular Pathway), generates deterministic group-aware splits,
and exports versioned dataset manifest metadata.
"""

import json
import os
import sys
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np
from sklearn.model_selection import GroupShuffleSplit, StratifiedShuffleSplit

# Ensure imports from local src directory
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
    CATEGORY_AGE_LIMITS,
)
from prepare_real_datasets import prepare_open_repair, prepare_tu_delft
from generate_dataset import generate_dataset


def assign_deterministic_splits(
    df: pd.DataFrame,
    target_col: str,
    group_col: str = "split_group",
    seed: int = 42,
    train_size: float = 0.70,
    val_size: float = 0.15,
    test_size: float = 0.15,
) -> pd.DataFrame:
    """
    Assign deterministic train/val/test splits (70/15/15) avoiding data leakage.
    Uses GroupShuffleSplit when group_col is populated, otherwise StratifiedShuffleSplit.
    """
    df = df.copy().reset_index(drop=True)
    df["split"] = "unassigned"

    rng = np.random.default_rng(seed)

    # If distinct groups exist and don't overwhelm single classes, use group-aware split
    if group_col in df.columns and df[group_col].nunique() > 20:
        groups = df[group_col].values
        # 1. Split train (70%) vs temp (30%)
        gss_train = GroupShuffleSplit(n_splits=1, train_size=train_size, random_state=seed)
        train_idx, temp_idx = next(gss_train.split(df, groups=groups))

        df.loc[train_idx, "split"] = "train"

        # 2. Split temp into val (15%) and test (15%) -> equal 50/50 split of temp
        temp_df = df.iloc[temp_idx].copy()
        temp_groups = temp_df[group_col].values

        gss_val = GroupShuffleSplit(n_splits=1, train_size=0.5, random_state=seed)
        val_sub_idx, test_sub_idx = next(gss_val.split(temp_df, groups=temp_groups))

        df.loc[temp_df.index[val_sub_idx], "split"] = "val"
        df.loc[temp_df.index[test_sub_idx], "split"] = "test"
    else:
        # Stratified split on target class
        sss_train = StratifiedShuffleSplit(n_splits=1, train_size=train_size, random_state=seed)
        train_idx, temp_idx = next(sss_train.split(df, df[target_col]))

        df.loc[train_idx, "split"] = "train"

        temp_df = df.iloc[temp_idx].copy()
        sss_val = StratifiedShuffleSplit(n_splits=1, train_size=0.5, random_state=seed)
        val_sub_idx, test_sub_idx = next(sss_val.split(temp_df, temp_df[target_col]))

        df.loc[temp_df.index[val_sub_idx], "split"] = "val"
        df.loc[temp_df.index[test_sub_idx], "split"] = "test"

    return df


def prepare_all_datasets(seed: int = 42) -> Dict[str, Any]:
    """Execute complete dataset preparation, splitting, and manifest creation."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ext_dir = os.path.join(base_dir, "data", "external")
    proc_dir = os.path.join(base_dir, "data", "processed")
    os.makedirs(proc_dir, exist_ok=True)

    open_repair_zip = os.path.join(ext_dir, "OpenRepairData_v0.3_aggregate_202507.zip")
    tu_delft_zip = os.path.join(ext_dir, "Consumer survey product lifetimes and durability of electronics.zip")

    # 1. Prepare Real Datasets
    df_ora, s_ora = prepare_open_repair(open_repair_zip)
    df_tu, s_tu = prepare_tu_delft(tu_delft_zip)

    # 2. Build Level 1 Dataset (Physical Feasibility - 100% Real Empirical Evidence)
    df_l1 = pd.concat([df_ora, df_tu[df_ora.columns]], ignore_index=True)
    df_l1 = assign_deterministic_splits(
        df_l1,
        target_col=LEVEL_1_TARGET_COLUMN,
        group_col="split_group",
        seed=seed,
    )

    l1_csv_path = os.path.join(proc_dir, "physical_feasibility_real.csv")
    df_l1.to_csv(l1_csv_path, index=False)
    print(f"\n[INFO] Saved Level 1 Dataset: {l1_csv_path} ({len(df_l1):,} rows)")

    # 3. Build Level 2 Dataset (Circular Pathway - Calibrated Synthetic + Real TU Delft Salvageable)
    print("\n" + "=" * 80)
    print("PREPARING LEVEL 2 CIRCULAR PATHWAY DATASET")
    print("=" * 80)

    # Generate calibrated synthetic dataset
    df_syn = generate_dataset(n_samples=12000, seed=seed)

    # Filter only non-hazardous, salvageable rows (RECYCLE and SPECIAL_HANDLING handled by Level 1)
    df_syn_salvage = df_syn[
        (df_syn["is_safety_hazard"] == False)
        & (df_syn["recommended_action"].isin(LEVEL_2_CLASSES))
    ].copy()

    df_syn_salvage["circular_action"] = df_syn_salvage["recommended_action"]
    df_syn_salvage["provenance"] = PROVENANCE_SYNTHETIC_DEVELOPMENT
    df_syn_salvage["source_record_id"] = df_syn_salvage["sample_id"]
    df_syn_salvage["split_group"] = df_syn_salvage["sample_id"]

    # TU Delft salvageable rows with circular_action
    df_tu_salvage = df_tu[
        (df_tu["feasibility_label"] == "SALVAGEABLE")
        & (df_tu["circular_action"].notnull())
    ].copy()

    # Fill default physical sub-attributes for TU Delft salvageable rows with honest provenance
    df_tu_salvage["powers_on"] = df_tu_salvage["condition"].apply(lambda c: "YES" if c == "WORKING" else "NO")
    df_tu_salvage["screen_condition"] = "INTACT"
    df_tu_salvage["battery_condition"] = "NORMAL"
    df_tu_salvage["damage_severity"] = df_tu_salvage["condition"].apply(lambda c: "NONE" if c == "WORKING" else "MODERATE")

    l2_cols = [
        "source_record_id",
        "split_group",
        "category",
        "approx_age_years",
        "condition",
        "powers_on",
        "screen_condition",
        "battery_condition",
        "damage_severity",
        "circular_action",
        "provenance",
    ]

    df_l2 = pd.concat([df_syn_salvage[l2_cols], df_tu_salvage[l2_cols]], ignore_index=True)
    df_l2 = assign_deterministic_splits(
        df_l2,
        target_col=LEVEL_2_TARGET_COLUMN,
        group_col="split_group",
        seed=seed,
    )

    l2_csv_path = os.path.join(proc_dir, "circular_pathway_development.csv")
    df_l2.to_csv(l2_csv_path, index=False)
    print(f"[INFO] Saved Level 2 Dataset: {l2_csv_path} ({len(df_l2):,} rows)")

    # 4. Generate Comprehensive Dataset Manifest
    manifest: Dict[str, Any] = {
        "manifest_version": "3.0.0-calibrated",
        "creation_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "random_seed": seed,
        "source_datasets": [
            {
                "name": "Open Repair Alliance",
                "archive": "OpenRepairData_v0.3_aggregate_202507.zip",
                "raw_records": s_ora["raw_rows"],
                "accepted_records": s_ora["final_clean_rows"],
                "outliers_removed": s_ora["age_outliers_removed"],
                "provenance_tag": PROVENANCE_REAL_OPEN_REPAIR,
            },
            {
                "name": "TU Delft Consumer Survey",
                "archive": "Consumer survey product lifetimes and durability of electronics.zip",
                "raw_records": s_tu["raw_records"],
                "accepted_records": s_tu["final_clean_rows"],
                "outliers_removed": s_tu["age_outliers_removed"],
                "provenance_tag": PROVENANCE_REAL_TU_DELFT,
            },
            {
                "name": "Calibrated Circular Synthetic Generator",
                "sample_count": len(df_syn_salvage),
                "provenance_tag": PROVENANCE_SYNTHETIC_DEVELOPMENT,
            },
        ],
        "level_1_physical_feasibility": {
            "dataset_file": "data/processed/physical_feasibility_real.csv",
            "objective": "Classify device recovery feasibility vs end-of-life",
            "total_records": len(df_l1),
            "features": LEVEL_1_FEATURES,
            "target_column": LEVEL_1_TARGET_COLUMN,
            "target_classes": LEVEL_1_CLASSES,
            "target_distribution": df_l1[LEVEL_1_TARGET_COLUMN].value_counts(normalize=True).round(4).to_dict(),
            "provenance_distribution": df_l1["provenance"].value_counts().to_dict(),
            "splits": df_l1["split"].value_counts().to_dict(),
            "category_distribution": df_l1["category"].value_counts().to_dict(),
            "age_summary": {
                "min": float(df_l1["approx_age_years"].min()),
                "median": float(df_l1["approx_age_years"].median()),
                "p75": float(df_l1["approx_age_years"].quantile(0.75)),
                "max": float(df_l1["approx_age_years"].max()),
                "mean": round(float(df_l1["approx_age_years"].mean()), 2),
            },
        },
        "level_2_circular_pathway": {
            "dataset_file": "data/processed/circular_pathway_development.csv",
            "objective": "Classify optimal circular pathway for salvageable devices",
            "total_records": len(df_l2),
            "features": LEVEL_2_FEATURES,
            "target_column": LEVEL_2_TARGET_COLUMN,
            "target_classes": LEVEL_2_CLASSES,
            "target_distribution": df_l2[LEVEL_2_TARGET_COLUMN].value_counts(normalize=True).round(4).to_dict(),
            "provenance_distribution": df_l2["provenance"].value_counts().to_dict(),
            "splits": df_l2["split"].value_counts().to_dict(),
            "category_distribution": df_l2["category"].value_counts().to_dict(),
        },
        "excluded_features_and_rationale": {
            "user_intention": "Excluded from ML feature matrix; handled via Post-Model Policy Layer to avoid circular bias",
            "safety_flags": "Excluded from ML feature matrix; handled via Deterministic Layer 1 Safety Gate",
            "repair_barrier_if_end_of_life": "Excluded due to 100% target leakage (post-repair diagnosis)",
            "problem": "Excluded due to unnormalized multilingual free text with post-repair leakage",
            "out_method": "Excluded due to target leakage (disposition outcome label)",
            "fail_rep": "Excluded from feature inputs (retirement failure label)",
        },
    }

    manifest_path = os.path.join(base_dir, "data", "dataset_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n[INFO] Manifest exported to: {manifest_path}")
    return manifest


if __name__ == "__main__":
    prepare_all_datasets(seed=42)
