import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format, differenceInDays, parseISO } from 'date-fns'
import {
  ArrowLeft, CheckCircle2, AlertCircle, Clock,
  IndianRupee, Calendar, Phone, Home, Banknote,
} from 'lucide-react'
import { Badge }       from '@/components/ui/Badge'
import { Button }      from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input }       from '@/components/ui/Input'
import { Skeleton }    from '@/components/ui/Skeleton'
import { usePayment, useMarkPaid, useWaivePayment } from '@/hooks/usePayments'
import { formatCurrency, formatDate } from '@/lib/format'
import toast from 'react-hot-toast'
import { handleApiError } from '@/lib/apiError'

// ── Status logic ──────────────────────────────────────────────

function getStatus(status: string, dueDate?: string) {
  if (status === 'PAID')   return { label: 'Paid',     variant: 'success'   as const, icon: <CheckCircle2 className="h-4 w-4" />, hero: 'bg-successLight border-success/20', text: 'text-success'   }
  if (status === 'WAIVED') return { label: 'Waived',   variant: 'secondary' as const, icon: <CheckCircle2 className="h-4 w-4" />, hero: 'bg-background border-border',        text: 'text-textSecondary' }
  if (!dueDate)            return { label: 'Pending',  variant: 'warning'   as const, icon: <Clock        className="h-4 w-4" />, hero: 'bg-background border-border',        text: 'text-textSecondary' }

  const days = differenceInDays(parseISO(dueDate), new Date())
  if (days < 0)  return { label: 'Overdue',  variant: 'danger'   as const, icon: <AlertCircle className="h-4 w-4" />, hero: 'bg-dangerLight  border-danger/20',  text: 'text-danger'   }
  if (days <= 2) return { label: 'Due Soon', variant: 'warning'  as const, icon: <Clock       className="h-4 w-4" />, hero: 'bg-warningLight border-warning/20', text: 'text-warning'  }
  return               { label: 'Pending',  variant: 'secondary' as const, icon: <Clock       className="h-4 w-4" />, hero: 'bg-background  border-border',       text: 'text-textSecondary' }
}

