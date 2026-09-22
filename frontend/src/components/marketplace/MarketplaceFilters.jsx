import React from 'react'
import {
  EWASTE_CATEGORY_MAP,
  COSMETIC_GRADE_MAP,
} from '../../utils/enumMappings'

export default function MarketplaceFilters({
  filters,
  onChange,
  onReset,
  activeFilterCount = 0,
}) {
  const handleInputChange = (e) => {
    const { name, value } = e.target
    onChange(name, value)
  }

  return (
    <div className="marketplace-filters-container mb-4 pb-3 border-bottom border-secondary border-opacity-25">
      {/* Search Input Bar */}
      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="input-group">
            <span className="input-group-text bg-white border-secondary border-opacity-25 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="search"
              name="query"
              className="form-control"
              placeholder="Search model, brand, or specifications..."
              value={filters.query || ''}
              onChange={handleInputChange}
              aria-label="Search marketplace devices"
            />
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-7 d-flex justify-content-md-end align-items-center gap-2 flex-wrap">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="btn btn-outline-secondary btn-sm py-1 px-2.5"
              aria-label="Clear all applied filters"
            >
              <i className="bi bi-x-circle me-1"></i> Clear Filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Row: Category, Brand, Grade, Price */}
      <div className="row g-2 align-items-end">
        {/* Category Select */}
        <div className="col-6 col-md-3 col-lg-3">
          <label htmlFor="filter-category" className="form-label small text-uppercase fw-bold text-muted mb-1">
            Category
          </label>
          <select
            id="filter-category"
            name="category"
            className="form-select form-select-sm"
            value={filters.category || ''}
            onChange={handleInputChange}
          >
            <option value="">All Categories</option>
            {Object.entries(EWASTE_CATEGORY_MAP).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Cosmetic Grade Select */}
        <div className="col-6 col-md-3 col-lg-3">
          <label htmlFor="filter-grade" className="form-label small text-uppercase fw-bold text-muted mb-1">
            Cosmetic Grade
          </label>
          <select
            id="filter-grade"
            name="cosmeticGrade"
            className="form-select form-select-sm"
            value={filters.cosmeticGrade || ''}
            onChange={handleInputChange}
          >
            <option value="">All Grades</option>
            {Object.entries(COSMETIC_GRADE_MAP).map(([val, cfg]) => (
              <option key={val} value={val}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Input */}
        <div className="col-6 col-md-3 col-lg-2">
          <label htmlFor="filter-brand" className="form-label small text-uppercase fw-bold text-muted mb-1">
            Brand
          </label>
          <input
            id="filter-brand"
            type="text"
            name="brand"
            className="form-control form-control-sm"
            placeholder="e.g. Dell, Apple"
            value={filters.brand || ''}
            onChange={handleInputChange}
          />
        </div>

        {/* Price Range */}
        <div className="col-6 col-md-3 col-lg-4">
          <label className="form-label small text-uppercase fw-bold text-muted mb-1">
            Price Range (₹)
          </label>
          <div className="d-flex align-items-center gap-1">
            <input
              type="number"
              name="minPrice"
              className="form-control form-control-sm"
              placeholder="Min ₹"
              min="0"
              value={filters.minPrice || ''}
              onChange={handleInputChange}
              aria-label="Minimum price in rupees"
            />
            <span className="text-muted small">–</span>
            <input
              type="number"
              name="maxPrice"
              className="form-control form-control-sm"
              placeholder="Max ₹"
              min="0"
              value={filters.maxPrice || ''}
              onChange={handleInputChange}
              aria-label="Maximum price in rupees"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
