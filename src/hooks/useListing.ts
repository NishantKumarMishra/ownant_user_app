import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import type { ApiResponse } from '@/api/types'
import { handleApiError } from '@/lib/apiError'

// ── Types ─────────────────────────────────────────────────────

export interface ListingResponse {
  pgId:               string
  name:               string
  city:               string
  address:            string
  slug:               string | null
  locality:           string | null
  gender:             'MALE' | 'FEMALE' | 'MIXED' | null
  description:        string | null
  amenities:          string[]
  houseRules:         string[]
  latitude:           number | null
  longitude:          number | null
  contactPhone:       string | null
  contactWhatsapp:    string | null
  isListed:           boolean
  viewsCount:         number
  enquiriesCount:     number
  completionPercent:  number
  isReady:            boolean
  publicUrl:          string | null
  missingFields:      string[]
  photos:             ListingPhoto[]
  pendingEnquiries:   number
}

export interface ListingPhoto {
  id:        string
  url:       string
  caption:   string | null
  category:  string
  sortOrder: number
  isPrimary: boolean
}

export interface ShareInfo {
  publicUrl:        string
  whatsappShareText: string
  shortDescription: string
}

export interface UpdateListingPayload {
  locality?:        string
  gender?:          'MALE' | 'FEMALE' | 'MIXED'
  description?:     string
  amenities?:       string[]
  houseRules?:      string[]
  contactPhone?:    string
  contactWhatsapp?: string
  latitude?:        number
  longitude?:       number
}

// ── Hooks ─────────────────────────────────────────────────────

export function useListing() {
  return useQuery({
    queryKey: ['listing'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ListingResponse>>('/listing/me')
      return res.data.data
    },
  })
}

export function useUpdateListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateListingPayload) => {
      const res = await api.put<ApiResponse<ListingResponse>>('/listing/me', payload)
      return res.data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['listing'] })
    },
    onError: handleApiError,
  })
}

export function usePublishListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<ListingResponse>>('/listing/me/publish')
      return res.data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['listing'] })
    },
    onError: handleApiError,
  })
}

export function useUnpublishListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<ListingResponse>>('/listing/me/unpublish')
      return res.data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['listing'] })
    },
    onError: handleApiError,
  })
}

export function useShareInfo() {
  return useQuery({
    queryKey: ['listing', 'share'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ShareInfo>>('/listing/me/share')
      return res.data.data
    },
    enabled: false, // only fetch when needed
  })
}

export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ url, publicId, isPrimary }: {
      url: string; publicId: string; isPrimary: boolean
    }) => {
      const res = await api.post<ApiResponse<ListingPhoto>>('/listing/me/photos', {
        url, publicId, isPrimary,
      })
      return res.data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['listing'] })
    },
    onError: handleApiError,
  })
}

export function useDeletePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (photoId: string) => {
      await api.delete(`/listing/me/photos/${photoId}`)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['listing'] })
    },
    onError: handleApiError,
  })
}