/**
 * SMART E-WASTE MANAGEMENT SYSTEM — FRONTEND API CONTRACT TYPES
 * Strongly typed TypeScript interfaces mirroring backend Spring Boot DTOs and Enums.
 * 
 * NOTE: These types represent the exact contract surface of backend Modules 1 through 8.
 * No imaginary or fabricated fields (e.g. ratings, review counts, carbonSaved) are present.
 */

// =============================================================================
// ENUMS (Exact backend mappings from com.ewaste.management.model.enums)
// =============================================================================

export type UserRole = 'USER' | 'COLLECTOR' | 'RECYCLER' | 'ADMIN';

export type UserType = 'INDIVIDUAL' | 'INSTITUTION';

export type OrganizationType =
  | 'COLLEGE'
  | 'IT_COMPANY'
  | 'HOSPITAL'
  | 'GOVERNMENT'
  | 'PRIVATE_ENTERPRISE'
  | 'OTHER';

export type EWasteCategory =
  | 'MOBILE_PHONE'
  | 'LAPTOP'
  | 'DESKTOP'
  | 'MONITOR'
  | 'TELEVISION'
  | 'PRINTER'
  | 'KEYBOARD'
  | 'MOUSE'
  | 'BATTERY'
  | 'CHARGER'
  | 'CABLE'
  | 'REFRIGERATOR'
  | 'WASHING_MACHINE'
  | 'AIR_CONDITIONER'
  | 'OTHER';

export type DeviceCondition =
  | 'WORKING'
  | 'PARTIALLY_WORKING'
  | 'DAMAGED'
  | 'NOT_WORKING'
  | 'HAZARDOUS';

export type UserIntention =
  | 'KEEP_USING'
  | 'REPAIR'
  | 'REFURBISH'
  | 'REFURBISH_AND_SELL'
  | 'DONATE'
  | 'RECYCLE'
  | 'UNSURE';

export type DisposalAction =
  | 'REUSE'
  | 'REPAIR'
  | 'DONATE'
  | 'REFURBISH'
  | 'RECYCLE'
  | 'SPECIAL_HANDLING';

export type RecommendationSource =
  | 'ML'
  | 'RULE_BASED_FALLBACK'
  | 'SAFETY_RULE';

export type RequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PICKUP_ASSIGNED'
  | 'COLLECTED'
  | 'AT_RECYCLING_CENTER'
  | 'PROCESSING'
  | 'RECYCLED'
  | 'REUSED'
  | 'REFURBISHED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PickupStatus =
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'ON_THE_WAY'
  | 'COLLECTED'
  | 'FAILED'
  | 'CANCELLED';

export type PickupTimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING';

export type RepairabilityStatus =
  | 'REPAIRABLE'
  | 'REFURBISHABLE'
  | 'NOT_ECONOMICALLY_RECOMMENDED'
  | 'NOT_RECOVERABLE';

export type TechnicianDecision =
  | 'REPAIR'
  | 'REFURBISH'
  | 'DONATE'
  | 'RECYCLE'
  | 'SPECIAL_HANDLING';

export type RestorationJobType = 'REPAIR' | 'REFURBISH';

export type RestorationStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type QualityCheckResult = 'PASS' | 'FAIL' | 'REWORK_REQUIRED';

export type CosmeticGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C';

export type MarketplaceListingStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type MarketplaceStockStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export type MarketplaceOrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type MarketplacePaymentStatus =
  | 'PENDING'
  | 'NOT_APPLICABLE'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

// =============================================================================
// ML & RECOMMENDATION CONTRACTS
// =============================================================================

export interface DisposalRecommendationResult {
  recommendedAction: DisposalAction;
  explanation: string;
  handlingAdvice?: string;
  disclaimer: string;
  recommendationSource: RecommendationSource;
  modelVersion?: string;
  recoveryStatus?: string;
  recoveryProbability?: number;
  rawPathway?: string;
  displayRecommendation?: string;
  pathwayProbability?: number;
  confidenceLevel?: string;
  technicianReviewRequired: boolean;
  inspectionRecommended: boolean;
  marketplaceEligibility: string;
  mlExplanation?: string;
}

// =============================================================================
// DEVICE INTAKE & DISPOSAL REQUEST CONTRACTS
// =============================================================================

