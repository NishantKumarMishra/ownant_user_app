import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import type { ApiResponse, NotificationLog } from '@/api/types'
import { handleApiError } from '@/lib/apiError'

export function useTenantNotificationLogs(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', 'tenant', tenantId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<NotificationLog[]>>(
        ENDPOINTS.TENANT_NOTIF_LOGS(tenantId!),
      )
      return res.data.data
    },
    enabled: Boolean(tenantId),
  })
}

export function useTriggerReminders() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<
        ApiResponse<{ sent: number; skipped: number; failed: number }>
      >(ENDPOINTS.TRIGGER_REMINDERS, {})
      return res.data.data
    },
    onError: handleApiError,
  })
}

export function useSendReminder() {
  return useMutation({
    mutationFn: async (tenantId: string) => {
      const res = await api.post<ApiResponse<unknown>>(ENDPOINTS.SEND_REMINDER, { tenantId })
      return res.data
    },
    onError: handleApiError,
  })
}

export function useInvalidateAfterReminder() {
  const qc = useQueryClient()
  return () => void qc.invalidateQueries({ queryKey: ['notifications'] })
}
