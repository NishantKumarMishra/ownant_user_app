// src/hooks/useAuth.ts

import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/api/axios'
import type { OwnerProfile } from '@/api/types'

/**
 * =====================================================
 * VERIFY OTP RESPONSE
 * Backend:
 * /auth/verify-otp
 *
 * This returns:
 * accessToken
 * refreshToken
 * isNewUser
 * owner object
 * =====================================================
 */
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn: number
  isNewUser: boolean

  owner: {
    id: string
    name: string
    phone: string
    activePgId: string | null
  }
}

/**
 * =====================================================
 * REGISTER RESPONSE
 * Backend:
 * /auth/register
 *
 * This returns:
 * owner profile data
 * (NOT accessToken)
 *
 * This is required for onboarding flow:
 * login → register → create PG → bulk rooms
 * =====================================================
 */
export interface RegisterResponse {
  id: string
  name: string
  phone: string
  email?: string | null
  activePgId?: string | null
  activePgName?: string | null
}

/**
 * =====================================================
 * SEND OTP
 * =====================================================
 */
export function useSendOtp() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const res = await api.post('/auth/send-otp', { phone })

      /**
       * res.data = ApiResponse<OtpSentResponse>
       * return only inner data
       */
      return res.data.data
    },
  })
}

/**
 * =====================================================
 * VERIFY OTP
 * =====================================================
 */
export function useVerifyOtp() {
  return useMutation({
    mutationFn: async ({
      phone,
      otp,
    }: {
      phone: string
      otp: string
    }) => {
      const res = await api.post('/auth/verify-otp', {
        phone,
        otp,
      })

      /**
       * res.data = ApiResponse<AuthResponse>
       */
      return res.data.data as AuthResponse
    },
  })
}

/**
 * =====================================================
 * REGISTER
 * IMPORTANT FIX:
 * Must return RegisterResponse
 * NOT AuthResponse
 * =====================================================
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (payload: {
      phone: string
      name: string
      email?: string
    }) => {
      const res = await api.post('/auth/register', payload)

      /**
       * Backend returns:
       * ApiResponse<RegisterResponse>
       */
      return res.data.data as RegisterResponse
    },
  })
}

/**
 * =====================================================
 * LOGOUT
 * FIX:
 * remove unused refreshToken warning
 * =====================================================
 */
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const { useAuthStore } = await import('@/store/authStore')

      const { refreshToken } = useAuthStore.getState()

      await api.post('/auth/logout', {
        refreshToken,
      })
    },
  })
}

/**
 * =====================================================
 * OWNER PROFILE
 * =====================================================
 */
export function useOwnerProfile() {
  return useQuery({
    queryKey: ['owner-profile'],

    queryFn: async () => {
      const res = await api.get('/owner/me')

      return res.data.data as OwnerProfile
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}