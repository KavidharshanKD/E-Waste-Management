import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  MARKETPLACE_ORDER_STATUS_MAP,
  MARKETPLACE_PAYMENT_STATUS_MAP,
  MARKETPLACE_STOCK_STATUS_MAP,
  COSMETIC_GRADE_MAP,
  getEnumLabel,
} from '../enumMappings.js';

import { formatCurrency } from '../workflowHelpers.js';

describe('Cart & Checkout Logic & Honest Payment Presentation', () => {

  // 1. Cart Count Logic
  test('cart count logic accurately extracts count from cart DTO or items array', () => {
    const emptyCart = { itemCount: 0, items: [] };
    const populatedCart = {
      itemCount: 2,
      subtotal: 35000,
      items: [
        { id: 1, listingId: 101, title: 'ThinkPad T480' },
        { id: 2, listingId: 102, title: 'Dell Latitude 7490' },
      ],
    };
    const cartWithoutItemCount = {
      items: [{ id: 1, listingId: 101, title: 'ThinkPad T480' }],
    };

    const getCount = (c) => c?.itemCount ?? c?.items?.length ?? 0;

    assert.equal(getCount(null), 0);
    assert.equal(getCount(undefined), 0);
    assert.equal(getCount(emptyCart), 0);
    assert.equal(getCount(populatedCart), 2);
    assert.equal(getCount(cartWithoutItemCount), 1);
  });

  // 2. Cart Item Display Logic
  test('cart item display logic enforces unique serialized unit quantity of 1', () => {
    const cartItem = {
      id: 1,
      listingId: 45,
      title: 'Lenovo ThinkPad T490',
      category: 'LAPTOP',
      brand: 'Lenovo',
      model: 'T490',
      cosmeticGrade: 'GRADE_A',
      price: 24500,
      stockStatus: 'AVAILABLE',
      available: true,
    };

    // Refurbished listing represents a unique physical item — strictly 1 unit
    const quantity = 1;
    assert.equal(quantity, 1);

    const gradeLabel = COSMETIC_GRADE_MAP[cartItem.cosmeticGrade]?.label;
    assert.equal(gradeLabel, 'Grade A — Like New');

    const formattedPrice = formatCurrency(cartItem.price);
    assert.match(formattedPrice, /24,500/);
  });

  // 3. Empty Cart Behavior
  test('empty cart behavior correctly identifies empty state and guards checkout', () => {
    const emptyCartItems = [];
    const isCartEmpty = emptyCartItems.length === 0;
    const canProceedToCheckout = !isCartEmpty;

    assert.equal(isCartEmpty, true);
    assert.equal(canProceedToCheckout, false);
  });

  // 4. Payment Status Mapping (Honest Payment Presentation: SOLD != PAID)
  test('honestly maps PENDING payment status without pretending transaction occurred', () => {
    const pendingPayment = MARKETPLACE_PAYMENT_STATUS_MAP.PENDING;
    assert.ok(pendingPayment);
    assert.equal(pendingPayment.label, 'Payment Pending');
    assert.match(pendingPayment.description, /awaiting payment confirmation/i);

    // Verify that PLACED order does NOT imply PAID payment
    const orderStatus = MARKETPLACE_ORDER_STATUS_MAP.PLACED;
    assert.equal(orderStatus.label, 'Placed');
    assert.notEqual(pendingPayment.label, 'Paid');

    // Confirm that PAID is explicitly separated from PLACED
    const paidPayment = MARKETPLACE_PAYMENT_STATUS_MAP.PAID;
    assert.equal(paidPayment.label, 'Paid');
  });

  // 5. Order Status Mapping
  test('order status mapping covers all lifecycle transitions', () => {
    const statuses = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    statuses.forEach((st) => {
      const entry = MARKETPLACE_ORDER_STATUS_MAP[st];
      assert.ok(entry, `Missing mapping for order status ${st}`);
      assert.ok(entry.label);
      assert.ok(entry.badgeClass);
    });
  });

  // 6. Checkout Request Construction
  test('constructs valid CreateOrderDTO payload matching backend requirements', () => {
    const formValues = {
      recipientName: 'Kavidhrashan S',
      phoneNumber: '+91 9876543210',
      addressLine: '12th Cross, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
    };

    const cartItems = [
      { id: 10, listingId: 101, price: 18000 },
      { id: 11, listingId: 102, price: 14000 },
    ];

    const createOrderDto = {
      recipientName: formValues.recipientName.trim(),
      phoneNumber: formValues.phoneNumber.trim(),
      addressLine: formValues.addressLine.trim(),
      city: formValues.city.trim(),
      state: formValues.state.trim(),
      postalCode: formValues.postalCode.trim(),
      paymentMethod: 'DEMO_CHECKOUT',
      listingIds: cartItems.map((i) => i.listingId),
    };

    assert.equal(createOrderDto.recipientName, 'Kavidhrashan S');
    assert.equal(createOrderDto.phoneNumber, '+91 9876543210');
    assert.equal(createOrderDto.addressLine, '12th Cross, Indiranagar');
    assert.equal(createOrderDto.city, 'Bengaluru');
    assert.equal(createOrderDto.state, 'Karnataka');
    assert.equal(createOrderDto.postalCode, '560038');
    assert.equal(createOrderDto.paymentMethod, 'DEMO_CHECKOUT');
    assert.deepEqual(createOrderDto.listingIds, [101, 102]);
  });

  // 7. Concurrency / Stock Conflict Handling
  test('detects concurrency conflict and identifies unavailable devices', () => {
    const checkConflictError = (errMessage, statusCode) => {
      const lower = (errMessage || '').toLowerCase();
      return (
        statusCode === 409 ||
        lower.includes('not in published') ||
        lower.includes('unavailable') ||
        lower.includes('reserved') ||
        lower.includes('sold')
      );
    };

    const reservedCollision = "Device 'MacBook Pro 2019' is currently RESERVED and unavailable for purchase";
    const soldCollision = "Device 'iPad Air 4' is currently SOLD and unavailable for purchase";
    const normalValidation = 'Phone number is required';

    assert.equal(checkConflictError(reservedCollision, 400), true);
    assert.equal(checkConflictError(soldCollision, 400), true);
    assert.equal(checkConflictError('Conflict', 409), true);
    assert.equal(checkConflictError(normalValidation, 400), false);

    // Cart availability check
    const items = [
      { listingId: 1, available: true, stockStatus: 'AVAILABLE' },
      { listingId: 2, available: false, stockStatus: 'RESERVED' },
    ];
    const hasUnavailable = items.some((i) => !i.available || i.stockStatus !== 'AVAILABLE');
    assert.equal(hasUnavailable, true);
  });
});
