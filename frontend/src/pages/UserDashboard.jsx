import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { formatIndianDate } from '../utils/workflowHelpers'

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
  const [impact, setImpact] = useState({
    totalDisposedDevices: 0,
    reusedOrDonatedDevices: 0,
    completedRequests: 0,
    greenPoints: 0,
    estimatedLandfillDiversionKg: 0,
    estimatedCo2ReductionKg: 0,
    hasValidFactors: false,
    factorSourceReference: ''
  })
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, requestsRes, rewardsRes, impactRes] = await Promise.all([
        axios.get('/api/user/stats'),
        axios.get('/api/user/ewaste'),
        axios.get('/api/user/rewards'),
        axios.get('/api/analytics/user')
      ])
      setStats(statsRes.data)
      setRecentRequests(requestsRes.data.slice(0, 5))
      setRewards(rewardsRes.data)
      setImpact(impactRes.data)
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
      setActionMessage({ type: 'success', text: 'Certificate downloaded successfully.' })
    } catch (err) {
      console.error('Failed to download certificate PDF', err)
      setActionMessage({ type: 'warning', text: 'Certificate PDF is generated once request status reaches COMPLETED.' })
    }
  }

  return (
    <div className="editorial-dashboard-container py-3">
      {actionMessage && (
        <div className={`alert alert-${actionMessage.type} alert-dismissible fade show mb-4`} role="alert">
          {actionMessage.text}
          <button type="button" className="btn-close" onClick={() => setActionMessage(null)}></button>
        </div>
      )}

      {/* Header Banner Stream */}
      <section className="mb-4">
        <div className="editorial-tag">CITIZEN DISPOSAL DASHBOARD</div>
        <div className="d-flex justify-content-between align-items-baseline flex-wrap gap-3 pb-3 border-bottom border-dark">
          <div>
            <h1 className="h2 text-uppercase fw-bold m-0">
              WELCOME, {user?.profile?.firstName || user?.email?.split('@')[0] || 'CITIZEN'}
            </h1>
            <p className="text-secondary small m-0">
              Track active dispatches, monitor environmental savings, and manage recycling credentials.
            </p>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="status-dot-item">
              <span className="status-dot status-dot-emerald"></span>
              {rewards.currentLevel}
            </span>
            <div className="fs-4 fw-bold">
              {rewards.totalPoints} <span className="fs-6 text-muted font-weight-normal">PTS</span>
            </div>
            <Link to="/user/ewaste/add" className="btn btn-primary-custom">
              DISPOSE E-WASTE ↗
            </Link>
          </div>
        </div>
      </section>

      {/* Linear Stat Summary Stream — No Cards */}
      <section className="py-3">
        <div className="row g-4 text-start">
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">TOTAL SUBMITTED</div>
            <div className="fs-2 fw-bold">{stats.totalSubmitted}</div>
            <div className="text-secondary extra-small">Requests initiated</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">AWAITING PICKUP</div>
            <div className="fs-2 fw-bold">{stats.awaitingPickup}</div>
            <div className="text-secondary extra-small">Collector scheduled</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">COLLECTED</div>
            <div className="fs-2 fw-bold">{stats.collected}</div>
            <div className="text-secondary extra-small">At facility hub</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">ECO RECYCLED</div>
            <div className="fs-2 fw-bold text-success">{stats.successfullyProcessed}</div>
            <div className="text-secondary extra-small">Certificate issued</div>
          </div>
        </div>
      </section>

      <div className="thin-rule"></div>

      {/* Environmental Contribution Stream */}
      <section className="py-3">
        <div className="editorial-tag">ENVIRONMENTAL AUDIT IMPACT</div>
        <div className="grid-split-60-40 my-3">
          <div>
            <h2 className="h4 text-uppercase fw-bold mb-3">YOUR ECOLOGICAL FOOTPRINT</h2>
            <div className="d-flex flex-column gap-2 text-secondary fs-6">
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Total Disposed Equipment:</span>
                <strong className="text-dark">{impact.totalDisposedDevices} units</strong>
              </div>
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Reused or Donated Devices:</span>
                <strong className="text-dark">{impact.reusedOrDonatedDevices} units</strong>
              </div>
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Completed Request Lifecycles:</span>
                <strong className="text-dark">{impact.completedRequests} requests</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Green Points Credit Balance:</span>
                <strong className="text-success">{impact.greenPoints} PTS</strong>
              </div>
            </div>
          </div>

          {impact.hasValidFactors && (
            <div className="border-start ps-md-4 pt-3 pt-md-0">
              <h3 className="h5 text-uppercase fw-bold mb-3">ESTIMATED DIVERSION &amp; CO2</h3>
              <div className="mb-3">
                <div className="small text-muted text-uppercase fw-bold">Landfill Diversion</div>
                <div className="fs-3 fw-bold text-success">{impact.estimatedLandfillDiversionKg} KG</div>
              </div>
              <div>
                <div className="small text-muted text-uppercase fw-bold">CO2 Emissions Avoided</div>
                <div className="fs-3 fw-bold text-info">{impact.estimatedCo2ReductionKg} KG CO2e</div>
              </div>
              <p className="extra-small text-muted mt-3 m-0">
                Calculated using environmental conversion benchmarks ({impact.factorSourceReference}).
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="thin-rule"></div>

      {/* Recent Requests Table */}
      <section className="py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 text-uppercase fw-bold m-0">RECENT DISPOSAL REQUESTS</h2>
          <Link to="/user/requests" className="btn-link-action">
            VIEW ALL ↗
          </Link>
        </div>

        {loading ? (
          <div className="py-4 text-muted small">Loading disposal records...</div>
        ) : recentRequests.length === 0 ? (
          <div className="py-4 text-muted small">
            No disposal requests registered yet. <Link to="/user/ewaste/add">Submit a request</Link> to start.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>TRACKING ID</th>
                  <th>CATEGORY</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <code className="fw-bold">{req.trackingNumber}</code>
                    </td>
                    <td>
                      {req.items && req.items.length > 0 ? req.items[0].category : 'E-Waste'}
                    </td>
                    <td>
                      <span className="status-dot-item">
                        <span className={`status-dot ${
                          req.status === 'COMPLETED' ? 'status-dot-emerald' :
                          req.status === 'PICKUP_ASSIGNED' ? 'status-dot-info' : 'status-dot-warning'
                        }`}></span>
                        {formatStatus(req.status)}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Link to={`/user/requests/${req.id}`} className="btn btn-outline-custom btn-sm">
                          Details
                        </Link>
                        <button
                          onClick={() => handleDownloadCertificatePdf(req.id, req.trackingNumber)}
                          className="btn btn-secondary btn-sm"
                        >
                          Certificate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Green Points Ledger */}
      {rewards.transactions && rewards.transactions.length > 0 && (
        <section className="py-3">
          <h2 className="h4 text-uppercase fw-bold mb-3">GREEN POINTS LEDGER</h2>
          <div className="table-responsive">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>DESCRIPTION</th>
                  <th>POINTS</th>
                </tr>
              </thead>
              <tbody>
                {rewards.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-muted small">
                      {tx.createdAt ? formatIndianDate(tx.createdAt) : 'N/A'}
                    </td>
                    <td>
                      {tx.description}
                      {tx.trackingNumber && <code className="ms-2 small">{tx.trackingNumber}</code>}
                    </td>
                    <td className="fw-bold text-success">
                      +{tx.points} PTS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
