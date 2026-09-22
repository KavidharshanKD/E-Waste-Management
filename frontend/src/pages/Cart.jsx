import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/workflowHelpers';
import {
  COSMETIC_GRADE_MAP,
  MARKETPLACE_STOCK_STATUS_MAP,
  EWASTE_CATEGORY_MAP,
  getEnumLabel,
} from '../utils/enumMappings';
import MarketplaceLoading from '../components/marketplace/MarketplaceLoading';

export default function Cart() {
  const { cart, itemCount, subtotal, loading, error, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [removingId, setRemovingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionError, setActionError] = useState(null);

  const items = cart?.items || [];
  const hasUnavailableItems = items.some(
    (item) => !item.available || item.stockStatus !== 'AVAILABLE'
  );

  const handleRemove = async (listingId) => {
    try {
      setRemovingId(listingId);
      setActionError(null);
      await removeFromCart(listingId);
    } catch (err) {
      console.error('Failed to remove item:', err);
      setActionError('Could not remove item from cart. Please refresh and try again.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleClear = async () => {
    try {
      setClearing(true);
      setActionError(null);
      await clearCart();
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear cart:', err);
      setActionError('Could not clear cart. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  if (loading && !cart) {
    return (
      <div className="py-5">
        <MarketplaceLoading message="Accessing Circular Cart..." />
      </div>
    );
  }

  return (
    <div className="cart-page py-3">
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
          <li className="list-inline-item text-dark fw-bold" aria-current="page">
            Cart ({itemCount})
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3 pb-3 mb-4 border-bottom border-dark">
        <div>
          <div className="editorial-tag">ORDER STAGING &amp; PHYSICAL UNIT ALLOCATION</div>
          <h1 className="display-hero-title m-0" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)' }}>
            YOUR CART
          </h1>
        </div>
        {items.length > 0 && (
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-1.5 px-3"
              onClick={() => setShowClearConfirm(true)}
              disabled={clearing}
              aria-label="Clear all items from cart"
            >
              <i className="bi bi-trash3 me-1"></i> Clear Cart
            </button>
            <Link to="/marketplace" className="btn btn-outline-custom btn-sm py-1.5 px-3">
              ← Continue Shopping
            </Link>
          </div>
        )}
      </div>

      {/* Action Error Alert */}
      {(actionError || error) && (
        <div className="alert alert-danger py-2 px-3 mb-4 small" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {actionError || error}
        </div>
      )}

      {/* Concurrency / Unavailable Items Warning */}
      {hasUnavailableItems && (
        <div className="alert alert-warning py-2.5 px-3 mb-4 small" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          <strong>Device Availability Update:</strong> One or more items in your cart have been reserved or sold. Please remove unavailable items before proceeding to checkout.
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="py-5 text-center my-4 border border-secondary border-opacity-15 bg-light p-4 p-md-5">
          <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>
            <i className="bi bi-bag-x"></i>
          </div>
          <h2 className="h4 text-uppercase fw-bold text-dark mb-2">
            YOUR CART IS EMPTY
          </h2>
          <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '460px', lineHeight: '1.6' }}>
            Explore refurbished devices that have completed the recovery workflow, passed rigorous multi-point testing, and are ready for second-life ownership.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/marketplace" className="btn btn-primary-custom py-2 px-4">
              Explore Refurbished Marketplace ↗
            </Link>
          </div>
        </div>
      ) : (
        /* Two-Column Cart Layout */
        <div className="row g-4 g-lg-5">
          {/* Left Column: Cart Items List */}
          <div className="col-12 col-lg-8">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-15 text-muted extra-small text-uppercase fw-bold">
              <span>Device Details &amp; Condition</span>
              <span>Price</span>
            </div>

            <div className="d-flex flex-column gap-3">
              {items.map((item) => {
                const gradeInfo = COSMETIC_GRADE_MAP[item.cosmeticGrade] || {
                  label: item.cosmeticGrade || 'N/A',
                  badgeClass: 'badge bg-secondary text-white',
                };
                const isItemAvailable = item.available && item.stockStatus === 'AVAILABLE';
                const isRemoving = removingId === item.listingId;

                return (
                  <div
                    key={item.id || item.listingId}
                    className={`p-3 border ${
                      isItemAvailable
                        ? 'border-secondary border-opacity-15 bg-white'
                        : 'border-danger border-opacity-30 bg-light'
                    }`}
                  >
                    <div className="row g-3 align-items-center">
                      {/* Image Thumbnail */}
                      <div className="col-3 col-sm-2 col-md-2 text-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="img-fluid border border-secondary border-opacity-15"
                            style={{ maxHeight: '80px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="d-flex align-items-center justify-content-center bg-light border border-secondary border-opacity-15 text-muted"
                            style={{ height: '70px', width: '100%' }}
                          >
                            <i className="bi bi-laptop fs-4"></i>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="col-9 col-sm-6 col-md-6">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="extra-small text-uppercase text-muted fw-bold">
                            {getEnumLabel(EWASTE_CATEGORY_MAP, item.category)}
                          </span>
                          <span className={gradeInfo.badgeClass} style={{ fontSize: '0.65rem' }}>
                            {gradeInfo.label}
                          </span>
                        </div>

                        <Link
                          to={`/marketplace/${item.listingId}`}
                          className="h6 text-dark fw-bold text-decoration-none d-block mb-1 text-truncate"
                          title={item.title}
                        >
                          {item.title}
                        </Link>

                        {(item.brand || item.model) && (
                          <div className="extra-small text-muted mb-1">
                            {[item.brand, item.model].filter(Boolean).join(' • ')}
                          </div>
                        )}

                        {/* Unique Device Quantity Constraint */}
                        <div className="extra-small text-secondary d-flex align-items-center gap-2">
                          <span className="badge bg-light text-dark border border-secondary border-opacity-25 px-2 py-0.5">
                            Qty: 1
                          </span>
                          <span className="text-muted">Unique Physical Serialized Unit</span>
                        </div>

                        {/* Availability Warning */}
                        {!isItemAvailable && (
                          <div className="text-danger extra-small fw-bold mt-1 d-flex align-items-center gap-1">
                            <i className="bi bi-exclamation-triangle"></i>
                            Device status: {item.stockStatus || 'UNAVAILABLE'} — No longer available for purchase.
                          </div>
                        )}
                      </div>

                      {/* Price & Action */}
                      <div className="col-12 col-sm-4 col-md-4 text-sm-end d-flex flex-sm-column justify-content-between align-items-end gap-2">
                        <div className="fw-bold fs-6 text-dark">
                          {formatCurrency(item.price)}
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm py-1 px-2.5 extra-small"
                          onClick={() => handleRemove(item.listingId)}
                          disabled={isRemoving}
                          aria-label={`Remove ${item.title} from cart`}
                        >
                          {isRemoving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Removing...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-trash3 me-1"></i> Remove
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Circular Hardware Transparency Note */}
            <div className="p-3 bg-light border border-secondary border-opacity-15 mt-4 small text-secondary">
              <div className="fw-bold text-dark text-uppercase extra-small mb-1">
                <i className="bi bi-shield-check text-emerald me-1"></i> Physical Asset Allocation Policy
              </div>
              <p className="extra-small m-0 text-muted" style={{ lineHeight: '1.5' }}>
                Every device in our refurbished catalogue is an individual, physical equipment piece that completed testing and refurbishment. Devices are not batch commodities; inventory locks atomically upon checkout placement.
              </p>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout CTA */}
          <div className="col-12 col-lg-4">
            <div className="p-3.5 border border-dark bg-white">
              <h2 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
                CART SUMMARY
              </h2>

              <div className="d-flex justify-content-between small text-secondary mb-2">
                <span>Selected Devices:</span>
                <span className="fw-bold text-dark">{itemCount} unit{itemCount === 1 ? '' : 's'}</span>
              </div>

              <div className="d-flex justify-content-between small text-secondary mb-2">
                <span>Circular Transit Delivery:</span>
                <span className="text-emerald fw-bold">Free (Circular Demo)</span>
              </div>

              <div className="thin-rule my-3"></div>

              <div className="d-flex justify-content-between align-items-baseline mb-4">
                <span className="fw-bold text-dark text-uppercase small">Subtotal:</span>
                <span className="h4 fw-bold text-dark m-0">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="d-grid gap-2 mb-3">
                <button
                  type="button"
                  className="btn btn-primary-custom py-2.5 w-100 justify-content-center fs-6"
                  onClick={() => navigate('/checkout')}
                  disabled={items.length === 0 || hasUnavailableItems}
                  aria-label="Proceed to Checkout"
                >
                  Proceed to Checkout ↗
                </button>

                <Link
                  to="/marketplace"
                  className="btn btn-outline-custom btn-sm py-2 w-100 text-center"
                >
                  ← Continue Shopping
                </Link>
              </div>

              <div className="extra-small text-muted text-center">
                Strict stock reservation applies upon checkout order placement.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clearCartTitle"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border border-dark rounded-0 p-3">
              <div className="modal-header border-bottom border-dark pb-2">
                <h5 className="modal-title h6 text-uppercase fw-bold text-dark" id="clearCartTitle">
                  Clear All Cart Items?
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowClearConfirm(false)}
                  aria-label="Close dialog"
                ></button>
              </div>
              <div className="modal-body py-3 small text-secondary">
                Are you sure you wish to remove all {itemCount} refurbished device{itemCount === 1 ? '' : 's'} from your cart? This will release reserved units back to available inventory.
              </div>
              <div className="modal-footer border-top border-secondary border-opacity-15 pt-2 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm py-1.5 px-3"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm py-1.5 px-3"
                  onClick={handleClear}
                  disabled={clearing}
                >
                  {clearing ? 'Clearing...' : 'Yes, Clear Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
