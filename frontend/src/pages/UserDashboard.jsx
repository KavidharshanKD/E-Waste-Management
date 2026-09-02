import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function UserDashboard() {
  const { user } = useAuth()

  return (
    <div className="container py-4">
      <div className="hero-card mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <span className="hero-tag">👤 Resident Portal</span>
            <h1 className="hero-title h2 mb-1">
              Welcome, {user?.profile?.firstName || 'User'}!
            </h1>
            <p className="hero-description small mb-0">
              Manage your e-waste disposal requests, track pickup status, and redeem earned reward points.
            </p>
          </div>
          <div className="text-end bg-dark bg-opacity-50 p-3 rounded-4 border border-secondary border-opacity-25">
            <span className="text-muted small d-block mb-1">Eco-Reward Balance</span>
            <span className="h3 font-weight-bold text-success m-0">
              <i className="bi bi-coin me-1"></i> {user?.rewardPointsBalance || 0} Points
            </span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-plus-circle-fill"></i>
            </div>
            <h3 className="feature-title">Schedule Disposal</h3>
            <p className="feature-text">
              Submit a new e-waste collection request for laptops, phones, appliances, or batteries.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-geo-alt-fill"></i>
            </div>
            <h3 className="feature-title">Track Pickup</h3>
            <p className="feature-text">
              Monitor active pickup dispatches and live recycling center processing stages.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="feature-card">
            <div className="feature-icon">
              <i className="bi bi-file-earmark-pdf-fill"></i>
            </div>
            <h3 className="feature-title">Green Certificates</h3>
            <p className="feature-text">
              Download certified recycling certificates for eco-compliant disposal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
