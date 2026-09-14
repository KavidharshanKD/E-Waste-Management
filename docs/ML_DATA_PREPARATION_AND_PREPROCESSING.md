# Module 3: Real-Data Calibration, Data Integration & ML Preprocessing

**Module Status:** Completed (Module 3)  
**Artifact Purpose:** Technical Specification of Hierarchical Dataset Engineering, Preprocessing Pipelines, Calibration, and Module 4 Training Contract  
**Precondition:** Zero ML models trained; zero model artifacts created; zero application code modified.

---

## 1. Final Hierarchical Recommendation Architecture

To overcome the semantic mismatch between raw community repair logs (which only see broken items) and commercial circular marketplace recommendations, our ML recommendation engine is structured into a two-level hierarchical architecture, guarded by an antecedent deterministic safety gate and followed by an intention policy layer:

```
                                [ Intake Assessment Data ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
               (Safety Hazard?)                                    │ (Safe)
                       │                                           ▼
                       ▼                           [ Level 1: Physical Feasibility ]
               SPECIAL_HANDLING                     (Trained on 100% Real Empirical Data)
         (Deterministic Layer 1 Gate)                              │
                                                    ┌──────────────┴──────────────┐
                                                    ▼                             ▼
                                               SALVAGEABLE                   END_OF_LIFE
                                           (Device Viable for Fix)       (Terminal Failure / Recycle)
                                                    │                             │
                                                    ▼                             ▼
                                      [ Level 2: Circular Pathway ]            RECYCLE
                                      (Trained on Calibrated Data)
                                                    │
                                      ┌─────────────┼─────────────┐
                                      ▼             ▼             ▼
                                  KEEP_USING    REFURBISH      DONATE
                                                    │
                                                    ▼
                                            REFURBISH_AND_SELL
                                                    │
                                                    ▼
                                       [ Intention Policy Layer ]
                                       (Reconciles User Preference)
                                                    │
                                                    ▼
                                         [ Final Recommendation ]
```

---

## 2. Level 1 Objective (Physical Feasibility)

- **Objective:** Evaluate whether a submitted device has genuine physical recovery potential or has reached terminal end-of-life obsolescence/irreparability.
- **Target Column:** `feasibility_label`
- **Target Classes:**
  - `SALVAGEABLE`: Device can be repaired, upgraded, or kept in service.
  - `END_OF_LIFE`: Device has irrecoverable hardware failure, missing critical components, or prohibitive repair barriers.
- **Empirical Grounding:** **100% Real Empirical Data** (12,856 verified records from Open Repair Alliance and TU Delft Consumer Survey).

---

## 3. Level 2 Objective (Circular Pathway)

- **Objective:** For devices confirmed as `SALVAGEABLE` by Level 1, determine the optimal high-value circular disposition pathway.
- **Target Column:** `circular_action`
- **Target Classes:**
  - `KEEP_USING`: Device still operational or requires minimal maintenance; owner should retain.
  - `REPAIR`: Direct hardware repair required to restore primary operational state.
  - `REFURBISH`: Overhaul, cleaning, cosmetic restoration, and subsystem parts replacement.
  - `REFURBISH_AND_SELL`: Commercial restoration for certified listing on the Circular Marketplace.
  - `DONATE`: Functional or repairable hardware redirected to educational, community, or non-profit recipients.
- **Empirical Grounding:** Calibrated synthetic generation anchored on real TU Delft post-retirement disposition pathways and Open Repair component repairability baselines.

---

## 4. Real Dataset Mappings

### A. Open Repair Alliance (ORA)
- **Source Archive:** `ml-service/data/external/OpenRepairData_v0.3_aggregate_202507.zip`
- **Raw Rows:** 305,649 repair records
- **Electronics Rows Filtered:** 38,599 records
- **Valid Plausible Age Records:** 12,368 records
- **Accepted Clean Records:** **11,874 records**
- **Category Mappings:**
  - `Laptop` $\rightarrow$ `LAPTOP` (4,207 clean records)
  - `Mobile` $\rightarrow$ `MOBILE_PHONE` (1,579 clean records)
  - `Desktop computer` $\rightarrow$ `DESKTOP` (801 clean records)
  - `Printer/scanner` $\rightarrow$ `PRINTER` (2,017 clean records)
  - `Flat screen` $\rightarrow$ `MONITOR` (1,462 clean records)
  - `TV and gaming-related accessories` $\rightarrow$ `TELEVISION` (1,560 clean records)
  - `Tablet` $\rightarrow$ `OTHER` (1,230 clean records)
