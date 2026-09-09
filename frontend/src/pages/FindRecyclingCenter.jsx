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

  const generateDirectionsUrl = (lat, lng) => {
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
        setGeoError('Unable to retrieve location. Search by City or PIN code.')
        setGeoLocating(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <div className="py-4">
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <div className="editorial-tag">GEOGRAPHIC DISCOVERY</div>
          <h1 className="h1 text-uppercase fw-bold m-0">RECYCLING CENTERS INDIA</h1>
        </div>
        <button
          onClick={handleUseCurrentLocation}
          disabled={geoLocating}
          className="btn btn-primary-custom"
        >
          {geoLocating ? 'Locating...' : 'Use My Current Location ↗'}
        </button>
      </div>

      {geoError && <div className="alert alert-warning mb-4">{geoError}</div>}
      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="grid-split-33-67 my-4" style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '3rem' }}>
        {/* Left Column: Filter Controls */}
        <div>
          <h2 className="h4 text-uppercase fw-bold mb-3 pb-2 border-bottom border-dark">FILTER FACILITIES</h2>
          <form onSubmit={handleSearchSubmit} className="d-flex flex-direction-column flex-column gap-3">
            <div>
              <label>Search Keyword</label>
              <input
                type="text"
                name="search"
                value={searchParams.search}
                onChange={handleInputChange}
                placeholder="Center name or facility"
                className="form-control"
              />
            </div>

            <div>
              <label>City</label>
              <input
                type="text"
                name="city"
                value={searchParams.city}
                onChange={handleInputChange}
                placeholder="e.g. Coimbatore"
                className="form-control"
              />
            </div>

            <div>
              <label>State</label>
              <input
                type="text"
                name="state"
                value={searchParams.state}
                onChange={handleInputChange}
                placeholder="e.g. Tamil Nadu"
                className="form-control"
              />
            </div>

            <div>
              <label>PIN Code</label>
              <input
                type="text"
                name="pincode"
                maxLength="6"
                value={searchParams.pincode}
                onChange={handleInputChange}
                placeholder="e.g. 641001"
                className="form-control"
              />
            </div>

            <div>
              <label>Equipment Category</label>
              <select
                name="category"
                value={searchParams.category}
                onChange={handleInputChange}
                className="form-select"
              >
                {EWASTE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 d-flex flex-column gap-2">
              <button type="submit" className="btn btn-primary-custom w-100">
                Search Centers ↗
              </button>
              <button type="button" onClick={handleClearFilters} className="btn btn-outline-custom w-100">
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Horizontal Editorial Rows */}
        <div>
          <div className="d-flex justify-content-between align-items-baseline mb-3 pb-2 border-bottom border-dark">
            <h2 className="h4 text-uppercase fw-bold m-0">MATCHING FACILITIES ({centers.length})</h2>
            {userCoords && <span className="status-dot-item"><span className="status-dot status-dot-emerald"></span> SORTED BY DISTANCE</span>}
          </div>

          {loading ? (
            <div className="py-4 text-muted small">Loading registered facilities...</div>
          ) : centers.length === 0 ? (
            <div className="py-4 text-muted small">
              No recycling facilities found matching your criteria. <button onClick={handleClearFilters} className="btn btn-link p-0 text-success">Clear filters</button>.
            </div>
          ) : (
            <div className="editorial-timeline">
              {centers.map((center, index) => (
                <div key={center.id} className="editorial-timeline-row">
                  <div className="editorial-timeline-num">{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <div className="editorial-timeline-title">{center.name}</div>
                    <div className="text-secondary small mt-1">
                      {center.address}, {center.city}, {center.state} - {center.postalCode}
                    </div>
                    {center.acceptedWasteCategories && (
                      <div className="text-muted extra-small mt-2">
                        ACCEPTED: {center.acceptedWasteCategories}
                      </div>
                    )}
                  </div>
                  <div className="text-md-end">
                    {center.distanceKm != null && (
                      <div className="fw-bold text-success fs-5 mb-1">{center.distanceKm} KM</div>
                    )}
                    <a
                      href={generateDirectionsUrl(center.latitude, center.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-link-action"
                    >
                      DIRECTIONS ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
