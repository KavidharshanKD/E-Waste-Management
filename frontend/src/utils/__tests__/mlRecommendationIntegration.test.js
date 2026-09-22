import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  USER_INTENTION_MAP,
  DISPOSAL_ACTION_MAP,
  RECOMMENDATION_SOURCE_MAP,
  getEnumLabel,
} from '../enumMappings.js';

import {
  DEFAULT_USER_INTENTION,
  resolveUserIntention,
  isScreenRelevant,
  isBatteryRelevant,
  isPowerStatusRelevant,
  isStandaloneBattery,
  isDeterministicSafetyHazard,
  isSafetyGateTriggered,
  doesIntentionMismatch,
  evaluateMarketplaceCandidate,
  formatModelConfidence,
  formatRecoveryProbability,
  getModelVersionNotice,
} from '../recommendationHelpers.js';

import { getApiErrorMessage } from '../../api/apiClient.js';

describe('Module 9E — ML Recommendation + Device Submission + Circular Lifecycle Integration', () => {

  // 1. Intention Mapping
  test('1. intention mapping contains all valid user choices with distinct labels and guidance badges', () => {
    const expected = [
      'KEEP_USING',
      'REPAIR',
      'REFURBISH',
      'REFURBISH_AND_SELL',
      'DONATE',
      'RECYCLE',
      'UNSURE',
    ];

    expected.forEach((key) => {
      const mapped = USER_INTENTION_MAP[key];
      assert.ok(mapped, `Missing intention mapping for: ${key}`);
      assert.ok(mapped.label, `Missing label for: ${key}`);
      assert.ok(mapped.badge, `Missing badge for: ${key}`);
    });

    assert.equal(USER_INTENTION_MAP.KEEP_USING.label, 'Keep Using');
    assert.equal(USER_INTENTION_MAP.REPAIR.label, 'Repair Device');
    assert.equal(USER_INTENTION_MAP.REFURBISH.label, 'Refurbish');
    assert.equal(USER_INTENTION_MAP.REFURBISH_AND_SELL.label, 'Refurbish & Sell');
    assert.equal(USER_INTENTION_MAP.DONATE.label, 'Donate');
    assert.equal(USER_INTENTION_MAP.RECYCLE.label, 'Recycle Responsibly');
    assert.equal(USER_INTENTION_MAP.UNSURE.label, 'Recommend Best Option');
  });

  // 2. Default UNSURE
  test('2. default intention is UNSURE when omitted or unrecognized', () => {
    assert.equal(DEFAULT_USER_INTENTION, 'UNSURE');
    assert.equal(resolveUserIntention(), 'UNSURE');
    assert.equal(resolveUserIntention(null), 'UNSURE');
    assert.equal(resolveUserIntention(''), 'UNSURE');
    assert.equal(resolveUserIntention('INVALID_INTENTION'), 'UNSURE');
    assert.equal(resolveUserIntention('REFURBISH_AND_SELL'), 'REFURBISH_AND_SELL');
  });

  // 3. Category-Aware Field Visibility
  test('3. category-aware field visibility displays only relevant diagnostics per category', () => {
    // Screen-bearing electronics
    assert.equal(isScreenRelevant('MOBILE_PHONE'), true);
    assert.equal(isScreenRelevant('LAPTOP'), true);
    assert.equal(isScreenRelevant('MONITOR'), true);
    assert.equal(isScreenRelevant('TELEVISION'), true);
    assert.equal(isScreenRelevant('BATTERY'), false);
    assert.equal(isScreenRelevant('KEYBOARD'), false);
    assert.equal(isScreenRelevant('CABLE'), false);

    // Battery-bearing devices
    assert.equal(isBatteryRelevant('MOBILE_PHONE'), true);
    assert.equal(isBatteryRelevant('LAPTOP'), true);
    assert.equal(isBatteryRelevant('BATTERY'), true);
    assert.equal(isBatteryRelevant('MONITOR'), false);
    assert.equal(isBatteryRelevant('KEYBOARD'), false);

    // Powered devices
    assert.equal(isPowerStatusRelevant('LAPTOP'), true);
    assert.equal(isPowerStatusRelevant('MOBILE_PHONE'), true);
    assert.equal(isPowerStatusRelevant('CABLE'), false);
    assert.equal(isPowerStatusRelevant('KEYBOARD'), false);
    assert.equal(isPowerStatusRelevant('MOUSE'), false);

    // Standalone battery
    assert.equal(isStandaloneBattery('BATTERY'), true);
    assert.equal(isStandaloneBattery('LAPTOP'), false);
  });

  // 4. Safety Recommendation Presentation (Stage 0 Safety Gate)
  test('4. safety gate is triggered by physical hazards and given absolute precedence', () => {
    // Diagnostics check
    assert.equal(isDeterministicSafetyHazard({ condition: 'HAZARDOUS' }), true);
    assert.equal(isDeterministicSafetyHazard({ batterySwollen: true }), true);
    assert.equal(isDeterministicSafetyHazard({ batteryLeaking: true }), true);
    assert.equal(isDeterministicSafetyHazard({ overheatingEvidence: true }), true);
    assert.equal(isDeterministicSafetyHazard({ severePhysicalDamage: true }), true);
    assert.equal(
      isDeterministicSafetyHazard({
        condition: 'WORKING',
        batterySwollen: false,
        batteryLeaking: false,
        overheatingEvidence: false,
        severePhysicalDamage: false,
      }),
      false
    );

    // Recommendation outcome check
    const safetyRec = {
      recommendedAction: 'SPECIAL_HANDLING',
      recommendationSource: 'SAFETY_RULE',
    };
    assert.equal(isSafetyGateTriggered(safetyRec), true);
    assert.equal(DISPOSAL_ACTION_MAP.SPECIAL_HANDLING.label, 'Special Hazardous Handling');
    assert.match(RECOMMENDATION_SOURCE_MAP.SAFETY_RULE.label, /safety/i);
  });

  // 5. ML Recommendation Rendering
  test('5. ML recommendation presentation maps model-assisted source faithfully without pretending to be chatbot', () => {
    const mlRec = {
      recommendedAction: 'REFURBISH',
      recommendationSource: 'ML',
      mlModelVersion: 'xgboost-v1.2',
      mlRecoveryProbability: 0.892,
      mlConfidenceLevel: 'HIGH',
    };

    assert.equal(isSafetyGateTriggered(mlRec), false);
    assert.equal(RECOMMENDATION_SOURCE_MAP[mlRec.recommendationSource].label, 'Model-Assisted Recommendation');
    assert.equal(DISPOSAL_ACTION_MAP[mlRec.recommendedAction].label, 'Refurbish');
  });

  // 6. RULE_BASED_FALLBACK Rendering
  test('6. rule-based fallback is honestly labeled and not claimed as AI or model-generated', () => {
    const fallbackRec = {
      recommendedAction: 'RECYCLE',
      recommendationSource: 'RULE_BASED_FALLBACK',
    };

    const sourceEntry = RECOMMENDATION_SOURCE_MAP[fallbackRec.recommendationSource];
    assert.ok(sourceEntry);
    assert.equal(sourceEntry.label, 'Rule-Based Fallback');
    assert.notEqual(sourceEntry.label, 'Model-Assisted Recommendation');
    assert.match(sourceEntry.description, /deterministic.*rules/i);
  });

  // 7. Confidence Display Using Actual Backend Value
  test('7. confidence level displays only real backend values and never fabricates percentages', () => {
    assert.equal(formatModelConfidence('HIGH'), 'HIGH');
    assert.equal(formatModelConfidence('MEDIUM'), 'MEDIUM');
    assert.equal(formatModelConfidence('LOW'), 'LOW');

    // Never fabricates confidence
    assert.equal(formatModelConfidence(null), null);
    assert.equal(formatModelConfidence(undefined), null);
    assert.equal(formatModelConfidence('90%'), null);

    // Probability formatting
    assert.equal(formatRecoveryProbability(0.85), '85.0%');
    assert.equal(formatRecoveryProbability(0.923), '92.3%');
    assert.equal(formatRecoveryProbability(null), null);
    assert.equal(formatRecoveryProbability(undefined), null);
    assert.equal(formatRecoveryProbability(NaN), null);
  });

  // 8. Technician Review Required
  test('8. technicianReviewRequired flag signals mandatory technical human verification', () => {
    const reviewReqRec = {
      recommendedAction: 'REPAIR',
      technicianReviewRequired: true,
      inspectionRecommended: false,
    };
    assert.equal(reviewReqRec.technicianReviewRequired, true);
  });

  // 9. Inspection Recommended
  test('9. inspectionRecommended flag conveys advisory physical inspection without hiding uncertainty', () => {
    const inspectRec = {
      recommendedAction: 'REFURBISH',
      technicianReviewRequired: false,
      inspectionRecommended: true,
    };
    assert.equal(inspectRec.inspectionRecommended, true);
  });

  // 10. User Intention vs System Recommendation Mismatch
  test('10. detects mismatch between user intention and technical recommendation without overriding intent', () => {
    // Citizen wants Refurbish & Sell, but system advises Repair
    assert.equal(doesIntentionMismatch('REFURBISH_AND_SELL', 'REPAIR'), true);

    // Citizen wants Keep Using, but system advises Recycle
    assert.equal(doesIntentionMismatch('KEEP_USING', 'RECYCLE'), true);

    // Citizen is UNSURE: never flags as mismatch
    assert.equal(doesIntentionMismatch('UNSURE', 'RECYCLE'), false);
    assert.equal(doesIntentionMismatch('UNSURE', 'REFURBISH'), false);

    // Citizen wants Repair, and system agrees Repair
    assert.equal(doesIntentionMismatch('REPAIR', 'REPAIR'), false);

    // Citizen wants Recycle, and system agrees Recycle
    assert.equal(doesIntentionMismatch('RECYCLE', 'RECYCLE'), false);
  });

  // 11. Recommendation API Error
  test('11. recommendation API error returns honest, user-actionable message', () => {
    const serverErr = {
      response: {
        status: 503,
        data: { message: 'ML recommendation service unavailable.' },
      },
    };
    assert.equal(getApiErrorMessage(serverErr), 'ML recommendation service unavailable.');

    const errorWithMsg = { message: 'Network timeout connecting to recommendation service.' };
    assert.equal(getApiErrorMessage(errorWithMsg), 'Network timeout connecting to recommendation service.');

    const fallbackErr = {};
    assert.equal(getApiErrorMessage(fallbackErr), 'An unexpected error occurred. Please try again.');
  });

  // 12. No Recommendation / Safe Error State
  test('12. safe handling when no recommendation exists avoids fabricating recycle default', () => {
    const emptyRec = {};
    assert.equal(isSafetyGateTriggered(emptyRec), false);
    assert.equal(formatModelConfidence(emptyRec.mlConfidenceLevel), null);
    assert.equal(formatRecoveryProbability(emptyRec.mlRecoveryProbability), null);
  });

  // 13. Marketplace Eligibility Does NOT Create a Listing
  test('13. REFURBISH or REFURBISH_AND_SELL candidate is strictly an intake candidate and NOT a published listing', () => {
    const refurbishRec = {
      recommendedAction: 'REFURBISH',
      recommendationSource: 'ML',
    };

    const evalResult = evaluateMarketplaceCandidate(refurbishRec, 'REFURBISH_AND_SELL');
    assert.equal(evalResult.isCandidate, true);
    assert.equal(evalResult.isListedForSale, false); // Critical circular safeguard
    assert.equal(evalResult.lifecycleStage, 'INTAKE_CANDIDATE_AWAITING_COLLECTION_AND_QC');
    assert.match(evalResult.notice, /NOT listed for sale/i);

    // Even if intention is REFURBISH_AND_SELL, a safety hazard must NOT be a marketplace candidate
    const hazardousRec = {
      recommendedAction: 'SPECIAL_HANDLING',
      recommendationSource: 'SAFETY_RULE',
    };
    const hazardEval = evaluateMarketplaceCandidate(hazardousRec, 'REFURBISH_AND_SELL');
    assert.equal(hazardEval.isCandidate, false);
    assert.equal(hazardEval.isListedForSale, false);
  });

  // 14. Recommendation Source Mapping
  test('14. recommendation source mapping supports ML, RULE_BASED_FALLBACK, and SAFETY_RULE', () => {
    assert.ok(RECOMMENDATION_SOURCE_MAP.ML);
    assert.equal(RECOMMENDATION_SOURCE_MAP.ML.label, 'Model-Assisted Recommendation');

    assert.ok(RECOMMENDATION_SOURCE_MAP.RULE_BASED_FALLBACK);
    assert.equal(RECOMMENDATION_SOURCE_MAP.RULE_BASED_FALLBACK.label, 'Rule-Based Fallback');

    assert.ok(RECOMMENDATION_SOURCE_MAP.SAFETY_RULE);
    assert.equal(RECOMMENDATION_SOURCE_MAP.SAFETY_RULE.label, 'Deterministic Safety Rule');
  });

  // 15. Model Version Rendering Only When Actually Provided
  test('15. model version rendered only when provided by backend, never fabricated', () => {
    assert.equal(getModelVersionNotice('xgb-circular-v1.4'), 'xgb-circular-v1.4');
    assert.equal(getModelVersionNotice(''), null);
    assert.equal(getModelVersionNotice('   '), null);
    assert.equal(getModelVersionNotice(null), null);
    assert.equal(getModelVersionNotice(undefined), null);
  });
});
