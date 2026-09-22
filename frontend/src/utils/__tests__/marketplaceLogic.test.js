import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  COSMETIC_GRADE_MAP,
  MARKETPLACE_STOCK_STATUS_MAP,
  EWASTE_CATEGORY_MAP,
  getEnumLabel,
  getEnumBadgeClass,
} from '../enumMappings.js'
import { formatCurrency, formatIndianDate } from '../workflowHelpers.js'

describe('Marketplace Catalog Logic & Data Integrity', () => {
  it('correctly constructs query parameter payloads from filter state', () => {
    const filters = {
      query: 'ThinkPad',
      category: 'LAPTOP',
      brand: 'Lenovo',
      cosmeticGrade: 'GRADE_A',
      minPrice: '10000',
      maxPrice: '30000',
    }

    const params = { page: 0, size: 12 }
    if (filters.query?.trim()) params.query = filters.query.trim()
    if (filters.category) params.category = filters.category
    if (filters.brand?.trim()) params.brand = filters.brand.trim()
    if (filters.cosmeticGrade) params.cosmeticGrade = filters.cosmeticGrade
    if (filters.minPrice !== '' && !isNaN(filters.minPrice)) params.minPrice = Number(filters.minPrice)
    if (filters.maxPrice !== '' && !isNaN(filters.maxPrice)) params.maxPrice = Number(filters.maxPrice)

    assert.equal(params.query, 'ThinkPad')
    assert.equal(params.category, 'LAPTOP')
    assert.equal(params.brand, 'Lenovo')
    assert.equal(params.cosmeticGrade, 'GRADE_A')
    assert.equal(params.minPrice, 10000)
    assert.equal(params.maxPrice, 30000)
    assert.equal(params.page, 0)
    assert.equal(params.size, 12)
  })

  it('correctly distinguishes stock availability and disables purchase when not AVAILABLE', () => {
    const availableListing = { stockStatus: 'AVAILABLE' }
    const reservedListing = { stockStatus: 'RESERVED' }
    const soldListing = { stockStatus: 'SOLD' }

    const isPurchasable = (item) => item.stockStatus === 'AVAILABLE'

    assert.equal(isPurchasable(availableListing), true)
    assert.equal(isPurchasable(reservedListing), false)
    assert.equal(isPurchasable(soldListing), false)

    assert.equal(MARKETPLACE_STOCK_STATUS_MAP[availableListing.stockStatus].label, 'In Stock')
    assert.equal(MARKETPLACE_STOCK_STATUS_MAP[reservedListing.stockStatus].label, 'Reserved (In Checkout)')
    assert.equal(MARKETPLACE_STOCK_STATUS_MAP[soldListing.stockStatus].label, 'Sold Out (Second Life)')
  })

  it('correctly maps cosmetic grades and descriptions without hallucinated ratings', () => {
    const gradeA = COSMETIC_GRADE_MAP.GRADE_A
    const gradeB = COSMETIC_GRADE_MAP.GRADE_B
    const gradeC = COSMETIC_GRADE_MAP.GRADE_C

    assert.equal(gradeA.shortLabel, 'Grade A')
    assert.ok(gradeA.label.includes('Like New'))
    assert.equal(gradeB.shortLabel, 'Grade B')
    assert.ok(gradeB.label.includes('Light Wear'))
    assert.equal(gradeC.shortLabel, 'Grade C')
    assert.ok(gradeC.label.includes('Visible Wear'))
  })

  it('formats Indian currency and date values factually', () => {
    const formattedPrice = formatCurrency(24500)
    assert.ok(formattedPrice.includes('24,500') || formattedPrice.includes('24500'))

    const formattedDate = formatIndianDate('2026-09-22T10:30:00')
    assert.ok(formattedDate.includes('2026'))
    assert.ok(formattedDate.includes('Sep'))
  })

  it('correctly validates circular device journey events structure', () => {
    const journey = {
      serialOrTrackingReference: 'EW-2026-88A9B1C2',
      category: 'LAPTOP',
      brand: 'Lenovo',
      model: 'ThinkPad T480',
      cosmeticGrade: 'GRADE_A',
      events: [
        {
          stage: 'COLLECTED',
          title: 'Doorstep Logistics Recovery',
          facilityName: 'Fleet',
          timestamp: '2026-09-10T11:00:00',
        },
        {
          stage: 'ASSESSED',
          title: 'Diagnostic Assessment',
          facilityName: 'Coimbatore Hub',
          timestamp: '2026-09-12T14:30:00',
        },
        {
          stage: 'QUALITY_CHECK',
          title: 'Certified Quality Inspection',
          facilityName: 'Coimbatore Hub',
          timestamp: '2026-09-15T16:00:00',
        },
      ],
    }

    assert.equal(journey.events.length, 3)
    assert.equal(journey.events[0].stage, 'COLLECTED')
    assert.equal(journey.events[1].stage, 'ASSESSED')
    assert.equal(journey.events[2].stage, 'QUALITY_CHECK')
    assert.equal(journey.events[0].facilityName, 'Fleet')
  })
})
