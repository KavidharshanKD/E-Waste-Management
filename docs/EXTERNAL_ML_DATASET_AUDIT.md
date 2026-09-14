# Phase 2.5: External Real Dataset Audit & Integration Design

**Audit Date:** September 2026  
**Status:** Completed Audit & Architectural Evaluation (Phase 2.5)  
**Target Next Phase:** Module 3 (Feature Engineering, Calibration & Model Training)

---

## 1. Dataset Inventory

Two real-world datasets were acquired and placed into the local directory `ml-service/data/external/`. The directory is explicitly ignored by `.gitignore` and excluded from Git tracking.

| Dataset Identifier | Archive Filename | Archive Size | Extracted Files & Formats |
| :--- | :--- | :--- | :--- |
| **Open Repair Alliance** | `OpenRepairData_v0.3_aggregate_202507.zip` | ~16.5 MB (compressed) | 1. `202507/aggregate/OpenRepairData_v0.3_aggregate_202507.csv` (58.5 MB, CSV)<br>2. `202507/aggregate/tableschema.json` (9.9 KB, JSON schema)<br>3. `202507/aggregate/OpenRepairData_v0.3_Product_Categories.csv` (725 B, CSV)<br>4. `202507/aggregate/OpenRepairData_v0.3_unpowered_202507.csv` (8.1 KB, CSV) |
| **TU Delft Consumer Survey** | `Consumer survey product lifetimes and durability of electronics.zip` | ~104 KB (compressed) | 1. `Consumer survey product lifetimes and durability of electronics/lt-platform-reports-export-10-26-2022-clean3-UPTOALL.json` (704 KB, JSON) |

---

## 2. Dataset Provenance & Collection Methodology

### Open Repair Alliance (ORA)
- **Publishing Entity:** Open Repair Alliance (co-founded by The Restart Project, Anstiftung, iFixit, Repair Café International, and Make Repair Normal).
- **Data Source:** Community repair events (Repair Cafés, Restart Parties, Fixit Clinics) across the UK, Netherlands, Germany, Belgium, France, the US, and internationally.
- **Collection Nature:** Physical repair attempts documented by volunteer community technicians when consumers bring malfunctioning appliances and consumer electronics to a community repair event.
- **Inherent Sampling Bias:**
  - **100% Defective Intake:** Consumers do not bring functioning or like-new devices to a repair café.
  - **No Commercial Resale or Donating Context:** The intake motive is universally "I want this fixed so I can keep using it" or "can this be saved from the bin?".
  - **Appliance & Gadget Distribution:** High representation of small domestic electrical appliances (vacuum cleaners, lamps, power tools, radios, coffee makers) alongside consumer IT (laptops, phones, printers).

### TU Delft Consumer Survey (Product Lifetimes & Durability)
- **Publishing Entity:** Delft University of Technology (TU Delft), Faculty of Industrial Design Engineering.
- **Data Source:** Longitudinal consumer survey on consumer product lifetimes, replacement triggers, and post-use disposition across global participants (predominantly US, Europe, India, Brazil).
- **Collection Nature:** Consumer self-reported retrospective surveys on personal computing and consumer electronics (laptops, desktop PCs, smartphones, printers, TVs, monitors, cameras).
- **Inherent Sampling Bias:**
  - **Post-Retirement Retrospective:** Captures why consumers stopped using their device (failure, obsolescence, upgrade) and what they did with it (stored in closet, sold, given away, recycled).
  - **Self-Reported Estimates:** Lifetimes and conditions are user-perceived rather than technician-diagnosed.

---

## 3. Dataset Sizes & Record Counts

| Metric | Open Repair Alliance | TU Delft Consumer Survey |
| :--- | :--- | :--- |
| **Total Rows / Records** | **305,649** repair records | **1,037** consumer device lifecycles |
| **Total Features / Fields** | **14** columns | **22** core fields (+ 2 audit tags) |
| **Valid Age / Lifetime Rows**| **102,112** rows (33.41% non-null) | **1,037** rows (100% non-null) |
| **Relevant IT / Electronics Rows**| ~35,000 rows (Laptops, Mobiles, Desktops, Printers, Displays) | **1,037** rows (100% relevant electronics) |

