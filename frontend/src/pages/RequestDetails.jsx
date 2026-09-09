import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { formatIndianDate } from '../utils/workflowHelpers'

export default function RequestDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [request, setRequest] = useState(null)
  const [pickup, setPickup] = useState(null)
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Pickup Scheduling Form State
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [pickupAddress, setPickupAddress] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('MORNING')
  const [contactNumber, setContactNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState(null)
  const [actionNotice, setActionNotice] = useState(null)

  useEffect(() => {
    fetchDetails()
  }, [id])

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/user/ewaste/${id}`)
      setRequest(res.data)
      setPickupAddress(res.data.pickupAddress || '')

      try {
        const pickupRes = await axios.get(`/api/user/pickups/request/${id}`)
        setPickup(pickupRes.data)
      } catch (pErr) {
        setPickup(null)
      }

      try {
        const certRes = await axios.get(`/api/certificates/request/${id}`)
        setCertificate(certRes.data)
      } catch (cErr) {
        setCertificate(null)
      }
    } catch (err) {
      console.error('Failed to fetch request details', err)
      setError(
        err.response?.data?.error || 'Disposal request not found or access denied.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true)
      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/certificates/request/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Certificate_${request.trackingNumber || id}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setActionNotice({ type: 'success', text: 'Certificate downloaded successfully.' })
    } catch (err) {
      console.error('Failed to download certificate', err)
      setActionNotice({ type: 'warning', text: 'Certificate PDF is generated once request status reaches COMPLETED.' })
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleSchedulePickupSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!preferredDate) {
      setFormError('Please select a preferred pickup date.')
      return
    }
    if (!contactNumber || !/^[0-9]{10}$/.test(contactNumber)) {
      setFormError('Please enter a valid 10-digit Indian mobile contact number.')
      return
    }
    if (!pickupAddress.trim()) {
      setFormError('Pickup address cannot be empty.')
      return
    }

    try {
      setScheduling(true)
      const payload = {
        disposalRequestId: parseInt(id),
        pickupAddress: pickupAddress.trim(),
        preferredDate: new Date(preferredDate).toISOString(),
        preferredTimeSlot,
        contactNumber,
        notes
      }
      await axios.post('/api/user/pickups', payload)
      setShowScheduleForm(false)
      fetchDetails()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to schedule doorstep pickup.')
    } finally {
      setScheduling(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this disposal request?')) {
      return
    }

    try {
      setCancelling(true)
      await axios.delete(`/api/user/ewaste/${id}`)
      fetchDetails()
      setActionNotice({ type: 'info', text: 'Request cancelled successfully.' })
    } catch (err) {
      setActionNotice({ type: 'danger', text: err.response?.data?.error || 'Failed to cancel request.' })
    } finally {
      setCancelling(false)
    }
  }

  const formatStatus = (status) => {
    if (!status) return ''
    return status.replace(/_/g, ' ')
  }

  if (loading) {
    return <div className="py-5 text-muted small">Loading request details...</div>
  }

  if (error || !request) {
    return (
      <div className="py-5">
        <h1 className="h2 text-uppercase fw-bold">REQUEST NOT FOUND</h1>
        <p className="text-muted">{error || 'The requested disposal record does not exist.'}</p>
        <Link to="/user/requests" className="btn btn-primary-custom mt-3">Back to My Requests ↗</Link>
      </div>
    )
  }

  const firstItem = request.items && request.items.length > 0 ? request.items[0] : null
  const isCancellable = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PICKUP_ASSIGNED'].includes(request.status)

  return (
    <div className="py-4">
      {actionNotice && <div className={`alert alert-${actionNotice.type} mb-4`}>{actionNotice.text}</div>}

      {/* Header Stream */}
      <div className="editorial-tag">DISPOSAL REQUEST AUDIT</div>
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <h1 className="display-hero-title text-success m-0">
            {request.trackingNumber}
          </h1>
          <p className="text-secondary small mt-1">
            Submitted on {request.createdAt ? formatIndianDate(request.createdAt) : 'N/A'}
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Link to={`/track/${request.trackingNumber}`} target="_blank" className="btn btn-outline-custom">
            Public QR Page ↗
          </Link>
          <button onClick={() => navigate('/user/requests')} className="btn btn-outline-custom">
            Back ↗
          </button>
          {isCancellable && (
            <button onClick={handleCancelRequest} disabled={cancelling} className="btn btn-secondary">
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </button>
          )}
        </div>
      </div>

      {/* Certificate Panel */}
      {certificate && (
        <div className="p-4 border border-dark mb-4 bg-white">
          <div className="d-flex justify-content-between align-items-baseline flex-wrap gap-2">
            <div>
              <span className="status-dot-item text-success fw-bold">
                <span className="status-dot status-dot-emerald"></span> RECYCLING CERTIFICATE READY
              </span>
              <div className="fw-mono fs-4 text-dark mt-1">{certificate.certificateNumber}</div>
            </div>
            <button onClick={handleDownloadPdf} disabled={downloadingPdf} className="btn btn-primary-custom">
              {downloadingPdf ? 'Downloading...' : 'Download Certificate PDF ↗'}
            </button>
          </div>
        </div>
      )}

      {/* Recommendation Panel */}
      <div className="my-4 pb-4 border-bottom border-dark">
        <div className="editorial-tag">RECOMMENDED DISPOSAL ACTION</div>
        <h2 className="h1 text-uppercase fw-bold mb-2">
          {request.recommendedAction ? request.recommendedAction.replace(/_/g, ' ') : 'RESPONSIBLE RECYCLING'}
        </h2>
        <p className="fs-5 text-secondary">
          {request.recommendationExplanation || 'Directed to zero-landfill material recovery facilities.'}
        </p>
      </div>

      <div className="grid-split-60-40 my-4">
        {/* Left Column: Equipment & Location */}
        <div>
          <h2 className="h4 text-uppercase fw-bold mb-3 pb-2 border-bottom border-dark">EQUIPMENT DETAILS</h2>
          {firstItem ? (
            <div className="d-flex flex-column gap-2 text-secondary fs-6">
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Device Model:</span>
                <strong className="text-dark">{firstItem.deviceName || firstItem.category}</strong>
              </div>
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Brand / Manufacturer:</span>
                <strong className="text-dark">{firstItem.brand || 'N/A'}</strong>
              </div>
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Condition:</span>
                <strong className="text-dark">{firstItem.condition}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Quantity:</span>
                <strong className="text-dark">{firstItem.quantity || 1} Unit(s)</strong>
              </div>
            </div>
          ) : (
            <p className="text-muted">No item details registered.</p>
          )}
        </div>

        {/* Right Column: Doorstep Pickup Info */}
        <div className="border-start ps-md-4 pt-3 pt-md-0">
          <h2 className="h4 text-uppercase fw-bold mb-3 pb-2 border-bottom border-dark">COLLECTION DETAILS</h2>
          {pickup ? (
            <div className="d-flex flex-column gap-2 text-secondary fs-6">
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Pickup Status:</span>
                <strong className="text-success">{pickup.status}</strong>
              </div>
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Address:</span>
                <strong className="text-dark">{pickup.pickupAddress}</strong>
              </div>
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Contact Phone:</span>
                <strong className="text-dark">{pickup.contactNumber}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Collector:</span>
                <strong className="text-dark">{pickup.collectorName || 'Pending Assignment'}</strong>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-secondary small">No doorstep pickup scheduled yet.</p>
              {!showScheduleForm && isCancellable && (
                <button onClick={() => setShowScheduleForm(true)} className="btn btn-primary-custom btn-sm">
                  Schedule Doorstep Pickup ↗
                </button>
              )}
            </div>
          )}

          {showScheduleForm && (
            <form onSubmit={handleSchedulePickupSubmit} className="mt-3 p-3 border border-dark">
              {formError && <div className="alert alert-danger small mb-2">{formError}</div>}
              <div className="mb-2">
                <label>Preferred Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  required
                />
              </div>
              <div className="mb-2">
                <label>Contact Phone Number *</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="9876543210"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={scheduling} className="btn btn-primary-custom w-100 mt-2">
                {scheduling ? 'Scheduling...' : 'Confirm Pickup ↗'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
