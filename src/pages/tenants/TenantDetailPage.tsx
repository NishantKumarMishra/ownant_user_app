import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Phone, MessageCircle, ChevronDown, ChevronLeft,
  BedDouble, Calendar, IndianRupee, User, Bell,
  Wind, Thermometer, AlertTriangle, CheckCircle2,
  Clock, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTenant, useNoticeTenant, useVacateTenant } from '@/hooks/useTenants'
import { useTenantPayments, useMarkPaid } from '@/hooks/usePayments'
import { useTenantNotificationLogs, useSendReminder } from '@/hooks/useNotifications'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { handleApiError } from '@/lib/apiError'
import * as Collapsible from '@radix-ui/react-collapsible'
import { useQueryClient } from '@tanstack/react-query'
import { differenceInDays, parseISO, format } from 'date-fns'
import type { PaymentItem } from '@/api/types'
import { CheckinStatusCard } from '@/components/checkin/CheckinStatusCard'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-sky-500',
]
function avatarGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ── Status config ─────────────────────────────────────────────
function statusConfig(status: string) {
  switch (status) {
    case 'ACTIVE':  return { label: 'Active',  bg: 'bg-success/10',  text: 'text-success',  dot: 'bg-success'  }
    case 'NOTICE':  return { label: 'Notice',  bg: 'bg-amber-50',    text: 'text-amber-600', dot: 'bg-amber-500' }
    case 'VACATED': return { label: 'Vacated', bg: 'bg-gray-100',    text: 'text-gray-500',  dot: 'bg-gray-400' }
    default:        return { label: status,    bg: 'bg-surface',     text: 'text-textSecondary', dot: 'bg-border' }
  }
}

// ── Payment status pill ───────────────────────────────────────
function PaymentPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID:    'bg-success/10 text-success',
    PARTIAL: 'bg-blue-50 text-blue-600',
    PENDING: 'bg-amber-50 text-amber-600',
    WAIVED:  'bg-gray-100 text-gray-500',
    OVERDUE: 'bg-danger/10 text-danger',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', map[status] ?? 'bg-surface text-textSecondary')}>
      {status}
    </span>
  )
}

