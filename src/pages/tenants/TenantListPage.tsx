import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { TenantRow } from '@/components/tenants/TenantRow'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
//import { EmptyState } from '@/components/ui/EmptyState'
import { useTenantSearch, useTenants } from '@/hooks/useTenants'
//import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export function TenantListPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 300)
    return () => window.clearTimeout(t)
  }, [q])

  const searchEnabled = debounced.length > 0
  const searchQuery = useTenantSearch(debounced, searchEnabled)
  const listQuery = useTenants({ status, page, size: 20 }, !searchEnabled)

  const rows = useMemo(() => {
    if (searchEnabled) return searchQuery.data ?? []
    return listQuery.data ?? []
  }, [searchEnabled, searchQuery.data, listQuery.data])

  const loading = searchEnabled ? searchQuery.isLoading : listQuery.isLoading

  return (
  <div className="min-h-svh pb-24">
    {/* Header */}
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-textPrimary">
        Tenants
      </h1>

      <p className="mt-1 text-sm text-textSecondary">
        Manage and track all tenants
      </p>
    </div>

    {/* Search */}
    <div className="mt-4 px-4">
      <div className="relative">
        <Input
          placeholder="Search by name or room..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(0)
          }}
          className="h-11 rounded-xl"
        />
      </div>
    </div>

    {/* Filters (Converted Tabs → Figma pills) */}
    <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
      {[
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Notice', value: 'NOTICE' },
        { label: 'Vacated', value: 'VACATED' },
      ].map((tab) => (
        <button
          key={tab.value}
          onClick={() => {
            setStatus(tab.value)
            setPage(0)
          }}
          className={cn(
            'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition',
            status === tab.value
              ? 'bg-primary text-white'
              : 'bg-surface text-textSecondary shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* Content */}
    <div className="mt-4 px-4">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-textSecondary">
            No tenants found
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate('/tenants/add')}
          >
            Add Tenant
          </Button>
        </div>
      ) : (
       <div className="space-y-2 px-1">
  {rows.map((t) => (
    <TenantRow key={t.id} tenant={t} />
  ))}
</div>
      )}

      {/* Pagination */}
      {!searchEnabled && rows.length >= 20 ? (
        <Button
          variant="secondary"
          className="mt-4 w-full"
          onClick={() => setPage((p) => p + 1)}
        >
          Load more
        </Button>
      ) : null}
    </div>

    {/* Floating Add Button */}
    <Link
      to="/tenants/add"
      className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg lg:bottom-8"
    >
      <Plus className="h-7 w-7" />
    </Link>
  </div>
)
}
