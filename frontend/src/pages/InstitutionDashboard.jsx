import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function InstitutionDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // CSV Upload & Modal states
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [csvPreview, setCsvPreview] = useState(null)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvSubmitError, setCsvSubmitError] = useState('')

  // Manual Bulk Request Modal states
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualForm, setManualForm] = useState({
    organizationName: '',
    organizationType: 'COLLEGE',
    contactPhone: '',
    pickupAddress: '',
    pickupCity: '',
    pickupState: '',
    pickupPostalCode: '',
    preferredDate: '',
    notes: '',
    items: [
      { category: 'MONITOR', deviceName: 'LCD Monitors', brand: 'Dell', quantity: 10, condition: 'WORKING' }
    ]
  })
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [manualError, setManualError] = useState('')

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/institution/dashboard')
      setDashboardData(res.data)
      setError(null)
    } catch (err) {
      console.error('Failed to load institution dashboard:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Sample CSV generator
  const downloadSampleCsv = () => {
    const csvHeader = 'Category,Device Name,Brand,Quantity,Condition,Working Status,Description\n'
    const sampleRows = 
      'MONITOR,UltraSharp 24",Dell,40,WORKING,Working,Computer Lab Monitors\n' +
      'KEYBOARD,K120 Keyboard,Logitech,25,WORKING,Working,Library Keyboards\n' +
      'DESKTOP,OptiPlex 7040,Dell,15,PARTIALLY_WORKING,Partially Working,Mainframe PCs\n' +
      'PRINTER,LaserJet 1020,HP,10,DAMAGED,Not Working,E-waste printers'
    
    const blob = new Blob([csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'institutional_bulk_ewaste_sample.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle CSV Selection & Preview
  const handleCsvChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCsvFile(file)
    setCsvSubmitError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      setCsvLoading(true)
      const res = await axios.post('/api/institution/ewaste/preview-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setCsvPreview(res.data)
    } catch (err) {
      setCsvSubmitError(err.response?.data?.message || 'Failed to parse CSV file')
    } finally {
      setCsvLoading(false)
    }
  }

  // Submit CSV Bulk Request
  const handleSubmitCsvRequest = async () => {
    if (!csvPreview || csvPreview.invalidRowsCount > 0) return
    if (!manualForm.contactPhone || !manualForm.pickupAddress || !manualForm.pickupCity || !manualForm.pickupState || !manualForm.pickupPostalCode) {
      setCsvSubmitError('Please fill in pickup details (Address, City, State, Pincode, Phone) before submitting.')
      return
    }

    try {
      setCsvLoading(true)
      const bulkPayload = {
        organizationName: dashboardData?.organizationName || user?.profile?.organizationName,
        organizationType: dashboardData?.organizationType || 'COLLEGE',
        contactPhone: manualForm.contactPhone,
        pickupAddress: manualForm.pickupAddress,
        pickupCity: manualForm.pickupCity,
        pickupState: manualForm.pickupState,
        pickupPostalCode: manualForm.pickupPostalCode,
        preferredDate: manualForm.preferredDate || null,
        notes: manualForm.notes,
        items: csvPreview.parsedItems
      }

      await axios.post('/api/institution/ewaste/bulk', bulkPayload)
      setShowCsvModal(false)
      setCsvFile(null)
      setCsvPreview(null)
      fetchDashboard()
    } catch (err) {
      setCsvSubmitError(err.response?.data?.message || 'Failed to submit bulk request.')
    } finally {
      setCsvLoading(false)
    }
  }

  // Manual Form handlers
  const handleAddItemLine = () => {
    setManualForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { category: 'DESKTOP', deviceName: '', brand: '', quantity: 1, condition: 'WORKING' }
      ]
    }))
  }

  const handleRemoveItemLine = (index) => {
    setManualForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...manualForm.items]
    updated[index][field] = value
    setManualForm(prev => ({ ...prev, items: updated }))
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setManualError('')

    if (!manualForm.contactPhone.trim() || !manualForm.pickupAddress.trim() || !manualForm.pickupCity.trim() || !manualForm.pickupState.trim() || !manualForm.pickupPostalCode.trim()) {
      setManualError('Please provide complete pickup address, city, state, pincode and contact phone.')
      return
    }

    if (!manualForm.items || manualForm.items.length === 0) {
      setManualError('Please add at least one item line to your bulk request.')
      return
    }

    try {
      setManualSubmitting(true)
      const payload = {
        organizationName: dashboardData?.organizationName || user?.profile?.organizationName,
        organizationType: dashboardData?.organizationType || 'COLLEGE',
        contactPhone: manualForm.contactPhone,
        pickupAddress: manualForm.pickupAddress,
        pickupCity: manualForm.pickupCity,
        pickupState: manualForm.pickupState,
        pickupPostalCode: manualForm.pickupPostalCode,
        preferredDate: manualForm.preferredDate || null,
        notes: manualForm.notes,
        items: manualForm.items
      }
      await axios.post('/api/institution/ewaste/bulk', payload)
      setShowManualModal(false)
      fetchDashboard()
    } catch (err) {
      setManualError(err.response?.data?.message || 'Failed to submit bulk request')
    } finally {
      setManualSubmitting(false)
    }
  }

  // Download PDF Report helper
  const downloadReportPdf = async (requestId, trackingNumber) => {
    try {
      const response = await axios.get(`/api/institution/reports/${requestId}/download`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Asset_Processing_Report_${trackingNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Failed to download asset processing report PDF.')
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center text-white">
        <div className="spinner-border text-success mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <h5>Loading Institutional E-Waste Portal...</h5>
      </div>
    )
  }

  return (
    <div className="container py-4">
      {/* Top Header Card */}
      <div className="hero-card shadow-lg p-4 mb-4 rounded-4 position-relative overflow-hidden">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 position-relative z-1">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-3 py-1.5 rounded-pill fw-bold small">
                <i className="bi bi-building me-1"></i> {dashboardData?.organizationType || 'INSTITUTION'} PORTAL
              </span>
            </div>
            <h2 className="hero-title h3 mb-1 text-white">
              {dashboardData?.organizationName || 'Institutional Dashboard'}
            </h2>
            <p className="hero-description text-muted small mb-0">
              Bulk asset disposal management, doorstep pickup scheduling &amp; compliance reporting.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button 
              className="btn btn-outline-success btn-sm px-3 py-2 fw-semibold rounded-3"
              onClick={downloadSampleCsv}
            >
              <i className="bi bi-file-earmark-arrow-down me-1"></i> Sample CSV
            </button>
            <button 
              className="btn btn-secondary-custom btn-sm px-3 py-2 fw-semibold rounded-3"
              onClick={() => {
                setShowCsvModal(true)
                setCsvFile(null)
                setCsvPreview(null)
                setCsvSubmitError('')
              }}
            >
              <i className="bi bi-file-earmark-spreadsheet me-1"></i> CSV Bulk Upload
            </button>
            <button 
              className="btn btn-primary-custom btn-sm px-3 py-2 fw-semibold rounded-3"
              onClick={() => {
                setShowManualModal(true)
                setManualError('')
              }}
            >
              <i className="bi bi-plus-circle me-1"></i> New Bulk Request
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 mb-4 d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
          <div>{error}</div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="bg-dark p-3 rounded-4 border border-secondary border-opacity-25 h-100 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 p-2.5 bg-success bg-opacity-10 text-success fs-3">
                <i className="bi bi-box-seam-fill"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium">Total Assets Disposed</div>
                <div className="h3 mb-0 fw-bold text-white">{dashboardData?.totalAssetsDisposed || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="bg-dark p-3 rounded-4 border border-secondary border-opacity-25 h-100 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 p-2.5 bg-warning bg-opacity-10 text-warning fs-3">
                <i className="bi bi-truck"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium">Pending Pickups</div>
                <div className="h3 mb-0 fw-bold text-white">{dashboardData?.pendingCollections || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="bg-dark p-3 rounded-4 border border-secondary border-opacity-25 h-100 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 p-2.5 bg-info bg-opacity-10 text-info fs-3">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium">Completed Disposals</div>
                <div className="h3 mb-0 fw-bold text-white">{dashboardData?.completedCollections || 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="bg-dark p-3 rounded-4 border border-secondary border-opacity-25 h-100 shadow-sm">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 p-2.5 bg-primary bg-opacity-10 text-primary fs-3">
                <i className="bi bi-list-task"></i>
              </div>
              <div>
                <div className="text-muted small fw-medium">Total Bulk Batches</div>
                <div className="h3 mb-0 fw-bold text-white">{dashboardData?.totalBulkRequests || 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Disposal Requests Table */}
      <div className="bg-dark rounded-4 p-4 border border-secondary border-opacity-25 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-white mb-0 fw-bold">
            <i className="bi bi-buildings text-success me-2"></i> Bulk E-Waste Requests History
          </h5>
          <span className="text-muted small">Showing recent institutional batches</span>
        </div>

        {!dashboardData?.recentBulkRequests || dashboardData.recentBulkRequests.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
            <p className="mb-0">No bulk e-waste disposal requests found yet.</p>
            <span className="small">Click "New Bulk Request" or "CSV Bulk Upload" to create one.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0 text-white">
              <thead>
                <tr className="text-muted small border-secondary">
                  <th>Tracking Ref</th>
                  <th>Submission Date</th>
                  <th>Total Items</th>
                  <th>Pickup Address</th>
                  <th>Status</th>
                  <th className="text-end">Actions / Compliance Reports</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentBulkRequests.map(req => {
                  const itemCount = req.items ? req.items.reduce((acc, item) => acc + (item.quantity || 1), 0) : 0
                  return (
                    <tr key={req.id} className="border-secondary">
                      <td>
                        <span className="fw-bold text-success font-monospace">{req.trackingNumber}</span>
                      </td>
                      <td className="small text-muted">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-25 text-white px-2.5 py-1">
                          {itemCount} units ({req.items ? req.items.length : 0} line items)
                        </span>
                      </td>
                      <td className="small text-truncate" style={{ maxWidth: '200px' }}>
                        {req.pickupAddress}, {req.pickupCity} ({req.pickupPostalCode})
                      </td>
                      <td>
                        <span className={`badge ${
                          req.status === 'COMPLETED' ? 'bg-success' :
                          req.status === 'PICKUP_ASSIGNED' || req.status === 'COLLECTED' ? 'bg-info' :
                          'bg-warning text-dark'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Link 
                            to={`/track/${req.trackingNumber}`}
                            className="btn btn-outline-light btn-sm py-1 px-2.5 small"
                            title="Public QR Lifecycle Tracking"
                          >
                            <i className="bi bi-qr-code-scan"></i> Track
                          </Link>
                          <button
                            onClick={() => downloadReportPdf(req.id, req.trackingNumber)}
                            className="btn btn-outline-success btn-sm py-1 px-2.5 small"
                            title="Download PDF Asset Processing Report"
                          >
                            <i className="bi bi-file-earmark-pdf-fill me-1"></i> Asset Report
                          </button>
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

      {/* CSV UPLOAD & PREVIEW MODAL */}
      {showCsvModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-secondary shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold text-success">
                  <i className="bi bi-file-earmark-spreadsheet me-2"></i> CSV Bulk E-Waste Upload
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCsvModal(false)}></button>
              </div>

              <div className="modal-body">
                {csvSubmitError && (
                  <div className="alert alert-danger small mb-3">{csvSubmitError}</div>
                )}

                {/* CSV File Input */}
                <div className="mb-4">
                  <label className="form-label text-white small fw-bold">Select CSV File *</label>
                  <input
                    type="file"
                    accept=".csv"
                    className="form-control bg-dark text-white border-secondary"
                    onChange={handleCsvChange}
                  />
                  <div className="form-text text-muted small">
                    Must follow header format: <code>Category,Device Name,Brand,Quantity,Condition,Working Status,Description</code>
                  </div>
                </div>

                {csvLoading && (
                  <div className="text-center py-3 text-success">
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Parsing &amp; Validating CSV rows...
                  </div>
                )}

                {/* CSV Validation Preview Table */}
                {csvPreview && (
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0 text-white">CSV Pre-validation Summary</h6>
                      <div className="d-flex gap-2">
                        <span className="badge bg-success">Valid: {csvPreview.validRowsCount}</span>
                        {csvPreview.invalidRowsCount > 0 && (
                          <span className="badge bg-danger">Invalid: {csvPreview.invalidRowsCount}</span>
                        )}
                      </div>
                    </div>

                    <div className="table-responsive rounded-3 border border-secondary" style={{ maxHeight: '240px' }}>
                      <table className="table table-dark table-sm table-striped mb-0 text-white">
                        <thead>
                          <tr className="text-muted small">
                            <th># Row</th>
                            <th>Category</th>
                            <th>Device / Brand</th>
                            <th>Qty</th>
                            <th>Condition</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.rowValidationResults?.map((res, idx) => (
                            <tr key={idx}>
                              <td>{res.rowNumber}</td>
                              <td>{res.category}</td>
                              <td>{res.deviceName}</td>
                              <td>{res.quantity}</td>
                              <td>{res.condition}</td>
                              <td>
                                {res.valid ? (
                                  <span className="badge bg-success">Valid</span>
                                ) : (
                                  <span className="badge bg-danger">{res.errorMessage}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Pickup Address details for CSV submission */}
                {csvPreview && (
                  <div className="p-3 bg-dark border border-secondary rounded-3">
                    <h6 className="text-success small fw-bold mb-3">Pickup Address &amp; Contact Details</h6>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <input
                          type="tel"
                          className="form-control form-control-sm bg-dark text-white border-secondary"
                          placeholder="Contact Phone *"
                          value={manualForm.contactPhone}
                          onChange={(e) => setManualForm(p => ({ ...p, contactPhone: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm bg-dark text-white border-secondary"
                          placeholder="Preferred Date"
                          value={manualForm.preferredDate}
                          onChange={(e) => setManualForm(p => ({ ...p, preferredDate: e.target.value }))}
                        />
                      </div>
                      <div className="col-12">
                        <input
                          type="text"
                          className="form-control form-control-sm bg-dark text-white border-secondary"
                          placeholder="Street Address *"
                          value={manualForm.pickupAddress}
                          onChange={(e) => setManualForm(p => ({ ...p, pickupAddress: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control form-control-sm bg-dark text-white border-secondary"
                          placeholder="City *"
                          value={manualForm.pickupCity}
                          onChange={(e) => setManualForm(p => ({ ...p, pickupCity: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control form-control-sm bg-dark text-white border-secondary"
                          placeholder="State *"
                          value={manualForm.pickupState}
                          onChange={(e) => setManualForm(p => ({ ...p, pickupState: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control form-control-sm bg-dark text-white border-secondary"
                          placeholder="Pincode *"
                          value={manualForm.pickupPostalCode}
                          onChange={(e) => setManualForm(p => ({ ...p, pickupPostalCode: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-secondary">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowCsvModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success-custom btn-sm px-4 fw-bold"
                  disabled={!csvPreview || csvPreview.invalidRowsCount > 0 || csvLoading}
                  onClick={handleSubmitCsvRequest}
                >
                  Submit Bulk Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL BULK REQUEST MODAL */}
      {showManualModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content bg-dark text-white border border-secondary shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold text-success">
                  <i className="bi bi-plus-circle me-2"></i> Submit Institutional Bulk E-Waste Batch
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowManualModal(false)}></button>
              </div>

              <form onSubmit={handleManualSubmit}>
                <div className="modal-body">
                  {manualError && <div className="alert alert-danger small mb-3">{manualError}</div>}

                  {/* Pickup & Contact Information */}
                  <div className="p-3 bg-dark border border-secondary rounded-3 mb-4">
                    <h6 className="text-success small fw-bold mb-3">1. Doorstep Pickup &amp; Location Details</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-white small">Contact Phone Number *</label>
                        <input
                          type="tel"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="e.g. 9876543210"
                          value={manualForm.contactPhone}
                          onChange={(e) => setManualForm(p => ({ ...p, contactPhone: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-white small">Preferred Pickup Date</label>
                        <input
                          type="datetime-local"
                          className="form-control bg-dark text-white border-secondary"
                          value={manualForm.preferredDate}
                          onChange={(e) => setManualForm(p => ({ ...p, preferredDate: e.target.value }))}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label text-white small">Pickup Street Address *</label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="Campus / Office Block, Street"
                          value={manualForm.pickupAddress}
                          onChange={(e) => setManualForm(p => ({ ...p, pickupAddress: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-white small">City *</label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="Chennai / Bengaluru"
                          value={manualForm.pickupCity}
                          onChange={(e) => setManualForm(p => ({ ...p, pickupCity: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-white small">State *</label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="Tamil Nadu"
                          value={manualForm.pickupState}
                          onChange={(e) => setManualForm(p => ({ ...p, pickupState: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-white small">Pincode *</label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="600036"
                          value={manualForm.pickupPostalCode}
                          onChange={(e) => setManualForm(p => ({ ...p, pickupPostalCode: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multi-item Breakdown */}
                  <div className="p-3 bg-dark border border-secondary rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="text-success small fw-bold mb-0">2. Bulk Asset Inventory Lines</h6>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm py-1 px-3 fw-bold"
                        onClick={handleAddItemLine}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Add Item Line
                      </button>
                    </div>

                    {manualForm.items.map((item, idx) => (
                      <div key={idx} className="row g-2 align-items-center mb-3 p-2 bg-dark rounded border border-secondary">
                        <div className="col-md-3">
                          <label className="form-label text-muted small mb-1">Category</label>
                          <select
                            className="form-select form-select-sm bg-dark text-white border-secondary"
                            value={item.category}
                            onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                          >
                            <option value="MONITOR">Monitor / Screen</option>
                            <option value="KEYBOARD">Keyboard / Input Device</option>
                            <option value="DESKTOP">Desktop CPU / Tower</option>
                            <option value="LAPTOP">Laptop Computer</option>
                            <option value="PRINTER">Printer / Scanner</option>
                            <option value="BATTERY">Battery / Power Pack</option>
                            <option value="CABLE_ACCESSORY">Cable / Adapter / Wire</option>
                            <option value="OTHER_ELECTRONICS">Other Electronics</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label text-muted small mb-1">Device Name</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-dark text-white border-secondary"
                            placeholder="e.g. Dell Monitors"
                            value={item.deviceName}
                            onChange={(e) => handleItemChange(idx, 'deviceName', e.target.value)}
                          />
                        </div>
                        <div className="col-md-2">
                          <label className="form-label text-muted small mb-1">Brand</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-dark text-white border-secondary"
                            placeholder="e.g. Dell / HP"
                            value={item.brand}
                            onChange={(e) => handleItemChange(idx, 'brand', e.target.value)}
                          />
                        </div>
                        <div className="col-md-2">
                          <label className="form-label text-muted small mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            className="form-control form-control-sm bg-dark text-white border-secondary"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-md-2 d-flex align-items-end gap-2">
                          <div className="flex-fill">
                            <label className="form-label text-muted small mb-1">Condition</label>
                            <select
                              className="form-select form-select-sm bg-dark text-white border-secondary"
                              value={item.condition}
                              onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                            >
                              <option value="WORKING">Working</option>
                              <option value="PARTIALLY_WORKING">Partially Working</option>
                              <option value="DAMAGED">Damaged</option>
                              <option value="EXPIRED">Expired</option>
                            </select>
                          </div>
                          {manualForm.items.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm p-1.5"
                              onClick={() => handleRemoveItemLine(idx)}
                              title="Remove item line"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowManualModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success-custom btn-sm px-4 fw-bold" disabled={manualSubmitting}>
                    {manualSubmitting ? 'Submitting Batch...' : 'Submit Bulk Request'}
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
