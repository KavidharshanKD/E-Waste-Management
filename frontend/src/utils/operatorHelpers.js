/**
 * Operator Workflow Helpers
 * Module 9F — Operator Workflow + Refurbishment + QC + Marketplace Approval
 */

/**
 * Checks if a restoration job is eligible to undergo physical quality control.
 * Invariant: Only COMPLETED restoration jobs can be inspected at the QC station.
 */
export function isQcEligible(job) {
  if (!job) return false;
  return job.status === 'COMPLETED';
}

/**
 * Evaluates whether a quality-checked device qualifies as a circular Marketplace Candidate.
 * Strict Invariant from Backend:
 * Safety test passed == true AND
 * Overall result == PASS AND
 * Technician recommendedForMarketplace == true AND
 * Assessment safetyHazardFound == false
 */
export function isMarketplaceCandidateEligible(assessment, qualityCheck) {
  if (!assessment || !qualityCheck) return false;

  const safetyTestPassed = Boolean(qualityCheck.safetyTestPassed);
  const overallPass = qualityCheck.overallResult === 'PASS';
  const technicianRecommended = Boolean(assessment.recommendedForMarketplace);
  const noSafetyHazard = !Boolean(assessment.safetyHazardFound);

  return safetyTestPassed && overallPass && technicianRecommended && noSafetyHazard;
}

/**
 * Validates whether a restoration job can be transitioned from PENDING to IN_PROGRESS.
 */
export function canStartRestoration(job) {
  return Boolean(job && job.status === 'PENDING');
}

/**
 * Validates whether a restoration job can record work / progress to COMPLETED or FAILED.
 */
export function canCompleteRestoration(job) {
  return Boolean(job && job.status === 'IN_PROGRESS');
}

/**
 * Checks if a center marketplace listing draft can be submitted for Admin approval.
 * Only DRAFT or REJECTED listings can be submitted.
 */
export function canSubmitListingForApproval(listing) {
  if (!listing) return false;
  return listing.listingStatus === 'DRAFT' || listing.listingStatus === 'REJECTED';
}

/**
 * Checks if an active listing can be withdrawn by facility or admin.
 */
export function canWithdrawListing(listing) {
  if (!listing) return false;
  return (
    listing.listingStatus === 'PUBLISHED' ||
    listing.listingStatus === 'PENDING_APPROVAL' ||
    listing.listingStatus === 'APPROVED'
  );
}

/**
 * Marketplace Protection Invariant:
 * A listing is ONLY publicly visible and purchasable in the customer marketplace
 * when listingStatus is strictly PUBLISHED and stockStatus is AVAILABLE.
 */
export function isPubliclyVisibleListing(listing) {
  if (!listing) return false;
  return listing.listingStatus === 'PUBLISHED' && listing.stockStatus === 'AVAILABLE';
}

/**
 * Validates seller-entered price.
 * Must be a positive decimal number greater than 0.
 */
export function validateSellingPrice(price) {
  if (price === undefined || price === null || price === '') return false;
  const num = Number(price);
  return !isNaN(num) && num > 0;
}

/**
 * Validates warranty days entered by authorized technician/operator.
 * Must be an integer >= 0.
 */
export function validateWarrantyDays(days) {
  if (days === undefined || days === null || days === '') return false;
  const num = Number(days);
  return !isNaN(num) && Number.isInteger(num) && num >= 0;
}

/**
 * Checks if an operator role has access to specific dashboard operations.
 */
export function hasRoleAccess(userRole, allowedRoles = []) {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
