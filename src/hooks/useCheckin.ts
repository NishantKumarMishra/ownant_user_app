// src/hooks/useCheckin.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import type { ApiResponse } from '@/api/types'

export interface CheckinDetail {
  id:                string
  tenantId:          string
  status:            'PENDING' | 'KYC_DONE' | 'COMPLETED' | string
  idProofType?:      string | null
  idFrontUrl?:       string | null
  idBackUrl?:        string | null
  emergencyName?:    string | null
  emergencyPhone?:   string | null
  currentAddress?:   string | null
  signatureImageUrl?: string | null
  agreementPdfUrl?:  string | null
  kycCompletedAt?:   string | null
  signedAt?:         string | null
  completedAt?:      string | null
  expiresAt?:        string | null
  expired:           boolean
}

export function useCheckinDetail(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['checkin', tenantId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CheckinDetail>>(
        `/tenants/${tenantId}/checkin`
      )
      return res.data.data
    },
    enabled: !!tenantId,
    retry: false, // don't retry if no checkin exists
  })
}

export function useResendCheckinInvite(tenantId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/tenants/${tenantId}/checkin/resend`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkin', tenantId] })
    },
  })
}

// Hook for dashboard — get all tenants with pending checkins
export function usePendingCheckins(tenants: { id: string; name: string; phone: string }[]) {
  return useQuery({
    queryKey: ['checkins', 'pending', tenants.map(t => t.id).join(',')],
    queryFn: async () => {
      const results = await Promise.allSettled(
        tenants.map(t =>
          api.get<ApiResponse<CheckinDetail>>(`/tenants/${t.id}/checkin`)
            .then(r => ({ tenant: t, checkin: r.data.data }))
        )
      )
      return results
        .filter((r): r is PromiseFulfilledResult<{ tenant: typeof tenants[0]; checkin: CheckinDetail }> =>
          r.status === 'fulfilled' && r.value.checkin.status !== 'COMPLETED'
        )
        .map(r => r.value)
    },
    enabled: tenants.length > 0,
  })
}