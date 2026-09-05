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
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, requestsRes] = await Promise.all([
        axios.get('/api/user/stats'),
        axios.get('/api/user/ewaste'),
      ])
      setStats(statsRes.data)
      setRecentRequests(requestsRes.data.slice(0, 5))
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
              Schedule e-waste pickups, monitor recycling stages, and track your eco-reward points balance.
            </p>
          </div>
          <div className="text-end bg-dark bg-opacity-60 p-3.5 px-4 rounded-4 border border-secondary border-opacity-25 shadow-sm">
            <span className="text-muted small d-block mb-1 font-weight-bold">Green Points Balance</span>
            <span className="h2 font-weight-bold text-success m-0 d-flex align-items-center justify-content-end gap-2">
              <i className="bi bi-coin text-warning"></i> {stats.greenPoints}
            </span>
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
              <span className="text-muted small d-block">Processed</span>
              <span className="h3 text-white font-weight-bold mb-0">{stats.successfullyProcessed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Triggers */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <Link to="/user/ewaste/add" className="text-decoration-none">
            <div className="feature-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="feature-icon mb-3">
                  <i className="bi bi-plus-circle-fill"></i>
                </div>
                <h3 className="feature-title">Add E-Waste</h3>
                <p className="feature-text mb-0">
                  Submit laptops, phones, appliances, or batteries for safe disposal and reward points.
                </p>
              </div>
              <div className="mt-3 text-success font-weight-semibold">
                Submit Request <i className="bi bi-arrow-right me-1"></i>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-4">
          <Link to="/user/requests" className="text-decoration-none">
            <div className="feature-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="feature-icon mb-3 text-info bg-info bg-opacity-10">
                  <i className="bi bi-list-task"></i>
                </div>
                <h3 className="feature-title">My Requests</h3>
                <p className="feature-text mb-0">
                  Track dispatch status, collection dates, and status updates for your submitted items.
                </p>
              </div>
              <div className="mt-3 text-info font-weight-semibold">
                View All Requests <i className="bi bi-arrow-right me-1"></i>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-4">
          <Link to="/user/profile" className="text-decoration-none">
            <div className="feature-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="feature-icon mb-3 text-warning bg-warning bg-opacity-10">
                  <i className="bi bi-person-gear"></i>
                </div>
                <h3 className="feature-title">Edit Profile</h3>
                <p className="feature-text mb-0">
                  Update your primary address, city, pincode, and contact number for seamless pickup.
                </p>
              </div>
              <div className="mt-3 text-warning font-weight-semibold">
                Update Settings <i className="bi bi-arrow-right me-1"></i>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="glass-card">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h4 className="text-white font-weight-bold m-0 d-flex align-items-center gap-2">
            <i className="bi bi-clock-history text-success"></i> Recent Disposal Requests
          </h4>
          <Link to="/user/requests" className="btn btn-outline-custom btn-sm">
            View All <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-4 text-muted">Loading disposal requests...</div>
        ) : recentRequests.length === 0 ? (
          <div className="text-center py-5 border border-dashed border-secondary border-opacity-25 rounded-4">
            <i className="bi bi-inbox text-muted display-4 d-block mb-2"></i>
            <h5 className="text-white mb-2">No Disposal Requests Yet</h5>
            <p className="text-muted small mb-3">You have not submitted any e-waste items for recycling.</p>
            <Link to="/user/ewaste/add" className="btn btn-primary-custom py-2 px-4 text-white text-decoration-none">
              <i className="bi bi-plus-lg me-1"></i> Add E-Waste Now
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Tracking Number</th>
                  <th>Device / Category</th>
                  <th>Pickup City</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((req) => {
                  const firstItem = req.items && req.items.length > 0 ? req.items[0] : null
                  return (
                    <tr key={req.id}>
                      <td className="font-weight-bold text-success">
                        <code>{req.trackingNumber}</code>
                      </td>
                      <td>
                        <span className="text-white font-weight-semibold d-block">
                          {firstItem?.deviceName || firstItem?.category || 'E-Waste Item'}
                        </span>
                        <small className="text-muted">{firstItem?.brand || firstItem?.category}</small>
                      </td>
                      <td>{req.pickupCity || 'N/A'}</td>
                      <td>
                        <span className={`badge-status badge-status-${req.status}`}>
                          {formatStatus(req.status)}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="text-end">
                        <Link to={`/user/requests/${req.id}`} className="btn btn-outline-custom btn-sm">
                          Details <i className="bi bi-chevron-right ms-1"></i>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