---

## 4. Actual Schemas & Field Inspections

### A. Open Repair Alliance (`OpenRepairData_v0.3_aggregate_202507.csv`)

| Column Name | Data Type | Null % | Example Values | Meaning / Semantics |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | 0.00% | `ORD_202507_000001` | Unique event record identifier |
| `data_provider` | `string` | 0.00% | `The Restart Project`, `Repair Cafe` | Source organization |
| `country` | `string` | 0.00% | `GBR`, `DEU`, `NLD`, `USA` | ISO 3-letter country code |
| `partner_product_category` | `string` | 0.00% | `Laptop`, `Power tool` | Partner native category label |
| `product_category` | `string` | 0.00% | `Laptop`, `Mobile`, `Vacuum` | Harmonized ORA category standard |
| `product_category_id` | `string` | 0.00% | `cat_0041` | Normalized category ID |
| `brand` | `string` | 0.00% | `Apple`, `Dell`, `HP`, `Philips` | Device manufacturer |
| `year_of_manufacture` | `float64` | 66.58% | `2015.0`, `2018.0` | Inferred or labeled manufacture year |
| `product_age` | `float64` | 66.59% | `5.0`, `8.0`, `12.0` | Age in years at repair attempt |
| `repair_status` | `string` | 0.00% | `Fixed`, `End of life`, `Repairable` | Technician-assessed outcome |
| `repair_barrier_if_end_of_life` | `string` | 90.21% | `Spare parts not available` | Root cause if classified as end of life |
| `group_identifier` | `string` | 0.00% | `group_102` | Local repair group identifier |
| `event_date` | `string` | 0.00% | `2024-03-15` | Date of the repair event |
| `problem` | `string` | 23.48% | `Won't turn on`, `Broken hinge` | Free-text defect description |

### B. TU Delft Consumer Survey (`lt-platform-reports-export-*.json`)

| Field Name | Type | Null % | Distinct / Values | Meaning / Semantics |
| :--- | :--- | :--- | :--- | :--- |
| `_product_code` | `string` | 0.00% | `0303`, `0302`, `0306`, `0304`, etc. | Product category ID (0303=Laptop, 0302=Desktop, 0306=Phone) |
| `ID_survey` / `ID_worker` | `string` | 0.00% | Unique UUIDs | Survey metadata & respondent ID |
| `LT` | `float` | 0.00% | Range: 0.0 – 31.5 yrs (Median: 5.33) | Total product lifetime (acquisition to disposal) |
| `LS` | `float` | 0.00% | Numerical lifespan | Active service lifetime (years) |
| `niu_months` | `float` | 0.00% | Range: 0 – 120+ mos (Median: 8.0) | "Not In Use" hibernation months before disposal |
| `LTphase` | `string` | 0.00% | `LTniu` (392), `LT0` (330), `LT1` (214) | Current phase of product lifecycle |
| `fail_rep` | `string` | 0.00% | `failed` (614), `const` (422), `repair` (1) | Retirement cause: Hardware failure vs constant/functional |
| `in_condition` | `int/code`| 0.00% | `1` (879), `3` (78), `2` (63), `4` (12), `5` (5)| Condition when acquired (1=New, 2=Refurb, 3=Used) |
| `out_condition` | `int/code`| 0.00% | `2` (454), `4` (328), `3` (234), `1` (21) | Condition at retirement (1=Like new, 2=Good, 3=Fair, 4=Broken)|
| `out_inpossession` | `bool` | 0.00% | `False` (645), `True` (392) | Whether device is still retained in storage by owner |
| `out_inuse` | `bool` | 0.00% | `False` (1037) | Whether device is still in active primary use (all False) |
| `out_method` | `string` | 0.00% | `""` (392), `2` (219), `4` (172), `1` (136)... | Disposition: 1=Sold, 2=Donated/gifted, 3=Trade-in, 4=Recycled |
| `chng_user` | `string` | 0.00% | `No` (510), `NA` (423), `Yes` (104) | Whether ownership changed during device lifetime |
| `brand` / `model` | `string` | 0.00% | HP, Dell, Apple, Samsung | Manufacturer and model name |
| `price_range` | `string` | 0.00% | `2` (553), `1` (281), `3` (203) | Initial purchase price tier (Budget, Mid, Premium) |

