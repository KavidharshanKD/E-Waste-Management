import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [pickups, setPickups] = useState([])
  const [collectors, setCollectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCollectors, setSelectedCollectors] = useState({})
  const [assigningId, setAssigningId] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [pickupsRes, collectorsRes] = await Promise.all([
        axios.get('/api/admin/pickups'),
        axios.get('/api/admin/collectors')
      ])
      setPickups(pickupsRes.data || [])
      setCollectors(collectorsRes.data || [])
    } catch (err) {
      console.error('Failed to fetch admin dispatch data', err)
      setError(err.response?.data?.error || 'Failed to load dispatch and collector list.')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCollector = async (pickupId) => {
    const collectorId = selectedCollectors[pickupId]
    if (!collectorId) {
      alert('Please select a collector from the dropdown first.')
      return
    }

    try {
      setAssigningId(pickupId)
      setSuccessMsg(null)
      await axios.put(`/api/admin/pickups/${pickupId}/assign`, {
        collectorId: parseInt(collectorId)
      })
      setSuccessMsg(`Collector assigned successfully for pickup ID: ${pickupId}`)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign collector')
    } finally {
      setAssigningId(null)
    }
  }

  const pendingCount = pickups.filter((p) => p.status === 'SCHEDULED' || !p.collectorId).length
  const assignedCount = pickups.filter((p) => p.collectorId).length

  return (
    <div className="container py-4">
      {/* Hero Header */}
      <div className="hero-card mb-4">
        <span className="hero-tag">🛡️ System Administration</span>
        <h1 className="hero-title h2 mb-1">
          Master Control &amp; Doorstep Logistics Dispatch
        </h1>
        <p className="hero-description small mb-0">
          Supervise user role management, system analytics, pending doorstep pickup assignments, and collector dispatches.
        </p>
      </div>

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>{successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)}></button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="feature-card text-center">
            <div className="feature-icon mx-auto">
              <i className="bi bi-clock-history text-warning"></i>
            </div>
            <h4 className="feature-title h5">Pending Assignments</h4>
            <p className="text-warning font-weight-bold display-6 mb-0">{pendingCount}</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="feature-card text-center">
            <div className="feature-icon mx-auto">
              <i className="bi bi-truck text-success"></i>
            </div>
            <h4 className="feature-title h5">Assigned Dispatches</h4>
            <p className="text-success font-weight-bold display-6 mb-0">{assignedCount}</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="feature-card text-center">
            <div className="feature-icon mx-auto">
              <i className="bi bi-person-badge text-info"></i>
            </div>
            <h4 className="feature-title h5">Active Collectors</h4>
            <p className="text-info font-weight-bold display-6 mb-0">{collectors.length}</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="feature-card text-center">
            <div className="feature-icon mx-auto">
              <i className="bi bi-box-seam text-primary"></i>
            </div>
            <h4 className="feature-title h5">Total Pickups</h4>
            <p className="text-white font-weight-bold display-6 mb-0">{pickups.length}</p>
          </div>
        </div>
      </div>

      {/* Doorstep Pickups & Collector Assignment Table */}
      <div className="glass-card mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h5 className="text-white font-weight-bold m-0 d-flex align-items-center gap-2">
            <i className="bi bi-truck-flatbed text-success"></i> Doorstep Pickup &amp; Collector Assignment Management
          </h5>
          <button onClick={fetchData} className="btn btn-outline-custom btn-sm">
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh List
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5 text-muted">
            <span className="spinner-border spinner-border-sm me-2 text-success" role="status"></span>
            Loading pending doorstep pickup requests...
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center mb-0">{error}</div>
        ) : pickups.length === 0 ? (
          <p className="text-muted text-center py-4 m-0">No doorstep pickup requests found in system.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0 custom-table">
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>User / Address</th>
                  <th>Schedule Date &amp; Slot</th>
                  <th>Device Info</th>
                  <th>Current Status</th>
                  <th>Assigned Collector</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pickups.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <code className="text-success">{p.trackingNumber || 'N/A'}</code>
                    </td>
                    <td>
                      <div className="text-white small font-weight-semibold">{p.userName || 'Resident User'}</div>
                      <div className="text-muted extra-small">{p.pickupAddress}</div>
                      <div className="text-info extra-small"><i className="bi bi-telephone me-1"></i>{p.contactNumber || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="text-white small">{p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString() : 'N/A'}</div>
                      <span className="badge bg-secondary text-white extra-small">{p.timeSlot || 'GENERAL'}</span>
                    </td>
                    <td>
                      {p.items && p.items.length > 0 ? (
                        <span className="text-white small">{p.items[0].deviceName} ({p.items[0].quantity}x)</span>
                      ) : (
                        <span className="text-muted small">E-Waste Item</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === 'COLLECTED' ? 'bg-success' :
                        p.status === 'ASSIGNED' ? 'bg-primary' :
                        p.status === 'ON_THE_WAY' ? 'bg-warning text-dark' : 'bg-secondary'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {p.collectorName ? (
                        <span className="text-info font-weight-bold small">
                          <i className="bi bi-person-check me-1"></i>{p.collectorName}
                        </span>
                      ) : (
                        <span className="text-warning extra-small">Unassigned</span>
                      )}
                    </td>
                    <td style={{ minWidth: '220px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <select
                          className="form-select form-select-sm bg-dark text-white border-secondary"
                          value={selectedCollectors[p.id] || p.collectorId || ''}
                          onChange={(e) => setSelectedCollectors({ ...selectedCollectors, [p.id]: e.target.value })}
                        >
                          <option value="">Select Collector...</option>
                          {collectors.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.profile?.firstName ? `${c.profile.firstName} ${c.profile.lastName || ''}` : c.email}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignCollector(p.id)}
                          disabled={assigningId === p.id}
                          className="btn btn-success btn-sm font-weight-bold"
                          title="Assign Collector"
                        >
                          {assigningId === p.id ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : (
                            'Assign'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
