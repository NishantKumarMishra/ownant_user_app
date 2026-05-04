import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import type { ApiResponse, TenantDetail, TenantListItem } from '@/api/types'
import { handleApiError } from '@/lib/apiError'

export interface TenantListQuery {
  status?: string
  page?: number
  size?: number
}

export function useTenants(params: TenantListQuery, enabled = true) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ content: TenantListItem[]; totalElements?: number }>>(
        ENDPOINTS.TENANTS,
        { params },
      )
      const data = res.data.data as { content?: TenantListItem[]; items?: TenantListItem[] }
      return data.content ?? data.items ?? []
    },
    enabled,
  })
}

export function useTenantSearch(q: string, enabled: boolean) {
  return useQuery({
    queryKey: ['tenants', 'search', q],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TenantListItem[]>>(ENDPOINTS.TENANT_SEARCH, {
        params: { q },
      })
      return res.data.data
    },
    enabled: enabled && q.length > 0,
  })
}

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: ['tenants', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TenantDetail>>(ENDPOINTS.TENANT_BY_ID(id!))
      return res.data.data
    },
    enabled: Boolean(id),
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post<ApiResponse<TenantDetail>>(ENDPOINTS.TENANTS, payload)
      return res.data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tenants'] })
      void qc.invalidateQueries({ queryKey: ['rooms'] })
    },
    onError: handleApiError,
  })
}

export function useNoticeTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(ENDPOINTS.NOTICE_TENANT(id), {})
    },
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: ['tenants', id] })
    },
    onError: handleApiError,
  })
}

export function useVacateTenant() {
  const qc = useQueryClient()

  return useMutation({
    /**
     * OLD CODE (wrong because backend expects moveOutDate)
     *
     * mutationFn: async ({ id, vacateDate }: { id: string; vacateDate: string }) => {
     *   await api.patch(ENDPOINTS.VACATE_TENANT(id), { vacateDate })
     * },
     */

    /**
     * NEW CODE (correct)
     * Backend expects:
     * moveOutDate
     */

    mutationFn: async ({
      id,
      moveOutDate,
    }: {
      id: string
      moveOutDate: string
    }) => {
      await api.patch(
        ENDPOINTS.VACATE_TENANT(id),
        {
          moveOutDate,
        }
      )
    },

    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ['tenants'] })
      void qc.invalidateQueries({ queryKey: ['tenants', id] })
      void qc.invalidateQueries({ queryKey: ['rooms'] })
    },

    onError: handleApiError,
  })
}
