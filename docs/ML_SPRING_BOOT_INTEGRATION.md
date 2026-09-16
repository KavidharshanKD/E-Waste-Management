# Module 6: Spring Boot ML Integration, Hybrid Recommendation Orchestration & Audit Persistence

## 1. Executive Summary & Architecture Overview
Module 6 establishes a resilient, hybrid recommendation architecture integrating the existing Spring Boot backend (`backend/`) with the standalone FastAPI ML inference service (`ml-service/`, default port 8000).

The design prioritizes safety, defensive resilience, auditability, and zero breaking changes to existing citizen/admin workflows:

```
                          Spring Boot Intake Request
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │   Stage 0 Safety Gate (Java)  │
                      └───────────────┬───────────────┘
                                      │
                 Hazardous / Battery Swollen / Fire Risk?
                                     / \
                             YES   /     \   NO
                                 /         \
                                ▼           ▼
           ┌────────────────────────┐   ┌────────────────────────┐
           │    SPECIAL_HANDLING    │   │  ML Service Enabled?   │
           │ (Source: SAFETY_RULE)  │   └───────────┬────────────┘
           │   [ML Bypassed 100%]   │              / \
           └────────────────────────┘      YES   /     \   NO / Disabled
                                               /         \
                                              ▼           ▼
                           ┌─────────────────────┐  ┌─────────────────────────┐
                           │   MLInferenceClient │  │    RuleBasedFallback    │
                           │   (POST /predict)   │  │ (Source: RULE_BASED...) │
                           └──────────┬──────────┘  └─────────────────────────┘
                                     / \
                       HTTP 200    /     \  Timeout / 5xx / Network /
                      Valid Schema/        \ Malformed Response
                                 ▼           ▼
                      ┌─────────────────────┐  ┌─────────────────────────┐
                      │ Validated ML Result │  │    RuleBasedFallback    │
                      │    (Source: ML)     │  │ (Source: RULE_BASED...) │
                      └──────────┬──────────┘  └─────────────────────────┘
                                 │
                                 ▼
           ┌──────────────────────────────────────────────┐
           │        DisposalRequest Entity Persistence    │
           │  • Authoritative Action (REPAIR, REFURBISH)  │
           │  • Citizen Display (RESTORE, RESALE_CAND...) │
           │  • ML Provenance (Model v1, Probabilities)   │
           │  • Audit Trail (V13 Flyway Migration)        │
           └──────────────────────────────────────────────┘
```

---

## 2. Java to Python Contract Mapping

### 2.1 Category Mapping Table
Every single `EWasteCategory` in Java maps 1:1 to Python FastAPI schema without translation gaps:

| Java `EWasteCategory` | Python `category` String | Status / Strategy |
| :--- | :--- | :--- |
| `MOBILE_PHONE` | `"MOBILE_PHONE"` | Exact 1:1 Match |
| `LAPTOP` | `"LAPTOP"` | Exact 1:1 Match |
| `DESKTOP` | `"DESKTOP"` | Exact 1:1 Match |
| `MONITOR` | `"MONITOR"` | Exact 1:1 Match |
| `TELEVISION` | `"TELEVISION"` | Exact 1:1 Match |
| `PRINTER` | `"PRINTER"` | Exact 1:1 Match |
| `KEYBOARD` | `"KEYBOARD"` | Exact 1:1 Match |
| `MOUSE` | `"MOUSE"` | Exact 1:1 Match |
| `BATTERY` | `"BATTERY"` | Exact 1:1 Match |
| `CHARGER` | `"CHARGER"` | Exact 1:1 Match |
| `CABLE` | `"CABLE"` | Exact 1:1 Match |
| `REFRIGERATOR` | `"REFRIGERATOR"` | Exact 1:1 Match |
| `WASHING_MACHINE` | `"WASHING_MACHINE"` | Exact 1:1 Match |
| `AIR_CONDITIONER` | `"AIR_CONDITIONER"` | Exact 1:1 Match |
| `OTHER` | `"OTHER"` | Exact 1:1 Match |

### 2.2 Condition Mapping Table
| Java `DeviceCondition` | Python `condition` String | Description |
| :--- | :--- | :--- |
| `WORKING` | `"WORKING"` | Fully operational intake state |
| `PARTIALLY_WORKING` | `"PARTIALLY_WORKING"` | Intermittent or partial functional utility |
| `DAMAGED` | `"DAMAGED"` | Physical damage with potential component recovery |
| `NOT_WORKING` | `"NOT_WORKING"` | Inoperable, defective motherboard or electronics |
| `HAZARDOUS` | `"HAZARDOUS"` | Fire/chemical risk; triggers immediate `SPECIAL_HANDLING` |

