import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  USER_INTENTION_MAP,
  DISPOSAL_ACTION_MAP,
  EWASTE_CATEGORY_MAP,
  DEVICE_CONDITION_MAP,
  COSMETIC_GRADE_MAP,
  MARKETPLACE_LISTING_STATUS_MAP,
  MARKETPLACE_STOCK_STATUS_MAP,
  MARKETPLACE_ORDER_STATUS_MAP,
  MARKETPLACE_PAYMENT_STATUS_MAP,
  RESTORATION_STATUS_MAP,
  QUALITY_CHECK_RESULT_MAP,
  REPAIRABILITY_STATUS_MAP,
  getEnumLabel,
  getEnumBadgeClass,
} from '../enumMappings.js';

describe('Enum Mappings & Display Helpers', () => {
  it('correctly maps user intentions with human readable labels', () => {
    assert.equal(USER_INTENTION_MAP.REFURBISH_AND_SELL.label, 'Refurbish & Sell');
    assert.equal(USER_INTENTION_MAP.KEEP_USING.label, 'Keep Using');
    assert.equal(USER_INTENTION_MAP.REPAIR.label, 'Repair Device');
    assert.equal(USER_INTENTION_MAP.DONATE.label, 'Donate');
    assert.equal(USER_INTENTION_MAP.RECYCLE.label, 'Recycle Responsibly');
  });

  it('correctly maps disposal actions with colors and badges', () => {
    assert.equal(DISPOSAL_ACTION_MAP.SPECIAL_HANDLING.label, 'Special Hazardous Handling');
    assert.equal(DISPOSAL_ACTION_MAP.REUSE.label, 'Direct Reuse');
    assert.ok(DISPOSAL_ACTION_MAP.SPECIAL_HANDLING.badgeClass.includes('bg-danger'));
  });

  it('correctly maps cosmetic grades', () => {
    assert.equal(COSMETIC_GRADE_MAP.GRADE_A.shortLabel, 'Grade A');
    assert.equal(COSMETIC_GRADE_MAP.GRADE_B.shortLabel, 'Grade B');
    assert.equal(COSMETIC_GRADE_MAP.GRADE_C.shortLabel, 'Grade C');
  });

  it('correctly enforces SOLD != PAID distinction in status maps', () => {
    // Stock status
    assert.equal(MARKETPLACE_STOCK_STATUS_MAP.SOLD.label, 'Sold Out (Second Life)');
    // Payment status remains honest
    assert.equal(MARKETPLACE_PAYMENT_STATUS_MAP.PENDING.label, 'Payment Pending');
    assert.equal(MARKETPLACE_PAYMENT_STATUS_MAP.PAID.label, 'Paid');
    assert.notEqual(MARKETPLACE_STOCK_STATUS_MAP.SOLD.label, MARKETPLACE_PAYMENT_STATUS_MAP.PAID.label);
  });

  it('correctly maps order lifecycle statuses', () => {
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.PLACED.label, 'Placed');
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.CONFIRMED.label, 'Confirmed');
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.SHIPPED.label, 'Shipped');
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.DELIVERED.label, 'Delivered');
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.CANCELLED.label, 'Cancelled');
  });

  it('helper getEnumLabel returns expected label or friendly fallback', () => {
    assert.equal(getEnumLabel(EWASTE_CATEGORY_MAP, 'MOBILE_PHONE'), 'Mobile Phone');
    assert.equal(getEnumLabel(EWASTE_CATEGORY_MAP, 'LAPTOP'), 'Laptop');
    assert.equal(getEnumLabel(MARKETPLACE_STOCK_STATUS_MAP, 'AVAILABLE'), 'In Stock');
    // Fallback behavior replaces underscores
    assert.equal(getEnumLabel({}, 'CUSTOM_TEST_STATUS'), 'CUSTOM TEST STATUS');
    assert.equal(getEnumLabel({}, '', 'Default Fallback'), 'Default Fallback');
  });

  it('helper getEnumBadgeClass returns correct badge classes', () => {
    assert.ok(getEnumBadgeClass(MARKETPLACE_STOCK_STATUS_MAP, 'AVAILABLE').includes('bg-emerald'));
    assert.ok(getEnumBadgeClass(MARKETPLACE_PAYMENT_STATUS_MAP, 'PENDING').includes('bg-warning'));
    assert.equal(getEnumBadgeClass({}, 'UNKNOWN_KEY', 'default-class'), 'default-class');
  });
});
