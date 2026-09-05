import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    city: '',
    state: '',
    pincode: '',
    role: 'USER',
    userType: 'INDIVIDUAL',
    organizationName: '',
    organizationType: 'COLLEGE',
    gstNumber: '',
    contactPerson: ''
  })

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, getDashboardPathByRole } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address'
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Mobile number is required'
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Must be a valid 10-digit Indian mobile number (e.g. 9876543210)'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    }

    if (formData.userType === 'INSTITUTION') {
      if (!formData.organizationName.trim()) {
        newErrors.organizationName = 'Organization Name is required for Institutional accounts'
      }
      if (!formData.contactPerson.trim()) {
        newErrors.contactPerson = 'Contact Person name is required'
      }
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required'
    } else if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Must be a valid 6-digit Indian PIN code (e.g. 560001)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    if (!validate()) return

    try {
      setIsSubmitting(true)
      const user = await register(formData)
      const redirectPath = getDashboardPathByRole(user)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please check your inputs.'
      setServerError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: '680px' }}>
      <div className="hero-card shadow-lg p-4 p-md-5">
        <div className="text-center mb-4">
          <div className="brand-icon mx-auto mb-3" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
            <i className="bi bi-person-plus-fill"></i>
          </div>
          <h2 className="hero-title h3 mb-1">Create an Account</h2>
          <p className="hero-description text-muted small">
            Join the Smart E-Waste Management &amp; Recycling Platform.
          </p>
        </div>

        {serverError && (
          <div className="alert alert-danger d-flex align-items-center mb-4 rounded-3 text-start small" role="alert">
            <i className="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
            <div>{serverError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            {/* User Category: Individual vs Institution */}
            <div className="col-12 mb-2">
              <label className="form-label text-white small fw-bold">Account Category *</label>
              <div className="d-flex gap-3">
                <div
                  className={`flex-fill p-3 rounded-3 border text-center cursor-pointer ${formData.userType === 'INDIVIDUAL' ? 'border-success bg-success bg-opacity-10 text-white' : 'border-secondary text-muted'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'INDIVIDUAL' }))}
                >
                  <i className="bi bi-person-fill fs-4 d-block mb-1"></i>
                  <span className="fw-semibold small">Individual Citizen</span>
                </div>
                <div
                  className={`flex-fill p-3 rounded-3 border text-center cursor-pointer ${formData.userType === 'INSTITUTION' ? 'border-success bg-success bg-opacity-10 text-white' : 'border-secondary text-muted'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'INSTITUTION' }))}
                >
                  <i className="bi bi-building-check fs-4 d-block mb-1"></i>
                  <span className="fw-semibold small">College / Corporate Bulk</span>
                </div>
              </div>
            </div>

            {/* Institutional Fields */}
            {formData.userType === 'INSTITUTION' && (
              <div className="col-12 p-3 rounded-3 bg-dark border border-success border-opacity-25 mb-2">
                <h6 className="text-success small fw-bold mb-3">
                  <i className="bi bi-building me-2"></i> Organization / Bulk Entity Details
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-white small fw-bold">Organization Name *</label>
                    <input
                      type="text"
                      name="organizationName"
                      className={`form-control bg-dark text-white border-secondary ${errors.organizationName ? 'is-invalid' : ''}`}
                      placeholder="e.g. IIT Madras / Infosys Ltd"
                      value={formData.organizationName}
                      onChange={handleChange}
                    />
                    {errors.organizationName && <div className="invalid-feedback">{errors.organizationName}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-white small fw-bold">Organization Type *</label>
                    <select
                      name="organizationType"
                      className="form-select bg-dark text-white border-secondary"
                      value={formData.organizationType}
                      onChange={handleChange}
                    >
                      <option value="COLLEGE">Educational Institution / College</option>
                      <option value="IT_COMPANY">IT / Tech Enterprise</option>
                      <option value="HOSPITAL">Hospital / Healthcare</option>
                      <option value="GOVERNMENT">Government Department</option>
                      <option value="PRIVATE_ENTERPRISE">Private Business</option>
                      <option value="OTHER">Other Organization</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-white small fw-bold">Contact Person *</label>
                    <input
                      type="text"
                      name="contactPerson"
                      className={`form-control bg-dark text-white border-secondary ${errors.contactPerson ? 'is-invalid' : ''}`}
                      placeholder="e.g. Dr. A. Sharma (IT Head)"
                      value={formData.contactPerson}
                      onChange={handleChange}
                    />
                    {errors.contactPerson && <div className="invalid-feedback">{errors.contactPerson}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-white small fw-bold">GST / Registration No. (Optional)</label>
                    <input
                      type="text"
                      name="gstNumber"
                      className="form-control bg-dark text-white border-secondary"
                      placeholder="33AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Full Name */}
            <div className="col-12">
              <label className="form-label text-white small fw-bold">Full Name *</label>
              <input
                type="text"
                name="fullName"
                className={`form-control bg-dark text-white border-secondary ${errors.fullName ? 'is-invalid' : ''}`}
                placeholder="e.g. Ramesh Kumar"
                value={formData.fullName}
                onChange={handleChange}
              />
              {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
            </div>

            {/* Email */}
            <div className="col-md-6">
              <label className="form-label text-white small fw-bold">Email Address *</label>
              <input
                type="email"
                name="email"
                className={`form-control bg-dark text-white border-secondary ${errors.email ? 'is-invalid' : ''}`}
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            {/* Phone Number */}
            <div className="col-md-6">
              <label className="form-label text-white small fw-bold">10-Digit Mobile Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                className={`form-control bg-dark text-white border-secondary ${errors.phoneNumber ? 'is-invalid' : ''}`}
                placeholder="9876543210"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
            </div>

            {/* Password */}
            <div className="col-md-6">
              <label className="form-label text-white small fw-bold">Password *</label>
              <input
                type="password"
                name="password"
                className={`form-control bg-dark text-white border-secondary ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            {/* Account Role */}
            <div className="col-md-6">
              <label className="form-label text-white small fw-bold">Account Role *</label>
              <select
                name="role"
                className="form-select bg-dark text-white border-secondary"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="USER">Resident / Business (User)</option>
                <option value="COLLECTOR">E-Waste Collector</option>
                <option value="RECYCLER">Recycling Partner</option>
              </select>
            </div>

            {/* City */}
            <div className="col-md-4">
              <label className="form-label text-white small fw-bold">City *</label>
              <input
                type="text"
                name="city"
                className={`form-control bg-dark text-white border-secondary ${errors.city ? 'is-invalid' : ''}`}
                placeholder="Bengaluru"
                value={formData.city}
                onChange={handleChange}
              />
              {errors.city && <div className="invalid-feedback">{errors.city}</div>}
            </div>

            {/* State */}
            <div className="col-md-4">
              <label className="form-label text-white small fw-bold">State *</label>
              <input
                type="text"
                name="state"
                className={`form-control bg-dark text-white border-secondary ${errors.state ? 'is-invalid' : ''}`}
                placeholder="Karnataka"
                value={formData.state}
                onChange={handleChange}
              />
              {errors.state && <div className="invalid-feedback">{errors.state}</div>}
            </div>

            {/* Pincode */}
            <div className="col-md-4">
              <label className="form-label text-white small fw-bold">Pincode *</label>
              <input
                type="text"
                name="pincode"
                className={`form-control bg-dark text-white border-secondary ${errors.pincode ? 'is-invalid' : ''}`}
                placeholder="560001"
                value={formData.pincode}
                onChange={handleChange}
              />
              {errors.pincode && <div className="invalid-feedback">{errors.pincode}</div>}
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="submit"
              className="btn btn-primary-custom w-100 py-2.5 justify-content-center fw-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill me-2"></i> Register Account
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-25 small text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-success text-decoration-none fw-semibold">
            Log In Here
          </Link>
        </div>
      </div>
    </div>
  )
}
