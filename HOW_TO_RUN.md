# How to Run the Smart E-Waste Collection & Recycling Management System

A comprehensive, step-by-step guide to run the complete circular e-waste platform locally on your machine.

---

## 🏗️ System Architecture & Services

The system comprises three coordinated services:

| Component | Technology | Default Port | Health / Entry URL |
|---|---|---|---|
| **Frontend UI** | React 18 + Vite | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | Spring Boot 3 + Java 17 + Flyway | `8080` | [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health) |
| **ML Inference Service** | Python 3 + FastAPI + Scikit-Learn | `8000` | [http://localhost:8000/health](http://localhost:8000/health) |

> **Note:** By default, the backend runs with an embedded **H2 in-memory database** and auto-executes all Flyway migrations (`V1` through `V16`). Zero external database setup is required to run the full application locally!

---

## 📋 Prerequisites

Before running, ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **Java Development Kit (JDK)**: `JDK 17` or higher ([Download Temurin JDK 17](https://adoptium.net/))
- **Apache Maven**: `3.8+` (or use system `mvn`)
- **Python**: `3.10+` with `pip` ([Download Python](https://www.python.org/))

---

## 🚀 Quick Start: Running in 3 Easy Steps

Open **three separate terminal windows** (PowerShell or Bash) from the project root folder:

### Terminal 1: Start the ML Inference Microservice
```bash
# 1. Navigate to ml-service folder
cd ml-service

# 2. (Optional) Activate virtual environment if configured, or install requirements
pip install -r requirements.txt

# 3. Start the FastAPI microservice
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
✅ **Verification:** Open [http://localhost:8000/health](http://localhost:8000/health) — should return `{"status": "UP", "models_loaded": true}`.

---

### Terminal 2: Start the Spring Boot Backend Server
```bash
# 1. Navigate to backend folder
cd backend

# 2. Launch the backend application
mvn spring-boot:run
```
✅ **Verification:** Open [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health) — should return `{"status": "UP", "environment": "development"}`.

---

### Terminal 3: Start the React Frontend Application
```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Install dependencies (if not already done)
npm install

# 3. Launch Vite development server
npm run dev
```
✅ **Verification:** Open [http://localhost:5173](http://localhost:5173) in your browser!

---

## 🔑 Pre-Configured Test Accounts & Roles

The system automatically seeds initial demonstration accounts via Flyway migration `V2`:

| Role | Email | Password | Access Rights & Portals |
|---|---|---|---|
| **System Administrator** | `admin@ewaste.com` | `admin123` | `/admin/dashboard` — Master metrics, pickup assignment, request approvals, and marketplace review. |
| **Logistics Collector** | `collector@ewaste.com` | `collector123` | `/collector/dashboard` — View assigned pickups, update transit statuses, record hazard notes. |
| **Recycling Facility** | `recycler@ewaste.com` | `recycler123` | `/recycler/dashboard` — Physical diagnostic intake, repair benches, quality control (QC), marketplace candidate drafts. |
| **Resident Citizen** | `resident@ewaste.com` | `resident123` | `/user/dashboard` — Submit e-waste items with ML recommendations, order history, track device journey. |

> **Pro-Tip:** You can also register a brand-new citizen account directly from the UI at [http://localhost:5173/register](http://localhost:5173/register)!

---

## 🔄 End-to-End Circular Workflow Walkthrough

Experience the complete lifecycle from citizen donation to certified refurbished marketplace resale:

1. **Intake & Smart Recommendation:**
   - Log in as Citizen (`resident@ewaste.com` / `resident123`).
   - Navigate to **Dispose E-Waste** (`/user/ewaste/add`).
   - Select device category (e.g. `LAPTOP`), condition, and user intention (`REFURBISH_AND_SELL`).
   - Observe live **ML Recommendation** with recovery probabilities, explanation, and safety handling advice.
   - Submit the request and schedule a doorstep collection pickup.

2. **Logistics Collection:**
   - Log in as Collector (`collector@ewaste.com` / `collector123`).
   - Open `/collector/dashboard`.
   - View assigned pickups, observe battery/hazard containment alerts, and update status from `SCHEDULED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`.

3. **Facility Diagnostic Assessment:**
   - Log in as Recycler (`recycler@ewaste.com` / `recycler123`).
   - Open `/recycler/dashboard` and select the **Physical Assessment** tab.
   - Click **Perform Diagnostic** on the received device.
   - Record power state, screen condition, repairability status, and set decision to `REFURBISH`.

4. **Bench Restoration & Multi-Point QC:**
   - In `/recycler/dashboard`, switch to the **Restoration Benches** tab.
   - Click **Start Work** $\rightarrow$ status transitions to `IN_PROGRESS`.
   - Click **Complete Job**, enter actions taken (e.g. *Thermal paste renewal, keyboard replacement*), parts replaced, and costs.
   - Switch to the **Quality Check Station** tab.
   - Perform the multi-point inspection (Safety Test, Functional Test, Cosmetic Grade assignment: `GRADE_A`).
   - Submit QC with overall result: `PASS` and mark as **Recommended for Marketplace**.

5. **Marketplace Candidate & Recycler Draft:**
   - Switch to the **Marketplace Candidates** tab in `/recycler/dashboard`.
   - The QC-passed unit appears in the candidate queue.
   - Click **Create Draft Listing**, enter selling price and warranty months.
   - Click **Submit for Review** $\rightarrow$ status becomes `PENDING_APPROVAL`.

6. **Admin Audit & Approval:**
   - Log in as Admin (`admin@ewaste.com` / `admin123`).
   - Open `/admin/dashboard` and select the **Marketplace Review** tab.
   - Review device technical provenance, restoration parts, and QC certification.
   - Click **Approve & Publish** $\rightarrow$ listing is immediately published to the public marketplace.

7. **Public Marketplace & Atomic Checkout:**
   - Visit [http://localhost:5173/marketplace](http://localhost:5173/marketplace).
   - Filter by category or grade, inspect the published device.
   - Open product detail (`/marketplace/:id`) and view the verified **Circular Device Journey** timeline (zero donor PII).
   - Add to Cart, proceed to Checkout, and place order (Payment status accurately remains `PENDING` under `SOLD ≠ PAID` rules).

---

## 🧪 Running Automated Tests

### Frontend Tests (84 tests across 8 suites)
```bash
cd frontend
npm test
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

### Backend Regression Tests (172 tests, 0 failures)
```bash
cd backend
mvn test
```

---

## 🛠️ Configuration & Port Customization

### Backend (`backend/src/main/resources/application.yml`)
- Port: `${PORT:8080}`
- Database URL: `${SPRING_DATASOURCE_URL:jdbc:h2:mem:ewastedb;...}`
- JWT Secret: `${JWT_SECRET:...}`
- Frontend Origin: `${APP_FRONTEND_URL:http://localhost:5173}`
- ML Service URL: `${ML_SERVICE_BASE_URL:http://localhost:8000}`
- SMTP Mail Host: `${SPRING_MAIL_HOST:smtp.gmail.com}`
- SMTP Mail Port: `${SPRING_MAIL_PORT:587}`
- SMTP Username: `${SPRING_MAIL_USERNAME:your-email@gmail.com}`
- SMTP App Password: `${SPRING_MAIL_PASSWORD:your-app-passcode}`

> **Local Development Fallback:** If SMTP username and password are not set, the system automatically logs the generated 6-digit password reset OTP directly to the backend console/terminal, allowing seamless local development and testing without an immediate SMTP configuration!

### Frontend (`frontend/.env`)
Create `frontend/.env` to override the API target if needed:
```ini
VITE_API_BASE_URL=http://localhost:8080
```

---

## ❓ Frequently Asked Questions & Troubleshooting

**Q: Port 8080 or 5173 is already in use?**
- On Windows PowerShell, find and kill the process:
  ```powershell
  # Find PID using port 8080:
  Get-NetTCPConnection -LocalPort 8080 | Select-Object -Property OwningProcess
  # Stop the process:
  Stop-Process -Id <PID> -Force
  ```

**Q: Can the application run if the ML Service is offline?**
- **Yes!** The backend implements a resilient **3-Tier Hybrid Recommendation Engine**:
  1. *Tier 1:* Deterministic Java Safety Gate (fires first for physical hazards).
  2. *Tier 2:* FastAPI ML Microservice (if reachable).
  3. *Tier 3:* Rule-Based Fallback Engine (auto-engages if ML is offline or times out). The system will function with zero disruptions!

**Q: How do I connect to a real PostgreSQL / Supabase database?**
- Simply provide standard environment variables when running the backend:
  ```bash
  SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<dbname>
  SPRING_DATASOURCE_USERNAME=<user>
  SPRING_DATASOURCE_PASSWORD=<password>
  SPRING_DATASOURCE_DRIVER=org.postgresql.Driver
  mvn spring-boot:run
  ```
  Flyway will automatically initialize all 15 schema migrations!
