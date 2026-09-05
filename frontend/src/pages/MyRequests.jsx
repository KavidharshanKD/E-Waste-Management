import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'

export default function MyRequests() {
  const location = useLocation()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(location.state?.successMsg || null)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/user/ewaste')
      setRequests(res.data)
    } catch (err) {
      console.error('Failed to fetch requests', err)
      setError('Unable to load your disposal requests. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this e-waste disposal request?')) {
      return
    }

    try {
      setCancellingId(requestId)
      await axios.delete(`/api/user/ewaste/${requestId}`)
      setSuccessMsg('Disposal request cancelled successfully.')
      fetchRequests()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel request')
    } finally {
      setCancellingId(null)
    }
  }

  const formatStatus = (status) => {
    if (!status) return ''
    return status.replace(/_/g, ' ')
  }

  const filteredRequests = requests.filter((req) => {
    if (activeFilter === 'ALL') return true
    if (activeFilter === 'ACTIVE') {
      return ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PICKUP_ASSIGNED'].includes(req.status)
    }
    if (activeFilter === 'PROCESSED') {
      return ['COLLECTED', 'AT_RECYCLING_CENTER', 'PROCESSING', 'RECYCLED', 'REUSED', 'REFURBISHED', 'COMPLETED'].includes(req.status)
    }
    if (activeFilter === 'CANCELLED') {
      return req.status === 'CANCELLED'
    }
    return true
  })

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="hero-title h2 mb-1">My Disposal Requests</h1>
          <p className="text-muted small mb-0">
            Track the status of all your submitted e-waste collections and recycling lifecycle stages.
          </p>
        </div>
        <Link to="/user/ewaste/add" className="btn btn-primary-custom py-2 px-3 text-white text-decoration-none">
          <i className="bi bi-plus-lg me-1"></i> Submit New E-Waste
        </Link>
      </div>

      {successMsg && (
        <div className="alert alert-success border-0 rounded-4 shadow-sm mb-4 alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="d-flex align-items-center gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`btn btn-sm rounded-pill px-3 ${activeFilter === 'ALL' ? 'btn-primary-custom text-white' : 'btn-outline-custom text-muted'}`}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setActiveFilter('ACTIVE')}
          className={`btn btn-sm rounded-pill px-3 ${activeFilter === 'ACTIVE' ? 'btn-primary-custom text-white' : 'btn-outline-custom text-muted'}`}
        >
          Awaiting Pickup / Active
        </button>
        <button
          onClick={() => setActiveFilter('PROCESSED')}
          className={`btn btn-sm rounded-pill px-3 ${activeFilter === 'PROCESSED' ? 'btn-primary-custom text-white' : 'btn-outline-custom text-muted'}`}
        >
          Collected &amp; Processed
        </button>
        <button
          onClick={() => setActiveFilter('CANCELLED')}
          className={`btn btn-sm rounded-pill px-3 ${activeFilter === 'CANCELLED' ? 'btn-primary-custom text-white' : 'btn-outline-custom text-muted'}`}
        >
          Cancelled
        </button>
      </div>

      {/* Content Table */}
      <div className="glass-card">
        {loading ? (
          <div className="text-center py-5 text-muted">
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            Loading your requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-5 border border-dashed border-secondary border-opacity-25 rounded-4">
            <i className="bi bi-search text-muted display-4 d-block mb-2"></i>
            <h5 className="text-white mb-2">No Requests Found</h5>
            <p className="text-muted small mb-3">
              {activeFilter === 'ALL'
                ? "You haven't created any e-waste disposal requests yet."
                : `No requests match the "${activeFilter}" filter.`}
            </p>
            {activeFilter === 'ALL' && (
              <Link to="/user/ewaste/add" className="btn btn-primary-custom text-white text-decoration-none">
                <i className="bi bi-plus-lg me-1"></i> Add E-Waste Now
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom align-middle">
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Device / Specs</th>
                  <th>Pickup Address</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const firstItem = req.items && req.items.length > 0 ? req.items[0] : null
                  const isCancellable = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PICKUP_ASSIGNED'].includes(req.status)

                  return (
                    <tr key={req.id}>
                      <td>
                        <span className="font-weight-bold text-success d-block">
                          <code>{req.trackingNumber}</code>
                        </span>
                        <small className="text-muted">
                          {req.pickupRequired ? '🚚 Doorstep Pickup' : '🏢 Self Drop-off'}
                        </small>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {firstItem?.imageUrl ? (
                            <img
                              src={firstItem.imageUrl}
                              alt="Device"
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              className="rounded-2 border border-secondary"
                            />
                          ) : (
                            <div className="bg-dark p-2 rounded-2 border border-secondary text-success text-center" style={{ width: '40px', height: '40px' }}>
                              <i className="bi bi-box-seam"></i>
                            </div>
                          )}
                          <div>
                            <span className="text-white font-weight-semibold d-block">
                              {firstItem?.deviceName || firstItem?.category || 'E-Waste Item'}
                            </span>
                            <span className="extra-small text-muted">
                              Qty: {firstItem?.quantity || 1} • {firstItem?.condition || 'WORKING'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ maxWidth: '200px' }} className="text-truncate">
                        <span className="d-block text-white small">{req.pickupAddress}</span>
                        <span className="text-muted extra-small">{req.pickupCity}, {req.pickupPostalCode}</span>
                      </td>

                      <td>
                        <span className={`badge-status badge-status-${req.status}`}>
                          {formatStatus(req.status)}
                        </span>
                      </td>

                      <td className="text-muted small">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <Link to={`/user/requests/${req.id}`} className="btn btn-outline-custom btn-sm">
                            <i className="bi bi-eye-fill me-1"></i> Details
                          </Link>
                          {isCancellable && (
                            <button
                              onClick={() => handleCancelRequest(req.id)}
                              disabled={cancellingId === req.id}
                              className="btn btn-outline-danger btn-sm rounded-3"
                              title="Cancel Request"
                            >
                              {cancellingId === req.id ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <i className="bi bi-x-circle-fill"></i>
                              )}
                            </button>
                          )}
                        </div>
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