---

## 5. Comparison With Module 2 Feature Schema

Our application's 8 predictive features:
1. `category` (EWasteCategory)
2. `approx_age_years` (float)
3. `condition` (DeviceCondition)
4. `user_intention` (UserIntention)
5. `powers_on` (boolean)
6. `screen_condition` (ScreenCondition)
7. `battery_condition` (BatteryCondition)
8. `damage_severity` (DamageSeverity)

### Mapping Matrix

| External Dataset | External Column | Meaning | Our Module 2 Feature | Mapping Quality | Transformation Required | Safe for ML Input? | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Open Repair** | `product_category` | Harmonized category | `category` | **EXACT** | Map string to `EWasteCategory` enum | **SAFE_INPUT** | Filter to IT/electronics subsets (Laptop, Mobile, Desktop, Printer, etc.). |
| **Open Repair** | `product_age` | Device age at repair | `approx_age_years` | **EXACT** | Direct float (filter >0, cap at 20) | **SAFE_INPUT** | Present in 102,112 rows; empirical ground truth for aging. |
| **Open Repair** | `problem` | Free-text symptoms | `powers_on` | **WEAK_PROXY** | NLP keyword extraction ("won't turn on", "dead", "kein strom") | **POTENTIAL_LEAKAGE / UNUSABLE** | Highly noisy, multi-lingual, often mixes symptom with post-repair diagnosis. |
| **Open Repair** | `repair_status` | Repair outcome | *(Target Label)* | **STRONG_PROXY** | Map `Fixed` / `Repairable` to `REPAIR`, `End of life` to `RECYCLE` | **TARGET_ONLY** | Ground truth for binary repairability. Must NEVER be an input feature. |
| **Open Repair** | `repair_barrier_*` | Why item failed repair | *(Diagnostics)* | **NO_MAPPING** | None | **POTENTIAL_LEAKAGE** | Post-repair technician verdict; directly leaks failure to repair. |
| **TU Delft** | `_product_code` | Product category code | `category` | **EXACT** | Lookup dictionary to `EWasteCategory` | **SAFE_INPUT** | Laptops (292), Desktops (236), Phones (174), Printers (154), Displays (99). |
| **TU Delft** | `LT` | Lifetime in years | `approx_age_years` | **STRONG_PROXY** | Direct float conversion | **SAFE_INPUT** | 100% populated, median 5.33 yrs for consumer electronics. |
| **TU Delft** | `out_condition` | State at retirement | `condition` | **STRONG_PROXY** | Code 1→`LIKE_NEW`, 2→`GOOD`, 3→`FAIR`, 4→`POOR`/`FOR_PARTS` | **SAFE_INPUT** | Clean consumer condition distribution. |
| **TU Delft** | `fail_rep` | Functional vs Failed | `powers_on` | **WEAK_PROXY** | `const` (constant/working)→True, `failed`→False/Unknown | **SAFE_INPUT (with caution)** | `failed` can mean broken hinge/screen, not necessarily dead motherboard. |
| **TU Delft** | `out_method` | Disposal / Disposition | *(Target Label)* | **STRONG_PROXY** | 1→`REFURBISH_AND_SELL`, 2→`DONATE`, 4→`RECYCLE` | **TARGET_ONLY** | Empirical consumer disposal behavior. |
| **Both Datasets** | *(None)* | Intention | `user_intention` | **NO_MAPPING** | **MISSING** | **N/A** | Neither dataset collects consumer intake intention. |
| **Both Datasets** | *(None)* | Subsystem conditions| `screen_condition`, `battery_condition`, `damage_severity` | **NO_MAPPING** | **MISSING** | **N/A** | Not captured as structured discrete columns. |

