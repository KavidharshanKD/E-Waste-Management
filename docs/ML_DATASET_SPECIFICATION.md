# Machine Learning Dataset Specification: Device Lifecycle Recommendation

**Document Status**: Authoritative Baseline for Module 2  
**Dataset Name**: `device_lifecycle_synthetic.csv`  
**Dataset Version**: 1.0.0 (Development Synthetic Data)

---

## 1. Problem Definition

The objective of the machine learning subsystem is to predict the **optimal circular lifecycle pathway** for discarded or submitted consumer and institutional electronic devices. 

Instead of routing all electronic equipment uniformly to scrap shredding and material extraction, the model evaluates physical, operational, and category indicators to recommend the highest and best circular use:
* **`KEEP_USING`**: Device is relatively new and functional; user is advised to retain and maintain it.
* **`REPAIR`**: Device has localized, repairable defects with high functional restoration feasibility.
* **`REFURBISH`**: Device has moderate age or wear, suitable for overhaul and component renewal by a certified technician.
* **`REFURBISH_AND_SELL`**: Device possesses commercial secondary market demand where refurbishment cost is safely below resale value.
* **`DONATE`**: Device is working and older, with high educational/community utility but low commercial resale value.
* **`RECYCLE`**: Device has reached true end-of-life, is structurally destroyed, or unrepairable; raw materials should be extracted.

---

## 2. Prediction Point in the Application Lifecycle

In the end-to-end user workflow, the recommendation inference occurs at the **point of device intake** (`POST /api/user/ewaste`):

$$\text{User Completes Intake Wizard} \longrightarrow \text{Spring Boot Receives Request DTO} \longrightarrow \text{Layer 1 Safety Gate Check}$$
$$\text{If Safe} \longrightarrow \text{Layer 2 Python ML Prediction} \longrightarrow \text{Layer 3 Business Policy Filter} \longrightarrow \text{Outcome Presented to User}$$

At this prediction point, the only data available is the citizen's self-reported observations and system timestamps. Downstream information (such as technician diagnostic teardown results, quality audit grades, actual repair invoices, or eventual buyer sale prices) **DOES NOT EXIST** at prediction time.

---

## 3. Safety Gate vs. Machine Learning Responsibility

| Dimension | Layer 1: Deterministic Safety Gate | Layer 2: Machine Learning Intelligence |
|:---|:---|:---|
| **Primary Responsibility** | Environmental, chemical, and fire safety compliance. | Multi-factor optimization of circular economic pathways. |
| **Execution Order** | **First** (Pre-Filter). | **Second** (Invoked only if Layer 1 passes). |
| **Logic Type** | Strict, deterministic boolean rule evaluation. | Probabilistic classification across competing circular outcomes. |
| **Inputs Evaluated** | `battery_swollen`, `battery_leaking`, `overheating_evidence`, `severe_physical_damage`, condition == `HAZARDOUS`. | `category`, `approx_age_years`, `condition`, `user_intention`, `powers_on`, `screen_condition`, `battery_condition`, `damage_severity`. |
| **Output** | Forced terminal action: `SPECIAL_HANDLING`. | Predicted class from 6 circular outcomes (`KEEP_USING`, `REPAIR`, `REFURBISH`, `REFURBISH_AND_SELL`, `DONATE`, `RECYCLE`). |
| **Override Ability** | **Absolute veto**: ML model is never invoked for hazardous items. | Cannot override safety rules. |

---

## 4. Input Feature Taxonomy

### 4.1 Group A: ML Predictive Features (Inference Inputs)

| Feature Name | Type | Allowed Values / Domain | Missing / N/A Representation | Meaning & Semantic Value |
|:---|:---|:---|:---|:---|
| **`category`** | Categorical | 15 values (`MOBILE_PHONE`, `LAPTOP`, `DESKTOP`, `MONITOR`, `TELEVISION`, `PRINTER`, `KEYBOARD`, `MOUSE`, `BATTERY`, `CHARGER`, `CABLE`, `REFRIGERATOR`, `WASHING_MACHINE`, `AIR_CONDITIONER`, `OTHER`) | Mandatory | Equipment classification; dictates hardware capabilities and baseline lifespan. |
| **`approx_age_years`** | Numerical (Continuous) | $0.1 \le \text{age} \le 15.0$ | Clamped to 0.1 if unknown | Physical device age since manufacture or purchase. |
| **`condition`** | Categorical | `WORKING`, `PARTIALLY_WORKING`, `DAMAGED`, `NOT_WORKING` | Mandatory | User-observed operational state. |
| **`user_intention`** | Categorical | `KEEP_USING`, `REPAIR`, `REFURBISH`, `REFURBISH_AND_SELL`, `DONATE`, `RECYCLE`, `UNSURE` | Default: `UNSURE` | Citizen's initial desired outcome. Serves as a prior without dominating prediction. |
| **`powers_on`** | Categorical | `YES`, `NO`, `NOT_APPLICABLE` | Explicit `NOT_APPLICABLE` for non-powered items | Whether device turns on or boots. |
| **`screen_condition`** | Categorical | `INTACT`, `MINOR_SCRATCHES`, `CRACKED`, `DEAD_PIXELS_BLEED`, `SHATTERED_NOT_WORKING`, `NOT_APPLICABLE` | Explicit `NOT_APPLICABLE` for screenless items | Optical and structural state of display. |
| **`battery_condition`** | Categorical | `NORMAL`, `DEGRADED`, `DEAD`, `NOT_APPLICABLE` | Explicit `NOT_APPLICABLE` for battery-less items | Qualitative battery autonomy. |
| **`damage_severity`** | Categorical | `NONE`, `MINOR_COSMETIC`, `MODERATE`, `HEAVY` | Mandatory | Structural wear severity. |

