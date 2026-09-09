import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { formatIndianDate } from '../utils/workflowHelpers'

export default function AdminDashboard() {
  const { user } = useAuth()

  // Tab State
  const [activeTab, setActiveTab] = useState('overview')

  // Data States
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [pickups, setPickups] = useState([])
  const [collectors, setCollectors] = useState([])
  const [centers, setCenters] = useState([])
  const [certificates, setCertificates] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Filters & Search
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [userPage, setUserPage] = useState(1)
  const itemsPerPage = 10

  const [requestSearch, setRequestSearch] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('ALL')
  const [requestPage, setRequestPage] = useState(1)

  // Modals / Actions
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)
  const [newStatus, setNewStatus] = useState('AT_RECYCLING_CENTER')
  const [statusComment, setStatusComment] = useState('')

  const [selectedCollectors, setSelectedCollectors] = useState({})
  const [assigningPickupId, setAssigningPickupId] = useState(null)
  const [editingCenter, setEditingCenter] = useState(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const [
        statsRes,
        usersRes,
        requestsRes,
        pickupsRes,
        collectorsRes,
        centersRes,
        certificatesRes
      ] = await Promise.all([
        axios.get('/api/admin/stats', { headers }),
        axios.get('/api/admin/users', { headers }),
        axios.get('/api/admin/requests', { headers }),
        axios.get('/api/admin/pickups', { headers }),
        axios.get('/api/admin/collectors', { headers }),
        axios.get('/api/recycling-centers', { headers }),
        axios.get('/api/admin/certificates', { headers })
      ])

      setStats(statsRes.data || null)
      setUsers(usersRes.data || [])
      setRequests(requestsRes.data || [])
      setPickups(pickupsRes.data || [])
      setCollectors(collectorsRes.data || [])
      setCenters(centersRes.data || [])
      setCertificates(certificatesRes.data || [])
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err)
      setError(err.response?.data?.error || 'Failed to load administrator dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleUserActive = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.put(`/api/admin/users/${userId}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMsg(`User active status updated to ${res.data.active ? 'ACTIVE' : 'INACTIVE'}.`)
      await fetchAllData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle user status')
    }
  }

  const handleApproveRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`/api/admin/requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMsg(`Request #${requestId} approved successfully.`)
      await fetchAllData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve request')
    }
  }

  const handleAssignCollector = async (pickupId) => {
    const collectorId = selectedCollectors[pickupId]
    if (!collectorId) {
      setError('Please select a collector from the dropdown first.')
      return
    }
    try {
      setAssigningPickupId(pickupId)
      const token = localStorage.getItem('token')
      await axios.put(`/api/admin/pickups/${pickupId}/assign`, {
        collectorId: parseInt(collectorId)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMsg(`Collector assigned for pickup #${pickupId}.`)
      await fetchAllData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign collector')
    } finally {
      setAssigningPickupId(null)
    }
  }

  const formatStatus = (status) => {
    if (!status) return ''
    return status.replace(/_/g, ' ')
  }

  const filteredUsers = users.filter(u => {
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false
    if (userSearch) {
      const s = userSearch.toLowerCase()
      return (u.email && u.email.toLowerCase().includes(s)) ||
        (u.profile?.firstName && u.profile.firstName.toLowerCase().includes(s))
    }
    return true
  })

  const filteredRequests = requests.filter(r => {
    if (requestStatusFilter !== 'ALL' && r.status !== requestStatusFilter) return false
    if (requestSearch) {
      const s = requestSearch.toLowerCase()
      return (r.trackingNumber && r.trackingNumber.toLowerCase().includes(s)) ||
        (r.userEmail && r.userEmail.toLowerCase().includes(s))
    }
    return true
  })

  if (loading) {
    return <div className="py-5 text-muted small">Loading Operations Console...</div>
  }

  return (
    <div className="py-4">
      {/* Header Banner */}
      <div className="editorial-tag">OPERATIONS CONTROL CONSOLE</div>
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <h1 className="h1 text-uppercase fw-bold m-0">ADMINISTRATOR CONTROL</h1>
          <p className="text-secondary small mt-1">
            System overview, user role management, request approval dispatches &amp; facility compliance.
          </p>
        </div>

        <button onClick={fetchAllData} className="btn btn-outline-custom">
          Refresh Data ↗
        </button>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}
      {successMsg && <div className="alert alert-success mb-4">{successMsg}</div>}

      {/* Linear Metric Stream */}
      <section className="py-2 mb-4">
        <div className="row g-4 text-start">
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">REGISTERED USERS</div>
            <div className="fs-2 fw-bold">{stats ? stats.totalUsers : users.length}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">DISPOSAL REQUESTS</div>
            <div className="fs-2 fw-bold">{stats ? stats.totalRequests : requests.length}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">FIELD COLLECTORS</div>
            <div className="fs-2 fw-bold">{collectors.length}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">RECYCLING CENTERS</div>
            <div className="fs-2 fw-bold">{centers.length}</div>
          </div>
        </div>
      </section>

      <div className="thin-rule"></div>

      {/* Nav Tabs */}
      <div className="d-flex gap-2 mb-4 border-bottom border-dark pb-2 flex-wrap">
        <button
          className={`btn ${activeTab === 'overview' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={`btn ${activeTab === 'requests' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({requests.length})
        </button>
        <button
          className={`btn ${activeTab === 'pickups' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
          onClick={() => setActiveTab('pickups')}
        >
          Pickups ({pickups.length})
        </button>
        <button
          className={`btn ${activeTab === 'centers' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
          onClick={() => setActiveTab('centers')}
        >
          Centers ({centers.length})
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <section className="py-3">
          <h2 className="h4 text-uppercase fw-bold mb-3">SYSTEM MODULE SUMMARY</h2>
          <div className="table-responsive">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>MODULE</th>
                  <th>RECORDS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Citizen &amp; Institutional Accounts</td>
                  <td>{users.length}</td>
                  <td><span className="status-dot-item"><span className="status-dot status-dot-emerald"></span> ACTIVE</span></td>
                </tr>
                <tr>
                  <td>Disposal Requests Stream</td>
                  <td>{requests.length}</td>
                  <td><span className="status-dot-item"><span className="status-dot status-dot-info"></span> PROCESSING</span></td>
                </tr>
                <tr>
                  <td>Pickup Dispatches</td>
                  <td>{pickups.length}</td>
                  <td><span className="status-dot-item"><span className="status-dot status-dot-warning"></span> SCHEDULED</span></td>
                </tr>
                <tr>
                  <td>State-Registered Facilities</td>
                  <td>{centers.length}</td>
                  <td><span className="status-dot-item"><span className="status-dot status-dot-emerald"></span> VERIFIED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <section className="py-3">
          <div className="d-flex justify-content-between align-items-baseline mb-3">
            <h2 className="h4 text-uppercase fw-bold m-0">USER DIRECTORY</h2>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ maxWidth: '240px' }}
            />
          </div>

          <div className="table-responsive">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME / EMAIL</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td>
                      <div className="fw-bold">{u.email}</div>
                      <div className="text-muted extra-small">{u.profile?.firstName} {u.profile?.lastName}</div>
                    </td>
                    <td>{u.role}</td>
                    <td>
                      <span className="status-dot-item">
                        <span className={`status-dot ${u.active ? 'status-dot-emerald' : 'status-dot-danger'}`}></span>
                        {u.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleUserActive(u.id)}
                        className="btn btn-outline-custom btn-sm"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* REQUESTS TAB */}
      {activeTab === 'requests' && (
        <section className="py-3">
          <h2 className="h4 text-uppercase fw-bold mb-3">DISPOSAL REQUEST STREAM</h2>
          <div className="table-responsive">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>TRACKING ID</th>
                  <th>USER EMAIL</th>
                  <th>CATEGORY</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr key={r.id}>
                    <td><code>{r.trackingNumber}</code></td>
                    <td>{r.userEmail}</td>
                    <td>{r.items?.[0]?.category || 'E-Waste'}</td>
                    <td>
                      <span className="status-dot-item">
                        <span className={`status-dot ${r.status === 'COMPLETED' ? 'status-dot-emerald' : 'status-dot-warning'}`}></span>
                        {formatStatus(r.status)}
                      </span>
                    </td>
                    <td>
                      {r.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleApproveRequest(r.id)}
                          className="btn btn-primary-custom btn-sm"
                        >
                          Approve ↗
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* PICKUPS TAB */}
      {activeTab === 'pickups' && (
        <section className="py-3">
          <h2 className="h4 text-uppercase fw-bold mb-3">FIELD PICKUP ASSIGNMENTS</h2>
          <div className="table-responsive">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>PICKUP ID</th>
                  <th>TRACKING ID</th>
                  <th>COLLECTOR</th>
                  <th>STATUS</th>
                  <th>ASSIGNMENT</th>
                </tr>
              </thead>
              <tbody>
                {pickups.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td><code>{p.trackingNumber}</code></td>
                    <td>{p.collectorName || 'Unassigned'}</td>
                    <td>
                      <span className="status-dot-item">
                        <span className={`status-dot ${p.status === 'COLLECTED' ? 'status-dot-emerald' : 'status-dot-info'}`}></span>
                        {formatStatus(p.status)}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <select
                          className="form-select form-select-sm"
                          value={selectedCollectors[p.id] || p.collectorId || ''}
                          onChange={(e) => setSelectedCollectors({ ...selectedCollectors, [p.id]: e.target.value })}
                          style={{ maxWidth: '180px' }}
                        >
                          <option value="">Select Collector...</option>
                          {collectors.map((c) => (
                            <option key={c.id} value={c.id}>{c.email}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignCollector(p.id)}
                          className="btn btn-primary-custom btn-sm"
                        >
                          Assign ↗
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* CENTERS TAB */}
      {activeTab === 'centers' && (
        <section className="py-3">
          <h2 className="h4 text-uppercase fw-bold mb-3">STATE-REGISTERED FACILITIES</h2>
          <div className="editorial-timeline">
            {centers.map((c, idx) => (
              <div key={c.id} className="editorial-timeline-row">
                <div className="editorial-timeline-num">{String(idx + 1).padStart(2, '0')}</div>
                <div>
                  <div className="editorial-timeline-title">{c.name}</div>
                  <div className="text-secondary small">{c.address}, {c.city}, {c.state} - {c.postalCode}</div>
                </div>
                <div>
                  <span className="status-dot-item">
                    <span className="status-dot status-dot-emerald"></span> VERIFIED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
