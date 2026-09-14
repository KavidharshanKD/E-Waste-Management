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
  { value: 'HAZARDOUS', label: 'Hazardous (Leaking / Swollen battery)' },
]

const USER_INTENTIONS = [
  {
    value: 'KEEP_USING',
    title: 'Keep Using',
    badge: 'Longevity',
    description: 'I want to continue using the device if possible with maintenance or minor tuning.',
  },
  {
    value: 'REPAIR',
    title: 'Repair Device',
    badge: 'Restoration',
    description: 'I want to repair specific faults or replace worn components to restore full operation.',
  },
  {
    value: 'REFURBISH',
    title: 'Refurbish',
    badge: 'Renewal',
    description: 'I want the device thoroughly serviced, sanitized, and renewed for secondary life.',
  },
  {
    value: 'REFURBISH_AND_SELL',
    title: 'Refurbish & Sell',
    badge: 'Circular Resale',
    description: 'I want the device refurbished, graded, and listed on the marketplace for secondary sale.',
  },
  {
    value: 'DONATE',
    title: 'Donate',
    badge: 'Community',
    description: 'I want to donate this functional device to educational or community programs.',
  },
  {
    value: 'RECYCLE',
    title: 'Recycle Responsibly',
    badge: 'Zero Landfill',
    description: 'I want this end-of-life device responsibly recycled with zero landfill footprint.',
  },
  {
    value: 'UNSURE',
    title: 'Recommend Best Option',
    badge: 'AI Assessment',
    description: 'I am not sure. Evaluate the device condition and advise the optimal course of action.',
  },
]

