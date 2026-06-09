import { Copy, Users, Clock, AlertTriangle, IndianRupee, BedDouble } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import type { PropertyOverviewItem } from '@/api/types'

interface PropertyCardProps {
  property: PropertyOverviewItem
  index:    number
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1).replace(/\.0$/, '')}L`
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return `₹${amount}`
}

// ── Card gradient themes ──────────────────────────────────────
const THEMES = [
  {
    bg:      'linear-gradient(135deg, #0d7a57 0%, #1D9E75 50%, #16a06a 100%)',
    accent:  'rgba(255,255,255,0.15)',
    text:    'white',
    sub:     'rgba(255,255,255,0.65)',
    bar:     'rgba(255,255,255,0.3)',
    barFill: 'white',
    stat:    'rgba(255,255,255,0.12)',
    border:  'rgba(255,255,255,0.2)',
  },
  {
    bg:      'linear-gradient(135deg, #1e3a5f 0%, #2563EB 50%, #3b82f6 100%)',
    accent:  'rgba(255,255,255,0.15)',
    text:    'white',
    sub:     'rgba(255,255,255,0.65)',
    bar:     'rgba(255,255,255,0.3)',
    barFill: 'white',
    stat:    'rgba(255,255,255,0.12)',
    border:  'rgba(255,255,255,0.2)',
  },
  {
    bg:      'linear-gradient(135deg, #4c1d95 0%, #7C3AED 50%, #8b5cf6 100%)',
    accent:  'rgba(255,255,255,0.15)',
    text:    'white',
    sub:     'rgba(255,255,255,0.65)',
    bar:     'rgba(255,255,255,0.3)',
    barFill: 'white',
    stat:    'rgba(255,255,255,0.12)',
    border:  'rgba(255,255,255,0.2)',
  },
]

// ── Mini stat row ─────────────────────────────────────────────
function StatRow({ icon, label, value, theme }: {
  icon:  React.ReactNode
  label: string
  value: string
  theme: typeof THEMES[0]
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
      style={{ background: theme.stat, border: `1px solid ${theme.border}` }}>
      <span style={{ color: theme.sub }}>{icon}</span>
      <span className="flex-1 text-xs font-semibold" style={{ color: theme.sub }}>
        {label}
      </span>
      <span className="text-sm font-black" style={{ color: theme.text }}>
        {value}
      </span>
    </div>
  )
}

export function PropertyCard({ property, index }: PropertyCardProps) {
  const theme = THEMES[index % THEMES.length]
  const {
    pgId, pgName, totalBeds, occupiedBeds,
    occupancyRate, activeTenants, noticeTenants,
    pendingDues, monthCollection, totalExpected,
  } = property

  const shortId         = pgId.replace(/-/g, '').slice(0, 8).toUpperCase()
  const occupancyPct    = Math.min(Math.round(occupancyRate), 100)
  const collectionRate  = totalExpected > 0
    ? Math.round((monthCollection / totalExpected) * 100) : 0

  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{
        width:        '82vw',
        maxWidth:     '320px',
        borderRadius: '24px',
        background:   theme.bg,
        padding:      '20px',
        position:     'relative',
        overflow:     'hidden',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
      }}
    >
      {/* Decorative orbs */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', bottom: -20, left: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }}/>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🏠</span>
            <h3 className="text-base font-black truncate" style={{ color: theme.text }}>
              {pgName}
            </h3>
          </div>
          <button
            onClick={() => { void navigator.clipboard.writeText(pgId); toast.success('ID copied') }}
            className="flex items-center gap-1.5 group"
          >
            <span className="text-[10px] font-bold font-mono tracking-widest"
              style={{ color: theme.sub }}>
              #{shortId}
            </span>
            <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: theme.sub }}/>
          </button>
        </div>

        {/* Collection rate badge */}
        <div className="flex-shrink-0 rounded-2xl px-3 py-1.5 ml-2"
          style={{ background: theme.accent, border: `1px solid ${theme.border}` }}>
          <p className="text-[10px] font-bold text-center" style={{ color: theme.sub }}>
            Collected
          </p>
          <p className="text-sm font-black text-center" style={{ color: theme.text }}>
            {collectionRate}%
          </p>
        </div>
      </div>

      {/* ── Occupancy ───────────────────────────────────── */}
      <div className="mb-4 rounded-2xl p-3.5"
        style={{ background: theme.accent, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BedDouble className="h-3.5 w-3.5" style={{ color: theme.sub }}/>
            <span className="text-xs font-semibold" style={{ color: theme.sub }}>
              Occupancy
            </span>
          </div>
          <span className="text-sm font-black" style={{ color: theme.text }}>
            {occupiedBeds}/{totalBeds} beds
          </span>
        </div>
        {/* Progress bar */}
        <div className="relative h-2 rounded-full overflow-hidden"
          style={{ background: theme.bar }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${occupancyPct}%`,
              background: theme.barFill,
              boxShadow: `0 0 8px ${theme.barFill}`,
            }}/>
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-bold" style={{ color: theme.sub }}>
            {occupancyPct}% occupied
          </span>
          <span className="text-[10px] font-bold" style={{ color: theme.sub }}>
            {totalBeds - occupiedBeds} vacant
          </span>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="space-y-2 flex-1">
        <StatRow
          icon={<Users className="h-3.5 w-3.5"/>}
          label="Active Tenants"
          value={String(activeTenants)}
          theme={theme}
        />
        {noticeTenants > 0 && (
          <StatRow
            icon={<Clock className="h-3.5 w-3.5"/>}
            label="Under Notice"
            value={String(noticeTenants)}
            theme={theme}
          />
        )}
        <StatRow
          icon={<AlertTriangle className="h-3.5 w-3.5"/>}
          label="Pending Dues"
          value={formatCurrency(pendingDues)}
          theme={theme}
        />
        <StatRow
          icon={<IndianRupee className="h-3.5 w-3.5"/>}
          label={`${format(new Date(), 'MMM')} Collection`}
          value={formatCurrency(monthCollection)}
          theme={theme}
        />
      </div>

      {/* ── Bottom: total expected ──────────────────────── */}
      <div className="mt-4 pt-3"
        style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold" style={{ color: theme.sub }}>
            Expected this month
          </span>
          <span className="text-sm font-black" style={{ color: theme.text }}>
            {formatCurrency(totalExpected)}
          </span>
        </div>
      </div>
    </div>
  )
}