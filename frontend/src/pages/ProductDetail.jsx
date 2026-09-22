import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { marketplaceApi, cartApi, getApiErrorMessage } from '../api/apiClient'
import { useAuth } from '../context/AuthContext'
import {
  COSMETIC_GRADE_MAP,
  MARKETPLACE_STOCK_STATUS_MAP,
  EWASTE_CATEGORY_MAP,
  getEnumLabel,
} from '../utils/enumMappings'
import { formatCurrency } from '../utils/workflowHelpers'
import ProductGallery from '../components/marketplace/ProductGallery'
import ProductSpecifications from '../components/marketplace/ProductSpecifications'
import ProductCondition from '../components/marketplace/ProductCondition'
import DeviceJourneyTimeline from '../components/marketplace/DeviceJourneyTimeline'
import MarketplaceLoading from '../components/marketplace/MarketplaceLoading'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [listing, setListing] = useState(null)
  const [deviceJourney, setDeviceJourney] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add to cart state
  const [addingCart, setAddingCart] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(null)
  const [cartError, setCartError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadListingData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch listing details
        const detailRes = await marketplaceApi.getListingDetail(id)
        if (!isMounted) return

        const listingData = detailRes.data
        setListing(listingData)

        // 2. Resolve journey: use embedded journey or fetch standalone journey
        if (listingData.deviceJourney && listingData.deviceJourney.events) {
          setDeviceJourney(listingData.deviceJourney)
        } else {
          try {
            const journeyRes = await marketplaceApi.getDeviceJourney(id)
            if (isMounted) setDeviceJourney(journeyRes.data)
          } catch (jErr) {
            console.warn('Standalone device journey fetch non-critical warning:', jErr)
          }
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load listing details:', err)
        setError(getApiErrorMessage(err, 'Could not locate listing. The item may have been removed or does not exist.'))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadListingData()

    return () => {
      isMounted = false
    }
  }, [id])

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }

    try {
      setAddingCart(true)
      setCartSuccess(null)
      setCartError(null)

      await cartApi.addToCart(listing.id)
      setCartSuccess('This refurbished physical device has been added to your cart.')
    } catch (err) {
      console.error('Add to cart failed:', err)
      setCartError(getApiErrorMessage(err, 'Unable to add item to cart. It may have already been reserved by another buyer.'))
    } finally {
      setAddingCart(false)
    }
  }

  if (loading) {
    return (
      <div className="py-5">
        <MarketplaceLoading message="Loading Device Details &amp; Provenance..." />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="py-5 text-center my-4">
        <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>
          <i className="bi bi-question-diamond"></i>
        </div>
        <h2 className="h3 text-uppercase fw-bold text-dark mb-2">Device Listing Not Found</h2>
        <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '460px' }}>
          {error || 'This listing does not exist or may have been withdrawn from the circular catalog.'}
        </p>
        <Link to="/marketplace" className="btn btn-primary-custom">
          Back to Marketplace ↗
        </Link>
      </div>
    )
  }

  const gradeInfo = COSMETIC_GRADE_MAP[listing.cosmeticGrade] || {
    label: listing.cosmeticGrade,
    badgeClass: 'badge bg-secondary text-white',
    description: '',
  }

  const stockInfo = MARKETPLACE_STOCK_STATUS_MAP[listing.stockStatus] || {
    label: listing.stockStatus,
    dotClass: 'status-dot-neutral',
  }

  const isAvailable = listing.stockStatus === 'AVAILABLE'
  const isSold = listing.stockStatus === 'SOLD'
  const isReserved = listing.stockStatus === 'RESERVED'

  return (
    <div className="product-detail-page py-3">
      {/* Breadcrumb Navigation */}
      <nav className="mb-4 pb-2 border-bottom border-secondary border-opacity-15" aria-label="Breadcrumb">
        <ol className="list-inline m-0 small d-flex flex-wrap align-items-center gap-1.5">
          <li className="list-inline-item">
            <Link to="/" className="text-muted text-decoration-none">Home</Link>
          </li>
          <li className="list-inline-item text-muted">/</li>
          <li className="list-inline-item">
            <Link to="/marketplace" className="text-muted text-decoration-none">Marketplace</Link>
          </li>
          <li className="list-inline-item text-muted">/</li>
          <li className="list-inline-item">
            <span className="text-muted text-uppercase fw-bold">
              {getEnumLabel(EWASTE_CATEGORY_MAP, listing.category)}
            </span>
          </li>
          <li className="list-inline-item text-muted">/</li>
          <li className="list-inline-item text-dark fw-bold text-truncate" style={{ maxWidth: '280px' }} aria-current="page">
            {listing.title}
          </li>
        </ol>
      </nav>

      {/* Main Two-Column Layout */}
      <div className="row g-4 g-lg-5">
        {/* Left Column: Gallery, Condition Report, Journey Timeline */}
        <div className="col-12 col-lg-7">
          <ProductGallery
            images={listing.images}
            title={listing.title}
            category={listing.category}
          />

          {/* Device Description if present */}
          {listing.description && (
            <section className="my-4">
              <h2 className="h6 text-uppercase fw-bold text-dark mb-2 pb-1 border-bottom border-dark">
                DEVICE OVERVIEW
              </h2>
              <p className="text-secondary small" style={{ lineHeight: '1.65' }}>
                {listing.description}
              </p>
            </section>
          )}

          {/* Refurbishment & QC Diagnosis */}
          <ProductCondition listing={listing} />

          {/* Circular Device Journey Timeline */}
          <DeviceJourneyTimeline deviceJourney={deviceJourney} />

          {/* Second-Life Purpose Callout */}
          <div className="p-4 bg-dark text-white my-4">
            <div className="editorial-tag text-emerald mb-2">04 / CIRCULAR REUSE</div>
            <h3 className="h5 text-uppercase fw-bold mb-2">A VERIFIED SECOND LIFE</h3>
            <p className="small text-secondary mb-0" style={{ color: '#a1a7b3', lineHeight: '1.6' }}>
              This physical device entered our circular recovery infrastructure through certified collection. After undergoing multi-point technical diagnosis, component servicing, and certified quality-check verification, it is now offered to prevent unnecessary primary extraction.
            </p>
          </div>
        </div>

        {/* Right Column: Sticky Purchase Box & Technical Specifications */}
        <div className="col-12 col-lg-5">
          <div className="p-4 bg-white border border-secondary border-opacity-25 position-sticky" style={{ top: '80px' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-uppercase small fw-bold text-muted">
                {listing.brand}
              </span>
              <span className="status-dot-item small">
                <span className={`status-dot ${stockInfo.dotClass} me-1`}></span>
                {stockInfo.label}
              </span>
            </div>

            <h1 className="h4 text-uppercase fw-bold text-dark mb-2">
              {listing.title}
            </h1>

            {/* Cosmetic Grade Tag */}
            <div className="mb-3 d-flex align-items-center gap-2">
              <span className={`${gradeInfo.badgeClass} px-2.5 py-1`}>
                {gradeInfo.label}
              </span>
              {listing.warrantyDays > 0 && (
                <span className="small text-emerald fw-bold">
                  <i className="bi bi-shield-check me-0.5"></i> {listing.warrantyDays}-Day Warranty
                </span>
              )}
            </div>

            {/* Price Presentation */}
            <div className="my-3 py-3 border-top border-bottom border-secondary border-opacity-15">
              <div className="d-flex align-items-baseline gap-2">
                <span className="display-6 fw-bold text-dark font-heading">
                  {formatCurrency(listing.sellingPrice)}
                </span>
                {listing.originalReferencePrice && listing.originalReferencePrice > listing.sellingPrice && (
                  <span className="text-muted text-decoration-line-through small">
                    Ref. MRP {formatCurrency(listing.originalReferencePrice)}
                  </span>
                )}
              </div>
              <div className="extra-small text-muted mt-1">
                Inclusive of verified refurbished warranty and facility certification.
              </div>
            </div>

            {/* Cart Feedback Alerts */}
            {cartSuccess && (
              <div className="alert alert-success py-2 px-3 mb-3 small" role="alert">
                <i className="bi bi-check-circle-fill me-1.5"></i> {cartSuccess}
              </div>
            )}

            {cartError && (
              <div className="alert alert-danger py-2 px-3 mb-3 small" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-1.5"></i> {cartError}
              </div>
            )}

            {/* Add to Cart Trigger */}
            <div className="d-grid gap-2 mb-3">
              <button
                type="button"
                className="btn btn-primary-custom py-2.5 w-100 justify-content-center fs-6"
                onClick={handleAddToCart}
                disabled={!isAvailable || addingCart}
                aria-label={
                  isSold
                    ? 'Unit Sold Out'
                    : isReserved
                    ? 'Unit Reserved in Checkout'
                    : `Add ${listing.title} to Cart`
                }
              >
                {addingCart ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Securing Item...
                  </>
                ) : isSold ? (
                  'Unit Permanently Sold'
                ) : isReserved ? (
                  'Reserved in Active Checkout'
                ) : (
                  <>
                    <i className="bi bi-cart-plus me-2"></i> Add to Cart ↗
                  </>
                )}
              </button>

              <Link
                to="/marketplace"
                className="btn btn-outline-custom btn-sm py-2 w-100 text-center"
              >
                ← Back to Catalog
              </Link>
            </div>

            {/* Physical Device Guarantee Notice */}
            <div className="p-2.5 bg-light border border-secondary border-opacity-15 small text-secondary">
              <div className="fw-bold text-dark text-uppercase extra-small mb-1">
                <i className="bi bi-patch-check-fill text-emerald me-1"></i> Unique Physical Unit
              </div>
              <p className="extra-small m-0 text-muted">
                Each listing represents a single, serialized physical piece of equipment inspected by authorized facility technicians.
              </p>
            </div>

            {/* Specifications Summary */}
            <ProductSpecifications listing={listing} />
          </div>
        </div>
      </div>
    </div>
  )
}
