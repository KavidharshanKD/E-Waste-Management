import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orderApi, getApiErrorMessage } from '../api/apiClient';
import { formatCurrency, formatIndianDate } from '../utils/workflowHelpers';
import {
  MARKETPLACE_ORDER_STATUS_MAP,
  MARKETPLACE_PAYMENT_STATUS_MAP,
} from '../utils/enumMappings';
import { isOrderCancellable } from '../utils/orderHelpers';
import OrderStatusTimeline from '../components/marketplace/OrderStatusTimeline';
import MarketplaceLoading from '../components/marketplace/MarketplaceLoading';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  // Cancellation modal & action state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorCode(null);
      const res = await orderApi.getOrderDetail(id);
      setOrder(res.data);
    } catch (err) {
      console.error('Failed to load order detail:', err);
      const status = err.response?.status;
      setErrorCode(status);
      if (status === 403) {
        setError('Access Denied. You are not authorized to view this order.');
      } else if (status === 404) {
        setError('Order Not Found. The requested order does not exist or has been removed.');
      } else {
        setError(getApiErrorMessage(err, 'Unable to load order details. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    try {
      setCancelling(true);
      setCancelError(null);
      const res = await orderApi.cancelOrder(id, cancelReason);
      setOrder(res.data);
      setCancelSuccess('Order successfully cancelled. The reserved physical devices have been released back to available inventory.');
      setShowCancelModal(false);
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setCancelError(getApiErrorMessage(err, 'Unable to cancel this order. It may have already shipped or been delivered.'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-5">
        <MarketplaceLoading message="Retrieving Order &amp; Tracking Details..." />
      </div>
    );
  }

  // Error State: 403 Access Denied or 404 Not Found
  if (error || !order) {
    return (
      <div className="py-5 text-center my-4 border border-secondary border-opacity-15 bg-light p-4 p-md-5">
        <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>
          <i className={errorCode === 403 ? 'bi bi-shield-lock' : 'bi bi-question-circle'}></i>
        </div>
        <h2 className="h4 text-uppercase fw-bold text-dark mb-2">
          {errorCode === 403 ? 'ACCESS RESTRICTED' : errorCode === 404 ? 'ORDER NOT FOUND' : 'ERROR LOADING ORDER'}
        </h2>
        <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '480px', lineHeight: '1.6' }}>
          {error || 'Unable to display requested order.'}
        </p>
        <div className="d-flex justify-content-center gap-2">
          <Link to="/orders" className="btn btn-outline-custom py-2 px-3">
            ← Back to My Orders
          </Link>
          <Link to="/marketplace" className="btn btn-primary-custom py-2 px-3">
            Browse Marketplace ↗
          </Link>
        </div>
      </div>
    );
  }

  const orderStatus = MARKETPLACE_ORDER_STATUS_MAP[order.status] || {
    label: order.status || 'PLACED',
    badgeClass: 'badge bg-warning text-dark',
  };

  const paymentStatus = MARKETPLACE_PAYMENT_STATUS_MAP[order.paymentStatus] || {
    label: order.paymentStatus || 'Payment Pending',
    badgeClass: 'badge bg-warning text-dark',
  };

  // Eligibility: Allowed if PLACED, CONFIRMED, or PROCESSING. Disallowed if SHIPPED, DELIVERED, or CANCELLED.
  const isCancellable = isOrderCancellable(order.status);

  const items = order.items || [];

  return (
    <div className="order-detail-page py-3">
      {/* Breadcrumb Navigation */}
      <nav className="mb-4 pb-2 border-bottom border-secondary border-opacity-15" aria-label="Breadcrumb">
        <ol className="list-inline m-0 small d-flex flex-wrap align-items-center gap-1.5">
          <li className="list-inline-item">
            <Link to="/" className="text-muted text-decoration-none">Home</Link>
          </li>
          <li className="list-inline-item text-muted">/</li>
          <li className="list-inline-item">
            <Link to="/marketplace" className="text-muted text-decoration-none">Marketplace</Link>
          </li>
          <li className="list-inline-item text-muted">/</li>
          <li className="list-inline-item">
            <Link to="/orders" className="text-muted text-decoration-none">Orders</Link>
          </li>
          <li className="list-inline-item text-muted">/</li>
          <li className="list-inline-item text-dark fw-bold text-truncate" style={{ maxWidth: '280px' }} aria-current="page">
            {order.orderNumber || `#${order.id}`}
          </li>
        </ol>
      </nav>

      {/* Cancellation Alerts */}
      {cancelSuccess && (
        <div className="alert alert-success py-2.5 px-3 mb-4 small" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {cancelSuccess}
        </div>
      )}

      {cancelError && (
        <div className="alert alert-danger py-2.5 px-3 mb-4 small" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {cancelError}
        </div>
      )}

      {/* Order Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3 pb-3 mb-4 border-bottom border-dark">
        <div>
          <div className="editorial-tag">ORDER RECORD &amp; CONSIGNMENT STATUS</div>
          <h1 className="display-hero-title m-0" style={{ fontSize: 'clamp(1.7rem, 3.2vw, 2.4rem)' }}>
            ORDER {order.orderNumber || `#${order.id}`}
          </h1>
          <div className="extra-small text-muted mt-1">
            Placed on: <strong>{formatIndianDate(order.placedAt)}</strong>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className={`${orderStatus.badgeClass} fs-6 py-1.5 px-3`}>
            Status: {orderStatus.label}
          </span>
          <span className={`${paymentStatus.badgeClass} fs-6 py-1.5 px-3`}>
            {paymentStatus.label}
          </span>
        </div>
      </div>

      {/* 1. ORDER LIFECYCLE TIMELINE TRACKER */}
      <OrderStatusTimeline order={order} />

      {/* 2. HONEST PAYMENT STATE DISCLOSURE */}
      <div className="p-3 bg-light border border-warning border-opacity-60 mb-4 small text-secondary">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-info-circle-fill text-warning"></i>
            <span className="fw-bold text-dark text-uppercase extra-small">
              Honest Payment Status — SOLD ≠ PAID
            </span>
          </div>
          <span className="badge bg-secondary text-white extra-small">
            Method: {order.paymentMethod || 'DEMO_CHECKOUT'}
          </span>
        </div>
        <p className="extra-small m-0 text-muted" style={{ lineHeight: '1.5' }}>
          The backend records payment status as <strong>{paymentStatus.label}</strong> because no third-party payment gateway is integrated. Placing the order secures the hardware unit; please do not make external unverified payments.
        </p>
      </div>

      <div className="row g-4 g-lg-5">
        {/* Left Column: Purchased Items */}
        <div className="col-12 col-lg-7">
          <div className="p-3.5 border border-secondary border-opacity-15 bg-white mb-4">
            <h2 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
              PURCHASED PHYSICAL HARDWARE ({items.length})
            </h2>

            <div className="d-flex flex-column gap-3">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 bg-light border border-secondary border-opacity-15"
                >
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                    <div className="fw-bold text-dark fs-6">
                      {item.titleSnapshot || `Refurbished Device #${item.listingId}`}
                    </div>
                    <div className="fw-bold text-dark fs-6 text-nowrap">
                      {formatCurrency(item.priceAtPurchase)}
                    </div>
                  </div>

                  <div className="extra-small text-muted d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-light text-dark border border-secondary border-opacity-25 px-2 py-0.5">
                      Qty: 1
                    </span>
                    <span>Unique Serialized Physical Unit</span>
                    {item.warrantyDaysSnapshot ? (
                      <span>• {item.warrantyDaysSnapshot} Days Facility Warranty</span>
                    ) : null}
                  </div>

                  {item.listingId && (
                    <div className="pt-2 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                      <span className="extra-small text-muted">Catalogue Ref #{item.listingId}</span>
                      <Link
                        to={`/marketplace/${item.listingId}`}
                        className="extra-small fw-bold text-dark text-decoration-underline"
                      >
                        View Original Catalogue Spec ↗
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation Control Section */}
          <div className="p-3.5 border border-secondary border-opacity-15 bg-white">
            <h2 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
              ORDER CANCELLATION
            </h2>

            {order.status === 'CANCELLED' ? (
              <div className="text-muted extra-small">
                This order has already been cancelled. Physical units were released back to available inventory.
              </div>
            ) : isCancellable ? (
              <div>
                <p className="extra-small text-secondary mb-3">
                  You may cancel this order while it is in <strong>{orderStatus.label}</strong> status. Once cancelled, reserved devices will be unlocked for other circular marketplace buyers.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm py-1.5 px-3"
                  onClick={() => {
                    setCancelError(null);
                    setShowCancelModal(true);
                  }}
                  aria-label="Request order cancellation"
                >
                  <i className="bi bi-x-circle me-1"></i> Cancel Order
                </button>
              </div>
            ) : (
              <div className="text-muted extra-small">
                Cancellation is no longer available because this consignment has reached <strong>{orderStatus.label}</strong> status.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Delivery Address & Cost Summary */}
        <div className="col-12 col-lg-5">
          {/* Delivery Address Card */}
          <div className="p-3.5 border border-secondary border-opacity-15 bg-white mb-4">
            <h2 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
              DELIVERY RECIPIENT
            </h2>

            <div className="small text-secondary">
              <div className="fw-bold text-dark fs-6 mb-1">
                {order.recipientName || 'Name not provided'}
              </div>
              <div className="mb-2">
                <i className="bi bi-telephone me-1.5 text-muted"></i>
                {order.phoneNumber || 'N/A'}
              </div>
              <div className="p-2.5 bg-light border border-secondary border-opacity-15">
                <div className="fw-bold text-dark extra-small text-uppercase mb-1">Premises Address</div>
                <div>{order.addressLine}</div>
                <div>
                  {[order.city, order.state].filter(Boolean).join(', ')} {order.postalCode}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-3.5 border border-dark bg-white">
            <h2 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
              ORDER TOTALS
            </h2>

            <div className="d-flex justify-content-between small text-secondary mb-2">
              <span>Subtotal:</span>
              <span className="fw-bold text-dark">{formatCurrency(order.subtotal)}</span>
            </div>

            <div className="d-flex justify-content-between small text-secondary mb-2">
              <span>Circular Transit Delivery:</span>
              <span className="text-emerald fw-bold">Free (Circular Demo)</span>
            </div>

            <div className="thin-rule my-3"></div>

            <div className="d-flex justify-content-between align-items-baseline mb-4">
              <span className="fw-bold text-dark text-uppercase small">Total Amount:</span>
              <span className="h4 fw-bold text-dark m-0">
                {formatCurrency(order.totalAmount || order.subtotal)}
              </span>
            </div>

            <div className="d-grid gap-2">
              <Link to="/orders" className="btn btn-outline-custom btn-sm py-2 text-center">
                ← Back to My Orders
              </Link>
              <Link to="/marketplace" className="btn btn-primary-custom btn-sm py-2 text-center">
                Continue Shopping ↗
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancelOrderTitle"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border border-dark rounded-0 p-3">
              <div className="modal-header border-bottom border-dark pb-2">
                <h5 className="modal-title h6 text-uppercase fw-bold text-dark" id="cancelOrderTitle">
                  Cancel Order Confirmation
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCancelModal(false)}
                  aria-label="Close dialog"
                ></button>
              </div>

              <form onSubmit={handleCancelOrder}>
                <div className="modal-body py-3 small text-secondary">
                  <p>
                    Are you sure you want to cancel order <strong>{order.orderNumber || `#${order.id}`}</strong>?
                  </p>
                  <p className="extra-small text-muted mb-3">
                    Cancelling this order will release the reserved physical devices back to the marketplace for other buyers.
                  </p>

                  <div>
                    <label htmlFor="cancelReasonInput" className="form-label extra-small text-uppercase fw-bold text-dark mb-1">
                      Reason for Cancellation
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-0 border-secondary"
                      id="cancelReasonInput"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="e.g. Changed requirement or ordered by error"
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-top border-secondary border-opacity-15 pt-2 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-1.5 px-3"
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                  >
                    Keep Order
                  </button>
                  <button
                    type="submit"
                    className="btn btn-outline-danger btn-sm py-1.5 px-3"
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Cancelling...
                      </>
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
