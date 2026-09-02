import React, { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import axios from 'axios'

function Home() {
  const [apiStatus, setApiStatus] = useState({ loading: true, data: null, error: null })

  useEffect(() => {
    axios.get('/api/v1/health')
      .then(res => {
        setApiStatus({ loading: false, data: res.data, error: null })
      })
      .catch(err => {
        setApiStatus({ 
          loading: false, 
          data: null, 
          error: err.message || 'Unable to connect to Spring Boot backend' 
        })
      })
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <div className="hero-card">
        <span className="hero-tag">⚡ Smart Circular Economy</span>
        <h1 className="hero-title">Smart E-Waste Collection &amp; Recycling Platform</h1>
        <p className="hero-description">
          An enterprise full-stack platform transforming e-waste logistics, pickup scheduling, automated recycling tracking, and eco-rewards management.
        </p>
        <div className="hero-actions">
          <a href="#architecture" className="btn-primary-custom">
            <i className="bi bi-diagram-3-fill"></i> View Architecture
          </a>
          <a href="#api-health" className="btn-outline-custom">
            <i className="bi bi-activity"></i> Backend Health API
          </a>
        </div>
      </div>

      {/* Grid Features */}
      <div className="features-grid" id="architecture">
        <div className="feature-card">
          <div className="feature-icon">
            <i className="bi bi-truck"></i>
          </div>
          <h3 className="feature-title">Pickup Scheduling</h3>
          <p className="feature-text">
            Schedule door-to-door e-waste collections, assign automated logistics routes, and manage collector dispatches seamlessly.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <i className="bi bi-recycle"></i>
          </div>
          <h3 className="feature-title">Recycling Lifecycle</h3>
          <p className="feature-text">
            Track hazardous material extraction, component recovery rates, and compliant facility processing in real-time.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <i className="bi bi-award"></i>
          </div>
          <h3 className="feature-title">Eco-Credit Rewards</h3>
          <p className="feature-text">
            Incentivize user participation through transparent carbon credit calculation and digital reward points allocation.
          </p>
        </div>
      </div>

      {/* Backend API Health Section */}
      <div className="api-status-card" id="api-health">
        <div className="status-header">
          <h4 className="m-0 text-white font-weight-bold">
            <i className="bi bi-server text-success me-2"></i> Spring Boot REST Integration Status
          </h4>
          <span className="status-badge">
            <span className="pulse-dot"></span> API Gateway Ready
          </span>
        </div>
        <p className="text-muted mb-3">
          Real-time check connecting React frontend with Spring Boot <code>/api/v1/health</code> backend endpoint:
        </p>
        <div className="status-code-block">
          {apiStatus.loading ? (
            <span>Connecting to backend service...</span>
          ) : apiStatus.error ? (
            <span className="text-warning">
              ℹ Backend Status: {apiStatus.error} (Start backend with <code>./mvnw spring-boot:run</code> to test live endpoint)
            </span>
          ) : (
            <pre className="m-0 text-success">{JSON.stringify(apiStatus.data, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  )
}

function ArchitectureDocs() {
  return (
    <div className="hero-card">
      <span className="hero-tag">🏗 Technical Architecture</span>
      <h2 className="hero-title">Full-Stack Blueprint</h2>
      <div className="mt-4 text-muted">
        <h4 className="text-white mb-3">Backend Specifications</h4>
        <ul className="mb-4">
          <li><strong>Framework:</strong> Spring Boot 3.4.3 (Java 17 / 21 / 25 compatible)</li>
          <li><strong>Base Package:</strong> <code>com.ewaste.management</code></li>
          <li><strong>Modules:</strong> Spring Web, Spring Data JPA, Spring Security, Validation, PostgreSQL Driver</li>
          <li><strong>Port:</strong> Configurable via <code>PORT</code> env var (Default: 8080)</li>
        </ul>

        <h4 className="text-white mb-3">Frontend Specifications</h4>
        <ul className="mb-4">
          <li><strong>Framework:</strong> React + Vite</li>
          <li><strong>Routing:</strong> <code>react-router-dom</code></li>
          <li><strong>API Client:</strong> <code>axios</code> with Vite proxy configuration</li>
          <li><strong>Styling:</strong> Vanilla CSS + Bootstrap 5 responsive layout</li>
        </ul>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="app-wrapper">
      {/* Header Navigation */}
      <header className="navbar-custom">
        <div className="nav-container">
          <Link to="/" className="brand-logo">
            <div className="brand-icon">
              <i className="bi bi-arrow-repeat"></i>
            </div>
            Smart E-Waste System
          </Link>
          <ul className="nav-links">
            <li>
              <Link to="/" className="nav-link-item active">Home</Link>
            </li>
            <li>
              <Link to="/architecture" className="nav-link-item">Architecture</Link>
            </li>
          </ul>
          <div className="status-badge">
            <span className="pulse-dot"></span> System Initialized
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/architecture" element={<ArchitectureDocs />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="footer-custom">
        <div className="container">
          <p className="m-0">
            &copy; 2026 Smart E-Waste Collection &amp; Recycling Management System. Built with Spring Boot &amp; React Vite.
          </p>
        </div>
      </footer>
    </div>
  )
}
