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
import Marketplace from './pages/Marketplace'
import ProductDetail from './pages/ProductDetail'

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
          className="d-lg-none btn btn-outline-custom p-1 px-2 border border-secondary text-dark ms-auto me-2"
          type="button"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'} fs-4`}></i>
        </button>

        {/* Navigation Links */}
        <div className={`nav-links-wrapper ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <ul className="nav-links">
            <li>
              <Link to="/" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/marketplace" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                Marketplace
              </Link>
            </li>
            <li>
              <Link to="/recycling-centers" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                Find Centers
              </Link>
            </li>
            <li>
              <Link to="/compliance" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                Compliance Guide
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
                    Dashboard
                  </Link>
                </li>
                {user.profile?.userType === 'INSTITUTION' && (
                  <li>
                    <Link to="/institution/dashboard" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                      Bulk Portal
                    </Link>
                  </li>
                )}
                {(user.role === 'USER' || user.role === 'ADMIN') && (
                  <>
                    <li>
                      <Link to="/user/ewaste/add" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                        Dispose E-Waste
                      </Link>
                    </li>
                    <li>
                      <Link to="/user/requests" className="nav-link-item" onClick={() => setMobileMenuOpen(false)}>
                        My Requests
                      </Link>
                    </li>
                  </>
                )}
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2 gap-lg-3 mt-3 mt-lg-0 flex-shrink-0 text-nowrap">
            {user ? (
              <div className="d-flex align-items-center gap-2 gap-lg-3 text-nowrap">
                <NotificationBell />
                <span className="status-dot-item text-truncate d-inline-block align-middle me-1" style={{ maxWidth: '140px' }}>
                  <span className="status-dot status-dot-emerald me-1"></span>
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-custom py-1 px-2.5 btn-sm text-nowrap"
                  aria-label="Log out of account"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2 text-nowrap">
                <Link to="/login" className="btn btn-outline-custom py-1.5 px-3 text-nowrap">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary-custom py-1.5 px-3 text-nowrap">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
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
    <div className="landing-editorial-container">
      {/* 1. Full Viewport Hero Section */}
      <section className="py-5" aria-labelledby="hero-heading">
        <div className="editorial-tag">
          <i className="bi bi-globe-asia-australia me-1"></i>
          Circular Technology Infrastructure — India 2026
        </div>
        
        <div className="grid-split-60-40 my-4">
          <div>
            <h1 id="hero-heading" className="display-hero-title">
              DON'T THROW<br />TECH AWAY.
            </h1>
          </div>
          <div className="pt-2">
            <p className="fs-5 text-secondary mb-4" style={{ maxWidth: '440px' }}>
              Give electronics a responsible second life through verified doorstep collection, smart recovery decisions, and certified processing across India.
            </p>
            <div className="d-flex gap-3 flex-wrap">
              {user ? (
                <Link to={getDashboardPathByRole(user.role)} className="btn btn-primary-custom">
                  Go to Dashboard ↗
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary-custom">
                    Dispose E-Waste ↗
                  </Link>
                  <Link to="/recycling-centers" className="btn btn-outline-custom">
                    Find Centers ↗
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="thin-rule"></div>

      {/* 2. Live Impact Statement Strip */}
      <section className="py-4" aria-labelledby="impact-heading">
        <div className="row g-4 text-start">
          <div className="col-md-3">
            <div className="section-number-lead">1,248+</div>
            <div className="fw-bold text-uppercase fs-6 mt-1">Items Collected</div>
            <div className="text-muted small">Across metro logistics hubs</div>
          </div>
          <div className="col-md-3">
            <div className="section-number-lead">8.4 T</div>
            <div className="fw-bold text-uppercase fs-6 mt-1">Landfill Diverted</div>
            <div className="text-muted small">Zero-landfill recovery policy</div>
          </div>
          <div className="col-md-3">
            <div className="section-number-lead">12.1 T</div>
            <div className="fw-bold text-uppercase fs-6 mt-1">CO2e Reduced</div>
            <div className="text-muted small">Verified recycling factors</div>
          </div>
          <div className="col-md-3">
            <div className="section-number-lead">1.85 L</div>
            <div className="fw-bold text-uppercase fs-6 mt-1">Green Points</div>
            <div className="text-muted small">Rewarded to citizens</div>
          </div>
        </div>
      </section>

      <div className="thin-rule"></div>

      {/* 3. Editorial Timeline Process */}
      <section className="py-5" aria-labelledby="process-heading">
        <div className="editorial-tag">01 / Lifecycle Stream</div>
        <h2 id="process-heading" className="h1 text-uppercase fw-bold mb-4">
          HOW IT WORKS
        </h2>

        <div className="editorial-timeline">
          <div className="editorial-timeline-row">
            <div className="editorial-timeline-num">01</div>
            <div className="editorial-timeline-title">SUBMIT</div>
            <div className="editorial-timeline-desc">
              Tell us what device you're ready to part with. Input device category, condition, and preferred doorstep pickup window.
            </div>
          </div>

          <div className="editorial-timeline-row">
            <div className="editorial-timeline-num">02</div>
            <div className="editorial-timeline-title">SMART DECISION</div>
            <div className="editorial-timeline-desc">
              Our automated recommendation engine evaluates whether repair, component refurbishing, or material recycling yields the highest sustainability value.
            </div>
          </div>

          <div className="editorial-timeline-row">
            <div className="editorial-timeline-num">03</div>
            <div className="editorial-timeline-title">COLLECTION</div>
            <div className="editorial-timeline-desc">
              An authorized local collector accepts the task and arrives at your doorstep with verified chain-of-custody protocols.
            </div>
          </div>

          <div className="editorial-timeline-row">
            <div className="editorial-timeline-num">04</div>
            <div className="editorial-timeline-title">SECOND LIFE</div>
            <div className="editorial-timeline-desc">
              Follow your item through state-registered facilities and receive a verifiable digital recycling certificate with public QR tracking.
            </div>
          </div>
        </div>
      </section>

      {/* 4. E-Waste Categories Catalogue */}
      <section className="py-5" aria-labelledby="catalogue-heading">
        <div className="editorial-tag">02 / Accepted Equipment</div>
        <h2 id="catalogue-heading" className="h1 text-uppercase fw-bold mb-4">
          WHAT ARE YOU DISPOSING?
        </h2>

        <div className="editorial-catalog">
          <div className="editorial-catalog-row">
            <span className="editorial-catalog-name">MOBILE PHONES &amp; TABLETS</span>
            <span className="editorial-catalog-num">01</span>
          </div>
          <div className="editorial-catalog-row">
            <span className="editorial-catalog-name">LAPTOPS &amp; DESKTOP COMPUTERS</span>
            <span className="editorial-catalog-num">02</span>
          </div>
          <div className="editorial-catalog-row">
            <span className="editorial-catalog-name">LITHIUM &amp; INDUSTRIAL BATTERIES</span>
            <span className="editorial-catalog-num">03</span>
          </div>
          <div className="editorial-catalog-row">
            <span className="editorial-catalog-name">MONITORS &amp; TELEVISION PANELS</span>
            <span className="editorial-catalog-num">04</span>
          </div>
          <div className="editorial-catalog-row">
            <span className="editorial-catalog-name">OFFICE ELECTRONICS &amp; PRINTERS</span>
            <span className="editorial-catalog-num">05</span>
          </div>
        </div>
      </section>

      {/* 5. Dark Section Contrast Canvas: Visual Storytelling */}
      <section className="editorial-dark-canvas my-5 mx-n3 px-4 px-md-5">
        <div className="max-w-1340 mx-auto">
          <div className="editorial-tag text-emerald">03 / Environmental Impact</div>
          
          <div className="grid-split-50-50 my-4">
            <div>
              <h2 className="h1 text-uppercase fw-bold mb-4">
                REPAIR BEFORE RECYCLE.
              </h2>
              <p className="fs-5 text-secondary mb-4">
                Electronics contain precious rare earth elements including Gold, Silver, Copper, and Palladium. Recycling aluminum and copper saves up to 95% of the energy consumed by primary mining operations.
              </p>
              <div className="pt-2">
                <Link to="/compliance" className="btn btn-outline-custom border-light text-white">
                  Read Compliance Standard ↗
                </Link>
              </div>
            </div>

            <div className="border-start border-secondary ps-md-5 pt-3 pt-md-0">
              <h3 className="h4 text-uppercase fw-bold mb-3">KEY HIGHLIGHTS — INDIA</h3>
              <div className="d-flex flex-column gap-3 fs-6 text-secondary">
                <div className="d-flex justify-content-between pb-2 border-bottom border-secondary">
                  <span>Annual E-Waste Generation</span>
                  <strong className="text-white">~1.7 Million Tonnes</strong>
                </div>
                <div className="d-flex justify-content-between pb-2 border-bottom border-secondary">
                  <span>CPCB Formal Recycling Target</span>
                  <strong className="text-white">80%+ Recovery</strong>
                </div>
                <div className="d-flex justify-content-between pb-2 border-bottom border-secondary">
                  <span>CO2 Diversion per 10kg</span>
                  <strong className="text-white">~14.5 kg CO2e</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Authorized Recycling Centers</span>
                  <strong className="text-white">Verified Statewide</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Facility Discovery Teaser */}
      <section className="py-5" aria-labelledby="centers-heading">
        <div className="grid-split-60-40 align-items-center">
          <div>
            <div className="editorial-tag">04 / Facility Network</div>
            <h2 id="centers-heading" className="h1 text-uppercase fw-bold mb-3">
              FIND AUTHORIZED RECYCLING CENTERS
            </h2>
            <p className="text-secondary fs-5" style={{ maxWidth: '560px' }}>
              Locate state PCB registered recycling and refurbishing facilities across Coimbatore, Chennai, Bengaluru, Mumbai, and Delhi.
            </p>
          </div>
          <div className="text-md-end">
            <Link to="/recycling-centers" className="btn btn-primary-custom">
              Search Facilities ↗
            </Link>
          </div>
        </div>
      </section>

      <div className="thin-rule"></div>

      {/* Backend Health Diagnostics Stream */}
      <section className="py-3" id="api-health">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-uppercase small fw-bold text-muted">
            System Operations API: {apiStatus.loading ? 'CONNECTING...' : 'ONLINE'}
          </span>
          <span className="status-dot-item small">
            <span className="status-dot status-dot-emerald"></span> JWT REST Security Active
          </span>
        </div>
        {!apiStatus.loading && apiStatus.data && (
          <pre className="p-3 bg-white border border-secondary text-dark small m-0">
            {JSON.stringify(apiStatus.data, null, 2)}
          </pre>
        )}
      </section>

      {/* Editorial Footer */}
      <footer className="footer-custom mt-5">
        <div className="footer-container">
          <div className="footer-display-brand">
            SMART E-WASTE
          </div>
          <p className="text-secondary fs-5 mb-5" style={{ maxWidth: '600px' }}>
            India's standard doorstep e-waste collection, verified lifecycle tracking, and digital recycling certificate infrastructure.
          </p>

          <div className="row g-4 border-top border-secondary pt-4">
            <div className="col-md-4">
              <div className="footer-column-title">PLATFORM NAVIGATION</div>
              <ul className="footer-links-list">
                <li><Link to="/" className="footer-link">Home</Link></li>
                <li><Link to="/recycling-centers" className="footer-link">Find Recycling Centers</Link></li>
                <li><Link to="/compliance" className="footer-link">E-Waste Compliance Guide</Link></li>
                <li><Link to="/architecture" className="footer-link">System Architecture</Link></li>
              </ul>
            </div>

            <div className="col-md-4">
              <div className="footer-column-title">VERIFICATION &amp; PORTALS</div>
              <ul className="footer-links-list">
                <li><Link to="/verify-certificate" className="footer-link">Verify Certificate</Link></li>
                <li><Link to="/institution/dashboard" className="footer-link">Institutional Bulk Disposal</Link></li>
                <li><Link to="/login" className="footer-link">Collector / Recycler Login</Link></li>
              </ul>
            </div>

            <div className="col-md-4">
              <div className="footer-column-title">HEADQUARTERS</div>
              <p className="text-secondary small">
                Smart E-Waste Infrastructure Division<br />
                Coimbatore, Tamil Nadu, India<br />
                PIN: 641001
              </p>
            </div>
          </div>

          <div className="border-top border-secondary mt-5 pt-3 d-flex justify-content-between flex-wrap gap-2 text-muted small">
            <span>&copy; 2026 Smart E-Waste Management System. All rights reserved.</span>
            <span>CPCB &amp; State PCB Compliant Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ArchitectureDocs() {
  return (
    <div className="py-4">
      <div className="editorial-tag">System Architecture &amp; Security</div>
      <h1 className="display-hero-title mb-4">ENTERPRISE FULL-STACK DESIGN</h1>
      
      <div className="grid-split-50-50 my-4">
        <div>
          <h2 className="h4 text-uppercase fw-bold mb-3 pb-2 border-bottom border-secondary">
            SECURITY ARCHITECTURE
          </h2>
          <ul className="text-secondary list-unstyled d-flex flex-column gap-3">
            <li><strong>Password Hashing:</strong> BCrypt algorithm with secure salt strength.</li>
            <li><strong>JWT Security:</strong> Stateless JJWT signed tokens passed in Authorization header.</li>
            <li><strong>Role-Based Access:</strong> Enforced at controller endpoints using <code>@PreAuthorize</code> annotations.</li>
            <li><strong>Supported Roles:</strong> <code>USER</code>, <code>COLLECTOR</code>, <code>RECYCLER</code>, <code>ADMIN</code>.</li>
          </ul>
        </div>

        <div>
          <h2 className="h4 text-uppercase fw-bold mb-3 pb-2 border-bottom border-secondary">
            DATABASE &amp; DATA ENGINE
          </h2>
          <ul className="text-secondary list-unstyled d-flex flex-column gap-3">
            <li><strong>Database Engine:</strong> H2 in-memory (dev/test) / PostgreSQL (production compatible).</li>
            <li><strong>Migrations:</strong> Flyway versioned SQL scripts.</li>
            <li><strong>Entities:</strong> User, EWasteItem, Pickup, RecyclingCenter, RewardTransaction, Notification.</li>
            <li><strong>Certificates &amp; Tracking:</strong> PDF generation via iText &amp; QR matrix generation via ZXing.</li>
          </ul>
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
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<ProductDetail />} />
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
      </div>
    </AuthProvider>
  )
}
