import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  COSMETIC_GRADE_MAP,
  MARKETPLACE_STOCK_STATUS_MAP,
  EWASTE_CATEGORY_MAP,
  getEnumLabel,
} from '../../utils/enumMappings'
import { formatCurrency } from '../../utils/workflowHelpers'

export default function MarketplaceProductCard({ item, onAddToCart, isAdding = false }) {
  const [imgFailed, setImgFailed] = useState(false)

  const gradeInfo = COSMETIC_GRADE_MAP[item.cosmeticGrade] || {
    shortLabel: item.cosmeticGrade,
    badgeClass: 'badge bg-secondary text-white',
  }

  const stockInfo = MARKETPLACE_STOCK_STATUS_MAP[item.stockStatus] || {
    label: item.stockStatus,
    dotClass: 'status-dot-neutral',
  }

  const isAvailable = item.stockStatus === 'AVAILABLE'
  const isSold = item.stockStatus === 'SOLD'
  const isReserved = item.stockStatus === 'RESERVED'

  return (
    <article className="marketplace-item-card d-flex flex-column h-100 pb-3 border-bottom border-secondary border-opacity-25">
      {/* Product Image / Placeholder */}
      <Link
        to={`/marketplace/${item.id}`}
        className="marketplace-img-wrap d-block position-relative overflow-hidden mb-3 text-center"
        style={{
          backgroundColor: '#eae8e1',
          aspectRatio: '4/3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={`View details for ${item.title}`}
      >
        {item.primaryImageUrl && !imgFailed ? (
          <img
            src={item.primaryImageUrl}
            alt={`${item.brand || ''} ${item.model || item.title}`}
            className="w-100 h-100 object-fit-cover"
            onError={() => setImgFailed(true)}
            loading="lazy"
          />
        ) : (
          <div className="text-muted p-4 d-flex flex-column align-items-center justify-content-center">
            <i className="bi bi-cpu fs-1 mb-1 text-secondary opacity-50"></i>
            <span className="small text-uppercase fw-bold opacity-75 letter-spacing-1">
              {getEnumLabel(EWASTE_CATEGORY_MAP, item.category, 'Hardware')}
            </span>
          </div>
        )}

        {/* Stock Status Dot */}
        <div className="position-absolute top-0 start-0 m-2">
          <span className="status-dot-item px-2 py-1 bg-white bg-opacity-90 border border-secondary border-opacity-25 small">
            <span className={`status-dot ${stockInfo.dotClass} me-1`}></span>
            {stockInfo.label}
          </span>
        </div>

        {/* Cosmetic Grade Badge */}
        <div className="position-absolute top-0 end-0 m-2">
          <span className={`${gradeInfo.badgeClass} px-2 py-1`}>
            {gradeInfo.shortLabel}
          </span>
        </div>
      </Link>

      {/* Product Content Details */}
      <div className="d-flex flex-column flex-grow-1">
        <div className="d-flex justify-content-between align-items-baseline gap-2 mb-1">
          <span className="text-uppercase small fw-bold text-muted">
            {item.brand || 'Hardware'}
          </span>
          {item.warrantyDays > 0 && (
            <span className="small text-emerald fw-bold">
              <i className="bi bi-shield-check me-0.5"></i> {item.warrantyDays}d Warranty
            </span>
          )}
        </div>

        <h3 className="h6 text-uppercase fw-bold mb-2 line-clamp-2">
          <Link to={`/marketplace/${item.id}`} className="text-dark text-decoration-none">
            {item.title}
          </Link>
        </h3>

        {/* Facility Origin */}
        <div className="small text-secondary mb-3">
          <i className="bi bi-geo-alt me-1 text-muted"></i>
          {item.centerCity ? `${item.centerCity} Facility` : (item.centerName || 'Verified Hub')}
        </div>

        {/* Price & Action Area */}
        <div className="mt-auto pt-2 border-top border-secondary border-opacity-10 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div className="fs-5 fw-bold text-dark lh-1">
              {formatCurrency(item.sellingPrice)}
            </div>
            {item.originalReferencePrice && item.originalReferencePrice > item.sellingPrice && (
              <div className="extra-small text-muted text-decoration-line-through">
                Ref. MRP {formatCurrency(item.originalReferencePrice)}
              </div>
            )}
          </div>

          <div className="d-flex align-items-center gap-1.5">
            <Link
              to={`/marketplace/${item.id}`}
              className="btn btn-outline-custom btn-sm py-1 px-2.5"
              aria-label={`Inspect ${item.title}`}
            >
              Inspect ↗
            </Link>

            {onAddToCart && (
              <button
                type="button"
                className="btn btn-primary-custom btn-sm py-1 px-2.5"
                onClick={() => onAddToCart(item.id)}
                disabled={!isAvailable || isAdding}
                aria-label={isSold ? 'Item Sold Out' : isReserved ? 'Reserved in Checkout' : `Add ${item.title} to cart`}
              >
                {isAdding ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : isSold ? (
                  'Sold'
                ) : isReserved ? (
                  'Reserved'
                ) : (
                  <i className="bi bi-cart-plus"></i>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
