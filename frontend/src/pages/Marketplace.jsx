import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { marketplaceApi, cartApi, getApiErrorMessage } from '../api/apiClient'
import { useAuth } from '../context/AuthContext'
import MarketplaceFilters from '../components/marketplace/MarketplaceFilters'
import MarketplaceProductCard from '../components/marketplace/MarketplaceProductCard'
import MarketplaceEmptyState from '../components/marketplace/MarketplaceEmptyState'
import MarketplaceLoading from '../components/marketplace/MarketplaceLoading'

export default function Marketplace() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Filter state
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    brand: '',
    cosmeticGrade: '',
    minPrice: '',
    maxPrice: '',
  })

  // Pagination & Results State
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 12
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add to cart state
  const [addingCartId, setAddingCartId] = useState(null)
  const [cartSuccessMsg, setCartSuccessMsg] = useState(null)
  const [cartErrorMsg, setCartErrorMsg] = useState(null)

  // Fetch listings from backend
  const fetchListings = useCallback(async (page = 0, currentFilters = filters) => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        page,
        size: pageSize,
      }

      if (currentFilters.query && currentFilters.query.trim()) {
        params.query = currentFilters.query.trim()
      }
      if (currentFilters.category) {
        params.category = currentFilters.category
      }
      if (currentFilters.brand && currentFilters.brand.trim()) {
        params.brand = currentFilters.brand.trim()
      }
      if (currentFilters.cosmeticGrade) {
        params.cosmeticGrade = currentFilters.cosmeticGrade
      }
      if (currentFilters.minPrice !== '' && !isNaN(currentFilters.minPrice)) {
        params.minPrice = Number(currentFilters.minPrice)
      }
      if (currentFilters.maxPrice !== '' && !isNaN(currentFilters.maxPrice)) {
        params.maxPrice = Number(currentFilters.maxPrice)
      }

      const res = await marketplaceApi.searchListings(params)
      setPageData(res.data)
      setCurrentPage(page)
    } catch (err) {
      console.error('Failed to load marketplace listings:', err)
      setError(getApiErrorMessage(err, 'Unable to load refurbished electronics catalog. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings(0, filters)
    }, 280)

    return () => clearTimeout(timer)
  }, [filters, fetchListings])

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleResetFilters = () => {
    const cleared = {
      query: '',
      category: '',
      brand: '',
      cosmeticGrade: '',
      minPrice: '',
      maxPrice: '',
    }
    setFilters(cleared)
    fetchListings(0, cleared)
  }

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => Boolean(v)).length

  // Add to cart action
  const handleAddToCart = async (listingId) => {
    if (!user) {
      // Redirect to login preserving destination
      navigate('/login', { state: { from: location } })
      return
    }

    try {
      setAddingCartId(listingId)
      setCartSuccessMsg(null)
      setCartErrorMsg(null)
      await cartApi.addToCart(listingId)
      setCartSuccessMsg('Device added to cart.')
      // Auto-clear message after 3.5 seconds
      setTimeout(() => setCartSuccessMsg(null), 3500)
    } catch (err) {
      console.error('Failed to add item to cart:', err)
      setCartErrorMsg(getApiErrorMessage(err, 'Could not add item to cart. It may have been reserved by another customer.'))
      setTimeout(() => setCartErrorMsg(null), 5000)
    } finally {
      setAddingCartId(null)
    }
  }

  const totalElements = pageData?.totalElements || 0
  const totalPages = pageData?.totalPages || 0
  const items = pageData?.content || []

  return (
    <div className="marketplace-page py-3">
      {/* Editorial Header */}
      <header className="mb-4">
        <div className="editorial-tag">
          <i className="bi bi-arrow-repeat me-1"></i> Circular Electronics Marketplace
        </div>
        <div className="d-flex justify-content-between align-items-baseline flex-wrap gap-2 pb-3 border-bottom border-dark">
          <div>
            <h1 className="display-hero-title m-0">REFURBISHED HARDWARE</h1>
            <p className="text-secondary fs-5 mt-2 mb-0" style={{ maxWidth: '640px' }}>
              Physical devices given a verified second life. Every unit is physically assessed, serviced, and graded by certified operational facilities.
            </p>
          </div>
          {pageData && (
            <div className="text-md-end text-muted small text-uppercase fw-bold letter-spacing-1">
              {totalElements} {totalElements === 1 ? 'Unit Available' : 'Units Available'}
            </div>
          )}
        </div>
      </header>

      {/* Cart Feedback Alerts */}
      {cartSuccessMsg && (
        <div className="alert alert-success alert-dismissible fade show py-2 px-3 mb-3 small d-flex align-items-center justify-content-between" role="alert">
          <div>
            <i className="bi bi-check-circle-fill me-2"></i>
            {cartSuccessMsg}
          </div>
          <button type="button" className="btn-close py-2" onClick={() => setCartSuccessMsg(null)} aria-label="Close"></button>
        </div>
      )}

      {cartErrorMsg && (
        <div className="alert alert-danger alert-dismissible fade show py-2 px-3 mb-3 small d-flex align-items-center justify-content-between" role="alert">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {cartErrorMsg}
          </div>
          <button type="button" className="btn-close py-2" onClick={() => setCartErrorMsg(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Filter Controls */}
      <MarketplaceFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Error State with Retry */}
      {error && (
        <div className="p-4 bg-white border border-danger my-4 text-center">
          <div className="text-danger mb-2" style={{ fontSize: '2rem' }}>
            <i className="bi bi-exclamation-octagon"></i>
          </div>
          <h3 className="h5 fw-bold text-dark mb-2">Failed to Load Marketplace Inventory</h3>
          <p className="small text-secondary mb-3">{error}</p>
          <button
            type="button"
            onClick={() => fetchListings(currentPage, filters)}
            className="btn btn-outline-custom btn-sm"
          >
            Retry Connection ↗
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !pageData && <MarketplaceLoading />}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <MarketplaceEmptyState
          isFiltered={activeFilterCount > 0}
          onReset={handleResetFilters}
        />
      )}

      {/* Product Catalog Grid */}
      {!error && items.length > 0 && (
        <>
          <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 my-2">
            {items.map((item) => (
              <div key={item.id} className="col">
                <MarketplaceProductCard
                  item={item}
                  onAddToCart={handleAddToCart}
                  isAdding={addingCartId === item.id}
                />
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <nav
              className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top border-secondary border-opacity-25"
              aria-label="Marketplace page navigation"
            >
              <button
                type="button"
                className="btn btn-outline-custom btn-sm"
                onClick={() => fetchListings(currentPage - 1, filters)}
                disabled={currentPage === 0 || loading}
                aria-label="Go to previous page"
              >
                ← Previous
              </button>

              <div className="small text-muted text-uppercase fw-bold letter-spacing-1">
                Page {currentPage + 1} of {totalPages}
              </div>

              <button
                type="button"
                className="btn btn-outline-custom btn-sm"
                onClick={() => fetchListings(currentPage + 1, filters)}
                disabled={currentPage + 1 >= totalPages || loading}
                aria-label="Go to next page"
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
