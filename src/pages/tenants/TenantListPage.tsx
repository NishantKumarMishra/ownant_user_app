import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Upload, Search } from 'lucide-react'
import { TenantRow } from '@/components/tenants/TenantRow'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useTenantSearch, useTenants } from '@/hooks/useTenants'
import { cn } from '@/lib/utils'
import type { TenantListItem } from '@/api/types'

// Payment status sort order — Overdue first, then Due Soon, Pending, Paid
const STATUS_ORDER: Record<string, number> = {
  OVERDUE:  0,
  PARTIAL:  1,
  PENDING:  2,
  DUE_SOON: 3,
  PAID:     4,
  WAIVED:   5,
}

function getPaymentOrder(tenant: TenantListItem): number {
  const status = tenant.currentMonthPayment?.status
  if (!status) return 2 // treat as PENDING

  // Check if overdue
  const dueDate = tenant.currentMonthPayment?.dueDate
  if ((status === 'PENDING' || status === 'PARTIAL') && dueDate) {
    const isOverdue = new Date(dueDate) < new Date()
    if (isOverdue) return STATUS_ORDER['OVERDUE']
  }

  return STATUS_ORDER[status] ?? 2
}

function sortByPaymentStatus(tenants: TenantListItem[]): TenantListItem[] {
  return [...tenants].sort((a, b) => getPaymentOrder(a) - getPaymentOrder(b))
}

// Client-side room number search filter
function filterByRoomNumber(tenants: TenantListItem[], q: string): TenantListItem[] {
  if (!q) return tenants
  const lower = q.toLowerCase()
  return tenants.filter(t => {
    const room = (t.bed?.roomNumber ?? t.roomNumber ?? '').toLowerCase()
    return room.includes(lower)
  })
}

export function TenantListPage() {
  const navigate = useNavigate()
  const [q, setQ]               = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus]     = useState('ACTIVE')
  const [page, setPage]         = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 300)
    return () => window.clearTimeout(t)
  }, [q])

  // Check if query looks like a room number (starts with digit or "room")
  const isRoomSearch = /^(room\s*)?[\d]/i.test(debounced)

  const searchEnabled = debounced.length > 0 && !isRoomSearch
  const searchQuery   = useTenantSearch(debounced, searchEnabled)
  const listQuery     = useTenants({ status, page, size: 100 }, true)

  const rows = useMemo(() => {
    const base = listQuery.data ?? []

    // Room number search — client side filter
    if (isRoomSearch && debounced) {
      const filtered = filterByRoomNumber(base, debounced)
      return sortByPaymentStatus(filtered)
    }

    // Name/phone search — backend search
    if (searchEnabled) {
      return sortByPaymentStatus(searchQuery.data ?? [])
    }

    // Default list — sorted by payment status
    return sortByPaymentStatus(base)
  }, [isRoomSearch, debounced, searchEnabled, searchQuery.data, listQuery.data])

  const loading = listQuery.isLoading

  const TABS = [
    { label: 'Active',  value: 'ACTIVE'  },
    { label: 'Notice',  value: 'NOTICE'  },
    { label: 'Vacated', value: 'VACATED' },
  ]

  return (
    <div className="min-h-svh pb-24">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-4 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-textPrimary">Tenants</h1>
            <p className="mt-0.5 text-sm text-textSecondary">
              Manage and track all tenants
            </p>
          </div>
          <Link
            to="/tenants/import"
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-primary/50 bg-primaryLight px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Link>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="mt-4 px-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3">
          <Search className="h-4 w-4 text-textSecondary flex-shrink-0" />
          <input
            placeholder="Search by name, phone or room..."
            value={q}
            onChange={e => { setQ(e.target.value); setPage(0) }}
            className="flex-1 bg-transparent text-sm text-textPrimary placeholder:text-textSecondary outline-none"
          />
          {q && (
            <button
              onClick={() => { setQ(''); setPage(0) }}
              className="text-xs text-textSecondary hover:text-textPrimary"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Status tabs ─────────────────────────────────────── */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(0) }}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              status === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-textSecondary border border-border hover:border-primary/30',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── List ───────────────────────────────────────────── */}
      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="px-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="h-14 w-14 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-textSecondary opacity-40" />
            </div>
            <p className="text-sm font-medium text-textPrimary">No tenants found</p>
            <p className="text-xs text-textSecondary mt-1">
              {debounced ? 'Try a different name, phone or room number' : 'Add your first tenant to get started'}
            </p>
            {status === 'ACTIVE' && !debounced && (
              <div className="mt-5 flex flex-col items-center gap-2">
                <Button onClick={() => navigate('/tenants/add')}>Add Tenant</Button>
                <Link to="/tenants/import" className="text-xs text-primary font-medium hover:underline">
                  Or import from Excel →
                </Link>
              </div>
            )}
          </div>
        ) : (
          rows.map(t => <TenantRow key={t.id} tenant={t} />)
        )}

        {/* Load more */}
        {!debounced && rows.length >= 100 && (
          <div className="px-4">
            <Button
              variant="secondary"
              className="mt-2 w-full rounded-2xl"
              onClick={() => setPage(p => p + 1)}
            >
              Load more
            </Button>
          </div>
        )}
      </div>

      {/* ── FAB ─────────────────────────────────────────────── */}
      <Link
        to="/tenants/add"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg lg:bottom-8"
      >
        <Plus className="h-7 w-7" />
      </Link>
    </div>
  )
}