- **Target Mappings:**
  - `Fixed` + `Repairable` $\rightarrow$ `SALVAGEABLE` (9,113 records, 76.75%)
  - `End of life` $\rightarrow$ `END_OF_LIFE` (2,761 records, 23.25%)
  - `Unknown` $\rightarrow$ Excluded (unverified ground truth)

### B. TU Delft Consumer Survey
- **Source Archive:** `ml-service/data/external/Consumer survey product lifetimes and durability of electronics.zip`
- **Raw Survey Records:** 1,037 product lifecycles
- **Accepted Clean Records:** **982 records**
- **Category Mappings:**
  - `0303` $\rightarrow$ `LAPTOP` (289 records)
  - `0302` $\rightarrow$ `DESKTOP` (231 records)
  - `0306` $\rightarrow$ `MOBILE_PHONE` (172 records)
  - `0304` $\rightarrow$ `PRINTER` (152 records)
  - `0408` / `0309` $\rightarrow$ `MONITOR` (98 records)
  - `0407` $\rightarrow$ `TELEVISION` (7 records)
  - `0308` / `0204` / `0404` / `0405` / `0406` $\rightarrow$ `OTHER` (33 records)
- **Target Mappings:**
  - Level 1: Sold (`1`), Donated (`2`), Traded in (`3`), or Stored Working $\rightarrow$ `SALVAGEABLE` (677 records, 68.94%); Recycled/Trashed with hardware failure $\rightarrow$ `END_OF_LIFE` (305 records, 31.06%).
  - Level 2: Sold $\rightarrow$ `REFURBISH_AND_SELL` (136); Donated $\rightarrow$ `DONATE` (219); Stored Constant $\rightarrow$ `KEEP_USING` (173); Repair attempt $\rightarrow$ `REPAIR` (1).

---

## 5. Final Level 1 Feature Matrix

Features used for Physical Feasibility classification:
1. `category` (Nominal categorical: `MOBILE_PHONE`, `LAPTOP`, `DESKTOP`, `MONITOR`, `TELEVISION`, `PRINTER`, `OTHER`)
2. `approx_age_years` (Continuous numerical: empirical device age in years, scaled via `RobustScaler`)
3. `condition` (Categorical: `WORKING`, `PARTIALLY_WORKING`, `DAMAGED`, `NOT_WORKING`, `NOT_RECORDED`)

*Note:* For Open Repair records, `condition` is truthfully assigned `"NOT_RECORDED"` without fabricating artificial sub-attributes.

---

## 6. Final Level 2 Feature Matrix

Features used for Circular Pathway classification:
1. `category` (Nominal categorical)
2. `approx_age_years` (Continuous numerical)
3. `condition` (Nominal categorical: `WORKING`, `PARTIALLY_WORKING`, `DAMAGED`, `NOT_WORKING`)
4. `powers_on` (Binary categorical: `YES`, `NO`)
5. `screen_condition` (Nominal categorical: `INTACT`, `MINOR_SCRATCHES`, `CRACKED`, `DEAD_PIXELS_BLEED`, `SHATTERED_NOT_WORKING`, `NOT_APPLICABLE`)
6. `battery_condition` (Nominal categorical: `NORMAL`, `DEGRADED`, `DEAD`, `NOT_APPLICABLE`)
7. `damage_severity` (Ordinal categorical: `NONE`, `MINOR_COSMETIC`, `MODERATE`, `HEAVY`)

---

## 7. Features Deliberately Excluded from ML Training

