# Module 7 — Technician Assessment, Refurbishment Workflow & Quality-Check Foundation

## 1. Operational Overview & Option A Philosophy

In the circular electronics economy, machine learning inference algorithms (developed in Modules 4–5 and integrated into Spring Boot in Module 6) perform **pre-collection screening** based on user-reported device characteristics. However, under **Option A Product Architecture**, software algorithms **never** make final commercial decisions, fabricate repair diagnoses, or automatically list items on a marketplace with artificial prices.

Instead, a strict **Human-in-the-Loop operational chain** governs all devices once physically received:

```
[Citizen Submission]
       ↓ (ML / Rule Hybrid Recommendation)
[Collection & Logistics]
       ↓ (Status: COLLECTED / AT_RECYCLING_CENTER)
[Technician Physical Assessment]
       ↓ (Power, Screen, Battery, Diagnostics, Hazard Screening)
 ┌─────┴────────────────────────────────┐
 │ Non-Recoverable / Safety Hazard      │ REPAIR / REFURBISH Decision
 │ -> SPECIAL_HANDLING / RECYCLE        │ -> Auto-Queues RestorationJob (PENDING)
 └──────────────────────────────────────┘       ↓
                                        [Restoration / Repair Work]
                                        (IN_PROGRESS -> Parts/Labor Tracking -> COMPLETED)
                                                ↓
                                        [Quality-Check Verification]
                                        (Power, Display, Battery, Safety & Cosmetic Grading)
                                                ↓
                                        [Marketplace Candidate Flag]
                                        (Sets marketplace_eligibility = TECHNICIAN_REVIEW_REQUIRED)
                                                ↓ (Future Module 8: Commercial Pricing/Listing)
```

### Key Principles
1. **Physical Verification Precedes Any Lifecycle Action**: User-reported data is treated as unverified prior to arrival. A certified technician performs hands-on testing.
2. **Hazard Discovery Escalation**: Any discovery of swelling, punctured cells, thermal scorching, or leaking batteries immediately overrides prior pathway recommendations to `SPECIAL_HANDLING`.
3. **Audit Trail Separation**: Physical assessment and repair entities are tracked in separate database tables. The original ML recommendation audit fields (`ml_raw_pathway`, `ml_model_version`, `ml_recovery_probability`) remain pristine and immutable.
4. **Marketplace Candidate $\ne$ Approved for Sale**: Passing quality inspection flags a device as `TECHNICIAN_REVIEW_REQUIRED` (`marketplaceCandidate = true`). It does not list the item or invent an artificial selling price.

---

## 2. Post-Collection Lifecycle State Transitions

| Step | State / Trigger | From Status | To Status | Side Effects |
|---|---|---|---|---|
| **Intake Arrival** | Device delivered to recycling facility | `PICKUP_ASSIGNED` / `COLLECTED` | `COLLECTED` / `AT_RECYCLING_CENTER` | Request appears in technician's `/requests/pending-assessment` queue. |
| **Physical Assessment** | Technician submits physical diagnostic | `COLLECTED` / `AT_RECYCLING_CENTER` | `PROCESSING` | If `SPECIAL_HANDLING` (hazard), updates `recommendedAction` & alerts user. If `REPAIR`/`REFURBISH`, auto-creates `RestorationJob` (`PENDING`). |
| **Start Restoration** | Technician claims and starts job ticket | Job: `PENDING` | Job: `IN_PROGRESS` | Records `workStartedAt`, logs audit event in `disposal_status_histories`. |
| **Complete Restoration** | Technician logs work, parts, labor, and marks complete | Job: `IN_PROGRESS`, Request: `PROCESSING` | Job: `COMPLETED`, Request: `REFURBISHED` | Records `workCompletedAt`, calculates total cost (`partsCost + laborCost`). |
| **Failed Restoration** | Restoration unsuccessful (e.g. board unrecoverable) | Job: `IN_PROGRESS` | Job: `FAILED`, Request: `PROCESSING` | Work marked failed; available for parts salvaging or recycling. |
| **Quality Check** | Standardized functional, electrical, and cosmetic tests | Request: `REFURBISHED` | Request: `REFURBISHED` | If `PASS` + safe + candidate, sets `marketplace_eligibility = 'TECHNICIAN_REVIEW_REQUIRED'`. |

---

## 3. Database Schema Migration (Flyway V14)

The database schema is upgraded via `V14__technician_assessment_and_restoration.sql`:

