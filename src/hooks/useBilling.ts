import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import type {
  ApiResponse,
  BackendPlanInfo,
  BillingPlan,
  FullSubscription,
  AddonPurchase,
  CheckoutSession,
  AddonCheckoutSession,
  OwnerProfile,
} from '@/api/types'
import { handleApiError } from '@/lib/apiError'

// ── Plans ─────────────────────────────────────────────────────

export function useBillingPlans(enabled = true) {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BackendPlanInfo[]>>(ENDPOINTS.PLANS)

      // Map backend → UI format (same pattern you already use)
      return res.data.data.map((p): BillingPlan => ({
        code:         p.plan,
        name:         p.displayName,
        priceMonthly: p.monthlyPrice,
        maxBeds:      p.maxBeds,
        maxPgs:       p.maxPgs,
        popular:      p.plan === 'PRO',
        features: buildFeatureList(p),
      }))
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Subscription ──────────────────────────────────────────────

// Lightweight version — used in profile/navbar (from OwnerProfile)
export function useSubscription(enabled = true) {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<FullSubscription>>(ENDPOINTS.SUBSCRIPTION)
      return res.data.data
    },
    enabled,
  })
}

// ── Addon purchase history ────────────────────────────────────

export function useAddons(enabled = true) {
  return useQuery({
    queryKey: ['billing', 'addons'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AddonPurchase[]>>(ENDPOINTS.ADDONS)
      return res.data.data
    },
    enabled,
  })
}

// ── Base plan upgrade ─────────────────────────────────────────

export function useCheckout() {
  return useMutation({
    mutationFn: async (planCode: string) => {
      const res = await api.post<ApiResponse<CheckoutSession>>(
        ENDPOINTS.CHECKOUT,
        { plan: planCode }
      )
      return res.data.data
    },
    onError: handleApiError,
  })
}

export function useVerifyPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      razorpayPaymentId:      string
      razorpaySubscriptionId: string
      razorpaySignature:      string
    }) => {
      const res = await api.post<ApiResponse<FullSubscription>>(
        ENDPOINTS.VERIFY_PAYMENT,
        payload
      )
      return res.data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing'] })
      void qc.invalidateQueries({ queryKey: ['owner'] })
    },
    onError: handleApiError,
  })
}

// ── Addon beds ────────────────────────────────────────────────

export function useAddonCheckout() {
  return useMutation({
    mutationFn: async (payload: { addonType: string; quantity: number }) => {
      const res = await api.post<ApiResponse<AddonCheckoutSession>>(
        ENDPOINTS.ADDON_CHECKOUT,
        payload
      )
      return res.data.data
    },
    onError: handleApiError,
  })
}

export function useVerifyAddonPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      razorpayPaymentId: string
      razorpayOrderId:   string
      razorpaySignature: string
      addonType:         string
      quantity:          number
    }) => {
      const res = await api.post<ApiResponse<AddonPurchase>>(
        ENDPOINTS.ADDON_VERIFY,
        payload
      )
      return res.data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['billing'] })
      void qc.invalidateQueries({ queryKey: ['owner'] })
    },
    onError: handleApiError,
  })
}

// ── Cancel ────────────────────────────────────────────────────

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reason?: string) => {
      await api.post(ENDPOINTS.CANCEL_SUBSCRIPTION, { reason })
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['billing'] }),
    onError: handleApiError,
  })
}

// ── Feature list builder ──────────────────────────────────────

function buildFeatureList(p: BackendPlanInfo): string[] {
  const features: string[] = []

  features.push(p.maxBeds === -1 ? 'Unlimited beds' : `Up to ${p.maxBeds} beds`)
  features.push(p.maxPgs  === -1 ? 'Unlimited PGs'  : `${p.maxPgs} PG propert${p.maxPgs === 1 ? 'y' : 'ies'}`)

  if (p.plan === 'FREE') {
    features.push('Tenant management')
    features.push('Rent tracking')
    features.push('WhatsApp reminders')
  }

  if (p.plan === 'BASIC') {
    features.push('Everything in Free')
    features.push('Full analytics dashboard')
    features.push('Payment history')
    features.push('Email support')
  }

  if (p.plan === 'PRO') {
    features.push('Everything in Basic')
    features.push('Multi-PG switching')
    features.push('Priority support')
    features.push(`Addon beds at ₹${p.addonBedPrice}/bed`)
  }

  if (p.plan === 'BUSINESS') {
    features.push('Everything in Pro')
    features.push('Unlimited everything')
    features.push('API access')
    features.push('Dedicated account manager')
  }

  return features
}