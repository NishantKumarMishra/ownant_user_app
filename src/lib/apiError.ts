import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

export function handleApiError(error: unknown): void {
  const err = error as {
    response?: { data?: { errorCode?: string; message?: string } }
  }
  const errorCode = err.response?.data?.errorCode
  const message = err.response?.data?.message

  switch (errorCode) {
    case 'AUTH_007':
      useAuthStore.getState().logout()
      window.location.href = '/login'
      break
    case 'SUB_001':
      toast.error('PG limit reached. Please upgrade your plan.')
      break
    case 'SUB_002':
      toast.error('Bed limit reached. Please upgrade your plan.')
      break
    case 'SUB_003':
      toast.error('Subscription expired. Please renew.')
      break
    case 'BED_002':
      toast.error('This bed is already occupied.')
      break
    case 'TENANT_002':
      toast.error('A tenant with this phone already exists in this PG.')
      break
    default:
      toast.error(message || 'Something went wrong. Please try again.')
  }
}
