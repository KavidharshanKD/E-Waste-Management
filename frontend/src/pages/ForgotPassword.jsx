import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1: Request Code, 2: Reset Password
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [resendStatus, setResendStatus] = useState('')

  // Handle Step 1: Request OTP code
  const handleRequestCode = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!email || !email.trim()) {
      setError('Please enter your registered email address.')
      return
    }

    try {
      setLoading(true)
      const res = await axios.post('/api/auth/forgot-password', { email: email.trim() })
      setSuccessMsg(res.data?.message || 'A 6-digit verification code has been sent to your email.')
      setStep(2)
    } catch (err) {
      console.error('Forgot password error:', err)
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to process password reset request. Please check the email and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Handle Step 2: Reset password with OTP code
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!code || code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.')
      return
    }

    try {
      setLoading(true)
      const res = await axios.post('/api/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword
      })

      setSuccessMsg(res.data?.message || 'Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (err) {
      console.error('Reset password error:', err)
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid or expired verification code. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP handler
  const handleResendCode = async () => {
    setError('')
    setResendStatus('Resending verification code...')
    try {
      const res = await axios.post('/api/auth/forgot-password', { email: email.trim() })
      setResendStatus('New verification code sent!')
      setTimeout(() => setResendStatus(''), 4000)
    } catch (err) {
      setResendStatus('')
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.')
    }
  }

  return (
    <div className="py-5">
      <div className="grid-split-50-50 my-4">
        {/* Left Column: Context / Brand */}
        <div className="pe-md-4">
          <div className="editorial-tag">ACCOUNT SECURITY RECOVERY</div>
          <h1 className="display-hero-title mb-4">RESET PASSWORD</h1>
          <p className="fs-5 text-secondary">
            Retrieve access to your Smart E-Waste Management account safely through our two-step email verification protocol.
          </p>
          <div className="p-3 border rounded-3 bg-light mt-4">
            <h6 className="fw-bold mb-2">
              <i className="bi bi-shield-check text-success me-2"></i>How It Works
            </h6>
            <ol className="small text-muted mb-0 ps-3">
              <li className="mb-1">Submit your registered account email.</li>
              <li className="mb-1">Receive a secure 6-digit verification code.</li>
              <li>Set and confirm your new account password.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: Interactive Form */}
        <div className="border-start ps-md-5 pt-3 pt-md-0">
          <h2 className="h4 text-uppercase fw-bold mb-4 pb-2 border-bottom border-dark">
            {step === 1 ? '1. REQUEST VERIFICATION CODE' : '2. ENTER CODE & NEW PASSWORD'}
          </h2>

          {error && (
            <div className="alert alert-danger border-0 rounded-3 shadow-sm mb-4">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success border-0 rounded-3 shadow-sm mb-4">
              <i className="bi bi-check-circle-fill me-2"></i>
              {successMsg}
            </div>
          )}

          {resendStatus && (
            <div className="alert alert-info border-0 rounded-3 shadow-sm mb-4">
              <i className="bi bi-info-circle-fill me-2"></i>
              {resendStatus}
            </div>
          )}

          {step === 1 ? (
            /* STEP 1 FORM */
            <form onSubmit={handleRequestCode} className="d-flex flex-column gap-3">
              <div>
                <label htmlFor="reset-email" className="form-label fw-semibold">
                  Registered Email Address *
                </label>
                <input
                  id="reset-email"
                  type="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <span className="text-muted extra-small">
                  We'll send a 6-digit verification code valid for 15 minutes.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn btn-primary-custom w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Sending Verification Code...
                    </span>
                  ) : (
                    'SEND VERIFICATION CODE ↗'
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link to="/login" className="text-muted small text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i> Back to Log In
                </Link>
              </div>
            </form>
          ) : (
            /* STEP 2 FORM */
            <form onSubmit={handleResetPassword} className="d-flex flex-column gap-3">
              <div className="p-2.5 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                <div className="small text-truncate">
                  <span className="text-muted">Target Account: </span>
                  <strong>{email}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setSuccessMsg(''); }}
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                >
                  Change
                </button>
              </div>

              <div>
                <label htmlFor="reset-code" className="form-label fw-semibold">
                  6-Digit Verification Code *
                </label>
                <input
                  id="reset-code"
                  type="text"
                  maxLength="6"
                  className="form-control font-monospace fs-5 text-center letter-spacing-wide"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <span className="text-muted extra-small">Check your email inbox or spam folder</span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="btn btn-link btn-sm p-0 extra-small text-decoration-none"
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-password" className="form-label fw-semibold">
                  New Password *
                </label>
                <input
                  id="new-password"
                  type="password"
                  className="form-control"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="form-label fw-semibold">
                  Confirm New Password *
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn btn-primary-custom w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating Password...
                    </span>
                  ) : (
                    'RESET PASSWORD & LOG IN ↗'
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link to="/login" className="text-muted small text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i> Back to Log In
                </Link>
              </div>
            </form>
          )}

          <div className="mt-4 pt-3 border-top border-dark text-muted small">
            Remembered your password?{' '}
            <Link to="/login" className="text-dark fw-bold">
              Log In Here ↗
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