const SCREEN_CONDITIONS = [
  { value: 'INTACT', label: 'Screen Pristine / Intact' },
  { value: 'MINOR_SCRATCHES', label: 'Minor Scratches (Display fully readable)' },
  { value: 'CRACKED', label: 'Cracked Glass (Display still visible)' },
  { value: 'DEAD_PIXELS_BLEED', label: 'Discoloration / Dead Pixels / Bleeding' },
  { value: 'SHATTERED_NOT_WORKING', label: 'Shattered / Blank / No Display Output' },
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
    // Module 1: User Intention & Extended Assessment fields
    userIntention: 'UNSURE',
    powersOn: 'true',
    screenCondition: 'INTACT',
    batterySwollen: false,
    batteryLeaking: false,
    overheatingEvidence: false,
    severePhysicalDamage: false,
    functionalIssues: '',
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  // Smart Recommendation Result State
  const [createdRequest, setCreatedRequest] = useState(null)

  const hasScreen = ['MOBILE_PHONE', 'LAPTOP', 'MONITOR', 'TELEVISION'].includes(formData.category)
  const hasBattery = ['MOBILE_PHONE', 'LAPTOP', 'BATTERY'].includes(formData.category)
  const isPowered = !['CABLE', 'KEYBOARD', 'MOUSE'].includes(formData.category)
  const isStandaloneBattery = formData.category === 'BATTERY'

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

  const handleIntentionSelect = (intentionValue) => {
    setFormData(prev => ({ ...prev, userIntention: intentionValue }))
    if (errors.userIntention) {
      setErrors(prev => ({ ...prev, userIntention: null }))
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

      // Module 1: User Intention and Extended Assessment
      bodyData.append('userIntention', formData.userIntention || 'UNSURE')
      if (isPowered) {
        bodyData.append('powersOn', formData.powersOn === 'true')
      }
      if (hasScreen) {
        bodyData.append('screenCondition', formData.screenCondition)
      }
      bodyData.append('batterySwollen', Boolean(formData.batterySwollen))
      bodyData.append('batteryLeaking', Boolean(formData.batteryLeaking))
      bodyData.append('overheatingEvidence', Boolean(formData.overheatingEvidence))
      bodyData.append('severePhysicalDamage', Boolean(formData.severePhysicalDamage))
      if (formData.functionalIssues && formData.functionalIssues.trim()) {
        bodyData.append('functionalIssues', formData.functionalIssues.trim())
      }

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
    const selectedIntentionObj = USER_INTENTIONS.find(i => i.value === createdRequest.userIntention)
    const isSpecialHandling = createdRequest.recommendedAction === 'SPECIAL_HANDLING'

    return (
      <div className="py-4">
        <div className="editorial-tag">05 / ASSESSMENT & RECOMMENDATION</div>
        
        <div className="my-4 pb-4 border-bottom border-dark">
          <div className="text-uppercase small fw-bold text-muted">TRACKING NUMBER</div>
          <div className={`display-hero-title my-2 ${isSpecialHandling ? 'text-danger' : 'text-success'}`}>
            {createdRequest.trackingNumber}
          </div>
          <p className="fs-5 text-secondary">
            Request logged successfully. The system has analyzed both your intended device outcome and physical diagnostics.
          </p>
        </div>

        <div className="grid-split-60-40 my-5">
          <div>
            <h2 className="h1 text-uppercase fw-bold mb-3">
              RECOMMENDED ACTION:<br />
              {createdRequest.recommendedAction ? createdRequest.recommendedAction.replace(/_/g, ' ') : 'RESPONSIBLE RECYCLING'}
            </h2>
            <p className="fs-5 text-secondary mb-4">
              {createdRequest.recommendationExplanation || 'Based on age, condition, and declared intent, this device will be routed to an authorized facility for optimal circular resource recovery.'}
            </p>
            {createdRequest.handlingAdvice && (
              <div className={`p-3 bg-white border ${isSpecialHandling ? 'border-danger' : 'border-dark'} mb-4`}>
                <div className={`fw-bold text-uppercase small mb-1 ${isSpecialHandling ? 'text-danger' : ''}`}>
                  {isSpecialHandling ? '⚠ CRITICAL HANDLING ADVICE' : 'HANDLING ADVICE'}
                </div>
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
                  setFormData(prev => ({
                    ...prev,
                    deviceName: '',
                    description: '',
                    functionalIssues: '',
                    batterySwollen: false,
                    batteryLeaking: false,
                    overheatingEvidence: false,
                    severePhysicalDamage: false,
                    userIntention: 'UNSURE',
                  }))
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
            <h3 className="h5 text-uppercase fw-bold mb-3">INTAKE ASSESSMENT SUMMARY</h3>
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
                <span>Your Intent:</span>
                <strong className="text-dark">{selectedIntentionObj ? selectedIntentionObj.title : (createdRequest.userIntention || 'Unsure')}</strong>
              </div>
              <div className="d-flex justify-content-between pb-2 border-bottom">
                <span>Recommended:</span>
                <strong className={isSpecialHandling ? 'text-danger' : 'text-success'}>
                  {createdRequest.recommendedAction ? createdRequest.recommendedAction.replace(/_/g, ' ') : 'RECYCLE'}
                </strong>
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
          <div className="editorial-tag">CIRCULAR E-WASTE INTAKE</div>
          <h1 className="h2 text-uppercase fw-bold m-0">DEVICE INTAKE & ASSESSMENT</h1>
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
        {/* Step 01: Device Identification */}
        <section className="mb-5">
          <div className="d-flex align-items-baseline gap-3 mb-3">
            <span className="fs-3 fw-bold text-success font-heading">01</span>
            <h2 className="h4 text-uppercase fw-bold m-0">WHAT ARE YOU SUBMITTING?</h2>
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
                placeholder="e.g. ThinkPad T14, Galaxy S21, MacBook Pro"
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
                placeholder="e.g. Lenovo, Samsung, Apple, Dell"
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

        {/* Step 02: User Intention Selection */}
        <section className="mb-5">
          <div className="d-flex align-items-baseline gap-3 mb-2">
            <span className="fs-3 fw-bold text-success font-heading">02</span>
            <div>
              <h2 className="h4 text-uppercase fw-bold m-0">WHAT WOULD YOU LIKE TO DO WITH THIS DEVICE?</h2>
              <p className="text-secondary small m-0 mt-1">
                Tell us your desired intention. Our recommendation engine combines your preference with physical diagnostics.
              </p>
            </div>
          </div>

          <div className="row g-3 mt-2">
            {USER_INTENTIONS.map(intent => {
              const isSelected = formData.userIntention === intent.value
              return (
                <div key={intent.value} className="col-md-6 col-lg-4">
                  <div
                    onClick={() => handleIntentionSelect(intent.value)}
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--brand-green)' : '1px solid var(--rule-light)',
                      backgroundColor: isSelected ? 'rgba(27, 67, 50, 0.06)' : 'transparent',
                      padding: '1.15rem',
                      borderRadius: '2px',
                      transition: 'all 160ms ease',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold font-heading text-uppercase" style={{ fontSize: '0.9rem', color: isSelected ? 'var(--brand-green)' : 'var(--text-main)' }}>
                          {intent.title}
                        </span>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isSelected ? 'var(--brand-green)' : 'var(--bg-mineral-alt)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                            fontWeight: '600',
                            fontSize: '0.68rem',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {intent.badge}
                        </span>
                      </div>
                      <p className="small text-secondary mb-0" style={{ lineHeight: '1.45' }}>
                        {intent.description}
                      </p>
                    </div>
                    <div className="mt-2 text-end">
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isSelected ? 'var(--brand-green)' : 'var(--text-muted)' }}>
                        {isSelected ? '● SELECTED' : '○ SELECT'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="thin-rule"></div>

        {/* Step 03: Category-Aware Assessment & Safety */}
        <section className="mb-5">
          <div className="d-flex align-items-baseline gap-3 mb-3">
            <span className="fs-3 fw-bold text-success font-heading">03</span>
            <div>
              <h2 className="h4 text-uppercase fw-bold m-0">DEVICE ASSESSMENT & SAFETY DIAGNOSTICS</h2>
              <p className="text-secondary small m-0 mt-1">
                Help us determine repairability, refurbishment viability, and compliance handling.
              </p>
            </div>
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

            {/* Category-aware: Powers On */}
            {isPowered && (
              <div className="col-md-6">
                <label>Does the device power on / boot up?</label>
                <select
                  name="powersOn"
                  value={formData.powersOn}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="true">Yes — Powers on and displays signs of life</option>
                  <option value="false">No — Completely unresponsive / will not boot</option>
                  <option value="unknown">Unsure / Missing power adapter</option>
                </select>
              </div>
            )}

            {/* Category-aware: Screen Condition */}
            {hasScreen && (
              <div className="col-md-6">
                <label>Screen / Display State</label>
                <select
                  name="screenCondition"
                  value={formData.screenCondition}
                  onChange={handleChange}
                  className="form-select"
                >
                  {SCREEN_CONDITIONS.map(sc => (
                    <option key={sc.value} value={sc.value}>{sc.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Category-aware: Battery Condition Note */}
            {hasBattery && !isStandaloneBattery && (
              <div className="col-md-6">
                <label>Battery Health Status</label>
                <input
                  type="text"
                  name="batteryCondition"
                  value={formData.batteryCondition}
                  onChange={handleChange}
                  placeholder="e.g. Normal, Drains fast (<1 hr), Needs constant plug-in"
                  className="form-control"
                />
              </div>
            )}

            {/* Functional Issues */}
            <div className="col-md-6">
              <label>Functional or Hardware Issues</label>
              <input
                type="text"
                name="functionalIssues"
                value={formData.functionalIssues}
                onChange={handleChange}
                placeholder="e.g. Broken keyboard key, camera not detected, speaker crackles"
                className="form-control"
              />
            </div>

            {/* Photo Upload */}
            <div className="col-md-6">
              <label>Photo Upload (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="form-control"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" style={{ maxHeight: '100px' }} className="border" />
                </div>
              )}
              {errors.image && <div className="text-danger small mt-1">{errors.image}</div>}
            </div>

            {/* Safety & Hazardous Indicators */}
            <div className="col-12">
              <div
                className="p-3"
                style={{
                  border: '1px solid rgba(231, 111, 81, 0.3)',
                  backgroundColor: 'rgba(231, 111, 81, 0.04)',
                  borderRadius: '2px',
                }}
              >
                <div className="fw-bold font-heading text-uppercase small mb-2 text-danger">
                  ⚠ Mandatory Safety & Compliance Checklist
                </div>
                <p className="text-secondary small mb-3">
                  Please check any hazardous conditions that apply to this device. Hazardous units receive specialized safe transport.
                </p>

                <div className="row g-2">
                  {(hasBattery || isStandaloneBattery) && (
                    <>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="batterySwollen"
                            name="batterySwollen"
                            checked={formData.batterySwollen}
                            onChange={handleChange}
                          />
                          <label className="form-check-label small" htmlFor="batterySwollen">
                            Battery is visibly swollen, bloated, or bulging the chassis
                          </label>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="batteryLeaking"
                            name="batteryLeaking"
                            checked={formData.batteryLeaking}
                            onChange={handleChange}
                          />
                          <label className="form-check-label small" htmlFor="batteryLeaking">
                            Battery is leaking fluid, chemical residue, or acid
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="col-md-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="overheatingEvidence"
                        name="overheatingEvidence"
                        checked={formData.overheatingEvidence}
                        onChange={handleChange}
                      />
                      <label className="form-check-label small" htmlFor="overheatingEvidence">
                        Evidence of burning, melted casing, or scorch marks
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="severePhysicalDamage"
                        name="severePhysicalDamage"
                        checked={formData.severePhysicalDamage}
                        onChange={handleChange}
                      />
                      <label className="form-check-label small" htmlFor="severePhysicalDamage">
                        Device is crushed, cracked in half, or water-submerged
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="thin-rule"></div>

        {/* Step 04: Collection Address */}
        <section className="mb-5">
          <div className="d-flex align-items-baseline gap-3 mb-3">
            <span className="fs-3 fw-bold text-success font-heading">04</span>
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
            {submitting ? 'Submitting & Evaluating...' : 'SUBMIT & GET SMART RECOMMENDATION ↗'}
          </button>
        </div>
      </form>
    </div>
  )
}
