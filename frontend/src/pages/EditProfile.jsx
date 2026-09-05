import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function EditProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/user/profile')
      if (res.data) {
        setFormData({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          phoneNumber: res.data.phoneNumber || '',
          address: res.data.address || '',
          city: res.data.city || '',
          state: res.data.state || '',
          postalCode: res.data.postalCode || '',
          country: res.data.country || 'India',
        })
      }
    } catch (err) {
      console.error('Failed to load profile', err)
      setServerError('Unable to load user profile details.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.firstName || !formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    // Phone validation (Indian 10-digit)
    const phoneRegex = /^[6-9][0-9]{9}$/
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be a valid 10-digit Indian mobile number (starting 6-9)'
    }

    // Pincode validation (6-digit)
    const pinRegex = /^[1-9][0-9]{5}$/
    if (formData.postalCode && !pinRegex.test(formData.postalCode)) {
      newErrors.postalCode = 'Pincode must be a valid 6-digit Indian PIN code'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)
    setSuccessMsg(null)

    if (!validate()) return

    try {
      setSubmitting(true)
      const res = await axios.put('/api/user/profile', formData)
      setSuccessMsg('Profile updated successfully!')
    } catch (err) {
      console.error('Failed to update profile', err)
      setServerError(err.response?.data?.error || 'Failed to update profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
        Loading profile details...
      </div>
    )
  }

  return (
    <div className="container py-4" style={{ maxWidth: '800px' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="hero-title h2 mb-1">Edit Profile</h1>
          <p className="text-muted small mb-0">
            Manage your personal profile, primary contact details, and pickup address.
          </p>
        </div>
        <button onClick={() => navigate('/user/dashboard')} className="btn btn-outline-custom">
          <i className="bi bi-arrow-left me-1"></i> Dashboard
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success border-0 rounded-4 shadow-sm mb-4 alert-dismissible fade show">
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)}></button>
        </div>
      )}

      {serverError && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {serverError}
        </div>
      )}

      <div className="glass-card">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label text-muted small font-weight-bold">Email Address (Account ID)</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="form-control form-control-custom opacity-75"
            />
            <span className="text-muted extra-small">Email cannot be modified once registered.</span>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label text-muted small font-weight-bold">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g. Rahul"
                className={`form-control form-control-custom ${errors.firstName ? 'is-invalid' : ''}`}
              />
              {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label text-muted small font-weight-bold">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="e.g. Dravid"
                className="form-control form-control-custom"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small font-weight-bold">Contact Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              maxLength="10"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              className={`form-control form-control-custom ${errors.phoneNumber ? 'is-invalid' : ''}`}
            />
            {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small font-weight-bold">Primary Street Address</label>
            <textarea
              name="address"
              rows="2"
              value={formData.address}
              onChange={handleChange}
              placeholder="House/Apartment address for default pickups"
              className="form-control form-control-custom"
            ></textarea>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label text-muted small font-weight-bold">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Chennai"
                className="form-control form-control-custom"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label text-muted small font-weight-bold">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Tamil Nadu"
                className="form-control form-control-custom"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label text-muted small font-weight-bold">Pincode</label>
              <input
                type="text"
                name="postalCode"
                maxLength="6"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="e.g. 600001"
                className={`form-control form-control-custom ${errors.postalCode ? 'is-invalid' : ''}`}
              />
              {errors.postalCode && <div className="invalid-feedback">{errors.postalCode}</div>}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary-custom w-100 py-3 text-white font-weight-bold fs-6 rounded-3 shadow-lg"
          >
            {submitting ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span> Saving Profile...
              </span>
            ) : (
              <span>
                <i className="bi bi-floppy-fill me-2"></i> Save Profile Changes
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
