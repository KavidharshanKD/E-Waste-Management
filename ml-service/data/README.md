# E-Waste ML Dataset Directory

> [!IMPORTANT]
> **SYNTHETIC / DEVELOPMENT DATA NOTICE**
> The datasets in this directory are algorithmically generated synthetic records created strictly for offline model design, feature engineering, and pipeline prototyping during development.
> They are **NOT** real-world historical records, empirical field collections, or fabricated production data.
> In future operational phases, genuine labelled outcomes from technician inspections and refurbishment workflows will replace or augment these development records.

## Directory Structure

* `generated/device_lifecycle_synthetic.csv`: Synthetic development dataset generated via `src/generate_dataset.py`.
* `generated/dataset_metadata.json`: Audit statistics, distributions, and metadata for the current generated dataset.

## Generation Command

To reproduce the default development dataset (10,000 samples, seed 42):
```bash
python src/generate_dataset.py --samples 10000 --seed 42
```
To validate dataset physical and safety invariants:
```bash
python src/validate_dataset.py
```
