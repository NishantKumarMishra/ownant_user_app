export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errorCode: string | null
  timestamp: string
}

export interface Owner {
  id: string
  name: string
  phone: string
  email?: string | null
  activePgId: string | null
}

export interface CreatePgResponse {
  pg: Pg
  accessToken: string
}

export interface SubscriptionInfo {
  currentBeds:           number
  maxBeds:               number
  currentPgs:            number
  maxPgs:                number
  bedUsagePct:           number
  pgUsagePct:            number
  plan:                  string
  status:                string
  renewsAt:              string

  // ── Hybrid addon fields (added for addon beds support) ────────
  addonBeds:             number   // extra beds purchased on top of base plan
  effectiveBedLimit:     number   // maxBeds + addonBeds (-1 = unlimited)
  addonBedsMonthlyPrice: number   // addonBeds × ₹99
  amountMonthly:         number   // base plan monthly price
}

export interface OwnerProfile extends Owner {
  subscription?: SubscriptionInfo
  memberSince: string
}

export interface PgSummary {
  id: string
  name: string
  city?: string
  totalBeds?: number
  occupiedBeds?: number
  occupancyPercent?: number
}

export interface Pg {
  id: string
  name: string
  address?: string
  city?: string
  pincode?: string
  phone?: string
}

export interface Bed {
  id: string
  label: string
  status: 'OCCUPIED' | 'VACANT'
  tenantId?: string | null
  tenantName?: string | null
  tenantPhone?: string | null
}

export interface Room {
  id: string
  roomNumber: string
  floor?: string | null
  sharingType: number
  isAc: boolean
  rentPerBed: number
  totalBeds?: number
  vacantBeds?: number
  beds?: Bed[]
  notes?: string | null
}

export interface VacantBedOption {
  bedId: string
  roomNumber: string
  bedLabel: string
  sharingType: number
  rentPerBed: number
  isAc: boolean
}

export interface TenantListItem {
  id: string
  name: string
  phone: string
  status: string
  roomNumber?: string
  bedLabel?: string
  monthlyRent?: number
}

export interface TenantDetail extends TenantListItem {
  email?: string | null
  occupation?: string | null
  company?: string | null
  moveInDate?: string
  moveOutDate?: string
  dueDay?: number
  emergencyName?: string | null
  emergencyPhone?: string | null
  idProofType?: string | null
  idProofNumber?: string | null
  notes?: string | null
  monthlyRent?: number
  bed?: {
    bedId: string
    bedLabel: string
    roomId: string
    roomNumber: string
    floor?: string | null
    sharingType: number
    isAc: boolean
  }
}

export interface PaymentItem {
  id:           string
  tenantId:     string
  tenantName:   string
  tenantPhone?: string | null   // shown on detail page — tap to call
  roomNumber?:  string | null   // Room 203
  bedLabel?:    string | null   // Bed A
  monthYear:    string
  dueDate?:     string
  amountDue:    number
  amountPaid?:  number
  status:       string
  paidAt?:      string | null
  paymentMode?: string | null   // CASH | UPI | BANK_TRANSFER | CHEQUE
  referenceNo?: string | null   // UPI ref, cheque number etc.
}

export interface PaymentStats {
  expected: number
  collected: number
  collectionRate: number
  overdueCount: number
}

export interface DashboardData {
  greetingName?: string
  occupancy: {
    totalRooms: number
    totalBeds: number
    occupiedBeds: number
    vacantBeds: number
    occupancyRate: number
    acRooms: number
    nonAcRooms: number
  }
  collection: {
    monthYear: string
    totalExpected: number
    totalCollected: number
    totalPending: number
    totalOverdue: number
    collectionRate: number
    paidCount: number
    partialCount: number
    pendingCount: number
    overdueCount: number
  }
  tenants: {
    activeTenants: number
    noticeTenants: number
    newThisMonth: number
    vacatedThisMonth: number
  }
  sixMonthTrend?: {
    monthYear: string
    expected: number
    collected: number
    collectionRate?: number
    occupiedBeds?: number
  }[]
  collectionTrendLabel?: string
}

export interface AnalyticsOccupancy {
  occupancyPercent: number
  totalBeds: number
  occupiedBeds: number
  vacantBeds: number
  acRooms: number
  nonAcRooms: number
}

export interface AnalyticsTrendPoint {
  monthYear: string
  expected: number
  collected: number
  collectionRate?: number
}

export interface PayerRow {
  tenantId: string
  tenantName: string
  score?: number
  pendingCount?: number
}

export interface RoomBreakdownRow {
  sharingType: number
  isAc: boolean
  roomCount: number
  totalBeds: number
  occupiedBeds: number
  occupancyRate: number
  rentPerBed?: number
}

export interface RevenueProjection {
  currentMonthExpected: number
  lastMonthCollected: number
  projectedNextMonth: number
  growthRate: number
}

// ── Billing types ─────────────────────────────────────────────

// What useBillingPlans() maps backend → UI format
export interface BillingPlan {
  code:         string   // "FREE" | "BASIC" | "PRO" | "BUSINESS"
  name:         string   // "Basic — ₹499/month"
  priceMonthly: number
  maxBeds:      number   // -1 = unlimited
  maxPgs:       number   // -1 = unlimited
  popular?:     boolean
  features?:    string[]
}

// Raw backend shape from GET /billing/plans
export interface BackendPlanInfo {
  plan:             string
  displayName:      string
  monthlyPrice:     number
  maxPgs:           number
  maxBeds:          number
  razorpayPlanId:   string | null
  isCurrentPlan:    boolean
  addonBedPrice:    number   // ₹99
  currentAddonBeds: number
}

// Full subscription returned by GET /billing/subscription
export interface FullSubscription {
  id:                    string
  plan:                  string
  status:                'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  maxPgs:                number
  maxBeds:               number
  addonBeds:             number
  effectiveBedLimit:     number   // maxBeds + addonBeds
  currentPgs:            number
  currentBeds:           number
  pgUsagePct:            number
  bedUsagePct:           number
  amountMonthly:         number
  addonBedsMonthlyPrice: number
  razorpaySubId:         string | null
  startsAt:              string
  renewsAt:              string
  cancelledAt:           string | null
  isActive:              boolean
}

// Addon purchase record from GET /billing/addons
export interface AddonPurchase {
  id:           string
  addonType:    string
  quantity:     number
  pricePerUnit: number
  totalPrice:   number
  status:       'ACTIVE' | 'CANCELLED'
  purchasedAt:  string
  expiresAt:    string | null
}

// Returned by POST /billing/checkout
export interface CheckoutSession {
  razorpayKeyId:  string
  subscriptionId: string
  planName:       string
  amountPaise:    number
  currency:       string
  ownerName:      string
  ownerPhone:     string
  ownerEmail?:    string | null
}

// Returned by POST /billing/addons/checkout
export interface AddonCheckoutSession {
  razorpayKeyId: string
  orderId:       string   // Razorpay Order ID — NOT subscriptionId
  addonType:     string
  quantity:      number
  totalAmount:   number
  currency:      string
  ownerName:     string
  ownerPhone:    string
}

export interface NotificationLog {
  id: string
  sentAt: string
  channel?: string
  status?: string
}

export interface RoomTypeBulkRow {
  sharingType: number
  numberOfRooms: number
  rentPerBed: number
  isAc: boolean
}

export interface RoomAnalyticsData {
  totalRooms: number
  fullyOccupied: number
  partiallyOccupied: number
  empty: number
  bySharingType: RoomBreakdownRow[]
}

export interface PaginatedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}