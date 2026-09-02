import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function CollectorDashboard() {
  const { user } = useAuth()

  return (
    <div className="container py-4">
      <div className="hero-card mb-4">
        <span className="hero-tag">🚚 Logistics &amp; Collector Operations</span>
        <h1 className="hero-title h2 mb-1">
          Collector Workspace - {user?.profile?.firstName || 'Collector'}
        </h1>
        <p className="hero-description small mb-0">
          View assigned pickup routes, verify items upon collection, and dispatch to recycling facilities.
        </p>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-calendar-check-fill"></i>
            </div>
            <h3 className="feature-title">Assigned Pickups</h3>
            <p className="feature-text">
              View daily collection schedules, door-to-door pickup routes, and user contact details.
            </p>
          </div>
        </div>

        <div className="col-md-6">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-qr-code-scan"></i>
            </div>
            <h3 className="feature-title">Verify &amp; Collect</h3>
            <p className="feature-text">
              Confirm item serial numbers, condition verification codes, and mark requests as COLLECTED.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
