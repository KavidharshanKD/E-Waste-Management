import React from 'react'

export default function MarketplaceLoading({ message = 'Loading Refurbished Inventory...' }) {
  return (
    <div className="py-5 text-center my-4" role="status" aria-live="polite">
      <div className="spinner-border text-emerald mb-3" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <div className="text-uppercase small fw-bold text-muted letter-spacing-1">
        {message}
      </div>
    </div>
  )
}
