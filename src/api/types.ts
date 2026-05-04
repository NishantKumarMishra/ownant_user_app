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
  currentBeds: number
  maxBeds: number
  currentPgs: number
  maxPgs: number
  bedUsagePct: number
  pgUsagePct: number
  plan: string
  status: string
  renewsAt: string
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

// export interface TenantDetail extends TenantListItem {
//   email?: string | null
//   occupation?: string | null
//   company?: string | null
//   moveInDate?: string
//   dueDay?: number
//   emergencyName?: string | null
//   emergencyPhone?: string | null
//   idProofType?: string | null
//   idProofNumber?: string | null
//   notes?: string | null
//   roomId?: string
//   bedId?: string
//   sharingType?: number
//   isAc?: boolean
// }

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
  id: string
  tenantId: string
  tenantName: string
  monthYear: string
  dueDate?: string
  amountDue: number
  amountPaid?: number
  status: string
  paidAt?: string | null
}

export interface PaymentStats {
  expected: number
  collected: number
  collectionRate: number
  overdueCount: number
}

/*
OLD DashboardData (flat structure)

export interface DashboardData {
  greetingName?: string
  collectionRate: number
  bedsOccupied: number
  totalBeds: number
  vacantBeds: number
  activeTenants: number
  overdueCount: number
  trend?: { month: string; expected: number; collected: number }[]
  collectionTrendLabel?: string
}
*/

export interface DashboardData {
  greetingName?: string

  // NEW: backend now sends nested occupancy object
  occupancy: {
    totalRooms: number
    totalBeds: number
    occupiedBeds: number
    vacantBeds: number
    occupancyRate: number
    acRooms: number
    nonAcRooms: number
  }

  // NEW: backend now sends nested collection object
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

  // NEW: backend now sends nested tenants object
  tenants: {
    activeTenants: number
    noticeTenants: number
    newThisMonth: number
    vacatedThisMonth: number
  }

  // NEW: backend sends sixMonthTrend instead of trend
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
  // OLD
  // month: string

  // NEW → backend sends monthYear
  monthYear: string

  expected: number
  collected: number
  collectionRate?: number
}

export interface PayerRow {
  tenantId: string

  // OLD
  // name: string

  // NEW
  tenantName: string

  score?: number
  pendingCount?: number
}

export interface RoomBreakdownRow {
  sharingType: number
  isAc: boolean

  // OLD
  // numberOfRooms: number
  // bedCount: number
  // occupancyPercent: number

  // NEW
  roomCount: number
  totalBeds: number
  occupiedBeds: number
  occupancyRate: number
  rentPerBed?: number
}

export interface RevenueProjection {
  // OLD
  // thisMonthExpected: number
  // nextMonthProjected: number

  // NEW
  currentMonthExpected: number
  lastMonthCollected: number
  projectedNextMonth: number
  growthRate: number
}
export interface BillingPlan {
  code: string
  name: string
  priceMonthly: number
  
  popular?: boolean
      features?: string[]
 }

// export interface BillingPlan {
//   plan: 'STARTER' | 'PRO' | 'ENTERPRISE'
//   displayName: string
//   monthlyPrice: number
//   maxPgs: number
//   maxBeds: number
//   razorpayPlanId: string
//   isCurrentPlan: boolean

//   // ✅ ADD THIS
//   features?: string[]
// }

export interface CheckoutSession {
  razorpayKeyId: string
  subscriptionId: string
  planName: string
  ownerName?: string
  ownerPhone?: string
  ownerEmail?: string
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