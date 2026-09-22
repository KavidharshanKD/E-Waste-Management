# Smart E-Waste Collection & Recycling Management System

A production-ready, full-stack enterprise application engineered to solve urban electronic waste challenges through smart disposal recommendations, location-based recycling center discovery, doorstep pickup scheduling, public QR lifecycle tracking, institutional bulk disposal, gamified green points rewards, digital recycling certificates, environmental impact analytics, and India-focused e-waste compliance support.

---

## 📌 Overview

The **Smart E-Waste Collection & Recycling Management System** connects individual citizens, commercial institutions, logistics collectors, registered recycling facilities, and system administrators on a single unified platform. By digitizing the end-to-end lifecycle of discarded electronics, the system prevents informal dumping, incentivizes safe recycling, and promotes environmental sustainability.

---

## ⚠️ Problem Statement

Electronic waste (e-waste) is one of the fastest-growing waste streams globally and in India. Key challenges include:
- **Lack of Awareness**: Citizens and organizations often do not know whether a device should be repaired, refurbished, reused, or recycled.
- **Informal Disposal Risks**: Dumping e-waste in informal sectors leads to hazardous chemical exposure (lead, mercury, cadmium) and toxic open-air burning.
- **Logistical Friction**: Lack of scheduled doorstep collection options deters citizens from sending items to authorized recyclers.
- **Institutional Friction**: Schools, colleges, and corporate offices struggle to process bulk disposals transparently.
- **Lack of Traceability & Trust**: Disposers cannot verify if their electronics were safely recycled according to regulatory frameworks (e.g., CPCB E-Waste Rules 2022).

---

## 💡 Proposed Solution

Our solution provides a comprehensive digital platform featuring:
1. **Smart Recommendation Engine**: Evaluates item category, condition, working status, and age to recommend optimal eco-friendly actions (Repair, Reuse, Donate, Refurbish, or Recycle).
2. **Doorstep Pickup & Collector Dispatch**: Enables citizens and institutions to schedule convenient pickup times with assigned logistics personnel.
3. **Public QR Lifecycle Tracking**: Generates unique tracking numbers and QR codes for real-time visibility from collection to final recycling.
4. **Institutional Bulk Disposal**: Supports bulk item submission and CSV bulk uploads for colleges, corporate offices, and institutions.
5. **Gamified Eco-Credits (Green Points)**: Rewards disposers with green points and eco-tiers (Seedling, Eco Warrior, Green Champion, Planet Savior).
6. **Verifiable Digital Certificates**: Issues tamper-evident recycling certificates with QR codes for institutional compliance and ESG reporting.
7. **India-Focused E-Waste Compliance Support**: Provides educational guidelines, EPR (Extended Producer Responsibility) insights, and registered recycler verification references.

---

## ✨ Key Features

- **Smart Disposal Recommendations**: Automated decision engine analyzing device age, condition, and category.
- **Location-Based Recycling Center Discovery**: Interactive search and filtering for registered recycling facilities by city and postal code.
- **Doorstep Pickup Scheduling**: Convenient date and time-slot selection for individual and bulk collections.
- **QR Lifecycle Tracking**: Transparent status progression (`SUBMITTED` → `APPROVED` → `SCHEDULED` → `ON_THE_WAY` → `COLLECTED` → `IN_TRANSIT` → `PROCESSING` → `COMPLETED`).
- **Green Points & Rewards**: Automated point crediting upon recycling completion with tier progression.
- **Digital Recycling Certificates**: Downloadable digital certificates with unique hash verification codes for compliance.
- **Environmental Analytics**: Real-time metrics calculating total e-waste recycled, CO2 emissions offset, toxic materials diverted, and metals recovered.
- **Institutional Bulk Disposal**: Support for institutional disclaimers, GST numbers, contact persons, and multi-category CSV bulk uploads with preview validation.
- **India-Focused Compliance Support**: Informational modules explaining CPCB E-Waste Management Rules 2022, EPR concepts, safe battery handling, and registered recycler importance.

---

## 👥 User Roles

