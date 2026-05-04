import { Link } from 'react-router-dom'
import type { Room } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { BedSlot } from '@/components/rooms/BedSlot'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface RoomCardProps {
  room: Room
}

export function RoomCard({ room }: RoomCardProps) {
  const beds = room.beds ?? []
  const vacant =
    room.vacantBeds ?? beds.filter((b) => b.status === 'VACANT').length

  const slots = room.sharingType
  const occupiedSlots = Math.max(0, slots - vacant)
  const hasVacancy = vacant > 0

  const occupancy = Math.round((occupiedSlots / slots) * 100)

  return (
    <Link to={`/rooms/${room.id}`} className="group block h-full">
      <Card
        className={cn(
          'relative h-full overflow-hidden border transition-all duration-300',
          'hover:shadow-xl hover:-translate-y-1',
          hasVacancy
            ? 'border-l-4 border-l-primary'
            : 'border-l-4 border-l-red-500'
        )}
      >
        {/* 🔴 FULL OVERLAY */}
        {!hasVacancy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
              Fully Occupied
            </span>
          </div>
        )}

        <div className="flex h-full flex-col justify-between p-4 sm:p-5">
          
          {/* 🔹 HEADER */}
          <div className="flex flex-col gap-3">
            
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-base font-semibold text-textPrimary sm:text-lg">
                  Room {room.roomNumber}
                </span>

                <div className="flex items-center gap-2">
                  {/* Status Dot */}
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      hasVacancy ? 'bg-green-500' : 'bg-red-500'
                    )}
                  />

                  <span className="text-xs text-textSecondary">
                    {hasVacancy ? 'Available' : 'Full'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary" className="text-xs">
                  {room.sharingType}-sharing
                </Badge>

                {room.isAc ? (
                  <Badge className="text-xs">AC</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Non-AC
                  </Badge>
                )}
              </div>
            </div>

            {/* 🔹 OCCUPANCY BAR */}
            <div className="mt-1">
              <div className="mb-1 flex items-center justify-between text-xs text-textSecondary">
                <span>Occupancy</span>
                <span>{occupancy}%</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    occupancy < 50
                      ? 'bg-green-500'
                      : occupancy < 80
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${occupancy}%` }}
                />
              </div>
            </div>

            {/* 🔹 BEDS */}
            <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
              {beds.length
                ? beds.map((b) => (
                    <BedSlot
                      key={b.id}
                      occupied={b.status === 'OCCUPIED'}
                    />
                  ))
                : Array.from({ length: slots }).map((_, i) => (
                    <BedSlot key={i} occupied={i < occupiedSlots} />
                  ))}
            </div>
          </div>

          {/* 🔹 FOOTER */}
          <div className="mt-4 flex items-center justify-between">
            
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-textPrimary">
                {formatCurrency(room.rentPerBed)}
              </span>
              <span className="text-xs text-textSecondary">per bed</span>
            </div>

            <div
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                hasVacancy
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              )}
            >
              {vacant} free
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}