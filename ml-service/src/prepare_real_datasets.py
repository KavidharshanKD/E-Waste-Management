"""
Real External Dataset Preparation and Cleaning Pipeline
Processes Open Repair Alliance and TU Delft Consumer Survey datasets.
Preserves strict provenance, cleans age outliers, maps categories and outcomes,
and eliminates target/data leakage.
"""

import json
import os
import zipfile
from typing import Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np

from dataset_schema import (
    EWASTE_CATEGORIES,
    OPEN_REPAIR_CATEGORY_MAP,
    TU_DELFT_CATEGORY_MAP,
    CATEGORY_AGE_LIMITS,
    PROVENANCE_REAL_OPEN_REPAIR,
    PROVENANCE_REAL_TU_DELFT,
    LEVEL_1_TARGET_COLUMN,
    LEVEL_1_CLASSES,
)


def prepare_open_repair(zip_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Load, filter, clean, and map Open Repair Alliance data.
    Only mapped consumer electronics with valid plausible ages and known outcomes are retained.
    """
    print("=" * 80)
    print("PREPARING REAL DATASET: OPEN REPAIR ALLIANCE")
    print("=" * 80)

    stats: Dict[str, Any] = {
        "dataset_name": "Open Repair Alliance",
        "raw_rows": 0,
        "electronics_rows": 0,
        "valid_age_rows": 0,
        "age_outliers_removed": 0,
        "unknown_outcome_removed": 0,
        "final_clean_rows": 0,
        "category_counts": {},
        "target_distribution": {},
        "age_stats": {},
    }

    with zipfile.ZipFile(zip_path, "r") as z:
        main_csv = "202507/aggregate/OpenRepairData_v0.3_aggregate_202507.csv"
        with z.open(main_csv) as f:
            df_raw = pd.read_csv(f, low_memory=False)

    stats["raw_rows"] = int(len(df_raw))

    # 1. Category Filtering
    df_elec = df_raw[df_raw["product_category"].isin(OPEN_REPAIR_CATEGORY_MAP.keys())].copy()
    df_elec["category"] = df_elec["product_category"].map(OPEN_REPAIR_CATEGORY_MAP)
    stats["electronics_rows"] = int(len(df_elec))

    # 2. Target Mapping (Level 1: Physical Feasibility)
    # Fixed and Repairable demonstrate physical salvageability
    # End of life demonstrates terminal physical failure
    target_map = {
        "Fixed": "SALVAGEABLE",
        "Repairable": "SALVAGEABLE",
        "End of life": "END_OF_LIFE",
    }
    df_known = df_elec[df_elec["repair_status"].isin(target_map.keys())].copy()
    stats["unknown_outcome_removed"] = int(len(df_elec) - len(df_known))
    df_known["feasibility_label"] = df_known["repair_status"].map(target_map)

    # 3. Age Cleaning & Outlier Removal
    df_valid_age = df_known.dropna(subset=["product_age"]).copy()
    stats["valid_age_rows"] = int(len(df_valid_age))

    # Apply category-aware age limits
    df_valid_age["age_cap"] = df_valid_age["category"].map(CATEGORY_AGE_LIMITS)
    mask_clean_age = (df_valid_age["product_age"] >= 0.1) & (df_valid_age["product_age"] <= df_valid_age["age_cap"])
    df_clean = df_valid_age[mask_clean_age].copy()
    stats["age_outliers_removed"] = int(len(df_valid_age) - len(df_clean))

    # 4. Standardize Clean Fields
    df_clean["approx_age_years"] = df_clean["product_age"].round(1).astype(float)
    df_clean["condition"] = "NOT_RECORDED"  # Honest provenance: intake condition was broken, but not sub-graded
    df_clean["provenance"] = PROVENANCE_REAL_OPEN_REPAIR
    df_clean["source_record_id"] = df_clean["id"].astype(str)
    df_clean["split_group"] = df_clean["group_identifier"].astype(str)

    # 5. Drop Leakage and Redundant Columns
    # LEAKAGE FIELDS REMOVED: repair_status, repair_barrier_if_end_of_life, problem
    # METADATA REMOVED: event_date, country, data_provider, partner_product_category, product_category_id
    columns_to_keep = [
        "source_record_id",
        "split_group",
        "category",
        "approx_age_years",
        "condition",
        "feasibility_label",
        "provenance",
    ]
    df_final = df_clean[columns_to_keep].reset_index(drop=True)
    stats["final_clean_rows"] = int(len(df_final))
    stats["category_counts"] = df_final["category"].value_counts().to_dict()
    stats["target_distribution"] = df_final["feasibility_label"].value_counts(normalize=True).round(4).to_dict()

    ages = df_final["approx_age_years"]
    stats["age_stats"] = {
        "min": float(ages.min()),
        "p25": float(ages.quantile(0.25)),
        "median": float(ages.median()),
        "p75": float(ages.quantile(0.75)),
        "max": float(ages.max()),
        "mean": round(float(ages.mean()), 2),
    }

    print(f"Accepted: {stats['final_clean_rows']:,} / {stats['raw_rows']:,} records")
    print(f"Class breakdown: {stats['target_distribution']}")
    print(f"Age median: {stats['age_stats']['median']} years (range {stats['age_stats']['min']} - {stats['age_stats']['max']})")

    return df_final, stats


def prepare_tu_delft(zip_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Load, filter, clean, and map TU Delft Consumer Survey dataset.
    Extracts lifecycle duration, post-retirement condition, and disposition pathways.
    """
    print("\n" + "=" * 80)
    print("PREPARING REAL DATASET: TU DELFT CONSUMER SURVEY")
    print("=" * 80)

    stats: Dict[str, Any] = {
        "dataset_name": "TU Delft Consumer Survey",
        "raw_records": 0,
        "mapped_category_records": 0,
        "age_outliers_removed": 0,
        "unmapped_outcome_removed": 0,
        "final_clean_rows": 0,
        "category_counts": {},
        "target_distribution": {},
        "age_stats": {},
    }

    with zipfile.ZipFile(zip_path, "r") as z:
        for name in z.namelist():
            if name.endswith(".json"):
                with z.open(name) as f:
                    data = json.load(f)

    records = []
    if isinstance(data, dict):
        for code, val in data.items():
            if isinstance(val, dict) and "LTrecords" in val:
                for rid, r in val["LTrecords"].items():
                    r_copy = dict(r)
                    r_copy["_code"] = code
                    r_copy["_rid"] = rid
                    records.append(r_copy)

    df_raw = pd.DataFrame(records)
    stats["raw_records"] = int(len(df_raw))

    # 1. Category Mapping
    df_raw["category"] = df_raw["_code"].map(TU_DELFT_CATEGORY_MAP)
    df_cat = df_raw.dropna(subset=["category"]).copy()
    stats["mapped_category_records"] = int(len(df_cat))

    # 2. Age Cleaning (LT is total lifetime in years)
    df_cat["LT_num"] = pd.to_numeric(df_cat["LT"], errors="coerce")
    df_cat["age_cap"] = df_cat["category"].map(CATEGORY_AGE_LIMITS)
    mask_clean_age = (df_cat["LT_num"] >= 0.1) & (df_cat["LT_num"] <= df_cat["age_cap"])
    df_clean_age = df_cat[mask_clean_age].copy()
    stats["age_outliers_removed"] = int(len(df_cat) - len(df_clean_age))

    # 3. Condition Mapping
    # out_condition: 1=Like new, 2=Good, 3=Fair/partially functioning, 4=Broken
    cond_map = {
        "1": "WORKING",
        "2": "WORKING",
        "3": "PARTIALLY_WORKING",
        "4": "DAMAGED",
    }
    df_clean_age["condition"] = df_clean_age["out_condition"].astype(str).map(cond_map).fillna("WORKING")

    # 4. Target Mapping (Level 1: Physical Feasibility)
    def map_feasibility(row) -> Optional[str]:
        method = str(row["out_method"]).strip()
        fail = str(row["fail_rep"]).strip()
        if method in ["1", "2", "3"]:
            # Sold, donated, or traded in -> clearly salvageable/functional
            return "SALVAGEABLE"
        elif method == "5":
            # Discarded in household trash -> terminal end-of-life
            return "END_OF_LIFE"
        elif method == "4":
            # Municipal e-waste recycling -> failed items are end-of-life, working items are salvageable
            return "END_OF_LIFE" if fail == "failed" else "SALVAGEABLE"
        elif method == "":
            # Device still held in storage/possession
            return "SALVAGEABLE" if fail == "const" else "END_OF_LIFE"
        return None

    # Target Mapping (Level 2: Circular Pathway for salvageable items)
    def map_circular(row) -> Optional[str]:
        method = str(row["out_method"]).strip()
        fail = str(row["fail_rep"]).strip()
        in_poss = bool(row["out_inpossession"])
        if method == "1":
            return "REFURBISH_AND_SELL"
        elif method == "2":
            return "DONATE"
        elif method == "3":
            return "REFURBISH_AND_SELL"
        elif in_poss and fail == "const":
            return "KEEP_USING"
        elif fail == "repair":
            return "REPAIR"
        return None

    df_clean_age["feasibility_label"] = df_clean_age.apply(map_feasibility, axis=1)
    df_clean_age["circular_action"] = df_clean_age.apply(map_circular, axis=1)

    df_mapped = df_clean_age.dropna(subset=["feasibility_label"]).copy()
    stats["unmapped_outcome_removed"] = int(len(df_clean_age) - len(df_mapped))

    # 5. Standardize Clean Fields
    df_mapped["approx_age_years"] = df_mapped["LT_num"].round(1).astype(float)
    df_mapped["provenance"] = PROVENANCE_REAL_TU_DELFT
    df_mapped["source_record_id"] = df_mapped["_rid"].astype(str)
    df_mapped["split_group"] = df_mapped["ID_worker"].astype(str)  # Survey worker ID prevents user leakage

    # 6. Drop Leakage and Redundant Columns
    # LEAKAGE FIELDS REMOVED: out_method, fail_rep, out_inpossession, out_inuse, LTphase
    # METADATA REMOVED: ID_survey, ID_worker, in_month, in_year, report_date, price_range, country
    columns_to_keep = [
        "source_record_id",
        "split_group",
        "category",
        "approx_age_years",
        "condition",
        "feasibility_label",
        "circular_action",
        "provenance",
    ]
    df_final = df_mapped[columns_to_keep].reset_index(drop=True)
    stats["final_clean_rows"] = int(len(df_final))
    stats["category_counts"] = df_final["category"].value_counts().to_dict()
    stats["target_distribution"] = df_final["feasibility_label"].value_counts(normalize=True).round(4).to_dict()

    ages = df_final["approx_age_years"]
    stats["age_stats"] = {
        "min": float(ages.min()),
        "p25": float(ages.quantile(0.25)),
        "median": float(ages.median()),
        "p75": float(ages.quantile(0.75)),
        "max": float(ages.max()),
        "mean": round(float(ages.mean()), 2),
    }

    print(f"Accepted: {stats['final_clean_rows']:,} / {stats['raw_records']:,} records")
    print(f"Class breakdown: {stats['target_distribution']}")
    print(f"Age median: {stats['age_stats']['median']} years (range {stats['age_stats']['min']} - {stats['age_stats']['max']})")

    return df_final, stats
