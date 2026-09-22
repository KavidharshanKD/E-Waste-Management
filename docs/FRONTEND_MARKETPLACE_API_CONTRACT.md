# Frontend Marketplace API Contract Documentation

## 1. Overview & Architectural Principles

This document specifies the exact API contracts between the React frontend and Spring Boot backend for the Refurbished Electronics Marketplace (Module 8 foundation).

### Key Architectural Constraints:
1. **SOLD ≠ PAID (Payment State Honesty)**:
   - The backend currently has **no real payment gateway** (Razorpay, Stripe, etc. are not yet integrated).
   - Delivery or fulfillment does **NOT** automatically mark `paymentStatus = PAID`.
   - Payment status remains `PENDING` across all fulfillment states (`PLACED`, `CONFIRMED`, `SHIPPED`, `DELIVERED`).
   - Physical device disposition (`RESERVED` → `SOLD`) is decoupled from financial transaction settlement (`PENDING`).
2. **Strict Privacy Isolation (Zero Donor PII)**:
   - Public marketplace listings and circular device journey endpoints **never expose** donor identity, original citizen email, telephone number, residential address, or internal repair costs.
   - Only non-sensitive equipment specs, cosmetic grading, refurbishing summaries, parts replaced, and operational facility locations are exposed.
3. **Fulfillment & Candidate Gating**:
   - A device cannot be listed directly by an individual or technician. It must complete:
     `Intake` → `Collection` → `Technician Physical Assessment` → `Restoration Work` → `Quality Check PASS` → `Marketplace Candidate Flag` → `Admin Review & Approval` → `Published Listing`.

---

## 2. Public Marketplace Endpoints (No Authentication Required)

### 2.1. Search & Browse Marketplace Catalog
- **Method**: `GET`
- **Path**: `/api/marketplace/listings`
- **Authentication**: None (Public)
- **Query Parameters**:
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `category` | `EWasteCategory` | No | Filter by category (e.g. `LAPTOP`, `MOBILE_PHONE`, etc.) |
  | `brand` | `string` | No | Case-insensitive brand substring (e.g. `Apple`, `Dell`) |
  | `cosmeticGrade` | `CosmeticGrade` | No | Filter by grade (`GRADE_A`, `GRADE_B`, `GRADE_C`) |
  | `minPrice` | `BigDecimal` | No | Minimum selling price in INR |
  | `maxPrice` | `BigDecimal` | No | Maximum selling price in INR |
  | `query` | `string` | No | Free-text search matching title, model, or description |
  | `page` | `int` | No | 0-indexed page number (default `0`) |
  | `size` | `int` | No | Page size (default `12`) |
  | `sort` | `string` | No | Sort property and direction (default `publishedAt,desc`) |
- **Response**: `200 OK` — `PageResponse<ListingSummaryDTO>`
  ```json
  {
    "content": [
      {
        "id": 101,
        "title": "Refurbished ThinkPad T480 - Core i5 8GB 256GB SSD",
        "category": "LAPTOP",
        "brand": "Lenovo",
        "model": "ThinkPad T480",
        "cosmeticGrade": "GRADE_A",
        "sellingPrice": 18500.00,
        "originalReferencePrice": 65000.00,
        "warrantyDays": 90,
        "stockStatus": "AVAILABLE",
        "listingStatus": "PUBLISHED",
        "primaryImageUrl": "https://...",
        "centerId": 2,
        "centerName": "Coimbatore Circular Tech Hub",
        "centerCity": "Coimbatore",
        "publishedAt": "2026-09-20T10:30:00"
      }
    ],
    "totalElements": 24,
    "totalPages": 2,
    "size": 12,
    "number": 0,
    "first": true,
    "last": false,
    "empty": false
  }
  ```