---

## 6. Target-Label Audit & Confidence

Our application evaluates 6 target recommendations (plus Layer 1 Safety Gate for `SPECIAL_HANDLING`):

```
                                  [ Device Intake ]
                                          │
                         ┌────────────────┴────────────────┐
                  (Safety Hazard?)                         │ (Safe)
                         │                                 ▼
                         ▼                       [ Predictive Model ]
                 SPECIAL_HANDLING                          │
         (Deterministic Layer 1 Gate)                      ├─► KEEP_USING
                                                           ├─► REPAIR
                                                           ├─► REFURBISH
                                                           ├─► REFURBISH_AND_SELL
                                                           ├─► DONATE
                                                           └─► RECYCLE
```

### Outcome Mapping Table & Confidence Assessment

| Target Decision | Open Repair Alliance Evidence | TU Delft Survey Evidence | Combined Real-Data Support | Confidence Level | Ground Truth Viability |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REPAIR** | `Fixed` (54.0%) + `Repairable` (17.7%) = **71.7%** of records | `fail_rep == 'repair'` (1 record, 0.1%) | **STRONG** (Open Repair provides >219,000 real repair records) | **HIGH** | Open Repair is the gold standard for empirical repairability vs end-of-life. |
| **RECYCLE** | `End of life` = **25.4%** (77,698 records) where repair was impossible | `out_method == 4` (Recycled, 172 records) + `out_method == 5` (Trash, 17 records) | **STRONG** (Open Repair + TU Delft) | **HIGH** | Directly reflects real physical irrecoverability or formal recycling disposition. |
| **KEEP_USING** | **UNSUPPORTED** (Consumers never bring fully working, actively kept items to repair cafés) | `fail_rep == 'const'` & `out_inpossession == True` (Device still works, kept by owner) | **MODERATE** (TU Delft only: ~150-200 records) | **MEDIUM** | Real consumers hold onto older working electronics; TU Delft captures hibernation/extended life. |
| **DONATE** | **UNSUPPORTED** (No donation outcomes in repair café logs) | `out_method == 2` (Given away / donated to friend, school, or charity: **219 records**) | **MODERATE** (TU Delft only) | **MEDIUM** | Empirical behavior for working/fair devices passed to secondary users. |
| **REFURBISH_AND_SELL** | **UNSUPPORTED** (Community repair volunteers do not operate commercial resale markets) | `out_method == 1` (Sold by owner: **136 records**) | **WEAK** (TU Delft captures peer sale, but not formal refurbishment) | **LOW** | Real-world consumer sale exists, but commercial refurbishment pipeline requires synthetic/domain logic. |
| **REFURBISH** | **UNSUPPORTED** (No distinct triage between minor DIY fix and formal parts refurbishment) | **UNSUPPORTED** | **NO REAL DATA** | **UNSUPPORTED** | Real datasets do not distinguish "minor community repair" from "commercial component refurbishment". |

---

## 7. What Real Data Can and Cannot Teach

### What Real Data CAN Teach:
1. **Accurate Empirical Lifespan & Age Baselines:**  
   Across 102,112 real Open Repair items and 1,037 TU Delft devices, we have real-world distributions of when electronics fail. Laptops fail at a median of 6–8 years; smartphones at 3–4 years; audio devices survive 10–15 years. This prevents synthetic data from generating unrealistic 25-year-old operational iPhones or 1-year-old obsolete desktops.
2. **True Physical Repair Feasibility (`REPAIR` vs `RECYCLE`):**  
   Open Repair provides over 300,000 real-world attempts showing that ~71.7% of broken consumer items brought in are fixable, while ~25.4% hit end-of-life barriers (lack of spare parts, inaccessible adhesive assemblies, cost prohibitive).
