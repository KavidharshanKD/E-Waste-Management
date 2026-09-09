import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

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

  // Smart Recommendation Result State
  const [createdRequest, setCreatedRequest] = useState(null)

  useEffect(() => {
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
      .catch(() => {})
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

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrors(prev => ({
        ...prev,
        image: 'Allowed formats: JPEG, PNG, WEBP, GIF.',
      }))
      return
    }

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
    
    const pinRegex = /^[1-9][0-9]{5}$/
    if (!formData.pickupPostalCode || !pinRegex.test(formData.pickupPostalCode)) {
      newErrors.pickupPostalCode = 'Valid 6-digit Indian PIN Code is required (e.g. 641001)'
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

  // Full-Width Editorial Outcome Recommendation Display
  if (createdRequest) {
    return (
      <div className="py-4">
        <div className="editorial-tag">04 / DISPOSAL RECOMMENDATION</div>
        
        <div className="my-4 pb-4 border-bottom border-dark">
          <div className="text-uppercase small fw-bold text-muted">TRACKING NUMBER</div>
          <div className="display-hero-title text-success my-2">
            {createdRequest.trackingNumber}
          </div>
          <p className="fs-5 text-secondary">
            Request logged successfully. Our automated recommendation system has evaluated your device details.
          </p>
        </div>

        <div className="grid-split-60-40 my-5">
          <div>
            <h2 className="h1 text-uppercase fw-bold mb-3">
              YOUR BEST NEXT STEP:<br />
              {createdRequest.recommendedAction ? createdRequest.recommendedAction.replace(/_/g, ' ') : 'RESPONSIBLE RECYCLING'}
            </h2>
            <p className="fs-5 text-secondary mb-4">
              {createdRequest.recommendationExplanation || 'Based on age and condition, this device will be directed to an authorized recovery center for component salvaging and zero-landfill material processing.'}
            </p>
            {createdRequest.handlingAdvice && (
              <div className="p-3 bg-white border border-dark mb-4">
                <div className="fw-bold text-uppercase small mb-1">HANDLING ADVICE</div>
                <div className="small text-secondary">{createdRequest.handlingAdvice}</div>
              </div>
            )}
            <div className="d-flex gap-3 flex-wrap">
              <Link to={`/user/requests/${createdRequest.id}`} className="btn btn-primary-custom">
                View Request Stream ↗
              </Link>
              <button
                onClick={() => {
                  setCreatedRequest(null)
                  setFormData(prev => ({ ...prev, deviceName: '', description: '' }))
                  setImageFile(null)
                  setImagePreview(null)
                }}
                className="btn btn-outline-custom"
              >
                Add Another Device ↗
              </button>
            </div>
          </div>

          <div className="border-start ps-md-4 pt-3 pt-md-0">
            <h3 className="h5 text-uppercase fw-bold mb-3">DISPOSAL SUMMARY</h3>
            <div className="d-flex flex-column gap-2 text-secondary fs-6">
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Equipment:</span>
                <strong className="text-dark">{createdRequest.items?.[0]?.deviceName || formData.deviceName}</strong>
              </div>
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Brand:</span>
                <strong className="text-dark">{createdRequest.items?.[0]?.brand || formData.brand}</strong>
              </div>
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Pickup Location:</span>
                <strong className="text-dark">{createdRequest.pickupCity}, {createdRequest.pickupState}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Estimated Reward:</span>
                <strong className="text-success">+{formData.quantity * 50} PTS</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark">
        <div>
          <div className="editorial-tag">NEW E-WASTE SUBMISSION</div>
          <h1 className="h2 text-uppercase fw-bold m-0">DISPOSE ELECTRONIC EQUIPMENT</h1>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-outline-custom">
          Back ↗
        </button>
      </div>

      {serverError && (
        <div className="alert alert-danger mb-4">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 01: Device Info */}
        <section className="mb-5">
          <div className="d-flex align-items-baseline gap-3 mb-3">
            <span className="fs-3 fw-bold text-success font-heading">01</span>
            <h2 className="h4 text-uppercase fw-bold m-0">WHAT ARE YOU DISPOSING?</h2>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <label>Device Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
              >
                {EWASTE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label>Device Model / Name *</label>
              <input
                type="text"
                name="deviceName"
                value={formData.deviceName}
                onChange={handleChange}
                placeholder="e.g. ThinkPad T14, Galaxy S21"
                className={`form-control ${errors.deviceName ? 'is-invalid' : ''}`}
              />
              {errors.deviceName && <div className="invalid-feedback">{errors.deviceName}</div>}
            </div>

            <div className="col-md-6">
              <label>Brand / Manufacturer *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Lenovo, Samsung, Apple"
                className={`form-control ${errors.brand ? 'is-invalid' : ''}`}
              />
              {errors.brand && <div className="invalid-feedback">{errors.brand}</div>}
            </div>

            <div className="col-md-3">
              <label>Approx. Age (Years)</label>
              <input
                type="number"
                name="approxAgeYears"
                min="0"
                value={formData.approxAgeYears}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-3">
              <label>Quantity *</label>
              <input
                type="number"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
        </section>

        <div className="thin-rule"></div>

        {/* Step 02: Device Condition */}
        <section className="mb-5">
          <div className="d-flex align-items-baseline gap-3 mb-3">
            <span className="fs-3 fw-bold text-success font-heading">02</span>
            <h2 className="h4 text-uppercase fw-bold m-0">DEVICE CONDITION</h2>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <label>Overall Operating Condition *</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="form-select"
              >
                {DEVICE_CONDITIONS.map(cond => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label>Working / Damage Details</label>
              <input
                type="text"
                name="workingStatus"
                value={formData.workingStatus}
                onChange={handleChange}
                placeholder="e.g. Screen intact, battery degraded"
                className="form-control"
              />
            </div>

            <div className="col-12">
              <label>Photo Upload (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="form-control"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" style={{ maxHeight: '120px' }} className="border" />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="thin-rule"></div>

        {/* Step 03: Pickup Address */}
        <section className="mb-5">
          <div className="d-flex align-items-baseline gap-3 mb-3">
            <span className="fs-3 fw-bold text-success font-heading">03</span>
            <h2 className="h4 text-uppercase fw-bold m-0">COLLECTION ADDRESS</h2>
          </div>

          <div className="row g-4">
            <div className="col-12">
              <label>Street Address *</label>
              <textarea
                name="pickupAddress"
                rows="2"
                value={formData.pickupAddress}
                onChange={handleChange}
                placeholder="House No, Building, Street, Area"
                className={`form-control ${errors.pickupAddress ? 'is-invalid' : ''}`}
              ></textarea>
              {errors.pickupAddress && <div className="invalid-feedback">{errors.pickupAddress}</div>}
            </div>

            <div className="col-md-4">
              <label>City *</label>
              <input
                type="text"
                name="pickupCity"
                value={formData.pickupCity}
                onChange={handleChange}
                placeholder="e.g. Coimbatore"
                className={`form-control ${errors.pickupCity ? 'is-invalid' : ''}`}
              />
              {errors.pickupCity && <div className="invalid-feedback">{errors.pickupCity}</div>}
            </div>

            <div className="col-md-4">
              <label>State *</label>
              <input
                type="text"
                name="pickupState"
                value={formData.pickupState}
                onChange={handleChange}
                placeholder="e.g. Tamil Nadu"
                className={`form-control ${errors.pickupState ? 'is-invalid' : ''}`}
              />
              {errors.pickupState && <div className="invalid-feedback">{errors.pickupState}</div>}
            </div>

            <div className="col-md-4">
              <label>PIN Code (Indian 6-digit) *</label>
              <input
                type="text"
                name="pickupPostalCode"
                maxLength="6"
                value={formData.pickupPostalCode}
                onChange={handleChange}
                placeholder="e.g. 641001"
                className={`form-control ${errors.pickupPostalCode ? 'is-invalid' : ''}`}
              />
              {errors.pickupPostalCode && <div className="invalid-feedback">{errors.pickupPostalCode}</div>}
            </div>
          </div>
        </section>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary-custom px-5 py-3"
          >
            {submitting ? 'Submitting & Recommending...' : 'SUBMIT & GET SMART RECOMMENDATION ↗'}
          </button>
        </div>
      </form>
    </div>
  )
}
