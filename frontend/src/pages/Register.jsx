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
      newErrors.pincode = 'Must be a valid 6-digit Indian PIN code (e.g. 641001)'
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
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark">
        <div>
          <div className="editorial-tag">ACCOUNT REGISTRATION</div>
          <h1 className="h1 text-uppercase fw-bold m-0">JOIN SMART E-WASTE PLATFORM</h1>
        </div>
      </div>

      {serverError && <div className="alert alert-danger mb-4">{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate style={{ maxWidth: '800px' }}>
        <div className="mb-4">
          <label>Account Category *</label>
          <div className="d-flex gap-3 mt-1">
            <button
              type="button"
              className={`btn ${formData.userType === 'INDIVIDUAL' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
              onClick={() => setFormData(prev => ({ ...prev, userType: 'INDIVIDUAL' }))}
            >
              Individual Citizen
            </button>
            <button
              type="button"
              className={`btn ${formData.userType === 'INSTITUTION' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
              onClick={() => setFormData(prev => ({ ...prev, userType: 'INSTITUTION' }))}
            >
              College / Institutional Bulk
            </button>
          </div>
        </div>

        {formData.userType === 'INSTITUTION' && (
          <div className="p-3 border border-dark mb-4">
            <h2 className="h5 text-uppercase fw-bold mb-3">ORGANIZATION DETAILS</h2>
            <div className="row g-3">
              <div className="col-md-6">
                <label>Organization Name *</label>
                <input
                  type="text"
                  name="organizationName"
                  className={`form-control ${errors.organizationName ? 'is-invalid' : ''}`}
                  placeholder="e.g. IIT Madras"
                  value={formData.organizationName}
                  onChange={handleChange}
                />
                {errors.organizationName && <div className="invalid-feedback">{errors.organizationName}</div>}
              </div>

              <div className="col-md-6">
                <label>Organization Type *</label>
                <select
                  name="organizationType"
                  className="form-select"
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
                <label>Contact Person *</label>
                <input
                  type="text"
                  name="contactPerson"
                  className={`form-control ${errors.contactPerson ? 'is-invalid' : ''}`}
                  placeholder="Contact officer name"
                  value={formData.contactPerson}
                  onChange={handleChange}
                />
                {errors.contactPerson && <div className="invalid-feedback">{errors.contactPerson}</div>}
              </div>

              <div className="col-md-6">
                <label>GST / Registration No. (Optional)</label>
                <input
                  type="text"
                  name="gstNumber"
                  className="form-control"
                  placeholder="33AAAAA0000A1Z5"
                  value={formData.gstNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        <div className="row g-3">
          <div className="col-12">
            <label>Full Name *</label>
            <input
              type="text"
              name="fullName"
              className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
              placeholder="e.g. Ramesh Kumar"
              value={formData.fullName}
              onChange={handleChange}
            />
            {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
          </div>

          <div className="col-md-6">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="col-md-6">
            <label>10-Digit Indian Mobile Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
              placeholder="9876543210"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
          </div>

          <div className="col-md-6">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="col-md-6">
            <label>Account Role *</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="USER">Resident / Business (User)</option>
              <option value="COLLECTOR">E-Waste Collector</option>
              <option value="RECYCLER">Recycling Partner</option>
            </select>
          </div>

          <div className="col-md-4">
            <label>City *</label>
            <input
              type="text"
              name="city"
              className={`form-control ${errors.city ? 'is-invalid' : ''}`}
              placeholder="Coimbatore"
              value={formData.city}
              onChange={handleChange}
            />
            {errors.city && <div className="invalid-feedback">{errors.city}</div>}
          </div>

          <div className="col-md-4">
            <label>State *</label>
            <input
              type="text"
              name="state"
              className={`form-control ${errors.state ? 'is-invalid' : ''}`}
              placeholder="Tamil Nadu"
              value={formData.state}
              onChange={handleChange}
            />
            {errors.state && <div className="invalid-feedback">{errors.state}</div>}
          </div>

          <div className="col-md-4">
            <label>PIN Code (Indian 6-digit) *</label>
            <input
              type="text"
              name="pincode"
              className={`form-control ${errors.pincode ? 'is-invalid' : ''}`}
              placeholder="641001"
              value={formData.pincode}
              onChange={handleChange}
            />
            {errors.pincode && <div className="invalid-feedback">{errors.pincode}</div>}
          </div>
        </div>

        <div className="mt-4 pt-2">
          <button
            type="submit"
            className="btn btn-primary-custom px-5 py-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'CREATE ACCOUNT ↗'}
          </button>
        </div>
      </form>

      <div className="mt-4 pt-3 border-top border-dark text-muted small">
        Already have an account?{' '}
        <Link to="/login" className="text-dark fw-bold">
          Log In Here ↗
        </Link>
      </div>
    </div>
  )
}