3. **Consumer Disposition Pathways:**  
   TU Delft proves that when a device reaches retirement, consumers:
   - Stockpile in a drawer/closet (`out_inpossession == True`): **37.8%**
   - Give away / Donate (`out_method == 2`): **21.1%**
   - Recycle (`out_method == 4`): **16.6%**
   - Sell (`out_method == 1`): **13.1%**
   - Trade-in (`out_method == 3`): **6.8%**

### What Real Data CANNOT Teach:
1. **Intention-Driven Optimization:**  
   Neither dataset records what the user *intended* to do before receiving advice. In real life, an owner might have a working phone they intend to discard simply because of battery wear, whereas our application wants to guide them towards refurbishment or donation.
2. **Subsystem Health Nuance (Screen, Battery, Liquid Damage):**  
   Neither dataset breaks down health into structured sub-attributes (`screen_condition`, `battery_condition`, `damage_severity`).
3. **Commercial Marketplace Decisions (`REFURBISH_AND_SELL` vs `REFURBISH`):**  
   Neither community repair events nor general consumer surveys track secondary market profit margins or refurbished listing viability.

---

## 8. Feature Availability & Missingness Analysis

| Application Feature | Open Repair Status | TU Delft Status | Strategy for Integration |
| :--- | :--- | :--- | :--- |
| `category` | Available (Harmonized strings) | Available (Numeric product codes) | Direct mapping to `EWasteCategory` |
| `approx_age_years` | Available (102,112 rows, 66.6% null) | Available (100% complete, median 5.33) | Use for empirical age distribution calibration |
| `condition` | Missing (all intake is "Broken") | Available (Codes 1–4, 100% complete) | TU Delft maps directly; Open Repair represents `POOR`/`FOR_PARTS` |
| `user_intention` | **MISSING** | **MISSING** | **Must NOT be fabricated on real rows**. Handled via Post-Model Policy / Architecture (Section 9) |
| `powers_on` | Weak proxy in free-text `problem` | Weak proxy in `fail_rep` | Derive carefully or calibrate probability distribution |
| `screen_condition` | **MISSING** (No structured column) | **MISSING** | Derived via domain conditional probability |
| `battery_condition`| **MISSING** (Mentioned in ~4% text) | **MISSING** | Derived via domain conditional probability |
| `damage_severity` | **MISSING** | **MISSING** | Derived via domain conditional probability |

---

## 9. Strategy for User Intention

`user_intention` is a core Module 1 intake feature in our application (`REPAIR`, `DONATE`, `SELL`, `RECYCLE`, `REFURBISH`, `DISCARD`, `UNCERTAIN`). However, zero real records in either external dataset contain this attribute.

### Evaluation of Candidate Strategies:

- **Strategy A: Train ML model without `user_intention`, apply Intention as a Post-Model Policy Layer (RECOMMENDED)**  
  - *Mechanism:* The core Machine Learning classifier evaluates the physical state of the device (`category`, `approx_age_years`, `condition`, `powers_on`, `screen_condition`, `battery_condition`, `damage_severity`) to output the **Physical Feasibility Probabilities**: $P(\text{REPAIR})$, $P(\text{REFURBISH})$, $P(\text{DONATE})$, $P(\text{RECYCLE})$, $P(\text{KEEP\_USING})$.  
  - Then, a transparent, deterministic **Intention Policy Engine** reconciles the user's personal preference with the physical viability:
    - If user wants `SELL`, but the device does not power on and screen is shattered $\rightarrow$ Model flags physical infeasibility for direct sale $\rightarrow$ Recommends `REPAIR` or `RECYCLE`.
    - If user wants `DISCARD`, but device is in `GOOD` condition and 2 years old $\rightarrow$ Policy intercepts and elevates `REFURBISH_AND_SELL` or `DONATE` with an educational nudge.
  - *Advantage:* Keeps ML predictions grounded in objective physical reality without synthetic bias or circular feedback loops.

