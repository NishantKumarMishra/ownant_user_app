export const ENDPOINTS = {
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',

  MY_PROFILE: '/owner/me',
  UPDATE_PROFILE: '/owner/me',

  PGS: '/pgs',
  PG_BY_ID: (id: string) => `/pgs/${id}`,
  SWITCH_PG: (id: string) => `/pgs/${id}/switch`,

  ROOMS: '/rooms',
  ROOMS_BULK: '/rooms/bulk',
  ROOM_BY_ID: (id: string) => `/rooms/${id}`,
  PAYMENT_BY_ID: (id: string) => `/payments/${id}`,
  VACANT_BEDS: '/rooms/vacant-beds',

  TENANTS: '/tenants',
  TENANT_BY_ID: (id: string) => `/tenants/${id}`,
  TENANT_SEARCH: '/tenants/search',
  VACATE_TENANT: (id: string) => `/tenants/${id}/vacate`,
  NOTICE_TENANT: (id: string) => `/tenants/${id}/notice`,

  PAYMENTS: '/payments',
  GENERATE_PAYMENT: '/payments/generate',
  GENERATE_BULK: '/payments/generate-bulk',
  PAY: (id: string) => `/payments/${id}/pay`,
  WAIVE: (id: string) => `/payments/${id}/waive`,
  PENDING_PAYMENTS: '/payments/pending',
  OVERDUE_PAYMENTS: '/payments/overdue',
  TENANT_PAYMENTS: (id: string) => `/payments/tenant/${id}`,
  PAYMENT_STATS: '/payments/stats',
  PAYMENT_TREND: '/payments/trend',
  PAYMENT_SETTINGS:        '/payment-settings',
PAYMENT_SETTINGS_UPI:    '/payment-settings/upi',
PAYMENT_SETTINGS_PREVIEW: '/payment-settings/upi/preview',

  DASHBOARD: '/analytics/dashboard',
  ANALYTICS_OCCUPANCY: '/analytics/occupancy',
  ANALYTICS_COLLECTION: '/analytics/collection',
  ANALYTICS_TREND: '/analytics/trend',
  ANALYTICS_PAYERS: '/analytics/payers',
  ANALYTICS_ROOMS: '/analytics/rooms',
  ANALYTICS_PROJECTION: '/analytics/projection',
  PG_NOTIF_LOGS: '/notifications/pg',

  TRIGGER_REMINDERS: '/notifications/trigger-reminders',
  SEND_REMINDER: '/notifications/send-reminder',
  TENANT_NOTIF_LOGS: (id: string) => `/notifications/tenant/${id}`,

  // ── Billing — base plans ──────────────────────────────────────
  PLANS:               '/billing/plans',
  SUBSCRIPTION:        '/billing/subscription',
  CHECKOUT:            '/billing/checkout',
  VERIFY_PAYMENT:      '/billing/verify-payment',
  CANCEL_SUBSCRIPTION: '/billing/cancel',

  // ── Billing — addon beds ──────────────────────────────────────
  ADDON_CHECKOUT:      '/billing/addons/checkout',
  ADDON_VERIFY:        '/billing/addons/verify',
  ADDONS:              '/billing/addons',
} as const