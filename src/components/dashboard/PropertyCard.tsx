// src/components/dashboard/PropertyCard.tsx

import { Copy, Users, Clock, BookOpen, AlertTriangle, IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import type { PropertyOverviewItem } from '@/api/types'

interface PropertyCardProps {
  property: PropertyOverviewItem
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
  return `₹${amount}`
}

const STAT_ROWS = [
  {
    key: 'activeTenants',
    label: 'Active Tenants',
    icon: Users,
    iconBg: 'bg-purple-500',
    isCurrency: false,
  },
  {
    key: 'noticeTenants',
    label: 'Under Eviction',
    icon: Clock,
    iconBg: 'bg-orange-500',
    isCurrency: false,
  },
  {
    key: 'currentBookings',
    label: 'Current Bookings',
    icon: BookOpen,
    iconBg: 'bg-amber-400',
    isCurrency: false,
  },
  {
    key: 'pendingDues',
    label: 'Pending Dues',
    icon: AlertTriangle,
    iconBg: 'bg-red-500',
    isCurrency: true,
  },
  {
    key: 'monthCollection',
    label: `${format(new Date(), 'MMM')}'s Collection`,
    icon: IndianRupee,
    iconBg: 'bg-green-500',
    isCurrency: true,
  },
]

export function PropertyCard({ property }: PropertyCardProps) {
  const {
    pgId,
    pgName,
    totalBeds,
    occupiedBeds,
    occupancyRate,
    activeTenants,
    noticeTenants,
    pendingDues,
    monthCollection,
  } = property

  const shortId = pgId.replace(/-/g, '').slice(0, 10).toUpperCase()
  const occupancyPercent = Math.min(Math.round(occupancyRate), 100)

  // map stat key → value
  const statValues: Record<string, number> = {
    activeTenants,
    noticeTenants,
    currentBookings: 0, // add to API if available
    pendingDues,
    monthCollection,
  }

  function handleCopy() {
    void navigator.clipboard.writeText(pgId)
    toast.success('ID copied')
  }

  return (
    <div className="flex-shrink-0 w-[88vw] max-w-sm bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">

      {/* ── Header: name + ID ── */}
      <div>
        <p className="text-lg font-bold text-textPrimary">{pgName}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-xs text-textTertiary">
            Ownant Id: <span className="font-medium text-textSecondary">{shortId}</span>
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="text-textTertiary hover:text-primary transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Occupied Beds box ── */}
      <div className="bg-gray-100 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-textSecondary">Occupied Beds</span>
          <span className="text-sm font-bold text-textPrimary">
            {occupiedBeds}/{totalBeds}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      {/* ── Stat rows ── */}
      <div className="flex flex-col gap-3.5">
        {STAT_ROWS.map(({ key, label, icon: Icon, iconBg, isCurrency }) => {
          const val = statValues[key] ?? 0
          const display = isCurrency ? formatCurrency(val) : String(val)
          return (
            <div key={key} className="flex items-center gap-3">
              {/* Colored circle icon */}
              <div className={`h-9 w-9 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="flex-1 text-sm text-textPrimary">{label}</span>
              <span className="text-sm font-bold text-textPrimary">{display}</span>
            </div>
          )
        })}
      </div>

    </div>
  )
}