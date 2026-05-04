// src/store/authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Owner {
  id:         string
  name:       string
  phone:      string
  activePgId: string | null
}

interface AuthState {
  accessToken:  string | null
  refreshToken: string | null
  owner:        Owner | null

  // ── Hydration flag — the key fix ──────────────────────────────
  // Starts false on every app load.
  // Zustand sets it to true after it finishes reading localStorage.
  // ProtectedRoute waits for this before making any auth decision.
  _hasHydrated: boolean

  setTokens:      (access: string, refresh: string) => void
  setAccessToken: (token: string) => void
  setOwner:       (owner: Owner) => void
  setActivePgId:  (pgId: string | null) => void
  setHasHydrated: (val: boolean) => void
  logout:         () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken:  null,
      refreshToken: null,
      owner:        null,
      _hasHydrated: false,

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      setAccessToken: (token) =>
        set({ accessToken: token }),

      setOwner: (owner) =>
        set({ owner }),

      setActivePgId: (pgId) =>
        set((state) => ({
          owner: state.owner ? { ...state.owner, activePgId: pgId } : null,
        })),

      setHasHydrated: (val) =>
        set({ _hasHydrated: val }),

      logout: () =>
        set({ accessToken: null, refreshToken: null, owner: null }),
    }),
    {
      name:    'pg-auth',
      storage: createJSONStorage(() => localStorage),

      // IMPORTANT: never persist _hasHydrated
      // It must always start as false on a fresh app load
      partialize: (state) => ({
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        owner:        state.owner,
      }),

      // This runs after Zustand finishes reading localStorage
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)