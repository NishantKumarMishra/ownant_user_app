import { useState } from 'react'
import { Phone, MessageCircle, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TenantListItem } from '@/api/types'
import { useVacateTenant } from '@/hooks/useTenants'
import { cn } from '@/lib/utils'
import { differenceInDays, parseISO, format } from 'date-fns'
import toast from 'react-hot-toast'
import { handleApiError } from '@/lib/apiError'

// ── Helpers ───────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-blue-100',    text: 'text-blue-700'    },
  { bg: 'bg-violet-100',  text: 'text-violet-700'  },
  { bg: 'bg-amber-100',   text: 'text-amber-700'   },
  { bg: 'bg-rose-100',    text: 'text-rose-700'    },
  { bg: 'bg-cyan-100',    text: 'text-cyan-700'    },
]

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ── Payment status badge ──────────────────────────────────────
type PaymentStatus = 'PAID' | 'DUE_SOON' | 'OVERDUE' | 'PENDING' | null

function PaymentBadge({ status }: { status: PaymentStatus }) {
  if (!status) return null
  if (status === 'PAID')     return <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">Paid</span>
  if (status === 'DUE_SOON') return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">Due Soon</span>
  if (status === 'OVERDUE')  return <span className="inline-flex items-center rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">Overdue</span>
  return <span className="inline-flex items-center rounded-full bg-surface border border-border px-2.5 py-0.5 text-xs font-semibold text-textSecondary">Pending</span>
}

// ── Days remaining badge for notice tenants ───────────────────
function DaysRemainingBadge({ moveOutDate }: { moveOutDate: string }) {
  const days = differenceInDays(parseISO(moveOutDate), new Date())

  if (days < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
        Overdue by {Math.abs(days)}d
      </span>
    )
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
        Vacating today
      </span>
    )
  }
  if (days <= 3) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
        {days}d left
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
      {days}d left
    </span>
  )
}

// ── Vacate confirm modal ──────────────────────────────────────
function VacateModal({
  tenant,
  onClose,
}: {
  tenant: TenantListItem
  onClose: () => void
}) {
  const vacate = useVacateTenant()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const handleVacate = async () => {
    try {
      await vacate.mutateAsync({ id: tenant.id, moveOutDate: date })
      toast.success(`${tenant.name} vacated successfully`)
      onClose()
    } catch (e) {
      handleApiError(e)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl border-t border-border bg-surface p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-1 h-1 w-10 rounded-full bg-border mx-auto" />
        <h3 className="mt-4 text-base font-bold text-textPrimary">
          Vacate {tenant.name}?
        </h3>
        <p className="mt-1 text-sm text-textSecondary">
          This will free the bed and mark the tenant as vacated.
        </p>

        <div className="mt-5">
          <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide">
            Move-out date
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-textPrimary outline-none focus:border-primary"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-textSecondary hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleVacate}
            disabled={vacate.isPending}
            className="flex-1 rounded-xl bg-danger py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {vacate.isPending ? 'Vacating…' : 'Confirm Vacate'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export function TenantRow({ tenant }: { tenant: TenantListItem }) {
  const color = avatarColor(tenant.name)
  const [showVacateModal, setShowVacateModal] = useState(false)

  const isNotice  = tenant.status === 'NOTICE'
  const isVacated = tenant.status === 'VACATED'

  // Room + bed info
  const roomNumber = tenant.bed?.roomNumber ?? tenant.roomNumber
  const bedLabel   = tenant.bed?.bedLabel   ?? tenant.bedLabel
  const moveOutDate = (tenant as any).moveOutDate as string | undefined

  const roomLine = [
    roomNumber ? `Room ${roomNumber}` : null,
    bedLabel   ? `Bed ${bedLabel}`   : null,
  ].filter(Boolean).join(' • ')

  // Payment status
  const paymentStatus: PaymentStatus = (() => {
    const cp = (tenant as any).currentPaymentStatus
                ?? tenant.currentMonthPayment?.status
    if (!cp) return null
    if (cp === 'PAID' || cp === 'WAIVED') return 'PAID'
    const dueDate = tenant.currentMonthPayment?.dueDate
    if ((cp === 'PENDING' || cp === 'PARTIAL') && dueDate) {
      const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000)
      if (days < 0)  return 'OVERDUE'
      if (days <= 2) return 'DUE_SOON'
    }
    return 'PENDING'
  })()

  const daysOverdue = (() => {
    const dueDate = tenant.currentMonthPayment?.dueDate
    if (!dueDate) return null
    const days = Math.ceil((Date.now() - new Date(dueDate).getTime()) / 86_400_000)
    return days > 0 && paymentStatus === 'OVERDUE' ? days : null
  })()

  return (
    <>
      <div className={cn(
        'flex items-center gap-3 rounded-2xl border bg-surface px-3 py-3.5 mx-4',
        isNotice ? 'border-amber-200 bg-amber-50/30' : 'border-border',
        isVacated && 'opacity-60',
      )}>

        {/* Avatar */}
        <Link to={`/tenants/${tenant.id}`} className="flex-shrink-0">
          <div className={cn(
            'h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-bold',
            color.bg, color.text,
          )}>
            {initials(tenant.name)}
          </div>
        </Link>

        {/* Info */}
        <Link to={`/tenants/${tenant.id}`} className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-textPrimary truncate">{tenant.name}</p>

          {/* Notice tenants — show move-out date + days remaining */}
          {isNotice && moveOutDate ? (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <p className="text-xs text-textSecondary">
                {roomLine || '—'} · Out {format(parseISO(moveOutDate), 'dd MMM')}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <p className="text-xs text-textSecondary">{roomLine || '—'}</p>
              {daysOverdue && (
                <>
                  <span className="text-xs text-textSecondary">•</span>
                  <span className="text-xs font-semibold text-danger">{daysOverdue}d overdue</span>
                </>
              )}
            </div>
          )}
        </Link>

        {/* Right side */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {/* Notice — days remaining badge */}
          {isNotice && moveOutDate ? (
            <DaysRemainingBadge moveOutDate={moveOutDate} />
          ) : (
            <>
              {tenant.monthlyRent != null && (
                <span className="text-sm font-bold text-textPrimary">
                  ₹{tenant.monthlyRent.toLocaleString('en-IN')}
                </span>
              )}
              <PaymentBadge status={paymentStatus} />
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-1">
          {tenant.phone && (
            <a
              href={`tel:${tenant.phone}`}
              onClick={e => e.stopPropagation()}
              className="h-8 w-8 rounded-xl bg-surface border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-textSecondary" />
            </a>
          )}

          {/* Notice tenants — show vacate button instead of WhatsApp */}
          {isNotice ? (
            <button
              onClick={e => { e.stopPropagation(); setShowVacateModal(true) }}
              className="h-8 w-8 rounded-xl bg-danger/10 flex items-center justify-center hover:bg-danger/20 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 text-danger" />
            </button>
          ) : (
            tenant.phone && (
              <a
                href={`https://wa.me/91${tenant.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="h-8 w-8 rounded-xl bg-successLight flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <MessageCircle className="h-3.5 w-3.5 text-success" />
              </a>
            )
          )}
        </div>
      </div>

      {/* Vacate modal */}
      {showVacateModal && (
        <VacateModal tenant={tenant} onClose={() => setShowVacateModal(false)} />
      )}
    </>
  )
}