### 2.3 Physical & Feature Normalization
- **Screen Condition**: Preserves `INTACT`, `MINOR_SCRATCHES`, `CRACKED`, `DEAD_PIXELS_BLEED`, `SHATTERED_NOT_WORKING` for screen-equipped devices (`MOBILE_PHONE`, `LAPTOP`, `MONITOR`, `TELEVISION`). Maps automatically to `NOT_APPLICABLE` for non-screen categories (e.g., `CABLE`, `BATTERY`, `WASHING_MACHINE`).
- **Battery Condition**: Preserves `NORMAL`, `DEGRADED`, `DEAD` for battery-equipped categories (`MOBILE_PHONE`, `LAPTOP`, `BATTERY`). Maps to `NOT_APPLICABLE` for non-battery items.
- **Damage Severity**: Normalized to `NONE`, `MINOR_COSMETIC`, `MODERATE`, `HEAVY`.

---

## 3. Configuration & Environment Properties
Configuration is fully environment-driven and externalized without magic numbers:

| Property | Default Value | Environment Variable Override | Purpose |
| :--- | :--- | :--- | :--- |
| `ml.service.enabled` | `true` | `ML_SERVICE_ENABLED` | Global toggle to enable/disable remote ML inference |
| `ml.service.base-url` | `http://localhost:8000` | `ML_SERVICE_BASE_URL` | Base URL of standalone FastAPI service |
| `ml.service.connect-timeout-ms`| `1000` (1 sec) | `ML_SERVICE_CONNECT_TIMEOUT_MS` | Max connection establishment time |
| `ml.service.read-timeout-ms` | `3000` (3 sec) | `ML_SERVICE_READ_TIMEOUT_MS` | Max response socket read time |

Production values are injected via environment variables (e.g. Render dashboard).

---

## 4. HTTP Client Technology
- **Selected Client**: Spring 3.4 native `RestClient` with `SimpleClientHttpRequestFactory`.
- **Rationale**:
  - Spring Boot 3.4.3 includes `RestClient` natively out-of-the-box.
  - No reactive dependencies (`spring-boot-starter-webflux`) required for simple synchronous calls.
  - Strict socket read and connection timeouts configured via `Duration.ofMillis(...)`.
  - Native JSON serialization/deserialization with Jackson via standard Spring Boot HTTP message converters.

---

## 5. Precedence & Recommendation Orchestration

1. **Precedence 1: Java Deterministic Safety Gate (Safety Wins)**:
   - Evaluates: `condition == HAZARDOUS` OR `batterySwollen == true` OR `batteryLeaking == true` OR `overheatingEvidence == true` OR `severePhysicalDamage == true` OR keyword hazards in condition descriptions.
   - Action: `DisposalAction.SPECIAL_HANDLING`.
   - Source: `RecommendationSource.SAFETY_RULE`.
   - Critical Invariant: **The remote ML service is NEVER contacted**.

2. **Precedence 2: ML Inference Client (FastAPI /predict)**:
   - When ML is enabled and device is non-hazardous, Spring Boot calls `MLInferenceClient.predict(...)`.
   - Response validation enforces:
     - `model_version` is present and not blank.
     - `display_recommendation` and `recommended_action` are valid.
     - `recovery_probability` and `pathway_probability` are within `[0.0, 1.0]`.
     - `recovery_status` is in `[RECOVERY_FEASIBLE, AMBIGUOUS_TRIAGE, RECOVERY_UNLIKELY, SPECIAL_HANDLING]`.
     - `marketplace_eligibility` is in `[NOT_ASSESSED, TECHNICIAN_REVIEW_REQUIRED]`. Any attempted auto-approval is rejected as a security violation.
   - Result mapped with `RecommendationSource.ML`.

3. **Precedence 3: Resilient Fallback to `RuleBasedRecommendationEngine`**:
   - Triggered under:
     - `ML_SERVICE_ENABLED = false`
     - Connection refused (FastAPI down)
     - Connect timeout (> 1000ms)
     - Read timeout (> 3000ms)
     - HTTP 500 / 502 / 503 from Python
     - Malformed JSON or missing required fields
     - Probability out-of-bounds (> 1.0 or < 0.0)
     - Client contract error (HTTP 4xx logged as contract defect)
   - Fallback sets `recommendation_source = RULE_BASED_FALLBACK` and executes existing deterministic logic.
   - Critical Invariant: Citizen intake NEVER crashes due to ML service unavailability.

---

## 6. Action & RESTORE Mapping Strategy

The existing database enum `DisposalAction` contains: `REUSE, REPAIR, DONATE, REFURBISH, RECYCLE, SPECIAL_HANDLING`.

