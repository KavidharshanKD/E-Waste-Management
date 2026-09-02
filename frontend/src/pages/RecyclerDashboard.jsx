import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function RecyclerDashboard() {
  const { user } = useAuth()

  return (
    <div className="container py-4">
      <div className="hero-card mb-4">
        <span className="hero-tag">♻️ Recycling Partner Portal</span>
        <h1 className="hero-title h2 mb-1">
          Facility Control Center
        </h1>
        <p className="hero-description small mb-0">
          Logged in as <strong>{user?.email}</strong>. Manage incoming e-waste inventory, material segregation, and issue recycling certificates.
        </p>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-box-seam-fill"></i>
            </div>
            <h3 className="feature-title">Facility Inventory</h3>
            <p className="feature-text">
              Inspect e-waste items received at the recycling center and update recovery status (RECYCLED, REFURBISHED, REUSED).
            </p>
          </div>
        </div>

        <div className="col-md-6">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-patch-check-fill"></i>
            </div>
            <h3 className="feature-title">Issue Green Certificates</h3>
            <p className="feature-text">
              Generate official recycling certificates documenting hazardous material diversion and weight compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
