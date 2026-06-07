import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, LayoutGrid, Home,  Snowflake } from 'lucide-react'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useRooms, type RoomListParams } from '@/hooks/useRooms'
import type { Room } from '@/api/types'
import { cn } from '@/lib/utils'

type Pill = 'ALL' | 'VACANCY' | 'FULL' | 'AC' | 'NONAC'

const PILL_DEFS: { id: Pill; label: string; icon?: React.ReactNode; dotColor?: string }[] = [
  { id: 'ALL', label: 'All', icon: <Home className="h-3 w-3" /> },
  { id: 'VACANCY', label: 'Vacancy', dotColor: 'bg-success' },
  { id: 'FULL', label: 'Full', dotColor: 'bg-danger' },
  { id: 'AC', label: 'AC', icon: <Snowflake className="h-3 w-3" /> },
  { id: 'NONAC', label: 'Non-AC' },
]

export function RoomListPage() {
  const navigate = useNavigate()
  const [pills, setPills] = useState<Set<Pill>>(new Set(['ALL']))

  const toggle = (p: Pill) => {
    setPills((prev) => {
      const next = new Set(prev)
      if (p === 'ALL') return new Set(['ALL'])
      
      next.delete('ALL')
      if (next.has(p)) {
        next.delete(p)
      } else {
        next.add(p)
      }

      if (next.size === 0) return new Set(['ALL'])
      return next
    })
  }

  // API Backend Query setup
  const queryParams: RoomListParams = useMemo(() => {
    if (pills.has('ALL')) return {}
    const q: RoomListParams = {}
    if (pills.has('VACANCY')) q.hasVacancy = true
    if (pills.has('AC')) q.isAc = true
    if (pills.has('NONAC')) q.isAc = false
    return q
  }, [pills])

  const { data: rooms = [], isLoading } = useRooms(queryParams)

  // Frontend list filter processing
  const filtered = useMemo(() => {
    let list: Room[] = rooms
    if (pills.has('FULL')) list = list.filter((r) => (r.vacantBeds ?? 0) === 0)
    if (pills.has('VACANCY')) list = list.filter((r) => (r.vacantBeds ?? 0) > 0)
    if (pills.has('AC')) list = list.filter((r) => r.isAc)
    if (pills.has('NONAC')) list = list.filter((r) => !r.isAc)
    return list
  }, [rooms, pills])

  // Pure Room Level Simple Statistics (No beds logic)
  const stats = useMemo(() => {
    const totalRooms = rooms.length
    const vacantRooms = rooms.filter(r => (r.vacantBeds ?? 0) > 0).length
    const fullRooms = totalRooms - vacantRooms
    return { totalRooms, vacantRooms, fullRooms }
  }, [rooms])

  return (
    <div className="w-full pb-20 max-w-[1400px] mx-auto px-1">
      
      {/* ── Minimal Dynamic Header ── */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-textPrimary">Rooms Console</h1>
        <button
          onClick={() => navigate('/rooms/add')}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" /> Add Room
        </button>
      </div>

      {/* ── Horizontal Scrolling Premium Glass Row ── */}
      <div className="w-full overflow-x-auto scrollbar-none mb-4 pb-1">
        <div className="flex gap-3 min-w-max">
          
          <div className="w-[180px] rounded-xl border border-border/60 bg-surface/30 backdrop-blur-md p-3">
            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Total Rooms</span>
            <p className="text-2xl font-extrabold text-textPrimary mt-0.5">{isLoading ? '—' : stats.totalRooms}</p>
          </div>

          <div className="w-[180px] rounded-xl border border-border/60 bg-surface/30 backdrop-blur-md p-3">
            <span className="text-[10px] font-bold text-danger uppercase tracking-wider">Full Rooms</span>
            <p className="text-2xl font-extrabold text-textPrimary mt-0.5">{isLoading ? '—' : stats.fullRooms}</p>
          </div>

          <div className="w-[180px] rounded-xl border border-border/60 bg-surface/30 backdrop-blur-md p-3">
            <span className="text-[10px] font-bold text-success uppercase tracking-wider">Vacant Rooms</span>
            <p className="text-2xl font-extrabold text-success mt-0.5">{isLoading ? '—' : stats.vacantRooms}</p>
          </div>

        </div>
      </div>

      {/* ── Compact Filter Row ── */}
      <div className="mb-4 flex w-full gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PILL_DEFS.map(({ id, label, icon, dotColor }) => {
          const active = pills.has(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "flex items-center gap-1.5 flex-none rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
                active
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border/60 bg-surface text-textSecondary hover:border-primary/30'
              )}
            >
              {icon}
              {dotColor && <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />}
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Responsive Grid Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No rooms tracked"
          description="Modify parameters or setup database values."
          actionLabel="Clear Selection"
          onAction={() => setPills(new Set(['ALL']))}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((room) => (
            <div key={room.id} className="transition-transform duration-200 active:scale-[0.99]">
              <RoomCard room={room} />
            </div>
          ))}
        </div>
      )}

      {/* ── Fixed Floating Call Control ── */}
      <Link
        to="/rooms/add"
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-xl transition active:scale-90 border border-white/10 lg:bottom-6"
        aria-label="Add room"
      >
        <Plus className="h-5 w-5 stroke-[2.5]" />
      </Link>
    </div>
  )
}