1. **Individual Citizen (`USER`)**: Submit e-waste items, view smart recommendations, schedule pickups, track request status via QR, earn green points, and download recycling certificates.
2. **Institutional Disposer (`USER` with `INSTITUTION` type)**: Perform bulk e-waste disposals, upload multi-item CSV files, manage institutional profile data, and access downloadable compliance reports.
3. **Collector / Logistics Partner (`COLLECTOR`)**: View assigned pickup tasks, navigate to pickup locations, update real-time collection statuses (`ON_THE_WAY`, `COLLECTED`), and add field notes.
4. **Recycler Facility Manager (`RECYCLER`)**: Receive collected e-waste shipments, log weight and processing details, complete recycling, and trigger automated reward crediting and certificate generation.
5. **System Administrator (`ADMIN`)**: Access full system metrics, manage users/collectors/recyclers/centers, approve/reject disposal requests, assign collectors, inspect audit logs, and maintain compliance records.

---

## 🏗 Architecture

The system follows a modern decoupled client-server architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    React SPA Frontend                   │
│           (React 18, React Router, Vite, Bootstrap)     │
└────────────────────────────┬────────────────────────────┘
                             │ REST API (HTTPS / JSON / JWT)
┌────────────────────────────▼────────────────────────────┐
│                  Spring Boot Backend REST API           │
│       (Java 17/21/25, Spring Security, JPA/Hibernate)  │
└────────────────────────────┬────────────────────────────┘
                             │ SQL Queries (Flyway Migrations)
┌────────────────────────────▼────────────────────────────┐
│                    PostgreSQL Database                  │
│               (Persistent Relational Storage)            │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Technology Stack

- **Frontend**: React 18, Vite 6, React Router DOM 6, Axios, Bootstrap 5, Bootstrap Icons
- **Backend**: Java 17+, Spring Boot 3.4, Spring Security, Spring Data JPA, Hibernate, Flyway DB Migration, JJWT
- **Database**: PostgreSQL (Production/Docker), H2 (In-Memory Testing)
- **Containerization**: Docker, Docker Compose, Nginx (Reverse Proxy)
- **Build Tools**: Maven (`mvnw`), Node.js / NPM

---

## 🗄️ Database Design

The relational database is configured with versioned SQL migrations (`V1__init_schema.sql` to `V11`):

```mermaid
erDiagram
    users ||--o| user_profiles : "has profile"
    users ||--o| recyclers : "operates as"
    users ||--o{ disposal_requests : "submits"
    users ||--o{ pickups : "assigned as collector"
    users ||--o{ reward_transactions : "earns/redeems"
    users ||--o{ notifications : "receives"
    
    recycling_centers ||--o{ recyclers : "hosts"
    recycling_centers ||--o{ disposal_requests : "assigned to"
    
    disposal_requests ||--|{ ewaste_items : "contains"
    disposal_requests ||--o| pickups : "scheduled for"
    disposal_requests ||--o{ disposal_status_histories : "tracks"
    disposal_requests ||--o| recycling_certificates : "generates"
    
    recyclers ||--o{ recycling_certificates : "issues"
```

### Core Entities:
- **`users`**: System login accounts (Email, Password Hash, Role, Active State).
- **`user_profiles`**: Individual and institutional details (Name, Phone, Address, Organization, GST).
- **`disposal_requests`**: Master disposal record (Tracking Number, Status, Recommended Action, Verification Code).
- **`ewaste_items`**: Line items within a disposal request (Category, Brand, Quantity, Age, Condition).
- **`pickups`**: Doorstep logistics record (Scheduled Date, Time Slot, Collector ID, Status).
- **`disposal_status_histories`**: Audit trail recording every status change timestamp and actor.
- **`recyclers` & `recycling_centers`**: Registered recycling facility profiles and capacities.
- **`recycling_certificates`**: Digital verifiable recycling certificates (Certificate Number, Recycled Weight).
- **`reward_transactions`**: Ledger for green points earned and redeemed.
- **`notifications`**: In-app notifications triggered during lifecycle events.

---

## 🔄 Application Workflow

```
[ Citizen / Institution ] ──► Submit Disposal Request (Single / CSV Bulk)
                                       │
                                       ▼
                       [ Smart Recommendation Engine ]
                                       │
                                       ▼
[ Citizen / Institution ] ──► Schedule Doorstep Pickup
                                       │
                                       ▼
       [ Admin ] ──────────► Approve Request & Assign Collector
                                       │
                                       ▼
     [ Collector ] ────────► Update Status to ON_THE_WAY -> COLLECTED
                                       │
                                       ▼
      [ Recycler ] ────────► Receive Shipment & Mark PROCESSING -> COMPLETED
                                       │
                                       ├──────────► Green Points Credited
                                       └──────────► Digital Certificate Issued
```

