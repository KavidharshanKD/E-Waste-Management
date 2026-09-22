import React from 'react'

export default function MarketplaceEmptyState({ onReset, isFiltered = false }) {
  return (
    <div className="py-5 text-center my-4 border border-secondary border-opacity-25 p-5 bg-white bg-opacity-40">
      <div className="text-muted mb-3" style={{ fontSize: '2.5rem' }}>
        <i className="bi bi-box-seam"></i>
      </div>
      <h3 className="h4 text-uppercase fw-bold text-dark mb-2">
        {isFiltered ? 'No Refurbished Devices Match Your Filters' : 'No Listings Currently Available'}
      </h3>
      <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '480px' }}>
        {isFiltered
          ? 'Try relaxing your filter parameters, searching for a different brand, or clearing category restrictions.'
          : 'Refurbished inventory is published as devices complete technical assessment, repair, and quality-check verification.'}
      </p>
      {isFiltered && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="btn btn-outline-custom"
          aria-label="Clear all active filters"
        >
          Reset All Filters ↗
        </button>
      )}
    </div>
  )
}
