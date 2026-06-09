import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Phone, MessageCircle, ChevronDown, ChevronLeft,
  BedDouble, Calendar, IndianRupee, User, Bell,
  Wind, Thermometer, AlertTriangle, 
  Clock, FileText, Smartphone, ShieldCheck
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
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
]
function avatarGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

// ✅ Yeh badal lijiye top par:
function statusConfig(status: string) {
  switch (status) {
    case 'ACTIVE':  
      return { 
        label: 'Active Resident',  
        bg: 'bg-success/10 border border-success/10', 
        text: 'text-success', // 🟢 Added text property
        dot: 'bg-success' 
      }
    case 'NOTICE':  
      return { 
        label: 'Under Notice',  
        bg: 'bg-amber-50 border border-amber-200/40', 
        text: 'text-amber-600', // 🟢 Added text property
        dot: 'bg-amber-500' 
      }
    case 'VACATED': 
      return { 
        label: 'Vacated History', 
        bg: 'bg-gray-100 border border-gray-200',  
        text: 'text-gray-500', // 🟢 Added text property
        dot: 'bg-gray-400' 
      }
    default:        
      return { 
        label: status,    
        bg: 'bg-surface border border-border/80',     
        text: 'text-textSecondary', // 🟢 Added text property
        dot: 'bg-border' 
      }
  }
}

function PaymentPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID:    'bg-success/10 text-success border border-success/10',
    PARTIAL: 'bg-blue-50 text-blue-600 border border-blue-100',
    PENDING: 'bg-amber-50 text-amber-600 border border-amber-200/40',
    WAIVED:  'bg-gray-100 text-gray-500 border border-gray-200',
    OVERDUE: 'bg-danger/10 text-danger border border-danger/10 animate-pulse',
  }
  return (
    <span className={cn('inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm', map[status] ?? 'bg-surface text-textSecondary')}>
      {status}
    </span>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3.5 py-3 border-b border-gray-100 last:border-0">
      <div className="h-8 w-8 rounded-xl bg-background border border-border/60 flex items-center justify-center shrink-0 text-textSecondary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-textSecondary">{label}</p>
        <p className="text-sm font-bold text-textPrimary mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}

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
      <div className="space-y-4 p-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
    )
  }

  const isActive  = t.status === 'ACTIVE'
  const isNotice  = t.status === 'NOTICE'
  const sc        = statusConfig(t.status)
  const gradient  = avatarGradient(t.name)

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
      toast.success('Payment recorded successfully')
      setPaidSheet(null)
    } catch (e) {
      if (prev) qc.setQueryData(['payments', 'tenant', id], prev)
      handleApiError(e)
    }
  }

  return (
    <div className="w-full bg-background min-h-svh pb-44 overflow-x-hidden">

      {/* ── Core Premium Identity Console Header ── */}
      <div className="px-4.5 pt-5 pb-6 bg-gradient-to-b from-gray-50 to-transparent border-b border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-surface border border-border/80 text-xs font-bold text-textSecondary transition active:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4 shrink-0 -ml-1" /> Profile
        </button>

        <div className="flex items-start gap-4">
          {/* Real 3D Layered Corporate Avatar */}
          <div className={cn(
            'h-16 w-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-xl font-black text-white shrink-0 shadow-md shadow-gray-200/60 ring-4 ring-white',
            gradient,
          )}>
            {initials(t.name)}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-textPrimary tracking-tight leading-tight truncate">{t.name}</h1>

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={cn('inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider', sc.bg, sc.text)}>
                <span className={cn('h-1 w-1 rounded-full', sc.dot)} />
                {sc.label}
              </span>

              {isNotice && noticeDays !== null && (
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
                  noticeDays <= 3 ? 'bg-danger/10 text-danger border border-danger/10 animate-pulse' : 'bg-amber-50 text-amber-600 border border-amber-200/40',
                )}>
                  <Clock className="h-3 w-3" />
                  {noticeDays <= 0 ? 'Overdue' : `${noticeDays}d left`}
                </span>
              )}
            </div>

            <a href={`tel:${t.phone}`} className="inline-flex items-center gap-1.5 text-xs text-primary font-black mt-2 bg-primary/5 px-2 py-1 rounded-lg border border-primary/5 transition active:bg-primary/10">
              <Smartphone className="h-3 w-3 stroke-[2.5]" />
              {t.phone}
            </a>
          </div>
        </div>

        {/* Action Tray Communication Suite */}
        <div className="flex gap-2.5 mt-5">
          <a
            href={`tel:${t.phone}`}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-surface border border-border/80 text-xs font-black text-textPrimary transition active:bg-gray-50 shadow-sm"
          >
            <Phone className="h-3.5 w-3.5 text-textSecondary stroke-[2.2]" /> Voice Call
          </a>
          <a
            href={`https://wa.me/91${t.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-success/10 border border-success/10 text-xs font-black text-success transition active:bg-success/15 shadow-sm"
          >
            <MessageCircle className="h-3.5 w-3.5 stroke-[2.2]" /> WhatsApp chat
          </a>
        </div>
      </div>

      {/* ── Room Config Mapping Frame ── */}
      <div className="mt-4 px-2.5">
        <div className="rounded-2xl border border-border/80 bg-surface p-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BedDouble className="h-5 w-5 text-primary stroke-[1.8]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-textPrimary tracking-tight truncate">
                  Room {t.bed?.roomNumber ?? '—'} • Bed {t.bed?.bedLabel ?? '—'}
                </p>
                <p className="text-[11px] font-bold text-textSecondary uppercase tracking-wider mt-0.5">
                  {t.bed?.sharingType ?? '—'} Bed configuration
                </p>
              </div>
            </div>
            <span className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0',
              t.bed?.isAc ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100',
            )}>
              {t.bed?.isAc ? <><Wind className="h-3 w-3 stroke-[2.5]" />AC</> : <><Thermometer className="h-3 w-3 stroke-[2.5]" />Non-AC</>}
            </span>
          </div>
        </div>
      </div>

      {/* ── Operational Registry Data Matrix ── */}
      <div className="mt-3 px-2.5">
        <div className="rounded-2xl border border-border/80 bg-surface px-3.5 py-1 shadow-sm">
          <InfoRow icon={<IndianRupee className="h-4 w-4" />}  label="Contractual Rent" value={t.monthlyRent != null ? formatCurrency(t.monthlyRent) : null} />
          <InfoRow icon={<Calendar className="h-4 w-4" />}     label="Official Move-In" value={t.moveInDate ? formatDate(t.moveInDate) : null} />
          <InfoRow icon={<Clock className="h-4 w-4" />}        label="Billing Due Cycle" value={t.dueDay ? `${t.dueDay}th of month` : null} />
          <InfoRow icon={<User className="h-4 w-4" />}         label="Resident Occupation" value={t.occupation ?? null} />
          <InfoRow icon={<FileText className="h-4 w-4" />}     label="Corporate Brand"  value={t.company ?? null} />
          <InfoRow icon={<Phone className="h-4 w-4" />}        label="Emergency Node"   value={t.emergencyName ? `${t.emergencyName}${t.emergencyPhone ? ' · ' + t.emergencyPhone : ''}` : null} />
        </div>
      </div>

      {/* ── Commercial History Drawer List ── */}
      <div className="mt-5 px-2.5">
        <h2 className="text-xs font-black uppercase tracking-widest text-textSecondary mb-2.5 px-1">Invoicing Ledger</h2>

        {payments.isLoading ? (
          <div className="space-y-2">
            {[1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : (payments.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-8 text-center shadow-inner">
            <p className="text-xs font-semibold text-textSecondary">No active billing balances compiled yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(payments.data ?? []).map(p => {
              const isUnpaid = p.status === 'PENDING' || p.status === 'OVERDUE' || p.status === 'PARTIAL'
              return (
                <div
                  key={p.id}
                  className={cn(
                    'rounded-2xl border bg-surface px-3.5 py-3 shadow-sm transition-all duration-150',
                    isUnpaid ? 'border-amber-200 bg-amber-50/5' : 'border-border/60',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-textPrimary tracking-tight">{p.monthYear}</p>
                        <PaymentPill status={p.status} />
                      </div>
                      <p className="text-[11px] font-semibold text-textSecondary mt-1">
                        Due: {p.dueDate ? formatDate(p.dueDate) : '—'} • <span className="text-textPrimary font-bold">{formatCurrency(p.amountDue)}</span>
                      </p>
                    </div>
                    {isUnpaid && isActive && (
                      <button
                        onClick={() => openMarkPaid(p)}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-xl bg-primary text-xs font-bold text-white shadow-sm shadow-primary/10 transition active:scale-95 shrink-0"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Collect
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-4 px-2.5">
        <CheckinStatusCard tenantId={t.id} />
      </div>

      {/* ── Communication Logs Panel ── */}
      <div className="mt-4 px-2.5">
        <Collapsible.Root open={logsOpen} onOpenChange={setLogsOpen}>
          <Collapsible.Trigger className="flex w-full h-12 items-center justify-between rounded-2xl border border-border/80 bg-surface px-3.5 text-xs font-extrabold uppercase tracking-wider text-textPrimary shadow-sm transition active:bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-textSecondary" /> Platform Push logs
            </div>
            <ChevronDown className={cn('h-4 w-4 text-textSecondary transition-transform duration-200', logsOpen && 'rotate-180')} />
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="mt-1.5 rounded-2xl border border-border/70 bg-surface divide-y divide-gray-100 overflow-hidden shadow-sm animate-in fade-in duration-200">
              {(logs.data ?? []).length === 0 ? (
                <p className="px-4 py-4 text-xs font-medium text-textSecondary text-center">No transactions dispatched</p>
              ) : (logs.data ?? []).map(l => (
                <div key={l.id} className="flex items-center justify-between px-3.5 py-3 bg-background/30">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-textPrimary uppercase tracking-tight truncate">
                      {l.type?.replace(/_/g, ' ') ?? 'Notification'}
                    </p>
                    <p className="text-[10px] font-semibold text-textSecondary mt-0.5">
                      {l.sentAt ? format(parseISO(l.sentAt), 'dd MMM yyyy • hh:mm a') : '—'}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[9px] font-black uppercase tracking-wider rounded-md px-1.5 py-0.5 shrink-0 shadow-sm border',
                    l.status === 'SENT'   ? 'bg-success/10 text-success border-success/10'  : '',
                    l.status === 'FAILED' ? 'bg-danger/10 text-danger border-danger/10 animate-pulse' : '',
                    l.status === 'PENDING'? 'bg-amber-50 text-amber-600 border-amber-200/40' : '',
                  )}>
                    {l.status ?? 'SENT'}
                  </span>
                </div>
              ))}
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>

      {/* ── Floating Mobile Platform Action Control Desk ── */}
      {isActive && (
        <div className="fixed bottom-20 left-0 right-0 border-t border-border bg-surface/90 backdrop-blur-md px-3 py-3 space-y-2 shadow-[0_-10px_35px_-5px_rgba(0,0,0,0.06)] z-30">
          <button
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#25D366] text-xs font-black uppercase tracking-wider text-white shadow-md shadow-success/10 transition active:scale-[0.98] disabled:opacity-50"
            disabled={sendReminder.isPending}
            onClick={async () => {
              try {
                if (!id) return
                await sendReminder.mutateAsync(id)
                toast.success('Rent collection invoice pushed')
              } catch (e) { handleApiError(e) }
            }}
          >
            <Bell className="h-4 w-4 stroke-[2.2] animate-bounce" />
            {sendReminder.isPending ? 'Pushed...' : 'Dispatch Payment Reminder'}
          </button>

          <div className="flex gap-2.5">
            <button
              className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/60 text-xs font-black uppercase tracking-wider text-amber-700 transition active:scale-[0.98] disabled:opacity-50"
              disabled={notice.isPending}
              onClick={async () => {
                try {
                  if (!id) return
                  await notice.mutateAsync(id)
                  toast.success('Vacation window recorded')
                } catch (e) { handleApiError(e) }
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5 stroke-[2.2]" />
              {notice.isPending ? 'Saving…' : 'Log Notice'}
            </button>

            <button
              className="flex-1 h-11 rounded-xl border border-danger/20 bg-danger/10 text-xs font-black uppercase tracking-wider text-danger transition active:scale-[0.98]"
              onClick={() => setVacateOpen(true)}
            >
              Vacate Unit
            </button>
          </div>
        </div>
      )}

      {/* Notice Action Control Frame */}
      {isNotice && (
        <div className="fixed bottom-20 left-0 right-0 border-t border-amber-200 bg-amber-50/90 backdrop-blur-md px-3 py-3 z-30 shadow-[0_-10px_35px_-5px_rgba(0,0,0,0.06)]">
          <button
            className="w-full h-12 rounded-xl bg-danger text-xs font-black uppercase tracking-wider text-white shadow-md shadow-danger/10 transition active:scale-[0.98]"
            onClick={() => setVacateOpen(true)}
          >
            Finalize Vacate Settlement
          </button>
        </div>
      )}

      {/* ── Vacate sheet ── */}
      <BottomSheet open={vacateOpen} onOpenChange={setVacateOpen} title="Vacate tenant">
        <Input type="date" label="Move-out date" value={vacateDate} onChange={e => setVacateDate(e.target.value)} />
        <Button type="button" className="mt-4 w-full h-11 rounded-xl text-xs font-bold" variant="danger" disabled={vacate.isPending}
          onClick={async () => {
            try {
              if (!id) return
              await vacate.mutateAsync({ id, moveOutDate: vacateDate })
              toast.success('Tenant status updated to history')
              setVacateOpen(false)
            } catch (e) { handleApiError(e) }
          }}
        >
          {vacate.isPending ? 'Processing…' : 'Confirm vacate'}
        </Button>
      </BottomSheet>

      {/* ── Mark paid sheet ── */}
      <BottomSheet open={!!paidSheet} onOpenChange={() => setPaidSheet(null)} title="Record payment">
        <div className="space-y-3 pt-1">
          <Input type="number" label="Amount paid" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} />
          <Input type="date" label="Paid date" value={paidAt} onChange={e => setPaidAt(e.target.value)} />
          <div>
            <label className="text-xs font-bold text-textSecondary uppercase tracking-wider">Payment mode</label>
            <select className="mt-1.5 w-full h-11 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-textPrimary outline-none focus:border-primary" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              <option value="CASH">💵 Cash Settlement</option>
              <option value="UPI">📱 Digital UPI App</option>
              <option value="BANK_TRANSFER">🏦 Immediate Bank IMPS</option>
              <option value="CHEQUE">📄 Bank Cheque Draft</option>
            </select>
          </div>
          {['UPI','BANK_TRANSFER','CHEQUE'].includes(paymentMode) && (
            <Input label="Reference number" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} placeholder="Enter transaction reference ID" />
          )}
          <Button className="w-full h-12 rounded-xl text-xs font-bold mt-2" onClick={onMarkPaid} disabled={markPaid.isPending}>
            {markPaid.isPending ? 'Processing ledger…' : 'Authorize Settlement Payment'}
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}