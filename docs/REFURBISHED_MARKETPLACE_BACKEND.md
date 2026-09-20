# Refurbished Electronics Marketplace Backend, Human Approval & Inventory Foundation

## 1. Executive Summary & Circular Architecture

The E-Waste Management Platform circular economy lifecycle adheres strictly to **Option A**: machine learning screening and deterministic safety rules operate during initial citizen submission, but **no automated algorithm dictates commercial pricing, warranty commitments, or direct marketplace publishing**. 

Commercializing restored electronic devices requires verified physical technical assessment, repair/refurbishment execution, multi-point electrical/safety quality testing, and authorized human governance.

### The Complete End-to-End Circular Lifecycle

```
Citizen Submission
        │
        ▼
ML / Rule Safety Screening (Intake recommendation: REPAIR / REFURBISH candidate)
        │
        ▼
Physical Logistics Collection & Inward Facility Intake
        │
        ▼
Technician Physical Assessment (Hardware diagnostic: REPAIR vs. REFURBISH)
        │
        ▼
Restoration & Rework (Parts replacement, component-level rework, cleaning)
        │
        ▼
Quality Check Certification (Functional, Display, Battery, Electrical Safety PASS)
        │ (Must have: overallResult = PASS, marketplaceCandidate = true)
        ▼
Recycler / Technician Draft Preparation (Enters manual sellingPrice > 0, warranty, condition notes)
        │ (Status: DRAFT / PENDING_APPROVAL)
        ▼
ADMIN Commercial Review & Approval Gate (Mandatory human approval)
        │
        ▼
Published Marketplace Listing (Status: PUBLISHED, StockStatus: AVAILABLE)
        │
        ▼
Customer Cart & Browsing (1 physical unit = max quantity 1; no premature reservation)
        │
        ▼
Atomic Checkout & Pessimistic Write Lock (StockStatus: RESERVED, Status: PLACED)
        │
        ├── [Order Cancelled] ──> Inventory Rollback (StockStatus: AVAILABLE)
        │
        ▼
Operational Fulfillment (DELIVERED) ──> Permanent Sale (StockStatus: SOLD, Payment: PENDING)
        │
        ▼
Second-Life Ownership (Circular reuse loop successfully closed)
```

---

## 2. Product Rationale: Why Option A Over Fully Automated Pricing ML

| Dimension | Automated Pricing ML (Option B - Rejected) | Human-Governed Workflow (Option A - Approved) |
| :--- | :--- | :--- |
| **Data Authenticity** | Citizen input at submission is subjective, unverified, and often inaccurate regarding internal board damage or battery health. | Grounded in physical diagnostic hardware tests performed by certified technicians. |
| **Safety & Liability** | ML could list hazardous batteries or unstable power supplies directly to unsuspecting buyers. | Multi-point electrical and fire safety certification is mandatory before listing consideration. |
| **Pricing Intelligence** | Untrustworthy synthetic or scraped pricing heuristics could lead to arbitrary or predatory values. | Operational human enter realistic prices based on actual parts costs, labor, and local fair market benchmarks. |
| **Regulatory & Consumer Trust** | Second-hand electronics marketplaces require clear commercial warranty and provenance traceability. | Enforces immutable inspection and restoration snapshots with verifiable circular provenance. |

---

## 3. Database Schema (Flyway V15 Migration)

Six relational tables implement the marketplace domain:

### 3.1. `marketplace_listings`
Commercial representation of a verified refurbished device unit.
- `id` (BIGSERIAL PRIMARY KEY)
- `request_id` (BIGINT NOT NULL REFERENCES `disposal_requests`)
- `item_id` (BIGINT NOT NULL REFERENCES `ewaste_items`)
- `quality_check_id` (BIGINT NOT NULL UNIQUE REFERENCES `quality_checks`) — guarantees 1 QC record maps to at most 1 commercial listing.
- `restoration_job_id` (BIGINT NOT NULL REFERENCES `restoration_jobs`)
- `center_id` (BIGINT NOT NULL REFERENCES `recycling_centers`)
- `title` (VARCHAR(200) NOT NULL)
- `description` (TEXT)
- `category` (VARCHAR(50) NOT NULL)
- `brand` (VARCHAR(100)), `model` (VARCHAR(100))
- `cosmetic_grade` (VARCHAR(20) NOT NULL: `GRADE_A`, `GRADE_B`, `GRADE_C`)
- `condition_summary`, `technical_summary`, `work_performed_summary`, `parts_replaced_summary` (TEXT)
- `selling_price` (NUMERIC(10, 2) NOT NULL CHECK (`selling_price > 0`)) — strictly enforced positive commercial price.
- `original_reference_price` (NUMERIC(10, 2))
- `warranty_days` (INT DEFAULT 0)
- `stock_status` (VARCHAR(30) NOT NULL: `AVAILABLE`, `RESERVED`, `SOLD`)
- `listing_status` (VARCHAR(30) NOT NULL: `DRAFT`, `PENDING_APPROVAL`, `PUBLISHED`, `REJECTED`, `WITHDRAWN`)
- `approved_by_id`, `approved_at`, `rejected_by_id`, `rejected_at`, `rejection_reason`
- `published_at`, `sold_at`, `created_at`, `updated_at`

### 3.2. `marketplace_listing_images`
- `id` (BIGSERIAL PRIMARY KEY)
- `listing_id` (BIGINT NOT NULL REFERENCES `marketplace_listings` ON DELETE CASCADE)
- `image_url` (VARCHAR(500) NOT NULL)
- `sort_order` (INT DEFAULT 0), `is_primary` (BOOLEAN DEFAULT FALSE)

### 3.3. `carts`
- `id` (BIGSERIAL PRIMARY KEY)
- `user_id` (BIGINT NOT NULL UNIQUE REFERENCES `users` ON DELETE CASCADE)

### 3.4. `cart_items`
- `id` (BIGSERIAL PRIMARY KEY)
- `cart_id` (BIGINT NOT NULL REFERENCES `carts` ON DELETE CASCADE)
- `listing_id` (BIGINT NOT NULL REFERENCES `marketplace_listings` ON DELETE CASCADE)
- `added_at` (TIMESTAMP)
- `CONSTRAINT uq_cart_listing UNIQUE (cart_id, listing_id)` — enforces that 1 physical device can only be in a user's cart once (quantity strictly 1).

