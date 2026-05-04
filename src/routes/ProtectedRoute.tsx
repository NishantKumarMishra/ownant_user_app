// src/routes/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface Props {
  // Your App.tsx passes children in two ways:
  //   <ProtectedRoute><OnboardingPgPage /></ProtectedRoute>  ← children
  //   <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}> ← children + Outlet inside AppLayout
  children?: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const accessToken  = useAuthStore((s) => s.accessToken)
  const _hasHydrated = useAuthStore((s) => s._hasHydrated)

  // ── Step 1: Wait for Zustand to restore from localStorage ────
  // This is the ONLY reason the redirect-to-login bug happens.
  // On first render, _hasHydrated = false, accessToken = null.
  // Without this guard, we redirect to /login before tokens load.
  if (!_hasHydrated) {
    return <SplashLoader />
  }

  // ── Step 2: Hydration done — now check auth ──────────────────
  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  // ── Step 3: Authenticated ────────────────────────────────────
  // If children passed (your pattern) render children.
  // Children like AppLayout use <Outlet /> internally for nested routes.
  return <>{children}</>
}

// Tiny loading screen shown for <50ms during hydration
function SplashLoader() {
  return (
    <div
      style={{
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        height:          '100svh',
        backgroundColor: '#F5F5F0',
        gap:             '16px',
      }}
    >
      <div
        style={{
          width:        '36px',
          height:       '36px',
          border:       '3px solid #E1F5EE',
          borderTop:    '3px solid #0F6E56',
          borderRadius: '50%',
          animation:    'pg-spin 0.7s linear infinite',
        }}
      />
      <style>{`
        @keyframes pg-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}