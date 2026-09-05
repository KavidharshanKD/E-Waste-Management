import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import RecommendationCard from '../components/RecommendationCard'

const EWASTE_CATEGORIES = [
  { value: 'MOBILE_PHONE', label: 'Mobile Phone' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Desktop PC' },
  { value: 'MONITOR', label: 'Monitor / Display' },
  { value: 'TELEVISION', label: 'Television' },
  { value: 'PRINTER', label: 'Printer / Scanner' },
  { value: 'KEYBOARD', label: 'Keyboard' },
  { value: 'MOUSE', label: 'Mouse / Peripheral' },
  { value: 'BATTERY', label: 'Battery' },
  { value: 'CHARGER', label: 'Charger / Adapter' },
  { value: 'CABLE', label: 'Cable / Wire' },
  { value: 'REFRIGERATOR', label: 'Refrigerator' },
  { value: 'WASHING_MACHINE', label: 'Washing Machine' },
  { value: 'AIR_CONDITIONER', label: 'Air Conditioner' },
  { value: 'OTHER', label: 'Other E-Waste' },
]

const DEVICE_CONDITIONS = [
  { value: 'WORKING', label: 'Working (Fully functional)' },
  { value: 'PARTIALLY_WORKING', label: 'Partially Working (Minor defects)' },
  { value: 'DAMAGED', label: 'Damaged (Physical damage)' },
  { value: 'NOT_WORKING', label: 'Not Working (Non-functional)' },
  { value: 'HAZARDOUS', label: 'Hazardous (Leaking/Swollen battery)' },
]

const DAMAGE_CONDITIONS = [
  { value: 'None', label: 'None (No physical damage)' },
  { value: 'Minor Scratches', label: 'Minor Scratches / Cosmetic Wear' },
  { value: 'Cracked Glass / Screen', label: 'Cracked Screen / Display Damage' },
  { value: 'Severe Body Damage', label: 'Severe Body Damage / Bent Chassis' },
  { value: 'Water / Fluid Damage', label: 'Water / Liquid Damage' },
]

const BATTERY_CONDITIONS = [
  { value: 'Normal', label: 'Normal (Holds charge)' },
  { value: 'Degraded', label: 'Degraded Capacity (Drains quickly)' },
  { value: 'Swollen / Bloated', label: 'Swollen / Bloated Battery ⚠️' },
  { value: 'Leaking / Corroded', label: 'Leaking / Corroded Battery ⚠️' },
  { value: 'Not Applicable', label: 'Not Applicable (No battery)' },
]

export default function AddEWaste() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    category: 'LAPTOP',
    deviceName: '',
    brand: '',
    approxAgeYears: 2,
    quantity: 1,
    condition: 'WORKING',
    workingStatus: 'Functional',
    damageCondition: 'None',
    batteryCondition: 'Normal',
    description: '',
    pickupRequired: true,
    pickupAddress: '',
    pickupCity: '',
    pickupState: '',
    pickupPostalCode: '',
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  // Smart Recommendation Post-submission Result
  const [createdRequest, setCreatedRequest] = useState(null)

  useEffect(() => {
    // Auto-prefill profile address if available
    axios.get('/api/user/profile')
      .then(res => {
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            pickupAddress: res.data.address || '',
            pickupCity: res.data.city || '',
            pickupState: res.data.state || '',
            pickupPostalCode: res.data.postalCode || '',
          }))
        }
      })
      .catch(() => {
        // Silently ignore if profile empty
      })
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrors(prev => ({
        ...prev,
        image: 'Invalid image format. Allowed formats: JPEG, PNG, WEBP, GIF.',
      }))
      return
    }

    // File size validation (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        image: 'File size exceeds maximum limit of 5MB.',
      }))
      return
    }

    setErrors(prev => ({ ...prev, image: null }))
    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.category) newErrors.category = 'Device category is required'
    if (!formData.deviceName || !formData.deviceName.trim()) {
      newErrors.deviceName = 'Device name is required (e.g., MacBook Pro, Galaxy S21)'
    }
    if (!formData.brand || !formData.brand.trim()) {
      newErrors.brand = 'Brand is required (e.g., Apple, Samsung, Dell)'
    }
    if (formData.approxAgeYears === '' || Number(formData.approxAgeYears) < 0) {
      newErrors.approxAgeYears = 'Approximate age must be 0 or greater'
    }
    if (!formData.quantity || Number(formData.quantity) < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    }
    if (!formData.condition) newErrors.condition = 'Device condition is required'
    if (!formData.pickupAddress || !formData.pickupAddress.trim()) {
      newErrors.pickupAddress = 'Pickup address is required'
    }
    if (!formData.pickupCity || !formData.pickupCity.trim()) {
      newErrors.pickupCity = 'City is required'
    }
    if (!formData.pickupState || !formData.pickupState.trim()) {
      newErrors.pickupState = 'State is required'
    }
    
    // Indian 6-digit PIN code validation
    const pinRegex = /^[1-9][0-9]{5}$/
    if (!formData.pickupPostalCode || !pinRegex.test(formData.pickupPostalCode)) {
      newErrors.pickupPostalCode = 'Valid 6-digit Indian Pincode is required (e.g. 600001)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)

      const bodyData = new FormData()
      bodyData.append('category', formData.category)
      bodyData.append('deviceName', formData.deviceName.trim())
      bodyData.append('brand', formData.brand.trim())
      bodyData.append('approxAgeYears', formData.approxAgeYears)
      bodyData.append('quantity', formData.quantity)
      bodyData.append('condition', formData.condition)
      bodyData.append('workingStatus', formData.workingStatus)
      bodyData.append('damageCondition', formData.damageCondition)
      bodyData.append('batteryCondition', formData.batteryCondition)
      bodyData.append('description', formData.description)
      bodyData.append('pickupRequired', formData.pickupRequired)
      bodyData.append('pickupAddress', formData.pickupAddress.trim())
      bodyData.append('pickupCity', formData.pickupCity.trim())
      bodyData.append('pickupState', formData.pickupState.trim())
      bodyData.append('pickupPostalCode', formData.pickupPostalCode.trim())

      if (imageFile) {
        bodyData.append('image', imageFile)
      }

      const res = await axios.post('/api/user/ewaste', bodyData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Show immediate Smart Disposal Recommendation result
      setCreatedRequest(res.data)
    } catch (err) {
      console.error('Failed to submit e-waste request', err)
      setServerError(
        err.response?.data?.error || err.response?.data?.message || 'Failed to submit request. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // If request created, show the immediate Recommendation Card overlay
  if (createdRequest) {
    return (
      <div className="container py-5" style={{ maxWidth: '850px' }}>
        <div className="glass-card text-center p-4 p-md-5 mb-4">
          <div className="text-success display-3 mb-2">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <h2 className="text-white font-weight-bold mb-1">E-Waste Disposal Submitted!</h2>
          <p className="text-muted mb-4">
            Tracking Number: <code className="text-success font-weight-bold">{createdRequest.trackingNumber}</code>
          </p>

          <RecommendationCard
            action={createdRequest.recommendedAction}
            explanation={createdRequest.recommendationExplanation}
            handlingAdvice={createdRequest.handlingAdvice}
          />

          <div className="d-flex align-items-center justify-content-center gap-3 mt-4 flex-wrap">
            <Link to={`/user/requests/${createdRequest.id}`} className="btn btn-primary-custom py-2.5 px-4 text-white text-decoration-none">
              <i className="bi bi-eye-fill me-1"></i> View Request Details
            </Link>
            <Link to="/user/requests" className="btn btn-outline-custom py-2.5 px-4">
              <i className="bi bi-list-check me-1"></i> Go to My Requests
            </Link>
            <button
              onClick={() => {
                setCreatedRequest(null)
                setFormData(prev => ({ ...prev, deviceName: '', description: '' }))
                setImageFile(null)
                setImagePreview(null)
              }}
              className="btn btn-outline-secondary py-2.5 px-4 text-white"
            >
              <i className="bi bi-plus-lg me-1"></i> Add Another Device
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="hero-title h2 mb-1">Add E-Waste Items</h1>
          <p className="text-muted small mb-0">
            Submit electronic devices to get intelligent disposal recommendations (Reuse, Repair, Donate, Refurbish, Recycle, Special Handling).
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-outline-custom">
          <i className="bi bi-arrow-left me-1"></i> Back
        </button>
      </div>

      {serverError && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Left Column: Device Info & Specs */}
          <div className="col-lg-7">
            <div className="glass-card mb-4">
              <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-laptop text-success"></i> Device Details &amp; Specifications
              </h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted small font-weight-bold">Device Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`form-select form-select-custom ${errors.category ? 'is-invalid' : ''}`}
                  >
                    {EWASTE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted small font-weight-bold">Device Name / Model *</label>
                  <input
                    type="text"
                    name="deviceName"
                    value={formData.deviceName}
                    onChange={handleChange}
                    placeholder="e.g. MacBook Air, Galaxy Tab"
                    className={`form-control form-control-custom ${errors.deviceName ? 'is-invalid' : ''}`}
                  />
                  {errors.deviceName && <div className="invalid-feedback">{errors.deviceName}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted small font-weight-bold">Brand / Manufacturer *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g. Apple, Samsung, Sony"
                    className={`form-control form-control-custom ${errors.brand ? 'is-invalid' : ''}`}
                  />
                  {errors.brand && <div className="invalid-feedback">{errors.brand}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label text-muted small font-weight-bold">Approx. Age (Years)</label>
                  <input
                    type="number"
                    name="approxAgeYears"
                    min="0"
                    max="50"
                    value={formData.approxAgeYears}
                    onChange={handleChange}
                    className={`form-control form-control-custom ${errors.approxAgeYears ? 'is-invalid' : ''}`}
                  />
                  {errors.approxAgeYears && <div className="invalid-feedback">{errors.approxAgeYears}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label text-muted small font-weight-bold">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max="100"
                    value={formData.quantity}
                    onChange={handleChange}
                    className={`form-control form-control-custom ${errors.quantity ? 'is-invalid' : ''}`}
                  />
                  {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted small font-weight-bold">Overall Condition *</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className={`form-select form-select-custom ${errors.condition ? 'is-invalid' : ''}`}
                  >
                    {DEVICE_CONDITIONS.map(cond => (
                      <option key={cond.value} value={cond.value}>{cond.label}</option>
                    ))}
                  </select>
                  {errors.condition && <div className="invalid-feedback">{errors.condition}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted small font-weight-bold">Working Status</label>
                  <input
                    type="text"
                    name="workingStatus"
                    value={formData.workingStatus}
                    onChange={handleChange}
                    placeholder="e.g. Functional, Degraded battery, Dead"
                    className="form-control form-control-custom"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted small font-weight-bold">Physical Damage Condition</label>
                  <select
                    name="damageCondition"
                    value={formData.damageCondition}
                    onChange={handleChange}
                    className="form-select form-select-custom"
                  >
                    {DAMAGE_CONDITIONS.map(dmg => (
                      <option key={dmg.value} value={dmg.value}>{dmg.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-muted small font-weight-bold">Battery Condition (If applicable)</label>
                  <select
                    name="batteryCondition"
                    value={formData.batteryCondition}
                    onChange={handleChange}
                    className="form-select form-select-custom"
                  >
                    {BATTERY_CONDITIONS.map(bat => (
                      <option key={bat.value} value={bat.value}>{bat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label text-muted small font-weight-bold">Description / Additional Notes</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe accessories included, power cord status, visible damage, etc."
                    className="form-control form-control-custom"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Optional Device Image Upload Card */}
            <div className="glass-card">
              <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-image text-info"></i> Device Photo Upload (Optional)
              </h5>

              <div className="image-dropzone position-relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
                />
                {imagePreview ? (
                  <div>
                    <img
                      src={imagePreview}
                      alt="Device Preview"
                      style={{ maxHeight: '180px', objectFit: 'contain' }}
                      className="rounded-3 mb-2 shadow-sm border border-secondary"
                    />
                    <div className="text-success small font-weight-bold">
                      <i className="bi bi-check-circle-fill me-1"></i> {imageFile?.name} ({(imageFile?.size / 1024).toFixed(1)} KB)
                    </div>
                    <span className="text-muted extra-small d-block mt-1">Click to replace photo</span>
                  </div>
                ) : (
                  <div>
                    <i className="bi bi-cloud-arrow-up display-5 text-muted d-block mb-2"></i>
                    <span className="text-white font-weight-semibold d-block">Click or Drag &amp; Drop Photo Here</span>
                    <span className="text-muted small d-block">Supports JPEG, PNG, WEBP, GIF (Max 5MB)</span>
                  </div>
                )}
              </div>
              {errors.image && <div className="text-danger small mt-2">{errors.image}</div>}
            </div>
          </div>

          {/* Right Column: Pickup Address & Submit */}
          <div className="col-lg-5">
            <div className="glass-card mb-4">
              <h5 className="text-white font-weight-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-geo-alt-fill text-warning"></i> Doorstep Pickup Address
              </h5>

              <div className="mb-3">
                <label className="form-label text-muted small font-weight-bold d-block">Pickup Option</label>

                <div className="form-check form-switch custom-switch mb-2">
                  <input
                    type="checkbox"
                    name="pickupRequired"
                    id="pickupRequired"
                    checked={formData.pickupRequired}
                    onChange={handleChange}
                    className="form-check-input"
                  />
                  <label className="form-check-input-label text-white ms-2" htmlFor="pickupRequired">
                    {formData.pickupRequired ? 'Doorstep Pickup Required' : 'Self Drop-off at Center'}
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small font-weight-bold">Street Address *</label>
                <textarea
                  name="pickupAddress"
                  rows="2"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  placeholder="House/Flat No., Street, Area"
                  className={`form-control form-control-custom ${errors.pickupAddress ? 'is-invalid' : ''}`}
                ></textarea>
                {errors.pickupAddress && <div className="invalid-feedback">{errors.pickupAddress}</div>}
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-muted small font-weight-bold">City *</label>
                  <input
                    type="text"
                    name="pickupCity"
                    value={formData.pickupCity}
                    onChange={handleChange}
                    placeholder="e.g. Chennai"
                    className={`form-control form-control-custom ${errors.pickupCity ? 'is-invalid' : ''}`}
                  />
                  {errors.pickupCity && <div className="invalid-feedback">{errors.pickupCity}</div>}
                </div>

                <div className="col-6">
                  <label className="form-label text-muted small font-weight-bold">State *</label>
                  <input
                    type="text"
                    name="pickupState"
                    value={formData.pickupState}
                    onChange={handleChange}
                    placeholder="e.g. Tamil Nadu"
                    className={`form-control form-control-custom ${errors.pickupState ? 'is-invalid' : ''}`}
                  />
                  {errors.pickupState && <div className="invalid-feedback">{errors.pickupState}</div>}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small font-weight-bold">PIN Code (Indian 6-digit) *</label>
                <input
                  type="text"
                  name="pickupPostalCode"
                  maxLength="6"
                  value={formData.pickupPostalCode}
                  onChange={handleChange}
                  placeholder="e.g. 600001"
                  className={`form-control form-control-custom ${errors.pickupPostalCode ? 'is-invalid' : ''}`}
                />
                {errors.pickupPostalCode && <div className="invalid-feedback">{errors.pickupPostalCode}</div>}
              </div>

              <div className="bg-dark bg-opacity-50 p-3 rounded-4 border border-secondary border-opacity-25 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="text-muted small">Estimated Eco-Reward</span>
                  <span className="text-success font-weight-bold">
                    <i className="bi bi-coin me-1 text-warning"></i> +{formData.quantity * 50} Points
                  </span>
                </div>
                <span className="extra-small text-muted d-block">
                  ⚡ Smart disposal recommendation will be generated instantly upon submission.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary-custom w-100 py-3 font-weight-bold text-white fs-6 rounded-3 shadow-lg"
              >
                {submitting ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span> Submitting &amp; Recommending...
                  </span>
                ) : (
                  <span>
                    <i className="bi bi-magic me-2"></i> Submit &amp; Get Smart Recommendation
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
