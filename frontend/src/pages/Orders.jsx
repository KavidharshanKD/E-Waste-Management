import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi, getApiErrorMessage } from '../api/apiClient';
import { formatCurrency, formatIndianDate } from '../utils/workflowHelpers';
import {
  MARKETPLACE_ORDER_STATUS_MAP,
  MARKETPLACE_PAYMENT_STATUS_MAP,
} from '../utils/enumMappings';
import MarketplaceLoading from '../components/marketplace/MarketplaceLoading';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderApi.getMyOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(getApiErrorMessage(err, 'Unable to retrieve your order history. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="py-5">
        <MarketplaceLoading message="Retrieving Order History..." />
      </div>
    );
  }

  return (
    <div className="orders-page py-3">
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
            My Orders
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3 pb-3 mb-4 border-bottom border-dark">
        <div>
          <div className="editorial-tag">REFURBISHED ASSET ALLOCATION &amp; ORDERS</div>
          <h1 className="display-hero-title m-0" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)' }}>
            MY ORDERS
          </h1>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-custom btn-sm py-1.5 px-3"
            onClick={fetchOrders}
            aria-label="Refresh order history"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
          <Link to="/marketplace" className="btn btn-primary-custom btn-sm py-1.5 px-3">
            Browse Marketplace ↗
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-danger py-2.5 px-3 mb-4 small" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <div className="mt-2">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm py-1 px-2.5 extra-small"
              onClick={fetchOrders}
            >
              Retry Loading Orders
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!error && orders.length === 0 ? (
        <div className="py-5 text-center my-4 border border-secondary border-opacity-15 bg-light p-4 p-md-5">
          <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>
            <i className="bi bi-box-seam"></i>
          </div>
          <h2 className="h4 text-uppercase fw-bold text-dark mb-2">
            NO ORDERS RECORDED
          </h2>
          <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '460px', lineHeight: '1.6' }}>
            You have not placed any refurbished equipment orders yet. Browse our verified inventory of devices that have successfully completed the testing and recovery workflow.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/marketplace" className="btn btn-primary-custom py-2 px-4">
              Explore Refurbished Marketplace ↗
            </Link>
          </div>
        </div>
      ) : (
        /* Orders List */
        <div className="d-flex flex-column gap-3">
          {orders.map((order) => {
            const orderStatus = MARKETPLACE_ORDER_STATUS_MAP[order.status] || {
              label: order.status || 'PLACED',
              badgeClass: 'badge bg-warning text-dark',
            };

            const paymentStatus = MARKETPLACE_PAYMENT_STATUS_MAP[order.paymentStatus] || {
              label: order.paymentStatus || 'Payment Pending',
              badgeClass: 'badge bg-warning text-dark',
            };

            const items = order.items || [];
            const itemCount = items.length;

            return (
              <div
                key={order.id}
                className="p-3.5 border border-secondary border-opacity-15 bg-white transition-hover"
              >
                <div className="row g-3 align-items-center">
                  {/* Order Identity & Placement Details */}
                  <div className="col-12 col-md-5">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="extra-small text-uppercase fw-bold text-muted">
                        ORDER REF:
                      </span>
                      <span className="fw-bold text-dark font-monospace small">
                        {order.orderNumber || `#${order.id}`}
                      </span>
                    </div>

                    <div className="extra-small text-muted mb-2">
                      Placed on: <strong>{formatIndianDate(order.placedAt)}</strong>
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className={orderStatus.badgeClass} style={{ fontSize: '0.68rem' }}>
                        Order: {orderStatus.label}
                      </span>
                      <span className={paymentStatus.badgeClass} style={{ fontSize: '0.68rem' }}>
                        {paymentStatus.label}
                      </span>
                    </div>
                  </div>

                  {/* Purchased Devices Summary */}
                  <div className="col-12 col-md-4">
                    <div className="extra-small text-muted text-uppercase fw-bold mb-1">
                      Purchased Physical Units ({itemCount}):
                    </div>
                    <div className="d-flex flex-column gap-1">
                      {items.slice(0, 2).map((item, idx) => (
                        <div key={item.id || idx} className="small text-dark text-truncate" title={item.titleSnapshot}>
                          • {item.titleSnapshot || `Device #${item.listingId}`}
                        </div>
                      ))}
                      {items.length > 2 && (
                        <div className="extra-small text-muted">
                          +{items.length - 2} more item{items.length - 2 === 1 ? '' : 's'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Total & Navigation Link */}
                  <div className="col-12 col-md-3 text-md-end d-flex flex-md-column justify-content-between align-items-end gap-2">
                    <div>
                      <div className="extra-small text-muted text-uppercase fw-bold">Total Amount</div>
                      <div className="fw-bold fs-5 text-dark">
                        {formatCurrency(order.totalAmount || order.subtotal)}
                      </div>
                    </div>

                    <Link
                      to={`/orders/${order.id}`}
                      className="btn btn-outline-custom btn-sm py-1.5 px-3 text-nowrap"
                      aria-label={`View details and tracking for order ${order.orderNumber || order.id}`}
                    >
                      View Details &amp; Tracking ↗
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
