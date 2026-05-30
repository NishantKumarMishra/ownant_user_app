// src/hooks/usePropertyOverview.ts

import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios'          // adjust path to where your axios file lives
import { ENDPOINTS } from '@/api/endpoints'
import type { PropertyOverviewResponse } from '@/api/types'  // adjust path to where your types file lives

const PROPERTY_OVERVIEW_KEY = ['property-overview'] as const

async function fetchPropertyOverview(): Promise<PropertyOverviewResponse> {
  const res = await api.get<PropertyOverviewResponse>(ENDPOINTS.PROPERTY_OVERVIEW)
  return res.data
}

export function usePropertyOverview() {
  return useQuery({
    queryKey: PROPERTY_OVERVIEW_KEY,
    queryFn: fetchPropertyOverview,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}