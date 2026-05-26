// src/components/checkin/PendingCheckins.tsx
// Drop into DashboardPage with: <PendingCheckins />
// Shows all tenants who haven't completed digital checkin

import { Link } from 'react-router-dom'
import { FileText, ChevronRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTenants } from '@/hooks/useTenants'
import { useCheckinDetail } from '@/hooks/useCheckin'
import { Skeleton } from '@/components/ui/Skeleton'

// Per-tenant checkin status row
function TenantCheckinRow({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const { data: checkin, isLoading, isError } = useCheckinDetail(tenantId)

  if (isLoading) return (
    <div className="flex items-center gap-3 py-2">
      <Skeleton className="h-8 w-8 rounded-xl" />
      <Skeleton className="h-4 flex-1" />
    </div>
  )

  // No checkin at all
  const status = isError || !checkin ? 'NOT_STARTED' : checkin.status
  const statusConfig = {
    NOT_STARTED: { label: 'Not started', color: 'text-textMuted', bg: 'bg-border/50' },
    PENDING:     { label: 'Invite sent', color: 'text-amber-600', bg: 'bg-amber-50' },
    KYC_DONE:   { label: 'KYC done',    color: 'text-blue-600',  bg: 'bg-blue-50' },
    COMPLETED:  { label: 'Completed',   color: 'text-success',   bg: 'bg-success/10' },
  }[status] ?? { label: status, color: 'text-textMuted', bg: 'bg-border' }

  // Don't show completed tenants
  if (status === 'COMPLETED') return null

  return (
    <Link
      to={`/tenants/${tenantId}`}
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-surface2 transition-colors"
    >
      <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0', statusConfig.bg)}>
        <FileText className={cn('h-4 w-4', statusConfig.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-textPrimary truncate">{tenantName}</p>
        <p className={cn('text-xs', statusConfig.color)}>{statusConfig.label}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-textMuted flex-shrink-0" />
    </Link>
  )
}

export function PendingCheckins() {
  const { data: tenants = [], isLoading } = useTenants({ status: 'ACTIVE', size: 50 })

  if (isLoading) return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <Skeleton className="h-5 w-40" />
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
    </div>
  )

  if (!tenants.length) return null

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-textPrimary">Checkin Status</h2>
        </div>
        <span className="text-xs text-textSecondary">{tenants.length} tenants</span>
      </div>

      {/* Tenant rows */}
      <div className="p-2">
        {tenants.map(t => (
          <TenantCheckinRow
            key={t.id}
            tenantId={t.id}
            tenantName={t.name}
          />
        ))}
      </div>
    </div>
  )
}