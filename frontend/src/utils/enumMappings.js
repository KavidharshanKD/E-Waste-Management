/**
 * SMART E-WASTE MANAGEMENT SYSTEM — CENTRALIZED ENUM MAPPINGS & DISPLAY HELPERS
 * Mirrors actual backend enum definitions and provides consistent user-facing labels and badge styles.
 * 
 * Strict architectural rule:
 * - Labels are human-readable (e.g. REFURBISH_AND_SELL -> "Refurbish & Sell")
 * - SOLD != PAID is maintained
 * - Never duplicate enum mappings across UI components
 */

// =============================================================================
// USER INTENTION MAPPING
// =============================================================================
export const USER_INTENTION_MAP = {
  KEEP_USING: {
    label: 'Keep Using',
    badge: 'Longevity',
    description: 'Continue using the device with maintenance or minor component tuning.',
    badgeClass: 'badge bg-success',
  },
  REPAIR: {
    label: 'Repair Device',
    badge: 'Restoration',
    description: 'Repair specific faults or replace worn components to restore full operation.',
    badgeClass: 'badge bg-warning text-dark',
  },
  REFURBISH: {
    label: 'Refurbish',
    badge: 'Renewal',
    description: 'Thoroughly service, sanitize, and renew for secondary operational life.',
    badgeClass: 'badge bg-purple text-white',
  },
  REFURBISH_AND_SELL: {
    label: 'Refurbish & Sell',
    badge: 'Circular Resale',
    description: 'Refurbish, grade, and list on the marketplace for second-life ownership.',
    badgeClass: 'badge bg-emerald text-white',
  },
  DONATE: {
    label: 'Donate',
    badge: 'Community',
    description: 'Donate functional hardware to educational or social welfare programs.',
    badgeClass: 'badge bg-info text-dark',
  },
  RECYCLE: {
    label: 'Recycle Responsibly',
    badge: 'Zero Landfill',
    description: 'Process end-of-life hardware for certified material recovery.',
    badgeClass: 'badge bg-secondary text-white',
  },
  UNSURE: {
    label: 'Recommend Best Option',
    badge: 'AI Assessment',
    description: 'Evaluate device condition and advise optimal circular pathway.',
    badgeClass: 'badge bg-dark text-white',
  },
};

// =============================================================================
// DISPOSAL ACTION MAPPING (Recommended Action)
// =============================================================================
export const DISPOSAL_ACTION_MAP = {
  REUSE: {
    label: 'Direct Reuse',
    badgeClass: 'badge bg-success text-white',
    icon: 'bi-arrow-repeat',
    borderClass: 'border-success',
    color: '#1b4332',
  },
  REPAIR: {
    label: 'Repair Required',
    badgeClass: 'badge bg-warning text-dark',
    icon: 'bi-tools',
    borderClass: 'border-warning',
    color: '#d97706',
  },
  REFURBISH: {
    label: 'Refurbish',
    badgeClass: 'badge bg-info text-white',
    icon: 'bi-gear-wide-connected',
    borderClass: 'border-info',
    color: '#0284c7',
  },
  DONATE: {
    label: 'Donate',
    badgeClass: 'badge bg-primary text-white',
    icon: 'bi-heart-fill',
    borderClass: 'border-primary',
    color: '#2563eb',
  },
  RECYCLE: {
    label: 'Responsible Recycling',
    badgeClass: 'badge bg-secondary text-white',
    icon: 'bi-recycle',
    borderClass: 'border-secondary',
    color: '#4b5563',
  },
  SPECIAL_HANDLING: {
    label: 'Special Hazardous Handling',
    badgeClass: 'badge bg-danger text-white',
    icon: 'bi-exclamation-triangle-fill',
    borderClass: 'border-danger',
    color: '#dc2626',
  },
};