function getDaysLabel(dueDate: string, status: string): string {
  if (status === 'PAID' || status === 'WAIVED') return ''
  const days = differenceInDays(parseISO(dueDate), new Date())
  if (days < 0)   return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue — collect now`
  if (days === 0) return 'Due today — collect now'
  if (days === 1) return 'Due tomorrow'
  if (days <= 2)  return `Due in ${days} days — WhatsApp reminder sent`
  return `Due on ${format(parseISO(dueDate), 'd MMMM yyyy')}`
}

// ── Component ─────────────────────────────────────────────────

export function PaymentDetailPage() {
  const { id } = useParams()
  const { data: p, isLoading, isError } = usePayment(id)

  const [sheetOpen,       setSheetOpen      ] = useState(false)
  const [amountPaid,      setAmountPaid     ] = useState(0)
  const [paymentMode,     setPaymentMode    ] = useState('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paidAt,          setPaidAt         ] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const markPaid = useMarkPaid()
  const waive    = useWaivePayment()

  const openSheet = () => {
    if (!p) return
    setAmountPaid(p.amountDue - (p.amountPaid ?? 0))
    setPaidAt(format(new Date(), 'yyyy-MM-dd'))
    setPaymentMode('CASH')
    setReferenceNumber('')
    setSheetOpen(true)
  }

  const onMarkPaid = async () => {
    if (!p) return
    try {
      await markPaid.mutateAsync({
        id: p.id, amountPaid, paymentMode,
        referenceNumber: ['UPI', 'BANK_TRANSFER', 'CHEQUE'].includes(paymentMode)
          ? referenceNumber : undefined,
        paidAt,
      })
      toast.success('Payment recorded!')
      setSheetOpen(false)
    } catch (e) { handleApiError(e) }
  }

  const onWaive = async () => {
    if (!p) return
    try {
      await waive.mutateAsync(p.id)
      toast.success('Payment waived')
    } catch (e) { handleApiError(e) }
  }

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )

  if (isError || !p) return (
    <div className="space-y-3">
      <Link to="/payments" className="flex items-center gap-1.5 text-sm text-primary font-medium">
        <ArrowLeft className="h-4 w-4" /> Payments
      </Link>
      <p className="text-sm text-danger">Payment not found.</p>
    </div>
  )

  const st      = getStatus(p.status, p.dueDate)
  const canAct  = p.status !== 'PAID' && p.status !== 'WAIVED'
  const balance = p.amountDue - (p.amountPaid ?? 0)
  const daysMsg = p.dueDate ? getDaysLabel(p.dueDate, p.status) : ''

  return (
    <div className="space-y-4 pb-24">

      {/* ── Back link ────────────────────────────────────────── */}
      <Link to="/payments" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
        <ArrowLeft className="h-4 w-4" /> All Payments
      </Link>

      {/* ── Hero card — tenant + amount + status ─────────────── */}
      <div className={`rounded-2xl border ${st.hero} p-5`}>

        {/* Tenant name + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-textSecondary mb-1">Tenant</p>
            <h1 className="text-xl font-bold text-textPrimary leading-tight">
              {p.tenantName}
            </h1>
            {p.dueDate && daysMsg && (
              <p className={`text-xs font-medium mt-1 ${st.text}`}>{daysMsg}</p>
            )}
          </div>
          <Badge variant={st.variant} className="flex items-center gap-1 flex-shrink-0 mt-1">
            {st.icon}
            {st.label}
          </Badge>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-black/5" />

        {/* Amount */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-textSecondary">Rent for {p.monthYear}</p>
            <p className="text-3xl font-bold text-textPrimary mt-0.5">
              {formatCurrency(p.amountDue)}
            </p>
          </div>

          {/* Partial payment indicator */}
          {(p.amountPaid ?? 0) > 0 && p.status !== 'PAID' && (
            <div className="text-right">
              <p className="text-xs text-textSecondary">Paid so far</p>
              <p className="text-base font-bold text-success">{formatCurrency(p.amountPaid ?? 0)}</p>
              <p className="text-xs text-danger font-medium">{formatCurrency(balance)} left</p>
            </div>
          )}

          {p.status === 'PAID' && (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-sm font-bold">Collected</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Details card ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-background/50">
          <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">
            Details
          </p>
        </div>

        <div className="divide-y divide-border">

          {/* Due date */}
          {p.dueDate && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 text-textSecondary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-textSecondary">Due Date</p>
                <p className="text-sm font-semibold text-textPrimary mt-0.5">
                  {formatDate(p.dueDate)}
                </p>
              </div>
            </div>
          )}

          {/* Tenant phone — tap to call */}
          {p.tenantPhone && (
            <a
              href={`tel:${p.tenantPhone}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-background/60 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                <Phone className="h-3.5 w-3.5 text-textSecondary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-textSecondary">Phone</p>
                <p className="text-sm font-semibold text-primary mt-0.5">{p.tenantPhone}</p>
              </div>
              <span className="text-xs text-primary font-medium">Call</span>
            </a>
          )}

          {/* Room info */}
          {p.roomNumber && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                <Home className="h-3.5 w-3.5 text-textSecondary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-textSecondary">Room</p>
                <p className="text-sm font-semibold text-textPrimary mt-0.5">
                  Room {p.roomNumber}{p.bedLabel ? ` — Bed ${p.bedLabel}` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Amount due */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
              <IndianRupee className="h-3.5 w-3.5 text-textSecondary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-textSecondary">Rent Amount</p>
              <p className="text-sm font-semibold text-textPrimary mt-0.5">
                {formatCurrency(p.amountDue)}
              </p>
            </div>
            {(p.amountPaid ?? 0) > 0 && (
              <div className="text-right">
                <p className="text-xs text-textSecondary">Paid</p>
                <p className="text-sm font-semibold text-success">
                  {formatCurrency(p.amountPaid ?? 0)}
                </p>
              </div>
            )}
          </div>

          {/* Paid on date — only if paid */}
          {p.paidAt && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-successLight flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-textSecondary">Payment Received On</p>
                <p className="text-sm font-semibold text-textPrimary mt-0.5">
                  {formatDate(p.paidAt)}
                </p>
              </div>
            </div>
          )}

          {/* Payment mode — how they paid */}
          {p.paymentMode && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                <Banknote className="h-3.5 w-3.5 text-textSecondary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-textSecondary">Paid Via</p>
                <p className="text-sm font-semibold text-textPrimary mt-0.5">
                  {p.paymentMode === 'BANK_TRANSFER' ? 'Bank Transfer' :
                   p.paymentMode === 'UPI'           ? 'UPI'           :
                   p.paymentMode === 'CHEQUE'        ? 'Cheque'        : 'Cash'}
                </p>
              </div>
              {p.referenceNo && (
                <div className="text-right max-w-[140px]">
                  <p className="text-xs text-textSecondary">Ref</p>
                  <p className="text-xs font-medium text-textPrimary truncate">{p.referenceNo}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Action buttons ───────────────────────────────────── */}
      {canAct && (
        <div className="space-y-2">
          <Button className="w-full h-12 text-sm" onClick={openSheet}>
            <IndianRupee className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 text-sm border-border text-textSecondary hover:border-danger hover:text-danger"
            onClick={() => void onWaive()}
          >
            Waive this rent
          </Button>
        </div>
      )}

      {/* ── Mark paid bottom sheet ───────────────────────────── */}
      <BottomSheet
        open={sheetOpen}
        onOpenChange={o => !o && setSheetOpen(false)}
        title="Record Payment"
      >
        <div className="space-y-5 pt-2">

          {/* Summary pill */}
          <div className="flex items-center justify-between rounded-xl bg-background px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-textPrimary">{p.tenantName}</p>
              <p className="text-xs text-textSecondary mt-0.5">{p.monthYear}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-textSecondary">Total due</p>
              <p className="text-sm font-bold text-textPrimary">{formatCurrency(p.amountDue)}</p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-textSecondary mb-2">
              Amount Received (₹)
            </label>
            <Input
              type="number"
              value={amountPaid}
              onChange={e => setAmountPaid(Number(e.target.value))}
              className="text-lg font-bold h-12"
            />
            {amountPaid > 0 && amountPaid < (p.amountDue - (p.amountPaid ?? 0)) && (
              <p className="text-xs text-warning mt-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Partial — {formatCurrency((p.amountDue - (p.amountPaid ?? 0)) - amountPaid)} will stay pending
              </p>
            )}
          </div>

          {/* Payment mode */}
          <div>
            <label className="block text-xs font-semibold text-textSecondary mb-2">
              How did they pay?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'CASH',          label: '💵 Cash'          },
                { value: 'UPI',           label: '📱 UPI'           },
                { value: 'BANK_TRANSFER', label: '🏦 Bank Transfer' },
                { value: 'CHEQUE',        label: '📄 Cheque'        },
              ].map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMode(m.value)}
                  className={`rounded-xl border py-3 text-xs font-semibold transition-all ${
                    paymentMode === m.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface text-textSecondary border-border hover:border-primary'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference — only for non-cash */}
          {['UPI', 'BANK_TRANSFER', 'CHEQUE'].includes(paymentMode) && (
            <div>
              <label className="block text-xs font-semibold text-textSecondary mb-2">
                {paymentMode === 'UPI'           ? 'UPI Transaction ID (optional)' :
                 paymentMode === 'CHEQUE'        ? 'Cheque Number (optional)'      :
                 'Transaction Reference (optional)'}
              </label>
              <Input
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="Enter for your records"
              />
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-textSecondary mb-2">
              Date of Payment
            </label>
            <Input
              type="date"
              value={paidAt}
              onChange={e => setPaidAt(e.target.value)}
            />
          </div>

          {/* Confirm button */}
          <Button
            className="w-full h-12"
            disabled={markPaid.isPending || amountPaid <= 0}
            onClick={() => void onMarkPaid()}
          >
            {markPaid.isPending
              ? 'Saving…'
              : `✓  Confirm ${formatCurrency(amountPaid)} Received`}
          </Button>

        </div>
      </BottomSheet>
    </div>
  )
}