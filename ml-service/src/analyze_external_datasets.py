"""
Audit and Analysis Script for External Real Datasets:
1. Open Repair Alliance (aggregate CSV + schema metadata)
2. TU Delft Consumer Survey on Product Lifetimes and Durability of Electronics (JSON)

This script performs exploratory data analysis, schema extraction, column mapping,
null-rate computation, and outcome distribution analysis without modifying raw files.
"""

import json
import os
import zipfile
from typing import Dict, Any, List
import pandas as pd
import numpy as np


def analyze_open_repair(zip_path: str) -> Dict[str, Any]:
    print("=" * 80)
    print("1. AUDITING OPEN REPAIR ALLIANCE DATASET")
    print("=" * 80)

    results = {}
    with zipfile.ZipFile(zip_path, "r") as z:
        namelist = z.namelist()
        results["files"] = namelist
        print(f"Files in archive: {namelist}")

        # 1. Read tableschema.json if present
        if "202507/aggregate/tableschema.json" in namelist:
            with z.open("202507/aggregate/tableschema.json") as f:
                schema_json = json.load(f)
                fields = schema_json.get("fields", [])
                results["schema_fields"] = fields
                print("\n--- Open Repair tableschema.json Fields & Descriptions ---")
                for fld in fields:
                    print(f"  - {fld.get('name')} ({fld.get('type')}): {fld.get('description', '')}")

        # 2. Read product categories
        cat_file = "202507/aggregate/OpenRepairData_v0.3_Product_Categories.csv"
        if cat_file in namelist:
            with z.open(cat_file) as f:
                cat_df = pd.read_csv(f)
                results["product_categories"] = cat_df.to_dict(orient="records")
                print("\n--- Open Repair Standard Product Categories ---")
                print(cat_df.head(20).to_string())

        # 3. Read main aggregate CSV
        main_csv = "202507/aggregate/OpenRepairData_v0.3_aggregate_202507.csv"
        print(f"\n[INFO] Loading {main_csv} from ZIP archive...")
        with z.open(main_csv) as f:
            df = pd.read_csv(f, low_memory=False)

        results["row_count"] = len(df)
        results["col_count"] = len(df.columns)
        results["columns"] = list(df.columns)

        print(f"\nRow count: {len(df):,}, Column count: {len(df.columns)}")
        print("\nColumns and Data Types:")
        col_types = df.dtypes.to_dict()
        results["dtypes"] = {k: str(v) for k, v in col_types.items()}
        for k, v in results["dtypes"].items():
            print(f"  {k:<35}: {v}")

        # Missing values
        null_counts = df.isnull().sum()
        null_rates = (null_counts / len(df) * 100).round(2).to_dict()
        results["missing_rates_pct"] = null_rates

        print("\nMissing Value Rates:")
        for col, rate in null_rates.items():
            print(f"  {col:<35}: {rate:>6.2f}% null")

        # Distributions of key categorical fields
        print("\n--- Repair Status Distribution ---")
        status_dist = df["repair_status"].value_counts(dropna=False, normalize=True) * 100
        print(status_dist.round(2).to_string())
        results["repair_status_dist"] = status_dist.round(2).to_dict()

        if "product_category" in df.columns:
            print("\n--- Product Category Distribution (Top 25) ---")
            cat_dist = df["product_category"].value_counts(dropna=False, normalize=True).head(25) * 100
            print(cat_dist.round(2).to_string())
            results["product_category_dist"] = cat_dist.round(2).to_dict()

        if "product_age" in df.columns:
            age_valid = df["product_age"].dropna()
            age_stats = {
                "count_valid": int(len(age_valid)),
                "pct_valid": round(len(age_valid) / len(df) * 100, 2),
                "min": float(age_valid.min()),
                "max": float(age_valid.max()),
                "median": float(age_valid.median()),
                "mean": round(float(age_valid.mean()), 2),
            }
            print("\n--- Product Age Statistics ---")
            print(age_stats)
            results["product_age_stats"] = age_stats

        if "repair_barrier_if_end_of_life" in df.columns:
            print("\n--- Repair Barrier If End of Life (Top 10) ---")
            barrier_dist = df["repair_barrier_if_end_of_life"].value_counts(dropna=False, normalize=True).head(10) * 100
            print(barrier_dist.round(2).to_string())
            results["repair_barrier_dist"] = barrier_dist.round(2).to_dict()

        # Problem field text samples
        if "problem" in df.columns:
            print("\n--- Problem Free-Text Samples (5 examples) ---")
            sample_problems = df["problem"].dropna().sample(5, random_state=42).tolist()
            for i, p in enumerate(sample_problems, 1):
                print(f"  [{i}] {p}")

    return results