### 2.2. Get Listing Detail
- **Method**: `GET`
- **Path**: `/api/marketplace/listings/{id}`
- **Authentication**: None (Public)
- **Path Variable**: `id` (Listing ID)
- **Response**: `200 OK` — `ListingDetailDTO`
  ```json
  {
    "id": 101,
    "title": "Refurbished ThinkPad T480 - Core i5 8GB 256GB SSD",
    "description": "Certified refurbished enterprise laptop, tested and cleaned.",
    "category": "LAPTOP",
    "brand": "Lenovo",
    "model": "ThinkPad T480",
    "cosmeticGrade": "GRADE_A",
    "conditionSummary": "Excellent cosmetic condition. Thermal paste reapplied.",
    "technicalSummary": "All ports, display, and keyboard tested 100% functional.",
    "workPerformedSummary": "Battery replaced with OEM battery, SSD upgraded.",
    "partsReplacedSummary": "Battery, 256GB NVMe SSD",
    "sellingPrice": 18500.00,
    "originalReferencePrice": 65000.00,
    "warrantyDays": 90,
    "stockStatus": "AVAILABLE",
    "listingStatus": "PUBLISHED",
    "centerId": 2,
    "centerName": "Coimbatore Circular Tech Hub",
    "centerCity": "Coimbatore",
    "centerState": "Tamil Nadu",
    "publishedAt": "2026-09-20T10:30:00",
    "images": [
      {
        "id": 1,
        "imageUrl": "https://...",
        "primary": true,
        "sortOrder": 0
      }
    ],
    "deviceJourney": {
      "serialOrTrackingReference": "EW-2026-88A9B1C2",
      "category": "LAPTOP",
      "brand": "Lenovo",
      "model": "ThinkPad T480",
      "cosmeticGrade": "GRADE_A",
      "events": [
        {
          "stage": "COLLECTED",
          "title": "Doorstep Logistics Recovery",
          "description": "Equipment safely received from eco-conscious donor.",
          "facilityName": "Doorstep Verification Fleet",
          "timestamp": "2026-09-10T11:00:00"
        },
        {
          "stage": "ASSESSED",
          "title": "Diagnostic Assessment",
          "description": "Passed comprehensive multi-point electronic diagnostic.",
          "facilityName": "Coimbatore Circular Tech Hub",
          "timestamp": "2026-09-12T14:30:00"
        },
        {
          "stage": "QUALITY_CHECK",
          "title": "Certified Quality Inspection",
          "description": "Certified Grade A cosmetic & electrical safety verification.",
          "facilityName": "Coimbatore Circular Tech Hub",
          "timestamp": "2026-09-15T16:00:00"
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{ "error": "Marketplace listing not found with ID: 101" }`
  - `400 Bad Request`: If listing is not in `PUBLISHED` status.

### 2.3. Get Standalone Device Journey
- **Method**: `GET`
- **Path**: `/api/marketplace/listings/{id}/journey`
- **Authentication**: None (Public)
- **Response**: `200 OK` — `DeviceJourneyDTO`
- **Error Responses**:
  - `404 Not Found`: If listing does not exist.

---

## 3. Customer Cart & Order Endpoints (Authenticated)

### 3.1. Get Current User Cart
- **Method**: `GET`
- **Path**: `/api/marketplace/cart`
- **Authentication**: Required (`Authorization: Bearer <jwt_token>`)
- **Roles**: Any authenticated user (`USER`, `COLLECTOR`, `RECYCLER`, `ADMIN`)
- **Response**: `200 OK` — `CartDTO`
  ```json
  {
    "id": 5,
    "userId": 42,
    "itemCount": 1,
    "subtotal": 18500.00,
    "items": [
      {
        "id": 12,
        "listingId": 101,
        "title": "Refurbished ThinkPad T480",
        "category": "LAPTOP",
        "brand": "Lenovo",
        "model": "ThinkPad T480",
        "cosmeticGrade": "GRADE_A",
        "price": 18500.00,
        "imageUrl": "https://...",
        "stockStatus": "AVAILABLE",
        "available": true,
        "addedAt": "2026-09-21T09:15:00"
      }
    ]
  }
  ```

### 3.2. Add Listing to Cart
- **Method**: `POST`
- **Path**: `/api/marketplace/cart/items?listingId={listingId}`
- **Authentication**: Required
- **Query Parameter**: `listingId` (Long)
- **Response**: `200 OK` — `CartDTO`
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Item is already in your cart" }`
  - `400 Bad Request`: `{ "error": "Item is no longer available for purchase" }`
  - `404 Not Found`: If listing does not exist.

### 3.3. Remove Item from Cart
- **Method**: `DELETE`
- **Path**: `/api/marketplace/cart/items/{listingId}`
- **Authentication**: Required
- **Response**: `200 OK` — Updated `CartDTO`

### 3.4. Clear Cart
- **Method**: `DELETE`
- **Path**: `/api/marketplace/cart`
- **Authentication**: Required
- **Response**: `204 No Content`

