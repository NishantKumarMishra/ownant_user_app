import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Upload, Search, Users } from 'lucide-react'
import { TenantRow } from '@/components/tenants/TenantRow'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useTenantSearch, useTenants } from '@/hooks/useTenants'
import { cn } from '@/lib/utils'
import type { TenantListItem } from '@/api/types'

const STATUS_ORDER: Record<string, number> = { OVERDUE: 0, PARTIAL: 1, PENDING: 2, DUE_SOON: 3, PAID: 4, WAIVED: 5 }

function getPaymentOrder(tenant: TenantListItem): number {
  const status = tenant.currentMonthPayment?.status
  if (!status) return 2
  const dueDate = tenant.currentMonthPayment?.dueDate
  if ((status === 'PENDING' || status === 'PARTIAL') && dueDate) {
    if (new Date(dueDate) < new Date()) return STATUS_ORDER['OVERDUE']
  }
  return STATUS_ORDER[status] ?? 2
}

function sortByPaymentStatus(tenants: TenantListItem[]): TenantListItem[] {
  return [...tenants].sort((a, b) => getPaymentOrder(a) - getPaymentOrder(b))
}

function filterByRoomNumber(tenants: TenantListItem[], q: string): TenantListItem[] {
  if (!q) return tenants
  const lower = q.toLowerCase()
  return tenants.filter(t => (t.bed?.roomNumber ?? t.roomNumber ?? '').toLowerCase().includes(lower))
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

  const isRoomSearch = /^(room\s*)?[\d]/i.test(debounced)
  const searchEnabled = debounced.length > 0 && !isRoomSearch
  const searchQuery   = useTenantSearch(debounced, searchEnabled)
  const listQuery     = useTenants({ status, page, size: 100 }, true)

  const rows = useMemo(() => {
    const base = listQuery.data ?? []
    if (isRoomSearch && debounced) return sortByPaymentStatus(filterByRoomNumber(base, debounced))
    if (searchEnabled) return sortByPaymentStatus(searchQuery.data ?? [])
    return sortByPaymentStatus(base)
  }, [isRoomSearch, debounced, searchEnabled, searchQuery.data, listQuery.data])

  const activeCount = useMemo(() => rows.length, [rows])

  return (
    <div className="w-full bg-background min-h-svh pb-28 overflow-x-hidden">
      
      {/* ── Mobile Application Header Spacing Fixed (px-2) ── */}
      <div className="px-2.5 pt-5 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-textPrimary">Tenants Registry</h1>
          <p className="text-xs font-semibold text-textSecondary mt-0.5">
            Total Records: <span className="text-primary font-black">{activeCount} units</span>
          </p>
        </div>
        <Link
          to="/tenants/import"
          className="flex items-center gap-1 px-2.5 h-8 rounded-xl bg-primary/10 text-primary text-xs font-black transition active:scale-95 shadow-sm shadow-primary/5"
        >
          <Upload className="h-3 w-3 stroke-[2.5]" /> Import
        </Link>
      </div>

      {/* ── Premium Search Input Box ── */}
      <div className="mt-1 px-2.5">
        <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-surface px-3 py-2.5 shadow-inner">
          <Search className="h-4 w-4 text-textSecondary shrink-0" />
          <input
            placeholder="Search by tenant name, phone, room..."
            value={q}
            onChange={e => { setQ(e.target.value); setPage(0) }}
            className="flex-1 bg-transparent text-sm font-semibold text-textPrimary placeholder:text-textSecondary outline-none"
          />
          {q && (
            <button onClick={() => { setQ(''); setPage(0) }} className="h-5 w-5 rounded-full bg-border/40 text-textSecondary text-xs font-bold flex items-center justify-center">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Native Segmented Filter iOS/Android Bar ── */}
      <div className="mt-3 px-2.5">
        <div className="flex p-0.5 bg-gray-100 rounded-xl gap-0.5">
          {[
            { label: 'Active',  value: 'ACTIVE'  },
            { label: 'Notice',  value: 'NOTICE'  },
            { label: 'Vacated', value: 'VACATED' },
          ].map(tab => {
            const active = status === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value); setPage(0) }}
                className={cn(
                  'flex-1 text-center py-2 text-xs font-black rounded-lg transition-all duration-150',
                  active 
                    ? 'bg-surface text-primary shadow-sm' 
                    : 'text-textSecondary hover:text-textPrimary'
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Core Rows Container List ── */}
      <div className="mt-3 space-y-1">
        {listQuery.isLoading ? (
          <div className="px-2.5 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="h-12 w-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-3 shadow-inner">
              <Users className="h-5 w-5 text-textSecondary opacity-30" />
            </div>
            <p className="text-sm font-black text-textPrimary">No tenants registered</p>
            <p className="text-xs text-textSecondary mt-1 max-w-[220px] mx-auto">
              {debounced ? 'No results matched the specified query parameters.' : 'Onboard your active residents to monitor invoicing details.'}
            </p>
            {status === 'ACTIVE' && !debounced && (
              <div className="mt-5 flex flex-col items-center gap-2">
                <Button className="rounded-xl h-10 px-5 text-xs font-bold" onClick={() => navigate('/tenants/add')}>Add New Tenant</Button>
                <Link to="/tenants/import" className="text-xs text-primary font-black hover:underline mt-1">
                  Excel Bulk Data Import →
                </Link>
              </div>
            )}
          </div>
        ) : (
          rows.map(t => <TenantRow key={t.id} tenant={t} />)
        )}

        {/* Load more page control splits */}
        {!debounced && rows.length >= 100 && (
          <div className="px-2.5 pt-1">
            <Button variant="secondary" className="w-full h-11 rounded-xl text-xs font-bold" onClick={() => setPage(p => p + 1)}>
              Fetch next page datasets
            </Button>
          </div>
        )}
      </div>

      {/* ── Action Floating FAB Button ── */}
      <Link
        to="/tenants/add"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-xl border border-white/10 transition transform active:scale-90"
        aria-label="Add tenant"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </Link>
    </div>
  )
}