### 4.2 Group B: Safety-Gate Only Fields (Evaluated at Layer 1)

* `battery_swollen` (`bool`): Battery swelling, bulging the chassis.
* `battery_leaking` (`bool`): Liquid, electrolyte, or chemical residue leaking.
* `overheating_evidence` (`bool`): Burn marks, melted casing, or fire evidence.
* `severe_physical_damage` (`bool`): Crushed, snapped in half, or submerged.
* `is_safety_hazard` (`bool`): Consolidated flag triggering `SPECIAL_HANDLING`.

### 4.3 Group C: Future Derived Features (Documented, NOT Citizen-Entered)

The following attributes are valuable economic indicators but **cannot** be answered by an untrained citizen. In future phases, these will be derived programmatically before inference:
1. `repairability_index` ($1.0 - 10.0$): Calculated using brand/model teardown databases.
2. `estimated_resale_ratio` ($0.0 - 1.0$): Depreciation curve mapping model release year against market indices.
3. `estimated_repair_cost_ratio` ($0.0 - 1.0$): Average parts replacement cost relative to category value.

---

## 5. Target Classes & Architecural Decision on `SPECIAL_HANDLING`

### Architectural Decision:
The supervised ML model is trained specifically on the **6 circular lifecycle classes**:
$$\mathcal{Y}_{\text{ML}} = \{\text{KEEP\_USING}, \text{REPAIR}, \text{REFURBISH}, \text{REFURBISH\_AND\_SELL}, \text{DONATE}, \text{RECYCLE}\}$$

### Rationale:
1. **Safety is Deterministic, Not Probabilistic**: Under Indian E-Waste Rules 2022, a leaking lithium battery or scorched appliance is an unequivocal fire and chemical hazard requiring specialized packaging. Routing such items to `SPECIAL_HANDLING` is a mandatory legal constraint.
2. **Preventing Model Trivialization**: If `SPECIAL_HANDLING` were an ML target class, tree-based models would allocate their top splits to `battery_swollen == True \implies \text{SPECIAL\_HANDLING}`, wasting model capacity on an obvious binary rule.
3. **Hybrid Engine Integration**: Layer 1 intercepts 100% of hazardous items. The ML model receives only non-hazardous items and focuses its predictive capacity on resolving non-trivial circular trade-offs.

---

## 6. Missing / Not-Applicable Value Strategy

In consumer electronics, physical capabilities vary drastically across categories:
* Cables and chargers do not have batteries, displays, or complex operating systems.
* Desktops do not have built-in screens or rechargeable batteries.
* Standalone battery packs have batteries, but no screens or keyboards.

### Implementation Rule:
* Rather than leaving cells empty (`NaN`/`null`), inoperable capabilities are encoded as an explicit categorical state: **`NOT_APPLICABLE`**.
* This enables one-hot and ordinal encoders in Module 3 to preserve physical reality without imputing false values (e.g. imputing "cracked screen" on a cable).

---

## 7. User-Intention Handling & Decoupling

A critical requirement is that the model **must not** blindly mimic the user's declared intention:
* A citizen asking to `KEEP_USING` a 10-year-old completely dead television must be advised to `RECYCLE`.
* A citizen asking to `RECYCLE` a 6-month-old working MacBook must be guided towards `REFURBISH_AND_SELL` or `KEEP_USING`.
* A citizen declaring `UNSURE` must receive an objective, optimal recommendation.

### Empirical Decoupling in Dataset:
In the generated 10,000-sample dataset, the match rate between `user_intention` and `recommended_action` is **24.99%**. The user intention acts as an informative prior (+0.35 to +0.50 logit boost) only when the option is technically feasible, reflecting realistic human decision-making.

---

## 8. Data Leakage Prevention

Strict guardrails have been applied to guarantee zero data leakage:
1. **No Downstream Attributes**: The feature schema contains zero fields generated by post-intake actors (no technician notes, no refurbishment job status, no quality control grade, no marketplace listing ID, no selling price).
2. **Deterministic Independence**: The target label is derived strictly from initial hardware status, age degradation curves, and category capabilities.

---

## 9. Dataset Limitations & Future Real-World Strategy

### 9.1 Current Limitations
* **Synthetic Provenance**: Records are algorithmically generated development samples. Latent variables (component availability, localized repair shop density) are modeled probabilistically rather than observed empirically.
* **Geographical Baseline**: Economic viability scoring assumes Indian urban secondary electronics demand (high demand for refurbished mobile phones and laptops).

### 9.2 Strategy for Real-World Data Transition
Once operational, the platform will collect real-world labelled data through closed-loop operational milestones:
1. **Intake Feature Snapshot**: On device submission, immutable feature vectors are stored.
2. **Technician Ground-Truth Capture**: When a certified refurbisher inspects the device (Module 9 & 15), the technician records the actual verdict (`Restored and Listed`, `Donated to School`, `Dismantled for Scrap`).
3. **Continuous Retraining**: Real technician-verified outcomes will be stored in a dedicated training table, gradually replacing synthetic records in future retraining iterations.

---

## 10. Versioning & Reproducibility

* **Generator Script**: `ml-service/src/generate_dataset.py`
* **Default Seed**: `42`
* **Command to Reproduce**:
  ```bash
  python src/generate_dataset.py --samples 10000 --seed 42
  ```
* **Validation Command**:
  ```bash
  python src/validate_dataset.py
  ```
