/**
 * Recommendation & Circular Lifecycle Helpers
 * Module 9E: ML Recommendation + Device Submission + Circular Lifecycle Integration
 */

export const DEFAULT_USER_INTENTION = 'UNSURE';

/**
 * Validates and normalizes user intention choice.
 * Default is strictly UNSURE if omitted or invalid.
 */
export function resolveUserIntention(intention) {
  const validIntentions = [
    'KEEP_USING',
    'REPAIR',
    'REFURBISH',
    'REFURBISH_AND_SELL',
    'DONATE',
    'RECYCLE',
    'UNSURE',
  ];
  if (intention && validIntentions.includes(intention)) {
    return intention;
  }
  return DEFAULT_USER_INTENTION;
}

/**
 * Category-aware field visibility rules.
 * Keeps intake clean and prevents irrelevant diagnostic fields.
 */
export function isScreenRelevant(category) {
  return ['MOBILE_PHONE', 'LAPTOP', 'MONITOR', 'TELEVISION'].includes(category);
}

export function isBatteryRelevant(category) {
  return ['MOBILE_PHONE', 'LAPTOP', 'BATTERY'].includes(category);
}

export function isPowerStatusRelevant(category) {
  return !['CABLE', 'KEYBOARD', 'MOUSE'].includes(category);
}

export function isStandaloneBattery(category) {
  return category === 'BATTERY';
}

/**
 * Deterministic Safety Gate Check.
 * Matches backend Stage 0 safety precedence rules:
 * HAZARDOUS condition, swollen battery, leaking battery, overheating, or severe physical damage.
 */
export function isDeterministicSafetyHazard(diagnostics = {}) {
  if (diagnostics.condition === 'HAZARDOUS') return true;
  if (diagnostics.batterySwollen === true) return true;
  if (diagnostics.batteryLeaking === true) return true;
  if (diagnostics.overheatingEvidence === true) return true;
  if (diagnostics.severePhysicalDamage === true) return true;
  return false;
}

/**
 * Checks if a recommendation outcome represents a safety rule decision.
 */
export function isSafetyGateTriggered(recommendation = {}) {
  return (
    recommendation.recommendedAction === 'SPECIAL_HANDLING' ||
    recommendation.recommendationSource === 'SAFETY_RULE'
  );
}

/**
 * Checks if the user's declared intention differs from the system technical recommendation.
 */
export function doesIntentionMismatch(userIntention, recommendedAction) {
  if (!userIntention || userIntention === 'UNSURE' || !recommendedAction) {
    return false;
  }

  // Normalize intention to action domain
  if (userIntention === 'KEEP_USING') return recommendedAction !== 'REUSE';
  if (userIntention === 'REPAIR') return recommendedAction !== 'REPAIR';
  if (userIntention === 'REFURBISH' || userIntention === 'REFURBISH_AND_SELL') {
    return recommendedAction !== 'REFURBISH';
  }
  if (userIntention === 'DONATE') return recommendedAction !== 'DONATE';
  if (userIntention === 'RECYCLE') return recommendedAction !== 'RECYCLE';

  return false;
}

/**
 * Circular Marketplace Safeguard:
 * Confirms whether a device is an intake candidate for refurbishment,
 * while asserting that an intake submission NEVER creates a public marketplace listing.
 */
export function evaluateMarketplaceCandidate(recommendation = {}, userIntention = 'UNSURE') {
  const isSpecial = isSafetyGateTriggered(recommendation);
  const action = recommendation.recommendedAction;
  const isCandidate =
    !isSpecial &&
    (action === 'REFURBISH' || userIntention === 'REFURBISH_AND_SELL');

  return {
    isCandidate,
    isListedForSale: false, // Invariant: Intake NEVER creates a published marketplace listing
    lifecycleStage: isCandidate
      ? 'INTAKE_CANDIDATE_AWAITING_COLLECTION_AND_QC'
      : 'STANDARD_DISPOSAL_PATHWAY',
    notice:
      'Recommended for refurbishment and resale evaluation. Notice: Device is NOT listed for sale at intake. Final marketplace eligibility is determined after collection, technical inspection, component renewal, and quality control.',
  };
}

/**
 * Formats model confidence and recovery metrics strictly using backend-supplied values.
 * Never invents, calculates, or fabricates confidence percentages.
 */
export function formatModelConfidence(confidenceLevel) {
  if (!confidenceLevel) return null;
  const valid = ['HIGH', 'MEDIUM', 'LOW'];
  return valid.includes(confidenceLevel) ? confidenceLevel : null;
}

export function formatRecoveryProbability(prob) {
  if (typeof prob !== 'number' || isNaN(prob)) return null;
  return `${(prob * 100).toFixed(1)}%`;
}

export function getModelVersionNotice(modelVersion) {
  if (!modelVersion || typeof modelVersion !== 'string' || !modelVersion.trim()) {
    return null;
  }
  return modelVersion.trim();
}
