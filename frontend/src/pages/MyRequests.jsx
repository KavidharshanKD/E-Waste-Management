import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { formatIndianDate } from '../utils/workflowHelpers'

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
      setError(err.response?.data?.error || 'Failed to cancel request.')
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
    <div className="py-4">
      {/* Header */}
      <div className="editorial-tag">MY DISPOSAL STREAM</div>
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <h1 className="h1 text-uppercase fw-bold m-0">DISPOSAL REQUESTS HISTORY</h1>
          <p className="text-secondary small mt-1">
            Track collection status, inspection stages, and certificates issued.
          </p>
        </div>
        <Link to="/user/ewaste/add" className="btn btn-primary-custom">
          Dispose E-Waste ↗
        </Link>
      </div>

      {successMsg && <div className="alert alert-success mb-4">{successMsg}</div>}
      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-4 border-bottom border-dark pb-2 flex-wrap">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`btn ${activeFilter === 'ALL' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
        >
          All ({requests.length})
        </button>
        <button
          onClick={() => setActiveFilter('ACTIVE')}
          className={`btn ${activeFilter === 'ACTIVE' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
        >
          Active Dispatches
        </button>
        <button
          onClick={() => setActiveFilter('PROCESSED')}
          className={`btn ${activeFilter === 'PROCESSED' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
        >
          Collected &amp; Recycled
        </button>
        <button
          onClick={() => setActiveFilter('CANCELLED')}
          className={`btn ${activeFilter === 'CANCELLED' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
        >
          Cancelled
        </button>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="py-4 text-muted small">Loading requests...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-4 text-muted small">
          No disposal requests match the selected filter.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="editorial-table">
            <thead>
              <tr>
                <th>TRACKING NUMBER</th>
                <th>EQUIPMENT</th>
                <th>PICKUP LOCATION</th>
                <th>STATUS</th>
                <th>SUBMITTED DATE</th>
                <th className="text-end">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const firstItem = req.items && req.items.length > 0 ? req.items[0] : null
                const isCancellable = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PICKUP_ASSIGNED'].includes(req.status)

                return (
                  <tr key={req.id}>
                    <td>
                      <code className="fw-bold">{req.trackingNumber}</code>
                    </td>
                    <td>
                      <span className="fw-bold">{firstItem?.deviceName || firstItem?.category || 'E-Waste'}</span>
                      <span className="text-muted extra-small d-block">Qty: {firstItem?.quantity || 1}</span>
                    </td>
                    <td className="small">
                      {req.pickupAddress}, {req.pickupCity}
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
                    <td className="text-muted small">
                      {req.createdAt ? formatIndianDate(req.createdAt) : 'N/A'}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <Link to={`/user/requests/${req.id}`} className="btn btn-outline-custom btn-sm">
                          Details
                        </Link>
                        {isCancellable && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            disabled={cancellingId === req.id}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancel
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
  )
}
