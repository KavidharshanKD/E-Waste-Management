import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatIndianDate } from '../utils/workflowHelpers'

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

  const handleSubmitCsvRequest = async () => {
    if (!csvPreview || csvPreview.invalidRowsCount > 0) return
    if (!manualForm.contactPhone || !manualForm.pickupAddress || !manualForm.pickupCity || !manualForm.pickupState || !manualForm.pickupPostalCode) {
      setCsvSubmitError('Please fill in pickup details (Address, City, State, PIN Code, Phone) before submitting.')
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
      setManualError('Please provide complete pickup address, city, state, PIN code and contact phone.')
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
      setError('Asset processing report PDF is generated once request status reaches COMPLETED.')
    }
  }

  if (loading) {
    return (
      <div className="py-5 text-muted small">
        Loading Institutional E-Waste Portal...
      </div>
    )
  }

  return (
    <div className="py-4">
      {/* Header */}
      <div className="editorial-tag">INSTITUTIONAL BULK PORTAL</div>
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <h1 className="h1 text-uppercase fw-bold m-0">
            {dashboardData?.organizationName || 'INSTITUTIONAL DASHBOARD'}
          </h1>
          <p className="text-secondary small mt-1">
            Bulk asset disposal management, CSV uploads &amp; compliance asset reporting.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button onClick={downloadSampleCsv} className="btn btn-outline-custom">
            Sample CSV ↗
          </button>
          <button 
            onClick={() => {
              setShowCsvModal(true)
              setCsvFile(null)
              setCsvPreview(null)
              setCsvSubmitError('')
            }}
            className="btn btn-outline-custom"
          >
            CSV Upload ↗
          </button>
          <button 
            onClick={() => {
              setShowManualModal(true)
              setManualError('')
            }}
            className="btn btn-primary-custom"
          >
            New Bulk Request ↗
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Linear Stat Summary Stream */}
      <section className="py-3 mb-4">
        <div className="row g-4 text-start">
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">TOTAL ASSETS DISPOSED</div>
            <div className="fs-2 fw-bold">{dashboardData?.totalAssetsDisposed || 0} UNITS</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">PENDING PICKUPS</div>
            <div className="fs-2 fw-bold">{dashboardData?.pendingCollections || 0}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">COMPLETED DISPOSALS</div>
            <div className="fs-2 fw-bold text-success">{dashboardData?.completedCollections || 0}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-uppercase small font-weight-bold text-muted">TOTAL BULK BATCHES</div>
            <div className="fs-2 fw-bold">{dashboardData?.totalBulkRequests || 0}</div>
          </div>
        </div>
      </section>

      <div className="thin-rule"></div>

      {/* Bulk Disposal History */}
      <section className="py-3">
        <h2 className="h4 text-uppercase fw-bold mb-3">BULK E-WASTE BATCH HISTORY</h2>

        {!dashboardData?.recentBulkRequests || dashboardData.recentBulkRequests.length === 0 ? (
          <div className="py-4 text-muted small">
            No bulk e-waste disposal requests found yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>TRACKING REF</th>
                  <th>SUBMISSION DATE</th>
                  <th>TOTAL UNITS</th>
                  <th>LOCATION</th>
                  <th>STATUS</th>
                  <th>COMPLIANCE REPORT</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentBulkRequests.map(req => {
                  const itemCount = req.items ? req.items.reduce((acc, item) => acc + (item.quantity || 1), 0) : 0
                  return (
                    <tr key={req.id}>
                      <td>
                        <code className="fw-bold">{req.trackingNumber}</code>
                      </td>
                      <td className="small text-muted">
                        {req.createdAt ? formatIndianDate(req.createdAt) : 'N/A'}
                      </td>
                      <td>
                        {itemCount} units
                      </td>
                      <td className="small">
                        {req.pickupAddress}, {req.pickupCity}
                      </td>
                      <td>
                        <span className="status-dot-item">
                          <span className={`status-dot ${req.status === 'COMPLETED' ? 'status-dot-emerald' : 'status-dot-warning'}`}></span>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Link to={`/track/${req.trackingNumber}`} className="btn btn-outline-custom btn-sm">
                            Track
                          </Link>
                          <button
                            onClick={() => downloadReportPdf(req.id, req.trackingNumber)}
                            className="btn btn-secondary btn-sm"
                          >
                            Asset Report
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
      </section>

      {/* CSV MODAL */}
      {showCsvModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-white text-dark border-dark">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">CSV BULK E-WASTE UPLOAD</h5>
                <button type="button" className="btn-close" onClick={() => setShowCsvModal(false)}></button>
              </div>
              <div className="modal-body">
                {csvSubmitError && <div className="alert alert-danger small mb-3">{csvSubmitError}</div>}
                <div className="mb-3">
                  <label>Select CSV File *</label>
                  <input type="file" accept=".csv" className="form-control" onChange={handleCsvChange} />
                </div>
                {csvPreview && (
                  <div className="small">
                    <strong>Valid Rows: {csvPreview.validRowsCount}</strong>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCsvModal(false)}>Close</button>
                <button type="button" className="btn btn-primary-custom" disabled={!csvPreview} onClick={handleSubmitCsvRequest}>Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL BULK MODAL */}
      {showManualModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content bg-white text-dark border-dark">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">SUBMIT BULK BATCH</h5>
                <button type="button" className="btn-close" onClick={() => setShowManualModal(false)}></button>
              </div>
              <form onSubmit={handleManualSubmit}>
                <div className="modal-body">
                  {manualError && <div className="alert alert-danger small mb-3">{manualError}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label>Contact Phone *</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="9876543210"
                        value={manualForm.contactPhone}
                        onChange={(e) => setManualForm(p => ({ ...p, contactPhone: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label>Street Address *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Campus street address"
                        value={manualForm.pickupAddress}
                        onChange={(e) => setManualForm(p => ({ ...p, pickupAddress: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label>City *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Coimbatore"
                        value={manualForm.pickupCity}
                        onChange={(e) => setManualForm(p => ({ ...p, pickupCity: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label>State *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Tamil Nadu"
                        value={manualForm.pickupState}
                        onChange={(e) => setManualForm(p => ({ ...p, pickupState: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label>PIN Code *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="641001"
                        value={manualForm.pickupPostalCode}
                        onChange={(e) => setManualForm(p => ({ ...p, pickupPostalCode: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowManualModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-custom" disabled={manualSubmitting}>Submit Bulk Batch</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