// =============================================================================
// E-WASTE CATEGORY LABELS
// =============================================================================
export const EWASTE_CATEGORY_MAP = {
  MOBILE_PHONE: 'Mobile Phone',
  LAPTOP: 'Laptop',
  DESKTOP: 'Desktop Computer',
  MONITOR: 'Monitor / Display',
  TELEVISION: 'Television Panel',
  PRINTER: 'Printer / Scanner',
  KEYBOARD: 'Keyboard',
  MOUSE: 'Mouse / Peripheral',
  BATTERY: 'Battery Pack',
  CHARGER: 'Charger / Adapter',
  CABLE: 'Cable / Wire',
  REFRIGERATOR: 'Refrigerator',
  WASHING_MACHINE: 'Washing Machine',
  AIR_CONDITIONER: 'Air Conditioner',
  OTHER: 'Other Equipment',
};

// =============================================================================
// DEVICE CONDITION LABELS
// =============================================================================
export const DEVICE_CONDITION_MAP = {
  WORKING: 'Working (Fully functional)',
  PARTIALLY_WORKING: 'Partially Working (Minor defects)',
  DAMAGED: 'Physically Damaged',
  NOT_WORKING: 'Non-Functional / Dead',
  HAZARDOUS: 'Hazardous (Leaking / Swollen battery)',
};

// =============================================================================
// COSMETIC GRADE MAPPING
// =============================================================================
export const COSMETIC_GRADE_MAP = {
  GRADE_A: {
    label: 'Grade A — Like New',
    shortLabel: 'Grade A',
    description: 'Pristine condition, virtually zero noticeable blemishes or scratches.',
    badgeClass: 'badge bg-emerald text-white',
  },
  GRADE_B: {
    label: 'Grade B — Light Wear',
    shortLabel: 'Grade B',
    description: 'Minor superficial marks or hairline scratches, fully functional hardware.',
    badgeClass: 'badge bg-info text-dark',
  },
  GRADE_C: {
    label: 'Grade C — Visible Wear',
    shortLabel: 'Grade C',
    description: 'Noticeable scuffs, casing wear, or scratches. 100% operationally verified.',
    badgeClass: 'badge bg-warning text-dark',
  },
};

// =============================================================================
// MARKETPLACE LISTING STATUS MAPPING
// =============================================================================
export const MARKETPLACE_LISTING_STATUS_MAP = {
  DRAFT: {
    label: 'Draft',
    badgeClass: 'badge bg-secondary text-white',
    description: 'Under preparation at facility. Not visible to public.',
  },
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    badgeClass: 'badge bg-warning text-dark',
    description: 'Submitted by recycler, awaiting admin pricing/specs verification.',
  },
  PUBLISHED: {
    label: 'Published',
    badgeClass: 'badge bg-emerald text-white',
    description: 'Active and publicly purchasable on the marketplace.',
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'badge bg-danger text-white',
    description: 'Rejected during admin review with mandatory feedback.',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    badgeClass: 'badge bg-dark text-white',
    description: 'Withdrawn from marketplace by facility or administrator.',
  },
};

// =============================================================================
// MARKETPLACE STOCK STATUS MAPPING
// =============================================================================
export const MARKETPLACE_STOCK_STATUS_MAP = {
  AVAILABLE: {
    label: 'In Stock',
    badgeClass: 'badge bg-emerald text-white',
    dotClass: 'status-dot-emerald',
  },
  RESERVED: {
    label: 'Reserved (In Checkout)',
    badgeClass: 'badge bg-warning text-dark',
    dotClass: 'status-dot-warning',
  },
  SOLD: {
    label: 'Sold Out (Second Life)',
    badgeClass: 'badge bg-secondary text-white',
    dotClass: 'status-dot-neutral',
  },
};