- **Strategy B: Synthetically augment intention into real rows during training**  
  - *Flaw:* Arbitrarily assigning intentions to historical repair café records contaminates real data with synthetic assumptions.

- **Recommendation:** **Strategy A**. The ML model acts as the **Physical Viability Classifier**, while user intention acts as the **Preference Context & Policy Layer**.

---

## 10. Data Leakage & Feature Usability Classification

To prevent data leakage during training, all external fields are categorized:

| External Column | Dataset | Classification | Rationale |
| :--- | :--- | :--- | :--- |
| `product_category` | Open Repair | **SAFE_INPUT** | Known at device intake. |
| `product_age` | Open Repair | **SAFE_INPUT** | Known/estimated at intake. |
| `_product_code` / `category` | TU Delft | **SAFE_INPUT** | Known at intake. |
| `LT` (Lifetime) | TU Delft | **SAFE_INPUT** | Device age at retirement. |
| `in_condition` | TU Delft | **SAFE_INPUT** | Historical device baseline. |
| `out_condition` | TU Delft | **SAFE_INPUT** | Condition at assessment. |
| `repair_status` | Open Repair | **TARGET_ONLY** | Outcome label; must never be fed as feature. |
| `out_method` | TU Delft | **TARGET_ONLY** | Disposition outcome label. |
| `repair_barrier_if_end_of_life` | Open Repair | **POTENTIAL_LEAKAGE** | Determined by technician *after* repair fails. Leaks outcome 100%. |
| `problem` | Open Repair | **POTENTIAL_LEAKAGE** | Often contains post-repair notes ("replaced fuse and working"). Free-text leakage. |
| `fail_rep` | TU Delft | **POTENTIAL_LEAKAGE** | Directly informs whether device failed or stayed constant. |
| `id`, `event_date`, `group_identifier` | Open Repair | **METADATA_ONLY** | Administrative IDs with no physical generalizability. |
| `ID_survey`, `ID_worker`, `report_date`| TU Delft | **METADATA_ONLY** | Survey mechanics; unusable for prediction. |
| `country`, `data_provider` | Open Repair | **METADATA_ONLY** | Geographic metadata; could introduce regional bias if included. |

---

## 11. Data Quality Findings

1. **Missingness in Key Numerical Fields:**  
   - Open Repair `product_age` is 66.59% null (only 102,112 of 305,649 rows report age). However, 102,112 rows is still a massive empirical sample.
2. **Extreme Outliers in Age:**  
   - Open Repair `product_age` has max values up to 174 years (e.g., antique sewing machines, clocks). IT devices must be strictly filtered to realistic electronics lifespans (0 to 20 years).
   - TU Delft `LS` contains negative values (e.g., -2022.08) caused by survey subtraction bugs when respondents entered full calendar years instead of duration. `LT` is clean and must be used instead of `LS`.
3. **Multi-lingual Free-Text Complexity:**  
   - `problem` in Open Repair contains German (*"Stab dreht durch"*), Dutch (*"Snoer defect bij stekker"*), French, and English text, often mixed with repair notes.
4. **Class Imbalance:**  
   - Open Repair is heavily biased towards fixable domestic electricals (lamps, vacuum cleaners). Laptops and phones represent ~5.7% (~17,500 records).
   - TU Delft is 100% electronics (1,037 rows), but has small samples for tablets (2) and TVs (7).

---

## 12. Category Mapping to Java `EWasteCategory`

