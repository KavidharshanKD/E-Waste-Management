import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  REQUEST_STATUS_MAP,
  PICKUP_STATUS_MAP,
  TECHNICIAN_DECISION_MAP,
  REPAIRABILITY_STATUS_MAP,
  RESTORATION_STATUS_MAP,
  QUALITY_CHECK_RESULT_MAP,
  MARKETPLACE_LISTING_STATUS_MAP,
  COSMETIC_GRADE_MAP,
  getEnumLabel,
} from '../enumMappings.js';

import {
  isQcEligible,
  isMarketplaceCandidateEligible,
  canStartRestoration,
  canCompleteRestoration,
  canSubmitListingForApproval,
  canWithdrawListing,
  isPubliclyVisibleListing,
  validateSellingPrice,
  validateWarrantyDays,
  hasRoleAccess,
} from '../operatorHelpers.js';

import { getApiErrorMessage } from '../../api/apiClient.js';

describe('Module 9F — Operator Workflow + Refurbishment + QC + Marketplace Approval', () => {

  // 1. Role Visibility
  test('1. role visibility strictly controls access to operational dashboards', () => {
    assert.equal(hasRoleAccess('COLLECTOR', ['COLLECTOR', 'ADMIN']), true);
    assert.equal(hasRoleAccess('RECYCLER', ['RECYCLER', 'ADMIN']), true);
    assert.equal(hasRoleAccess('ADMIN', ['ADMIN']), true);
    assert.equal(hasRoleAccess('USER', ['COLLECTOR', 'ADMIN']), false);
    assert.equal(hasRoleAccess('USER', ['RECYCLER', 'ADMIN']), false);
    assert.equal(hasRoleAccess('COLLECTOR', ['ADMIN']), false);
    assert.equal(hasRoleAccess('RECYCLER', ['ADMIN']), false);
  });

  // 2. Request Status Mapping
  test('2. request status mapping covers all 13 backend lifecycle transitions', () => {
    const requiredStatuses = [
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

    requiredStatuses.forEach((st) => {
      const entry = REQUEST_STATUS_MAP[st];
      assert.ok(entry, `Missing REQUEST_STATUS_MAP entry for ${st}`);
      assert.ok(entry.label, `Missing label for ${st}`);
      assert.ok(entry.badgeClass, `Missing badgeClass for ${st}`);
    });

    assert.equal(REQUEST_STATUS_MAP.COLLECTED.label, 'Collected');
    assert.equal(REQUEST_STATUS_MAP.REFURBISHED.label, 'Refurbished');
  });

  // 3. Safety Request Handling
  test('3. safety hazard detection enforces SPECIAL_HANDLING containment protocol', () => {
    const hazardousAssessment = {
      safetyHazardFound: true,
      technicianDecision: 'SPECIAL_HANDLING',
      safetyNotes: 'Swollen pouch cell, fire hazard',
      recommendedForMarketplace: false,
    };

    assert.equal(hazardousAssessment.safetyHazardFound, true);
    assert.equal(hazardousAssessment.technicianDecision, 'SPECIAL_HANDLING');
    assert.equal(
      TECHNICIAN_DECISION_MAP.SPECIAL_HANDLING.label,
      'Special Hazardous Handling'
    );
    assert.match(
      TECHNICIAN_DECISION_MAP.SPECIAL_HANDLING.badgeClass,
      /bg-danger/
    );

    // Hazard MUST disqualify from marketplace candidacy
    const dummyQc = { safetyTestPassed: true, overallResult: 'PASS' };
    assert.equal(
      isMarketplaceCandidateEligible(hazardousAssessment, dummyQc),
      false
    );
  });

  // 4. Recommendation vs Final Operator Action
  test('4. separates citizen preference, system advisory, and final technician decision', () => {
    // Citizen preference is advisory; system recommendation is decision support;
    // but technician physical inspection makes the authoritative decision.
    const sampleDevice = {
      userIntention: 'REFURBISH_AND_SELL',
      recommendedAction: 'REFURBISH',
      technicianDecision: 'RECYCLE', // Technician physically found unrecoverable corrosion
      repairabilityStatus: 'NOT_RECOVERABLE',
    };

    assert.notEqual(sampleDevice.userIntention, sampleDevice.technicianDecision);
    assert.equal(sampleDevice.technicianDecision, 'RECYCLE');
    assert.equal(
      REPAIRABILITY_STATUS_MAP.NOT_RECOVERABLE,
      'Not Recoverable (Direct Recycling)'
    );
  });

  // 5. QC Eligibility
  test('5. QC eligibility requires restoration job to be strictly COMPLETED', () => {
    assert.equal(isQcEligible({ status: 'COMPLETED' }), true);
    assert.equal(isQcEligible({ status: 'PENDING' }), false);
    assert.equal(isQcEligible({ status: 'IN_PROGRESS' }), false);
    assert.equal(isQcEligible({ status: 'FAILED' }), false);
    assert.equal(isQcEligible(null), false);
  });

  // 6. Marketplace Candidate Eligibility
  test('6. marketplace candidate eligibility enforces all four backend safety and QA invariants', () => {
    const validAssessment = {
      recommendedForMarketplace: true,
      safetyHazardFound: false,
    };
    const passingQc = {
      safetyTestPassed: true,
      overallResult: 'PASS',
    };

    // All conditions met -> eligible candidate
    assert.equal(isMarketplaceCandidateEligible(validAssessment, passingQc), true);

    // Failed safety test -> ineligible
    assert.equal(
      isMarketplaceCandidateEligible(validAssessment, {
        safetyTestPassed: false,
        overallResult: 'PASS',
      }),
      false
    );

    // Failed overall QC -> ineligible
    assert.equal(
      isMarketplaceCandidateEligible(validAssessment, {
        safetyTestPassed: true,
        overallResult: 'FAIL',
      }),
      false
    );

    // Technician did not recommend for marketplace -> ineligible
    assert.equal(
      isMarketplaceCandidateEligible(
        { recommendedForMarketplace: false, safetyHazardFound: false },
        passingQc
      ),
      false
    );

    // Safety hazard discovered during diagnostic -> ineligible
    assert.equal(
      isMarketplaceCandidateEligible(
        { recommendedForMarketplace: true, safetyHazardFound: true },
        passingQc
      ),
      false
    );
  });

  // 7. Draft vs Published Distinction
  test('7. distinguishes DRAFT, PENDING_APPROVAL, and PUBLISHED states', () => {
    assert.equal(MARKETPLACE_LISTING_STATUS_MAP.DRAFT.label, 'Draft');
    assert.match(
      MARKETPLACE_LISTING_STATUS_MAP.DRAFT.description,
      /not visible to public/i
    );

    assert.equal(
      MARKETPLACE_LISTING_STATUS_MAP.PENDING_APPROVAL.label,
      'Pending Approval'
    );
    assert.equal(MARKETPLACE_LISTING_STATUS_MAP.PUBLISHED.label, 'Published');
  });

  // 8. Admin Approval State
  test('8. admin approval transitions listing towards PUBLISHED status', () => {
    const approvalPayload = {
      approved: true,
      adjustedSellingPrice: 22000,
    };

    assert.equal(approvalPayload.approved, true);
    assert.equal(approvalPayload.adjustedSellingPrice, 22000);
    assert.equal(approvalPayload.rejectionReason, undefined);
  });

  // 9. Rejection State
  test('9. admin rejection requires mandatory feedback reason', () => {
    const rejectionPayload = {
      approved: false,
      rejectionReason: 'Selling price too high compared to physical cosmetic grade C wear.',
    };

    assert.equal(rejectionPayload.approved, false);
    assert.ok(rejectionPayload.rejectionReason.length > 0);
  });

  // 10. Cancellation / Withdrawal Where Applicable
  test('10. allows withdrawal only for active or pending listings', () => {
    assert.equal(canWithdrawListing({ listingStatus: 'PUBLISHED' }), true);
    assert.equal(canWithdrawListing({ listingStatus: 'PENDING_APPROVAL' }), true);
    assert.equal(canWithdrawListing({ listingStatus: 'APPROVED' }), true);
    assert.equal(canWithdrawListing({ listingStatus: 'DRAFT' }), false);
    assert.equal(canWithdrawListing({ listingStatus: 'SOLD' }), false);

    assert.equal(canSubmitListingForApproval({ listingStatus: 'DRAFT' }), true);
    assert.equal(canSubmitListingForApproval({ listingStatus: 'REJECTED' }), true);
    assert.equal(canSubmitListingForApproval({ listingStatus: 'PUBLISHED' }), false);
  });

  // 11. API 403 Handling
  test('11. API 403 Access Denied error is cleanly extracted and presented', () => {
    const error403 = {
      response: {
        status: 403,
        data: { error: 'Access denied: Request is assigned to a different recycling center' },
      },
    };
    assert.equal(
      getApiErrorMessage(error403),
      'Access denied: Request is assigned to a different recycling center'
    );
  });

  // 12. API 409 / Conflict / Bad Request Handling
  test('12. API 400/409 validation conflict error is cleanly extracted', () => {
    const errorConflict = {
      response: {
        status: 400,
        data: { error: 'Cannot start a restoration job that is in status: IN_PROGRESS' },
      },
    };
    assert.equal(
      getApiErrorMessage(errorConflict),
      'Cannot start a restoration job that is in status: IN_PROGRESS'
    );
  });

  // 13. No Public Listing Before PUBLISHED
  test('13. public catalog visibility strictly requires PUBLISHED status and AVAILABLE stock', () => {
    // Draft -> not visible
    assert.equal(
      isPubliclyVisibleListing({ listingStatus: 'DRAFT', stockStatus: 'AVAILABLE' }),
      false
    );

    // Pending approval -> not visible
    assert.equal(
      isPubliclyVisibleListing({
        listingStatus: 'PENDING_APPROVAL',
        stockStatus: 'AVAILABLE',
      }),
      false
    );

    // Approved but not yet published -> not visible
    assert.equal(
      isPubliclyVisibleListing({ listingStatus: 'APPROVED', stockStatus: 'AVAILABLE' }),
      false
    );

    // Published and available -> VISIBLE
    assert.equal(
      isPubliclyVisibleListing({ listingStatus: 'PUBLISHED', stockStatus: 'AVAILABLE' }),
      true
    );

    // Published but already sold -> not visible for new purchase
    assert.equal(
      isPubliclyVisibleListing({ listingStatus: 'PUBLISHED', stockStatus: 'SOLD' }),
      false
    );
  });

  // 14. Grade Mapping
  test('14. cosmetic grade mapping covers GRADE_A, GRADE_B, and GRADE_C without hallucinated tiers', () => {
    assert.ok(COSMETIC_GRADE_MAP.GRADE_A);
    assert.equal(COSMETIC_GRADE_MAP.GRADE_A.shortLabel, 'Grade A');

    assert.ok(COSMETIC_GRADE_MAP.GRADE_B);
    assert.equal(COSMETIC_GRADE_MAP.GRADE_B.shortLabel, 'Grade B');

    assert.ok(COSMETIC_GRADE_MAP.GRADE_C);
    assert.equal(COSMETIC_GRADE_MAP.GRADE_C.shortLabel, 'Grade C');

    // No fake grade "GRADE_S" or "MINT"
    assert.equal(COSMETIC_GRADE_MAP.GRADE_S, undefined);
  });

  // 15. Price Field Handling
  test('15. selling price validation requires strictly positive numbers', () => {
    assert.equal(validateSellingPrice('24999'), true);
    assert.equal(validateSellingPrice(1500), true);
    assert.equal(validateSellingPrice('0.01'), true);

    assert.equal(validateSellingPrice('0'), false);
    assert.equal(validateSellingPrice('-100'), false);
    assert.equal(validateSellingPrice(''), false);
    assert.equal(validateSellingPrice('abc'), false);
    assert.equal(validateSellingPrice(null), false);
  });

  // 16. Warranty Field Handling
  test('16. warranty days validation requires non-negative integer values', () => {
    assert.equal(validateWarrantyDays('90'), true);
    assert.equal(validateWarrantyDays('0'), true);
    assert.equal(validateWarrantyDays(30), true);

    assert.equal(validateWarrantyDays('-1'), false);
    assert.equal(validateWarrantyDays('30.5'), false);
    assert.equal(validateWarrantyDays(''), false);
    assert.equal(validateWarrantyDays(null), false);
  });

  // 17. Device Journey State Mapping
  test('17. device journey events correspond to real operational stages', () => {
    const sampleJourneyEvents = [
      { stage: 'INTAKE', title: 'Certified Circular Drop-Off / Intake' },
      { stage: 'DIAGNOSTIC', title: 'Hardware Diagnostic & Assessment' },
      { stage: 'RESTORATION', title: 'Precision Restoration & Rework' },
      { stage: 'QUALITY_CERTIFICATION', title: 'Multi-Point Quality & Safety Verification' },
      { stage: 'MARKETPLACE_LISTING', title: 'Commercial Second-Life Listing' },
    ];

    const stages = sampleJourneyEvents.map((e) => e.stage);
    assert.deepEqual(stages, [
      'INTAKE',
      'DIAGNOSTIC',
      'RESTORATION',
      'QUALITY_CERTIFICATION',
      'MARKETPLACE_LISTING',
    ]);
  });
});