---

## 🖼️ Screenshots

| Section | Preview Placeholder |
| :--- | :--- |
| **Landing Page** | *[ Landing Hero, How It Works, Environmental Impact Stats ]* |
| **User Dashboard** | *[ Request Overview, Active Pickups, Eco-Tier Badge & Green Points ]* |
| **Bulk E-Waste Disposal** | *[ Multi-Category Form, CSV Bulk Upload & Validation Preview ]* |
| **Collector Portal** | *[ Assigned Pickups List, Route Details & Status Update Modal ]* |
| **Recycler Hub** | *[ Incoming Shipments, Weight Entry & Recycling Completion ]* |
| **Admin Control Panel** | *[ Analytics Cards, User/Collector Management, Request Approval ]* |
| **Public QR Tracking** | *[ Live Visual Progress Bar, Timeline History & Recommendation ]* |
| **Recycling Certificate** | *[ Verifiable Digital Certificate with Verification QR Code ]* |

---

## 📦 Installation

### Prerequisites
- **Git**: Installed and configured.
- **Docker & Docker Compose**: Installed for containerized deployment (Recommended).
- **Java JDK 17+** and **Node.js 18+**: Required only for manual local setup.

### Clone Repository
```bash
git clone https://github.com/KavidharshanKD/E-Waste-Management.git
cd "E-Waste Management System"
```

---

## 🔐 Environment Variables

Create `.env` file from `.env.example`:

```bash
# Copy example configuration template
cp .env.example .env
```

### Reference Variables (`.env`)
| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `POSTGRES_DB` | PostgreSQL Database Name | `ewastedb` |
| `POSTGRES_USER` | PostgreSQL Database User | `ewaste_user` |
| `POSTGRES_PASSWORD` | PostgreSQL Database Password | `ewaste_password_change_in_production` |
| `POSTGRES_PORT` | PostgreSQL Host Port | `5432` |
| `SPRING_PROFILES_ACTIVE` | Spring Boot Active Profile | `prod` |
| `BACKEND_PORT` | Backend API Server Host Port | `8080` |
| `FRONTEND_PORT` | Frontend React Web App Host Port | `5173` |
| `JWT_SECRET` | JWT Token Base64 Signing Key | `dGhpcyBpcyBhIHZhbGlkIGJhc2U2NCBzZWNyZXQga2V5IDEyMzQ1Njc4OTA=` |

---

## 🏃 Running Locally (Development Mode)

