import { Link } from 'react-router-dom'
import type { TenantListItem } from '@/api/types'
import { Badge } from '@/components/ui/Badge'


function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TenantRow({ tenant }: { tenant: TenantListItem }) {
  return (
    <Link
      to={`/tenants/${tenant.id}`}
      className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition hover:bg-primary/5"
    >
      {/* Avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E7EFEC] text-sm font-semibold text-primary">
        {initials(tenant.name)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Top Row */}
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-textPrimary">
            {tenant.name}
          </p>

          <Badge
            variant={
              tenant.status === 'ACTIVE'
                ? 'success'
                : tenant.status === 'NOTICE'
                ? 'warning'
                : 'secondary'
            }
          >
            {tenant.status}
          </Badge>
        </div>

        {/* Room + Rent */}
        <p className="mt-1 truncate text-xs text-textSecondary">
          {tenant.roomNumber ? `Room ${tenant.roomNumber}` : '—'}
          {tenant.bedLabel ? ` • Bed ${tenant.bedLabel}` : ''}
          {tenant.monthlyRent != null
            ? ` • ₹ ${tenant.monthlyRent.toLocaleString('en-IN')}`
            : ''}
        </p>

        {/* Phone */}
        <p className="mt-0.5 text-xs text-textTertiary">
          {tenant.phone}
        </p>
      </div>
    </Link>
  )
}