### 3.5. Checkout & Place Order
- **Method**: `POST`
- **Path**: `/api/marketplace/orders`
- **Authentication**: Required
- **Request Body**: `CreateOrderDTO`
  ```json
  {
    "recipientName": "Alice Johnson",
    "phoneNumber": "9876543210",
    "addressLine": "Flat 4B, Greenview Towers, RS Puram",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "postalCode": "641002",
    "paymentMethod": "DEMO_CHECKOUT",
    "listingIds": [101]
  }
  ```
  *(Note: If `listingIds` is omitted or empty, all available items in the user's cart are checked out).*
- **Response**: `201 Created` — `OrderDetailDTO`
  ```json
  {
    "id": 501,
    "orderNumber": "ORD-2026-ABCD1234",
    "status": "PLACED",
    "paymentStatus": "PENDING",
    "paymentMethod": "DEMO_CHECKOUT",
    "subtotal": 18500.00,
    "totalAmount": 18500.00,
    "recipientName": "Alice Johnson",
    "phoneNumber": "9876543210",
    "addressLine": "Flat 4B, Greenview Towers, RS Puram",
    "city": "Coimbatore",
    "state": "Tamil Nadu",
    "postalCode": "641002",
    "placedAt": "2026-09-22T10:00:00",
    "items": [
      {
        "id": 701,
        "listingId": 101,
        "titleSnapshot": "Refurbished ThinkPad T480",
        "priceAtPurchase": 18500.00,
        "warrantyDaysSnapshot": 90
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": "Cart is empty" }`
  - `400 Bad Request`: `{ "error": "One or more items in your cart have already been purchased or reserved by another buyer" }`

### 3.6. Get My Orders
- **Method**: `GET`
- **Path**: `/api/marketplace/orders`
- **Authentication**: Required
- **Response**: `200 OK` — `List<OrderDetailDTO>`

### 3.7. Get Order Detail
- **Method**: `GET`
- **Path**: `/api/marketplace/orders/{id}`
- **Authentication**: Required
- **Response**: `200 OK` — `OrderDetailDTO`
- **Error Responses**:
  - `403 Forbidden`: If order belongs to another user.
  - `404 Not Found`: If order does not exist.

### 3.8. Cancel Order
- **Method**: `POST`
- **Path**: `/api/marketplace/orders/{id}/cancel?reason={reason}`
- **Authentication**: Required
- **Query Parameter**: `reason` (string, optional)
- **Response**: `200 OK` — `OrderDetailDTO` (Status: `CANCELLED`, Inventory rolled back to `AVAILABLE`)
- **Error Responses**:
  - `400 Bad Request`: If order is already `SHIPPED` or `DELIVERED`.
  - `403 Forbidden`: If user does not own the order.

---

## 4. Recycler Facility Marketplace Endpoints

- **Base Path**: `/api/recycler/marketplace`
- **Authorization**: `RECYCLER` or `ADMIN` role required.

| Method | Path | Request Body / Params | Response | Description |
|---|---|---|---|---|
| `GET` | `/candidates` | None | `List<MarketplaceCandidateDTO>` | List devices with QC PASS ready for listing draft |
| `POST` | `/listings` | `CreateListingDraftDTO` | `201 Created` (`ListingDetailDTO`) | Create new draft listing for candidate |
| `GET` | `/listings` | `status` (optional `MarketplaceListingStatus`) | `List<ListingSummaryDTO>` | List listings created by current recycler hub |
| `GET` | `/listings/{id}` | None | `ListingDetailDTO` | Management details for single listing |
| `PUT` | `/listings/{id}` | `UpdateListingDraftDTO` | `ListingDetailDTO` | Update editable draft or rejected listing |
| `POST` | `/listings/{id}/submit` | None | `ListingDetailDTO` | Submit draft to Admin for approval |
| `POST` | `/listings/{id}/withdraw` | None | `ListingDetailDTO` | Withdraw listing from marketplace |
| `POST` | `/orders/{id}/fulfill` | `status` (`CONFIRMED`, `SHIPPED`, `DELIVERED`) | `OrderDetailDTO` | Update shipment & delivery status (`SOLD != PAID`) |

---

## 5. Admin Marketplace Approval Endpoints

- **Base Path**: `/api/admin/marketplace`
- **Authorization**: `ADMIN` role required.

| Method | Path | Request Body / Params | Response | Description |
|---|---|---|---|---|
| `GET` | `/listings` | `status` (optional, e.g. `PENDING_APPROVAL`) | `List<ListingSummaryDTO>` | View all listings across all facilities |
| `POST` | `/listings/{id}/review` | `ListingApprovalDTO` (`{ approved, rejectionReason, adjustedSellingPrice }`) | `ListingDetailDTO` | Approve & publish to catalog or reject with reason |
| `GET` | `/orders` | `status` (optional `MarketplaceOrderStatus`) | `List<OrderDetailDTO>` | Audit all marketplace orders across system |

---

## 6. Endpoints Not Yet Implemented (Explicitly Stated)

- `POST /api/marketplace/payment/initiate` (Payment Gateway Gateway Integration — NOT IMPLEMENTED)
- `POST /api/marketplace/payment/webhook` (Payment Provider Webhook — NOT IMPLEMENTED)
- `POST /api/marketplace/payment/verify` (Manual / Gateway Payment Confirmation — NOT IMPLEMENTED)

Any UI must clearly display payment as **Pending**, honoring the strict rule: **`SOLD ≠ PAID`**.
