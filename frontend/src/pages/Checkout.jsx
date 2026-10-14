import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderApi, paymentApi, userProfileApi, getApiErrorMessage } from '../api/apiClient';
import { formatCurrency } from '../utils/workflowHelpers';
import {
  COSMETIC_GRADE_MAP,
  MARKETPLACE_ORDER_STATUS_MAP,
  MARKETPLACE_PAYMENT_STATUS_MAP,
  EWASTE_CATEGORY_MAP,
  getEnumLabel,
} from '../utils/enumMappings';
import MarketplaceLoading from '../components/marketplace/MarketplaceLoading';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [concurrencyError, setConcurrencyError] = useState(false);

  // Success state holds the placed OrderDetailDTO
  const [placedOrder, setPlacedOrder] = useState(null);

  // Modal state for sandbox payment simulation when live keys aren't set
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState(null);
  const [sandboxTab, setSandboxTab] = useState('UPI');
  const [testCardNumber, setTestCardNumber] = useState('4111 1111 1111 1111');
  const [testCardExpiry, setTestCardExpiry] = useState('12/30');
  const [testCardCvv, setTestCardCvv] = useState('123');

  // Fetch payment configuration on mount
  useEffect(() => {
    let isMounted = true;
    paymentApi.getConfig()
      .then((res) => {
        if (isMounted) setPaymentConfig(res.data);
      })
      .catch((err) => {
        console.warn('Payment config fetch notice:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Trigger Razorpay payment for a given order
  const triggerRazorpayPayment = async (order) => {
    try {
      setProcessingPayment(true);
      const initRes = await paymentApi.initiatePayment(order.id);
      const orderPaymentData = initRes.data;

      // Check if live/real Razorpay key is configured
      if (paymentConfig?.liveKeyConfigured && !orderPaymentData.sandboxMode) {
        const scriptLoaded = await loadRazorpayScript();
        if (scriptLoaded && window.Razorpay) {
          const options = {
            key: orderPaymentData.keyId,
            amount: orderPaymentData.amountInPaisa,
            currency: orderPaymentData.currency || 'INR',
            name: 'EcoCycle Circular Marketplace',
            description: `Payment for Order #${orderPaymentData.orderNumber || order.id}`,
            order_id: orderPaymentData.razorpayOrderId,
            prefill: {
              name: order.recipientName || formData.recipientName,
              contact: order.phoneNumber || formData.phoneNumber,
              email: user?.email || '',
            },
            theme: { color: '#1b4332' },
            handler: async function (response) {
              try {
                const verifyRes = await paymentApi.verifyPayment(order.id, {
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                });
                setPlacedOrder(verifyRes.data);
                await refreshCart();
              } catch (verifyErr) {
                console.error('Payment verification error:', verifyErr);
                setErrorMessage(getApiErrorMessage(verifyErr, 'Payment verification failed.'));
                setPlacedOrder(order);
                await refreshCart();
              } finally {
                setProcessingPayment(false);
              }
            },
            modal: {
              ondismiss: function () {
                setPlacedOrder(order);
                refreshCart();
                setProcessingPayment(false);
              },
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          return;
        }
      }

      // If in sandbox mode or live keys are not configured yet, show the interactive sandbox simulator
      setPendingPaymentOrder({
        order,
        paymentData: orderPaymentData,
      });
      setProcessingPayment(false);
    } catch (err) {
      console.error('Razorpay initiation error:', err);
      setErrorMessage(getApiErrorMessage(err, 'Failed to connect to Razorpay payment gateway.'));
      setPlacedOrder(order);
      await refreshCart();
      setProcessingPayment(false);
    }
  };

  // Complete simulated sandbox payment
  const handleCompleteSandboxPayment = async () => {
    if (!pendingPaymentOrder) return;
    try {
      setProcessingPayment(true);
      const simPaymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 11).toUpperCase();
      const verifyRes = await paymentApi.verifyPayment(pendingPaymentOrder.order.id, {
        razorpayPaymentId: simPaymentId,
        razorpayOrderId: pendingPaymentOrder.paymentData.razorpayOrderId,
        razorpaySignature: 'sandbox_verified_signature',
      });
      setPlacedOrder(verifyRes.data);
      setPendingPaymentOrder(null);
      await refreshCart();
    } catch (err) {
      console.error('Sandbox verification failed:', err);
      setErrorMessage(getApiErrorMessage(err, 'Failed to complete sandbox payment verification.'));
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSkipSandboxPayment = () => {
    if (pendingPaymentOrder) {
      setPlacedOrder(pendingPaymentOrder.order);
      setPendingPaymentOrder(null);
      refreshCart();
    }
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
      paymentMethod: paymentMethod,
      listingIds: cart.items.map((i) => i.listingId),
    };

    try {
      setSubmitting(true);
      const res = await orderApi.checkout(createOrderDto);
      const newOrder = res.data;

      if (paymentMethod === 'RAZORPAY') {
        // Proceed with Razorpay payment initiation
        await triggerRazorpayPayment(newOrder);
      } else {
        // Offline / Demo checkout
        setPlacedOrder(newOrder);
        await refreshCart();
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      const msg = getApiErrorMessage(err, 'Failed to place order.');

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

  // 1. ORDER CONFIRMATION VIEW
  if (placedOrder) {
    const isPaid = placedOrder.paymentStatus === 'PAID';
    const orderStatus = MARKETPLACE_ORDER_STATUS_MAP[placedOrder.status] || {
      label: placedOrder.status || 'PLACED',
      badgeClass: 'badge bg-warning text-dark',
      description: 'Order placed by customer.',
    };

    const paymentStatus = MARKETPLACE_PAYMENT_STATUS_MAP[placedOrder.paymentStatus] || {
      label: placedOrder.paymentStatus || 'Payment Pending',
      badgeClass: isPaid ? 'badge bg-emerald text-white' : 'badge bg-warning text-dark',
      description: isPaid
        ? 'Payment verified and settled through payment gateway.'
        : 'Payment is pending settlement.',
    };

    return (
      <div className="checkout-success-page py-4">
        {/* Editorial Success Banner */}
        <div className="p-4 p-md-5 border border-dark bg-white mb-4">
          <div className={`editorial-tag ${isPaid ? 'text-emerald' : 'text-warning'}`}>
            <i className={`bi ${isPaid ? 'bi-patch-check-fill' : 'bi-clock-history'} me-1`}></i>
            {isPaid ? 'PAYMENT VERIFIED & ORDER CONFIRMED' : 'ORDER RESERVATION CONFIRMED'}
          </div>

          <h1 className="display-hero-title mb-2" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)' }}>
            ORDER #{placedOrder.orderNumber || placedOrder.id}
          </h1>

          <p className="text-secondary small mb-4" style={{ maxWidth: '620px', lineHeight: '1.6' }}>
            {isPaid
              ? 'Your transaction has been securely processed via Razorpay. Physical serialized units have been permanently assigned and queued for facility packaging.'
              : 'Your refurbished hardware reservation has been recorded in the central e-waste facility registry. Physical serialized units have been atomically assigned to this order.'}
          </p>

          {/* PAYMENT AUDIT SECTION */}
          <div className={`p-3 border mb-4 ${isPaid ? 'bg-success bg-opacity-10 border-success' : 'bg-light border-warning border-opacity-50'}`}>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark text-uppercase small">Payment Status:</span>
                <span className={paymentStatus.badgeClass}>
                  {paymentStatus.label}
                </span>
              </div>
              <div className="extra-small text-muted">
                Transaction Mode: <strong>{placedOrder.paymentMethod || 'RAZORPAY'}</strong>
              </div>
            </div>

            {isPaid ? (
              <div className="extra-small text-secondary" style={{ lineHeight: '1.6' }}>
                <div><strong>Razorpay Transaction ID:</strong> <code>{placedOrder.paymentTransactionId || 'TXN_VERIFIED'}</code></div>
                {placedOrder.razorpayOrderId && (
                  <div><strong>Razorpay Order ID:</strong> <code>{placedOrder.razorpayOrderId}</code></div>
                )}
                <div className="text-emerald mt-1">
                  <i className="bi bi-shield-check me-1"></i> Cryptographic HMAC-SHA256 signature verified. Official payment settlement recorded.
                </div>
              </div>
            ) : (
              <div>
                <p className="extra-small m-0 text-secondary mb-2" style={{ lineHeight: '1.5' }}>
                  <strong>Notice:</strong> The order status is recorded as <strong>{orderStatus.label}</strong>, and payment status is <strong>{paymentStatus.label}</strong>.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm py-1 px-3 extra-small"
                  onClick={() => triggerRazorpayPayment(placedOrder)}
                  disabled={processingPayment}
                >
                  <i className="bi bi-credit-card-2-front me-1"></i> Pay Now via Razorpay Secure Gateway
                </button>
              </div>
            )}
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
        <div className="editorial-tag">ATOMIC DEVICE ALLOCATION &amp; SECURE CHECKOUT</div>
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

          {/* Section 2: Payment Method Selection */}
          <div className="p-3.5 border border-secondary border-opacity-15 bg-white">
            <h2 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
              2. PAYMENT METHOD &amp; GATEWAY
            </h2>

            <div className="d-flex flex-column gap-3">
              {/* Option 1: Razorpay Payment Gateway */}
              <label
                className={`p-3 border cursor-pointer d-flex align-items-start gap-3 transition-all ${
                  paymentMethod === 'RAZORPAY' ? 'border-dark bg-white shadow-sm' : 'border-secondary border-opacity-25 bg-light'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="RAZORPAY"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                    <span className="fw-bold text-dark">
                      Razorpay Secure Checkout (UPI, Cards, NetBanking, Wallets)
                    </span>
                    <span className="badge bg-emerald text-white extra-small">
                      Recommended
                    </span>
                  </div>
                  <p className="extra-small text-secondary mb-2" style={{ lineHeight: '1.5' }}>
                    Pay securely in Indian Rupees (INR) with end-to-end 256-bit SSL encryption. Supports Google Pay, PhonePe, Paytm, Visa, Mastercard, RuPay &amp; NetBanking.
                  </p>
                  <div className="d-flex align-items-center gap-2 flex-wrap extra-small text-muted border-top border-secondary border-opacity-15 pt-2">
                    <span className="badge bg-light text-dark border">
                      <i className="bi bi-shield-lock-fill text-success me-1"></i> Razorpay Standard
                    </span>
                    <span className="badge bg-light text-dark border">
                      {paymentConfig?.sandboxMode ? 'Sandbox / Test Mode Active' : 'Live Gateway Active'}
                    </span>
                    <span>Instant Settlement Verification</span>
                  </div>
                </div>
              </label>

              {/* Option 2: Demo / Offline Reservation */}
              <label
                className={`p-3 border cursor-pointer d-flex align-items-start gap-3 transition-all ${
                  paymentMethod === 'DEMO_CHECKOUT' ? 'border-dark bg-white shadow-sm' : 'border-secondary border-opacity-25 bg-light'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="DEMO_CHECKOUT"
                  checked={paymentMethod === 'DEMO_CHECKOUT'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1"
                />
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                    <span className="fw-bold text-dark">
                      Reserve Equipment (Pay at Facility / Demo Allocation)
                    </span>
                    <span className="badge bg-secondary text-white extra-small">
                      Offline Mode
                    </span>
                  </div>
                  <p className="extra-small text-secondary m-0" style={{ lineHeight: '1.5' }}>
                    Secures the serialized device without immediate payment. The order is placed with payment status <strong>PENDING</strong> for facility verification.
                  </p>
                </div>
              </label>
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
                disabled={submitting || processingPayment || items.length === 0}
                aria-label="Confirm and Place Order"
              >
                {submitting || processingPayment ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {processingPayment ? 'Connecting to Payment Gateway...' : 'Locking Inventory & Placing Order...'}
                  </>
                ) : paymentMethod === 'RAZORPAY' ? (
                  <>
                    <i className="bi bi-shield-check me-2"></i> Pay {formatCurrency(subtotal)} via Razorpay ↗
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

      {/* Razorpay Realistic Dummy Sandbox Checkout Modal */}
      {pendingPaymentOrder && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(12, 35, 64, 0.75)', zIndex: 1060, backdropFilter: 'blur(3px)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-0 border-0 shadow-lg overflow-hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>
              {/* Razorpay Signature Branded Header */}
              <div
                className="p-3.5 d-flex justify-content-between align-items-center text-white"
                style={{ backgroundColor: '#0c2340', borderBottom: '3px solid #0284c7' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                    style={{ width: '42px', height: '42px', backgroundColor: '#0284c7', fontSize: '1.2rem' }}
                  >
                    ₹
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold fs-6">EcoCycle Refurbished Marketplace</span>
                      <span className="badge bg-primary text-white" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                        TEST MODE (DUMMY GATEWAY)
                      </span>
                    </div>
                    <div className="extra-small text-light text-opacity-75">
                      Order #{pendingPaymentOrder.order.orderNumber || pendingPaymentOrder.order.id} • Secured by Razorpay
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="text-end">
                    <div className="extra-small text-light text-opacity-75 text-uppercase">Payable Amount</div>
                    <div className="fw-bold fs-5 text-white">
                      {formatCurrency(pendingPaymentOrder.order.totalAmount || pendingPaymentOrder.order.subtotal)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light border-0 rounded-circle"
                    onClick={handleSkipSandboxPayment}
                    style={{ fontSize: '1.2rem', lineHeight: '1', padding: '4px 8px' }}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="py-1.5 px-3 bg-light border-bottom border-secondary border-opacity-15 d-flex justify-content-between align-items-center flex-wrap gap-2 extra-small text-muted">
                <div>
                  <i className="bi bi-shield-check text-success me-1"></i>
                  <strong>Dummy Sandbox Active:</strong> No PAN card or real banking credentials required. You can test payment right here!
                </div>
                <div>
                  Gateway Order ID: <code>{pendingPaymentOrder.paymentData.razorpayOrderId}</code>
                </div>
              </div>

              {/* Modal Body with Left Tabs and Right Content */}
              <div className="modal-body p-0">
                <div className="row g-0">
                  {/* Left Column: Payment Methods List */}
                  <div className="col-12 col-md-4 border-end border-secondary border-opacity-15 bg-light p-2">
                    <div className="d-flex flex-column gap-1">
                      <button
                        type="button"
                        className={`btn text-start p-2.5 rounded-0 border-0 d-flex align-items-center gap-2 small ${
                          sandboxTab === 'UPI' ? 'bg-white fw-bold shadow-sm border-start border-4 border-primary' : 'text-secondary'
                        }`}
                        onClick={() => setSandboxTab('UPI')}
                      >
                        <i className="bi bi-qr-code text-primary fs-5"></i>
                        <div>
                          <div>UPI / QR Code</div>
                          <div className="extra-small text-muted">GPay, PhonePe, Paytm, BHIM</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`btn text-start p-2.5 rounded-0 border-0 d-flex align-items-center gap-2 small ${
                          sandboxTab === 'CARD' ? 'bg-white fw-bold shadow-sm border-start border-4 border-primary' : 'text-secondary'
                        }`}
                        onClick={() => setSandboxTab('CARD')}
                      >
                        <i className="bi bi-credit-card-2-front text-primary fs-5"></i>
                        <div>
                          <div>Cards</div>
                          <div className="extra-small text-muted">Visa, MasterCard, RuPay</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`btn text-start p-2.5 rounded-0 border-0 d-flex align-items-center gap-2 small ${
                          sandboxTab === 'NETBANKING' ? 'bg-white fw-bold shadow-sm border-start border-4 border-primary' : 'text-secondary'
                        }`}
                        onClick={() => setSandboxTab('NETBANKING')}
                      >
                        <i className="bi bi-bank text-primary fs-5"></i>
                        <div>
                          <div>NetBanking</div>
                          <div className="extra-small text-muted">SBI, HDFC, ICICI, Axis</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Active Payment Method Form */}
                  <div className="col-12 col-md-8 p-4 bg-white">
                    {sandboxTab === 'UPI' && (
                      <div className="d-flex flex-column align-items-center text-center">
                        <div className="p-3 border rounded bg-light mb-3 text-center" style={{ width: '180px', height: '180px' }}>
                          <i className="bi bi-qr-code text-dark" style={{ fontSize: '7rem', lineHeight: '1' }}></i>
                        </div>
                        <div className="small fw-bold text-dark mb-1">Scan QR with any UPI App</div>
                        <div className="extra-small text-muted mb-3">Google Pay • PhonePe • Paytm • Any Bank UPI App</div>
                        <div className="p-2 bg-light border border-secondary border-opacity-25 rounded w-100 mb-3 extra-small text-muted text-start">
                          <i className="bi bi-info-circle text-primary me-1"></i>
                          In dummy mode, clicking <strong>Confirm &amp; Pay</strong> below will instantly simulate an authorized UPI approval from NPCI/Bank.
                        </div>
                      </div>
                    )}

                    {sandboxTab === 'CARD' && (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="small fw-bold text-dark">Enter Card Details (Test Simulator)</span>
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm py-0.5 px-2 extra-small"
                            onClick={() => {
                              setTestCardNumber('4111 1111 1111 1111');
                              setTestCardExpiry('12/30');
                              setTestCardCvv('123');
                            }}
                          >
                            Fill Test Card
                          </button>
                        </div>

                        <div className="row g-2 mb-3">
                          <div className="col-12">
                            <label className="form-label extra-small text-muted mb-1">Card Number</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={testCardNumber}
                              onChange={(e) => setTestCardNumber(e.target.value)}
                              placeholder="4111 1111 1111 1111"
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label extra-small text-muted mb-1">Valid Thru (MM/YY)</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={testCardExpiry}
                              onChange={(e) => setTestCardExpiry(e.target.value)}
                              placeholder="12/30"
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label extra-small text-muted mb-1">CVV</label>
                            <input
                              type="password"
                              className="form-control form-control-sm"
                              value={testCardCvv}
                              onChange={(e) => setTestCardCvv(e.target.value)}
                              placeholder="123"
                              maxLength="4"
                            />
                          </div>
                        </div>

                        <div className="p-2 bg-light border border-secondary border-opacity-25 rounded extra-small text-muted">
                          <i className="bi bi-shield-lock-fill text-success me-1"></i>
                          Standard Razorpay sandbox test card credentials are supported. No real money or bank accounts are accessed.
                        </div>
                      </div>
                    )}

                    {sandboxTab === 'NETBANKING' && (
                      <div>
                        <div className="small fw-bold text-dark mb-2">Select Popular Bank (Test Simulator)</div>
                        <div className="row g-2 mb-3">
                          {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'].map((bank) => (
                            <div key={bank} className="col-6">
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm w-100 p-2 text-start text-dark extra-small border-secondary border-opacity-25"
                                onClick={() => handleCompleteSandboxPayment()}
                              >
                                <i className="bi bi-building me-1.5 text-primary"></i>
                                {bank}
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="extra-small text-muted">
                          Select any bank to simulate an instant authorized netbanking gateway response.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer with Primary Razorpay Green Pay Button */}
              <div className="p-3 bg-light border-top border-secondary border-opacity-15 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm py-1.5 px-3"
                  onClick={handleSkipSandboxPayment}
                  disabled={processingPayment}
                >
                  Cancel / Pay Later
                </button>

                <button
                  type="button"
                  className="btn btn-success py-2 px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                  style={{ backgroundColor: '#10b981', borderColor: '#059669' }}
                  onClick={handleCompleteSandboxPayment}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Verifying Payment...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lock-fill"></i>
                      Pay {formatCurrency(pendingPaymentOrder.order.totalAmount || pendingPaymentOrder.order.subtotal)} ✓
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
