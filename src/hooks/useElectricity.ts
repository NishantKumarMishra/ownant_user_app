// src/hooks/useElectricity.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import type {
  ElectricityConfig,
  ElectricityBill,
  ElectricityBillSummary,
  ElectricityDue,
  BillPreview,
  RoomReading,
} from '@/api/types'
import toast from 'react-hot-toast'

// ── Query keys ────────────────────────────────────────────────
const KEYS = {
  config: ['electricity', 'config'] as const,
  bills:  ['electricity', 'bills']  as const,
  bill:   (id: string) => ['electricity', 'bills', id] as const,
}

// ── Config ────────────────────────────────────────────────────

export function useElectricityConfig() {
  return useQuery({
    queryKey: KEYS.config,
    queryFn: async () => {
      const res = await api.get(ENDPOINTS.ELECTRICITY_CONFIG)
      return res.data.data as ElectricityConfig | null
    },
  })
}

export function useSaveElectricityConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      billingMode:           string
      meterType:             string
      fixedAmountPerTenant?: number | null
      perUnitRate?:          number | null
    }) => {
      const res = await api.post(ENDPOINTS.ELECTRICITY_CONFIG, data)
      return res.data.data as ElectricityConfig
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.config })
      toast.success('Electricity config saved!')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Failed to save config')
    },
  })
}

// ── Bills ─────────────────────────────────────────────────────

export function useElectricityBills() {
  return useQuery({
    queryKey: KEYS.bills,
    queryFn: async () => {
      const res = await api.get(ENDPOINTS.ELECTRICITY_BILLS)
      return res.data.data as ElectricityBillSummary[]
    },
  })
}

export function useElectricityBill(billId: string) {
  return useQuery({
    queryKey: KEYS.bill(billId),
    queryFn: async () => {
      const res = await api.get(ENDPOINTS.ELECTRICITY_BILL_BY_ID(billId))
      return res.data.data as ElectricityBill
    },
    enabled: !!billId,
  })
}

export function usePreviewBill() {
  return useMutation({
    mutationFn: async (data: {
      billingPeriodFrom:      string
      billingPeriodTo:        string
      totalAmount?:           number | null
      fixedAmountPerTenant?:  number | null
      roomReadings?:          RoomReading[]
      notes?:                 string
    }) => {
      const res = await api.post(ENDPOINTS.ELECTRICITY_BILLS_PREVIEW, data)
      return res.data.data as BillPreview
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Preview failed')
    },
  })
}

export function useGenerateBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      billingPeriodFrom:      string
      billingPeriodTo:        string
      totalAmount?:           number | null
      fixedAmountPerTenant?:  number | null
      roomReadings?:          RoomReading[]
      notes?:                 string
    }) => {
      const res = await api.post(ENDPOINTS.ELECTRICITY_BILLS_GENERATE, data)
      return res.data.data as ElectricityBill
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.bills })
      toast.success('Bill generated! Tenants notified via WhatsApp.')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Failed to generate bill')
    },
  })
}

// ── Dues ──────────────────────────────────────────────────────

export function useMarkDuePaid(billId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ dueId, data }: {
      dueId: string
      data: { paidDate?: string; paymentMode?: string; referenceNo?: string; notes?: string }
    }) => {
      const res = await api.patch(ENDPOINTS.ELECTRICITY_DUE_PAY(dueId), data)
      return res.data.data as ElectricityDue
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.bill(billId) })
      qc.invalidateQueries({ queryKey: KEYS.bills })
      toast.success('Marked as paid')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Failed to mark paid')
    },
  })
}

export function useWaiveDue(billId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ dueId, notes }: { dueId: string; notes?: string }) => {
      const res = await api.patch(ENDPOINTS.ELECTRICITY_DUE_WAIVE(dueId), { notes })
      return res.data.data as ElectricityDue
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.bill(billId) })
      qc.invalidateQueries({ queryKey: KEYS.bills })
      toast.success('Due waived')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Failed to waive due')
    },
  })
}

export function useExcludeDue(billId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dueId: string) => {
      const res = await api.patch(ENDPOINTS.ELECTRICITY_DUE_EXCLUDE(dueId))
      return res.data.data as ElectricityDue
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.bill(billId) })
      toast.success('Tenant excluded from this bill')
    },
  })
}