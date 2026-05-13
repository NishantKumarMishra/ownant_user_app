import { useState } from 'react'
import { addMonths, format } from 'date-fns'
import {
   Bar,  Line, ComposedChart,
  CartesianGrid, Tooltip, XAxis, YAxis,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useOccupancy, useAnalyticsTrend, usePayers,
  useRoomAnalytics, useProjection,
} from '@/hooks/useAnalytics'
import { usePaymentStats } from '@/hooks/usePayments'
import {  formatMonthYear } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  BedDouble,  AlertTriangle,
  CheckCircle2, Clock, Wind, Thermometer,
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────
const fmtINR = (n: number = 0) =>
  '₹' + Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)

const fmtShort = (n: number = 0) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon, color = 'primary', trend,
}: {
  label:   string
  value:   string
  sub?:    string
  icon:    React.ReactNode
  color?:  'primary' | 'success' | 'danger' | 'warning' | 'blue'
  trend?:  'up' | 'down' | 'flat'
}) {
  const colors = {
    primary: { bg: 'bg-primary/10',  text: 'text-primary',  icon: 'bg-primary/10'  },
    success: { bg: 'bg-success/10',  text: 'text-success',  icon: 'bg-success/10'  },
    danger:  { bg: 'bg-danger/10',   text: 'text-danger',   icon: 'bg-danger/10'   },
    warning: { bg: 'bg-amber-50',    text: 'text-amber-600', icon: 'bg-amber-50'   },
    blue:    { bg: 'bg-blue-50',     text: 'text-blue-600', icon: 'bg-blue-50'     },
  }
  const c = colors[color]
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', c.icon)}>
          <span className={c.text}>{icon}</span>
        </div>
        {trend && (
          <TrendIcon className={cn('h-4 w-4', trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-textSecondary')} />
        )}
      </div>
      <p className="text-xl font-bold text-textPrimary">{value}</p>
      <p className="text-xs text-textSecondary mt-0.5">{label}</p>
      {sub && <p className={cn('text-xs font-medium mt-1', c.text)}>{sub}</p>}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold text-textPrimary">{title}</h2>
      {sub && <p className="text-xs text-textSecondary mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-textPrimary mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmtShort(p.value) : p.value}
          {p.name === 'Collection %' ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export function AnalyticsPage() {
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))

  const occ     = useOccupancy(month)
  const trend   = useAnalyticsTrend(month)
  const payers  = usePayers(month)
  const rooms   = useRoomAnalytics(month)
  const proj    = useProjection(month)
  const stats   = usePaymentStats(month)

  const trendData = (trend.data ?? []).map(t => ({
    ...t,
    month:      t.monthYear?.slice(5) ?? t.monthYear, // "2026-04" → "04"
    Expected:   t.expected   ?? (t as any).amountDue   ?? 0,
    Collected:  t.collected  ?? (t as any).amountPaid  ?? 0,
    // Calculate rate from actual values — don't rely on backend field
    'Collection %': (() => {
      const exp = t.expected ?? (t as any).amountDue ?? 0
      const col = t.collected ?? (t as any).amountPaid ?? 0
      if (!exp || exp === 0) return 0
      return Math.min(Math.round((col / exp) * 100), 100)
    })(),
  }))

  // Vacancy cost = vacant beds × avg rent per bed
  const avgRent = rooms.data?.bySharingType?.[0]?.rentPerBed ?? 0
  const vacantBeds = occ.data?.vacantBeds ?? 0
  const vacancyCost = vacantBeds * avgRent

  // Collection efficiency
  const collectionRate = stats.data?.collectionRate ?? 0
  const collected      = stats.data?.collected ?? 0
  const expected       = stats.data?.expected ?? 0
  const pending        = expected - collected

  // Growth rate
  const growth = proj.data?.growthRate ?? 0

  // Occupancy donut data
  const donutData = [
    { name: 'Occupied', value: occ.data?.occupiedBeds ?? 0, color: '#10B981' },
    { name: 'Vacant',   value: occ.data?.vacantBeds   ?? 0, color: '#E5E7EB' },
  ]

  // Actionable insights
  const insights: { type: 'good' | 'warn' | 'bad'; text: string }[] = []
  if (collectionRate >= 90) insights.push({ type: 'good', text: `Excellent! ${Math.round(collectionRate)}% collection rate this month.` })
  else if (collectionRate < 70) insights.push({ type: 'bad', text: `Only ${Math.round(collectionRate)}% collected — ${(payers.data?.defaulters ?? []).length} tenants need follow-up.` })
  if (vacantBeds > 0) insights.push({ type: 'warn', text: `${vacantBeds} vacant bed${vacantBeds > 1 ? 's' : ''} losing ${fmtINR(vacancyCost)}/month.` })
  if (growth > 0) insights.push({ type: 'good', text: `Revenue grew ${growth.toFixed(1)}% vs last month.` })
  if (growth < -5) insights.push({ type: 'bad', text: `Revenue dropped ${Math.abs(growth).toFixed(1)}% vs last month.` })
  const overdueCount = stats.data?.overdueCount ?? 0
  if (overdueCount > 0) insights.push({ type: 'bad', text: `${overdueCount} tenant${overdueCount > 1 ? 's' : ''} overdue — send reminders now.` })

  return (
    <div className="space-y-6 pb-24">

      {/* ── Month selector ────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth(m => format(addMonths(new Date(`${m}-01`), -1), 'yyyy-MM'))}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-base font-bold text-textPrimary">{formatMonthYear(month)}</p>
          <p className="text-xs text-textSecondary">Business analytics</p>
        </div>
        <button
          onClick={() => setMonth(m => format(addMonths(new Date(`${m}-01`), 1), 'yyyy-MM'))}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Actionable Insights ───────────────────────────── */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((ins, i) => (
            <div key={i} className={cn(
              'flex items-start gap-2.5 rounded-2xl border px-4 py-3',
              ins.type === 'good' ? 'bg-success/5 border-success/20' :
              ins.type === 'warn' ? 'bg-amber-50 border-amber-200' :
              'bg-danger/5 border-danger/20',
            )}>
              {ins.type === 'good' ? <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" /> :
               ins.type === 'warn' ? <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" /> :
               <AlertTriangle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" />}
              <p className="text-xs font-medium text-textPrimary">{ins.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Revenue KPIs ──────────────────────────────────── */}
      <div>
        <SectionHeader title="Revenue" sub="This month's collection" />
        {stats.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Collection progress bar */}
            <div className="rounded-2xl border border-border bg-surface p-4 mb-3">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-xs text-textSecondary">Collected</p>
                  <p className="text-2xl font-bold text-textPrimary">{fmtINR(collected)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-textSecondary">of {fmtINR(expected)}</p>
                  <p className={cn('text-xl font-bold', collectionRate >= 80 ? 'text-success' : 'text-warning')}>
                    {Math.round(collectionRate)}%
                  </p>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-background overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', collectionRate >= 80 ? 'bg-success' : 'bg-warning')}
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-xs text-textSecondary">{stats.data?.paidCount ?? 0} tenants paid</p>
                <p className="text-xs text-danger font-medium">{fmtINR(pending)} pending</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <KpiCard label="Overdue tenants" value={String(overdueCount)} sub={overdueCount > 0 ? 'Need immediate action' : 'All clear ✓'} icon={<AlertTriangle className="h-4 w-4" />} color={overdueCount > 0 ? 'danger' : 'success'} />
              <KpiCard label="Pending amount" value={fmtShort(pending)} sub="Yet to be collected" icon={<Clock className="h-4 w-4" />} color="warning" />
              <KpiCard label="Next month est." value={fmtShort(proj.data?.projectedNextMonth ?? 0)} sub={`${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% growth`} icon={<TrendingUp className="h-4 w-4" />} color="blue" trend={growth > 0 ? 'up' : growth < 0 ? 'down' : 'flat'} />
              <KpiCard label="Vacancy loss" value={fmtShort(vacancyCost)} sub={`${vacantBeds} beds empty`} icon={<BedDouble className="h-4 w-4" />} color={vacantBeds > 0 ? 'danger' : 'success'} />
            </div>
          </>
        )}
      </div>

      {/* ── 6-Month Trend ─────────────────────────────────── */}
      <div>
        <SectionHeader title="6-month revenue trend" sub="Expected vs collected" />
        {trend.isLoading ? (
          <Skeleton className="h-56 w-full rounded-2xl" />
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E4DE" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => fmtShort(v).replace('₹', '')} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar yAxisId="left" dataKey="Expected"  fill="#E5E4DE" radius={[4,4,0,0]} />
                  <Bar yAxisId="left" dataKey="Collected" fill="#10B981" radius={[4,4,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="Collection %" stroke="#3B82F6" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                <div className="h-2.5 w-2.5 rounded-sm bg-[#E5E4DE]" />Expected
              </div>
              <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                <div className="h-2.5 w-2.5 rounded-sm bg-success" />Collected
              </div>
              <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                <div className="h-0.5 w-4 bg-blue-500" />Collection %
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Occupancy ─────────────────────────────────────── */}
      <div>
        <SectionHeader title="Occupancy" sub="Bed utilization status" />
        {occ.isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : occ.data ? (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-6">
              {/* Donut chart */}
              <div className="relative flex-shrink-0">
                <PieChart width={100} height={100}>
                  <Pie data={donutData} cx={45} cy={45} innerRadius={30} outerRadius={45} dataKey="value" strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-textPrimary">
                    {Math.round(occ.data.occupancyPercent ?? ((occ.data.occupiedBeds / occ.data.totalBeds) * 100))}%
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-textSecondary">Total beds</span>
                  <span className="font-semibold">{occ.data.totalBeds}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-textSecondary">
                    <span className="h-2 w-2 rounded-full bg-success inline-block" />Occupied
                  </span>
                  <span className="font-semibold text-success">{occ.data.occupiedBeds}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-textSecondary">
                    <span className="h-2 w-2 rounded-full bg-gray-200 inline-block" />Vacant
                  </span>
                  <span className="font-semibold text-danger">{occ.data.vacantBeds}</span>
                </div>
                <div className="pt-1 border-t border-border flex justify-between text-xs text-textSecondary">
                  <span className="flex items-center gap-1"><Wind className="h-3 w-3" />{occ.data.acRooms} AC</span>
                  <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" />{occ.data.nonAcRooms} Non-AC</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Room Type Performance ─────────────────────────── */}
      <div>
        <SectionHeader title="Room type performance" sub="Revenue and occupancy by room category" />
        {rooms.isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : (rooms.data?.bySharingType ?? []).length > 0 ? (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="grid grid-cols-5 px-4 py-2.5 bg-surface border-b border-border">
              {['Type', 'AC', 'Rooms', 'Occ %', '₹/bed'].map(h => (
                <p key={h} className="text-[10px] font-semibold text-textSecondary uppercase tracking-wide">{h}</p>
              ))}
            </div>
            {(rooms.data?.bySharingType ?? []).map((r, i) => {
              const occ = Math.round(r.occupancyRate * (r.occupancyRate > 1 ? 1 : 100))
              return (
                <div key={i} className="grid grid-cols-5 px-4 py-3 border-b border-border last:border-0 items-center">
                  <p className="text-sm font-semibold text-textPrimary">{r.sharingType}-share</p>
                  <p className="text-xs">{r.isAc ? '✓' : '–'}</p>
                  <p className="text-sm">{r.roomCount}</p>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: occ >= 80 ? '#10B981' : occ >= 50 ? '#F59E0B' : '#EF4444' }}>
                      {occ}%
                    </p>
                  </div>
                  <p className="text-xs font-medium">{r.rentPerBed ? fmtShort(r.rentPerBed) : '—'}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface px-4 py-6 text-center">
            <p className="text-sm text-textSecondary">No room data available</p>
          </div>
        )}
      </div>

      {/* ── Tenant Analysis ───────────────────────────────── */}
      <div>
        <SectionHeader title="Tenant analysis" sub="Payers and defaulters this month" />
        <div className="grid grid-cols-2 gap-3">
          {/* Top payers */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              </div>
              <p className="text-xs font-bold text-textPrimary">Top Payers</p>
            </div>
            {payers.isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}</div>
            ) : (payers.data?.topPayers ?? []).length === 0 ? (
              <p className="text-xs text-textSecondary">No data yet</p>
            ) : (
              <ul className="space-y-2">
                {(payers.data?.topPayers ?? []).slice(0, 5).map((p, i) => (
                  <li key={p.tenantId} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-textSecondary w-3">{i + 1}</span>
                    <span className="text-xs text-textPrimary font-medium truncate flex-1">{p.tenantName}</span>
                    <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Defaulters */}
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-xl bg-danger/10 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-danger" />
              </div>
              <p className="text-xs font-bold text-textPrimary">Defaulters</p>
            </div>
            {payers.isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-5 w-full" />)}</div>
            ) : (payers.data?.defaulters ?? []).length === 0 ? (
              <p className="text-xs text-success font-medium">All tenants paid ✓</p>
            ) : (
              <ul className="space-y-2">
                {(payers.data?.defaulters ?? []).slice(0, 5).map(p => (
                  <li key={p.tenantId} className="flex items-center justify-between gap-1">
                    <span className="text-xs text-textPrimary font-medium truncate flex-1">{p.tenantName}</span>
                    <span className="text-[10px] font-bold text-danger flex-shrink-0">{p.pendingCount ?? 0}mo</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Revenue Forecast ──────────────────────────────── */}
      <div>
        <SectionHeader title="Revenue forecast" sub="Based on current occupancy and collection trend" />
        {proj.isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : proj.data ? (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] text-textSecondary uppercase tracking-wide font-semibold mb-1">Last Month</p>
                <p className="text-base font-bold text-textPrimary">{fmtShort(proj.data.lastMonthCollected)}</p>
                <p className="text-[10px] text-textSecondary">Collected</p>
              </div>
              <div className="border-x border-border">
                <p className="text-[10px] text-textSecondary uppercase tracking-wide font-semibold mb-1">This Month</p>
                <p className="text-base font-bold text-textPrimary">{fmtShort(proj.data.currentMonthExpected)}</p>
                <p className="text-[10px] text-textSecondary">Expected</p>
              </div>
              <div>
                <p className="text-[10px] text-textSecondary uppercase tracking-wide font-semibold mb-1">Next Month</p>
                <p className="text-base font-bold text-primary">{fmtShort(proj.data.projectedNextMonth)}</p>
                <p className="text-[10px] text-textSecondary">Projected</p>
              </div>
            </div>
            <div className={cn(
              'flex items-center justify-center gap-2 mt-4 rounded-xl py-2',
              growth >= 0 ? 'bg-success/10' : 'bg-danger/10',
            )}>
              {growth >= 0
                ? <TrendingUp className="h-4 w-4 text-success" />
                : <TrendingDown className="h-4 w-4 text-danger" />
              }
              <p className={cn('text-sm font-semibold', growth >= 0 ? 'text-success' : 'text-danger')}>
                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% month-over-month
              </p>
            </div>
          </div>
        ) : null}
      </div>

    </div>
  )
}