### Backend Setup (Spring Boot)
```bash
cd backend

# Run tests
./mvnw test          # On Linux/macOS
mvnw.cmd test        # On Windows

# Start Spring Boot application
./mvnw spring-boot:run     # On Linux/macOS
mvnw.cmd spring-boot:run   # On Windows
```
The backend API will be available at [http://localhost:8080](http://localhost:8080).

### Frontend Setup (React SPA)
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production assets
npm run build
```
The frontend SPA will be available at [http://localhost:5173](http://localhost:5173).

---

## 🐳 Running with Docker (Recommended)

Run the full production stack (PostgreSQL + Spring Boot + React SPA) with a single command:

```bash
docker compose up --build
```

### Access Services:
- **Frontend SPA**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **API Health Check**: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

To stop containers:
```bash
docker compose down
```

---

## 🌐 API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | User/Institution Registration | Public |
| `POST` | `/api/auth/login` | User Authentication (Returns JWT Token) | Public |
| `GET` | `/api/public/track/{trackingNumber}` | Public E-Waste Tracking & Recommendation | Public |
| `GET` | `/api/public/verify-certificate/{certNumber}` | Public Recycling Certificate Verification | Public |
| `GET` | `/api/marketplace/listings` | Public Refurbished Electronics Catalog | Public |
| `GET` | `/api/marketplace/listings/{id}` | Public Listing Details & Circular Journey | Public |
| `POST` | `/api/user/ewaste` | Submit E-Waste Request (ML Assisted) | `USER` |
| `POST` | `/api/user/pickups` | Schedule Doorstep Pickup | `USER` |
| `GET` | `/api/marketplace/cart` | View Refurbished Cart | Authenticated |
| `POST` | `/api/marketplace/cart/items` | Add Unique Serialized Device to Cart | Authenticated |
| `POST` | `/api/marketplace/orders` | Atomic Checkout (Pessimistic Locking) | Authenticated |
| `GET` | `/api/marketplace/orders` | Customer Order History & Tracking | Authenticated |
| `GET` | `/api/collector/pickups` | View Assigned Logistics Pickups | `COLLECTOR` |
| `PUT` | `/api/collector/pickups/{id}/status` | Update Collection Status & Hazard Notes | `COLLECTOR` |
| `GET` | `/api/recycler/requests/pending-assessment` | Facility Intake Triage Queue | `RECYCLER` |
| `POST` | `/api/recycler/requests/{id}/assessment` | Record Physical Technician Assessment | `RECYCLER` |
| `GET` | `/api/recycler/restorations` | Active Restoration & Repair Benches | `RECYCLER` |
| `PATCH` | `/api/recycler/restorations/{id}/start` | Transition Restoration to In-Progress | `RECYCLER` |
| `PATCH` | `/api/recycler/restorations/{id}/complete` | Complete Bench Restoration & Log Parts | `RECYCLER` |
| `POST` | `/api/recycler/restorations/{id}/quality-check` | Submit Multi-Point Bench QC Inspection | `RECYCLER` |
| `GET` | `/api/recycler/marketplace/candidates` | Eligible Marketplace Candidates | `RECYCLER` |
| `POST` | `/api/recycler/marketplace/listings` | Create Recycler Listing Draft | `RECYCLER` |
| `POST` | `/api/recycler/marketplace/listings/{id}/submit` | Submit Draft for Admin Review | `RECYCLER` |
| `POST` | `/api/admin/marketplace/listings/{id}/review` | Admin Approve/Publish or Reject Listing | `ADMIN` |
| `GET` | `/api/admin/marketplace/orders` | Master Order Ledger Across Centers | `ADMIN` |

---

## 🌐 Production Architecture & Deployment Topology

- **Frontend (`Vercel`)**: React 18 + Vite SPA client with `vercel.json` rewrite routing, CSS design system, and dynamic role-based console routing.
- **Backend (`Render`)**: Spring Boot 3 + Java 17 REST API container with Flyway migration automation (V1 through V15), Spring Security stateless JWT authentication, and CORS origin pattern matching (`https://*.vercel.app`).
- **Database (`Supabase`)**: Managed PostgreSQL 15 cloud database maintaining referential integrity across users, requests, assessments, quality checks, listings, and orders.
- **ML Inference (`FastAPI / Local Docker`)**: Python Scikit-learn microservice (`http://localhost:8000/predict`) containerized with automated fallback to deterministic rule engines upon network timeout or server unavailability.

---

## ⚠️ Genuine Architectural Boundaries & Current System Limitations

To preserve absolute engineering integrity, the system adheres to truthful state reporting:
1. **No Real Payment Gateway Integration**: There is no live commercial payment processor (e.g. Razorpay or Stripe). All marketplace orders are placed in an honest `PENDING` payment status. The system explicitly maintains the invariant **`SOLD ≠ PAID`** and never fabricates transaction identifiers or fake bank confirmations.
2. **Deterministic Safety Precedence**: Stage 0 safety rules (swollen batteries, leaking cells, fire evidence) immediately enforce `SPECIAL_HANDLING` containment and bypass all ML models and refurbishment workflows.
3. **Operator-Determined Commercial Pricing**: Resale prices and warranty durations are set by authorized recycling facility technicians and audited by system administrators; no synthetic pricing formulas or fake discounts are fabricated.
4. **Physical Cosmetic Grading**: Grades (`GRADE_A`, `GRADE_B`, `GRADE_C`) are assigned through hands-on bench functional and cosmetic testing during Quality Control, not predicted by AI algorithms.
5. **Zero Citizen PII in Public Journey**: The circular device journey displays genuine facility processing timestamps while strictly redacting citizen donor names, addresses, and contact numbers.

---

## ⚠️ Disclaimer

- Registration information should be independently verified with the relevant authority.
- This application is an independent educational/portfolio demonstration and does not claim direct integration with CPCB or any government system unless an explicit API integration exists.

---

## 🧑‍💻 Author

**Kavidharshan**
- GitHub: [@KavidharshanKD](https://github.com/KavidharshanKD)
