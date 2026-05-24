import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, LayoutGrid } from 'lucide-react'
import { RoomCard } from '@/components/rooms/RoomCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useRooms, type RoomListParams } from '@/hooks/useRooms'
import type { Room } from '@/api/types'
import { cn } from '@/lib/utils'

/**
 * =========================================
 * UPDATED:
 * Removed sharing type filters (S1-S5)
 *
 * OLD:
 * S1, S2, S3, S4, S5
 *
 * NEW:
 * Only:
 * ALL
 * VACANCY
 * FULL
 * AC
 * NONAC
 * =========================================
 */

type Pill =
  | 'ALL'
  | 'VACANCY'
  | 'FULL'
  | 'AC'
  | 'NONAC'

export function RoomListPage() {
  const navigate = useNavigate()

  const [pills, setPills] = useState<Set<Pill>>(
    new Set(['ALL'])
  )

  const toggle = (p: Pill) => {
    setPills((prev) => {
      const next = new Set(prev)

      /**
       * =========================================
       * If ALL clicked → reset everything
       * =========================================
       */
      if (p === 'ALL') {
        return new Set(['ALL'])
      }

      next.delete('ALL')

      if (next.has(p)) {
        next.delete(p)
      } else {
        next.add(p)
      }

      /**
       * If nothing selected → fallback to ALL
       */
      if (next.size === 0) {
        return new Set(['ALL'])
      }

      return next
    })
  }

  /**
   * =========================================
   * Query params for backend API
   * =========================================
   */

  const queryParams: RoomListParams = useMemo(() => {
    if (pills.has('ALL')) return {}

    const q: RoomListParams = {}

    if (pills.has('VACANCY')) {
      q.hasVacancy = true
    }

    // if (pills.has('FULL')) {
    //   q.hasVacancy = false
    // }

    

    if (pills.has('AC')) {
      q.isAc = true
    }

    if (pills.has('NONAC')) {
      q.isAc = false
    }

    return q
  }, [pills])

  const {
    data: rooms = [],
    isLoading,
  } = useRooms(queryParams)

  /**
   * =========================================
   * Frontend fallback filtering
   * =========================================
   */

  const filtered = useMemo(() => {
    let list: Room[] = rooms

    /**
 * Backend sends:
 * totalBeds
 * vacantBeds
 *
 * NOT:
 * vacantCount
 */

if (pills.has('FULL')) {
  list = list.filter(
    (r) => (r.vacantBeds ?? 0) === 0
  )
}

if (pills.has('VACANCY')) {
  list = list.filter(
    (r) => (r.vacantBeds ?? 0) > 0
  )
}

    if (pills.has('AC')) {
      list = list.filter((r) => r.isAc)
    }

    if (pills.has('NONAC')) {
      list = list.filter((r) => !r.isAc)
    }

    return list
  }, [rooms, pills])

  /**
   * =========================================
   * Responsive pill definitions
   * =========================================
   */

  const pillDefs: {
    id: Pill
    label: string
  }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'VACANCY', label: 'Vacancy' },
    { id: 'FULL', label: 'Full' },
    { id: 'AC', label: 'AC' },
    { id: 'NONAC', label: 'Non-AC' },
  ]

  return (
    <div className="pb-24">
      {/* =========================================
          Responsive Filter Pills
      ========================================= */}

     <div className="mb-5">
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar"
    style={{ WebkitOverflowScrolling: 'touch' }}>
          {pillDefs.map(({ id, label }) => {
            const active = pills.has(id)

            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs sm:text-sm font-semibold transition-all',
                  active
                    ? 'border-primary bg-primaryLight text-primary'
                    : 'border-border bg-surface text-textSecondary'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* =========================================
          Loading State
      ========================================= */}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-40 w-full rounded-xl"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /**
         * =========================================
         * Empty State
         * =========================================
         */
        <EmptyState
          icon={LayoutGrid}
          title="No rooms found"
          description="Try changing filters or add a new room."
          actionLabel="Add room"
          onAction={() => navigate('/rooms/add')}
        />
      ) : (
        /**
         * =========================================
         * Fully Responsive Room Grid
         *
         * Mobile → 1 column
         * Small → 2 columns
         * Medium → 3 columns
         * Large → 4 columns
         * =========================================
         */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
            />
          ))}
        </div>
      )}

      {/* =========================================
          Floating Add Button
      ========================================= */}

      <Link
        to="/rooms/add"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:scale-105 lg:bottom-8"
        aria-label="Add room"
      >
        <Plus className="h-7 w-7" />
      </Link>
    </div>
  )
}