import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import type {
  AnalyticsOccupancy,
  AnalyticsTrendPoint,
  ApiResponse,
  DashboardData,
  PayerRow,
  RevenueProjection,
  RoomAnalyticsData,
  
} from '@/api/types'

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardData>>(ENDPOINTS.DASHBOARD)
      return res.data.data
    },
    enabled,
  })
}

export function useOccupancy(monthYear: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'occupancy', monthYear],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AnalyticsOccupancy>>(ENDPOINTS.ANALYTICS_OCCUPANCY, {
        params: { monthYear },
      })
      return res.data.data
    },
    enabled,
  })
}

export function useAnalyticsTrend(monthYear: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'trend', monthYear],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AnalyticsTrendPoint[]>>(ENDPOINTS.ANALYTICS_TREND, {
        params: { monthYear },
      })
      return res.data.data
    },
    enabled,
  })
}

export function usePayers(monthYear: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'payers', monthYear],
    queryFn: async () => {
      const res = await api.get<
        ApiResponse<{ topPayers: PayerRow[]; defaulters: PayerRow[] }>
      >(ENDPOINTS.ANALYTICS_PAYERS, { params: { monthYear } })
      return res.data.data
    },
    enabled,
  })
}

export function useRoomAnalytics(monthYear: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'rooms', monthYear],
    queryFn: async () => {
      const res = await api.get<ApiResponse<RoomAnalyticsData>>(
        ENDPOINTS.ANALYTICS_ROOMS,
        {
          params: { monthYear },
        }
      )

      return res.data.data
    },
    enabled,
  })
}

export function useProjection(monthYear: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'projection', monthYear],
    queryFn: async () => {
      const res = await api.get<ApiResponse<RevenueProjection>>(
        ENDPOINTS.ANALYTICS_PROJECTION,
        { params: { monthYear } },
      )
      return res.data.data
    },
    enabled,
  })
}
