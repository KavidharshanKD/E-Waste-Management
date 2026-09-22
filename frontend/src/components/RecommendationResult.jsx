import React from 'react';
import { Link } from 'react-router-dom';
import {
  DISPOSAL_ACTION_MAP,
  USER_INTENTION_MAP,
  RECOMMENDATION_SOURCE_MAP,
  getEnumLabel,
} from '../utils/enumMappings';
import {
  isSafetyGateTriggered,
  doesIntentionMismatch,
  evaluateMarketplaceCandidate,
} from '../utils/recommendationHelpers';

/**
 * Reusable recommendation result component presenting explainable ML / rule-based / safety
 * decision support while upholding safety gate precedence, human inspection requirements,
 * user intention vs. recommendation contrast, and circular marketplace protection.
 */
export default function RecommendationResult({ request, onAddAnother, showActions = true }) {
  if (!request) return null;

  const action = request.recommendedAction;
  const actionInfo = DISPOSAL_ACTION_MAP[action] || {
    label: action ? action.replace(/_/g, ' ') : 'Responsible Recycling',
    badgeClass: 'badge bg-secondary text-white',
    icon: 'bi-recycle',
    color: '#4b5563',
  };

  const isSpecialHandling = isSafetyGateTriggered(request);

  const userIntention = request.userIntention || 'UNSURE';
  const intentionInfo = USER_INTENTION_MAP[userIntention] || {
    label: userIntention ? userIntention.replace(/_/g, ' ') : 'Unsure',
    badge: 'Declared Intent',
  };

  const sourceInfo = RECOMMENDATION_SOURCE_MAP[request.recommendationSource] || {
    label: request.recommendationSource || 'Automated Decision Support',
    badgeClass: 'badge bg-dark text-white',
    description: 'Advisory circular evaluation.',
  };

  // Compare user intention with recommended action
  const intentionDiffers = doesIntentionMismatch(userIntention, action);

  const marketplaceEval = evaluateMarketplaceCandidate(request, userIntention);
  const isRefurbishOrResale = marketplaceEval.isCandidate;

  return (
    <div className="recommendation-result-container py-3">
      {/* 1. CRITICAL SAFETY GATE BANNER (STAGE 0 PRECEDENCE) */}
      {isSpecialHandling && (
        <div className="alert alert-danger p-4 mb-4 border border-danger rounded-0" role="alert">
          <div className="d-flex align-items-center gap-2 mb-2">
            <i className="bi bi-exclamation-octagon-fill fs-3 text-danger" aria-hidden="true"></i>
            <h2 className="h4 text-uppercase fw-bold text-danger m-0">
              STAGE 0 SAFETY GATE TRIGGERED — SPECIAL HANDLING REQUIRED
            </h2>
          </div>
          <p className="small mb-2 text-dark" style={{ lineHeight: '1.6' }}>
            <strong>Hazard Precedence Notice:</strong> Physical diagnostics indicate swelling, leaking, severe physical damage, or overheating hazards. 
            Deterministic safety rules take absolute precedence over normal circular reuse, repair, or refurbishment pathways to protect handlers, transit couriers, and facilities.
          </p>
          <div className="extra-small text-danger fw-bold text-uppercase">
            • Do NOT attempt to charge, test, or puncture this equipment.<br />
            • Keep stored in a dry, ventilated area away from flammable materials until collected.
          </div>
        </div>
      )}

      {/* 2. MAIN RECOMMENDATION OUTCOME DISPLAY */}
      <div className={`p-4 p-md-5 border ${isSpecialHandling ? 'border-danger bg-light' : 'border-dark bg-white'} mb-4`}>
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div className="editorial-tag m-0">
            CIRCULAR RECOVERY ADVISORY • {sourceInfo.label}
          </div>
          <span className={sourceInfo.badgeClass}>
            {sourceInfo.label}
          </span>
        </div>

        <div className="row g-4 align-items-center">
          <div className="col-12 col-lg-8">
            <div className="text-muted extra-small text-uppercase fw-bold mb-1">
              Authoritative Recommendation
            </div>
            <h1 className={`display-hero-title mb-3 ${isSpecialHandling ? 'text-danger' : 'text-dark'}`} style={{ fontSize: 'clamp(1.9rem, 3.8vw, 2.8rem)' }}>
              {actionInfo.label.toUpperCase()}
            </h1>

            <p className="fs-6 text-secondary mb-4" style={{ lineHeight: '1.6' }}>
              {request.recommendationExplanation || request.mlExplanation || 'Based on age, physical diagnostics, and circular material recovery rules, this equipment will be directed to an authorized processing facility.'}
            </p>

            {/* Handling Advice Section */}
            {request.handlingAdvice && (
              <div className="p-3 bg-light border border-secondary border-opacity-25 mb-4">
                <div className="fw-bold text-dark extra-small text-uppercase mb-1">
                  <i className="bi bi-box-seam me-1"></i> Recommended Handling Advice
                </div>
                <div className="small text-secondary" style={{ lineHeight: '1.5' }}>
                  {request.handlingAdvice}
                </div>
              </div>
            )}
          </div>

          {/* Technical Diagnostics Metadata Column */}
          <div className="col-12 col-lg-4">
            <div className="p-3.5 border border-secondary border-opacity-15 bg-light">
              <div className="fw-bold text-dark text-uppercase extra-small mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                TECHNICAL AUDIT METADATA
              </div>

              <div className="d-flex flex-column gap-2 small text-secondary">
                <div className="d-flex justify-content-between">
                  <span>Source:</span>
                  <strong className="text-dark">{request.recommendationSource || 'RULE_BASED_FALLBACK'}</strong>
                </div>

                {request.mlModelVersion && (
                  <div className="d-flex justify-content-between">
                    <span>Model Version:</span>
                    <strong className="text-dark font-monospace">{request.mlModelVersion}</strong>
                  </div>
                )}

                {request.mlConfidenceLevel && (
                  <div className="d-flex justify-content-between">
                    <span>Confidence Level:</span>
                    <span className={`badge ${request.mlConfidenceLevel === 'HIGH' ? 'bg-success' : request.mlConfidenceLevel === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-secondary'} px-2 py-0.5 extra-small`}>
                      {request.mlConfidenceLevel}
                    </span>
                  </div>
                )}

                {typeof request.mlRecoveryProbability === 'number' && (
                  <div className="d-flex justify-content-between">
                    <span>Recovery Probability:</span>
                    <strong className="text-dark">
                      {(request.mlRecoveryProbability * 100).toFixed(1)}%
                    </strong>
                  </div>
                )}

                {request.mlRecoveryStatus && (
                  <div className="d-flex justify-content-between">
                    <span>Recovery Status:</span>
                    <strong className="text-dark">{request.mlRecoveryStatus}</strong>
                  </div>
                )}

                {request.technicianReviewRequired && (
                  <div className="mt-2 pt-2 border-top border-secondary border-opacity-15">
                    <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1 extra-small">
                      <i className="bi bi-wrench"></i> Technician Review Required
                    </span>
                  </div>
                )}

                {request.inspectionRecommended && (
                  <div className="mt-1">
                    <span className="badge bg-secondary text-white d-inline-flex align-items-center gap-1 extra-small">
                      <i className="bi bi-clipboard-check"></i> Physical Inspection Recommended
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. USER INTENTION VS SYSTEM RECOMMENDATION CONTRAST */}
      <div className="p-4 border border-secondary border-opacity-15 bg-white mb-4">
        <h3 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
          PREFERENCE VS. SYSTEM DECISION COMPARISON
        </h3>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="p-3 bg-light border border-secondary border-opacity-15 h-100">
              <div className="extra-small text-muted text-uppercase fw-bold mb-1">
                Your Declared Preference
              </div>
              <div className="h5 text-dark fw-bold mb-1">
                {intentionInfo.label}
              </div>
              <div className="extra-small text-muted">
                {userIntention === 'UNSURE'
                  ? 'You requested automated recommendation without fixed prior intent.'
                  : 'Declared citizen intention at intake. Intention is advisory and does not dictate technical feasibility.'}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3 bg-light border border-secondary border-opacity-15 h-100">
              <div className="extra-small text-muted text-uppercase fw-bold mb-1">
                System Advisory Outcome
              </div>
              <div className={`h5 fw-bold mb-1 ${isSpecialHandling ? 'text-danger' : 'text-success'}`}>
                {actionInfo.label}
              </div>
              <div className="extra-small text-muted">
                {intentionDiffers
                  ? `Your preference was "${intentionInfo.label}", but physical diagnostics indicate "${actionInfo.label}" is the environmentally & structurally optimal path.`
                  : 'System evaluation aligns with your declared circular preference.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CIRCULAR MARKETPLACE LIFECYCLE SAFEGUARD */}
      {isRefurbishOrResale && !isSpecialHandling && (
        <div className="p-3.5 bg-light border border-secondary border-opacity-25 mb-4 small text-secondary">
          <div className="d-flex align-items-center gap-2 mb-2">
            <i className="bi bi-shield-check text-emerald fs-5"></i>
            <span className="fw-bold text-dark text-uppercase small">
              Refurbished Marketplace Eligibility Pathway
            </span>
          </div>
          <p className="extra-small text-muted mb-2" style={{ lineHeight: '1.5' }}>
            Recommended for refurbishment and resale consideration. <strong>Notice:</strong> Your equipment is <strong>NOT</strong> listed for sale at this stage.
            Refurbished marketplace publishing requires rigorous physical custody: Doorstep Collection → Facility Receipt → Technician Assessment → Component Renewal → Quality Check (PASS) → Recycler Draft → Admin Review.
          </p>
          <div className="extra-small text-dark fw-semibold">
            Status: Candidate for secondary-life inspection upon collection.
          </div>
        </div>
      )}

      {/* 5. NAVIGATION / WORKFLOW ACTION BUTTONS */}
      {showActions && (
        <div className="d-flex flex-wrap gap-3 pt-2">
          <Link to={`/user/requests/${request.id}`} className="btn btn-primary-custom py-2 px-4">
            View Request Audit Stream ↗
          </Link>

          {onAddAnother && (
            <button type="button" onClick={onAddAnother} className="btn btn-outline-custom py-2 px-4">
              Add Another Device ↗
            </button>
          )}

          <Link to="/user/requests" className="btn btn-outline-secondary py-2 px-4">
            My Requests
          </Link>
        </div>
      )}
    </div>
  );
}