### 3.5. `marketplace_orders`
- `id` (BIGSERIAL PRIMARY KEY)
- `order_number` (VARCHAR(50) NOT NULL UNIQUE)
- `buyer_id` (BIGINT NOT NULL REFERENCES `users`)
- `status` (VARCHAR(30) NOT NULL: `PLACED`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`)
- `payment_status` (VARCHAR(30) NOT NULL: `PENDING`, `NOT_APPLICABLE`, `PAID`, `FAILED`, `REFUNDED`)
- `payment_method` (VARCHAR(50) DEFAULT `'DEMO_CHECKOUT'`)
- `subtotal`, `total_amount` (NUMERIC(10, 2) NOT NULL)
- `recipient_name`, `phone_number`, `address_line`, `city`, `state`, `postal_code` (Immutable address snapshot)
- `placed_at`, `confirmed_at`, `shipped_at`, `delivered_at`, `cancelled_at`, `cancellation_reason`

### 3.6. `marketplace_order_items`
- `id` (BIGSERIAL PRIMARY KEY)
- `order_id` (BIGINT NOT NULL REFERENCES `marketplace_orders` ON DELETE CASCADE)
- `listing_id` (BIGINT NOT NULL REFERENCES `marketplace_listings`)
- `price_at_purchase` (NUMERIC(10, 2) NOT NULL)
- `title_snapshot` (VARCHAR(200) NOT NULL)
- `warranty_days_snapshot` (INT DEFAULT 0)

---

## 4. Role Authorization Matrix

| Action | Anonymous Public | Authenticated Citizen / Buyer | Facility Recycler / Tech | Platform Admin |
| :--- | :---: | :---: | :---: | :---: |
| Browse / Search Catalog | ✅ | ✅ | ✅ | ✅ |
| View Public Listing & Provenance | ✅ | ✅ | ✅ | ✅ |
| Manage Personal Cart | ❌ | ✅ | ✅ | ✅ |
| Checkout & Place Orders | ❌ | ✅ | ✅ | ✅ |
| Cancel Own Placed Order | ❌ | ✅ (Own orders) | ❌ | ✅ (All orders) |
| View Candidate Restored Devices | ❌ | ❌ | ✅ (Own facility) | ✅ (System-wide) |
| Create Draft Listing | ❌ | ❌ | ✅ (Own facility) | ✅ (System-wide) |
| Submit Draft for Approval | ❌ | ❌ | ✅ (Own facility) | ✅ (System-wide) |
| Approve / Reject Listing | ❌ | ❌ | ❌ | ✅ |
| Fulfill / Deliver Order | ❌ | ❌ | ✅ (Own facility) | ✅ (System-wide) |

---

## 5. Inventory Concurrency & State Transition Architecture

### 5.1. 1 Physical Unit = 1 Inventory Stock Entity
Because refurbished consumer electronics are individual physical items with unique cosmetic wear and repair histories:
- Each listing represents exactly **one physical unit**.
- Cart quantity is strictly **1**.
- Adding an item to a cart **does NOT reserve stock** (preventing denial-of-inventory cart hoarding).

### 5.2. Atomic Checkout with Pessimistic Locking
During order checkout:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT m FROM MarketplaceListing m WHERE m.id IN :ids")
List<MarketplaceListing> findAllByIdInForUpdate(@Param("ids") Collection<Long> ids);
```
1. A pessimistic write lock (`SELECT ... FOR UPDATE`) is acquired across all requested listing IDs in a single database transaction.
2. The engine verifies each listing has `listingStatus == PUBLISHED` and `stockStatus == AVAILABLE`.
3. If another user checks out concurrently, their transaction blocks until the lock is released, then detects that `stockStatus == RESERVED`, gracefully aborting with an HTTP 400 (`"Item is no longer available for purchase"`).
4. Subtotal and total amount are computed **strictly from server-side persisted prices**, rejecting any client-side tampering.
5. `stockStatus` transitions to `RESERVED`, and the purchased item is removed from the buyer's active cart.

### 5.3. Inventory Rollback on Cancellation
If an order in `PLACED` status is cancelled:
1. Order status transitions to `CANCELLED`.
2. Each associated listing is re-locked and its `stockStatus` rolls back from `RESERVED` to `AVAILABLE`.

### 5.4. Permanent Sale on Fulfillment (SOLD ≠ PAID)
When operational staff transition the order to `DELIVERED`:
1. Associated listings transition `stockStatus` to `SOLD`, recording `soldAt = LocalDateTime.now()`.
2. **Honest Payment State Enforcement**:
   - `paymentStatus` remains `PENDING` (or `NOT_APPLICABLE` if demo without payment).
   - Delivery does **NOT** automatically imply `paymentStatus = PAID`.
   - The platform does not currently have an active payment gateway (e.g. Razorpay/Stripe); therefore, payment success is never fabricated.
   - Future payment gateway integration (or an authorized manual payment confirmation workflow) will update payment status from an authentic payment provider or finance confirmation.
   - **`SOLD ≠ PAID`**: Physical device stock disposition and financial payment capture are distinct, uncoupled concepts.

---

## 6. Zero Citizen Donor PII Policy & Circular Provenance

Consumer confidence in circular electronics requires transparent proof of inspection and quality testing. However, the privacy of the original citizen donor who discarded the electronic device is non-negotiable.

### The Provenance Boundary
The `DeviceJourneyDTO` exposes a 5-stage lifecycle while systematically stripping all donor PII:
1. **Intake & Collection Stage**:
   - Timestamp: `disposalRequest.createdAt`
   - Facility Name: `recyclingCenter.name`
   - Title: `"Certified Circular Drop-Off / Intake"`
   - Description: `"Device received via verified e-waste recovery channel and booked into facility inventory."`
   - **PII Stripped**: Donor name, email, phone number, and residential pickup address are strictly omitted.
2. **Diagnostic Stage**:
   - Certified technician physical assessment findings and designated restorative pathway.
3. **Restoration Stage**:
   - Summary of component work performed and genuine parts replaced.
4. **Quality Certification Stage**:
   - Verification of functional, battery, display, and electrical safety tests passed; cosmetic grade certified (`GRADE_A`, `GRADE_B`, or `GRADE_C`).
5. **Marketplace Listing Stage**:
   - Admin commercial approval and publication timestamp for second-life ownership.

Automated integration tests (`MarketplaceCatalogAndPrivacyTest`) verify that serializing listing details and device journeys yields zero occurrences of donor name, email, phone number, or pickup address.

---

## 7. REST API Endpoints

### 7.1. Public Catalog (PermitAll)
- `GET /api/marketplace/listings`: Paginated search with dynamic filters (`category`, `brand`, `cosmeticGrade`, `minPrice`, `maxPrice`, `query`).
- `GET /api/marketplace/listings/{id}`: Detailed view with image gallery, specs, warranty, and circular provenance.
- `GET /api/marketplace/listings/{id}/journey`: Privacy-safe circular device provenance timeline.

### 7.2. Customer Cart & Orders (`isAuthenticated()`)
- `GET /api/marketplace/cart`: View authenticated user's cart, itemCount, and subtotal over available items.
- `POST /api/marketplace/cart/items?listingId={id}`: Add unique device to cart (max qty 1).
- `DELETE /api/marketplace/cart/items/{listingId}`: Remove device from cart.
- `DELETE /api/marketplace/cart`: Clear cart.
- `POST /api/marketplace/orders`: Checkout cart items with immutable address snapshot.
- `GET /api/marketplace/orders`: List authenticated user's order history.
- `GET /api/marketplace/orders/{id}`: Order tracking and item snapshots.
- `POST /api/marketplace/orders/{id}/cancel`: Cancel placed order and release inventory reservation.

### 7.3. Recycler Management (`hasAnyRole('RECYCLER', 'ADMIN')`)
- `GET /api/recycler/marketplace/candidates`: Devices that passed physical QC with `marketplaceCandidate = true` awaiting draft creation.
- `POST /api/recycler/marketplace/listings`: Create draft listing with manual selling price (`> 0`).
- `GET /api/recycler/marketplace/listings`: View listings for facility.
- `GET /api/recycler/marketplace/listings/{id}`: View listing management details.
- `PUT /api/recycler/marketplace/listings/{id}`: Update draft listing.
- `POST /api/recycler/marketplace/listings/{id}/submit`: Submit draft for Admin review (`PENDING_APPROVAL`).
- `POST /api/recycler/marketplace/listings/{id}/withdraw`: Withdraw active listing.
- `POST /api/recycler/marketplace/orders/{id}/fulfill?status={CONFIRMED|SHIPPED|DELIVERED}`: Update fulfillment status.

### 7.4. Admin Oversight (`hasRole('ADMIN')`)
- `GET /api/admin/marketplace/listings?status={status}`: System-wide listing review queue.
- `POST /api/admin/marketplace/listings/{id}/review`: Approve with optional price adjustment or reject with mandatory reason.
- `GET /api/admin/marketplace/orders?status={status}`: System-wide orders overview.

---

## 8. Automated Verification & Test Coverage Summary

Full regression test suite executed via Maven on Java 25 runtime with in-memory H2 database and all 15 Flyway migrations:

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.ewaste.management.marketplace.MarketplaceApprovalWorkflowTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.ewaste.management.marketplace.MarketplaceCartAndOrderConcurrencyTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.ewaste.management.marketplace.MarketplaceCatalogAndPrivacyTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
...
[INFO] Results:
[INFO] Tests run: 167, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

- **Baseline Pre-Module Tests**: 157 passed.
- **New Marketplace Tests Added**: 10 tests across 3 dedicated test classes:
  - `MarketplaceApprovalWorkflowTest`: 4 tests (candidates, manual pricing validation, approval lifecycle, mandatory rejection reason).
  - `MarketplaceCartAndOrderConcurrencyTest`: 4 tests (quantity limits, atomic checkout, double-booking prevention, cancellation rollback, delivered status transition).
  - `MarketplaceCatalogAndPrivacyTest`: 2 tests (unauthenticated browsing with dynamic multi-criteria filters, strict zero-donor-PII assertions).
- **Total Backend Passing Tests**: **167 tests, 0 failures, 0 errors**.
