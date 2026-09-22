import React from 'react'
import {
  EWASTE_CATEGORY_MAP,
  COSMETIC_GRADE_MAP,
  getEnumLabel,
} from '../../utils/enumMappings'
import { formatIndianDate } from '../../utils/workflowHelpers'

export default function ProductSpecifications({ listing }) {
  if (!listing) return null

  const gradeInfo = COSMETIC_GRADE_MAP[listing.cosmeticGrade] || {
    label: listing.cosmeticGrade,
    description: '',
  }

  const specs = [
    { label: 'Brand', value: listing.brand },
    { label: 'Model', value: listing.model },
    { label: 'Equipment Category', value: getEnumLabel(EWASTE_CATEGORY_MAP, listing.category) },
    {
      label: 'Cosmetic Grading',
      value: gradeInfo.label,
      subtext: gradeInfo.description,
    },
    {
      label: 'Operational Warranty',
      value: listing.warrantyDays > 0 ? `${listing.warrantyDays} Days Replacement / Repair` : 'No Extended Warranty',
    },
    {
      label: 'Processing Facility Hub',
      value: listing.centerName
        ? `${listing.centerName} (${[listing.centerCity, listing.centerState].filter(Boolean).join(', ')})`
        : 'Authorized Circular Processing Facility',
    },
    {
      label: 'Catalog Verification Date',
      value: listing.publishedAt ? formatIndianDate(listing.publishedAt) : 'Recent Verification',
    },
  ].filter((s) => s.value)

  return (
    <div className="product-specifications-container my-4">
      <h3 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
        TECHNICAL IDENTIFICATION &amp; PROVENANCE
      </h3>

      <div className="d-flex flex-column">
        {specs.map((spec, idx) => (
          <div
            key={idx}
            className="d-flex justify-content-between align-items-baseline py-2.5 border-bottom border-secondary border-opacity-15 flex-wrap gap-2"
          >
            <span className="small text-uppercase fw-bold text-muted" style={{ minWidth: '160px' }}>
              {spec.label}
            </span>
            <div className="text-end text-sm-start flex-grow-1">
              <span className="small fw-bold text-dark">{spec.value}</span>
              {spec.subtext && <div className="extra-small text-muted">{spec.subtext}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
