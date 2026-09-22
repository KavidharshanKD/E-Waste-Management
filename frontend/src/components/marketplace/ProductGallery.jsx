import React, { useState, useEffect } from 'react'

export default function ProductGallery({ images = [], title = 'Refurbished Device', category = '' }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [failedImages, setFailedImages] = useState({})

  // Find primary image index if exists
  useEffect(() => {
    if (images && images.length > 0) {
      const primaryIndex = images.findIndex((img) => img.primary)
      setActiveIdx(primaryIndex >= 0 ? primaryIndex : 0)
    }
  }, [images])

  const handleImgError = (idx) => {
    setFailedImages((prev) => ({ ...prev, [idx]: true }))
  }

  const hasImages = images && images.length > 0
  const activeImage = hasImages ? images[activeIdx] : null
  const currentImgFailed = failedImages[activeIdx]

  return (
    <div className="product-gallery-container mb-4">
      {/* Main Image Viewport */}
      <div
        className="product-gallery-main position-relative overflow-hidden mb-2 text-center border border-secondary border-opacity-25"
        style={{
          backgroundColor: '#eae8e1',
          aspectRatio: '16/10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {activeImage && activeImage.imageUrl && !currentImgFailed ? (
          <img
            src={activeImage.imageUrl}
            alt={`${title} - View ${activeIdx + 1}`}
            className="w-100 h-100 object-fit-contain p-2"
            onError={() => handleImgError(activeIdx)}
          />
        ) : (
          <div className="text-muted p-5 d-flex flex-column align-items-center justify-content-center">
            <i className="bi bi-cpu fs-1 mb-2 text-secondary opacity-50"></i>
            <span className="small text-uppercase fw-bold opacity-75 letter-spacing-1">
              {category ? category.replace(/_/g, ' ') : 'Refurbished Hardware'}
            </span>
            <span className="extra-small text-muted mt-1">Physical Inspection Completed</span>
          </div>
        )}
      </div>

      {/* Thumbnails row if multiple images exist */}
      {hasImages && images.length > 1 && (
        <div className="d-flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product image thumbnails">
          {images.map((img, idx) => {
            const isSelected = idx === activeIdx
            const isFailed = failedImages[idx]

            return (
              <button
                key={img.id || idx}
                type="button"
                className={`btn p-0 border ${isSelected ? 'border-dark border-2' : 'border-secondary border-opacity-25'}`}
                style={{
                  width: '64px',
                  height: '48px',
                  backgroundColor: '#eae8e1',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
                onClick={() => setActiveIdx(idx)}
                aria-label={`Show image ${idx + 1}`}
                aria-selected={isSelected}
                role="tab"
              >
                {!isFailed && img.imageUrl ? (
                  <img
                    src={img.imageUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-100 h-100 object-fit-cover"
                    onError={() => handleImgError(idx)}
                  />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted small">
                    <i className="bi bi-image"></i>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
