import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import type { ApiResponse, Pg, PgSummary } from '@/api/types'
import { handleApiError } from '@/lib/apiError'
import type { CreatePgResponse } from '@/api/types'
import { useAuthStore } from '@/store/authStore'


export function usePgsList(enabled = true) {
  return useQuery({
    queryKey: ['pgs'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PgSummary[]>>(ENDPOINTS.PGS)
      return res.data.data
    },
    enabled,
  })
}

export function useCreatePg() {
  const qc = useQueryClient()

  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const setActivePgId  = useAuthStore((s) => s.setActivePgId)

  return useMutation({
    mutationFn: async (payload: Partial<Pg> & { name: string; address: string; city: string }) => {
      const res = await api.post<ApiResponse<CreatePgResponse>>(ENDPOINTS.PGS, payload)
      return res.data.data
    },

    // 🔥 IMPORTANT — yahi main logic hai
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      setActivePgId(data.pg.id)

      void qc.invalidateQueries({ queryKey: ['pgs'] })
    },

    onError: handleApiError,
  })
}

// export function useSwitchPg() {
//   const qc = useQueryClient()
//   return useMutation({
//     mutationFn: async (id: string) => {
//       const res = await api.patch<ApiResponse<PgSummary>>(ENDPOINTS.SWITCH_PG(id), {})
//       return res.data.data
//     },
//     onSuccess: () => {
//       void qc.invalidateQueries()
//     },
//     onError: handleApiError,
//   })
// }




interface SwitchPgResponse {
  pg: PgSummary
  accessToken: string
}

export function useSwitchPg() {
  const qc = useQueryClient()

  const setAccessToken = useAuthStore((s) => s.setAccessToken)

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<SwitchPgResponse>>(
        ENDPOINTS.SWITCH_PG(id),
        {}
      )

      return res.data.data
    },

    onSuccess: async (data) => {
      // ✅ SAVE NEW TOKEN
      setAccessToken(data.accessToken)

      // OPTIONAL: persist after refresh
      localStorage.setItem('accessToken', data.accessToken)

      // ✅ REFRESH ALL QUERIES USING NEW JWT
      await qc.invalidateQueries()
    },

    onError: handleApiError,
  })
}
