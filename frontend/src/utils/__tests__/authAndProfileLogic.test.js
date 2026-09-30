import { describe, it } from 'node:test'
import assert from 'node:assert'

// Display name calculation logic as implemented in App.jsx HeaderNav
function getUserDisplayName(user) {
  if (!user) return 'Profile'
  const first = user.profile?.firstName?.trim()
  const last = user.profile?.lastName?.trim()
  if (first || last) {
    return [first, last].filter(Boolean).join(' ')
  }
  if (user.fullName?.trim()) {
    return user.fullName.trim()
  }
  if (user.email) {
    return user.email.split('@')[0]
  }
  return 'Profile'
}

// Login error resolution logic as implemented in Login.jsx
function resolveLoginErrorMessage(err) {
  const rawMsg = err?.response?.data?.message || err?.response?.data?.error
  if (!rawMsg) {
    return 'Invalid email or password. Please verify your credentials and try again.'
  }
  const lower = rawMsg.toLowerCase()
  if (lower.includes('forbidden') || lower.includes('access denied')) {
    return 'Invalid email or password. Please verify your credentials and try again.'
  }
  return rawMsg
}

// Password reset validation logic as implemented in ForgotPassword.jsx
function validateResetPasswordForm({ email, code, newPassword, confirmPassword }) {
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Valid email is required' }
  }
  if (!code || code.trim().length !== 6 || !/^\d{6}$/.test(code.trim())) {
    return { valid: false, error: 'Verification code must be exactly 6 digits' }
  }
  if (!newPassword || newPassword.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' }
  }
  if (newPassword !== confirmPassword) {
    return { valid: false, error: 'New passwords do not match' }
  }
  return { valid: true, error: null }
}

describe('Auth & Profile Presentation Logic', () => {
  it('prefers profile firstName and lastName over email', () => {
    const user = {
      email: 'rahul@example.com',
      fullName: 'Rahul Dravid',
      profile: { firstName: 'Rahul', lastName: 'Dravid' }
    }
    assert.strictEqual(getUserDisplayName(user), 'Rahul Dravid')
  })

  it('falls back to single firstName if lastName is empty', () => {
    const user = {
      email: 'priya@example.com',
      profile: { firstName: 'Priya', lastName: '' }
    }
    assert.strictEqual(getUserDisplayName(user), 'Priya')
  })

  it('falls back to fullName when profile names are omitted', () => {
    const user = {
      email: 'collector@example.com',
      fullName: 'Chennai Eco Collector'
    }
    assert.strictEqual(getUserDisplayName(user), 'Chennai Eco Collector')
  })

  it('falls back to email prefix when no name exists', () => {
    const user = {
      email: 'kavidharshan@ewaste.org'
    }
    assert.strictEqual(getUserDisplayName(user), 'kavidharshan')
  })

  it('replaces raw "Forbidden" response with user-friendly error message', () => {
    const err = { response: { data: { error: 'Forbidden', message: 'Access Denied' } } }
    const msg = resolveLoginErrorMessage(err)
    assert.strictEqual(msg, 'Invalid email or password. Please verify your credentials and try again.')
  })

  it('preserves helpful non-forbidden backend messages', () => {
    const err = { response: { data: { message: 'Your account is currently disabled. Please contact an administrator.' } } }
    const msg = resolveLoginErrorMessage(err)
    assert.strictEqual(msg, 'Your account is currently disabled. Please contact an administrator.')
  })

  it('validates 6-digit OTP code and password matching for reset password flow', () => {
    const invalidOtp = validateResetPasswordForm({
      email: 'user@test.com',
      code: '123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123'
    })
    assert.strictEqual(invalidOtp.valid, false)
    assert.strictEqual(invalidOtp.error, 'Verification code must be exactly 6 digits')

    const mismatch = validateResetPasswordForm({
      email: 'user@test.com',
      code: '123456',
      newPassword: 'passwordA',
      confirmPassword: 'passwordB'
    })
    assert.strictEqual(mismatch.valid, false)
    assert.strictEqual(mismatch.error, 'New passwords do not match')

    const valid = validateResetPasswordForm({
      email: 'user@test.com',
      code: '123456',
      newPassword: 'securePassword123',
      confirmPassword: 'securePassword123'
    })
    assert.strictEqual(valid.valid, true)
    assert.strictEqual(valid.error, null)
  })
})
