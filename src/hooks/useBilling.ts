import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import type { ApiResponse,  CheckoutSession, OwnerProfile } from '@/api/types'
import { handleApiError } from '@/lib/apiError'

export function useBillingPlans(enabled = true) {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any[]>>(ENDPOINTS.PLANS)

      // ✅ MAP BACKEND → UI FORMAT
      return res.data.data.map((p) => ({
        code: p.plan,
        name: p.displayName,
        priceMonthly: p.monthlyPrice,
        features: [
          p.maxBeds === -1 ? 'Unlimited beds' : `${p.maxBeds} beds`,
          p.maxPgs === -1 ? 'Unlimited PGs' : `${p.maxPgs} PGs`,
        ],
        popular: p.plan === 'PRO', // optional
      }))
    },
    enabled,
  })
}



export function useSubscription(enabled = true) {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<OwnerProfile['subscription']>>(ENDPOINTS.SUBSCRIPTION)
      return res.data.data
    },
    enabled,
  })
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (planCode: string) => {
      const res = await api.post<ApiResponse<CheckoutSession>>(ENDPOINTS.CHECKOUT, { plan:planCode })
      return res.data.data
    },
    onError: handleApiError,
  })
}

export function useVerifyPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      razorpayPaymentId: string
      razorpaySubscriptionId: string
      razorpaySignature: string
    }) => {
      const res = await api.post<ApiResponse<unknown>>(ENDPOINTS.VERIFY_PAYMENT, payload)
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing'] })
      void qc.invalidateQueries({ queryKey: ['owner'] })
    },
    onError: handleApiError,
  })
}

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(ENDPOINTS.CANCEL_SUBSCRIPTION, {})
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['billing'] }),
    onError: handleApiError,
  })
}
