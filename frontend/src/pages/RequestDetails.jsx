import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import RecommendationCard from '../components/RecommendationCard'

export default function RequestDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [request, setRequest] = useState(null)
  const [pickup, setPickup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  // Pickup Scheduling Form State
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [pickupAddress, setPickupAddress] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('MORNING')
  const [contactNumber, setContactNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    fetchDetails()
  }, [id])

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/user/ewaste/${id}`)
      setRequest(res.data)
      setPickupAddress(res.data.pickupAddress || '')

      // Try fetching existing pickup for this request
      try {
        const pickupRes = await axios.get(`/api/user/pickups/request/${id}`)
        setPickup(pickupRes.data)
      } catch (pErr) {
        // No pickup scheduled yet
        setPickup(null)
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

  const handleSchedulePickupSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!preferredDate) {
      setFormError('Please select a preferred pickup date.')
      return
    }
    if (!contactNumber || !/^[0-9]{10}$/.test(contactNumber)) {
      setFormError('Please enter a valid 10-digit mobile contact number.')
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
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel request')
    } finally {
      setCancelling(false)
    }
  }

  const formatStatus = (status) => {
    if (!status) return ''
    return status.replace(/_/g, ' ')
  }

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        <span className="spinner-border spinner-border-sm me-2 text-success" role="status"></span>
        Loading disposal request details...
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="container py-5">
        <div className="glass-card text-center py-5">
          <i className="bi bi-exclamation-octagon text-danger display-4 d-block mb-3"></i>
          <h4 className="text-white mb-2">Request Not Found</h4>
          <p className="text-muted mb-4">{error || 'The requested disposal record does not exist.'}</p>
          <Link to="/user/requests" className="btn btn-primary-custom text-white text-decoration-none">
            <i className="bi bi-arrow-left me-1"></i> Back to My Requests
          </Link>
        </div>
      </div>
    )
  }

  const firstItem = request.items && request.items.length > 0 ? request.items[0] : null
  const isCancellable = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PICKUP_ASSIGNED'].includes(request.status)

  // Timeline stages definition
  const timelineStages = [
    { key: 'SUBMITTED', label: 'Request Submitted', icon: 'bi-file-earmark-text' },
    { key: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', icon: 'bi-calendar-check' },
    { key: 'PICKUP_ASSIGNED', label: 'Collector Assigned', icon: 'bi-person-badge' },
    { key: 'ON_THE_WAY', label: 'Collector On the Way', icon: 'bi-truck' },
    { key: 'COLLECTED', label: 'Items Collected', icon: 'bi-box-seam-fill' },
    { key: 'AT_RECYCLING_CENTER', label: 'At Recycling Center', icon: 'bi-building' }
  ]

  const getStageIndex = (status, hasPickup) => {
    if (status === 'CANCELLED') return -1
    if (status === 'COLLECTED') return 4
    if (status === 'AT_RECYCLING_CENTER' || status === 'PROCESSING' || status === 'COMPLETED') return 5
    if (pickup) {
      if (pickup.status === 'ON_THE_WAY') return 3
      if (pickup.status === 'ASSIGNED' || status === 'PICKUP_ASSIGNED') return 2
      return 1
    }
    if (status === 'APPROVED' || status === 'UNDER_REVIEW') return 0
    return 0
  }

  const currentStageIdx = getStageIndex(request.status, pickup)

  return (
    <div className="container py-4">
      {/* Header Bar */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <span className="hero-tag">Tracking ID</span>
          <h1 className="hero-title h2 mb-1 text-success">
            <code>{request.trackingNumber}</code>
          </h1>
          <p className="text-muted small mb-0">
            Created on {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link to={`/track/${request.trackingNumber}`} target="_blank" className="btn btn-success text-white font-weight-bold text-decoration-none">
            <i className="bi bi-qr-code-scan me-1"></i> Public QR Tracking Page
          </Link>
          <button onClick={() => navigate('/user/requests')} className="btn btn-outline-custom">
            <i className="bi bi-arrow-left me-1"></i> Back to List
          </button>

          {isCancellable && (
            <button
              onClick={handleCancelRequest}
              disabled={cancelling}
              className="btn btn-outline-danger"
            >
              {cancelling ? (
                <span className="spinner-border spinner-border-sm me-1"></span>
              ) : (
                <i className="bi bi-x-circle me-1"></i>
              )}
              Cancel Request
            </button>
          )}
        </div>
      </div>

      {/* Smart Disposal Recommendation Banner */}
      <RecommendationCard
        action={request.recommendedAction}
        explanation={request.recommendationExplanation}
        handlingAdvice={request.handlingAdvice}
      />

      <div className="row g-4">
        {/* Left Column: Request Details & Items */}
        <div className="col-lg-8">
          <div className="glass-card mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="text-white font-weight-bold m-0 d-flex align-items-center gap-2">
                <i className="bi bi-cpu text-success"></i> E-Waste Items Breakdown
              </h5>
              <span className={`badge-status badge-status-${request.status}`}>
                {formatStatus(request.status)}
              </span>
            </div>

            {firstItem ? (
              <div className="row g-4">
                {firstItem.imageUrl && (
                  <div className="col-md-4">
                    <div className="p-2 bg-dark rounded-3 border border-secondary text-center">
                      <img
                        src={firstItem.imageUrl}
                        alt="E-Waste Device"
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                        className="rounded-2"
                      />
                      <span className="extra-small text-muted d-block mt-2">Uploaded Device Photo</span>
                    </div>
                  </div>
                )}

                <div className={firstItem.imageUrl ? 'col-md-8' : 'col-12'}>
                  <div className="bg-dark bg-opacity-40 p-3 rounded-4 border border-secondary border-opacity-25 mb-3">
                    <h4 className="text-white font-weight-bold mb-1">
                      {firstItem.deviceName || firstItem.category}
                    </h4>
                    <span className="badge bg-secondary text-white me-2">{firstItem.category}</span>
                    <span className="text-muted small">Brand: {firstItem.brand || 'N/A'}</span>
                  </div>

                  <div className="row g-3">
                    <div className="col-6 col-sm-4">
                      <span className="text-muted extra-small d-block">Condition</span>
                      <span className="text-white font-weight-semibold">{firstItem.condition}</span>
                    </div>

                    <div className="col-6 col-sm-4">
                      <span className="text-muted extra-small d-block">Quantity</span>
                      <span className="text-white font-weight-semibold">{firstItem.quantity || 1} Unit(s)</span>
                    </div>

                    <div className="col-6 col-sm-4">
                      <span className="text-muted extra-small d-block">Approx. Age</span>
                      <span className="text-white font-weight-semibold">
                        {firstItem.approxAgeYears ? `${firstItem.approxAgeYears} Year(s)` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted m-0">No item details registered.</p>
            )}
          </div>

          {/* Status Timeline Card */}
          <div className="glass-card mb-4">
            <h5 className="text-white font-weight-bold mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-signpost-split-fill text-info"></i> Live Doorstep &amp; Recycling Timeline
            </h5>

            <div className="position-relative ps-4 border-start border-secondary border-opacity-50 ms-3">
              {timelineStages.map((stage, idx) => {
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
                            IN PROGRESS
                          </span>
                        )}
                      </div>
                      <p className="text-muted extra-small m-0 mt-1">
                        {idx === 0 && 'Request created and submitted by citizen.'}
                        {idx === 1 && (pickup ? `Scheduled for ${new Date(pickup.scheduledDate).toLocaleDateString()} (${pickup.timeSlot})` : 'Awaiting user doorstep scheduling.')}
                        {idx === 2 && (pickup?.collectorName ? `Assigned to collector: ${pickup.collectorName}` : 'Admin matching field collector.')}
                        {idx === 3 && 'Collector is en route to doorstep pickup address.'}
                        {idx === 4 && (pickup?.actualPickupDate ? `Collected on ${new Date(pickup.actualPickupDate).toLocaleString()}` : 'Items picked up and verified.')}
                        {idx === 5 && 'Delivered to eco-certified recycling facility.'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Doorstep Pickup Management */}
        <div className="col-lg-4">
          <div className="glass-card mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="text-white font-weight-bold m-0 d-flex align-items-center gap-2">
                <i className="bi bi-truck text-warning"></i> Doorstep Pickup Info
              </h5>
              {!pickup && request.status !== 'CANCELLED' && (
                <button
                  onClick={() => setShowScheduleForm(!showScheduleForm)}
                  className="btn btn-success btn-sm font-weight-bold"
                >
                  <i className="bi bi-calendar-plus me-1"></i> {showScheduleForm ? 'Close' : 'Request Pickup'}
                </button>
              )}
            </div>

            {/* Schedule Form Modal/Accordion */}
            {showScheduleForm && (
              <form onSubmit={handleSchedulePickupSubmit} className="p-3 bg-dark rounded-3 border border-success mb-3">
                <h6 className="text-success font-weight-bold mb-3">Schedule Doorstep Pickup</h6>
                {formError && <div className="alert alert-danger p-2 extra-small mb-3">{formError}</div>}

                <div className="mb-2">
                  <label className="text-muted extra-small d-block mb-1">Pickup Address</label>
                  <input
                    type="text"
                    className="form-control form-control-sm bg-dark text-white border-secondary"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="text-muted extra-small d-block mb-1">Preferred Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm bg-dark text-white border-secondary"
                    value={preferredDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="text-muted extra-small d-block mb-1">Preferred Time Slot</label>
                  <select
                    className="form-select form-select-sm bg-dark text-white border-secondary"
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                  >
                    <option value="MORNING">🌅 Morning (8 AM - 12 PM)</option>
                    <option value="AFTERNOON">☀️ Afternoon (12 PM - 4 PM)</option>
                    <option value="EVENING">🌆 Evening (4 PM - 8 PM)</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="text-muted extra-small d-block mb-1">Contact Phone Number (10 Digits)</label>
                  <input
                    type="tel"
                    className="form-control form-control-sm bg-dark text-white border-secondary"
                    placeholder="e.g. 9876543210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="text-muted extra-small d-block mb-1">Notes / Instructions</label>
                  <textarea
                    rows="2"
                    className="form-control form-control-sm bg-dark text-white border-secondary"
                    placeholder="e.g. Ring bell on 2nd floor"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={scheduling}
                  className="btn btn-success btn-sm w-100 text-white font-weight-bold"
                >
                  {scheduling ? <span className="spinner-border spinner-border-sm"></span> : 'Confirm Doorstep Pickup'}
                </button>
              </form>
            )}

            {pickup ? (
              <div className="p-3 bg-dark bg-opacity-60 rounded-3 border border-secondary">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted extra-small">Pickup Status</span>
                  <span className="badge bg-success text-white">{pickup.status}</span>
                </div>

                <div className="mb-2">
                  <span className="text-muted extra-small d-block">Scheduled Slot</span>
                  <span className="text-white font-weight-bold">
                    {new Date(pickup.scheduledDate).toLocaleDateString()} ({pickup.timeSlot})
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-muted extra-small d-block">Pickup Address</span>
                  <span className="text-white small">{pickup.pickupAddress}</span>
                </div>

                <div className="mb-2">
                  <span className="text-muted extra-small d-block">Contact Phone</span>
                  <span className="text-info font-weight-bold small">{pickup.contactNumber || 'N/A'}</span>
                </div>

                {pickup.collectorName ? (
                  <div className="mt-3 pt-2 border-top border-secondary">
                    <span className="text-muted extra-small d-block">Assigned Collector</span>
                    <span className="text-success font-weight-bold">
                      <i className="bi bi-person-check me-1"></i>{pickup.collectorName}
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-warning extra-small">
                    <i className="bi bi-hourglass-split me-1"></i>Collector assignment pending admin dispatch.
                  </div>
                )}

                {pickup.verificationCode && (
                  <div className="mt-3 p-2 bg-black rounded border border-secondary text-center">
                    <span className="text-muted extra-small d-block">Verification Code</span>
                    <code className="text-warning font-weight-bold">{pickup.verificationCode}</code>
                  </div>
                )}
              </div>
            ) : !showScheduleForm ? (
              <div className="text-center py-4">
                <i className="bi bi-truck text-muted display-5 d-block mb-2"></i>
                <p className="text-white small mb-2">No Doorstep Pickup Scheduled</p>
                <p className="text-muted extra-small mb-3">
                  Click "Request Pickup" above to set your preferred date, time slot, and contact number.
                </p>
              </div>
            ) : null}
          </div>

          <div className="glass-card">
            <h5 className="text-white font-weight-bold mb-2">Need Help?</h5>
            <p className="text-muted small mb-3">
              Contact our doorstep logistics support for scheduling modifications.
            </p>
            <a href="mailto:support@ewaste.com" className="btn btn-outline-custom w-100 text-decoration-none">
              <i className="bi bi-envelope me-1"></i> Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
