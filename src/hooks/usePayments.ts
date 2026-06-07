import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import type { ApiResponse, PaymentItem, PaginatedResponse } from '@/api/types'
import { handleApiError } from '@/lib/apiError'
import { differenceInDays, parseISO } from 'date-fns'

export type PaymentFilter = 'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'

// ── Stats ─────────────────────────────────────────────────────
// Backend returns: totalExpected, totalCollected, collectionRate, overdueCount
// But your PaymentStats type uses: expected, collected, collectionRate, overdueCount
// Map carefully — field names differ between backend and type

export function usePaymentStats(monthYear: string, enabled = true) {
  return useQuery({
    queryKey: ['payments', 'stats', monthYear],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>(ENDPOINTS.PAYMENT_STATS, {
        params: { monthYear },
      })
      const d = res.data.data
      // Normalize backend field names → frontend type
      return {
        expected:       d.totalExpected   ?? d.expected       ?? 0,
        collected:      d.totalCollected  ?? d.collected      ?? 0,
        pending:        d.totalPending    ?? d.pending        ?? 0,
        collectionRate: d.collectionRate  ?? 0,
        overdueCount:   d.overdueCount    ?? 0,
        paidCount:      d.paidCount       ?? 0,
        pendingCount:   d.pendingCount    ?? 0,
      }
    },
    enabled,
  })
}

// ── Payment list ──────────────────────────────────────────────
// ALL    → GET /payments?monthYear=
// PENDING → GET /payments/pending (all unpaid regardless of month)
// OVERDUE → GET /payments/overdue (past due date, still unpaid)
// PAID   → GET /payments?monthYear=&status=PAID

export function usePaymentsList(
  filter: PaymentFilter,
  monthYear: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['payments', 'list', filter, monthYear],
    queryFn: async () => {
      if (filter === 'OVERDUE') {
        // Overdue = past due date, still unpaid — no monthYear filter needed
        const res = await api.get<ApiResponse<PaymentItem[]>>(
          ENDPOINTS.OVERDUE_PAYMENTS,
        )
        return res.data.data ?? []
      }

      if (filter === 'PENDING') {
        // Pending = all unpaid (not yet overdue too)
        const res = await api.get<ApiResponse<PaginatedResponse<PaymentItem>>>(
          ENDPOINTS.PENDING_PAYMENTS,
          { params: { size: 100 } },
        )
        return res.data.data?.content ?? []
      }

      // ALL or PAID — paginated by month
      const res = await api.get<ApiResponse<PaginatedResponse<PaymentItem>>>(
        ENDPOINTS.PAYMENTS,
        {
          params: {
            monthYear,
            status: filter === 'PAID' ? 'PAID' : undefined,
            size: 100,
          },
        },
      )
      return res.data.data?.content ?? []
    },
    enabled,
  })
}

// ── Due soon helper ────────────────────────────────────────────
// A payment is "due soon" if due within 2 days and still unpaid.
// This matches exactly what the backend scheduler uses for WhatsApp reminders.
export function isDueSoon(payment: PaymentItem): boolean {
  if (payment.status === 'PAID' || payment.status === 'WAIVED') return false
  if (!payment.dueDate) return false
  const days = differenceInDays(parseISO(payment.dueDate), new Date())
  return days >= 0 && days <= 2
}

// ── Tenant payments ───────────────────────────────────────────
export function useTenantPayments(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'tenant', tenantId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaymentItem[]>>(
        ENDPOINTS.TENANT_PAYMENTS(tenantId!),
      )
      return res.data.data ?? []
    },
    enabled: Boolean(tenantId),
  })
}

// ── Mark paid ─────────────────────────────────────────────────
export function useMarkPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      id:              string
      amountPaid:      number
      paymentMode:     string
      referenceNumber?: string
      paidAt:          string
    }) => {
      const { id, referenceNumber, paidAt, ...rest } = payload
      const res = await api.patch<ApiResponse<PaymentItem>>(ENDPOINTS.PAY(id), {
        ...rest,
        referenceNo: referenceNumber,   // backend field name is referenceNo
        paidDate:    paidAt,            // backend field name is paidDate
      })
      return res.data.data
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['payments'] }),
    onError: handleApiError,
  })
}

// ── Waive ─────────────────────────────────────────────────────
export function useWaivePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(ENDPOINTS.WAIVE(id), {})
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['payments'] }),
    onError: handleApiError,
  })
}

// ── Single payment detail ─────────────────────────────────────
export function usePayment(id: string | undefined) {
 
  return useQuery({
    queryKey: ['payments', 'detail', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaymentItem>>(
        ENDPOINTS.PAYMENT_BY_ID(id!),
      )
      return res.data.data
    },
    enabled: Boolean(id),
  })
}

// ── Generate bulk payments ────────────────────────────────────
export function useGenerateBulkPayments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (monthYear: string) => {
      const res = await api.post<ApiResponse<unknown>>(
        ENDPOINTS.GENERATE_BULK,
        { monthYear },
      )
      return res.data
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['payments'] }),
    onError: handleApiError,
  })
}