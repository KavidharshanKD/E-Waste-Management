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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
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
            <Link to="/" className="nav-link-item">Home</Link>
          </li>
          <li>
            <Link to="/recycling-centers" className="nav-link-item">
              <i className="bi bi-geo-alt me-1"></i> Find Centers
            </Link>
          </li>
          <li>
            <Link to="/compliance" className="nav-link-item">
              <i className="bi bi-shield-check me-1"></i> E-Waste Compliance
            </Link>
          </li>
          <li>
            <Link to="/architecture" className="nav-link-item">Architecture</Link>
          </li>
          {user && (
            <>
              <li>
                <Link to={getDashboardPathByRole(user)} className="nav-link-item active">
                  <i className="bi bi-speedometer2 me-1"></i> Dashboard
                </Link>
              </li>
              {user.profile?.userType === 'INSTITUTION' && (
                <li>
                  <Link to="/institution/dashboard" className="nav-link-item">
                    <i className="bi bi-building me-1"></i> Bulk Portal
                  </Link>
                </li>
              )}
              {(user.role === 'USER' || user.role === 'ADMIN') && (
                <>
                  <li>
                    <Link to="/user/ewaste/add" className="nav-link-item">
                      <i className="bi bi-plus-circle me-1"></i> Add E-Waste
                    </Link>
                  </li>
                  <li>
                    <Link to="/user/requests" className="nav-link-item">
                      <i className="bi bi-list-check me-1"></i> My Requests
                    </Link>
                  </li>
                  <li>
                    <Link to="/user/profile" className="nav-link-item">
                      <i className="bi bi-person me-1"></i> Profile
                    </Link>
                  </li>
                </>
              )}
            </>
          )}
        </ul>

        <div className="d-flex align-items-center gap-2">
          {user ? (
            <div className="d-flex align-items-center gap-3">
              <NotificationBell />
              <span className="status-badge bg-dark border-secondary text-white">
                <span className="pulse-dot me-1"></span>
                {user.email} ({user.role})
              </span>
              <button onClick={handleLogout} className="btn btn-outline-custom py-1.5 px-3 btn-sm">
                <i className="bi bi-box-arrow-right me-1"></i> Logout
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
    <div>
      {/* Hero Section */}
      <div className="hero-card">
        <span className="hero-tag">⚡ Smart Circular Economy</span>
        <h1 className="hero-title">Smart E-Waste Collection &amp; Recycling Platform</h1>
        <p className="hero-description">
          An enterprise full-stack platform transforming e-waste logistics, pickup scheduling, automated recycling tracking, and eco-rewards management.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to={getDashboardPathByRole(user.role)} className="btn-primary-custom">
              <i className="bi bi-speedometer2"></i> Go to Your Dashboard ({user.role})
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary-custom">
                <i className="bi bi-person-plus-fill"></i> Get Started (Register)
              </Link>
              <Link to="/recycling-centers" className="btn-outline-custom">
                <i className="bi bi-geo-alt-fill"></i> Find Recycling Centers
              </Link>
            </>
          )}
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
            <i className="bi bi-geo-alt-fill text-info"></i>
          </div>
          <h3 className="feature-title">Location Discovery</h3>
          <p className="feature-text">
            Discover authorized recycling centers in Indian cities (Chennai, Bengaluru, Mumbai, Delhi, Hyderabad) with distance calculation.
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
            <span className="pulse-dot"></span> JWT &amp; API Security Active
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
              ℹ Backend Status: {apiStatus.error}
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
      <h2 className="hero-title">Full-Stack Blueprint &amp; Security</h2>
      <div className="mt-4 text-muted">
        <h4 className="text-white mb-3">Authentication &amp; Authorization</h4>
        <ul className="mb-4">
          <li><strong>Algorithm:</strong> BCrypt password hashing &amp; JJWT signed Bearer tokens</li>
          <li><strong>Role Matrix:</strong> <code>USER</code>, <code>COLLECTOR</code>, <code>RECYCLER</code>, <code>ADMIN</code></li>
          <li><strong>Secured Endpoints:</strong> <code>POST /api/auth/register</code>, <code>POST /api/auth/login</code>, <code>GET /api/auth/me</code></li>
        </ul>

        <h4 className="text-white mb-3">Backend Specifications</h4>
        <ul className="mb-4">
          <li><strong>Framework:</strong> Spring Boot 3.4.3 (Java 17 / 21 / 25 compatible)</li>
          <li><strong>Security Filter:</strong> Stateless <code>JwtAuthenticationFilter</code> before <code>UsernamePasswordPasswordAuthenticationFilter</code></li>
          <li><strong>Database Migrations:</strong> Flyway versioned SQL scripts (V1 Schema + V2 Dev Seed + V3 User Workflow + V4 Recommendation + V5 Center Finder)</li>
        </ul>
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

        <footer className="footer-custom">
          <div className="container text-center">
            <p className="m-0 mb-1">
              &copy; 2026 Smart E-Waste Collection &amp; Recycling Management System. India E-Waste Regulatory Guidance.
            </p>
            <p className="text-muted extra-small m-0 opacity-75">
              Notice: Registration information should be independently verified with the relevant authority (CPCB / State PCB).
            </p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  )
}