// ── Info row ──────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="h-8 w-8 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 text-textSecondary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-textSecondary">{label}</p>
        <p className="text-sm font-medium text-textPrimary mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export function TenantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: t, isLoading } = useTenant(id)
  const payments = useTenantPayments(id)
  const logs     = useTenantNotificationLogs(id)

  const notice      = useNoticeTenant()
  const vacate      = useVacateTenant()
  const sendReminder = useSendReminder()
  const markPaid    = useMarkPaid()

  const [paidSheet, setPaidSheet]   = useState<PaymentItem | null>(null)
  const [vacateOpen, setVacateOpen] = useState(false)
  const [vacateDate, setVacateDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [amountPaid, setAmountPaid] = useState(0)
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [logsOpen, setLogsOpen] = useState(false)

  if (isLoading || !t) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    )
  }

  const isActive  = t.status === 'ACTIVE'
  const isNotice  = t.status === 'NOTICE'
  const sc        = statusConfig(t.status)
  const gradient  = avatarGradient(t.name)

  // Days on notice
  const noticeDays = isNotice && (t as any).moveOutDate
    ? differenceInDays(parseISO((t as any).moveOutDate), new Date())
    : null

  const openMarkPaid = (p: PaymentItem) => {
    setPaidSheet(p)
    setAmountPaid(p.amountDue - (p.amountPaid ?? 0))
    setPaidAt(new Date().toISOString().slice(0, 10))
    setPaymentMode('CASH')
    setReferenceNumber('')
  }

  const onMarkPaid = async () => {
    if (!paidSheet) return
    const prev = qc.getQueryData<PaymentItem[]>(['payments', 'tenant', id])
    qc.setQueryData<PaymentItem[]>(['payments', 'tenant', id], old =>
      (old ?? []).map(x => x.id === paidSheet.id
        ? { ...x, status: 'PAID', amountPaid, paidAt: `${paidAt}T00:00:00` } : x))
    try {
      await markPaid.mutateAsync({
        id: paidSheet.id, amountPaid, paymentMode,
        referenceNumber: ['UPI','BANK_TRANSFER','CHEQUE'].includes(paymentMode) ? referenceNumber : undefined,
        paidAt,
      })
      toast.success('Payment recorded')
      setPaidSheet(null)
    } catch (e) {
      if (prev) qc.setQueryData(['payments', 'tenant', id], prev)
      handleApiError(e)
    }
  }

  return (
    <div className="pb-40">

      {/* ── Hero section ──────────────────────────────────── */}
      <div className="relative px-4 pt-4 pb-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm text-textSecondary hover:text-textPrimary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          <div className={cn(
            'h-20 w-20 rounded-3xl bg-gradient-to-br flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg',
            gradient,
          )}>
            {initials(t.name)}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-textPrimary leading-tight">{t.name}</h1>

            {/* Status badge */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', sc.bg, sc.text)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
                {sc.label}
              </span>

              {/* Notice countdown */}
              {isNotice && noticeDays !== null && (
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                  noticeDays <= 3 ? 'bg-danger/10 text-danger' : 'bg-amber-50 text-amber-600',
                )}>
                  <Clock className="h-3 w-3" />
                  {noticeDays <= 0 ? 'Overdue' : `${noticeDays}d left`}
                </span>
              )}
            </div>

            {/* Contact */}
            <a href={`tel:${t.phone}`} className="mt-2 flex items-center gap-1.5 text-sm text-primary font-medium">
              <Phone className="h-3.5 w-3.5" />
              {t.phone}
            </a>
          </div>
        </div>

        {/* Quick actions — call + WhatsApp */}
        <div className="flex gap-3 mt-5">
          <a
            href={`tel:${t.phone}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-sm font-medium text-textPrimary hover:border-primary/30 transition-colors"
          >
            <Phone className="h-4 w-4 text-textSecondary" />
            Call
          </a>
          <a
            href={`https://wa.me/91${t.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 py-3 text-sm font-medium text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>

      {/* ── Bed card ──────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BedDouble className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-textPrimary">
                  Room {t.bed?.roomNumber ?? '—'} · Bed {t.bed?.bedLabel ?? '—'}
                </p>
                <p className="text-xs text-textSecondary mt-0.5">
                  {t.bed?.sharingType ?? '—'}-sharing
                </p>
              </div>
            </div>
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
              t.bed?.isAc
                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                : 'bg-amber-50 text-amber-600 border border-amber-100',
            )}>
              {t.bed?.isAc
                ? <><Wind className="h-3 w-3" />AC</>
                : <><Thermometer className="h-3 w-3" />Non-AC</>
              }
            </span>
          </div>
        </div>
      </div>

      {/* ── Tenant info ───────────────────────────────────── */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl border border-border bg-surface px-4 py-1">
          <InfoRow icon={<IndianRupee className="h-4 w-4" />}  label="Monthly Rent"   value={t.monthlyRent != null ? formatCurrency(t.monthlyRent) : null} />
          <InfoRow icon={<Calendar className="h-4 w-4" />}     label="Move-in Date"   value={t.moveInDate ? formatDate(t.moveInDate) : null} />
          <InfoRow icon={<Clock className="h-4 w-4" />}        label="Due Day"        value={t.dueDay ? `${t.dueDay}th of every month` : null} />
          <InfoRow icon={<User className="h-4 w-4" />}         label="Occupation"     value={t.occupation ?? null} />
          <InfoRow icon={<FileText className="h-4 w-4" />}     label="Company"        value={t.company ?? null} />
          <InfoRow icon={<Phone className="h-4 w-4" />}        label="Emergency"      value={t.emergencyName ? `${t.emergencyName}${t.emergencyPhone ? ' · ' + t.emergencyPhone : ''}` : null} />
        </div>
      </div>

      {/* ── Payments ──────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <h2 className="text-sm font-semibold text-textPrimary mb-3">Payment history</h2>

        {payments.isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : (payments.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-4 py-6 text-center">
            <p className="text-sm text-textSecondary">No payments yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(payments.data ?? []).map(p => {
              const isUnpaid = p.status === 'PENDING' || p.status === 'OVERDUE' || p.status === 'PARTIAL'
              return (
                <div
                  key={p.id}
                  className={cn(
                    'rounded-2xl border bg-surface px-4 py-3.5',
                    isUnpaid ? 'border-amber-200' : 'border-border',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-textPrimary">{p.monthYear}</p>
                        <PaymentPill status={p.status} />
                      </div>
                      <p className="text-xs text-textSecondary mt-0.5">
                        Due {p.dueDate ? formatDate(p.dueDate) : '—'} · {formatCurrency(p.amountDue)}
                      </p>
                    </div>
                    {isUnpaid && isActive && (
                      <button
                        onClick={() => openMarkPaid(p)}
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="px-4 mb-4">
  <CheckinStatusCard tenantId={t.id} />
</div>

      {/* ── Notification logs ─────────────────────────────── */}
      <div className="px-4 mb-4">
        <Collapsible.Root open={logsOpen} onOpenChange={setLogsOpen}>
          <Collapsible.Trigger className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm font-semibold text-textPrimary">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-textSecondary" />
              Notification logs
            </div>
            <ChevronDown className={cn('h-4 w-4 text-textSecondary transition-transform', logsOpen && 'rotate-180')} />
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="mt-2 rounded-2xl border border-border bg-surface divide-y divide-border">
              {(logs.data ?? []).length === 0 ? (
                <p className="px-4 py-4 text-sm text-textSecondary text-center">No logs yet</p>
              ) : (logs.data ?? []).map(l => (
                <div key={l.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-textPrimary">
                      {l.type?.replace(/_/g, ' ') ?? 'Notification'}
                    </p>
                    <p className="text-xs text-textSecondary mt-0.5">
                      {l.sentAt ? format(parseISO(l.sentAt), 'dd MMM yyyy · hh:mm a') : '—'}
                    </p>
                  </div>
                  <span className={cn(
                    'text-xs font-semibold rounded-full px-2 py-0.5',
                    l.status === 'SENT'   ? 'bg-success/10 text-success'  : '',
                    l.status === 'FAILED' ? 'bg-danger/10 text-danger'   : '',
                    l.status === 'PENDING'? 'bg-amber-50 text-amber-600' : '',
                  )}>
                    {l.status ?? 'SENT'}
                  </span>
                </div>
              ))}
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>

      {/* ── Fixed action bar ──────────────────────────────── */}
      {isActive && (
        <div className="fixed bottom-20 left-0 right-0 border-t border-border bg-surface/95 backdrop-blur-sm px-4 py-3 space-y-2">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            disabled={sendReminder.isPending}
            onClick={async () => {
              try {
                if (!id) return
                await sendReminder.mutateAsync(id)
                toast.success('Reminder sent')
              } catch (e) { handleApiError(e) }
            }}
          >
            <MessageCircle className="h-4 w-4" />
            {sendReminder.isPending ? 'Sending…' : 'Send Reminder'}
          </button>

          <div className="flex gap-2">
            <button
              className="flex-1 rounded-2xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-60"
              disabled={notice.isPending}
              onClick={async () => {
                try {
                  if (!id) return
                  await notice.mutateAsync(id)
                  toast.success('Notice recorded')
                } catch (e) { handleApiError(e) }
              }}
            >
              <AlertTriangle className="h-4 w-4 inline mr-1.5" />
              {notice.isPending ? 'Saving…' : 'Give Notice'}
            </button>

            <button
              className="flex-1 rounded-2xl border border-danger/30 bg-danger/10 py-2.5 text-sm font-semibold text-danger hover:bg-danger/15 transition-colors"
              onClick={() => setVacateOpen(true)}
            >
              Vacate
            </button>
          </div>
        </div>
      )}

      {/* Notice tenant action bar */}
      {isNotice && (
        <div className="fixed bottom-20 left-0 right-0 border-t border-amber-200 bg-amber-50/95 backdrop-blur-sm px-4 py-3">
          <button
            className="w-full rounded-2xl bg-danger py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            onClick={() => setVacateOpen(true)}
          >
            Confirm Vacate
          </button>
        </div>
      )}

      {/* ── Vacate sheet ──────────────────────────────────── */}
      <BottomSheet open={vacateOpen} onOpenChange={setVacateOpen} title="Vacate tenant">
        <Input
          type="date"
          label="Move-out date"
          value={vacateDate}
          onChange={e => setVacateDate(e.target.value)}
        />
        <Button
          type="button"
          className="mt-4 w-full"
          variant="danger"
          disabled={vacate.isPending}
          onClick={async () => {
            try {
              if (!id) return
              await vacate.mutateAsync({ id, moveOutDate: vacateDate })
              toast.success('Tenant vacated')
              setVacateOpen(false)
            } catch (e) { handleApiError(e) }
          }}
        >
          {vacate.isPending ? 'Vacating…' : 'Confirm vacate'}
        </Button>
      </BottomSheet>

      {/* ── Mark paid sheet ───────────────────────────────── */}
      <BottomSheet open={!!paidSheet} onOpenChange={() => setPaidSheet(null)} title="Record payment">
        <div className="space-y-3">
          <Input
            type="number"
            label="Amount paid"
            value={amountPaid}
            onChange={e => setAmountPaid(Number(e.target.value))}
          />
          <Input
            type="date"
            label="Paid date"
            value={paidAt}
            onChange={e => setPaidAt(e.target.value)}
          />
          <div>
            <label className="text-sm font-medium text-textPrimary">Payment mode</label>
            <select
              className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value)}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          {['UPI','BANK_TRANSFER','CHEQUE'].includes(paymentMode) && (
            <Input
              label="Reference number"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
            />
          )}
          <Button className="w-full" onClick={onMarkPaid} disabled={markPaid.isPending}>
            {markPaid.isPending ? 'Recording…' : 'Confirm payment'}
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}