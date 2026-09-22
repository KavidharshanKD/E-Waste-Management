import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderApi, userProfileApi, getApiErrorMessage } from '../api/apiClient';
import { formatCurrency } from '../utils/workflowHelpers';
import {
  COSMETIC_GRADE_MAP,
  MARKETPLACE_ORDER_STATUS_MAP,
  MARKETPLACE_PAYMENT_STATUS_MAP,
  EWASTE_CATEGORY_MAP,
  getEnumLabel,
} from '../utils/enumMappings';
import MarketplaceLoading from '../components/marketplace/MarketplaceLoading';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, itemCount, subtotal, loading: cartLoading, refreshCart } = useCart();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    recipientName: '',
    phoneNumber: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [concurrencyError, setConcurrencyError] = useState(false);

  // Success state holds the placed OrderDetailDTO
  const [placedOrder, setPlacedOrder] = useState(null);

  // Prefill address from existing profile API if available
  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      try {
        const res = await userProfileApi.getProfile();
        if (isMounted && res.data) {
          const profile = res.data;
          const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
          setFormData({
            recipientName: fullName || user?.name || '',
            phoneNumber: profile.phoneNumber || '',
            addressLine: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            postalCode: profile.postalCode || '',
          });
        }
      } catch (err) {
        // Fallback to basic user context if profile endpoint is empty or not yet filled
        if (isMounted) {
          setFormData((prev) => ({
            ...prev,
            recipientName: prev.recipientName || user?.name || '',
          }));
        }
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.recipientName?.trim()) return 'Recipient name is required';
    if (!formData.phoneNumber?.trim()) return 'Phone number is required';
    if (!formData.addressLine?.trim()) return 'Delivery address is required';
    if (!formData.city?.trim()) return 'City is required';
    if (!formData.state?.trim()) return 'State is required';
    if (!formData.postalCode?.trim()) return 'Postal code is required';
    return null;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setConcurrencyError(false);

    const validationErr = validateForm();
    if (validationErr) {
      setErrorMessage(validationErr);
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      setErrorMessage('Your cart is empty. Please add refurbished devices to place an order.');
      return;
    }

    const createOrderDto = {
      recipientName: formData.recipientName.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      addressLine: formData.addressLine.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postalCode: formData.postalCode.trim(),
      paymentMethod: 'DEMO_CHECKOUT',
      listingIds: cart.items.map((i) => i.listingId),
    };

    try {
      setSubmitting(true);
      const res = await orderApi.checkout(createOrderDto);
      setPlacedOrder(res.data);
      // Synchronize cart state so header count and cart page update immediately
      await refreshCart();
    } catch (err) {
      console.error('Checkout failed:', err);
      const msg = getApiErrorMessage(err, 'Failed to place order.');

      // Detect stock/concurrency collision (e.g. item no longer AVAILABLE or already RESERVED)
      if (
        msg.toLowerCase().includes('not in published') ||
        msg.toLowerCase().includes('unavailable') ||
        msg.toLowerCase().includes('reserved') ||
        msg.toLowerCase().includes('sold') ||
        err.response?.status === 409
      ) {
        setConcurrencyError(true);
        setErrorMessage(
          'This refurbished device is no longer available because another customer has reserved or purchased it. Your cart has been updated.'
        );
        refreshCart();
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 1. ORDER CONFIRMATION VIEW (HONEST PAYMENT STATE PRESENTATION)
  if (placedOrder) {
    const orderStatus = MARKETPLACE_ORDER_STATUS_MAP[placedOrder.status] || {
      label: placedOrder.status || 'PLACED',
      badgeClass: 'badge bg-warning text-dark',
      description: 'Order placed by customer.',
    };

    const paymentStatus = MARKETPLACE_PAYMENT_STATUS_MAP[placedOrder.paymentStatus] || {
      label: placedOrder.paymentStatus || 'Payment Pending',
      badgeClass: 'badge bg-warning text-dark',
      description: 'Payment is pending. No payment gateway integrated.',
    };

    return (
      <div className="checkout-success-page py-4">
        {/* Editorial Success Banner */}
        <div className="p-4 p-md-5 border border-dark bg-white mb-4">
          <div className="editorial-tag text-emerald">
            <i className="bi bi-patch-check-fill me-1"></i> ORDER RESERVATION CONFIRMED
          </div>

          <h1 className="display-hero-title mb-2" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)' }}>
            ORDER #{placedOrder.orderNumber || placedOrder.id}
          </h1>

          <p className="text-secondary small mb-4" style={{ maxWidth: '620px', lineHeight: '1.6' }}>
            Your refurbished hardware reservation has been recorded in the central e-waste facility registry. Physical serialized units have been atomically assigned to this order.
          </p>

          {/* CRITICAL HONEST PAYMENT STATE SECTION */}
          <div className="p-3 bg-light border border-warning border-opacity-50 mb-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark text-uppercase small">Payment Status:</span>
                <span className={paymentStatus.badgeClass}>
                  {paymentStatus.label}
                </span>
              </div>
              <div className="extra-small text-muted">
                Transaction Mode: {placedOrder.paymentMethod || 'DEMO_CHECKOUT'}
              </div>
            </div>

            <p className="extra-small m-0 text-secondary" style={{ lineHeight: '1.5' }}>
              <strong>Notice:</strong> Payment processing is not currently integrated into this platform. 
              The order status is recorded as <strong>{orderStatus.label}</strong>, and payment remains honestly <strong>{paymentStatus.label}</strong>. 
              Do not transfer funds externally unless instructed by an authorized facility representative.
            </p>
          </div>

          {/* Order Details Grid */}
          <div className="row g-4 pt-3 border-top border-secondary border-opacity-15">
            {/* Delivery Snapshot */}
            <div className="col-12 col-md-6">
              <h2 className="h6 text-uppercase fw-bold text-dark mb-2 pb-1 border-bottom border-dark">
                DELIVERY RECIPIENT
              </h2>
              <div className="small text-secondary">
                <div className="fw-bold text-dark">{placedOrder.recipientName}</div>
                <div>{placedOrder.phoneNumber}</div>
                <div className="mt-1">
                  {placedOrder.addressLine}, {placedOrder.city}, {placedOrder.state} {placedOrder.postalCode}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="col-12 col-md-6">
              <h2 className="h6 text-uppercase fw-bold text-dark mb-2 pb-1 border-bottom border-dark">
                ORDER TOTAL
              </h2>
              <div className="d-flex justify-content-between small text-secondary mb-1">
                <span>Subtotal:</span>
                <span className="fw-bold text-dark">{formatCurrency(placedOrder.subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between small text-secondary mb-2">
                <span>Circular Transit Logistics:</span>
                <span className="text-emerald fw-bold">Free (Circular Demo)</span>
              </div>
              <div className="d-flex justify-content-between align-items-baseline pt-2 border-top border-secondary border-opacity-15">
                <span className="fw-bold text-dark text-uppercase small">Total Amount:</span>
                <span className="h5 fw-bold text-dark m-0">
                  {formatCurrency(placedOrder.totalAmount || placedOrder.subtotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Ordered Items List */}
          {placedOrder.items && placedOrder.items.length > 0 && (
            <div className="mt-4 pt-3 border-top border-secondary border-opacity-15">
              <h2 className="h6 text-uppercase fw-bold text-dark mb-3">
                ASSIGNED PHYSICAL UNITS ({placedOrder.items.length})
              </h2>

              <div className="d-flex flex-column gap-2">
                {placedOrder.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-2.5 bg-light border border-secondary border-opacity-15 d-flex justify-content-between align-items-center flex-wrap gap-2 small"
                  >
                    <div>
                      <div className="fw-bold text-dark">{item.listingTitle || item.title || `Device #${item.listingId}`}</div>
                      <div className="extra-small text-muted">
                        Warranty: {item.warrantyDays ? `${item.warrantyDays} Days Facility Warranty` : 'Standard Refurbished Guarantee'} • Unique Serialized Unit
                      </div>
                    </div>
                    <div className="fw-bold text-dark">
                      {formatCurrency(item.unitPrice || item.price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Navigation */}
          <div className="d-flex flex-wrap gap-3 mt-4 pt-3 border-top border-secondary border-opacity-15">
            <Link to={`/orders/${placedOrder.id}`} className="btn btn-primary-custom py-2 px-4">
              View Order &amp; Tracking ↗
            </Link>
            <Link to="/orders" className="btn btn-outline-custom py-2 px-4">
              My Orders
            </Link>
            <Link to="/marketplace" className="btn btn-outline-secondary py-2 px-4">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (cartLoading && !cart) {
    return (
      <div className="py-5">
        <MarketplaceLoading message="Preparing Checkout Environment..." />
      </div>
    );
  }

  const items = cart?.items || [];

  // If cart is empty, redirect or display friendly empty notice
  if (items.length === 0) {
    return (
      <div className="py-5 text-center my-4 border border-secondary border-opacity-15 bg-light p-4 p-md-5">
        <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>
          <i className="bi bi-cart-x"></i>
        </div>
        <h2 className="h4 text-uppercase fw-bold text-dark mb-2">
          NO ITEMS IN CHECKOUT
        </h2>
        <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '440px', lineHeight: '1.6' }}>
          Your cart currently has no items staged for checkout. Browse available refurbished inventory to begin.
        </p>
        <Link to="/marketplace" className="btn btn-primary-custom py-2 px-4">
          Browse Marketplace ↗
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-page py-3">
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
            <Link to="/cart" className="text-muted text-decoration-none">Cart</Link>
          </li>
          <li className="list-inline-item text-muted">/</li>
          <li className="list-inline-item text-dark fw-bold" aria-current="page">
            Checkout
          </li>
        </ol>
      </nav>

      {/* Page Title */}
      <div className="pb-3 mb-4 border-bottom border-dark">
        <div className="editorial-tag">ATOMIC DEVICE ALLOCATION &amp; LOGISTICS</div>
        <h1 className="display-hero-title m-0" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)' }}>
          CHECKOUT
        </h1>
      </div>

      {/* Error Banners */}
      {errorMessage && (
        <div className="alert alert-danger py-2.5 px-3 mb-4 small" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage}
          {concurrencyError && (
            <div className="mt-2">
              <Link to="/cart" className="btn btn-outline-danger btn-sm py-1 px-2.5 extra-small">
                ← Return to Cart to Review Available Items
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Honest Payment State Announcement */}
      <div className="p-3 bg-light border border-warning border-opacity-60 mb-4 small text-secondary">
        <div className="d-flex align-items-center gap-2 mb-1">
          <i className="bi bi-info-circle-fill text-warning"></i>
          <span className="fw-bold text-dark text-uppercase extra-small">
            Honest Payment Policy — SOLD ≠ PAID
          </span>
        </div>
        <p className="extra-small m-0 text-muted" style={{ lineHeight: '1.5' }}>
          This circular platform operates without third-party payment gateway integration. Completing checkout creates an authoritative reservation in <strong>PENDING</strong> payment status. No credit card or UPI details are gathered or stored.
        </p>
      </div>

      <div className="row g-4 g-lg-5">
        {/* Left Column: Delivery Address Form */}
        <div className="col-12 col-lg-7">
          <div className="p-3.5 border border-secondary border-opacity-15 bg-white mb-4">
            <h2 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
              1. DELIVERY ADDRESS
            </h2>

            {loadingProfile ? (
              <div className="py-3 text-muted small">
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Retrieving saved address profile...
              </div>
            ) : (
              <form onSubmit={handleSubmitOrder} id="checkout-form">
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="recipientName" className="form-label extra-small text-uppercase fw-bold text-dark mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-0 border-secondary"
                      id="recipientName"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      placeholder="e.g. Jane Doe"
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-6">
                    <label htmlFor="phoneNumber" className="form-label extra-small text-uppercase fw-bold text-dark mb-1">
                      Contact Phone Number *
                    </label>
                    <input
                      type="tel"
                      className="form-control form-control-sm rounded-0 border-secondary"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 9876543210"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label htmlFor="addressLine" className="form-label extra-small text-uppercase fw-bold text-dark mb-1">
                      Street Address / Premises *
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-0 border-secondary"
                      id="addressLine"
                      name="addressLine"
                      value={formData.addressLine}
                      onChange={handleInputChange}
                      placeholder="Building, street, flat or landmark"
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-4">
                    <label htmlFor="city" className="form-label extra-small text-uppercase fw-bold text-dark mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-0 border-secondary"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Bengaluru"
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-4">
                    <label htmlFor="state" className="form-label extra-small text-uppercase fw-bold text-dark mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-0 border-secondary"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="e.g. Karnataka"
                      required
                    />
                  </div>

                  <div className="col-12 col-sm-4">
                    <label htmlFor="postalCode" className="form-label extra-small text-uppercase fw-bold text-dark mb-1">
                      PIN / Postal Code *
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-0 border-secondary"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="e.g. 560001"
                      required
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Section 2: Payment Disclosure */}
          <div className="p-3.5 border border-secondary border-opacity-15 bg-white">
            <h2 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
              2. PAYMENT STATUS DISCLOSURE
            </h2>

            <div className="p-3 bg-light border border-secondary border-opacity-25 small">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-warning text-dark px-2 py-1">
                  PAYMENT STATE: PENDING
                </span>
                <span className="fw-bold text-dark">Circular Asset Allocation</span>
              </div>
              <p className="extra-small text-secondary mb-2" style={{ lineHeight: '1.5' }}>
                Upon clicking <strong>Place Order</strong>, the system locks this physical equipment to prevent double-allocation. The order will be created with status <code>PLACED</code> and payment status <code>PENDING</code>.
              </p>
              <div className="extra-small text-muted border-top border-secondary border-opacity-15 pt-2">
                • No card credentials or banking access required.<br />
                • Equipment is reserved for facility dispatch verification.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="col-12 col-lg-5">
          <div className="p-3.5 border border-dark bg-white">
            <h2 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
              ORDER SUMMARY ({itemCount})
            </h2>

            <div className="d-flex flex-column gap-2 mb-3 max-h-300 overflow-auto">
              {items.map((item) => {
                const gradeInfo = COSMETIC_GRADE_MAP[item.cosmeticGrade] || {
                  label: item.cosmeticGrade || 'N/A',
                  badgeClass: 'badge bg-secondary text-white',
                };

                return (
                  <div
                    key={item.id || item.listingId}
                    className="p-2 bg-light border border-secondary border-opacity-15 d-flex justify-content-between align-items-center gap-2 small"
                  >
                    <div className="text-truncate" style={{ maxWidth: '68%' }}>
                      <div className="fw-bold text-dark text-truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="extra-small text-muted d-flex align-items-center gap-1.5 mt-0.5">
                        <span className={gradeInfo.badgeClass} style={{ fontSize: '0.62rem' }}>
                          {gradeInfo.label}
                        </span>
                        <span>Qty: 1</span>
                      </div>
                    </div>
                    <div className="fw-bold text-dark text-nowrap">
                      {formatCurrency(item.price)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="d-flex justify-content-between small text-secondary mb-2">
              <span>Subtotal:</span>
              <span className="fw-bold text-dark">{formatCurrency(subtotal)}</span>
            </div>

            <div className="d-flex justify-content-between small text-secondary mb-2">
              <span>Circular Transit Delivery:</span>
              <span className="text-emerald fw-bold">Free (Circular Demo)</span>
            </div>

            <div className="thin-rule my-3"></div>

            <div className="d-flex justify-content-between align-items-baseline mb-4">
              <span className="fw-bold text-dark text-uppercase small">Total Payable:</span>
              <span className="h4 fw-bold text-dark m-0">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="d-grid gap-2 mb-3">
              <button
                type="submit"
                form="checkout-form"
                className="btn btn-primary-custom py-2.5 w-100 justify-content-center fs-6"
                disabled={submitting || items.length === 0}
                aria-label="Confirm and Place Order"
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Locking Inventory &amp; Placing Order...
                  </>
                ) : (
                  <>
                    Place Order (Reserve Device) ↗
                  </>
                )}
              </button>

              <Link
                to="/cart"
                className="btn btn-outline-custom btn-sm py-2 w-100 text-center"
              >
                ← Back to Cart
              </Link>
            </div>

            <div className="extra-small text-muted text-center" style={{ lineHeight: '1.4' }}>
              By placing this order, you confirm reservation of unique physical hardware.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
