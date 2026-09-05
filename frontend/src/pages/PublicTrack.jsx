import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

export default function PublicTrack() {
  const { trackingId } = useParams()
  const [trackData, setTrackData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (trackingId) {
      fetchPublicTracking()
    }
  }, [trackingId])

  const fetchPublicTracking = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`/api/public/track/${trackingId}`)
      setTrackData(res.data)
    } catch (err) {
      console.error('Failed to fetch public tracking details', err)
      setError(
        err.response?.data?.error || 'Invalid or expired e-waste tracking ID.'
      )
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (!trackData?.qrCodeDataUrl) return
    const link = document.createElement('a')
    link.href = trackData.qrCodeDataUrl
    link.download = `QR_Tracking_${trackData.trackingNumber}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatStatus = (status) => {
    if (!status) return ''
    return status.replace(/_/g, ' ')
  }

  // Full E-Waste Lifecycle Stepper definition
  const lifecycleStages = [
    { key: 'SUBMITTED', label: 'SUBMITTED', icon: 'bi-file-earmark-arrow-up' },
    { key: 'APPROVED', label: 'APPROVED', icon: 'bi-check2-circle' },
    { key: 'PICKUP_ASSIGNED', label: 'PICKUP ASSIGNED', icon: 'bi-person-badge' },
    { key: 'COLLECTED', label: 'COLLECTED', icon: 'bi-truck' },
    { key: 'AT_RECYCLING_CENTER', label: 'FACILITY ARRIVAL', icon: 'bi-building' },
    { key: 'PROCESSING', label: 'PROCESSING & RECOVERY', icon: 'bi-gear-wide-connected' },
    { key: 'RECYCLED', label: 'RECYCLED / REUSED', icon: 'bi-recycle' },
    { key: 'COMPLETED', label: 'LIFECYCLE COMPLETE', icon: 'bi-patch-check-fill' }
  ]

  const getStageIndex = (status) => {
    if (!status) return 0
    switch (status) {
      case 'SUBMITTED': return 0
      case 'UNDER_REVIEW': return 0
      case 'APPROVED': return 1
      case 'PICKUP_ASSIGNED': return 2
      case 'ON_THE_WAY': return 2
      case 'COLLECTED': return 3
      case 'AT_RECYCLING_CENTER': return 4
      case 'PROCESSING': return 5
      case 'RECYCLED':
      case 'REUSED':
      case 'REFURBISHED': return 6
      case 'COMPLETED': return 7
      default: return 0
    }
  }

  const currentStageIdx = trackData ? getStageIndex(trackData.status) : 0

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        <div className="glass-card py-5">
          <span className="spinner-border spinner-border-sm text-success me-2" role="status"></span>
          Retrieving public e-waste lifecycle ledger...
        </div>
      </div>
    )
  }

  if (error || !trackData) {
    return (
      <div className="container py-5">
        <div className="glass-card text-center py-5">
          <i className="bi bi-qr-code-scan text-danger display-4 d-block mb-3"></i>
          <h4 className="text-white mb-2">Tracking Record Not Found</h4>
          <p className="text-muted mb-4">{error || 'Unable to locate tracking ID in public ledger.'}</p>
          <Link to="/" className="btn btn-primary-custom text-white text-decoration-none">
            <i className="bi bi-house me-1"></i> Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      {/* Header Banner */}
      <div className="hero-card mb-4 text-center">
        <span className="hero-tag">🌐 Public E-Waste Verification Ledger</span>
        <h1 className="hero-title h2 mb-1 text-success">
          <code>{trackData.trackingNumber}</code>
        </h1>
        <p className="hero-description small mb-0">
          Transparent material tracking &amp; eco-recycling compliance history.
        </p>
      </div>

      <div className="row g-4">
        {/* Left Column: Visual Stepper & Details */}
        <div className="col-lg-8">
          <div className="glass-card mb-4">
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
              <div>
                <span className="text-muted extra-small d-block">Device Category</span>
                <h4 className="text-white font-weight-bold m-0">{trackData.deviceName}</h4>
                <span className="badge bg-secondary text-white mt-1">{trackData.category}</span>
              </div>
              <div>
                <span className="text-muted extra-small d-block text-end">Current Lifecycle Stage</span>
                <span className={`badge-status badge-status-${trackData.status}`}>
                  {formatStatus(trackData.status)}
                </span>
              </div>
            </div>

            {/* Stepper / Timeline Bar */}
            <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-signpost-split text-success"></i> E-Waste Lifecycle Stepper
            </h5>

            <div className="position-relative ps-4 border-start border-secondary border-opacity-50 ms-3 py-2">
              {lifecycleStages.map((stage, idx) => {
                const isPassed = idx <= currentStageIdx
                const isCurrent = idx === currentStageIdx
                return (
                  <div key={stage.key} className="mb-4 position-relative">
                    <div
                      className={`position-absolute top-0 start-0 translate-middle rounded-circle d-flex align-items-center justify-content-center ${
                        isPassed ? 'bg-success text-white' : 'bg-dark text-muted border border-secondary'
                      }`}
                      style={{ width: '32px', height: '32px', marginLeft: '-24px' }}
                    >
                      <i className={`bi ${stage.icon} small`}></i>
                    </div>

                    <div className="ps-3">
                      <div className="d-flex align-items-center gap-2">
                        <h6 className={`m-0 font-weight-bold ${isPassed ? 'text-white' : 'text-muted'}`}>
                          {stage.label}
                        </h6>
                        {isCurrent && (
                          <span className="badge bg-success bg-opacity-20 text-success border border-success extra-small">
                            CURRENT STAGE
                          </span>
                        )}
                      </div>
                      <p className="text-muted extra-small m-0 mt-1">
                        {idx === 0 && 'Disposal request submitted by citizen user.'}
                        {idx === 1 && 'Verified and approved for collection dispatch.'}
                        {idx === 2 && 'Logistics collector assigned to pick up device.'}
                        {idx === 3 && 'E-waste items collected from doorstep.'}
                        {idx === 4 && (trackData.recyclingCenterName ? `Received at ${trackData.recyclingCenterName}` : 'Arrived at registered recycling center.')}
                        {idx === 5 && 'Materials undergoing dismantling and toxic metal segregation.'}
                        {idx === 6 && (trackData.recommendedAction ? `Action: ${trackData.recommendedAction} completed.` : 'Material circular economy recovery complete.')}
                        {idx === 7 && 'Certificate issued. Carbon offset recorded in public ledger.'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status Change History Ledger */}
          {trackData.statusTimeline && trackData.statusTimeline.length > 0 && (
            <div className="glass-card">
              <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-journal-text text-info"></i> Status Transition Log
              </h5>
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0 custom-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Stage</th>
                      <th>Log Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackData.statusTimeline.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-muted small">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td>
                          <span className="badge bg-secondary text-white">{formatStatus(item.status)}</span>
                        </td>
                        <td className="text-white small">{item.comment || 'Status updated'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Public QR Code & Safe Summary */}
        <div className="col-lg-4">
          <div className="glass-card mb-4 text-center">
            <h5 className="text-white font-weight-bold mb-3">
              <i className="bi bi-qr-code text-warning me-2"></i>Official Tracking QR
            </h5>

            {trackData.qrCodeDataUrl ? (
              <div className="p-3 bg-white rounded-3 d-inline-block mb-3 shadow">
                <img
                  src={trackData.qrCodeDataUrl}
                  alt="QR Code"
                  style={{ width: '180px', height: '180px' }}
                />
              </div>
            ) : (
              <p className="text-muted extra-small">QR Code loading...</p>
            )}

            <p className="text-muted extra-small mb-3">
              Contains public tracking reference link only. Zero personal data stored inside QR payload.
            </p>

            <button onClick={downloadQRCode} className="btn btn-success btn-sm w-100 text-white font-weight-bold">
              <i className="bi bi-download me-1"></i> Download QR Code PNG
            </button>
          </div>

          <div className="glass-card">
            <h5 className="text-white font-weight-bold mb-3">Safe Material Ledger</h5>
            <div className="mb-2">
              <span className="text-muted extra-small d-block">Condition</span>
              <span className="text-white font-weight-semibold">{trackData.condition}</span>
            </div>
            <div className="mb-2">
              <span className="text-muted extra-small d-block">Quantity</span>
              <span className="text-white font-weight-semibold">{trackData.quantity} Unit(s)</span>
            </div>
            <div className="mb-2">
              <span className="text-muted extra-small d-block">Recommended Eco Action</span>
              <span className="text-info font-weight-bold">{trackData.recommendedAction || 'RECYCLE'}</span>
            </div>
            <div className="mb-2">
              <span className="text-muted extra-small d-block">Recycling Completion</span>
              <span className={`badge ${trackData.completed ? 'bg-success' : 'bg-warning text-dark'}`}>
                {trackData.completed ? 'COMPLETED' : 'IN PROGRESS'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