| Excluded Feature | Reason for Exclusion | Architectural Alternative |
| :--- | :--- | :--- |
| `user_intention` | Avoids circular bias and feedback loops. A user's intention does not change the physical viability of broken hardware. | Re-introduced post-model via the **Intention Policy Layer**. |
| `battery_swollen` | Safety hazard; terminal non-negotiable risk. | Handled upstream by **Layer 1 Deterministic Safety Gate**. |
| `battery_leaking` | Safety hazard; chemical hazard. | Handled upstream by **Layer 1 Deterministic Safety Gate**. |
| `overheating_evidence` | Safety hazard; thermal runaway risk. | Handled upstream by **Layer 1 Deterministic Safety Gate**. |
| `severe_physical_damage`| Safety hazard; structural integrity compromise. | Handled upstream by **Layer 1 Deterministic Safety Gate**. |
| `repair_barrier_if_end_of_life` | 100% target leakage (determined post-repair). | Excluded completely from all feature matrices. |
| `problem` (Free text) | Multi-lingual text mixing symptoms with post-repair outcomes. | Excluded from baseline structured ML models. |
| `out_method` | Target label in TU Delft (disposition). | Used strictly as target outcome ground truth. |
| `fail_rep` | Target label proxy in TU Delft. | Used strictly for outcome mapping. |
| `id`, `event_date`, `group_identifier` | Administrative identifiers. | Used strictly for metadata and group-aware splitting. |

---

## 8. Leakage Prevention Strategy

1. **Post-Event Attribute Quarantine:** Any attribute determined after a technician intervention or disposal decision is quarantined and prohibited from ML input vectors.
2. **Deterministic Group-Aware Splitting:** Split by `group_identifier` (Open Repair local event hosts) and `ID_worker` (TU Delft survey respondent) using scikit-learn's `GroupShuffleSplit`. This guarantees that records collected during the same physical repair session or from the same survey participant never appear in both train and test partitions.
3. **Target Isolation:** Target columns (`feasibility_label`, `circular_action`) are stripped from `X` matrices prior to transformation.

---

## 9. User-Intention Policy Architecture

`user_intention` is explicitly preserved in the application intake contract (`UserIntention` Java enum and `AddEWaste.jsx`), but is evaluated **after** ML inference:

```
[ Physical Features ] ──► [ Level 1 Feasibility ] ──► P(Salvageable) vs P(End-of-Life)
                                  │
                                  ▼
                          [ Level 2 Circular ]   ──► Probabilities over [KEEP_USING, REPAIR, REFURBISH, ...]
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │ Intention Policy     │ ◄── [ User Intention: e.g. SELL ]
                       │ Harmonization Engine │
                       └──────────────────────┘
                                  │
                                  ▼
                       [ Final Actionable Guidance ]
```

### Policy Harmonization Rules:
1. **Physical Infeasibility Override:** If user intends `SELL` or `DONATE`, but Level 1 predicts $P(\text{END\_OF\_LIFE}) > 0.85$, policy rejects direct sale and routes to `RECYCLE` with an explanation: *"Device has terminal hardware damage unsuited for resale."*
2. **Educational Value Elevation:** If user intends `RECYCLE` or `DISCARD`, but Level 1 & Level 2 indicate high viability ($P(\text{REFURBISH\_AND\_SELL}) > 0.70$ on a 2-year-old laptop in `GOOD` condition), policy elevates `REFURBISH_AND_SELL` with an incentive nudge: *"Your device still has significant refurbishment value. List it on the Circular Marketplace."*
3. **Direct Confirmation:** When user intention aligns with physical feasibility, intention provides the tie-breaking prior among competing classes.

---

## 10. Safety-Gate Architecture

The safety gate operates as a deterministic, non-probabilistic barrier prior to any ML model invocation:
- If `battery_swollen == True` OR `battery_leaking == True` OR `overheating_evidence == True` OR `severe_physical_damage == True` OR `condition == "HAZARDOUS"`:
  - Immediate terminal recommendation: `SPECIAL_HANDLING`.
  - No ML inference is executed.
  - Generates specialized handling instructions (fire-safe containment, battery neutralization, drop-off at certified hazardous e-waste depository).

---

## 11. Empirical Calibration Changes

Based on Phase 2.5 audit findings, our synthetic data generation parameters in `ml-service/src/dataset_schema.py` were calibrated using real empirical statistics:

