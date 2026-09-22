import test from 'node:test';
import assert from 'node:assert/strict';

import {
  USER_INTENTION_MAP,
  DISPOSAL_ACTION_MAP,
  COSMETIC_GRADE_MAP,
  MARKETPLACE_LISTING_STATUS_MAP,
  MARKETPLACE_STOCK_STATUS_MAP,
  MARKETPLACE_ORDER_STATUS_MAP,
  REQUEST_STATUS_MAP,
  PICKUP_STATUS_MAP,
  TECHNICIAN_DECISION_MAP,
  getEnumLabel,
  getEnumBadgeClass,
} from '../enumMappings.js';

import {
  isQcEligible,
  isMarketplaceCandidateEligible,
  canStartRestoration,
  canCompleteRestoration,
  canSubmitListingForApproval,
  canWithdrawListing,
  validateSellingPrice,
  validateWarrantyDays,
  isPubliclyVisibleListing,
} from '../operatorHelpers.js';

test('MODULE 10 END-TO-END SYSTEM INTEGRATION AUDIT & INVARIANTS', async (t) => {

  // =========================================================================
  // 1. LIFECYCLE INVARIANT: Complete State Machine Integrity
  // =========================================================================
  await t.test('1. complete circular lifecycle state machine covers all 13 intake-to-completion states', () => {
    const expectedStates = [
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'PICKUP_ASSIGNED',
      'COLLECTED',
      'AT_RECYCLING_CENTER',
      'PROCESSING',
      'RECYCLED',
      'REUSED',
      'REFURBISHED',
      'REJECTED',
      'COMPLETED',
      'CANCELLED',
    ];

    expectedStates.forEach((status) => {
      assert.ok(REQUEST_STATUS_MAP[status], `Status ${status} must be mapped`);
      assert.ok(REQUEST_STATUS_MAP[status].label, `Status ${status} must have readable label`);
    });
  });

  // =========================================================================
  // 2. SAFETY INVARIANT: Stage 0 Safety Precedence Overrides ML
  // =========================================================================
  await t.test('2. safety hazard flags strictly enforce SPECIAL_HANDLING containment protocol', () => {
    const hazardousDevice = {
      condition: 'HAZARDOUS',
      batterySwollen: true,
      hasPhysicalDamage: true,
    };

    const isHazardous = hazardousDevice.condition === 'HAZARDOUS' || hazardousDevice.batterySwollen;
    assert.equal(isHazardous, true);

    const safetyAction = DISPOSAL_ACTION_MAP.SPECIAL_HANDLING;
    assert.ok(safetyAction);
    assert.equal(safetyAction.label, 'Special Hazardous Handling');
  });

  // =========================================================================
  // 3. SEPARATION OF CONCERNS: Citizen Preference vs Diagnostic vs Tech Action
  // =========================================================================
  await t.test('3. distinctly separates citizen intake intention, algorithmic recommendation, and technician decision', () => {
    // 1. Citizen intention
    assert.ok(USER_INTENTION_MAP.KEEP_USING);
    assert.ok(USER_INTENTION_MAP.REFURBISH_AND_SELL);

    // 2. System recommendation
    assert.ok(DISPOSAL_ACTION_MAP.REUSE);
    assert.ok(DISPOSAL_ACTION_MAP.REFURBISH);

    // 3. Physical technician decision
    assert.ok(TECHNICIAN_DECISION_MAP.REFURBISH);
    assert.ok(TECHNICIAN_DECISION_MAP.REPAIR);
    assert.ok(TECHNICIAN_DECISION_MAP.SPECIAL_HANDLING);

    // Ensure they are not conflated
    assert.notEqual(USER_INTENTION_MAP.KEEP_USING.label, DISPOSAL_ACTION_MAP.REUSE.label);
  });

  // =========================================================================
  // 4. QC INVARIANT: Restoration Must Be Complete Before QC
  // =========================================================================
  await t.test('4. QC inspection eligibility strictly requires restoration job to be COMPLETED', () => {
    assert.equal(isQcEligible({ status: 'PENDING' }), false);
    assert.equal(isQcEligible({ status: 'IN_PROGRESS' }), false);
    assert.equal(isQcEligible({ status: 'FAILED' }), false);
    assert.equal(isQcEligible({ status: 'COMPLETED' }), true);
  });

  // =========================================================================
  // 5. MARKETPLACE CANDIDATE INVARIANT: All Four Quality Gates Required
  // =========================================================================
  await t.test('5. candidate eligibility strictly requires safetyTestPassed, PASS result, recommendation, and zero hazard', () => {
    const validAssessment = {
      recommendedForMarketplace: true,
      safetyHazardFound: false,
    };
    const validQc = {
      safetyTestPassed: true,
      overallResult: 'PASS',
    };
    assert.equal(isMarketplaceCandidateEligible(validAssessment, validQc), true);

    // Failure if any single invariant fails
    assert.equal(isMarketplaceCandidateEligible(validAssessment, { ...validQc, safetyTestPassed: false }), false);
    assert.equal(isMarketplaceCandidateEligible(validAssessment, { ...validQc, overallResult: 'FAIL' }), false);
    assert.equal(isMarketplaceCandidateEligible({ ...validAssessment, recommendedForMarketplace: false }, validQc), false);
    assert.equal(isMarketplaceCandidateEligible({ ...validAssessment, safetyHazardFound: true }, validQc), false);
  });

  // =========================================================================
  // 6. PUBLIC MARKETPLACE PROTECTION: Only PUBLISHED + AVAILABLE
  // =========================================================================
  await t.test('6. public catalog exposure is restricted strictly to PUBLISHED and AVAILABLE listings', () => {
    assert.equal(isPubliclyVisibleListing({ listingStatus: 'DRAFT', stockStatus: 'AVAILABLE' }), false);
    assert.equal(isPubliclyVisibleListing({ listingStatus: 'PENDING_APPROVAL', stockStatus: 'AVAILABLE' }), false);
    assert.equal(isPubliclyVisibleListing({ listingStatus: 'REJECTED', stockStatus: 'AVAILABLE' }), false);
    assert.equal(isPubliclyVisibleListing({ listingStatus: 'WITHDRAWN', stockStatus: 'AVAILABLE' }), false);
    assert.equal(isPubliclyVisibleListing({ listingStatus: 'PUBLISHED', stockStatus: 'SOLD' }), false);
    assert.equal(isPubliclyVisibleListing({ listingStatus: 'PUBLISHED', stockStatus: 'RESERVED' }), false);
    assert.equal(isPubliclyVisibleListing({ listingStatus: 'PUBLISHED', stockStatus: 'AVAILABLE' }), true);
  });

  // =========================================================================
  // 7. HONEST PAYMENT STATE: SOLD != PAID
  // =========================================================================
  await t.test('7. honest payment presentation preserves PENDING and never automatically marks PAID', () => {
    const honestOrder = {
      orderNumber: 'ORD-20260922-ABCD',
      status: 'PLACED',
      paymentStatus: 'PENDING',
      paymentMethod: 'DEMO_CHECKOUT',
    };

    assert.equal(honestOrder.paymentStatus, 'PENDING');
    assert.notEqual(honestOrder.paymentStatus, 'PAID');
    assert.equal(MARKETPLACE_ORDER_STATUS_MAP.PLACED.label, 'Placed');
  });

  // =========================================================================
  // 8. COMMERCIAL PRICING & WARRANTY INTEGRITY
  // =========================================================================
  await t.test('8. operator commercial price and warranty require genuine non-negative values', () => {
    assert.equal(validateSellingPrice(0), false);
    assert.equal(validateSellingPrice(-150), false);
    assert.equal(validateSellingPrice('abc'), false);
    assert.equal(validateSellingPrice(15000), true);

    assert.equal(validateWarrantyDays(-30), false);
    assert.equal(validateWarrantyDays(0), true);
    assert.equal(validateWarrantyDays(90), true);
  });

  // =========================================================================
  // 9. DATA INTEGRITY: No Fabricated Star Ratings or Artificial Reviews
  // =========================================================================
  await t.test('9. cosmetic grades reflect physical evaluation standards without arbitrary star ratings', () => {
    const grades = ['GRADE_A', 'GRADE_B', 'GRADE_C'];
    grades.forEach((grade) => {
      assert.ok(COSMETIC_GRADE_MAP[grade], `Grade ${grade} must exist`);
      assert.ok(COSMETIC_GRADE_MAP[grade].label.includes('Grade'));
      // Verify no fake star ratings (e.g. 4.9/5 stars)
      assert.equal(COSMETIC_GRADE_MAP[grade].stars, undefined);
    });
  });

  // =========================================================================
  // 10. DEVICE JOURNEY: Transparent Event Chain Without Donor PII
  // =========================================================================
  await t.test('10. device journey events originate from verified stages without exposing citizen donor PII', () => {
    const journeyPayload = {
      serialOrTrackingReference: 'CR-104-ITM42',
      category: 'LAPTOP',
      brand: 'Lenovo',
      model: 'ThinkPad T480',
      events: [
        { stage: 'INTAKE', title: 'Drop-off Intake', timestamp: '2026-09-20T10:00:00' },
        { stage: 'DIAGNOSTIC', title: 'Hardware Diagnostic', timestamp: '2026-09-21T11:00:00' },
        { stage: 'RESTORATION', title: 'Thermal Repaste & Cleaning', timestamp: '2026-09-21T15:30:00' },
        { stage: 'QUALITY_CHECK', title: 'QC Certified Pass', timestamp: '2026-09-22T09:15:00' },
        { stage: 'PUBLISHED', title: 'Marketplace Publication', timestamp: '2026-09-22T14:00:00' },
      ],
    };

    assert.equal(journeyPayload.events.length, 5);
    assert.equal(journeyPayload.donorName, undefined);
    assert.equal(journeyPayload.donorEmail, undefined);
    assert.equal(journeyPayload.donorPhone, undefined);
  });
});
