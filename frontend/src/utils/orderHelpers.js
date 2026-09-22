/**
 * ORDER STATUS & LIFECYCLE TRACKING HELPERS
 * Pure logic for marketplace order lifecycle progression, stages, and cancellation eligibility.
 */

export const ORDER_STAGES = [
  { key: 'PLACED', label: 'Placed', description: 'Order submitted & inventory locked' },
  { key: 'CONFIRMED', label: 'Confirmed', description: 'Acknowledged by circular facility hub' },
  { key: 'PROCESSING', label: 'Processing', description: 'Device inspection & consignment packing' },
  { key: 'SHIPPED', label: 'Shipped', description: 'Handed to circular transit logistics' },
  { key: 'DELIVERED', label: 'Delivered', description: 'Physical unit received & marked sold' },
];

/**
 * Computes step status (completed, current, upcoming, cancelled, inactive)
 * for a given lifecycle stage relative to the current order status.
 */
export function getStepStatus(stageKey, currentStatus) {
  if (currentStatus === 'CANCELLED') {
    if (stageKey === 'PLACED') return 'completed';
    if (stageKey === 'CANCELLED') return 'cancelled';
    return 'inactive';
  }

  const stageIndex = ORDER_STAGES.findIndex((s) => s.key === stageKey);
  const currentIndex = ORDER_STAGES.findIndex((s) => s.key === currentStatus);

  if (stageIndex === -1 || currentIndex === -1) return 'upcoming';
  if (stageIndex < currentIndex) return 'completed';
  if (stageIndex === currentIndex) return 'current';
  return 'upcoming';
}

/**
 * Determines whether an order is eligible for cancellation
 * according to the backend MarketplaceOrderService contract.
 * Orders in SHIPPED, DELIVERED, or CANCELLED status cannot be cancelled.
 */
export function isOrderCancellable(status) {
  return status === 'PLACED' || status === 'CONFIRMED' || status === 'PROCESSING';
}