### 3.1 `device_assessments`
Tracks the physical inspection findings of a device:
- `id` (BIGINT PRIMARY KEY AUTO_INCREMENT)
- `request_id` (BIGINT NOT NULL UNIQUE, FK to `disposal_requests`)
- `assessed_by` (BIGINT NOT NULL, FK to `users`)
- `power_status` (VARCHAR(50) NOT NULL: `POWERS_ON`, `NO_POWER`, `INTERMITTENT`)
- `screen_assessment` (VARCHAR(100): `INTACT`, `CRACKED`, `DEAD_PIXELS`, etc.)
- `battery_assessment` (VARCHAR(100): `FUNCTIONAL`, `DEGRADED`, `SWOLLEN`, `MISSING`)
- `physical_condition` (VARCHAR(100) NOT NULL: `MINT`, `GOOD`, `FAIR`, `SEVERE_DAMAGE`)
- `functional_assessment` (TEXT)
- `diagnosed_issues` (TEXT)
- `repairability_status` (VARCHAR(50) NOT NULL: `REPAIRABLE`, `REFURBISHABLE`, `NOT_ECONOMICALLY_RECOMMENDED`, `NOT_RECOVERABLE`)
- `technician_decision` (VARCHAR(50) NOT NULL: `REPAIR`, `REFURBISH`, `DONATE`, `RECYCLE`, `SPECIAL_HANDLING`)
- `safety_hazard_found` (BOOLEAN DEFAULT FALSE)
- `safety_notes` (TEXT)
- `recommended_for_marketplace` (BOOLEAN DEFAULT FALSE)
- `assessment_notes` (TEXT)
- `assessed_at` (TIMESTAMP NOT NULL)
- `created_at`, `updated_at` (TIMESTAMP)

### 3.2 `restoration_jobs`
Tracks restoration and repair tickets for circular pathway recovery:
- `id` (BIGINT PRIMARY KEY AUTO_INCREMENT)
- `request_id` (BIGINT NOT NULL, FK to `disposal_requests`)
- `assessment_id` (BIGINT NOT NULL UNIQUE, FK to `device_assessments`)
- `assigned_technician_id` (BIGINT NOT NULL, FK to `users`)
- `job_type` (VARCHAR(50) NOT NULL: `REPAIR`, `REFURBISH`)
- `status` (VARCHAR(50) NOT NULL: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `CANCELLED`)
- `work_started_at`, `work_completed_at` (TIMESTAMP)
- `work_performed` (TEXT)
- `parts_replaced` (TEXT)
- `technician_notes` (TEXT)
- `parts_cost`, `labor_cost`, `total_cost` (DECIMAL(10,2) NOT NULL DEFAULT 0.00)
- `created_at`, `updated_at` (TIMESTAMP)

### 3.3 `quality_checks`
Tracks post-restoration verification:
- `id` (BIGINT PRIMARY KEY AUTO_INCREMENT)
- `restoration_job_id` (BIGINT NOT NULL UNIQUE, FK to `restoration_jobs`)
- `checked_by` (BIGINT NOT NULL, FK to `users`)
- `functional_test_passed` (BOOLEAN NOT NULL)
- `power_test_passed` (BOOLEAN NOT NULL)
- `display_test_passed` (BOOLEAN, mandatory for screens)
- `battery_test_passed` (BOOLEAN, mandatory for batteries)
- `safety_test_passed` (BOOLEAN NOT NULL)
- `cosmetic_grade` (VARCHAR(20) NOT NULL: `GRADE_A`, `GRADE_B`, `GRADE_C`)
- `overall_result` (VARCHAR(30) NOT NULL: `PASS`, `FAIL`, `REWORK_REQUIRED`)
- `quality_notes` (TEXT)
- `marketplace_candidate` (BOOLEAN NOT NULL DEFAULT FALSE)
- `checked_at` (TIMESTAMP NOT NULL)
- `created_at`, `updated_at` (TIMESTAMP)

---

## 4. Domain Enums

1. **`TechnicianDecision`**:
   - `REPAIR`: Hardware fault diagnosed, parts replaceable.
   - `REFURBISH`: Cosmetic restoration, OS reinstallation, minor upgrades.
   - `DONATE`: Fully working or basic unit suited for social reuse.
   - `RECYCLE`: Not economically viable to recover; material reclamation.
   - `SPECIAL_HANDLING`: Chemical, thermal, or physical safety hazard.

