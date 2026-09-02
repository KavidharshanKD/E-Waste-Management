import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div className="container py-4">
      <div className="hero-card mb-4">
        <span className="hero-tag">🛡️ System Administration</span>
        <h1 className="hero-title h2 mb-1">
          Master Control Panel
        </h1>
        <p className="hero-description small mb-0">
          Supervise user role management, system analytics, collector dispatches, and recycling facility compliance.
        </p>
      </div>

      <div className="row g-4">
        <div className="col-md-3">
          <div className="feature-card text-center">
            <div className="feature-icon mx-auto">
              <i className="bi bi-people-fill"></i>
            </div>
            <h4 className="feature-title h5">User Management</h4>
            <p className="feature-text small">
              Manage accounts, roles (USER, COLLECTOR, RECYCLER, ADMIN), and access permissions.
            </p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="feature-card text-center">
            <div className="feature-icon mx-auto">
              <i className="bi bi-building"></i>
            </div>
            <h4 className="feature-title h5">Recycling Centers</h4>
            <p className="feature-text small">
              Approve partner facilities, set capacity limits, and monitor processing throughput.
            </p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="feature-card text-center">
            <div className="feature-icon mx-auto">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <h4 className="feature-title h5">Analytics &amp; ESG</h4>
            <p className="feature-text small">
              Review environmental impact metrics, e-waste volume statistics, and carbon reduction reports.
            </p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="feature-card text-center">
            <div className="feature-icon mx-auto">
              <i className="bi bi-shield-lock"></i>
            </div>
            <h4 className="feature-title h5">Security &amp; Audit</h4>
            <p className="feature-text small">
              Inspect status transition logs, JWT authentication audit trails, and system health status.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