def analyze_tu_delft(zip_path: str) -> Dict[str, Any]:
    print("\n" + "=" * 80)
    print("2. AUDITING TU DELFT CONSUMER SURVEY DATASET")
    print("=" * 80)

    results = {}
    with zipfile.ZipFile(zip_path, "r") as z:
        namelist = z.namelist()
        results["files"] = namelist
        print(f"Files in archive: {namelist}")

        for name in namelist:
            if name.endswith(".json"):
                print(f"[INFO] Inspecting JSON file: {name}")
                with z.open(name) as f:
                    data = json.load(f)

                results["filename"] = name

                all_reports = []
                category_lookup = {
                    "0204": "Vacuum Cleaners",
                    "0302": "Desktop Computers",
                    "0303": "Laptops",
                    "0304": "Printers",
                    "0306": "Smartphones",
                    "0308": "Tablets",
                    "0309": "Computer Monitors",
                    "0404": "Camcorders",
                    "0405": "Audio Systems/Speakers",
                    "0406": "Digital Cameras",
                    "0407": "Televisions",
                    "0408": "Displays/Monitors",
                }

                if isinstance(data, dict):
                    results["root_keys"] = list(data.keys())
                    for k, val in data.items():
                        if isinstance(val, dict) and "LTrecords" in val:
                            lt_records = val["LTrecords"]
                            for rec_id, rec in lt_records.items():
                                if isinstance(rec, dict):
                                    rec_copy = dict(rec)
                                    rec_copy["_product_code"] = k
                                    rec_copy["_category_name"] = category_lookup.get(k, "Unknown")
                                    rec_copy["_record_id"] = rec_id
                                    all_reports.append(rec_copy)

                print(f"\n[INFO] Total flattened product reports in TU Delft survey: {len(all_reports):,}")
                df_tu = pd.json_normalize(all_reports)
                results["row_count"] = len(df_tu)
                results["col_count"] = len(df_tu.columns)
                results["columns"] = list(df_tu.columns)

                print(f"Flattened DataFrame Shape: {df_tu.shape[0]} rows, {df_tu.shape[1]} columns")
                print("\nTU Delft Discovered Columns and Non-Null Counts:")
                for c in list(df_tu.columns):
                    non_null = df_tu[c].notnull().sum()
                    pct = (non_null / len(df_tu)) * 100
                    print(f"  - {c:<30}: {non_null:>5}/{len(df_tu)} ({pct:>5.1f}%) [dtype: {df_tu[c].dtype}]")

                results["missing_rates_pct"] = ((df_tu.isnull().sum() / len(df_tu)) * 100).round(2).to_dict()

                print("\n--- Distribution of Category Code & Name ---")
                print(df_tu[["_product_code", "_category_name"]].value_counts().to_string())

                # Deep inspection into categorical codes
                survey_cols = [
                    "fail_rep", "in_condition", "out_condition",
                    "out_method", "out_inuse", "out_inpossession",
                    "LTphase", "chng_user", "country", "price_range"
                ]

                print("\n--- Detailed Breakdown of Survey Response Enums / Codes ---")
                for sc in survey_cols:
                    if sc in df_tu.columns:
                        print(f"\nDistribution of '{sc}':")
                        print(df_tu[sc].value_counts(dropna=False).head(10).to_string())

                # Numerical lifespan fields: LS, LT, niu_months
                print("\n--- Numerical Lifetime / Lifespan Fields ---")
                for num_col in ["LS", "LT", "niu_months"]:
                    if num_col in df_tu.columns:
                        vals = pd.to_numeric(df_tu[num_col], errors="coerce").dropna()
                        print(f"Stats for '{num_col}': count={len(vals)}, min={vals.min()}, max={vals.max()}, median={vals.median()}, mean={vals.mean():.2f}")

                results["df_tu"] = df_tu

    return results


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ext_dir = os.path.join(base_dir, "data", "external")

    open_repair_zip = os.path.join(ext_dir, "OpenRepairData_v0.3_aggregate_202507.zip")
    tu_delft_zip = os.path.join(ext_dir, "Consumer survey product lifetimes and durability of electronics.zip")

    if os.path.exists(open_repair_zip):
        open_repair_res = analyze_open_repair(open_repair_zip)
    else:
        print(f"[ERROR] Open Repair ZIP not found at {open_repair_zip}")

    if os.path.exists(tu_delft_zip):
        tu_delft_res = analyze_tu_delft(tu_delft_zip)
    else:
        print(f"[ERROR] TU Delft ZIP not found at {tu_delft_zip}")

    print("\n" + "=" * 80)
    print("AUDIT EXECUTION COMPLETE - NO DATA COMMITTED OR STAGED")
    print("=" * 80)


if __name__ == "__main__":
    main()