export interface EWasteItemDTO {
  id?: number;
  disposalRequestId?: number;
  category: EWasteCategory;
  deviceName: string;
  brand: string;
  modelName?: string;
  serialNumber?: string;
  approxAgeYears?: number;
  condition: DeviceCondition;
  workingStatus?: string;
  damageCondition?: string;
  batteryCondition?: string;
  weightKg?: number;
  quantity: number;
  description?: string;
  imageUrl?: string;
  estimatedRewardPoints?: number;
  userIntention?: UserIntention;
  powersOn?: boolean;
  screenCondition?: string;
  batterySwollen?: boolean;
  batteryLeaking?: boolean;
  overheatingEvidence?: boolean;
  severePhysicalDamage?: boolean;
  functionalIssues?: string;
}

export interface DisposalRequestDTO {
  id: number;
  trackingNumber: string;
  userId: number;
  userEmail: string;
  userName?: string;
  status: RequestStatus;
  recommendedAction: DisposalAction;
  userIntention?: UserIntention;
  recommendationExplanation?: string;
  handlingAdvice?: string;
  pickupRequired: boolean;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupPostalCode: string;
  preferredPickupDate?: string;
  notes?: string;
  centerId?: number;
  centerName?: string;
  items: EWasteItemDTO[];
  createdAt: string;
  updatedAt?: string;

  // ML Audit fields
  recommendationSource?: RecommendationSource;
  mlModelVersion?: string;
  mlRecoveryStatus?: string;
  mlRecoveryProbability?: number;
  mlRawPathway?: string;
  mlDisplayRecommendation?: string;
  mlPathwayProbability?: number;
  mlConfidenceLevel?: string;
  technicianReviewRequired?: boolean;
  inspectionRecommended?: boolean;
  marketplaceEligibility?: string;
  mlExplanation?: string;
}

// =============================================================================
// TECHNICIAN ASSESSMENT, RESTORATION & QC CONTRACTS
// =============================================================================

export interface AssessmentResponseDTO {
  id: number;
  requestId: number;
  trackingNumber: string;
  assessedById: number;
  assessedByName: string;
  powerStatus: string;
  screenAssessment: string;
  batteryAssessment: string;
  physicalCondition: string;
  functionalAssessment: string;
  diagnosedIssues: string;
  repairabilityStatus: RepairabilityStatus;
  technicianDecision: TechnicianDecision;
  safetyHazardFound: boolean;
  safetyNotes?: string;
  recommendedForMarketplace: boolean;
  assessmentNotes?: string;
  assessedAt: string;

  // Preserved ML Audit Context
  mlDisplayRecommendation?: string;
  mlRawPathway?: string;
  mlConfidenceLevel?: string;
  mlRecoveryStatus?: string;
  mlRecoveryProbability?: number;
  mlTechnicianReviewRequired?: boolean;
  mlExplanation?: string;
}

export interface CreateAssessmentDTO {
  powerStatus: string;
  screenAssessment: string;
  batteryAssessment: string;
  physicalCondition: string;
  functionalAssessment: string;
  diagnosedIssues?: string;
  repairabilityStatus: RepairabilityStatus;
  technicianDecision: TechnicianDecision;
  safetyHazardFound?: boolean;
  safetyNotes?: string;
  recommendedForMarketplace?: boolean;
  assessmentNotes?: string;
}

export interface RestorationJobResponseDTO {
  id: number;
  requestId: number;
  trackingNumber: string;
  assessmentId: number;
  assignedTechnicianId?: number;
  assignedTechnicianName?: string;
  jobType: RestorationJobType;
  status: RestorationStatus;
  workStartedAt?: string;
  workCompletedAt?: string;
  workPerformed?: string;
  partsReplaced?: string;
  technicianNotes?: string;
  partsCost?: number;
  laborCost?: number;
  totalCost?: number;
  createdAt: string;
  qualityCheckCompleted: boolean;
  marketplaceCandidate: boolean;
}

export interface UpdateRestorationProgressDTO {
  status: RestorationStatus;
  workPerformed?: string;
  partsReplaced?: string;
  technicianNotes?: string;
  partsCost?: number;
  laborCost?: number;
}

export interface SubmitQualityCheckDTO {
  functionalTestPassed: boolean;
  powerTestPassed: boolean;
  displayTestPassed: boolean;
  batteryTestPassed: boolean;
  safetyTestPassed: boolean;
  cosmeticGrade: CosmeticGrade;
  qualityNotes?: string;
}

export interface QualityCheckResponseDTO {
  id: number;
  jobId: number;
  requestId: number;
  trackingNumber: string;
  checkedById: number;
  checkedByName: string;
  functionalTestPassed: boolean;
  powerTestPassed: boolean;
  displayTestPassed: boolean;
  batteryTestPassed: boolean;
  safetyTestPassed: boolean;
  cosmeticGrade: CosmeticGrade;
  overallResult: QualityCheckResult;
  qualityNotes?: string;
  marketplaceCandidate: boolean;
  checkedAt: string;
}

