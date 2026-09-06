import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import AddEWaste from './pages/AddEWaste'
import MyRequests from './pages/MyRequests'
import RequestDetails from './pages/RequestDetails'
import EditProfile from './pages/EditProfile'
import FindRecyclingCenter from './pages/FindRecyclingCenter'
import CollectorDashboard from './pages/CollectorDashboard'
import RecyclerDashboard from './pages/RecyclerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import PublicTrack from './pages/PublicTrack'
import VerifyCertificate from './pages/VerifyCertificate'
import InstitutionDashboard from './pages/InstitutionDashboard'
import ComplianceSupport from './pages/ComplianceSupport'

import NotificationBell from './components/NotificationBell'

function HeaderNav() {
  const { user, logout, getDashboardPathByRole } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <header className="navbar-custom">
      <div className="nav-container">
        <Link to="/" className="brand-logo" aria-label="Smart E-Waste System Home">
          <div className="brand-icon" aria-hidden="true">
            <i className="bi bi-arrow-repeat"></i>
          </div>
          <span>Smart E-Waste</span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="d-lg-none btn btn-outline-custom p-1 px-2 border border-secondary text-white ms-auto me-2"
          type="button"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'} fs-4`}></i>
        </button>

        {/* Navigation Links */}
        <nav
          className={`nav-links-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}
          aria-label="Main Navigation"
        >
          <ul className="nav-links">
            <li>
              <Link to="/" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/recycling-centers" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                <i className="bi bi-geo-alt me-1" aria-hidden="true"></i> Find Centers
              </Link>
            </li>
            <li>
              <Link to="/compliance" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                <i className="bi bi-shield-check me-1" aria-hidden="true"></i> Compliance Guide
              </Link>
            </li>
            <li>
              <Link to="/architecture" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                Architecture
              </Link>
            </li>
            {user && (
              <>
                <li>
                  <Link
                    to={getDashboardPathByRole(user.role)}
                    className="nav-link-item active"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className="bi bi-speedometer2 me-1" aria-hidden="true"></i> Dashboard
                  </Link>
                </li>
                {user.profile?.userType === 'INSTITUTION' && (
                  <li>
                    <Link to="/institution/dashboard" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                      <i className="bi bi-building me-1" aria-hidden="true"></i> Bulk Portal
                    </Link>
                  </li>
                )}
                {(user.role === 'USER' || user.role === 'ADMIN') && (
                  <>
                    <li>
                      <Link to="/user/ewaste/add" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                        <i className="bi bi-plus-circle me-1" aria-hidden="true"></i> Add E-Waste
                      </Link>
                    </li>
                    <li>
                      <Link to="/user/requests" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                        <i className="bi bi-list-check me-1" aria-hidden="true"></i> My Requests
                      </Link>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
            {user ? (
              <div className="d-flex align-items-center gap-2">
                <NotificationBell />
                <span className="status-badge bg-dark border border-secondary text-white text-truncate" style={{ maxWidth: '180px' }}>
                  <span className="pulse-dot me-1" aria-hidden="true"></span>
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-custom py-1.5 px-3 btn-sm"
                  aria-label="Log out of account"
                >
                  <i className="bi bi-box-arrow-right me-1" aria-hidden="true"></i> Logout
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-outline-custom py-1.5 px-3 text-white text-decoration-none">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary-custom py-1.5 px-3 text-white text-decoration-none">
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

function Home() {
  const [apiStatus, setApiStatus] = useState({ loading: true, data: null, error: null })
  const { user, getDashboardPathByRole } = useAuth()

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
    <div className="landing-page-container">
      {/* 1. Hero Section */}
      <section className="hero-card mb-5" aria-labelledby="hero-heading">
        <span className="hero-tag">
          <i className="bi bi-patch-check-fill text-emerald me-1" aria-hidden="true"></i>
          India E-Waste Circular Economy Standard
        </span>
        <h1 id="hero-heading" className="hero-title mt-2">
          Smart E-Waste Collection &amp; Lifecycle Recycling Platform
        </h1>
        <p className="hero-description text-muted">
          Transform electronic waste management with doorstep pickup dispatches, verifiable public QR tracking, institutional bulk uploads, eco-point gamification, and digital recycling certificates.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to={getDashboardPathByRole(user.role)} className="btn btn-primary-custom px-4 py-2.5">
              <i className="bi bi-speedometer2 me-2" aria-hidden="true"></i> Go to Dashboard ({user.role})
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary-custom px-4 py-2.5">
                <i className="bi bi-person-plus-fill me-2" aria-hidden="true"></i> Schedule Disposal / Register
              </Link>
              <Link to="/recycling-centers" className="btn btn-outline-custom px-4 py-2.5">
                <i className="bi bi-geo-alt-fill me-2" aria-hidden="true"></i> Find Recycling Centers
              </Link>
            </>
          )}
        </div>
      </section>

      {/* 2. How It Works Section */}
      <section className="mb-5" aria-labelledby="how-it-works-heading">
        <div className="text-center mb-4">
          <span className="badge bg-emerald-subtle text-emerald border border-emerald px-3 py-1 rounded-pill uppercase fw-bold">
            Step-by-Step Guide
          </span>
          <h2 id="how-it-works-heading" className="h2 text-white fw-bold mt-2">How It Works</h2>
          <p className="text-muted small max-w-xl mx-auto">
            Disposing of obsolete electronics responsibly takes under two minutes.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-md-3">
            <div className="card-custom h-100 p-4 text-center">
              <div className="badge rounded-circle bg-emerald bg-opacity-20 text-emerald mb-3 fs-4 d-inline-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                1
              </div>
              <h3 className="h5 text-white fw-bold">1. Submit Request</h3>
              <p className="text-muted small">
                Choose device category, quantity, address, and preferred doorstep time slot (Morning / Afternoon / Evening).
              </p>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card-custom h-100 p-4 text-center">
              <div className="badge rounded-circle bg-emerald bg-opacity-20 text-emerald mb-3 fs-4 d-inline-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                2
              </div>
              <h3 className="h5 text-white fw-bold">2. Collector Dispatch</h3>
              <p className="text-muted small">
                An authorized local collector accepts your task, navigates to your doorstep, and secures items safely.
              </p>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card-custom h-100 p-4 text-center">
              <div className="badge rounded-circle bg-emerald bg-opacity-20 text-emerald mb-3 fs-4 d-inline-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                3
              </div>
              <h3 className="h5 text-white fw-bold">3. Facility Recycling</h3>
              <p className="text-muted small">
                Devices are inspected at state-registered facilities for reuse, refurbishing, or zero-landfill material recovery.
              </p>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card-custom h-100 p-4 text-center">
              <div className="badge rounded-circle bg-emerald bg-opacity-20 text-emerald mb-3 fs-4 d-inline-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                4
              </div>
              <h3 className="h5 text-white fw-bold">4. Rewards &amp; Certificate</h3>
              <p className="text-muted small">
                Earn Green Points, level up your Eco status, and download a verifiable Digital Recycling Certificate (PDF).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why Responsible E-Waste Disposal Matters */}
      <section className="mb-5" aria-labelledby="why-matters-heading">
        <div className="card-custom p-4 p-md-5 border-emerald border-opacity-25">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="badge bg-emerald-subtle text-emerald border border-emerald mb-2">Environmental Impact</span>
              <h2 id="why-matters-heading" className="h2 text-white fw-bold mb-3">
                Why Responsible E-Waste Disposal Matters
              </h2>
              <p className="text-muted mb-4">
                Electronics contain heavy metals like Lead, Cadmium, and Mercury. Unregulated informal burning or dumping releases toxic fumes into groundwater and soil.
              </p>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-3">
                  <i className="bi bi-shield-x text-danger fs-4 mt-1" aria-hidden="true"></i>
                  <div>
                    <h3 className="h6 text-white fw-bold mb-1">Prevent Toxic Soil &amp; Water Leaching</h3>
                    <p className="text-muted small m-0">Protect community health by diverting battery acids and heavy metals away from local landfills.</p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <i className="bi bi-cpu text-emerald fs-4 mt-1" aria-hidden="true"></i>
                  <div>
                    <h3 className="h6 text-white fw-bold mb-1">Recover Rare Earth Elements</h3>
                    <p className="text-muted small m-0">Recover precious metals (Gold, Silver, Palladium, Copper) to supply secondary raw materials for green tech.</p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <i className="bi bi-tree text-success fs-4 mt-1" aria-hidden="true"></i>
                  <div>
                    <h3 className="h6 text-white fw-bold mb-1">Divert Greenhouse Gas Emissions</h3>
                    <p className="text-muted small m-0">Recycling aluminum and copper uses up to 95% less energy than primary mining operations.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="bg-dark p-4 rounded-4 border border-secondary">
                <h3 className="h5 text-white fw-bold mb-3 border-bottom border-secondary pb-2">
                  <i className="bi bi-lightning-charge text-emerald me-2" aria-hidden="true"></i>
                  India E-Waste Highlights
                </h3>
                <ul className="list-unstyled text-muted small d-flex flex-column gap-3 m-0">
                  <li className="d-flex justify-content-between align-items-center">
                    <span>Annual E-Waste Generation in India</span>
                    <span className="fw-bold text-white">~1.7 Million Tonnes</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-center">
                    <span>Target Formal Recycling Rate</span>
                    <span className="fw-bold text-emerald">80%+ (CPCB Goal)</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-center">
                    <span>CO2 Saved per 10kg E-Waste</span>
                    <span className="fw-bold text-white">~14.5 kg CO2e</span>
                  </li>
                  <li className="d-flex justify-content-between align-items-center">
                    <span>Authorized Facilities Supported</span>
                    <span className="fw-bold text-white">5 Major Metro Hubs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Platform Features */}
      <section className="mb-5" aria-labelledby="features-heading">
        <div className="text-center mb-4">
          <span className="badge bg-emerald-subtle text-emerald border border-emerald px-3 py-1 rounded-pill uppercase fw-bold">
            Core Modules
          </span>
          <h2 id="features-heading" className="h2 text-white fw-bold mt-2">Platform Features</h2>
          <p className="text-muted small max-w-xl mx-auto">
            Comprehensive tools built for citizens, institutions, collectors, and registered recyclers.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card-custom h-100 p-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-truck text-emerald fs-2" aria-hidden="true"></i>
              </div>
              <h3 className="h5 text-white fw-bold">Smart Doorstep Pickup</h3>
              <p className="text-muted small">
                Request doorstep collection with customized time slots. Logistics dispatches notify nearby collectors automatically.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-custom h-100 p-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-qr-code-scan text-emerald fs-2" aria-hidden="true"></i>
              </div>
              <h3 className="h5 text-white fw-bold">Verifiable QR Lifecycle Tracking</h3>
              <p className="text-muted small">
                Every request receives a public ID (e.g. <code>EW-2026-88A9B1C2</code>) with a non-sensitive QR code tracking visual stages.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-custom h-100 p-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-trophy text-emerald fs-2" aria-hidden="true"></i>
              </div>
              <h3 className="h5 text-white fw-bold">Green Points &amp; Gamification</h3>
              <p className="text-muted small">
                Earn Green Points upon verified recycling completion. Progress from Green Starter to Planet Guardian with audit badges.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-custom h-100 p-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-file-earmark-pdf text-emerald fs-2" aria-hidden="true"></i>
              </div>
              <h3 className="h5 text-white fw-bold">Digital Recycling Certificate</h3>
              <p className="text-muted small">
                Download official PDF recycling certificates (e.g. <code>EWC-2026-99F8E7D6</code>) featuring public QR verification.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-custom h-100 p-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-building-check text-emerald fs-2" aria-hidden="true"></i>
              </div>
              <h3 className="h5 text-white fw-bold">Institutional Bulk Upload</h3>
              <p className="text-muted small">
                Colleges and companies can upload bulk CSV inventories (e.g. 50 monitors, 20 CPUs) with multi-category handling.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-custom h-100 p-4">
              <div className="feature-icon mb-3">
                <i className="bi bi-geo-alt-fill text-emerald fs-2" aria-hidden="true"></i>
              </div>
              <h3 className="h5 text-white fw-bold">Center Distance Calculation</h3>
              <p className="text-muted small">
                Find authorized recyclers in your city, filter by waste category, and calculate estimated driving distances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Disposal Process Lifecycle Stepper */}
      <section className="mb-5" aria-labelledby="process-heading">
        <div className="card-custom p-4 p-md-5">
          <div className="text-center mb-4">
            <span className="badge bg-emerald-subtle text-emerald border border-emerald px-3 py-1 rounded-pill uppercase fw-bold">
              Transparent Pipeline
            </span>
            <h2 id="process-heading" className="h2 text-white fw-bold mt-2">End-to-End Disposal Lifecycle</h2>
            <p className="text-muted small max-w-xl mx-auto">
              Real-time audit trail updated dynamically across all user and public dashboards.
            </p>
          </div>

          <div className="stepper-horizontal">
            <div className="step-item completed">
              <div className="step-number"><i className="bi bi-send-check" aria-hidden="true"></i></div>
              <div className="step-label text-white fw-semibold">Submitted</div>
              <div className="text-muted extra-small">Initial Request</div>
            </div>
            <div className="step-item completed">
              <div className="step-number"><i className="bi bi-patch-check" aria-hidden="true"></i></div>
              <div className="step-label text-white fw-semibold">Approved</div>
              <div className="text-muted extra-small">Center Assigned</div>
            </div>
            <div className="step-item active">
              <div className="step-number"><i className="bi bi-truck" aria-hidden="true"></i></div>
              <div className="step-label text-white fw-semibold">Pickup Assigned</div>
              <div className="text-muted extra-small">On The Way</div>
            </div>
            <div className="step-item">
              <div className="step-number"><i className="bi bi-building" aria-hidden="true"></i></div>
              <div className="step-label text-white fw-semibold">At Recycling Center</div>
              <div className="text-muted extra-small">Inspection</div>
            </div>
            <div className="step-item">
              <div className="step-number"><i className="bi bi-award-fill" aria-hidden="true"></i></div>
              <div className="step-label text-white fw-semibold">Completed</div>
              <div className="text-muted extra-small">Certificate Issued</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Environmental Contribution Metrics */}
      <section className="mb-5" aria-labelledby="analytics-heading">
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card-custom text-center p-4">
              <div className="text-emerald fs-1 fw-bold">1,248+</div>
              <div className="text-white fw-semibold">Items Collected</div>
              <div className="text-muted extra-small">Across Metro Hubs</div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card-custom text-center p-4">
              <div className="text-emerald fs-1 fw-bold">8.4 Tons</div>
              <div className="text-white fw-semibold">Landfill Diversion</div>
              <div className="text-muted extra-small">Zero Landfill Goal</div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card-custom text-center p-4">
              <div className="text-emerald fs-1 fw-bold">12.1 tCO2e</div>
              <div className="text-white fw-semibold">Estimated CO2 Reduction</div>
              <div className="text-muted extra-small">Verified Emission Factor</div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card-custom text-center p-4">
              <div className="text-emerald fs-1 fw-bold">185,400</div>
              <div className="text-white fw-semibold">Green Points Issued</div>
              <div className="text-muted extra-small">Rewarded to Citizens</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Find Recycling Center Teaser */}
      <section className="mb-5" aria-labelledby="center-teaser-heading">
        <div className="card-custom p-4 p-md-5 bg-emerald bg-opacity-10 border-emerald">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h2 id="center-teaser-heading" className="h3 text-white fw-bold mb-2">
                <i className="bi bi-geo-alt-fill text-emerald me-2" aria-hidden="true"></i>
                Find Authorized Recycling Centers Near You
              </h2>
              <p className="text-muted m-0">
                Explore CPCB / State PCB compliant facilities in Chennai, Bengaluru, Mumbai, Delhi, and Hyderabad. Filter by accepted categories such as Computers, Mobiles, and Batteries.
              </p>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <Link to="/recycling-centers" className="btn btn-emerald px-4 py-2.5 fw-bold">
                <i className="bi bi-search me-2" aria-hidden="true"></i> Search Facilities Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Call to Action (CTA) Banner */}
      <section className="mb-5" aria-labelledby="cta-heading">
        <div className="hero-card text-center p-5">
          <h2 id="cta-heading" className="h2 text-white fw-bold mb-3">Ready to Dispose of E-Waste Responsibly?</h2>
          <p className="text-muted max-w-xl mx-auto mb-4">
            Join thousands of individual citizens and leading institutions building a sustainable, cleaner India today.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/register" className="btn btn-primary-custom px-4 py-2.5 fw-bold">
              <i className="bi bi-rocket-takeoff-fill me-2" aria-hidden="true"></i> Create Your Account
            </Link>
            <Link to="/compliance" className="btn btn-outline-custom px-4 py-2.5 fw-bold">
              <i className="bi bi-book me-2" aria-hidden="true"></i> Read Compliance Guidelines
            </Link>
          </div>
        </div>
      </section>

      {/* Backend API Health Status */}
      <section className="api-status-card mb-4" id="api-health" aria-labelledby="api-health-heading">
        <div className="status-header">
          <h3 id="api-health-heading" className="h6 m-0 text-white font-weight-bold">
            <i className="bi bi-server text-emerald me-2" aria-hidden="true"></i> Spring Boot REST Service Status
          </h3>
          <span className="status-badge">
            <span className="pulse-dot" aria-hidden="true"></span> JWT &amp; API Security Active
          </span>
        </div>
        <div className="status-code-block mt-3">
          {apiStatus.loading ? (
            <span>Connecting to Spring Boot backend API...</span>
          ) : apiStatus.error ? (
            <span className="text-warning">
              ℹ Service Info: {apiStatus.error}
            </span>
          ) : (
            <pre className="m-0 text-emerald">{JSON.stringify(apiStatus.data, null, 2)}</pre>
          )}
        </div>
      </section>
    </div>
  )
}

function ArchitectureDocs() {
  return (
    <div className="hero-card p-4 p-md-5">
      <span className="hero-tag">🏗 Technical Architecture &amp; Security</span>
      <h1 className="hero-title mt-2">Full-Stack System Design</h1>
      <p className="hero-description text-muted">
        Enterprise Spring Boot 3 &amp; React 18 architecture supporting scalable role-based access control, Flyway migrations, and REST APIs.
      </p>

      <div className="row g-4 mt-2">
        <div className="col-md-6">
          <div className="card-custom p-4 h-100">
            <h2 className="h5 text-white fw-bold mb-3 border-bottom border-secondary pb-2">
              <i className="bi bi-shield-lock-fill text-emerald me-2" aria-hidden="true"></i> Security Architecture
            </h2>
            <ul className="text-muted small d-flex flex-column gap-2 m-0 ps-3">
              <li><strong>Password Hashing:</strong> BCrypt algorithm with secure salt strength.</li>
              <li><strong>JWT Security:</strong> Stateless JJWT signed tokens passed in Authorization header.</li>
              <li><strong>Role-Based Access:</strong> Enforced at controller endpoints using <code>@PreAuthorize</code> annotations.</li>
              <li><strong>Roles:</strong> <code>USER</code>, <code>COLLECTOR</code>, <code>RECYCLER</code>, <code>ADMIN</code>.</li>
            </ul>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card-custom p-4 h-100">
            <h2 className="h5 text-white fw-bold mb-3 border-bottom border-secondary pb-2">
              <i className="bi bi-database-check text-emerald me-2" aria-hidden="true"></i> Database &amp; Migrations
            </h2>
            <ul className="text-muted small d-flex flex-column gap-2 m-0 ps-3">
              <li><strong>Database Engine:</strong> H2 in-memory (dev/test) / PostgreSQL (production compatible).</li>
              <li><strong>Migration Engine:</strong> Flyway versioned SQL scripts.</li>
              <li><strong>Entities:</strong> User, EWasteItem, Pickup, RecyclingCenter, RewardTransaction, Notification.</li>
              <li><strong>Certificates &amp; Tracking:</strong> PDF generation via iText &amp; QR matrix generation via ZXing.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-wrapper">
        <HeaderNav />

        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/recycling-centers" element={<FindRecyclingCenter />} />
            <Route path="/compliance" element={<ComplianceSupport />} />
            <Route path="/architecture" element={<ArchitectureDocs />} />
            <Route path="/track/:trackingId" element={<PublicTrack />} />
            <Route path="/verify-certificate/:certificateNumber?" element={<VerifyCertificate />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected User Citizen Routes */}
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                    <UserDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/ewaste/add"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                    <AddEWaste />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/requests"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                    <MyRequests />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/requests/:id"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                    <RequestDetails />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/profile"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                    <EditProfile />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/institution/dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['USER', 'ADMIN']}>
                    <InstitutionDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />

            {/* Protected Role Dashboards */}
            <Route
              path="/collector/dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['COLLECTOR', 'ADMIN']}>
                    <CollectorDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recycler/dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['RECYCLER', 'ADMIN']}>
                    <RecyclerDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        {/* 9. Accessible Professional Footer */}
        <footer className="footer-custom" role="contentinfo">
          <div className="container">
            <div className="row g-4 mb-4 text-start">
              <div className="col-lg-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="brand-icon" style={{ width: '28px', height: '28px', fontSize: '0.9rem' }}>
                    <i className="bi bi-arrow-repeat" aria-hidden="true"></i>
                  </div>
                  <span className="fw-bold text-white fs-5">Smart E-Waste Platform</span>
                </div>
                <p className="text-muted small mb-3">
                  India's standard doorstep e-waste collection, verifiable QR tracking, and eco-credit rewards system for citizens and institutions.
                </p>
                <div className="d-flex gap-2">
                  <span className="badge bg-emerald-subtle text-emerald border border-emerald small">CPCB Compliant Concept</span>
                  <span className="badge bg-dark text-white border border-secondary small">Zero Landfill</span>
                </div>
              </div>

              <div className="col-lg-3 col-6">
                <h4 className="h6 text-white fw-bold mb-3">Quick Navigation</h4>
                <ul className="list-unstyled text-muted small d-flex flex-column gap-2 m-0">
                  <li><Link to="/" className="text-muted text-decoration-none hover-emerald">Home Landing</Link></li>
                  <li><Link to="/recycling-centers" className="text-muted text-decoration-none hover-emerald">Find Recycling Centers</Link></li>
                  <li><Link to="/compliance" className="text-muted text-decoration-none hover-emerald">E-Waste Compliance</Link></li>
                  <li><Link to="/architecture" className="text-muted text-decoration-none hover-emerald">System Architecture</Link></li>
                </ul>
              </div>

              <div className="col-lg-3 col-6">
                <h4 className="h6 text-white fw-bold mb-3">Verifications</h4>
                <ul className="list-unstyled text-muted small d-flex flex-column gap-2 m-0">
                  <li><Link to="/verify-certificate" className="text-muted text-decoration-none hover-emerald">Verify Certificate</Link></li>
                  <li><Link to="/register" className="text-muted text-decoration-none hover-emerald">Institutional Bulk Portal</Link></li>
                  <li><Link to="/login" className="text-muted text-decoration-none hover-emerald">Collector / Recycler Login</Link></li>
                </ul>
              </div>

              <div className="col-lg-2">
                <h4 className="h6 text-white fw-bold mb-3">Regulatory Notice</h4>
                <p className="text-muted extra-small m-0">
                  Registration &amp; authorization details must be independently verified with the relevant authority (CPCB / State PCB).
                </p>
              </div>
            </div>

            <div className="border-top border-secondary border-opacity-25 pt-3 text-center">
              <p className="m-0 mb-1 small text-muted">
                &copy; 2026 Smart E-Waste Collection &amp; Recycling Management System. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}

