import React, { useState, useEffect } from 'react'
import axios from 'axios'

const EWASTE_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'MOBILE_PHONE', label: 'Mobile Phone' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Desktop PC' },
  { value: 'MONITOR', label: 'Monitor / Display' },
  { value: 'TELEVISION', label: 'Television' },
  { value: 'PRINTER', label: 'Printer / Scanner' },
  { value: 'KEYBOARD', label: 'Keyboard' },
  { value: 'MOUSE', label: 'Mouse' },
  { value: 'BATTERY', label: 'Battery' },
  { value: 'CHARGER', label: 'Charger' },
  { value: 'CABLE', label: 'Cable / Wire' },
  { value: 'REFRIGERATOR', label: 'Refrigerator' },
  { value: 'WASHING_MACHINE', label: 'Washing Machine' },
  { value: 'AIR_CONDITIONER', label: 'Air Conditioner' },
]

export default function FindRecyclingCenter() {
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchParams, setSearchParams] = useState({
    city: '',
    state: '',
    pincode: '',
    category: '',
    search: '',
  })

  const [userCoords, setUserCoords] = useState(null)
  const [geoLocating, setGeoLocating] = useState(false)
  const [geoError, setGeoError] = useState(null)

  // Configurable Map Provider Template (Default: Google Maps Directions API)
  const generateDirectionsUrl = (lat, lng, name) => {
    if (!lat || !lng) return '#'
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  }

  useEffect(() => {
    fetchCenters()
  }, [userCoords])

  const fetchCenters = async (overrideParams = {}) => {
    try {
      setLoading(true)
      const params = {
        ...searchParams,
        ...overrideParams,
      }

      if (userCoords) {
        params.lat = userCoords.lat
        params.lng = userCoords.lng
      }

      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })

      const res = await axios.get('/api/recycling-centers', { params })
      setCenters(res.data)
    } catch (err) {
      console.error('Failed to fetch recycling centers', err)
      setError('Unable to load recycling centers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchParams(prev => ({ ...prev, [name]: value }))
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchCenters()
  }

  const handleClearFilters = () => {
    setSearchParams({
      city: '',
      state: '',
      pincode: '',
      category: '',
      search: '',
    })
    setUserCoords(null)
    setGeoError(null)
    fetchCenters({ city: '', state: '', pincode: '', category: '', search: '' })
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }

    setGeoLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserCoords(coords)
        setGeoLocating(false)
      },
      (err) => {
        console.error('Geolocation error', err)
        setGeoError('Unable to retrieve your location. Please search by City or Pincode.')
        setGeoLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="hero-card mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <span className="hero-tag">📍 Geographic Discovery</span>
            <h1 className="hero-title h2 mb-1">Find Recycling Center</h1>
            <p className="hero-description small mb-0">
              Locate authorized e-waste processing centers across Indian cities, check accepted waste categories, and calculate distance.
            </p>
          </div>
          <button
            onClick={handleUseCurrentLocation}
            disabled={geoLocating}
            className="btn btn-primary-custom py-2.5 px-4 text-white text-decoration-none shadow-sm"
          >
            {geoLocating ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span> Locating You...
              </span>
            ) : (
              <span>
                <i className="bi bi-geo-alt-fill me-1.5 text-warning"></i> Use My Current Location
              </span>
            )}
          </button>
        </div>
      </div>

      {geoError && (
        <div className="alert alert-warning border-0 rounded-4 shadow-sm mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {geoError}
        </div>
      )}

      {error && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {/* Filter Form Card */}
      <div className="glass-card mb-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-sm-6 col-md-3">
              <label className="form-label text-muted small font-weight-bold">Search Query</label>
              <input
                type="text"
                name="search"
                value={searchParams.search}
                onChange={handleInputChange}
                placeholder="Center name or keyword"
                className="form-control form-control-custom"
              />
            </div>

            <div className="col-6 col-sm-6 col-md-2">
              <label className="form-label text-muted small font-weight-bold">City</label>
              <input
                type="text"
                name="city"
                value={searchParams.city}
                onChange={handleInputChange}
                placeholder="e.g. Chennai"
                className="form-control form-control-custom"
              />
            </div>

            <div className="col-6 col-sm-6 col-md-2">
              <label className="form-label text-muted small font-weight-bold">State</label>
              <input
                type="text"
                name="state"
                value={searchParams.state}
                onChange={handleInputChange}
                placeholder="e.g. Tamil Nadu"
                className="form-control form-control-custom"
              />
            </div>

            <div className="col-6 col-sm-6 col-md-2">
              <label className="form-label text-muted small font-weight-bold">PIN Code</label>
              <input
                type="text"
                name="pincode"
                maxLength="6"
                value={searchParams.pincode}
                onChange={handleInputChange}
                placeholder="e.g. 600032"
                className="form-control form-control-custom"
              />
            </div>

            <div className="col-6 col-sm-6 col-md-3">
              <label className="form-label text-muted small font-weight-bold">Waste Category</label>
              <select
                name="category"
                value={searchParams.category}
                onChange={handleInputChange}
                className="form-select form-select-custom"
              >
                {EWASTE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="col-12 d-flex gap-2 justify-content-end mt-3">
              <button type="button" onClick={handleClearFilters} className="btn btn-outline-custom">
                <i className="bi bi-x-circle me-1"></i> Clear Filters
              </button>
              <button type="submit" className="btn btn-primary-custom px-4 text-white">
                <i className="bi bi-search me-1"></i> Search Centers
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="text-white font-weight-bold m-0 d-flex align-items-center gap-2">
          <i className="bi bi-building-check text-success"></i> Matching Facilities ({centers.length})
        </h5>
        {userCoords && (
          <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill">
            <i className="bi bi-geo-alt me-1"></i> Sorted by Haversine Distance
          </span>
        )}
      </div>

      {/* Facility Cards Grid */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          Searching recycling facilities...
        </div>
      ) : centers.length === 0 ? (
        <div className="glass-card text-center py-5">
          <i className="bi bi-geo-off text-muted display-4 d-block mb-2"></i>
          <h5 className="text-white mb-2">No Centers Found</h5>
          <p className="text-muted small mb-3">No recycling centers match your current filter parameters.</p>
          <button onClick={handleClearFilters} className="btn btn-outline-custom">
            Clear Filters &amp; View All
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {centers.map(center => (
            <div key={center.id} className="col-12 col-md-6 col-lg-4">
              <div className="glass-card h-100 d-flex flex-column justify-content-between p-4 border border-secondary border-opacity-25 shadow-sm">
                <div>
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <h5 className="text-white font-weight-bold mb-0 text-truncate" title={center.name}>
                      {center.name}
                    </h5>
                    {center.isDemoFacility && (
                      <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-25 extra-small px-2 py-1" title="Sample demonstration facility for testing">
                        DEMO FACILITY
                      </span>
                    )}
                  </div>

                  {center.registrationNumber && (
                    <span className="text-muted extra-small d-block mb-2">
                      Reg No: <code>{center.registrationNumber}</code>
                    </span>
                  )}

                  {center.distanceKm != null && (
                    <div className="mb-3">
                      <span className="badge bg-success text-white font-weight-bold px-2.5 py-1">
                        📍 {center.distanceKm} km away
                      </span>
                    </div>
                  )}

                  <div className="mb-3 text-muted small">
                    <i className="bi bi-geo-alt me-1 text-info"></i>
                    {center.address}, {center.city}, {center.district ? `${center.district}, ` : ''}{center.state} - {center.postalCode}
                  </div>

                  {center.operatingHours && (
                    <div className="mb-3 text-muted small">
                      <i className="bi bi-clock me-1 text-warning"></i>
                      <span>{center.operatingHours}</span>
                    </div>
                  )}

                  {(center.contactPhone || center.contactEmail) && (
                    <div className="mb-3 small">
                      {center.contactPhone && (
                        <span className="d-block text-white mb-1">
                          <i className="bi bi-telephone-fill me-1 text-success"></i> {center.contactPhone}
                        </span>
                      )}
                      {center.contactEmail && (
                        <span className="d-block text-muted text-truncate">
                          <i className="bi bi-envelope-fill me-1 text-info"></i> {center.contactEmail}
                        </span>
                      )}
                    </div>
                  )}

                  {center.acceptedWasteCategories && (
                    <div className="mb-3">
                      <span className="text-muted extra-small d-block mb-1.5 font-weight-bold">Accepted E-Waste Categories:</span>
                      <div className="d-flex flex-wrap gap-1">
                        {center.acceptedWasteCategories.split(',').map(cat => (
                          <span key={cat.trim()} className="badge bg-dark border border-secondary text-success extra-small">
                            {cat.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-top border-secondary border-opacity-25 mt-3">
                  <a
                    href={generateDirectionsUrl(center.latitude, center.longitude, center.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-custom w-100 py-2 font-weight-semibold"
                  >
                    <i className="bi bi-sign-turn-right-fill me-1.5 text-success"></i> Get Directions (Map)
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
