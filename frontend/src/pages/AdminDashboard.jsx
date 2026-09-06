import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()

  // Tab State
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'users', 'requests', 'pickups', 'bulk', 'centers', 'certificates', 'analytics'

  // Data States
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [pickups, setPickups] = useState([])
  const [collectors, setCollectors] = useState([])
  const [bulkRequests, setBulkRequests] = useState([])
  const [centers, setCenters] = useState([])
  const [certificates, setCertificates] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [factors, setFactors] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Search, Filter & Pagination States
  // Users controls
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [userStatusFilter, setUserStatusFilter] = useState('ALL')
  const [userPage, setUserPage] = useState(1)
  const itemsPerPage = 8

  // Requests controls
  const [requestSearch, setRequestSearch] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('ALL')
  const [requestCategoryFilter, setRequestCategoryFilter] = useState('ALL')
  const [requestPage, setRequestPage] = useState(1)

  // Modal / Action States
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)
  const [newStatus, setNewStatus] = useState('AT_RECYCLING_CENTER')
  const [statusComment, setStatusComment] = useState('')

  // Pickup Assign State
  const [selectedCollectors, setSelectedCollectors] = useState({})
  const [assigningPickupId, setAssigningPickupId] = useState(null)

  // Recycling Center Edit/Add State
  const [editingCenter, setEditingCenter] = useState(null)
  const [savingCenter, setSavingCenter] = useState(false)

  // Factor Editing State
  const [editingFactor, setEditingFactor] = useState(null)
  const [savingFactor, setSavingFactor] = useState(false)

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
        certificatesRes,
        analyticsRes,
        factorsRes
      ] = await Promise.all([
        axios.get('/api/admin/stats', { headers }),
        axios.get('/api/admin/users', { headers }),
        axios.get('/api/admin/requests', { headers }),
        axios.get('/api/admin/pickups', { headers }),
        axios.get('/api/admin/collectors', { headers }),
        axios.get('/api/recycling-centers', { headers }),
        axios.get('/api/admin/certificates', { headers }),
        axios.get('/api/analytics/admin', { headers }),
        axios.get('/api/analytics/factors', { headers })
      ])

      setStats(statsRes.data || null)
      setUsers(usersRes.data || [])
      setRequests(requestsRes.data || [])
      setPickups(pickupsRes.data || [])
      setCollectors(collectorsRes.data || [])
      setCenters(centersRes.data || [])
      setCertificates(certificatesRes.data || [])
      setAnalytics(analyticsRes.data || null)
      setFactors(factorsRes.data || [])

      // Extract bulk requests if any
      const bulks = (requestsRes.data || []).filter(
        r => r.notes && (r.notes.includes('Bulk') || r.notes.includes('bulk') || r.pickupAddress)
      )
      setBulkRequests(bulks)
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err)
      setError(err.response?.data?.error || 'Failed to load administrator dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  // User Actions
  const handleToggleUserActive = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.put(`/api/admin/users/${userId}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMsg(`User ${res.data.email} active status updated to ${res.data.active ? 'ACTIVE' : 'INACTIVE'}.`)
      await fetchAllData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle user status')
    }
  }

  const handleVerifyUser = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.put(`/api/admin/users/${userId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMsg(`Profile for user ${res.data.email} verified successfully.`)
      await fetchAllData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to verify profile')
    }
  }

  // Request Actions
  const handleApproveRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`/api/admin/requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMsg(`Disposal request ID ${requestId} approved successfully.`)
      await fetchAllData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve request')
    }
  }

  const handleRejectRequestSubmit = async (e) => {
    e.preventDefault()
    if (!rejectingId) return
    try {
      const token = localStorage.getItem('token')
      await axios.put(`/api/admin/requests/${rejectingId}/reject`, { reason: rejectReason }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMsg(`Disposal request ID ${rejectingId} rejected.`)
      setRejectingId(null)
      setRejectReason('')
      await fetchAllData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject request')
    }
  }

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault()
    if (!statusUpdatingId) return
    try {
      const token = localStorage.getItem('token')
      await axios.put(`/api/admin/requests/${statusUpdatingId}/status`, {
        status: newStatus,
        comment: statusComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMsg(`Request status updated to ${newStatus}.`)
      setStatusUpdatingId(null)
      setStatusComment('')
      await fetchAllData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update request status')
    }
  }

  // Pickup Assign
  const handleAssignCollector = async (pickupId) => {
    const collectorId = selectedCollectors[pickupId]
    if (!collectorId) {
      alert('Please select a collector from the dropdown first.')
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
      setSuccessMsg(`Collector assigned successfully for pickup ID ${pickupId}.`)
      await fetchAllData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign collector')
    } finally {
      setAssigningPickupId(null)
    }
  }

  // Recycling Center Actions
  const handleSaveCenter = async (e) => {
    e.preventDefault()
    if (!editingCenter) return
    try {
      setSavingCenter(true)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      if (editingCenter.id) {
        await axios.put(`/api/recycling-centers/${editingCenter.id}`, editingCenter, { headers })
        setSuccessMsg(`Recycling center '${editingCenter.name}' updated successfully.`)
      } else {
        await axios.post('/api/recycling-centers', editingCenter, { headers })
        setSuccessMsg(`Recycling center '${editingCenter.name}' created successfully.`)
      }
      setEditingCenter(null)
      await fetchAllData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save recycling center')
    } finally {
      setSavingCenter(false)
    }
  }

  // Generate Certificate
  const handleGenerateCertificate = async (requestId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/api/admin/certificates/generate/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMsg(`Certificate generated successfully for request ID ${requestId}.`)
      await fetchAllData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate certificate')
    }
  }

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false
    if (userStatusFilter === 'ACTIVE' && !u.active) return false
    if (userStatusFilter === 'INACTIVE' && u.active) return false
    if (userSearch) {
      const s = userSearch.toLowerCase()
      const emailMatch = u.email && u.email.toLowerCase().includes(s)
      const nameMatch = u.profile && (
        (u.profile.firstName + ' ' + u.profile.lastName).toLowerCase().includes(s) ||
        (u.profile.phoneNumber && u.profile.phoneNumber.includes(s))
      )
      return emailMatch || nameMatch
    }
    return true
  })

  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1
  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage)

  // Filtered Requests List
  const filteredRequests = requests.filter(r => {
    if (requestStatusFilter !== 'ALL' && r.status !== requestStatusFilter) return false
    if (requestCategoryFilter !== 'ALL') {
      const catMatch = r.items && r.items.some(i => i.category === requestCategoryFilter)
      if (!catMatch) return false
    }
    if (requestSearch) {
      const s = requestSearch.toLowerCase()
      const trackingMatch = r.trackingNumber && r.trackingNumber.toLowerCase().includes(s)
      const emailMatch = r.userEmail && r.userEmail.toLowerCase().includes(s)
      const deviceMatch = r.items && r.items.some(i => 
        (i.deviceName && i.deviceName.toLowerCase().includes(s)) ||
        (i.brand && i.brand.toLowerCase().includes(s))
      )
      return trackingMatch || emailMatch || deviceMatch
    }
    return true
  })

  const totalRequestPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1
  const paginatedRequests = filteredRequests.slice((requestPage - 1) * itemsPerPage, requestPage * itemsPerPage)

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-emerald mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <p className="text-secondary fw-semibold">Loading Administrator Command Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="container py-4">
      {/* Header Title */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-white fw-bold mb-1">
            <i className="bi bi-shield-lock-fill text-emerald me-2"></i> Administrator Command Center
          </h2>
          <p className="text-secondary mb-0">Platform overview, user management, request lifecycle & dispatch operations</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button onClick={fetchAllData} className="btn btn-outline-custom btn-sm">
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-danger text-danger mb-4 shadow-sm">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success border-success text-emerald mb-4 shadow-sm d-flex justify-content-between align-items-center">
          <div><i className="bi bi-check-circle-fill me-2"></i> {successMsg}</div>
          <button onClick={() => setSuccessMsg(null)} className="btn-close btn-close-white"></button>
        </div>
      )}

      {/* 8 DASHBOARD SUMMARY CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="card-custom h-100 p-3 d-flex align-items-center gap-3">
            <div className="rounded-3 p-3 bg-primary bg-opacity-20 text-primary fs-3">
              <i className="bi bi-people-fill"></i>
            </div>
            <div>
              <span className="text-secondary small fw-semibold d-block">Total Users</span>
              <h3 className="text-white fw-bold mb-0">{stats ? stats.totalUsers : users.length}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card-custom h-100 p-3 d-flex align-items-center gap-3">
            <div className="rounded-3 p-3 bg-warning bg-opacity-20 text-warning fs-3">
              <i className="bi bi-truck"></i>
            </div>
            <div>
              <span className="text-secondary small fw-semibold d-block">Collectors</span>
              <h3 className="text-white fw-bold mb-0">{stats ? stats.collectorsCount : collectors.length}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card-custom h-100 p-3 d-flex align-items-center gap-3">
            <div className="rounded-3 p-3 bg-info bg-opacity-20 text-info fs-3">
              <i className="bi bi-building"></i>
            </div>
            <div>
              <span className="text-secondary small fw-semibold d-block">Recyclers</span>
              <h3 className="text-white fw-bold mb-0">{stats ? stats.recyclersCount : 0}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card-custom h-100 p-3 d-flex align-items-center gap-3">
            <div className="rounded-3 p-3 bg-success bg-opacity-20 text-success fs-3">
              <i className="bi bi-geo-alt-fill"></i>
            </div>
            <div>
              <span className="text-secondary small fw-semibold d-block">Recycling Centers</span>
              <h3 className="text-white fw-bold mb-0">{stats ? stats.recyclingCentersCount : centers.length}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card-custom h-100 p-3 d-flex align-items-center gap-3">
            <div className="rounded-3 p-3 bg-purple bg-opacity-20 text-purple fs-3" style={{ color: '#a855f7' }}>
              <i className="bi bi-file-earmark-text-fill"></i>
            </div>
            <div>
              <span className="text-secondary small fw-semibold d-block">E-Waste Requests</span>
              <h3 className="text-white fw-bold mb-0">{stats ? stats.totalRequests : requests.length}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card-custom h-100 p-3 d-flex align-items-center gap-3">
            <div className="rounded-3 p-3 bg-danger bg-opacity-20 text-danger fs-3">
              <i className="bi bi-clock-history"></i>
            </div>
            <div>
              <span className="text-secondary small fw-semibold d-block">Pending Pickups</span>
              <h3 className="text-white fw-bold mb-0">{stats ? stats.pendingPickupsCount : pickups.length}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card-custom h-100 p-3 d-flex align-items-center gap-3">
            <div className="rounded-3 p-3 bg-emerald-subtle text-emerald fs-3" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <i className="bi bi-recycle"></i>
            </div>
            <div>
              <span className="text-secondary small fw-semibold d-block">Completed Recycling</span>
              <h3 className="text-white fw-bold mb-0">{stats ? stats.completedRecyclingCount : 0}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-3">
          <div className="card-custom h-100 p-3 d-flex align-items-center gap-3">
            <div className="rounded-3 p-3 bg-warning bg-opacity-20 text-warning fs-3">
              <i className="bi bi-star-fill"></i>
            </div>
            <div>
              <span className="text-secondary small fw-semibold d-block">Green Points Issued</span>
              <h3 className="text-white fw-bold mb-0">{stats ? stats.totalGreenPointsIssued : 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD TAB NAVIGATION */}
      <ul className="nav nav-tabs border-secondary mb-4 flex-nowrap overflow-auto" style={{ borderBottomWidth: '1px' }}>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('overview')}
            className={`nav-link text-nowrap px-3 ${activeTab === 'overview' ? 'active bg-dark text-emerald fw-bold border-secondary' : 'text-secondary'}`}
          >
            <i className="bi bi-grid-1x2-fill me-1"></i> Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('users')}
            className={`nav-link text-nowrap px-3 ${activeTab === 'users' ? 'active bg-dark text-emerald fw-bold border-secondary' : 'text-secondary'}`}
          >
            <i className="bi bi-people-fill me-1"></i> User Management ({users.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('requests')}
            className={`nav-link text-nowrap px-3 ${activeTab === 'requests' ? 'active bg-dark text-emerald fw-bold border-secondary' : 'text-secondary'}`}
          >
            <i className="bi bi-list-check me-1"></i> Disposal Requests ({requests.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('pickups')}
            className={`nav-link text-nowrap px-3 ${activeTab === 'pickups' ? 'active bg-dark text-emerald fw-bold border-secondary' : 'text-secondary'}`}
          >
            <i className="bi bi-truck me-1"></i> Pickups ({pickups.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('centers')}
            className={`nav-link text-nowrap px-3 ${activeTab === 'centers' ? 'active bg-dark text-emerald fw-bold border-secondary' : 'text-secondary'}`}
          >
            <i className="bi bi-geo-alt-fill me-1"></i> Centers ({centers.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('certificates')}
            className={`nav-link text-nowrap px-3 ${activeTab === 'certificates' ? 'active bg-dark text-emerald fw-bold border-secondary' : 'text-secondary'}`}
          >
            <i className="bi bi-award-fill me-1"></i> Certificates ({certificates.length})
          </button>
        </li>
      </ul>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="card-custom p-4">
              <h5 className="text-white fw-bold mb-3">
                <i className="bi bi-bar-chart-line-fill text-emerald me-2"></i> Operational Status
              </h5>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Module / Component</th>
                      <th>Total Records</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Registered Users & Institutions</td>
                      <td>{users.length}</td>
                      <td><span className="badge bg-success-subtle text-success">Active</span></td>
                    </tr>
                    <tr>
                      <td>Field Collectors Assigned</td>
                      <td>{collectors.length}</td>
                      <td><span className="badge bg-success-subtle text-success">Available</span></td>
                    </tr>
                    <tr>
                      <td>Recycling Centers Seeded</td>
                      <td>{centers.length}</td>
                      <td><span className="badge bg-info-subtle text-info">Verified</span></td>
                    </tr>
                    <tr>
                      <td>Pending Pickups</td>
                      <td>{pickups.filter(p => p.status === 'SCHEDULED' || p.status === 'ASSIGNED').length}</td>
                      <td><span className="badge bg-warning-subtle text-warning">Pending Dispatch</span></td>
                    </tr>
                    <tr>
                      <td>Digital Certificates Issued</td>
                      <td>{certificates.length}</td>
                      <td><span className="badge bg-success-subtle text-success">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card-custom p-4 h-100">
              <h5 className="text-white fw-bold mb-3">
                <i className="bi bi-shield-check text-emerald me-2"></i> Security & Roles Summary
              </h5>
              <p className="text-secondary small">
                All administrator actions undergo strict Spring Security role authorization (`@PreAuthorize("hasRole('ADMIN')")`).
              </p>
              <div className="d-flex flex-column gap-2 mt-3">
                <div className="p-2.5 rounded-3 bg-secondary bg-opacity-20 d-flex justify-content-between align-items-center">
                  <span className="text-white small">CITIZEN USERS</span>
                  <span className="badge bg-primary rounded-pill">{users.filter(u => u.role === 'USER').length}</span>
                </div>
                <div className="p-2.5 rounded-3 bg-secondary bg-opacity-20 d-flex justify-content-between align-items-center">
                  <span className="text-white small">FIELD COLLECTORS</span>
                  <span className="badge bg-warning rounded-pill">{users.filter(u => u.role === 'COLLECTOR').length}</span>
                </div>
                <div className="p-2.5 rounded-3 bg-secondary bg-opacity-20 d-flex justify-content-between align-items-center">
                  <span className="text-white small">RECYCLERS</span>
                  <span className="badge bg-info rounded-pill">{users.filter(u => u.role === 'RECYCLER').length}</span>
                </div>
                <div className="p-2.5 rounded-3 bg-secondary bg-opacity-20 d-flex justify-content-between align-items-center">
                  <span className="text-white small">SYSTEM ADMINISTRATORS</span>
                  <span className="badge bg-emerald rounded-pill">{users.filter(u => u.role === 'ADMIN').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="card-custom p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="text-white fw-bold mb-0">
              <i className="bi bi-people-fill text-emerald me-2"></i> User & Account Management
            </h5>
            <div className="d-flex gap-2 flex-wrap">
              <input
                type="text"
                className="form-control form-control-sm bg-dark text-white border-secondary"
                placeholder="Search user name / email..."
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                style={{ width: '220px' }}
              />
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary"
                value={userRoleFilter}
                onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                style={{ width: '130px' }}
              >
                <option value="ALL">All Roles</option>
                <option value="USER">User</option>
                <option value="COLLECTOR">Collector</option>
                <option value="RECYCLER">Recycler</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary"
                value={userStatusFilter}
                onChange={e => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                style={{ width: '130px' }}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name / Contact</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Profile Verification</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">No users match search criteria.</td>
                  </tr>
                ) : (
                  paginatedUsers.map(u => (
                    <tr key={u.id}>
                      <td className="fw-semibold">#{u.id}</td>
                      <td>
                        <div className="fw-semibold text-white">
                          {u.profile?.firstName ? `${u.profile.firstName} ${u.profile.lastName || ''}` : 'N/A'}
                        </div>
                        <div className="text-secondary small">{u.profile?.phoneNumber || 'No phone'}</div>
                      </td>
                      <td className="text-light">{u.email}</td>
                      <td>
                        <span className={`badge ${
                          u.role === 'ADMIN' ? 'bg-danger' :
                          u.role === 'COLLECTOR' ? 'bg-warning text-dark' :
                          u.role === 'RECYCLER' ? 'bg-info text-dark' : 'bg-primary'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {u.profile?.verified ? (
                          <span className="badge bg-success-subtle text-emerald"><i className="bi bi-patch-check-fill me-1"></i> Verified</span>
                        ) : (
                          <span className="badge bg-secondary text-secondary">Unverified</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            onClick={() => handleToggleUserActive(u.id)}
                            className={`btn btn-sm ${u.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            title={u.active ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                          {!u.profile?.verified && (u.role === 'COLLECTOR' || u.role === 'RECYCLER') && (
                            <button
                              onClick={() => handleVerifyUser(u.id)}
                              className="btn btn-sm btn-outline-custom text-emerald"
                              title="Verify Credentials"
                            >
                              Verify Profile
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalUserPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-secondary small">Page {userPage} of {totalUserPages}</span>
              <div className="btn-group btn-group-sm">
                <button
                  disabled={userPage === 1}
                  onClick={() => setUserPage(userPage - 1)}
                  className="btn btn-outline-custom"
                >
                  Previous
                </button>
                <button
                  disabled={userPage === totalUserPages}
                  onClick={() => setUserPage(userPage + 1)}
                  className="btn btn-outline-custom"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: DISPOSAL REQUESTS MANAGEMENT */}
      {activeTab === 'requests' && (
        <div className="card-custom p-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h5 className="text-white fw-bold mb-0">
              <i className="bi bi-list-check text-emerald me-2"></i> E-Waste Disposal Requests
            </h5>
            <div className="d-flex gap-2 flex-wrap">
              <input
                type="text"
                className="form-control form-control-sm bg-dark text-white border-secondary"
                placeholder="Search tracking ID, user, item..."
                value={requestSearch}
                onChange={e => { setRequestSearch(e.target.value); setRequestPage(1); }}
                style={{ width: '240px' }}
              />
              <select
                className="form-select form-select-sm bg-dark text-white border-secondary"
                value={requestStatusFilter}
                onChange={e => { setRequestStatusFilter(e.target.value); setRequestPage(1); }}
                style={{ width: '150px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="PICKUP_ASSIGNED">Pickup Assigned</option>
                <option value="COLLECTED">Collected</option>
                <option value="AT_RECYCLING_CENTER">At Recycler</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>User / Email</th>
                  <th>Category & Item</th>
                  <th>Recommendation</th>
                  <th>Status</th>
                  <th className="text-end">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">No disposal requests found.</td>
                  </tr>
                ) : (
                  paginatedRequests.map(r => (
                    <tr key={r.id}>
                      <td className="fw-mono text-emerald">{r.trackingNumber}</td>
                      <td>
                        <div className="text-white small fw-semibold">{r.userEmail}</div>
                      </td>
                      <td>
                        {r.items && r.items[0] ? (
                          <div>
                            <span className="badge bg-secondary me-1">{r.items[0].category}</span>
                            <span className="text-light small">{r.items[0].deviceName || 'Electronic item'}</span>
                          </div>
                        ) : 'E-waste items'}
                      </td>
                      <td>
                        <span className="badge bg-dark border border-secondary text-info">
                          {r.recommendedAction || 'RECYCLE'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          r.status === 'COMPLETED' || r.status === 'RECYCLED' ? 'bg-success' :
                          r.status === 'APPROVED' ? 'bg-info' :
                          r.status === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          {r.status === 'SUBMITTED' && (
                            <>
                              <button
                                onClick={() => handleApproveRequest(r.id)}
                                className="btn btn-sm btn-success"
                                title="Approve Request"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectingId(r.id)}
                                className="btn btn-sm btn-danger"
                                title="Reject Request"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => { setStatusUpdatingId(r.id); setNewStatus('AT_RECYCLING_CENTER'); }}
                            className="btn btn-sm btn-outline-custom text-white"
                            title="Update Status"
                          >
                            Update Status
                          </button>
                          {r.statusHistory && r.statusHistory.length > 0 && (
                            <button
                              onClick={() => setSelectedHistory(r.statusHistory)}
                              className="btn btn-sm btn-outline-secondary"
                              title="Inspect History"
                            >
                              History
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalRequestPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-secondary small">Page {requestPage} of {totalRequestPages}</span>
              <div className="btn-group btn-group-sm">
                <button
                  disabled={requestPage === 1}
                  onClick={() => setRequestPage(requestPage - 1)}
                  className="btn btn-outline-custom"
                >
                  Previous
                </button>
                <button
                  disabled={requestPage === totalRequestPages}
                  onClick={() => setRequestPage(requestPage + 1)}
                  className="btn btn-outline-custom"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: DOORSTEP PICKUPS */}
      {activeTab === 'pickups' && (
        <div className="card-custom p-4">
          <h5 className="text-white fw-bold mb-3">
            <i className="bi bi-truck text-emerald me-2"></i> Doorstep Pickup Dispatch Management
          </h5>
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>Pickup ID</th>
                  <th>Tracking Number</th>
                  <th>Scheduled Date & Slot</th>
                  <th>Current Collector</th>
                  <th>Pickup Status</th>
                  <th>Assign Collector</th>
                </tr>
              </thead>
              <tbody>
                {pickups.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">No scheduled pickups pending dispatch.</td>
                  </tr>
                ) : (
                  pickups.map(p => (
                    <tr key={p.id}>
                      <td className="fw-mono text-emerald">#{p.id}</td>
                      <td className="fw-mono text-light">{p.trackingNumber}</td>
                      <td>
                        <div className="text-white small">{p.scheduledDate}</div>
                        <span className="badge bg-secondary">{p.timeSlot || 'MORNING'}</span>
                      </td>
                      <td>
                        {p.collectorName ? (
                          <span className="badge bg-success-subtle text-emerald"><i className="bi bi-person-check-fill me-1"></i> {p.collectorName}</span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-dark border border-secondary text-info">{p.status}</span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <select
                            className="form-select form-select-sm bg-dark text-white border-secondary"
                            value={selectedCollectors[p.id] || p.collectorId || ''}
                            onChange={e => setSelectedCollectors({ ...selectedCollectors, [p.id]: e.target.value })}
                            style={{ minWidth: '160px' }}
                          >
                            <option value="">Select Collector...</option>
                            {collectors.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.profile?.firstName ? `${c.profile.firstName} ${c.profile.lastName || ''}` : c.email}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignCollector(p.id)}
                            disabled={assigningPickupId === p.id}
                            className="btn btn-sm btn-primary-custom text-white text-nowrap"
                          >
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: RECYCLING CENTERS */}
      {activeTab === 'centers' && (
        <div className="card-custom p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-white fw-bold mb-0">
              <i className="bi bi-geo-alt-fill text-emerald me-2"></i> Recycling Centers & Facilities
            </h5>
            <button
              onClick={() => setEditingCenter({ name: '', registrationNumber: '', city: '', state: '', postalCode: '', phone: '', email: '', active: true })}
              className="btn btn-primary-custom btn-sm text-white"
            >
              <i className="bi bi-plus-circle me-1"></i> Add Recycling Center
            </button>
          </div>

          <div className="row g-3">
            {centers.map(c => (
              <div key={c.id} className="col-12 col-md-6 col-lg-4">
                <div className="card-custom p-3 border border-secondary h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="text-white fw-bold mb-0">{c.name}</h6>
                      <span className={`badge ${c.active ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-secondary small mb-1"><i className="bi bi-geo-alt me-1"></i> {c.city}, {c.state} - {c.postalCode}</p>
                    <p className="text-secondary small mb-2"><i className="bi bi-telephone me-1"></i> {c.phone || 'N/A'}</p>
                  </div>
                  <div className="pt-2 border-top border-secondary text-end">
                    <button
                      onClick={() => setEditingCenter({ ...c })}
                      className="btn btn-sm btn-outline-custom"
                    >
                      <i className="bi bi-pencil me-1"></i> Edit Facility
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: DIGITAL CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="card-custom p-4">
          <h5 className="text-white fw-bold mb-3">
            <i className="bi bi-award-fill text-emerald me-2"></i> Digital Recycling Certificates Issued
          </h5>
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>Certificate No.</th>
                  <th>Tracking Number</th>
                  <th>User Name</th>
                  <th>Issue Date</th>
                  <th>Weight (kg)</th>
                  <th className="text-end">Download</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">No certificates issued yet.</td>
                  </tr>
                ) : (
                  certificates.map(cert => (
                    <tr key={cert.id}>
                      <td className="fw-mono text-emerald">{cert.certificateNumber}</td>
                      <td className="fw-mono text-light">{cert.trackingNumber}</td>
                      <td className="text-white">{cert.userName || 'Citizen'}</td>
                      <td className="text-secondary small">{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : ''}</td>
                      <td className="text-white">{cert.totalWeightKg || 1.5} kg</td>
                      <td className="text-end">
                        <a
                          href={`/api/certificates/${cert.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-custom text-emerald"
                        >
                          <i className="bi bi-download me-1"></i> Download PDF
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: LIFECYCLE HISTORY MODAL */}
      {selectedHistory && (
        <div className="modal show d-block bg-dark bg-opacity-75" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title"><i className="bi bi-clock-history text-emerald me-2"></i> Request Status Timeline History</h5>
                <button onClick={() => setSelectedHistory(null)} className="btn-close btn-close-white"></button>
              </div>
              <div className="modal-body">
                <ul className="list-group list-group-flush bg-transparent">
                  {selectedHistory.map((h, i) => (
                    <li key={i} className="list-group-item bg-transparent text-white border-secondary px-0 py-2">
                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="badge bg-emerald text-dark fw-bold">{h.toStatus}</span>
                        <span className="text-muted small">{h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}</span>
                      </div>
                      <p className="mb-0 text-secondary small mt-1">{h.comment}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer border-secondary">
                <button onClick={() => setSelectedHistory(null)} className="btn btn-secondary btn-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT REASON MODAL */}
      {rejectingId && (
        <div className="modal show d-block bg-dark bg-opacity-75" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <form onSubmit={handleRejectRequestSubmit}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-danger"><i className="bi bi-x-circle-fill me-2"></i> Reject Disposal Request #{rejectingId}</h5>
                  <button onClick={() => setRejectingId(null)} type="button" className="btn-close btn-close-white"></button>
                </div>
                <div className="modal-body">
                  <label className="form-label text-secondary small">Rejection Reason</label>
                  <textarea
                    required
                    className="form-control bg-dark text-white border-secondary"
                    rows="3"
                    placeholder="Enter reason for rejecting this request..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  ></textarea>
                </div>
                <div className="modal-footer border-secondary">
                  <button onClick={() => setRejectingId(null)} type="button" className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-danger btn-sm">Confirm Rejection</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: STATUS UPDATE MODAL */}
      {statusUpdatingId && (
        <div className="modal show d-block bg-dark bg-opacity-75" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <form onSubmit={handleUpdateStatusSubmit}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title"><i className="bi bi-gear-wide-connected text-emerald me-2"></i> Advance Request Status #{statusUpdatingId}</h5>
                  <button onClick={() => setStatusUpdatingId(null)} type="button" className="btn-close btn-close-white"></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-secondary small">Target Lifecycle Status</label>
                    <select
                      className="form-select bg-dark text-white border-secondary"
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="PICKUP_ASSIGNED">PICKUP_ASSIGNED</option>
                      <option value="COLLECTED">COLLECTED</option>
                      <option value="AT_RECYCLING_CENTER">AT_RECYCLING_CENTER</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="RECYCLED">RECYCLED</option>
                      <option value="REUSED">REUSED</option>
                      <option value="REFURBISHED">REFURBISHED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary small">Audit Comment / Processing Note</label>
                    <textarea
                      className="form-control bg-dark text-white border-secondary"
                      rows="2"
                      placeholder="Optional comment describing state transition..."
                      value={statusComment}
                      onChange={e => setStatusComment(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button onClick={() => setStatusUpdatingId(null)} type="button" className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-emerald btn-sm text-dark fw-bold">Update Status & Notify</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT/ADD RECYCLING CENTER MODAL */}
      {editingCenter && (
        <div className="modal show d-block bg-dark bg-opacity-75" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-secondary">
              <form onSubmit={handleSaveCenter}>
                <div className="modal-header border-secondary">
                  <h5 className="modal-title"><i className="bi bi-geo-alt-fill text-emerald me-2"></i> {editingCenter.id ? 'Edit' : 'Add'} Recycling Center</h5>
                  <button onClick={() => setEditingCenter(null)} type="button" className="btn-close btn-close-white"></button>
                </div>
                <div className="modal-body row g-2">
                  <div className="col-12">
                    <label className="form-label text-secondary small">Center Name</label>
                    <input
                      required
                      type="text"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={editingCenter.name || ''}
                      onChange={e => setEditingCenter({ ...editingCenter, name: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-secondary small">Registration No.</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={editingCenter.registrationNumber || ''}
                      onChange={e => setEditingCenter({ ...editingCenter, registrationNumber: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-secondary small">Phone</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={editingCenter.phone || ''}
                      onChange={e => setEditingCenter({ ...editingCenter, phone: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-secondary small">City</label>
                    <input
                      required
                      type="text"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={editingCenter.city || ''}
                      onChange={e => setEditingCenter({ ...editingCenter, city: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-secondary small">State</label>
                    <input
                      required
                      type="text"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={editingCenter.state || ''}
                      onChange={e => setEditingCenter({ ...editingCenter, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button onClick={() => setEditingCenter(null)} type="button" className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" disabled={savingCenter} className="btn btn-emerald btn-sm text-dark fw-bold">
                    {savingCenter ? 'Saving...' : 'Save Center'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