2. **`RepairabilityStatus`**:
   - `REPAIRABLE`: High technical feasibility of repair.
   - `REFURBISHABLE`: Fully functional core; minor components/reconditioning needed.
   - `NOT_ECONOMICALLY_RECOMMENDED`: Repair cost exceeds restored value.
   - `NOT_RECOVERABLE`: Catastrophic motherboard or component failure.

3. **`RestorationJobType`**: `REPAIR`, `REFURBISH`.
4. **`RestorationStatus`**: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `CANCELLED`.
5. **`CosmeticGrade`**:
   - `GRADE_A`: Like new, pristine screen, minimal to no marks.
   - `GRADE_B`: Minor scuffs or light cosmetic wear, zero cracks.
   - `GRADE_C`: Heavy cosmetic wear, visible scratches, but structurally sound.

6. **`QualityCheckResult`**: `PASS`, `FAIL`, `REWORK_REQUIRED`.

---

## 5. Security & Facility Boundary Model

- **Controller Security**: `@PreAuthorize("hasAnyRole('RECYCLER', 'ADMIN')")` protects all `/api/recycler/**` endpoints.
- **Facility Isolation**:
  - Each `RECYCLER` user is linked to a registered `RecyclingCenter`.
  - Technicians can only view and assess devices assigned to their own facility center (`request.getCenter().getId().equals(recycler.getCenter().getId())`).
  - Attempting to inspect or modify another center's device immediately throws `AccessDeniedException` (HTTP 403 Forbidden).
- **Admin Oversight**: `ADMIN` users have global access across all facilities for quality auditing and administrative intervention.

---

## 6. Category-Aware Quality Check Rules

Quality inspection enforces category-specific requirements:
- Devices in screen categories (`LAPTOP`, `MOBILE_PHONE`, `MONITOR`, `TELEVISION`) **must** include a non-null `displayTestPassed` result.
- Devices in battery categories (`LAPTOP`, `MOBILE_PHONE`, `BATTERY`) **must** include a non-null `batteryTestPassed` result.
- Devices in other categories (`PRINTER`, `AUDIO_DEVICE`, `ACCESSORY`) allow `displayTestPassed` and `batteryTestPassed` to be omitted/null.

### Marketplace Candidate Formula
A device is flagged as `marketplaceCandidate = true` **if and only if**:
1. `overallResult == QualityCheckResult.PASS`
2. `safetyTestPassed == true`
3. Assessment `safetyHazardFound == false`
4. Technician assessment `recommendedForMarketplace == true`

If flagged, `disposal_requests.marketplace_eligibility` transitions to `'TECHNICIAN_REVIEW_REQUIRED'`. **It is never automatically listed or approved for sale.**

---

## 7. REST API Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/recycler/requests/pending-assessment` | `RECYCLER`, `ADMIN` | List incoming devices awaiting physical inspection at technician's facility. |
| `POST` | `/api/recycler/requests/{id}/assessment` | `RECYCLER`, `ADMIN` | Submit physical assessment diagnostic. Auto-creates restoration job if `REPAIR`/`REFURBISH`. |
| `GET` | `/api/recycler/requests/{id}/assessment` | `RECYCLER`, `ADMIN` | Retrieve assessment details for a request. |
| `GET` | `/api/recycler/restorations?status=...` | `RECYCLER`, `ADMIN` | List restoration jobs for the facility (optional status filter). |
| `PATCH` | `/api/recycler/restorations/{id}/start` | `RECYCLER`, `ADMIN` | Transition restoration ticket from `PENDING` to `IN_PROGRESS`. |
| `PATCH` | `/api/recycler/restorations/{id}/complete` | `RECYCLER`, `ADMIN` | Record work performed, parts cost, labor cost, and update status to `COMPLETED` or `FAILED`. |
| `POST` | `/api/recycler/restorations/{id}/quality-check` | `RECYCLER`, `ADMIN` | Perform post-restoration quality inspection and determine marketplace candidacy. |

---

## 8. Verification & Test Suite

The entire backend test suite compiles and runs cleanly against the H2 in-memory test database with all 14 Flyway migrations:

```bash
mvn test
```

### Results Summary
- **Total Tests Run**: 157
- **Failures**: 0
- **Errors**: 0
- **Skipped**: 0
- **Module 7 New Tests**:
  - `TechnicianWorkflowServiceTest` (15 tests covering physical assessments, hazard escalation, duplicate prevention, center boundary security, restoration transitions, cost calculations, category-aware quality checks, and candidate flags).
  - `RecyclerWorkflowControllerTest` (5 tests covering full HTTP lifecycle, authentication, role authorization, and endpoint operations).
