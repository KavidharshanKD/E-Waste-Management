# Smart E-Waste Collection & Recycling Management System

A full-stack solution for managing e-waste collection, pickup scheduling, automated recycling workflow tracking, and eco-credit rewards.

---

## 🏗 Architecture Overview

```
E-Waste-Management/
├── backend/                # Spring Boot REST API (Java 17+, Maven, JPA, Security, PostgreSQL)
│   ├── src/main/java/com/ewaste/management/
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── .env.example
├── frontend/               # React + Vite Frontend (React Router, Axios, Bootstrap)
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── docker-compose.yml       # Multi-container orchestration (Backend, Frontend, PostgreSQL)
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Java**: JDK 17 or higher
- **Node.js**: v18 or higher (with `npm`)
- **PostgreSQL**: Local instance or via Docker

---

## ⚙️ Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment configuration template:
   ```bash
   cp .env.example .env
   ```

3. Run the application:

   **Linux / macOS:**
   ```bash
   ./mvnw spring-boot:run
   ```

   **Windows:**
   ```cmd
   mvnw.cmd spring-boot:run
   ```

   > The API server starts by default at `http://localhost:8080`.
   > Health check endpoint: `http://localhost:8080/api/v1/health`

---

## 💻 Frontend Setup (React Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment configuration template:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   > The application will be accessible at `http://localhost:5173`.

---

## 🐳 Docker Deployment

To launch the full stack (PostgreSQL + Spring Boot + React Vite) with Docker Compose:

```bash
docker-compose up --build
```

---

## 🔐 Environment Variables

Environment variables are managed dynamically via `.env` files (never committed to repository):
- Backend configuration: `backend/.env.example`
- Frontend configuration: `frontend/.env.example`
