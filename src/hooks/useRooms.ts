import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import type { ApiResponse, Room, RoomTypeBulkRow, VacantBedOption } from '@/api/types'
import { handleApiError } from '@/lib/apiError'

export interface RoomListParams {
  sharingType?: number
  isAc?: boolean
  hasVacancy?: boolean
}

export function useRooms(params: RoomListParams, enabled = true) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Room[]>>(ENDPOINTS.ROOMS, { params })
      return res.data.data
    },
    enabled,
  })
}

export function useRoom(id: string | undefined) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Room>>(ENDPOINTS.ROOM_BY_ID(id!))
      return res.data.data
    },
    enabled: Boolean(id),
  })
}

export function useVacantBeds(enabled = true) {
  return useQuery({
    queryKey: ['rooms', 'vacant-beds'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<VacantBedOption[]>>(ENDPOINTS.VACANT_BEDS)
      return res.data.data
    },
    enabled,
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Room> & { roomNumber: string; sharingType: number; rentPerBed: number }) => {
      const res = await api.post<ApiResponse<Room>>(ENDPOINTS.ROOMS, payload)
      return res.data.data
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rooms'] }),
    onError: handleApiError,
  })
}

export function useBulkRooms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomTypes: RoomTypeBulkRow[]) => {
      const res = await api.post<ApiResponse<unknown>>(ENDPOINTS.ROOMS_BULK, { roomTypes })
      return res.data
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rooms'] }),
    onError: handleApiError,
  })
}

export function useDeleteRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(ENDPOINTS.ROOM_BY_ID(id))
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rooms'] }),
    onError: handleApiError,
  })
}

export function useUpdateRoom(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Room>) => {
      const res = await api.patch<ApiResponse<Room>>(ENDPOINTS.ROOM_BY_ID(id), payload)
      return res.data.data
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['rooms'] }),
    onError: handleApiError,
  })
}
