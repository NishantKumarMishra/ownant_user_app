import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function CatchAll() {
  const isAuthenticated = useAuthStore((s) => s.accessToken)
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}
