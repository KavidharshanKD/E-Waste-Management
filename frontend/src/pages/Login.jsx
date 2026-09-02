import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login, getDashboardPathByRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    try {
      setIsSubmitting(true)
      const user = await login({ email, password })
      const redirectPath = location.state?.from?.pathname || getDashboardPathByRole(user.role)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Invalid credentials. Please check your email and password.'
      setError(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: '480px' }}>
      <div className="hero-card shadow-lg p-4 p-md-5">
        <div className="text-center mb-4">
          <div className="brand-icon mx-auto mb-3" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <h2 className="hero-title h3 mb-1">Welcome Back</h2>
          <p className="hero-description text-muted small">
            Log in to manage e-waste requests, track recycling status &amp; view eco-rewards.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4 rounded-3 text-start small" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-white small fw-bold">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control bg-dark text-white border-secondary"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-white small fw-bold">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <i className="bi bi-key"></i>
              </span>
              <input
                type="password"
                className="form-control bg-dark text-white border-secondary"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary-custom w-100 py-2.5 justify-content-center fw-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i> Log In
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-25 small text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-success text-decoration-none fw-semibold">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  )
}
