import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import type { ApiResponse, PaymentItem, PaymentStats } from '@/api/types'
import { handleApiError } from '@/lib/apiError'
import type { PaginatedResponse } from '@/api/types'

export type PaymentFilter = 'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'

export function usePaymentStats(monthYear: string, enabled = true) {
  return useQuery({
    queryKey: ['payments', 'stats', monthYear],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaymentStats>>(ENDPOINTS.PAYMENT_STATS, {
        params: { monthYear },
      })
      return res.data.data
    },
    enabled,
  })
}

// export function usePaymentsList(
//   filter: PaymentFilter,
//   monthYear: string,
//   enabled = true,
// ) {
//   return useQuery({
//     queryKey: ['payments', 'list', filter, monthYear],
//     queryFn: async () => {
//       if (filter === 'OVERDUE') {
//         const res = await api.get<ApiResponse<PaymentItem[]>>(ENDPOINTS.OVERDUE_PAYMENTS, {
//           params: { monthYear },
//         })
//         return res.data.data
//       }
//       if (filter === 'PENDING') {
//         const res = await api.get<ApiResponse<PaymentItem[]>>(ENDPOINTS.PENDING_PAYMENTS, {
//           params: { monthYear },
//         })
//         return res.data.data
//       }
//       const res = await api.get<ApiResponse<PaymentItem[]>>(ENDPOINTS.PAYMENTS, {
//         params: { monthYear, status: filter === 'ALL' ? undefined : filter },
//       })
//       return res.data.data
//     },
//     enabled,
//   })
// }

export function usePaymentsList(
  filter: PaymentFilter,
  monthYear: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['payments', 'list', filter, monthYear],
    queryFn: async () => {
      const endpoint =
        filter === 'OVERDUE'
          ? ENDPOINTS.OVERDUE_PAYMENTS
          : filter === 'PENDING'
          ? ENDPOINTS.PENDING_PAYMENTS
          : ENDPOINTS.PAYMENTS

      const res = await api.get<ApiResponse<PaginatedResponse<PaymentItem>>>(
        endpoint,
        {
          params: {
            monthYear,
            status: filter === 'ALL' ? undefined : filter,
          },
        },
      )

      return res.data.data
    },
    enabled,
  })
}

export function useTenantPayments(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'tenant', tenantId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaymentItem[]>>(
        ENDPOINTS.TENANT_PAYMENTS(tenantId!),
      )
      return res.data.data
    },
    enabled: Boolean(tenantId),
  })
}

export function useMarkPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      id: string
      amountPaid: number
      paymentMode: string
      referenceNumber?: string
      paidAt: string
    }) => {
      const { id, ...body } = payload
      const res = await api.patch<ApiResponse<PaymentItem>>(ENDPOINTS.PAY(id), body)
      return res.data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payments'] })
    },
    onError: handleApiError,
  })
}

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

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'detail', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaymentItem>>(ENDPOINTS.PAYMENT_BY_ID(id!))
      return res.data.data
    },
    enabled: Boolean(id),
  })
}

export function useGenerateBulkPayments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (monthYear: string) => {
      const res = await api.post<ApiResponse<unknown>>(ENDPOINTS.GENERATE_BULK, { monthYear })
      return res.data
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['payments'] }),
    onError: handleApiError,
  })
}
