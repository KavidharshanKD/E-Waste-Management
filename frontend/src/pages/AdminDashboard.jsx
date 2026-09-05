import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [pickups, setPickups] = useState([])
  const [collectors, setCollectors] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [factors, setFactors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCollectors, setSelectedCollectors] = useState({})
  const [assigningId, setAssigningId] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Factor Editing State
  const [editingFactor, setEditingFactor] = useState(null)
  const [savingFactor, setSavingFactor] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [pickupsRes, collectorsRes, analyticsRes, factorsRes] = await Promise.all([
        axios.get('/api/admin/pickups'),
        axios.get('/api/admin/collectors'),
        axios.get('/api/analytics/admin'),
        axios.get('/api/analytics/factors')
      ])
      setPickups(pickupsRes.data || [])
      setCollectors(collectorsRes.data || [])
      setAnalytics(analyticsRes.data || null)
      setFactors(factorsRes.data || [])
    } catch (err) {
      console.error('Failed to fetch admin dashboard data', err)
      setError(err.response?.data?.error || 'Failed to load dispatch and analytics data.')
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

  const handleUpdateFactorSubmit = async (e) => {
    e.preventDefault()
    if (!editingFactor) return
    try {
      setSavingFactor(true)
      await axios.put(`/api/analytics/factors/${editingFactor.id}`, editingFactor)
      setSuccessMsg(`Environmental factor for ${editingFactor.category} updated successfully.`)
      setEditingFactor(null)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update environmental factor')
    } finally {
      setSavingFactor(false)
    }
  }

  const pendingCount = pickups.filter((p) => p.status === 'SCHEDULED' || !p.collectorId).length
  const assignedCount = pickups.filter((p) => p.collectorId).length

  // Helper to compute max value in map for chart percentage scaling
  const getMaxVal = (mapData) => {
    if (!mapData) return 1
    const vals = Object.values(mapData)
    if (vals.length === 0) return 1
    return Math.max(...vals, 1)
  }

  return (
    <div className="container py-4 space-y-4">
      {/* Hero Header */}
      <div className="hero-card mb-4">
        <span className="hero-tag">🛡️ System Administration &amp; Environmental Analytics</span>
        <h1 className="hero-title h2 mb-1">
          Platform Command Center &amp; Impact Analytics
        </h1>
        <p className="hero-description small mb-0">
          Monitor real-time e-waste metrics, track monthly collection trends, manage doorstep logistics dispatch, and configure environmental factor benchmarks.
        </p>
      </div>

      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>{successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)}></button>
        </div>
      )}

      {/* Primary Accurate Application Statistics Bar */}
      {analytics && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3 col-lg-2">
            <div className="p-3 bg-dark bg-opacity-75 rounded-4 border border-secondary text-center h-100">
              <span className="text-muted extra-small d-block font-weight-bold">Total Items</span>
              <span className="h3 font-weight-bold text-white mb-0">{analytics.totalItemsCollected}</span>
              <span className="extra-small text-muted d-block">registered</span>
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <div className="p-3 bg-dark bg-opacity-75 rounded-4 border border-secondary text-center h-100">
              <span className="text-muted extra-small d-block font-weight-bold">Total Devices</span>
              <span className="h3 font-weight-bold text-success mb-0">{analytics.totalQuantity}</span>
              <span className="extra-small text-muted d-block">units</span>
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <div className="p-3 bg-dark bg-opacity-75 rounded-4 border border-secondary text-center h-100">
              <span className="text-muted extra-small d-block font-weight-bold">Completed</span>
              <span className="h3 font-weight-bold text-info mb-0">{analytics.totalCompletedRequests}</span>
              <span className="extra-small text-muted d-block">requests</span>
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <div className="p-3 bg-dark bg-opacity-75 rounded-4 border border-secondary text-center h-100">
              <span className="text-muted extra-small d-block font-weight-bold">Reused / Donated</span>
              <span className="h3 font-weight-bold text-primary mb-0">{analytics.reusedDevices}</span>
              <span className="extra-small text-muted d-block">units</span>
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <div className="p-3 bg-dark bg-opacity-75 rounded-4 border border-secondary text-center h-100">
              <span className="text-muted extra-small d-block font-weight-bold">Refurbished</span>
              <span className="h3 font-weight-bold text-warning mb-0">{analytics.repairedRefurbishedDevices}</span>
              <span className="extra-small text-muted d-block">units</span>
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <div className="p-3 bg-dark bg-opacity-75 rounded-4 border border-secondary text-center h-100">
              <span className="text-muted extra-small d-block font-weight-bold">Recycled</span>
              <span className="h3 font-weight-bold text-emerald-400 mb-0">{analytics.recycledDevices}</span>
              <span className="extra-small text-muted d-block">units</span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts Grid */}
      {analytics && (
        <div className="row g-4 mb-4">
          
          {/* Monthly Collection Trend */}
          <div className="col-lg-6">
            <div className="glass-card h-100">
              <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-graph-up-arrow text-success"></i> Monthly Collection Trend
              </h5>
              {Object.keys(analytics.monthlyCollectionTrend || {}).length === 0 ? (
                <p className="text-muted text-center py-4">No monthly trend data recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics.monthlyCollectionTrend).map(([month, count]) => {
                    const pct = Math.round((count / getMaxVal(analytics.monthlyCollectionTrend)) * 100)
                    return (
                      <div key={month}>
                        <div className="d-flex align-items-center justify-content-between extra-small mb-1">
                          <span className="text-white font-weight-semibold">{month}</span>
                          <span className="text-success font-weight-bold">{count} request(s)</span>
                        </div>
                        <div className="progress bg-dark border border-secondary border-opacity-50" style={{ height: '12px' }}>
                          <div
                            className="progress-bar bg-success rounded-pill"
                            role="progressbar"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="col-lg-6">
            <div className="glass-card h-100">
              <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-pie-chart-fill text-info"></i> Category Distribution
              </h5>
              {Object.keys(analytics.categoryDistribution || {}).length === 0 ? (
                <p className="text-muted text-center py-4">No category data recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics.categoryDistribution).map(([category, count]) => {
                    const pct = Math.round((count / getMaxVal(analytics.categoryDistribution)) * 100)
                    return (
                      <div key={category}>
                        <div className="d-flex align-items-center justify-content-between extra-small mb-1">
                          <span className="text-white font-weight-semibold">{category.replace(/_/g, ' ')}</span>
                          <span className="text-info font-weight-bold">{count} unit(s)</span>
                        </div>
                        <div className="progress bg-dark border border-secondary border-opacity-50" style={{ height: '12px' }}>
                          <div
                            className="progress-bar bg-info rounded-pill"
                            role="progressbar"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Disposal Method Distribution Chart */}
          <div className="col-lg-6">
            <div className="glass-card h-100">
              <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-diagram-3-fill text-warning"></i> Disposal Method Breakdown
              </h5>
              {Object.keys(analytics.disposalMethodDistribution || {}).length === 0 ? (
                <p className="text-muted text-center py-4">No disposal action breakdown recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics.disposalMethodDistribution).map(([method, count]) => {
                    const pct = Math.round((count / getMaxVal(analytics.disposalMethodDistribution)) * 100)
                    return (
                      <div key={method}>
                        <div className="d-flex align-items-center justify-content-between extra-small mb-1">
                          <span className="text-white font-weight-semibold">{method}</span>
                          <span className="text-warning font-weight-bold">{count} item(s)</span>
                        </div>
                        <div className="progress bg-dark border border-secondary border-opacity-50" style={{ height: '12px' }}>
                          <div
                            className="progress-bar bg-warning rounded-pill"
                            role="progressbar"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Participating Cities Chart */}
          <div className="col-lg-6">
            <div className="glass-card h-100">
              <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-geo-alt-fill text-primary"></i> Top Participating Cities
              </h5>
              {Object.keys(analytics.topCitiesDistribution || {}).length === 0 ? (
                <p className="text-muted text-center py-4">No city distribution recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(analytics.topCitiesDistribution).map(([city, count]) => {
                    const pct = Math.round((count / getMaxVal(analytics.topCitiesDistribution)) * 100)
                    return (
                      <div key={city}>
                        <div className="d-flex align-items-center justify-content-between extra-small mb-1">
                          <span className="text-white font-weight-semibold">{city}</span>
                          <span className="text-primary font-weight-bold">{count} pickup(s)</span>
                        </div>
                        <div className="progress bg-dark border border-secondary border-opacity-50" style={{ height: '12px' }}>
                          <div
                            className="progress-bar bg-primary rounded-pill"
                            role="progressbar"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Configurable Environmental Factor Impact Estimates Banner */}
      {analytics && analytics.hasValidFactors && (
        <div className="glass-card mb-4 border border-warning border-opacity-40">
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div>
              <h5 className="text-white font-weight-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-calculator text-warning"></i> Configurable Environmental Impact Estimates
              </h5>
              <span className="text-muted extra-small">Calculated strictly using documented conversion factors ({analytics.factorSourceReference})</span>
            </div>
            <span className="badge bg-warning text-dark font-weight-bold px-3 py-1.5 rounded-full text-xs">
              ESTIMATED METRICS
            </span>
          </div>

          <div className="row g-3">
            <div className="col-md-3">
              <div className="p-3 bg-dark bg-opacity-60 rounded-3 border border-secondary">
                <span className="text-muted extra-small d-block font-weight-semibold mb-1">Landfill Diversion</span>
                <span className="h4 font-weight-bold text-success mb-0">{analytics.estimatedLandfillDiversionKg} kg</span>
                <span className="extra-small text-warning d-block font-mono mt-1">[ESTIMATE]</span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="p-3 bg-dark bg-opacity-60 rounded-3 border border-secondary">
                <span className="text-muted extra-small d-block font-weight-semibold mb-1">CO₂ Avoidance</span>
                <span className="h4 font-weight-bold text-info mb-0">{analytics.estimatedCo2ReductionKg} kg</span>
                <span className="extra-small text-warning d-block font-mono mt-1">[ESTIMATE]</span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="p-3 bg-dark bg-opacity-60 rounded-3 border border-secondary">
                <span className="text-muted extra-small d-block font-weight-semibold mb-1">Recovered Metals</span>
                <span className="h4 font-weight-bold text-warning mb-0">{analytics.estimatedRecoveredMetalsKg} kg</span>
                <span className="extra-small text-warning d-block font-mono mt-1">[ESTIMATE]</span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="p-3 bg-dark bg-opacity-60 rounded-3 border border-secondary">
                <span className="text-muted extra-small d-block font-weight-semibold mb-1">Recovered Plastics</span>
                <span className="h4 font-weight-bold text-primary mb-0">{analytics.estimatedRecoveredPlasticsKg} kg</span>
                <span className="extra-small text-warning d-block font-mono mt-1">[ESTIMATE]</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configurable Environmental Factors Table */}
      <div className="glass-card mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h5 className="text-white font-weight-bold m-0 d-flex align-items-center gap-2">
              <i className="bi bi-sliders text-success"></i> Configurable Environmental Factor Table
            </h5>
            <p className="text-muted extra-small mb-0">
              Manage scientific conversion multipliers and source references per e-waste category.
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0 custom-table extra-small">
            <thead>
              <tr>
                <th>Category</th>
                <th>Landfill Diversion (kg/unit)</th>
                <th>CO₂ Avoidance (kg/unit)</th>
                <th>Recovered Metals (kg/unit)</th>
                <th>Recovered Plastics (kg/unit)</th>
                <th>Documented Source Reference</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {factors.map((f) => (
                <tr key={f.id}>
                  <td className="font-weight-bold text-white">{f.category}</td>
                  <td>{f.landfillDiversionKgPerUnit}</td>
                  <td>{f.co2ReductionKgPerUnit}</td>
                  <td>{f.recoveredMetalsKgPerUnit}</td>
                  <td>{f.recoveredPlasticsKgPerUnit}</td>
                  <td className="text-muted max-w-xs truncate" title={f.sourceReference}>
                    {f.sourceReference}
                  </td>
                  <td>
                    <span className={`badge ${f.validFactor ? 'bg-success' : 'bg-secondary'}`}>
                      {f.validFactor ? 'VALID' : 'DISABLED'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setEditingFactor({ ...f })}
                      className="btn btn-outline-custom btn-sm py-0.5 px-2"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doorstep Pickups & Collector Assignment Management Table */}
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

      {/* Edit Factor Modal / Drawer */}
      {editingFactor && (
        <div className="modal show d-block bg-black bg-opacity-75" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-slate-900 border border-slate-700 text-white">
              <div className="modal-header border-slate-800">
                <h5 className="modal-title font-weight-bold text-emerald-400">
                  Edit Conversion Factor ({editingFactor.category})
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingFactor(null)}
                ></button>
              </div>
              <form onSubmit={handleUpdateFactorSubmit}>
                <div className="modal-body space-y-3 text-sm">
                  <div>
                    <label className="text-muted extra-small d-block mb-1">Landfill Diversion (kg per unit)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={editingFactor.landfillDiversionKgPerUnit}
                      onChange={(e) => setEditingFactor({ ...editingFactor, landfillDiversionKgPerUnit: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-muted extra-small d-block mb-1">CO₂ Avoidance (kg per unit)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={editingFactor.co2ReductionKgPerUnit}
                      onChange={(e) => setEditingFactor({ ...editingFactor, co2ReductionKgPerUnit: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-muted extra-small d-block mb-1">Recovered Metals (kg per unit)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={editingFactor.recoveredMetalsKgPerUnit}
                      onChange={(e) => setEditingFactor({ ...editingFactor, recoveredMetalsKgPerUnit: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-muted extra-small d-block mb-1">Recovered Plastics (kg per unit)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={editingFactor.recoveredPlasticsKgPerUnit}
                      onChange={(e) => setEditingFactor({ ...editingFactor, recoveredPlasticsKgPerUnit: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-muted extra-small d-block mb-1">Documented Source Reference</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-white border-secondary"
                      value={editingFactor.sourceReference}
                      onChange={(e) => setEditingFactor({ ...editingFactor, sourceReference: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-check pt-1">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="validFactorCheck"
                      checked={editingFactor.validFactor}
                      onChange={(e) => setEditingFactor({ ...editingFactor, validFactor: e.target.checked })}
                    />
                    <label className="form-check-label text-white extra-small" htmlFor="validFactorCheck">
                      Mark as Valid Factor (Enable in calculations)
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-slate-800">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setEditingFactor(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingFactor}
                    className="btn btn-success btn-sm font-weight-bold"
                  >
                    {savingFactor ? <span className="spinner-border spinner-border-sm me-1"></span> : null}
                    Save Factor Changes
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
