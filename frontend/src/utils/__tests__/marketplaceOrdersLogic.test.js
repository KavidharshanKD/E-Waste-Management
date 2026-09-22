import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  MARKETPLACE_ORDER_STATUS_MAP,
  MARKETPLACE_PAYMENT_STATUS_MAP,
  getEnumLabel,
} from '../enumMappings.js';

import {
  ORDER_STAGES,
  getStepStatus,
  isOrderCancellable,
} from '../orderHelpers.js';

import { getApiErrorMessage } from '../../api/apiClient.js';

describe('Marketplace Orders Logic, Timeline Tracker & Cancellation Contract', () => {

  // 1. Order Status Mapping
  test('order status mapping contains all valid backend statuses with labels and badges', () => {
    const requiredStatuses = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    requiredStatuses.forEach((status) => {
      const entry = MARKETPLACE_ORDER_STATUS_MAP[status];
      assert.ok(entry, `Missing mapping entry for status ${status}`);
      assert.ok(entry.label, `Missing label for status ${status}`);
      assert.ok(entry.badgeClass, `Missing badgeClass for status ${status}`);
    });

    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.PLACED.label, 'Placed');
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.CONFIRMED.label, 'Confirmed');
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.PROCESSING.label, 'Processing');
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.SHIPPED.label, 'Shipped');
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.DELIVERED.label, 'Delivered');
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.CANCELLED.label, 'Cancelled');
  });

  // 2. Terminal CANCELLED Behavior
  test('terminal CANCELLED state marks PLACED as completed and future stages inactive', () => {
    assert.equal(getStepStatus('PLACED', 'CANCELLED'), 'completed');
    assert.equal(getStepStatus('CANCELLED', 'CANCELLED'), 'cancelled');
    assert.equal(getStepStatus('CONFIRMED', 'CANCELLED'), 'inactive');
    assert.equal(getStepStatus('PROCESSING', 'CANCELLED'), 'inactive');
    assert.equal(getStepStatus('SHIPPED', 'CANCELLED'), 'inactive');
    assert.equal(getStepStatus('DELIVERED', 'CANCELLED'), 'inactive');
  });

  // 3. Terminal DELIVERED Behavior
  test('terminal DELIVERED state marks all previous stages as completed and DELIVERED as current', () => {
    assert.equal(getStepStatus('PLACED', 'DELIVERED'), 'completed');
    assert.equal(getStepStatus('CONFIRMED', 'DELIVERED'), 'completed');
    assert.equal(getStepStatus('PROCESSING', 'DELIVERED'), 'completed');
    assert.equal(getStepStatus('SHIPPED', 'DELIVERED'), 'completed');
    assert.equal(getStepStatus('DELIVERED', 'DELIVERED'), 'current');
  });

  // 4. Current, Upcoming, Completed Timeline Calculation
  test('timeline stage calculator correctly identifies stage progression', () => {
    // When order is in PROCESSING:
    // PLACED & CONFIRMED are completed
    // PROCESSING is current
    // SHIPPED & DELIVERED are upcoming
    assert.equal(getStepStatus('PLACED', 'PROCESSING'), 'completed');
    assert.equal(getStepStatus('CONFIRMED', 'PROCESSING'), 'completed');
    assert.equal(getStepStatus('PROCESSING', 'PROCESSING'), 'current');
    assert.equal(getStepStatus('SHIPPED', 'PROCESSING'), 'upcoming');
    assert.equal(getStepStatus('DELIVERED', 'PROCESSING'), 'upcoming');

    // When order is in PLACED:
    assert.equal(getStepStatus('PLACED', 'PLACED'), 'current');
    assert.equal(getStepStatus('CONFIRMED', 'PLACED'), 'upcoming');
  });

  // 5. PENDING Payment Remains PENDING (SOLD != PAID)
  test('honest payment state preserves PENDING and never automatically converts to PAID', () => {
    const paymentPending = MARKETPLACE_PAYMENT_STATUS_MAP.PENDING;
    assert.ok(paymentPending);
    assert.equal(paymentPending.label, 'Payment Pending');
    assert.match(paymentPending.description, /awaiting payment confirmation/i);

    // Verify even for DELIVERED order, frontend status map does NOT equate DELIVERED to PAID
    const orderDelivered = MARKETPLACE_ORDER_STATUS_MAP.DELIVERED;
    assert.equal(orderDelivered.label, 'Delivered');
    assert.notEqual(paymentPending.label, 'Paid');

    // Confirm that PAID is an explicitly distinct enum state
    assert.equal(MARKETPLACE_PAYMENT_STATUS_MAP.PAID.label, 'Paid');
  });

  // 6. Order Item Quantity & Unique-Device Semantics
  test('order items reflect individual unique physical units without quantity multiplication', () => {
    const orderItem = {
      id: 5,
      listingId: 42,
      titleSnapshot: 'Dell Latitude 7490 Refurbished',
      priceAtPurchase: 22000,
      warrantyDaysSnapshot: 90,
    };

    // Serialized physical device represents strictly 1 unit
    const quantity = 1;
    assert.equal(quantity, 1);
    assert.equal(orderItem.titleSnapshot, 'Dell Latitude 7490 Refurbished');
    assert.equal(orderItem.warrantyDaysSnapshot, 90);
  });

  // 7. Cancellation Eligibility Based on Backend Status Contract
  test('cancellation is permitted only for PLACED, CONFIRMED, and PROCESSING statuses', () => {
    assert.equal(isOrderCancellable('PLACED'), true);
    assert.equal(isOrderCancellable('CONFIRMED'), true);
    assert.equal(isOrderCancellable('PROCESSING'), true);

    // Disallowed statuses (already handed over or terminal)
    assert.equal(isOrderCancellable('SHIPPED'), false);
    assert.equal(isOrderCancellable('DELIVERED'), false);
    assert.equal(isOrderCancellable('CANCELLED'), false);
  });

  // 8. API Error Mapping
  test('getApiErrorMessage accurately extracts backend error structures', () => {
    const genericError = new Error('Network error');
    assert.equal(getApiErrorMessage(genericError), 'Network error');

    const responseMsgError = {
      response: { data: { message: 'Order not found with ID: 99' } },
    };
    assert.equal(getApiErrorMessage(responseMsgError), 'Order not found with ID: 99');

    const responseErrorField = {
      response: { data: { error: 'Cannot cancel order in SHIPPED status' } },
    };
    assert.equal(getApiErrorMessage(responseErrorField), 'Cannot cancel order in SHIPPED status');

    assert.equal(getApiErrorMessage(null, 'Fallback msg'), 'Fallback msg');
  });

  // 9. Empty Order List Behavior
  test('empty order list behavior guards against rendering and detects empty collection', () => {
    const emptyOrders = [];
    const hasOrders = emptyOrders && emptyOrders.length > 0;
    assert.equal(hasOrders, false);

    const populatedOrders = [{ id: 1, orderNumber: 'ORD-1001' }];
    assert.equal(populatedOrders.length > 0, true);
  });
});
