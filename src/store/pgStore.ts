import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PgState {
  activePgId: string | null
  activePgName: string | null
  setActivePg: (id: string, name: string) => void
  clearActivePg: () => void
}

export const usePgStore = create<PgState>()(
  persist(
    (set) => ({
      activePgId: null,
      activePgName: null,
      setActivePg: (id, name) => set({ activePgId: id, activePgName: name }),
      clearActivePg: () => set({ activePgId: null, activePgName: null }),
    }),
    { name: 'pg-active' },
  ),
)
