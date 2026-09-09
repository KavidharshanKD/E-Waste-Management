import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { formatIndianDate } from '../utils/workflowHelpers'

export default function CollectorDashboard() {
  const { user } = useAuth()
  const [pickups, setPickups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [collectorNotes, setCollectorNotes] = useState({})
  const [activeTab, setActiveTab] = useState('ACTIVE')

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
      setError(err.response?.data?.error || 'Failed to update pickup status.')
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

  const formatStatus = (status) => {
    if (!status) return ''
    return status.replace(/_/g, ' ')
  }

  return (
    <div className="py-4">
      {/* Header Stream */}
      <div className="editorial-tag">COLLECTOR OPERATIONS PORTAL</div>
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <h1 className="h1 text-uppercase fw-bold m-0">COLLECTOR DISPATCH STREAM</h1>
          <p className="text-secondary small mt-1">
            Doorstep pickup assignments for {user?.profile?.firstName || 'Collector'}. Inspect addresses, update chain-of-custody status, and record notes.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className={`btn ${activeTab === 'ACTIVE' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Active Dispatches ({activePickups.length})
          </button>
          <button
            className={`btn ${activeTab === 'HISTORY' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            History ({historyPickups.length})
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {loading ? (
        <div className="py-4 text-muted small">Loading assigned dispatches...</div>
      ) : displayedPickups.length === 0 ? (
        <div className="py-4 text-muted small">
          No {activeTab.toLowerCase()} pickup assignments found.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="editorial-table">
            <thead>
              <tr>
                <th>TRACKING ID</th>
                <th>SCHEDULED</th>
                <th>USER / ADDRESS</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {displayedPickups.map((p) => (
                <tr key={p.id}>
                  <td>
                    <code className="fw-bold">{p.trackingNumber || 'N/A'}</code>
                  </td>
                  <td className="small">
                    {p.scheduledDate ? formatIndianDate(p.scheduledDate) : 'ASAP'}
                    <div className="text-muted extra-small">{p.timeSlot || 'General'}</div>
                  </td>
                  <td>
                    <div className="fw-bold">{p.userName || 'Resident User'}</div>
                    <div className="text-secondary extra-small">{p.pickupAddress}</div>
                    <div className="text-muted extra-small">{p.contactNumber}</div>
                  </td>
                  <td>
                    <span className="status-dot-item">
                      <span className={`status-dot ${
                        p.status === 'COLLECTED' ? 'status-dot-emerald' :
                        p.status === 'ON_THE_WAY' ? 'status-dot-info' : 'status-dot-warning'
                      }`}></span>
                      {formatStatus(p.status)}
                    </span>
                  </td>
                  <td>
                    {activeTab === 'ACTIVE' && (
                      <div className="d-flex align-items-center gap-2">
                        {p.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleStatusUpdate(p.id, 'ON_THE_WAY')}
                            disabled={updatingId === p.id}
                            className="btn btn-outline-custom btn-sm"
                          >
                            On The Way
                          </button>
                        )}
                        {(p.status === 'ASSIGNED' || p.status === 'ON_THE_WAY') && (
                          <button
                            onClick={() => handleStatusUpdate(p.id, 'COLLECTED')}
                            disabled={updatingId === p.id}
                            className="btn btn-primary-custom btn-sm"
                          >
                            Mark Collected
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
