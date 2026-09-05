import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function RequestDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchDetails()
  }, [id])

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/user/ewaste/${id}`)
      setRequest(res.data)
    } catch (err) {
      console.error('Failed to fetch request details', err)
      setError(
        err.response?.data?.error || 'Disposal request not found or access denied.'
      )
    } finally {
      setLoading(false)
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
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
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

                    <div className="col-6 col-sm-4">
                      <span className="text-muted extra-small d-block">Working Status</span>
                      <span className="text-white font-weight-semibold">{firstItem.workingStatus || 'N/A'}</span>
                    </div>

                    <div className="col-6 col-sm-4">
                      <span className="text-muted extra-small d-block">Reward Points</span>
                      <span className="text-success font-weight-bold">
                        <i className="bi bi-coin me-1 text-warning"></i> +{firstItem.estimatedRewardPoints || 50}
                      </span>
                    </div>
                  </div>

                  {firstItem.description && (
                    <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
                      <span className="text-muted extra-small d-block">Item Notes &amp; Description</span>
                      <p className="text-white small m-0">{firstItem.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted m-0">No item details registered.</p>
            )}
          </div>

          {/* Status Timeline */}
          <div className="glass-card">
            <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-signpost-split text-info"></i> Recycling Lifecycle Timeline
            </h5>

            <div className="p-3 bg-dark bg-opacity-40 rounded-4 border border-secondary border-opacity-25">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-white font-weight-bold">Current Stage:</span>
                <span className={`badge-status badge-status-${request.status}`}>
                  {formatStatus(request.status)}
                </span>
              </div>

              <div className="text-muted small">
                {request.status === 'SUBMITTED' && 'Request submitted. Awaiting center assignment and logistics review.'}
                {request.status === 'UNDER_REVIEW' && 'Disposal items being verified by recycling center team.'}
                {request.status === 'APPROVED' && 'Request approved! Pickup vehicle dispatch scheduled.'}
                {request.status === 'PICKUP_ASSIGNED' && 'Collector assigned to doorstep pickup.'}
                {request.status === 'COLLECTED' && 'E-waste items collected from your address.'}
                {request.status === 'AT_RECYCLING_CENTER' && 'Items safely arrived at recycling center.'}
                {request.status === 'PROCESSING' && 'Dismantling and hazardous material segregation in progress.'}
                {request.status === 'RECYCLED' && 'Material successfully recycled and carbon credits issued!'}
                {request.status === 'CANCELLED' && 'This disposal request was cancelled.'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pickup Location & Info */}
        <div className="col-lg-4">
          <div className="glass-card mb-4">
            <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-geo-alt-fill text-warning"></i> Pickup Information
            </h5>

            <div className="mb-3">
              <span className="text-muted extra-small d-block mb-1">Fulfillment Mode</span>
              <span className="text-white font-weight-semibold">
                {request.pickupRequired ? '🚚 Doorstep Pickup Requested' : '🏢 Resident Drop-off'}
              </span>
            </div>

            <div className="mb-3">
              <span className="text-muted extra-small d-block mb-1">Pickup Address</span>
              <p className="text-white small mb-1 font-weight-medium">{request.pickupAddress}</p>
              <p className="text-muted small m-0">{request.pickupCity}, {request.pickupState} - {request.pickupPostalCode}</p>
            </div>

            {request.centerName && (
              <div className="p-3 bg-dark bg-opacity-60 rounded-3 border border-secondary mb-3">
                <span className="text-muted extra-small d-block">Assigned Recycling Facility</span>
                <span className="text-info font-weight-bold">{request.centerName}</span>
              </div>
            )}
          </div>

          <div className="glass-card">
            <h5 className="text-white font-weight-bold mb-2">Need Assistance?</h5>
            <p className="text-muted small mb-3">
              If you need to change pickup dates or address, contact our eco-logistics support team.
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
