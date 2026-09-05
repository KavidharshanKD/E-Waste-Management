import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function UserDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalSubmitted: 0,
    awaitingPickup: 0,
    collected: 0,
    successfullyProcessed: 0,
    greenPoints: 0,
  })
  const [rewards, setRewards] = useState({
    totalPoints: 0,
    currentLevel: 'Green Starter',
    nextLevel: 'Eco Contributor',
    pointsToNextLevel: 500,
    nextLevelThreshold: 500,
    progressPercentage: 0,
    badges: [],
    transactions: []
  })
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, requestsRes, rewardsRes] = await Promise.all([
        axios.get('/api/user/stats'),
        axios.get('/api/user/ewaste'),
        axios.get('/api/user/rewards')
      ])
      setStats(statsRes.data)
      setRecentRequests(requestsRes.data.slice(0, 5))
      setRewards(rewardsRes.data)
    } catch (err) {
      console.error('Failed to load dashboard data', err)
      setError('Unable to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const formatStatus = (status) => {
    if (!status) return ''
    return status.replace(/_/g, ' ')
  }

  const handleDownloadCertificatePdf = async (requestId, trackingNumber) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/certificates/request/${requestId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Certificate_${trackingNumber || requestId}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download certificate PDF', err)
      alert('Certificate is available once request status is COMPLETED.')
    }
  }

  const getLevelBadgeColor = (level) => {
    switch (level) {
      case 'Planet Guardian':
        return 'bg-gradient-purple text-white'
      case 'Eco Champion':
        return 'bg-gradient-gold text-dark'
      case 'Eco Contributor':
        return 'bg-success text-white'
      default:
        return 'bg-info text-dark'
    }
  }

  return (
    <div className="container py-4">
      {/* Hero Welcome Banner */}
      <div className="hero-card mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <span className="hero-tag">🌱 Resident Citizen Portal</span>
            <h1 className="hero-title h2 mb-1">
              Welcome back, {user?.profile?.firstName || user?.email?.split('@')[0] || 'Citizen'}!
            </h1>
            <p className="hero-description small mb-0">
              Schedule e-waste pickups, monitor recycling stages, and track your environmental green points balance.
            </p>
          </div>

          <div className="text-end bg-dark bg-opacity-60 p-3.5 px-4 rounded-4 border border-secondary border-opacity-25 shadow-sm">
            <span className="text-muted extra-small d-block mb-1 font-weight-bold">Current Tier &amp; Balance</span>
            <div className="d-flex align-items-center justify-content-end gap-2">
              <span className={`badge ${getLevelBadgeColor(rewards.currentLevel)} p-2 px-3`}>
                <i className="bi bi-shield-fill-check me-1"></i>{rewards.currentLevel}
              </span>
              <span className="h2 font-weight-bold text-success m-0">
                <i className="bi bi-coin text-warning me-1"></i>{rewards.totalPoints}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Tier & Progress Card */}
      <div className="glass-card mb-4">
        <div className="row align-items-center g-3">
          <div className="col-md-6">
            <h5 className="text-white font-weight-bold mb-1 d-flex align-items-center gap-2">
              <i className="bi bi-award-fill text-warning"></i> Level Progression: {rewards.currentLevel}
            </h5>
            <p className="text-muted extra-small m-0">
              Earn green points by completing verified e-waste disposal, device reuse, or battery recycling.
            </p>
          </div>

          <div className="col-md-6">
            <div className="d-flex align-items-center justify-content-between mb-1 extra-small">
              <span className="text-muted">Progress to {rewards.nextLevel}</span>
              <span className="text-success font-weight-bold">{rewards.progressPercentage}% ({rewards.totalPoints} / {rewards.nextLevelThreshold} pts)</span>
            </div>
            <div className="progress bg-dark border border-secondary border-opacity-50" style={{ height: '10px' }}>
              <div
                className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: `${rewards.progressPercentage}%` }}
                aria-valuenow={rewards.progressPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            {rewards.pointsToNextLevel > 0 && (
              <span className="text-muted extra-small d-block mt-1 text-end">
                {rewards.pointsToNextLevel} more points needed to unlock {rewards.nextLevel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-blue">
              <i className="bi bi-box-seam-fill"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Total Submitted</span>
              <span className="h3 text-white font-weight-bold mb-0">{stats.totalSubmitted}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-amber">
              <i className="bi bi-truck-front-fill"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Awaiting Pickup</span>
              <span className="h3 text-white font-weight-bold mb-0">{stats.awaitingPickup}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-cyan">
              <i className="bi bi-building-check"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Collected</span>
              <span className="h3 text-white font-weight-bold mb-0">{stats.collected}</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-icon-emerald">
              <i className="bi bi-recycle"></i>
            </div>
            <div>
              <span className="text-muted small d-block">Eco Recycled</span>
              <span className="h3 text-white font-weight-bold mb-0">{stats.successfullyProcessed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges & Achievements Section */}
      <div className="glass-card mb-4">
        <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-trophy-fill text-warning"></i> Environmental Achievements &amp; Badges
        </h5>
        <div className="row g-3">
          {rewards.badges && rewards.badges.map((badge) => (
            <div key={badge.id} className="col-6 col-md-4 col-lg-2.4">
              <div className={`p-3 rounded-4 border text-center h-100 transition-all ${
                badge.unlocked
                  ? 'bg-dark bg-opacity-60 border-success shadow-sm'
                  : 'bg-dark bg-opacity-20 border-secondary border-opacity-25 opacity-60'
              }`}>
                <div className={`feature-icon mx-auto mb-2 ${badge.unlocked ? 'text-warning' : 'text-muted'}`} style={{ width: '42px', height: '42px', fontSize: '1.2rem' }}>
                  <i className={`bi ${badge.icon}`}></i>
                </div>
                <h6 className={`small font-weight-bold mb-1 ${badge.unlocked ? 'text-white' : 'text-muted'}`}>
                  {badge.title}
                </h6>
                <p className="extra-small text-muted mb-2 lh-sm">{badge.description}</p>
                <span className={`badge ${badge.unlocked ? 'bg-success text-white' : 'bg-secondary text-dark'} extra-small`}>
                  {badge.progressText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Quick Links & Transaction History */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="glass-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="text-white font-weight-bold m-0 d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-info"></i> Recent Disposal Requests
              </h5>
              <Link to="/user/requests" className="text-success extra-small text-decoration-none font-weight-bold">
                View All <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted">
                <span className="spinner-border spinner-border-sm me-2 text-success"></span>
                Loading request records...
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-inbox display-6 d-block mb-2"></i>
                <p className="small mb-3">No e-waste disposal requests registered yet.</p>
                <Link to="/user/ewaste/add" className="btn btn-primary-custom btn-sm text-white text-decoration-none">
                  Submit First Request
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0 custom-table">
                  <thead>
                    <tr>
                      <th>Tracking ID</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <code className="text-success">{req.trackingNumber}</code>
                        </td>
                        <td>
                          <span className="text-white small">
                            {req.items && req.items.length > 0 ? req.items[0].category : 'E-Waste'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-status badge-status-${req.status}`}>
                            {formatStatus(req.status)}
                          </span>
                        </td>
                        <td className="d-flex align-items-center gap-1">
                          <Link
                            to={`/user/requests/${req.id}`}
                            className="btn btn-outline-custom btn-sm py-1 px-2 text-decoration-none"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => handleDownloadCertificatePdf(req.id, req.trackingNumber)}
                            title="Download PDF Recycling Certificate"
                            className="btn btn-primary-custom btn-sm py-1 px-2 text-white font-weight-bold d-inline-flex align-items-center gap-1"
                          >
                            <i className="bi bi-file-earmark-pdf-fill"></i>
                            Certificate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="glass-card h-100">
            <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-coin text-warning"></i> Green Points Transaction Ledger
            </h5>

            {rewards.transactions && rewards.transactions.length > 0 ? (
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-dark table-hover align-middle mb-0 custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reason / Action</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="text-muted extra-small">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <div className="text-white small font-weight-medium">{tx.description}</div>
                          {tx.trackingNumber && (
                            <code className="text-info extra-small">{tx.trackingNumber}</code>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-success text-white font-weight-bold">
                            +{tx.points} pts
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted small text-center py-4">
                No green points transactions recorded yet. Complete a verified disposal request to earn your first reward!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