| External Category (Raw) | Source Dataset | Mapped `EWasteCategory` | Mapping Quality | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `Laptop` | Open Repair | `LAPTOP` | **EXACT** | 12,323 records |
| `Mobile` | Open Repair | `SMARTPHONE` | **EXACT** | 5,200 records |
| `Desktop computer` | Open Repair | `DESKTOP` | **EXACT** | 1,840 records |
| `Printer/scanner` | Open Repair | `PRINTER` | **EXACT** | 5,618 records |
| `Flat screen` / `TV and gaming` | Open Repair | `TELEVISION` / `MONITOR` | **STRONG_PROXY** | Requires separating displays from consoles |
| `Hi-Fi separates` / `Portable radio` | Open Repair | `AUDIO_DEVICE` | **STRONG_PROXY** | 32,100 records |
| `0303` | TU Delft | `LAPTOP` | **EXACT** | 292 records |
| `0302` | TU Delft | `DESKTOP` | **EXACT** | 236 records |
| `0306` | TU Delft | `SMARTPHONE` | **EXACT** | 174 records |
| `0304` | TU Delft | `PRINTER` | **EXACT** | 154 records |
| `0408` | TU Delft | `MONITOR` | **EXACT** | 93 records |
| `0406` / `0404` | TU Delft | `OTHER` | **STRONG_PROXY** | Digital cameras & camcorders |
| `0407` | TU Delft | `TELEVISION` | **EXACT** | 7 records |
| `0308` | TU Delft | `TABLET` | **EXACT** | 2 records |
| `Power tool`, `Kettle`, `Sewing machine` | Open Repair | **UNMAPPED** | **EXCLUDED** | Non-electronic domestic appliances excluded from model. |

---

## 13. Provenance & Real-vs-Synthetic Tracking

To maintain scientific integrity and auditability, no dataset row should ever be ambiguously labeled:

1. **`REAL_OPEN_REPAIR`**: Pure empirical data extracted from Open Repair Alliance (used for physical repairability baselines).
2. **`REAL_TU_DELFT`**: Pure empirical consumer survey data from TU Delft (used for lifespan, retirement conditions, and disposal channel distributions).
3. **`CALIBRATED_SYNTHETIC`**: Synthetic records generated by our Module 2 generator where age curves, failure rates, and category proportions have been mathematically calibrated to match Open Repair and TU Delft empirical distributions.
4. **`SYNTHETIC_DEVELOPMENT`**: Current baseline Module 2 synthetic dataset (retained for backward compatibility and benchmarking).

---

## 14. License & Attribution Findings

| Dataset | Organization / Publisher | Stated / Known License | Commercial & Redistribution Restrictions | Safe for Git Tracking? |
| :--- | :--- | :--- | :--- | :--- |
| **Open Repair Alliance** | Open Repair Alliance | Open Data Commons Open Database License (**ODbL**) or **CC BY-SA 4.0** | Requires explicit attribution: *"Open Repair Data (Open Repair Alliance)"*. Database derivative share-alike rules apply. | **NO**. Raw files are ~58 MB; must remain ignored in `.gitignore` and hosted on external data storage. |
| **TU Delft Consumer Survey** | TU Delft (IDE Faculty) / 4TU.ResearchData | **CC BY 4.0** (Creative Commons Attribution) | Academic open-access survey data. Requires citation of TU Delft research team. | **NO**. Keep in `ml-service/data/external/` ignored by Git to adhere to clean repository standards. |

---

## 15. Integration Architecture Evaluation & Recommendation

We evaluated five candidate integration strategies:

- **Option A: Train only on current synthetic data**  
  *Pros:* Simple, full feature compatibility.  
  *Cons:* Lacks real-world grounding; models fail on edge cases and unrealistic synthetic distributions.
- **Option B: Directly merge real + synthetic rows into a single table**  
  *Pros:* Maximizes row count.  
  *Cons:* Highly problematic. Imputing 5 missing features onto Open Repair rows creates pseudo-synthetic rows that defeat the purpose of real data.
- **Option C: Use real data to CALIBRATE the synthetic generator distributions**  
  *Pros:* Informs realistic Weibull/log-normal age curves, true empirical category repair rates, and disposal likelihoods. Eliminates arbitrary manual synthetic rules.
