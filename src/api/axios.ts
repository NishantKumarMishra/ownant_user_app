import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { usePgStore } from '@/store/pgStore'
import { ENDPOINTS } from '@/api/endpoints'

const BASE = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

const rawAxios = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  const activePgId = usePgStore.getState().activePgId

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (activePgId) {
    config.headers['X-PG-ID'] = activePgId
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('no refresh')
        const res = await rawAxios.post(`${ENDPOINTS.REFRESH}`, { refreshToken })
        const body = res.data as { data?: { accessToken?: string } }
        const newToken = body.data?.accessToken
        if (!newToken) throw new Error('no token')
        useAuthStore.getState().setAccessToken(newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
