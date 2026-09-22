# Frontend Module 9 Component Reuse & Integration Plan

## 1. Overview

To preserve the editorial visual identity of the Smart E-Waste Management System and prevent code bloat, all upcoming frontend phases (Marketplace, Cart, Checkout, Orders, Recycler Workflow, Admin Approval) will strictly reuse the existing design tokens, components, and CSS patterns.

No new CSS frameworks or redundant state management libraries will be introduced.

---

## 2. Component & Style Reuse Mapping Matrix

| Existing Element / Component | Location | Future Feature Reusing It | Implementation Role |
|---|---|---|---|
| **Editorial Layout Grids**<br>`grid-split-60-40`, `grid-split-50-50` | `src/index.css` | **Product Detail Page**, **Order Detail Page**, **Admin Review Console** | Asymmetric presentation of product gallery / device specs, order summaries, and diagnostic findings. |
| **Thin Rule Separators**<br>`thin-rule`, `thin-rule-dark` | `src/index.css` | **Marketplace Catalog**, **Cart**, **Checkout**, **Orders** | Hairline section dividers maintaining the strict "zero card boxes" editorial aesthetic. |
| **Editorial Timeline**<br>`editorial-timeline`, `editorial-timeline-row` | `src/index.css` | **Device Journey Component**, **Order Fulfillment Tracker** | Visual step-by-step rendering of circular life history (`COLLECTED` → `ASSESSED` → `QUALITY_CHECK` → `SOLD`) and order progress. |
| **Editorial Table**<br>`editorial-table`, `table-custom` | `src/index.css` | **Cart Items**, **My Orders List**, **Recycler Candidates**, **Admin Listings** | Clean tabular layout with minimal padding, uppercase column headers, and subtle row hover. |
| **Action Buttons**<br>`btn-primary-custom`, `btn-outline-custom` | `src/index.css` | **Add to Cart**, **Place Order**, **Submit Draft**, **Approve / Reject Listing** | High-contrast mineral green action triggers with uppercase micro-spaced typography. |
| **Editorial Forms & Controls**<br>`form-control`, `form-select`, `form-label` | `src/index.css` | **Checkout Shipping Form**, **Draft Listing Editor**, **Admin Approval Adjustment** | Form controls with focus rings, subtle borders, and uppercase field labels. |
| **Status Dots & Badges**<br>`status-dot`, `status-badge`, `badge.bg-emerald` | `src/index.css` | **Stock Badges** (`AVAILABLE`, `RESERVED`, `SOLD`), **Order Statuses**, **Cosmetic Grades** | Micro status indicators providing immediate clarity without visual clutter. |
| **RecommendationCard** | `src/components/RecommendationCard.jsx` | **Device Intake**, **Request Details**, **Technician Assessment** | Displaying ML recommendations, confidence, safety hazard warnings, and handling advice. |
| **NotificationBell** | `src/components/NotificationBell.jsx` | **HeaderNav** | Alerts citizen when order is confirmed/shipped, and alerts recycler/admin of order activities. |
| **Loading Indicators**<br>`spinner-border text-emerald` | `src/components/ProtectedRoute.jsx` | **Catalog Search**, **Checkout Submission**, **Order Processing** | Clean loading feedback during network requests. |
| **Alert Banners**<br>`alert alert-danger / alert-warning` | `src/pages/UserDashboard.jsx` | **Payment Status Disclaimer** (`Payment: PENDING`), **Cart Error Banners** | Dismissible feedback banners. |
| **Currency & Date Formatters**<br>`formatCurrency`, `formatIndianDate` | `src/utils/workflowHelpers.js` | **Product Prices**, **Cart Subtotal**, **Order Placed Dates** | Consistent INR currency (`₹18,500`) and Indian date format (`22 Sep 2026`). |
| **Enum Mappings**<br>`getEnumLabel`, `getEnumBadgeClass` | `src/utils/enumMappings.js` | **All Upcoming Features** | Human-readable labels for `CosmeticGrade`, `StockStatus`, `PaymentStatus`, `OrderStatus`. |
| **Unified API Client**<br>`apiClient`, `marketplaceApi`, `cartApi` | `src/api/apiClient.js` | **All Upcoming Features** | Automated JWT token injection and clean endpoint method calls. |

---

## 3. Navigation Bar Integration Plan

When Phase 9B/9C is activated, `HeaderNav` in `src/App.jsx` will be extended with:
1. **Public Marketplace Link**:
   - Label: `Marketplace` (Route: `/marketplace`)
   - Visible to all users (public and authenticated).
2. **Customer Cart Icon / Counter**:
   - Label: `Cart (N)` (Route: `/cart`)
   - Visible to authenticated users, updating dynamically from `cartApi.getCart()`.
3. **Role Specific Sub-links**:
   - For `RECYCLER`: Link to `Facility Marketplace` (`/recycler/marketplace`).
   - For `ADMIN`: Link to `Marketplace Review` (`/admin/marketplace`).

---

## 4. Anti-Duplication Rule

- **Do NOT** create separate styling classes for marketplace buttons; use `.btn-primary-custom` and `.btn-outline-custom`.
- **Do NOT** duplicate status badge definitions; import `MARKETPLACE_STOCK_STATUS_MAP` and `MARKETPLACE_ORDER_STATUS_MAP` from `src/utils/enumMappings.js`.
- **Do NOT** implement custom Axios calls inside individual components; call methods on `marketplaceApi`, `cartApi`, `orderApi`, `recyclerApi`, and `adminApi` in `src/api/apiClient.js`.
