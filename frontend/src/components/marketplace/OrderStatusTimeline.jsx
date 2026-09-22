import React from 'react';
import { formatIndianDate } from '../../utils/workflowHelpers';
import { MARKETPLACE_ORDER_STATUS_MAP } from '../../utils/enumMappings';
import { ORDER_STAGES, getStepStatus } from '../../utils/orderHelpers';

export default function OrderStatusTimeline({ order }) {
  if (!order) return null;

  const isCancelled = order.status === 'CANCELLED';

  // Extract actual timestamps from backend DTO
  const getStageTimestamp = (key) => {
    switch (key) {
      case 'PLACED':
        return order.placedAt ? formatIndianDate(order.placedAt) : null;
      case 'CONFIRMED':
        return order.confirmedAt ? formatIndianDate(order.confirmedAt) : null;
      case 'SHIPPED':
        return order.shippedAt ? formatIndianDate(order.shippedAt) : null;
      case 'DELIVERED':
        return order.deliveredAt ? formatIndianDate(order.deliveredAt) : null;
      default:
        return null;
    }
  };

  // 1. Terminal Cancelled State Presentation
  if (isCancelled) {
    return (
      <div className="order-status-timeline p-3.5 border border-danger border-opacity-30 bg-light my-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom border-danger border-opacity-25">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger text-white">ORDER CANCELLED</span>
            <span className="extra-small text-muted text-uppercase fw-bold">Terminal Lifecycle State</span>
          </div>
          {order.cancelledAt && (
            <span className="extra-small text-secondary">
              Cancelled on: {formatIndianDate(order.cancelledAt)}
            </span>
          )}
        </div>

        <div className="timeline-steps-horizontal d-flex flex-column flex-sm-row gap-3">
          {/* Placed Step */}
          <div className="d-flex align-items-start gap-2 flex-grow-1">
            <div className="text-emerald fs-5 mt-0.5" aria-hidden="true">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div>
              <div className="fw-bold text-dark extra-small text-uppercase">1. Placed</div>
              <div className="extra-small text-muted">{getStageTimestamp('PLACED') || 'Completed'}</div>
            </div>
          </div>

          <div className="d-none d-sm-block align-self-center text-muted px-2" aria-hidden="true">
            <i className="bi bi-arrow-right"></i>
          </div>

          {/* Cancelled Step */}
          <div className="d-flex align-items-start gap-2 flex-grow-1">
            <div className="text-danger fs-5 mt-0.5" aria-hidden="true">
              <i className="bi bi-x-circle-fill"></i>
            </div>
            <div>
              <div className="fw-bold text-danger extra-small text-uppercase">2. Cancelled</div>
              <div className="extra-small text-muted">
                {order.cancelledAt ? formatIndianDate(order.cancelledAt) : 'Order Cancelled'}
              </div>
            </div>
          </div>
        </div>

        {order.cancellationReason && (
          <div className="mt-3 pt-2 border-top border-secondary border-opacity-15 extra-small text-secondary">
            <strong className="text-dark">Cancellation Reason:</strong> {order.cancellationReason}
          </div>
        )}

        <div className="mt-2 extra-small text-muted">
          All physical devices from this order have been released back to available inventory.
        </div>
      </div>
    );
  }

  // 2. Active Lifecycle Timeline Progression (PLACED -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED)
  return (
    <div className="order-status-timeline p-3.5 border border-secondary border-opacity-15 bg-white my-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom border-secondary border-opacity-15">
        <h3 className="h6 text-uppercase fw-bold text-dark m-0">
          Order Progress Tracker
        </h3>
        <span className="extra-small text-muted">
          Current State: <strong>{MARKETPLACE_ORDER_STATUS_MAP[order.status]?.label || order.status}</strong>
        </span>
      </div>

      <div className="timeline-container">
        <div className="row g-3">
          {ORDER_STAGES.map((stage, index) => {
            const status = getStepStatus(stage.key, order.status);
            const timestamp = getStageTimestamp(stage.key);

            let iconClass = 'bi-circle text-muted';
            let titleClass = 'text-muted';
            let stepBadge = null;

            if (status === 'completed') {
              iconClass = 'bi-check-circle-fill text-emerald';
              titleClass = 'text-dark fw-bold';
            } else if (status === 'current') {
              iconClass = 'bi-record-circle-fill text-primary';
              titleClass = 'text-primary fw-bold';
              stepBadge = (
                <span className="badge bg-primary text-white extra-small ms-1" style={{ fontSize: '0.62rem' }}>
                  Current
                </span>
              );
            }

            return (
              <div key={stage.key} className="col-12 col-sm-6 col-md">
                <div className="d-flex align-items-start gap-2 h-100 p-2 border-start border-2" style={{
                  borderColor: status === 'completed' ? '#1b4332' : status === 'current' ? '#0d6efd' : '#dee2e6'
                }}>
                  <div className="fs-6 mt-0.5 flex-shrink-0" aria-hidden="true">
                    <i className={`bi ${iconClass}`}></i>
                  </div>
                  <div className="min-w-0">
                    <div className={`extra-small text-uppercase ${titleClass} d-flex align-items-center flex-wrap gap-1`}>
                      <span>{index + 1}. {stage.label}</span>
                      {stepBadge}
                    </div>
                    <div className="extra-small text-muted mt-0.5" style={{ lineHeight: '1.3' }}>
                      {stage.description}
                    </div>
                    {timestamp && (
                      <div className="extra-small text-dark fw-semibold mt-1">
                        <i className="bi bi-calendar-event me-1"></i>
                        {timestamp}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