// =============================================================================
// MARKETPLACE INVENTORY & LISTINGS CONTRACTS
// =============================================================================

export interface MarketplaceCandidateDTO {
  qualityCheckId: number;
  jobId: number;
  requestId: number;
  itemId: number;
  centerId: number;
  centerName: string;
  category: EWasteCategory;
  brand: string;
  model: string;
  cosmeticGrade: CosmeticGrade;
  technicianNotes?: string;
  partsReplaced?: string;
  qcCompletedAt: string;
}

export interface ListingImageDTO {
  id: number;
  imageUrl: string;
  primary: boolean;
  sortOrder: number;
}

export interface ListingSummaryDTO {
  id: number;
  title: string;
  category: EWasteCategory;
  brand: string;
  model: string;
  cosmeticGrade: CosmeticGrade;
  sellingPrice: number;
  originalReferencePrice?: number;
  warrantyDays: number;
  stockStatus: MarketplaceStockStatus;
  listingStatus: MarketplaceListingStatus;
  primaryImageUrl?: string;
  centerId: number;
  centerName: string;
  centerCity: string;
  publishedAt?: string;
}

export interface ListingDetailDTO {
  id: number;
  title: string;
  description?: string;
  category: EWasteCategory;
  brand: string;
  model: string;
  cosmeticGrade: CosmeticGrade;
  conditionSummary?: string;
  technicalSummary?: string;
  workPerformedSummary?: string;
  partsReplacedSummary?: string;
  sellingPrice: number;
  originalReferencePrice?: number;
  warrantyDays: number;
  stockStatus: MarketplaceStockStatus;
  listingStatus: MarketplaceListingStatus;
  centerId: number;
  centerName: string;
  centerCity: string;
  centerState: string;
  publishedAt?: string;
  images: ListingImageDTO[];
  deviceJourney?: DeviceJourneyDTO;
}

export interface CreateListingDraftDTO {
  qualityCheckId: number;
  title: string;
  description?: string;
  sellingPrice: number;
  originalReferencePrice?: number;
  warrantyDays?: number;
  conditionSummary?: string;
  technicalSummary?: string;
  imageUrls?: string[];
}

export interface UpdateListingDraftDTO {
  title?: string;
  description?: string;
  sellingPrice?: number;
  originalReferencePrice?: number;
  warrantyDays?: number;
  conditionSummary?: string;
  technicalSummary?: string;
  imageUrls?: string[];
}

export interface ListingApprovalDTO {
  approved: boolean;
  rejectionReason?: string;
  adjustedSellingPrice?: number;
}

// =============================================================================
// CART & ORDER CONTRACTS
// =============================================================================

export interface CartItemDTO {
  id: number;
  listingId: number;
  title: string;
  category: EWasteCategory;
  brand: string;
  model: string;
  cosmeticGrade: CosmeticGrade;
  price: number;
  imageUrl?: string;
  stockStatus: MarketplaceStockStatus;
  available: boolean;
  addedAt: string;
}

export interface CartDTO {
  id: number;
  userId: number;
  itemCount: number;
  subtotal: number;
  items: CartItemDTO[];
}

export interface CreateOrderDTO {
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  paymentMethod?: string; // Defaults to "DEMO_CHECKOUT"
  listingIds?: number[];
}

export interface OrderItemDTO {
  id: number;
  listingId: number;
  titleSnapshot: string;
  priceAtPurchase: number;
  warrantyDaysSnapshot?: number;
}

export interface OrderDetailDTO {
  id: number;
  orderNumber: string;
  status: MarketplaceOrderStatus;
  paymentStatus: MarketplacePaymentStatus;
  paymentMethod: string;
  subtotal: number;
  totalAmount: number;
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  placedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  items: OrderItemDTO[];
}

// =============================================================================
// DEVICE JOURNEY & AUDIT TRAIL CONTRACTS (Zero Donor PII)
// =============================================================================

export interface DeviceJourneyEventDTO {
  stage: string;
  title: string;
  description: string;
  facilityName: string;
  timestamp: string;
}

export interface DeviceJourneyDTO {
  serialOrTrackingReference: string;
  category: EWasteCategory;
  brand: string;
  model: string;
  cosmeticGrade: CosmeticGrade;
  events: DeviceJourneyEventDTO[];
}

// =============================================================================
// SPRING DATA PAGE CONTAINER
// =============================================================================

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
