import { formatTrackingId, getStatusBadgeClass, getEcoLevel, formatCurrency, formatIndianDate, formatPhone } from '../workflowHelpers.js'

describe('Workflow Helper Utility Functions', () => {
  test('formatTrackingId formats string to uppercase', () => {
    expect(formatTrackingId('ew-2026-88a9b1c2')).toBe('EW-2026-88A9B1C2')
    expect(formatTrackingId('')).toBe('')
  })

  test('getStatusBadgeClass returns appropriate Bootstrap classes', () => {
    expect(getStatusBadgeClass('SUBMITTED')).toBe('bg-warning text-dark')
    expect(getStatusBadgeClass('COMPLETED')).toBe('bg-emerald text-white')
    expect(getStatusBadgeClass('CANCELLED')).toBe('bg-danger text-white')
  })

  test('getEcoLevel calculates correct tier and level progress percentage', () => {
    const starter = getEcoLevel(250)
    expect(starter.title).toBe('Green Starter')
    expect(starter.progressPercent).toBe(50)

    const contributor = getEcoLevel(750)
    expect(contributor.title).toBe('Eco Contributor')
    expect(contributor.progressPercent).toBe(25)

    const guardian = getEcoLevel(3500)
    expect(guardian.title).toBe('Planet Guardian')
    expect(guardian.progressPercent).toBe(100)
  })

  test('formatCurrency formats to Indian Rupee (INR) representation', () => {
    const formatted = formatCurrency(500)
    expect(formatted).toContain('₹')
    expect(formatted).toContain('500')
  })

  test('formatIndianDate formats dates to clean dd MMM yyyy format', () => {
    const formatted = formatIndianDate('2026-09-09T10:00:00')
    expect(formatted).toContain('2026')
    expect(formatted).toContain('Sep')
  })

  test('formatPhone formats 10-digit Indian phone numbers', () => {
    expect(formatPhone('9876543210')).toBe('+91 98765 43210')
  })
})
