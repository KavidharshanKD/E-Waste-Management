import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function CollectorDashboard() {
  const { user } = useAuth()
  const [pickups, setPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [collectorNotes, setCollectorNotes] = useState({})
  const [activeTab, setActiveTab] = useState('ACTIVE') // 'ACTIVE' or 'HISTORY'

  useEffect(() => {
    fetchAssignedPickups()
  }, [])

  const fetchAssignedPickups = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/collector/pickups')
      setPickups(res.data || [])
    } catch (err) {
      console.error('Failed to fetch assigned pickups', err)
      setError(err.response?.data?.error || 'Failed to load assigned pickups.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (pickupId, newStatus) => {
    try {
      setUpdatingId(pickupId)
      const notes = collectorNotes[pickupId] || ''
      await axios.put(`/api/collector/pickups/${pickupId}/status`, {
        status: newStatus,
        collectorNotes: notes
      })
      await fetchAssignedPickups()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update pickup status')
    } finally {
      setUpdatingId(null)
    }
  }

  const activePickups = pickups.filter(
    (p) => p.status === 'ASSIGNED' || p.status === 'ON_THE_WAY' || p.status === 'SCHEDULED'
  )
  const historyPickups = pickups.filter(
    (p) => p.status === 'COLLECTED' || p.status === 'FAILED' || p.status === 'CANCELLED'
  )

  const displayedPickups = activeTab === 'ACTIVE' ? activePickups : historyPickups

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return <span className="badge bg-primary text-white">ASSIGNED</span>
      case 'ON_THE_WAY':
        return <span className="badge bg-warning text-dark">ON THE WAY</span>
      case 'COLLECTED':
        return <span className="badge bg-success text-white">COLLECTED</span>
      case 'FAILED':
        return <span className="badge bg-danger text-white">FAILED</span>
      case 'CANCELLED':
        return <span className="badge bg-secondary text-white">CANCELLED</span>
      default:
        return <span className="badge bg-info text-dark">{status}</span>
    }
  }

  const getTimeSlotBadge = (slot) => {
    switch (slot) {
      case 'MORNING':
        return <span className="badge bg-info bg-opacity-20 text-info border border-info border-opacity-25">🌅 Morning (8 AM - 12 PM)</span>
      case 'AFTERNOON':
        return <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25">☀️ Afternoon (12 PM - 4 PM)</span>
      case 'EVENING':
        return <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-25">🌆 Evening (4 PM - 8 PM)</span>
      default:
        return <span className="badge bg-secondary text-white">{slot || 'General'}</span>
    }
  }

  return (
    <div className="container py-4">
      {/* Hero Header */}
      <div className="hero-card mb-4">
        <span className="hero-tag">🚚 Logistics &amp; Doorstep Dispatches</span>
        <h1 className="hero-title h2 mb-1">
          Collector Field Dashboard
        </h1>
        <p className="hero-description small mb-0">
          Manage doorstep pickups assigned to you ({user?.profile?.firstName || 'Collector'}). Update collection status, view user contact info, and inspect device details.
        </p>
      </div>

      {/* Tabs */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div className="btn-group">
          <button
            className={`btn ${activeTab === 'ACTIVE' ? 'btn-success' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            <i className="bi bi-truck me-1"></i> Active Dispatches ({activePickups.length})
          </button>
          <button
            className={`btn ${activeTab === 'HISTORY' ? 'btn-success' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            <i className="bi bi-clock-history me-1"></i> Pickup History ({historyPickups.length})
          </button>
        </div>

        <button onClick={fetchAssignedPickups} className="btn btn-outline-custom btn-sm">
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh List
        </button>
      </div>

      {loading ? (
        <div className="glass-card text-center py-5">
          <span className="spinner-border spinner-border-sm text-success me-2" role="status"></span>
          Loading assigned dispatches...
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center">{error}</div>
      ) : displayedPickups.length === 0 ? (
        <div className="glass-card text-center py-5">
          <i className="bi bi-inbox text-muted display-4 d-block mb-3"></i>
          <h5 className="text-white">No {activeTab.toLowerCase()} pickups found</h5>
          <p className="text-muted small m-0">
            {activeTab === 'ACTIVE'
              ? 'You currently have no pending doorstep pickup assignments.'
              : 'No past pickup history recorded.'}
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {displayedPickups.map((p) => (
            <div key={p.id} className="col-lg-6">
              <div className="glass-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <div>
                      <span className="text-muted extra-small d-block">Tracking ID</span>
                      <h5 className="text-success font-weight-bold m-0">
                        <code>{p.trackingNumber || 'N/A'}</code>
                      </h5>
                    </div>
                    <div>
                      {getStatusBadge(p.status)}
                    </div>
                  </div>

                  <div className="p-3 bg-dark bg-opacity-40 rounded-3 border border-secondary border-opacity-25 mb-3">
                    <div className="row g-2">
                      <div className="col-sm-6">
                        <span className="text-muted extra-small d-block">Scheduled Date</span>
                        <span className="text-white font-weight-medium">
                          {p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString() : 'ASAP'}
                        </span>
                      </div>

                      <div className="col-sm-6">
                        <span className="text-muted extra-small d-block">Time Slot</span>
                        {getTimeSlotBadge(p.timeSlot)}
                      </div>

                      <div className="col-12 mt-2">
                        <span className="text-muted extra-small d-block">Doorstep Address</span>
                        <span className="text-white small font-weight-medium">
                          <i className="bi bi-geo-alt-fill text-warning me-1"></i>
                          {p.pickupAddress || 'Address on record'}
                        </span>
                      </div>

                      <div className="col-sm-6 mt-2">
                        <span className="text-muted extra-small d-block">User Name</span>
                        <span className="text-white small font-weight-semibold">
                          <i className="bi bi-person me-1"></i>{p.userName || 'Resident User'}
                        </span>
                      </div>

                      <div className="col-sm-6 mt-2">
                        <span className="text-muted extra-small d-block">Contact Number</span>
                        <a href={`tel:${p.contactNumber}`} className="text-info small font-weight-bold text-decoration-none">
                          <i className="bi bi-telephone-fill me-1"></i>{p.contactNumber || 'N/A'}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="mb-3">
                    <span className="text-muted extra-small d-block mb-1 font-weight-bold uppercase text-success">
                      📦 Device Details
                    </span>
                    {p.items && p.items.length > 0 ? (
                      <div className="p-2 bg-dark rounded border border-secondary">
                        {p.items.map((item, idx) => (
                          <div key={idx} className="d-flex align-items-center justify-content-between py-1 border-bottom border-secondary border-opacity-25 last-no-border">
                            <div>
                              <span className="text-white small font-weight-semibold">{item.deviceName}</span>
                              <span className="text-muted extra-small d-block">Condition: {item.condition}</span>
                            </div>
                            <span className="badge bg-secondary text-white">{item.quantity} Unit(s)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted extra-small">No specific device details.</p>
                    )}
                  </div>

                  {p.notes && (
                    <div className="mb-3">
                      <span className="text-muted extra-small d-block">User Special Notes</span>
                      <p className="text-white extra-small bg-dark p-2 rounded border border-secondary m-0">
                        {p.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Collector Update Actions */}
                {activeTab === 'ACTIVE' && (
                  <div className="pt-3 border-top border-secondary border-opacity-25 mt-3">
                    <label className="text-muted extra-small d-block mb-1">Add Collector Field Notes</label>
                    <input
                      type="text"
                      className="form-control form-control-sm mb-3 bg-dark text-white border-secondary"
                      placeholder="e.g. Verified device condition, customer handed over item"
                      value={collectorNotes[p.id] || ''}
                      onChange={(e) => setCollectorNotes({ ...collectorNotes, [p.id]: e.target.value })}
                    />

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {p.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleStatusUpdate(p.id, 'ON_THE_WAY')}
                          disabled={updatingId === p.id}
                          className="btn btn-warning btn-sm text-dark font-weight-bold flex-grow-1"
                        >
                          <i className="bi bi-truck me-1"></i> Mark ON THE WAY
                        </button>
                      )}

                      {(p.status === 'ASSIGNED' || p.status === 'ON_THE_WAY') && (
                        <button
                          onClick={() => handleStatusUpdate(p.id, 'COLLECTED')}
                          disabled={updatingId === p.id}
                          className="btn btn-success btn-sm text-white font-weight-bold flex-grow-1"
                        >
                          <i className="bi bi-check-circle-fill me-1"></i> Mark COLLECTED
                        </button>
                      )}

                      <button
                        onClick={() => handleStatusUpdate(p.id, 'FAILED')}
                        disabled={updatingId === p.id}
                        className="btn btn-outline-danger btn-sm"
                      >
                        <i className="bi bi-x-circle me-1"></i> Failed
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(p.id, 'CANCELLED')}
                        disabled={updatingId === p.id}
                        className="btn btn-outline-secondary btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