// =============================================================================
// MARKETPLACE ORDER STATUS MAPPING
// =============================================================================
export const MARKETPLACE_ORDER_STATUS_MAP = {
  PLACED: {
    label: 'Placed',
    badgeClass: 'badge bg-warning text-dark',
    description: 'Order placed by customer. Inventory locked.',
  },
  CONFIRMED: {
    label: 'Confirmed',
    badgeClass: 'badge bg-info text-dark',
    description: 'Order acknowledged and confirmed by processing hub.',
  },
  PROCESSING: {
    label: 'Processing',
    badgeClass: 'badge bg-primary text-white',
    description: 'Device being packed and prepared for transit.',
  },
  SHIPPED: {
    label: 'Shipped',
    badgeClass: 'badge bg-info text-white',
    description: 'Consignment handed over to courier logistics.',
  },
  DELIVERED: {
    label: 'Delivered',
    badgeClass: 'badge bg-emerald text-white',
    description: 'Device delivered to buyer. Stock permanently marked SOLD.',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeClass: 'badge bg-danger text-white',
    description: 'Order cancelled. Inventory released back to AVAILABLE.',
  },
};

// =============================================================================
// MARKETPLACE PAYMENT STATUS MAPPING (SOLD != PAID)
// =============================================================================
export const MARKETPLACE_PAYMENT_STATUS_MAP = {
  PENDING: {
    label: 'Payment Pending',
    badgeClass: 'badge bg-warning text-dark',
    description: 'Awaiting payment confirmation. Payment gateway integration upcoming.',
  },
  NOT_APPLICABLE: {
    label: 'Not Applicable',
    badgeClass: 'badge bg-secondary text-white',
    description: 'No payment required for this circular allocation transaction.',
  },
  PAID: {
    label: 'Paid',
    badgeClass: 'badge bg-emerald text-white',
    description: 'Payment verified and settled through payment gateway.',
  },
  FAILED: {
    label: 'Payment Failed',
    badgeClass: 'badge bg-danger text-white',
    description: 'Payment transaction failed or timed out.',
  },
  REFUNDED: {
    label: 'Refunded',
    badgeClass: 'badge bg-info text-dark',
    description: 'Payment was refunded to original payment method.',
  },
};

// =============================================================================
// RESTORATION JOB & QC STATUS MAPPINGS
// =============================================================================
export const RESTORATION_STATUS_MAP = {
  PENDING: { label: 'Pending Queue', badgeClass: 'badge bg-warning text-dark' },
  IN_PROGRESS: { label: 'In Progress', badgeClass: 'badge bg-primary text-white' },
  COMPLETED: { label: 'Completed', badgeClass: 'badge bg-emerald text-white' },
  FAILED: { label: 'Unrepairable / Failed', badgeClass: 'badge bg-danger text-white' },
  CANCELLED: { label: 'Cancelled', badgeClass: 'badge bg-secondary text-white' },
};

export const QUALITY_CHECK_RESULT_MAP = {
  PASS: { label: 'QC Passed', badgeClass: 'badge bg-emerald text-white' },
  FAIL: { label: 'QC Failed', badgeClass: 'badge bg-danger text-white' },
  REWORK_REQUIRED: { label: 'Rework Required', badgeClass: 'badge bg-warning text-dark' },
};

export const REPAIRABILITY_STATUS_MAP = {
  REPAIRABLE: 'Repairable (Component Level)',
  REFURBISHABLE: 'Refurbishable (Full Renewal)',
  NOT_ECONOMICALLY_RECOMMENDED: 'Not Economically Viable to Repair',
  NOT_RECOVERABLE: 'Not Recoverable (Direct Recycling)',
};

// =============================================================================
// CONVENIENCE FORMATTER FUNCTIONS
// =============================================================================

/**
 * Resolves a human-friendly label for any backend enum value
 */
export function getEnumLabel(map, key, fallback = '') {
  if (!key) return fallback;
  const entry = map[key];
  if (!entry) return key.replace(/_/g, ' ');
  return typeof entry === 'string' ? entry : entry.label || key.replace(/_/g, ' ');
}

/**
 * Resolves a badge class for an enum entry
 */
export function getEnumBadgeClass(map, key, fallback = 'badge bg-secondary text-white') {
  if (!key) return fallback;
  const entry = map[key];
  if (!entry || !entry.badgeClass) return fallback;
  return entry.badgeClass;
}