To maintain 100% backward compatibility with downstream status workflows, JPA queries, and database constraints without breaking changes:
- **Display Recommendation**: Preserved as `"RESTORE"` or `"POTENTIAL_RESALE_CANDIDATE"` in `mlDisplayRecommendation` and `disposal_requests.ml_display_recommendation`.
- **Authoritative Business Action**:
  - `RESTORE` + raw `REPAIR` $\rightarrow$ `DisposalAction.REPAIR`.
  - `RESTORE` + raw `REFURBISH` $\rightarrow$ `DisposalAction.REFURBISH`.
  - `POTENTIAL_RESALE_CANDIDATE` $\rightarrow$ `DisposalAction.REFURBISH`.
  - `KEEP_USING` $\rightarrow$ `DisposalAction.REUSE`.
  - `DONATE` $\rightarrow$ `DisposalAction.DONATE`.
  - `RECYCLE` $\rightarrow$ `DisposalAction.RECYCLE`.

---

## 7. Marketplace Option A Preservation
- ML recommendation **NEVER** creates a marketplace listing.
- `marketplace_eligibility` is strictly advisory (`TECHNICIAN_REVIEW_REQUIRED` or `NOT_ASSESSED`).
- No prices are predicted or persisted.
- Resale listing remains human-in-the-loop:
  `Collection -> Physical Technician Assessment -> Refurbisher Approval -> Listing`.

---

## 8. Database Migration & Audit Persistence

Flyway migration `V13__add_ml_recommendation_audit.sql` was created and applied:

```sql
-- 1. Recommendation Source (ML, RULE_BASED_FALLBACK, SAFETY_RULE)
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS recommendation_source VARCHAR(30) DEFAULT 'RULE_BASED_FALLBACK';

-- 2. ML Provenance and Inference Metrics
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_model_version VARCHAR(50);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_recovery_status VARCHAR(50);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_recovery_probability NUMERIC(5,4);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_raw_pathway VARCHAR(50);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_display_recommendation VARCHAR(50);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_pathway_probability NUMERIC(5,4);
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_confidence_level VARCHAR(20);

-- 3. Human Gate & Triage Flags
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS technician_review_required BOOLEAN DEFAULT FALSE;
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS inspection_recommended BOOLEAN DEFAULT FALSE;

-- 4. Marketplace Commercial Assessment Status
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS marketplace_eligibility VARCHAR(50) DEFAULT 'NOT_ASSESSED';

-- 5. Structured Explanation from ML Inference
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS ml_explanation TEXT;
```

---

## 9. Verification & Regression Results

### 9.1 Unit & Integration Test Results (137 / 137 Passing)
- **`MLContractMapperTest`** (31 tests): 100% of Java categories, conditions, intentions, and feature mappings pass.
- **`MLInferenceClientValidationTest`** (9 tests): Validates probability bounds, schema null-checks, forbidden auto-approval rejections, and disabled service behavior.
- **`HybridRecommendationEngineTest`** (10 tests):
  - Swollen / leaking / severe damage $\rightarrow$ `SPECIAL_HANDLING` (ML never invoked).
  - ML RESTORE response $\rightarrow$ mapped to `REPAIR`, source `ML`, audit fields populated.
  - ML Potential Resale Candidate $\rightarrow$ mapped to `REFURBISH`, `TECHNICIAN_REVIEW_REQUIRED`.
  - ML disabled $\rightarrow$ immediate rule-based fallback.
  - Connection refused $\rightarrow$ seamless fallback to rule-based engine.
  - HTTP 500 $\rightarrow$ seamless fallback to rule-based engine.
  - Malformed probability $\rightarrow$ rejected, fallback triggered.
  - **5-Year Laptop Benchmark (Offline)** $\rightarrow$ `REFURBISH`, source `RULE_BASED_FALLBACK`, zero crashes.
- **`MLIntegrationPersistenceTest`** (2 tests):
  - Hazardous intake persisted with `SAFETY_RULE` in DB.
  - Offline fallback intake persisted with `RULE_BASED_FALLBACK` in DB.
- **Existing Service & Controller Tests** (85 tests): All existing tests in `DeviceAssessmentModule1Test`, `InstitutionServiceTest`, `GamificationServiceTest`, `PickupServiceTest`, `RecommendationEngineTest` pass cleanly.

---

## 10. Local Run Instructions

### Terminal 1: FastAPI ML Inference Service
```bash
cd ml-service
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Terminal 2: Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```

To test ML disabled mode:
```bash
set ML_SERVICE_ENABLED=false
mvn spring-boot:run
```
