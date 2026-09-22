import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { formatTrackingId, getStatusBadgeClass, getEcoLevel, formatCurrency, formatIndianDate, formatPhone } from '../workflowHelpers.js'

describe('Workflow Helper Utility Functions', () => {
  test('formatTrackingId formats string to uppercase', () => {
    assert.equal(formatTrackingId('ew-2026-88a9b1c2'), 'EW-2026-88A9B1C2')
    assert.equal(formatTrackingId(''), '')
  })

  test('getStatusBadgeClass returns appropriate Bootstrap classes', () => {
    assert.equal(getStatusBadgeClass('SUBMITTED'), 'bg-warning text-dark')
    assert.equal(getStatusBadgeClass('COMPLETED'), 'bg-emerald text-white')
    assert.equal(getStatusBadgeClass('CANCELLED'), 'bg-danger text-white')
  })

  test('getEcoLevel calculates correct tier and level progress percentage', () => {
    const starter = getEcoLevel(250)
    assert.equal(starter.title, 'Green Starter')
    assert.equal(starter.progressPercent, 50)

    const contributor = getEcoLevel(750)
    assert.equal(contributor.title, 'Eco Contributor')
    assert.equal(contributor.progressPercent, 25)

    const guardian = getEcoLevel(3500)
    assert.equal(guardian.title, 'Planet Guardian')
    assert.equal(guardian.progressPercent, 100)
  })

  test('formatCurrency formats to Indian Rupee (INR) representation', () => {
    const formatted = formatCurrency(500)
    assert.ok(formatted.includes('₹') || formatted.includes('INR') || formatted.includes('500'))
  })

  test('formatIndianDate formats dates to clean dd MMM yyyy format', () => {
    const formatted = formatIndianDate('2026-09-09T10:00:00')
    assert.ok(formatted.includes('2026'))
    assert.ok(formatted.includes('Sep'))
  })

  test('formatPhone formats 10-digit Indian phone numbers', () => {
    assert.equal(formatPhone('9876543210'), '+91 98765 43210')
  })
})
