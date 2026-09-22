import React from 'react'

export default function ProductCondition({ listing }) {
  if (!listing) return null

  const hasCondition = Boolean(listing.conditionSummary)
  const hasTechnical = Boolean(listing.technicalSummary)
  const hasWork = Boolean(listing.workPerformedSummary)
  const hasParts = Boolean(listing.partsReplacedSummary)

  if (!hasCondition && !hasTechnical && !hasWork && !hasParts) {
    return null
  }

  return (
    <div className="product-condition-container my-4">
      <h3 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
        REFURBISHMENT &amp; QUALITY-CHECK REPORT
      </h3>

      <div className="row g-3">
        {hasCondition && (
          <div className="col-12 col-md-6">
            <div className="p-3 bg-white border border-secondary border-opacity-25 h-100">
              <div className="d-flex align-items-center gap-1.5 text-uppercase small fw-bold text-dark mb-1">
                <i className="bi bi-eye text-muted"></i> Physical Condition Summary
              </div>
              <p className="small text-secondary m-0" style={{ lineHeight: '1.6' }}>
                {listing.conditionSummary}
              </p>
            </div>
          </div>
        )}

        {hasTechnical && (
          <div className="col-12 col-md-6">
            <div className="p-3 bg-white border border-secondary border-opacity-25 h-100">
              <div className="d-flex align-items-center gap-1.5 text-uppercase small fw-bold text-dark mb-1">
                <i className="bi bi-check2-circle text-emerald"></i> Technical Diagnostics
              </div>
              <p className="small text-secondary m-0" style={{ lineHeight: '1.6' }}>
                {listing.technicalSummary}
              </p>
            </div>
          </div>
        )}

        {hasWork && (
          <div className="col-12 col-md-6">
            <div className="p-3 bg-white border border-secondary border-opacity-25 h-100">
              <div className="d-flex align-items-center gap-1.5 text-uppercase small fw-bold text-dark mb-1">
                <i className="bi bi-tools text-muted"></i> Servicing Work Performed
              </div>
              <p className="small text-secondary m-0" style={{ lineHeight: '1.6' }}>
                {listing.workPerformedSummary}
              </p>
            </div>
          </div>
        )}

        {hasParts && (
          <div className="col-12 col-md-6">
            <div className="p-3 bg-white border border-secondary border-opacity-25 h-100">
              <div className="d-flex align-items-center gap-1.5 text-uppercase small fw-bold text-dark mb-1">
                <i className="bi bi-cpu text-muted"></i> Parts Replaced
              </div>
              <p className="small text-secondary m-0" style={{ lineHeight: '1.6' }}>
                {listing.partsReplacedSummary}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
