import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { formatIndianDate } from '../utils/workflowHelpers'

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

  const lifecycleStages = [
    { key: 'SUBMITTED', label: '01 SUBMITTED' },
    { key: 'APPROVED', label: '02 APPROVED' },
    { key: 'PICKUP_ASSIGNED', label: '03 PICKUP ASSIGNED' },
    { key: 'COLLECTED', label: '04 COLLECTED' },
    { key: 'AT_RECYCLING_CENTER', label: '05 FACILITY ARRIVAL' },
    { key: 'PROCESSING', label: '06 PROCESSING & RECOVERY' },
    { key: 'COMPLETED', label: '07 LIFECYCLE COMPLETE' }
  ]

  const getStageIndex = (status) => {
    if (!status) return 0
    switch (status) {
      case 'SUBMITTED': return 0
      case 'APPROVED': return 1
      case 'PICKUP_ASSIGNED': return 2
      case 'COLLECTED': return 3
      case 'AT_RECYCLING_CENTER': return 4
      case 'PROCESSING': return 5
      case 'COMPLETED': return 6
      default: return 0
    }
  }

  const currentStageIdx = trackData ? getStageIndex(trackData.status) : 0

  if (loading) {
    return (
      <div className="py-5 text-muted small">
        Retrieving public e-waste lifecycle ledger...
      </div>
    )
  }

  if (error || !trackData) {
    return (
      <div className="py-5">
        <h1 className="h2 text-uppercase fw-bold">TRACKING RECORD NOT FOUND</h1>
        <p className="text-muted">{error || 'Unable to locate tracking ID in public ledger.'}</p>
        <Link to="/" className="btn btn-primary-custom mt-3">Return Home ↗</Link>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="editorial-tag">PUBLIC E-WASTE LIFECYCLE LEDGER</div>
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <h1 className="display-hero-title text-success m-0">
            {trackData.trackingNumber}
          </h1>
          <p className="fs-5 text-secondary mt-2">
            Equipment: {trackData.deviceName} ({trackData.category}) — Quantity: {trackData.quantity}
          </p>
        </div>

        <span className="status-dot-item">
          <span className="status-dot status-dot-emerald"></span>
          STATUS: {formatStatus(trackData.status)}
        </span>
      </div>

      <div className="grid-split-60-40 my-4">
        {/* Left Column: Lifecycle Timeline */}
        <div>
          <h2 className="h4 text-uppercase fw-bold mb-4 pb-2 border-bottom border-dark">
            END-TO-END DISPOSAL STREAM
          </h2>

          <div className="editorial-timeline">
            {lifecycleStages.map((stage, idx) => {
              const isPassed = idx <= currentStageIdx
              const isCurrent = idx === currentStageIdx

              return (
                <div key={stage.key} className="editorial-timeline-row">
                  <div className="editorial-timeline-num">{String(idx + 1).padStart(2, '0')}</div>
                  <div>
                    <div className={`editorial-timeline-title ${isPassed ? 'text-dark' : 'text-muted'}`}>
                      {stage.label}
                      {isCurrent && <span className="ms-2 status-dot status-dot-emerald"></span>}
                    </div>
                    <div className="editorial-timeline-desc extra-small mt-1">
                      {idx === 0 && 'Disposal request submitted by citizen user.'}
                      {idx === 1 && 'Verified and approved for collection dispatch.'}
                      {idx === 2 && 'Logistics collector assigned for doorstep pickup.'}
                      {idx === 3 && 'E-waste items collected from location.'}
                      {idx === 4 && (trackData.recyclingCenterName ? `Arrived at ${trackData.recyclingCenterName}` : 'Arrived at registered facility.')}
                      {idx === 5 && 'Materials undergoing segregation & zero-landfill recovery.'}
                      {idx === 6 && 'Digital certificate issued & carbon offset logged.'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: QR Code & Material Summary */}
        <div className="border-start ps-md-4 pt-3 pt-md-0">
          <h2 className="h4 text-uppercase fw-bold mb-3 pb-2 border-bottom border-dark">OFFICIAL TRACKING QR</h2>
          
          {trackData.qrCodeDataUrl && (
            <div className="mb-3">
              <img src={trackData.qrCodeDataUrl} alt="QR Code" style={{ width: '160px', height: '160px' }} className="border" />
              <div className="pt-2">
                <button onClick={downloadQRCode} className="btn btn-outline-custom btn-sm">
                  Download QR PNG ↗
                </button>
              </div>
            </div>
          )}

          <div className="d-flex flex-column gap-2 text-secondary fs-6 mt-4">
            <div className="d-flex justify-content-between pb-2 border-bottom">
              <span>Operating Condition:</span>
              <strong className="text-dark">{trackData.condition}</strong>
            </div>
            <div className="d-flex justify-content-between pb-2 border-bottom">
              <span>Recommended Action:</span>
              <strong className="text-success">{trackData.recommendedAction || 'RECYCLE'}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <span>Lifecycle Completion:</span>
              <strong className="text-dark">{trackData.completed ? 'COMPLETED' : 'IN PROGRESS'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
