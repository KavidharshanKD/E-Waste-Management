/**
 * Formats tracking ID string
 */
export function formatTrackingId(id) {
  if (!id) return ''
  return String(id).toUpperCase().trim()
}

/**
 * Returns badge CSS class based on request lifecycle status
 */
export function getStatusBadgeClass(status) {
  switch (status) {
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return 'bg-warning text-dark'
    case 'APPROVED':
    case 'PICKUP_ASSIGNED':
    case 'ON_THE_WAY':
      return 'bg-info text-dark'
    case 'COLLECTED':
    case 'AT_RECYCLING_CENTER':
    case 'PROCESSING':
      return 'bg-primary text-white'
    case 'RECYCLED':
    case 'REUSED':
    case 'REFURBISHED':
    case 'COMPLETED':
      return 'bg-emerald text-white'
    case 'REJECTED':
    case 'FAILED':
    case 'CANCELLED':
      return 'bg-danger text-white'
    default:
      return 'bg-secondary text-white'
  }
}

/**
 * Calculates user eco tier and progress percentage based on total green points
 */
export function getEcoLevel(points = 0) {
  const pts = Math.max(0, Number(points) || 0)

  if (pts < 500) {
    return {
      title: 'Green Starter',
      badgeClass: 'badge-starter',
      current: pts,
      nextThreshold: 500,
      progressPercent: Math.min(100, Math.round((pts / 500) * 100))
    }
  } else if (pts < 1500) {
    return {
      title: 'Eco Contributor',
      badgeClass: 'badge-contributor',
      current: pts,
      nextThreshold: 1500,
      progressPercent: Math.min(100, Math.round(((pts - 500) / 1000) * 100))
    }
  } else if (pts < 3000) {
    return {
      title: 'Eco Champion',
      badgeClass: 'badge-champion',
      current: pts,
      nextThreshold: 3000,
      progressPercent: Math.min(100, Math.round(((pts - 1500) / 1500) * 100))
    }
  } else {
    return {
      title: 'Planet Guardian',
      badgeClass: 'badge-guardian',
      current: pts,
      nextThreshold: 3000,
      progressPercent: 100
    }
  }
}

/**
 * Formats Indian Currency (INR) using en-IN locale
 */
export function formatCurrency(amount = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Formats dates in clean Indian format (e.g., "09 Sep 2026")
 */
export function formatIndianDate(dateInput) {
  if (!dateInput) return 'N/A'
  try {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return String(dateInput)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch (e) {
    return String(dateInput)
  }
}

/**
 * Formats phone numbers in Indian format (+91 XXXXX XXXXX)
 */
export function formatPhone(phoneStr) {
  if (!phoneStr) return ''
  const cleaned = String(phoneStr).replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  }
  return String(phoneStr)
}
