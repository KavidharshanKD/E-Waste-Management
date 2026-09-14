# Smart E-Waste Machine Learning Subsystem (`ml-service`)

This module houses the custom Machine Learning intelligence layer for the **Smart E-Waste Management System**.

## Architectural Role: Hybrid Recommendation Engine

The platform implements a **3-Layer Hybrid Recommendation Architecture**:
1. **Layer 1: Deterministic Safety Gate**: Hard rule-based safety screening for hazardous indicators (`battery_swollen`, `battery_leaking`, `overheating_evidence`, `severe_physical_damage`, and explicit `HAZARDOUS` condition) routing deterministically to `SPECIAL_HANDLING`.
2. **Layer 2: Custom Supervised ML Model**: Trained offline on non-hazardous equipment to evaluate circular trade-offs across 6 classes: `KEEP_USING`, `REPAIR`, `REFURBISH`, `REFURBISH_AND_SELL`, `DONATE`, `RECYCLE`.
3. **Layer 3: Policy & User Intention Filter**: Harmonizes the ML prediction with the citizen's declared `user_intention`.

## Module 2 Scope
* Dataset design, feature schema specification, and reproducible ground-truth generation.
* Automated validation and test suites.

## Project Structure
```
ml-service/
├── README.md
├── requirements.txt
├── data/
│   ├── README.md
│   └── generated/
│       ├── device_lifecycle_synthetic.csv
│       └── dataset_metadata.json
├── src/
│   ├── __init__.py
│   ├── dataset_schema.py
│   ├── generate_dataset.py
│   └── validate_dataset.py
└── tests/
    ├── __init__.py
    └── test_dataset_generation.py
```

## Running Tests
```bash
python -m unittest discover -s tests -p "test_*.py" -v
```
