import React from 'react'

const ACTION_CONFIG = {
  REUSE: {
    title: 'Recommended Action: REUSE',
    badgeClass: 'bg-success text-white',
    icon: 'bi-arrow-repeat',
    borderClass: 'border-success',
    gradientBg: 'rgba(16, 185, 129, 0.12)',
  },
  DONATE: {
    title: 'Recommended Action: DONATE',
    badgeClass: 'bg-primary text-white',
    icon: 'bi-heart-fill',
    borderClass: 'border-primary',
    gradientBg: 'rgba(59, 130, 246, 0.12)',
  },
  REPAIR: {
    title: 'Recommended Action: REPAIR',
    badgeClass: 'bg-warning text-dark',
    icon: 'bi-tools',
    borderClass: 'border-warning',
    gradientBg: 'rgba(245, 158, 11, 0.12)',
  },
  REFURBISH: {
    title: 'Recommended Action: REFURBISH',
    badgeClass: 'bg-purple text-white',
    icon: 'bi-gear-wide-connected',
    borderClass: 'border-purple',
    gradientBg: 'rgba(168, 85, 247, 0.12)',
  },
  RECYCLE: {
    title: 'Recommended Action: RECYCLE',
    badgeClass: 'bg-info text-white',
    icon: 'bi-recycle',
    borderClass: 'border-info',
    gradientBg: 'rgba(6, 182, 212, 0.12)',
  },
  SPECIAL_HANDLING: {
    title: 'Recommended Action: SPECIAL HANDLING',
    badgeClass: 'bg-danger text-white',
    icon: 'bi-exclamation-triangle-fill',
    borderClass: 'border-danger',
    gradientBg: 'rgba(239, 68, 68, 0.15)',
  },
}

export default function RecommendationCard({ action, explanation, handlingAdvice, disclaimer }) {
  const config = ACTION_CONFIG[action] || ACTION_CONFIG.RECYCLE

  return (
    <div
      className={`rounded-4 p-4 mb-4 border ${config.borderClass} shadow-lg position-relative overflow-hidden`}
      style={{ background: config.gradientBg, backdropFilter: 'blur(12px)' }}
    >
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <span className="hero-tag mb-0">⚡ Smart Recommendation Engine</span>
        <span className={`badge px-3 py-2 rounded-pill font-weight-bold uppercase fs-6 ${config.badgeClass}`}>
          <i className={`bi ${config.icon} me-1.5`}></i> {action || 'RECYCLE'}
        </span>
      </div>

      <div className="mb-3">
        <h6 className="text-white font-weight-bold mb-1">
          <i className="bi bi-chat-quote-fill me-2 text-warning"></i> Recommendation Explanation:
        </h6>
        <p className="text-white opacity-90 m-0 font-weight-medium" style={{ lineHeight: '1.6' }}>
          "{explanation || 'The device meets standard evaluation criteria for environmental handling.'}"
        </p>
      </div>

      {handlingAdvice && (
        <div className="p-3 bg-dark bg-opacity-60 rounded-3 border border-secondary border-opacity-25 mb-3">
          <h6 className="text-info font-weight-bold mb-1 small">
            <i className="bi bi-shield-check me-1"></i> Handling &amp; Safety Advice:
          </h6>
          <p className="text-muted extra-small m-0">{handlingAdvice}</p>
        </div>
      )}

      <div className="text-muted extra-small font-italic border-top border-secondary border-opacity-25 pt-2 mt-2">
        <i className="bi bi-info-circle me-1"></i>
        {disclaimer || 'Notice: This automated recommendation is advisory and does not replace professional recycling facility inspection.'}
      </div>
    </div>
  )
}
