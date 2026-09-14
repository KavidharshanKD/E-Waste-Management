# Module 1: Device Assessment & User Intention Data Contract

This document establishes the authoritative data contract for device intake and assessment established in **Module 1**. 
This contract serves as the baseline for **Module 2 (ML Dataset Design & Schema Specification)**.

---

## 1. Data Contract Specification

| Field Name | Data Type | Database Column | Required / Optional | Who Provides It | Semantic Meaning | Future ML Feature Role |
|:---|:---|:---|:---|:---|:---|:---|
| **`category`** | `EWasteCategory` (Enum) | `ewaste_items.category` | **Required** | Citizen / Institution | High-level equipment classification (e.g. `LAPTOP`, `MOBILE_PHONE`, `BATTERY`, `MONITOR`). | **Core Input Feature 1** (Categorical, 15 classes) |
| **`approxAgeYears`** | `Integer` | `ewaste_items.approx_age_years` | Optional (defaults to 0) | Citizen / Institution | Approximate operating age in years since purchase/manufacture. | **Core Input Feature 2** (Numerical continuous, $0.0 \le \text{age} \le 15.0$) |
| **`condition`** | `DeviceCondition` (Enum) | `ewaste_items.condition` | **Required** | Citizen / Institution | User-perceived operational health (`WORKING`, `PARTIALLY_WORKING`, `DAMAGED`, `NOT_WORKING`, `HAZARDOUS`). | **Core Input Feature 3** (Categorical, 5 classes) |
| **`userIntention`** | `UserIntention` (Enum) | `disposal_requests.user_intention`, `ewaste_items.user_intention` | Optional (default: `UNSURE`) | Citizen / Institution | Desired outcome declared by the user (`KEEP_USING`, `REPAIR`, `REFURBISH`, `REFURBISH_AND_SELL`, `DONATE`, `RECYCLE`, `UNSURE`). | **Core Input Feature 4** (Categorical prior, 7 classes) |
| **`powersOn`** | `Boolean` | `ewaste_items.powers_on` | Optional (Category-aware: for powered electronics) | Citizen / Institution | Whether device boots up / shows signs of life when powered (`true`/`false`/`null`). | **Core Input Feature 5** (Binary flag) |
| **`screenCondition`** | `String` (Enum string) | `ewaste_items.screen_condition` | Optional (Category-aware: for screen-bearing devices) | Citizen / Institution | Physical and visual state of display (`INTACT`, `MINOR_SCRATCHES`, `CRACKED`, `DEAD_PIXELS_BLEED`, `SHATTERED_NOT_WORKING`). | **Core Input Feature 6** (Categorical, 5 classes) |
| **`batteryCondition`** | `String` | `ewaste_items.battery_condition` | Optional (Category-aware: for battery-bearing devices) | Citizen / Institution | User notes on battery autonomy (e.g., "Normal", "Degraded < 1 hr", "Dead"). | **Core Input Feature 7** (Text/Categorical mapped) |
| **`damageCondition`** | `String` | `ewaste_items.damage_condition` | Optional | Citizen / Institution | Cosmetic wear descriptor (e.g., "None", "Scratches", "Broken hinge"). | **Core Input Feature 8** (Categorical mapped) |
| **`batterySwollen`** | `Boolean` | `ewaste_items.battery_swollen` | Optional (default: `false`) | Citizen / Institution | **Hard Safety Flag**: Visibly swollen or bloated battery bulging chassis. | **Deterministic Safety Gate** (Forces `SPECIAL_HANDLING`) |
| **`batteryLeaking`** | `Boolean` | `ewaste_items.battery_leaking` | Optional (default: `false`) | Citizen / Institution | **Hard Safety Flag**: Battery leaking electrolyte, residue, or acid. | **Deterministic Safety Gate** (Forces `SPECIAL_HANDLING`) |
| **`overheatingEvidence`** | `Boolean` | `ewaste_items.overheating_evidence` | Optional (default: `false`) | Citizen / Institution | **Hard Safety Flag**: Evidence of scorch marks, melted plastic, or burning. | **Deterministic Safety Gate** (Forces `SPECIAL_HANDLING`) |
| **`severePhysicalDamage`** | `Boolean` | `ewaste_items.severe_physical_damage` | Optional (default: `false`) | Citizen / Institution | **Hard Safety Flag**: Crushed, sheared in half, or water-submerged. | **Deterministic Safety Gate** (Forces `SPECIAL_HANDLING`) |
| **`functionalIssues`** | `String` | `ewaste_items.functional_issues` | Optional | Citizen / Institution | User notes describing specific component failures (keys, camera, ports). | **Auxiliary Text Feature / Technician Note** |
| **`deviceName`** | `String` | `ewaste_items.device_name` | **Required** | Citizen / Institution | Model name (e.g., "ThinkPad T14", "iPhone 12"). | Metadata (Brand/Model value lookup in Module 3) |
| **`brand`** | `String` | `ewaste_items.brand` | **Required** | Citizen / Institution | Manufacturer name (e.g., "Lenovo", "Apple", "Dell"). | Metadata (Brand tier encoding in Module 3) |
| **`quantity`** | `Integer` | `ewaste_items.quantity` | **Required** (default: 1) | Citizen / Institution | Number of identical units. | Multiplier for logistics / batching |

---

## 2. Technical Fields Explicitly Excluded from Citizen Intake

As specified by project design principles, ordinary citizens and institutional administrators **cannot** be asked for technical metrics they cannot realistically know. The following fields will be generated or entered in later modules:

1. **`repairabilityIndex`**: Computed algorithmically based on category, brand, and damage profile (Modules 3–4).
2. **`estimatedRepairCost`**: Estimated by diagnostic models or entered by certified refurbishers in Module 15.
3. **`estimatedResaleValue`**: Calculated via dynamic depreciation curves in Module 3 / Module 10.
4. **`refurbishmentGrade`**: Assigned exclusively by a qualified technician after inspection (Module 9).
5. **`mlConfidence`**: Output score produced by the Python inference engine (Module 5).

---

## 3. Backward Compatibility Mapping

For legacy submissions and bulk requests where new fields are absent:
* `userIntention` defaults to `UserIntention.UNSURE`.
* `batterySwollen`, `batteryLeaking`, `overheatingEvidence`, `severePhysicalDamage` default to `false`.
* `powersOn`, `screenCondition`, and `functionalIssues` remain safely `null`.
* Existing business logic and recommendation processing proceed normally without regression.