- **Option D: Train sub-models on real data and use synthetic augmentation for missing classes**  
  *Pros:* Maximizes empirical accuracy where real data is strongest (`REPAIR` vs `RECYCLE`).
- **Option E: Hierarchical Model Pipeline (RECOMMENDED ARCHITECTURE)**

### The Recommended Architecture: Calibrated Hierarchical Decision Pipeline

```
                              [ Intake Input Features ]
                                         │
                   ┌─────────────────────┴─────────────────────┐
             (Safety Check)                                    │
                   │                                           ▼
                   ▼                             [ Level 1: Feasibility Classifier ]
           SPECIAL_HANDLING                        (Trained on Real ORA + TU Delft)
     (Deterministic Rule Gate)                                 │
                                                ┌──────────────┴──────────────┐
                                                ▼                             ▼
                                        Physical REPAIR               Physical RECYCLE
                                      (Candidate: REPAIR)           (Candidate: RECYCLE)
                                                │                             ▲
                                                ▼                             │
                                  [ Level 2: Circular Value ]                 │
                                  (Calibrated Synthetic Data)                 │
                                                │                             │
                                  ┌─────────────┼─────────────┐               │
                                  ▼             ▼             ▼               │
                              KEEP_USING    REFURBISH      DONATE             │
                                                │                             │
                                                ▼                             │
                                        REFURBISH_AND_SELL ───────────────────┘
                                                │                     (If cost > value)
                                                ▼
                                    [ User Intention Policy ]
                                    (Harmonize with Intention)
                                                │
                                                ▼
                                     [ Final Recommendation ]
```

1. **Level 1 (Physical Feasibility Classifier):** Trained on empirical real data (`REAL_OPEN_REPAIR` + `REAL_TU_DELFT`) to predict the core physical outcome: is the device repairable/reusable or is it physically end-of-life (`REPAIR` vs `RECYCLE`)?
2. **Level 2 (Circular Marketplace Classifier):** For physically viable devices, evaluate circular economic pathways (`KEEP_USING`, `REFURBISH`, `REFURBISH_AND_SELL`, `DONATE`) using the calibrated synthetic dataset.
3. **Level 3 (Intention Policy Layer):** Reconcile user intention with physical & economic feasibility.

---

## 16. Target Class Real-World Support Summary

- **Strong Real-World Evidence:**
  - `REPAIR` (Supported by >219,000 Open Repair records)
  - `RECYCLE` (Supported by >77,000 Open Repair records and TU Delft disposal logs)
- **Moderate Real-World Evidence:**
  - `KEEP_USING` (Supported by TU Delft records of working devices retained in possession)
  - `DONATE` (Supported by TU Delft records of devices given away to friends/charity)
- **Requires Calibrated Synthetic / Domain Logic:**
  - `REFURBISH_AND_SELL` (No commercial resale margins or refurbishment certification in community repair data)
  - `REFURBISH` (Community repair does not differentiate DIY component repair from industrial refurbishment)
  - `SPECIAL_HANDLING` (Handled cleanly by deterministic Layer 1 safety gate)

---

## 17. Recommended Action Plan for Module 3

When the user approves progression to Module 3:
1. **Calibrate Module 2 Synthetic Generator:** Update age and failure probability distributions in `generate_dataset.py` using empirical parameters derived from Open Repair (median repair age: 6.8 yrs for laptops, 3.8 yrs for phones) and TU Delft (disposal proportions).
2. **Feature Engineering Pipeline:** Build scikit-learn transformers that handle physical features, condition enums, and numerical age scaling.
3. **Hierarchical / Ensemble Model:** Implement Level 1 Repairability model + Level 2 Circular Value model.
4. **Intention Policy Layer:** Connect model output probabilities with user intention rules to produce final actionable advice.
5. **No External Raw Data in Git:** Maintain all external data under `ml-service/data/external/` with automated preprocessing scripts.

---
*Audit completed without modifying existing application logic, database schemas, or Git staging.*
