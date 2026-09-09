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
    <div className="py-5">
      <div className="grid-split-50-50 my-4">
        {/* Left Column: Brand Statement */}
        <div className="pe-md-4">
          <div className="editorial-tag">SECURE ACCESS PORTAL</div>
          <h1 className="display-hero-title mb-4">ACCESS YOUR ACCOUNT</h1>
          <p className="fs-5 text-secondary">
            Log in to schedule e-waste disposal dispatches, monitor recycling facility stages, and manage eco-credit rewards.
          </p>
        </div>

        {/* Right Column: Clean Form Controls */}
        <div className="border-start ps-md-5 pt-3 pt-md-0">
          <h2 className="h4 text-uppercase fw-bold mb-4 pb-2 border-bottom border-dark">USER AUTHENTICATION</h2>

          {error && <div className="alert alert-danger mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <div>
              <label htmlFor="login-email">Email Address *</label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="login-password">Password *</label>
              <input
                id="login-password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="btn btn-primary-custom w-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'LOG IN ↗'}
              </button>
            </div>
          </form>

          <div className="mt-4 pt-3 border-top border-dark text-muted small">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-dark fw-bold">
              Register Here ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
