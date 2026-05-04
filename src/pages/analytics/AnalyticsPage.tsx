{/* ============================= */}
{/* FIXED AnalyticsPage.tsx */}
{/* Old code commented + New code added */}
{/* ============================= */}

import { useState } from 'react'
import { addMonths, format } from 'date-fns'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useOccupancy,
  useAnalyticsTrend,
  usePayers,
  useRoomAnalytics,
  useProjection,
} from '@/hooks/useAnalytics'
import { formatCurrency, formatMonthYear } from '@/lib/format'
import { Check, TrendingUp } from 'lucide-react'

export function AnalyticsPage() {
  const [month, setMonth] = useState(() =>
    format(new Date(), 'yyyy-MM')
  )

  const occ = useOccupancy(month)
  const trend = useAnalyticsTrend(month)
  const payers = usePayers(month)
  const rooms = useRoomAnalytics(month)
  const proj = useProjection(month)

  const pct = occ.data?.occupancyPercent ?? 0

  /**
   * ============================================
   * FIX 1: Backend sends monthYear not month
   *
   * OLD:
   * trend.data => month
   *
   * NEW:
   * map monthYear → month
   * ============================================
   */
  const trendData =
    (trend.data ?? []).map((t) => ({
      ...t,
      month: t.monthYear,
    }))

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-2 text-sm"
          onClick={() =>
            setMonth((m) =>
              format(
                addMonths(new Date(`${m}-01`), -1),
                'yyyy-MM'
              )
            )
          }
        >
          ‹
        </button>

        <p className="text-sm font-semibold">
          {formatMonthYear(month)}
        </p>

        <button
          type="button"
          className="rounded-lg border border-border px-3 py-2 text-sm"
          onClick={() =>
            setMonth((m) =>
              format(
                addMonths(new Date(`${m}-01`), 1),
                'yyyy-MM'
              )
            )
          }
        >
          ›
        </button>
      </div>

      {/* ================= OCCUPANCY ================= */}

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-textPrimary">
          Occupancy
        </h2>

        {occ.isLoading ? (
          <Skeleton className="mt-4 h-40 w-full" />
        ) : occ.data ? (
          <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:items-start">
            <div className="relative h-36 w-36">
              <svg
                viewBox="0 0 36 36"
                className="h-36 w-36 -rotate-90"
              >
                <path
                  className="text-border"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />

                <path
                  className="text-primary"
                  strokeDasharray={`${pct}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-textPrimary">
                  {Math.round(pct)}%
                </span>

                <span className="text-xs text-textSecondary">
                  occupied
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-1 text-sm text-textSecondary">
              <p>
                Beds: {occ.data.occupiedBeds}/
                {occ.data.totalBeds} occupied ·{' '}
                {occ.data.vacantBeds} vacant
              </p>

              <p>
                Rooms: {occ.data.acRooms} AC ·{' '}
                {occ.data.nonAcRooms} Non-AC
              </p>
            </div>
          </div>
        ) : null}
      </Card>

      {/* ================= TREND ================= */}

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-textPrimary">
          6-month trend
        </h2>

        {trend.isLoading ? (
          <Skeleton className="mt-4 h-64 w-full" />
        ) : (
          <div className="mt-4 h-64">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              {/*
                OLD:
                <ComposedChart data={trend.data ?? []}>

                NEW:
                use mapped trendData
              */}
              <ComposedChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E4DE"
                />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  domain={[0, 100]}
                />

                <Tooltip />
                <Legend />

                <Bar
                  yAxisId="left"
                  dataKey="expected"
                  name="Expected"
                  fill="#D1D0C8"
                />

                <Bar
                  yAxisId="left"
                  dataKey="collected"
                  name="Collected"
                  fill="#0F6E56"
                />

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="collectionRate"
                  name="Collection %"
                  stroke="#185FA5"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ================= PAYERS ================= */}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-textPrimary">
            Top payers
          </h3>

          <ul className="mt-2 space-y-2 text-sm">
            {(payers.data?.topPayers ?? []).map((p) => (
              <li
                key={p.tenantId}
                className="flex items-center justify-between"
              >
                {/*
                  OLD:
                  <span>{p.name}</span>

                  NEW:
                  backend sends tenantName
                */}
                <span>{p.tenantName}</span>

                <Check className="h-4 w-4 text-success" />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-textPrimary">
            Defaulters
          </h3>

          <ul className="mt-2 space-y-2 text-sm">
            {(payers.data?.defaulters ?? []).map((p) => (
              <li
                key={p.tenantId}
                className="flex items-center justify-between"
              >
                {/* OLD: p.name */}
                <span>{p.tenantName}</span>

                <span className="text-danger">
                  {p.pendingCount ?? 0} pending
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ================= ROOM BREAKDOWN ================= */}

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-textPrimary">
          Room breakdown
        </h3>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-textTertiary">
                <th className="py-2">Sharing</th>
                <th>AC</th>
                <th>Rooms</th>
                <th>Beds</th>
                <th>Occ %</th>
              </tr>
            </thead>

            <tbody>
              {/*
                =====================================
                BIGGEST FIX

                OLD:
                (rooms.data ?? []).map(...)

                WRONG because backend sends:
                {
                  totalRooms,
                  bySharingType:[]
                }

                NEW:
                rooms.data.bySharingType
                =====================================
              */}
              {(rooms.data?.bySharingType ?? []).map((r, i) => (
                <tr
                  key={i}
                  className="border-t border-border"
                >
                  <td className="py-2">
                    {r.sharingType}
                  </td>

                  <td>{r.isAc ? 'Yes' : 'No'}</td>

                  {/*
                    OLD:
                    r.numberOfRooms

                    NEW:
                    backend sends roomCount
                  */}
                  <td>{r.roomCount}</td>

                  <td>{r.totalBeds}</td>

                  <td>
                    {Math.round(r.occupancyRate)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ================= REVENUE PROJECTION ================= */}

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-textPrimary">
          Revenue projection
        </h3>

        {proj.isLoading ? (
          <Skeleton className="mt-3 h-20 w-full" />
        ) : proj.data ? (
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {/*
              OLD:
              thisMonthExpected
              nextMonthProjected

              NEW:
              currentMonthExpected
              projectedNextMonth
            */}

            <p>
              This month expected:{' '}
              {formatCurrency(
                proj.data.currentMonthExpected
              )}
            </p>

            <p>
              Last month collected:{' '}
              {formatCurrency(
                proj.data.lastMonthCollected
              )}
            </p>

            <p>
              Next month projected:{' '}
              {formatCurrency(
                proj.data.projectedNextMonth
              )}
            </p>

            <p className="flex items-center gap-1 font-semibold text-primary">
              <TrendingUp className="h-4 w-4" />
              Growth {proj.data.growthRate.toFixed(1)}%
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  )
}