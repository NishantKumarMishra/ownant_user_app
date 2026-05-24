// src/components/dashboard/PropertyOverview.tsx
// Drop this anywhere in DashboardPage.tsx with: <PropertyOverview />

import { Link } from 'react-router-dom'
import { ChevronRight, Users, BedDouble, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboard } from '@/hooks/useAnalytics'
import { usePgsList } from '@/hooks/usePgs'
import { usePgStore } from '@/store/pgStore'

function fmt(n: number) {
  return '₹' + Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

export function PropertyOverview() {
  const { data: dashboard, isLoading } = useDashboard()
  const { data: pgs }                  = usePgsList()
  const { activePgId, activePgName }   = usePgStore()

  // Find active PG summary
  const activePg = pgs?.find(p => p.id === activePgId)

  if (isLoading) {
    return (
      <div className="mb-5 space-y-3">
        <div className="h-5 w-40 rounded-full bg-surface animate-pulse" />
        <div className="h-36 w-full rounded-2xl bg-surface animate-pulse" />
      </div>
    )
  }

  if (!dashboard) return null

  const { occupancy, collection, tenants } = dashboard

  const occupancyPct = Math.round(occupancy.occupancyRate ?? 0)
  const collectionPct = Math.round(collection.collectionRate ?? 0)

  // Progress bar color
  const barColor = occupancyPct >= 80
    ? 'bg-success'
    : occupancyPct >= 50
    ? 'bg-amber-400'
    : 'bg-danger'

  return (
    <div className="mb-5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-textPrimary">Property Overview</h2>
        <Link
          to="/rooms"
          className="flex items-center gap-0.5 text-xs font-semibold text-primary"
        >
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">

        {/* PG name + city */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-textPrimary">
              {activePgName ?? activePg?.name ?? 'My PG'}
            </p>
            {activePg?.city && (
              <p className="text-xs text-textSecondary mt-0.5">{activePg.city}</p>
            )}
          </div>
          {/* Occupancy % badge */}
          <span className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-full',
            occupancyPct >= 80
              ? 'bg-success/10 text-success'
              : occupancyPct >= 50
              ? 'bg-amber-50 text-amber-600'
              : 'bg-danger/10 text-danger'
          )}>
            {occupancyPct}% full
          </span>
        </div>

        {/* Occupied beds progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs text-textSecondary flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              Occupied Beds
            </p>
            <p className="text-xs font-bold text-textPrimary">
              {occupancy.occupiedBeds}/{occupancy.totalBeds}
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-border overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', barColor)}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
          <p className="text-[10px] text-textMuted mt-1">
            {occupancy.vacantBeds} bed{occupancy.vacantBeds !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">

          {/* Active tenants */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-textSecondary">Active Tenants</p>
              <p className="text-sm font-bold text-textPrimary">{tenants.activeTenants}</p>
            </div>
          </div>

          {/* Collection rate */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-[10px] text-textSecondary">Collection Rate</p>
              <p className="text-sm font-bold text-textPrimary">{collectionPct}%</p>
            </div>
          </div>

          {/* May's collection */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-amber-600">₹</span>
            </div>
            <div>
              <p className="text-[10px] text-textSecondary">
                {collection.monthYear?.replace('-', ' ') ?? 'This Month'}
              </p>
              <p className="text-sm font-bold text-textPrimary">
                {fmt(collection.totalCollected)}
              </p>
            </div>
          </div>

          {/* Pending dues */}
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0',
              collection.overdueCount > 0 ? 'bg-danger/10' : 'bg-success/10'
            )}>
              <AlertCircle className={cn(
                'h-4 w-4',
                collection.overdueCount > 0 ? 'text-danger' : 'text-success'
              )} />
            </div>
            <div>
              <p className="text-[10px] text-textSecondary">Pending Dues</p>
              <p className={cn(
                'text-sm font-bold',
                collection.overdueCount > 0 ? 'text-danger' : 'text-success'
              )}>
                {collection.overdueCount > 0
                  ? `${collection.overdueCount} overdue`
                  : '₹0 Clear ✓'
                }
              </p>
            </div>
          </div>

        </div>

        {/* Notice tenants warning */}
        {tenants.noticeTenants > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              <span className="font-semibold">{tenants.noticeTenants} tenant{tenants.noticeTenants > 1 ? 's' : ''}</span> on notice period
            </p>
            <Link to="/tenants" className="ml-auto text-xs font-semibold text-amber-700">
              View
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}