| Category | Prior Synthetic Lifespan | Real Open Repair Median | Real TU Delft Median | Calibrated Lifespan Parameter | Real Repairability Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MOBILE_PHONE** | 4.5 years | 4.0 years | 3.5 years | **3.8 years** | 72.0% |
| **LAPTOP** | 6.0 years | 6.0 years | 5.8 years | **5.9 years** | 75.0% |
| **DESKTOP** | 8.0 years | 8.0 years | 7.3 years | **7.6 years** | 85.0% |
| **MONITOR** | 7.0 years | 8.0 years | 5.4 years | **6.7 years** | 60.0% |
| **TELEVISION** | 8.0 years | 10.0 years | 12.7 years | **11.3 years** | 55.0% |
| **PRINTER** | 5.0 years | 6.0 years | 4.1 years | **5.0 years** | 50.0% |

---

## 12. Dataset Provenance System

All records carry an immutable `provenance` column:
1. `REAL_OPEN_REPAIR`: Unadulterated historical community repair records from the Open Repair Alliance.
2. `REAL_TU_DELFT`: Empirical survey lifecycle data from TU Delft.
3. `SYNTHETIC_DEVELOPMENT`: Algorithmically generated records from our calibrated synthetic generator.
4. `HYBRID_AUGMENTED`: Real records where specific unobserved physical attributes have been statistically imputed.

---

## 13. Splitting Strategy

- **Train / Validation / Test Split:** Fixed deterministic 70% / 15% / 15% ratio with random seed `42`.
- **Group Leakage Control:** Open Repair records are grouped by `group_identifier` (repair café location/session). TU Delft records are grouped by `ID_worker`.
- **Dual Evaluation Contract for Module 4:**
  - Evaluation results must be reported separately on **REAL held-out test data** (`REAL_OPEN_REPAIR` / `REAL_TU_DELFT`) vs **SYNTHETIC held-out test data** (`SYNTHETIC_DEVELOPMENT`).

---

## 14. Class Imbalance Analysis & Class Weights

### Level 1 (Physical Feasibility):
- `SALVAGEABLE`: 76.15% (9,789 records)
- `END_OF_LIFE`: 23.85% (3,067 records)
- **Ratio:** ~3.2 : 1
- **Recommendation for Module 4:** Apply balanced class weights (`class_weight='balanced'`) during model fitting:
  - Weight for `SALVAGEABLE`: $0.656$
  - Weight for `END_OF_LIFE`: $2.096$

### Level 2 (Circular Pathway):
- `DONATE`: 32.67%
- `REFURBISH_AND_SELL`: 21.70%
- `KEEP_USING`: 20.63%
- `REPAIR`: 19.32%
- `REFURBISH`: 5.68%
- **Recommendation for Module 4:** `REFURBISH` is minority (~5.7%). Use balanced multinomial class weighting or focal loss in tree classifiers. Do not apply synthetic oversampling (SMOTE) without baseline comparison.

---

## 15. Limitations of Real and Synthetic Data

### Real Data Limitations:
1. **Intake Selection Bias:** Open Repair only contains broken items; TU Delft only contains retired devices. Fully operational items in active daily use are under-represented.
2. **Missing Sub-Attributes:** Neither real dataset tracks structured screen damage, battery health percentages, or cosmetic scratches.
3. **No Commercial Economics:** Real data does not record commercial repair costs, refurbished selling prices, or profit margins.

### Synthetic Data Limitations:
1. Generated under simulated distributional assumptions; cannot fully replicate the high tail-variance of real human behavior.

---

## 16. Module 4 Model Training Contract

When progressing to Module 4, the implementation must strictly satisfy:

1. **Train Level 1 Model:** Binary classifier (`SALVAGEABLE` vs `END_OF_LIFE`) using `Level1Preprocessor` on `data/processed/physical_feasibility_real.csv`.
2. **Train Level 2 Model:** Multi-class classifier (`KEEP_USING`, `REPAIR`, `REFURBISH`, `REFURBISH_AND_SELL`, `DONATE`) using `Level2Preprocessor` on `data/processed/circular_pathway_development.csv`.
3. **Baseline Comparison:** Train at least two candidate algorithms (e.g. `LogisticRegression` / `CalibratedClassifierCV` baseline vs `RandomForestClassifier` / `HistGradientBoostingClassifier`).
4. **Independent Evaluation:** Report precision, recall, F1-score, and ROC-AUC separately on:
   - Real held-out test split
   - Synthetic held-out test split
5. **Model Serialization:** Save fitted pipelines and calibration metadata to versioned artifacts in `ml-service/models/`.

---
*Documentation authoritatively established under Module 3. No models fitted or trained.*
