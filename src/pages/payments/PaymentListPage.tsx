import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addMonths, format, differenceInDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle2, CreditCard, IndianRupee, Zap } from 'lucide-react'
import { Badge }      from '@/components/ui/Badge'
import { Button }     from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input }      from '@/components/ui/Input'
import { Modal }      from '@/components/ui/Modal'
import { Skeleton }   from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  usePaymentStats,
  usePaymentsList,
  useMarkPaid,
  useWaivePayment,
  useGenerateBulkPayments,
  type PaymentFilter,
} from '@/hooks/usePayments'
import { formatCurrency } from '@/lib/format'
import type { PaymentItem } from '@/api/types'
import toast from 'react-hot-toast'
import { handleApiError } from '@/lib/apiError'

// ── Status helpers ─────────────────────────────────────────────

function getStatusLabel(p: PaymentItem): string {
  if (p.status === 'PAID')   return 'Paid'
  if (p.status === 'WAIVED') return 'Waived'
  if (!p.dueDate)            return 'Pending'
  const days = differenceInDays(parseISO(p.dueDate), new Date())
  if (days < 0)  return 'Overdue'
  if (days <= 2) return 'Due Soon'
  return 'Pending'
}

function getStatusColor(p: PaymentItem): string {
  const label = getStatusLabel(p)
  if (label === 'Paid')     return 'text-success bg-successLight'
  if (label === 'Overdue')  return 'text-danger bg-dangerLight'
  if (label === 'Due Soon') return 'text-warning bg-warningLight'
  if (label === 'Waived')   return 'text-textSecondary bg-background'
  return 'text-textSecondary bg-background'
}

function getStatusIcon(p: PaymentItem) {
  const label = getStatusLabel(p)
  if (label === 'Paid')     return <CheckCircle2 className="h-3.5 w-3.5" />
  if (label === 'Overdue')  return <AlertCircle  className="h-3.5 w-3.5" />
  if (label === 'Due Soon') return <Clock        className="h-3.5 w-3.5" />
  return null
}

function getDueDateLabel(p: PaymentItem): string {
  if (p.status === 'PAID') {
    const paid = p.paidDate ?? p.paidAt
    return paid ? `Paid on ${format(parseISO(paid), 'd MMM')}` : 'Paid'
  }
  if (!p.dueDate) return ''
  const days = differenceInDays(parseISO(p.dueDate), new Date())
  if (days < 0)   return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days <= 2)  return `Due in ${days} days`
  return `Due ${format(parseISO(p.dueDate), 'd MMM')}`
}

// ── Filter tab definition ──────────────────────────────────────
// All tabs have the same shape — urgent is always present
type FilterTab = {
  key:    PaymentFilter
  label:  string
  count:  number
  urgent: boolean
}

// ── Main Page ──────────────────────────────────────────────────

export function PaymentListPage() {
  const [month, setMonth]     = useState(() => format(new Date(), 'yyyy-MM'))
  const [filter, setFilter]   = useState<PaymentFilter>('ALL')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [sheet, setSheet]     = useState<PaymentItem | null>(null)

  const [amountPaid,      setAmountPaid     ] = useState(0)
  const [paymentMode,     setPaymentMode    ] = useState('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paidAt, setPaidAt] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const stats    = usePaymentStats(month)

  // Always fetch ALL payments for selected month — filter client-side
  // This ensures PENDING/OVERDUE tabs respect the selected month
  const listAll  = usePaymentsList('ALL', month)
  const markPaid = useMarkPaid()
  const waive    = useWaivePayment()
  const bulk     = useGenerateBulkPayments()

  // Client-side filter based on selected tab
  const allRows: PaymentItem[] = listAll.data ?? []

  const filteredRows = allRows.filter(p => {
    if (filter === 'ALL')     return true
    if (filter === 'PAID')    return p.status === 'PAID' || p.status === 'WAIVED'
    if (filter === 'PENDING') return p.status === 'PENDING' || p.status === 'PARTIAL'
    if (filter === 'OVERDUE') {
      if (p.status === 'PAID' || p.status === 'WAIVED') return false
      if (!p.dueDate) return false
      return differenceInDays(parseISO(p.dueDate), new Date()) < 0
    }
    return true
  })

  const list = { ...listAll, data: filteredRows }

  const rows: PaymentItem[] = [...filteredRows].sort((a, b) => {
    const order = (p: PaymentItem) => {
      const label = getStatusLabel(p)
      if (label === 'Overdue')  return 0
      if (label === 'Due Soon') return 1
      if (label === 'Pending')  return 2
      return 3
    }
    return order(a) - order(b)
  })

  const overdueCount = rows.filter(p => getStatusLabel(p) === 'Overdue').length
  const dueSoonCount = rows.filter(p => getStatusLabel(p) === 'Due Soon').length
  const pendingCount = rows.filter(p => getStatusLabel(p) === 'Pending').length

  const filterTabs: FilterTab[] = [
    { key: 'ALL',     label: 'All',      count: 0,                           urgent: false },
    { key: 'PENDING', label: 'Not Paid', count: pendingCount + dueSoonCount,  urgent: false },
    { key: 'OVERDUE', label: 'Overdue',  count: overdueCount,                urgent: true  },
    { key: 'PAID',    label: 'Paid',     count: 0,                           urgent: false },
  ]

  const openMarkPaid = (p: PaymentItem) => {
    setSheet(p)
    setAmountPaid(p.amountDue - (p.amountPaid ?? 0))
    setPaidAt(format(new Date(), 'yyyy-MM-dd'))
    setPaymentMode('CASH')
    setReferenceNumber('')
  }

  const onMarkPaid = async () => {
    if (!sheet) return
    try {
      await markPaid.mutateAsync({
        id: sheet.id,
        amountPaid,
        paymentMode,
        referenceNumber: ['UPI', 'BANK_TRANSFER', 'CHEQUE'].includes(paymentMode)
          ? referenceNumber : undefined,
        paidAt,
      })
      toast.success('Payment recorded!')
      setSheet(null)
    } catch (e) {
      handleApiError(e)
    }
  }

  const onWaive = async (p: PaymentItem) => {
    try {
      await waive.mutateAsync(p.id)
      toast.success('Payment waived')
    } catch (e) {
      handleApiError(e)
    }
  }

  const monthLabel = format(new Date(`${month}-01`), 'MMMM yyyy')

  return (
    <div className="space-y-4 pb-20">

      {/* ── Month selector ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth(m => format(addMonths(new Date(`${m}-01`), -1), 'yyyy-MM'))}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-textPrimary" />
        </button>
        <div className="text-center">
          <p className="text-base font-bold text-textPrimary">{monthLabel}</p>
          <p className="text-xs text-textSecondary">Rent collection</p>
        </div>
        <button
          onClick={() => setMonth(m => format(addMonths(new Date(`${m}-01`), 1), 'yyyy-MM'))}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-textPrimary" />
        </button>
      </div>

      {/* ── Stats card ──────────────────────────────────────── */}
      {stats.isLoading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : stats.data ? (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-xs text-textSecondary">Collected this month</p>
                <p className="text-2xl font-bold text-textPrimary">
                  {formatCurrency(stats.data.collected)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-textSecondary">of {formatCurrency(stats.data.expected)}</p>
                <p className={`text-xl font-bold ${stats.data.collectionRate >= 80 ? 'text-success' : 'text-warning'}`}>
                  {Math.round(stats.data.collectionRate)}%
                </p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-background">
              <div
                className={`h-2 rounded-full transition-all ${stats.data.collectionRate >= 80 ? 'bg-success' : 'bg-warning'}`}
                style={{ width: `${Math.min(stats.data.collectionRate, 100)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-border divide-x divide-border">
            <div className="px-3 py-2.5 text-center">
              <p className="text-xs text-textSecondary">Pending</p>
              <p className="text-base font-bold text-warning">{formatCurrency(stats.data.pending)}</p>
            </div>
            <div className="px-3 py-2.5 text-center">
              <p className="text-xs text-textSecondary">Overdue</p>
              <p className={`text-base font-bold ${stats.data.overdueCount > 0 ? 'text-danger' : 'text-textSecondary'}`}>
                {stats.data.overdueCount} {stats.data.overdueCount === 1 ? 'tenant' : 'tenants'}
              </p>
            </div>
            <div className="px-3 py-2.5 text-center">
              <p className="text-xs text-textSecondary">Paid</p>
              <p className="text-base font-bold text-success">
                {stats.data.paidCount} {stats.data.paidCount === 1 ? 'tenant' : 'tenants'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Alert banners ────────────────────────────────────── */}
      {overdueCount > 0 && filter !== 'OVERDUE' && (
        <button
          onClick={() => setFilter('OVERDUE')}
          className="w-full flex items-center gap-3 rounded-xl bg-dangerLight border border-danger/20 px-4 py-3 text-left"
        >
          <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-danger">
              {overdueCount} tenant{overdueCount > 1 ? 's have' : ' has'} not paid yet
            </p>
            <p className="text-xs text-danger/70">Due date has passed — collect now</p>
          </div>
          <ChevronRight className="h-4 w-4 text-danger flex-shrink-0" />
        </button>
      )}

      {dueSoonCount > 0 && filter === 'ALL' && (
        <button
          onClick={() => setFilter('PENDING')}
          className="w-full flex items-center gap-3 rounded-xl bg-warningLight border border-warning/20 px-4 py-3 text-left"
        >
          <Clock className="h-5 w-5 text-warning flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-warning">
              {dueSoonCount} tenant{dueSoonCount > 1 ? 's' : ''} due in 2 days
            </p>
            <p className="text-xs text-warning/70">WhatsApp reminder sent automatically</p>
          </div>
          <ChevronRight className="h-4 w-4 text-warning flex-shrink-0" />
        </button>
      )}

      {/* ── Filter tabs ──────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map(tab => {
          const isActive = filter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                isActive
                  ? tab.urgent
                    ? 'bg-danger text-white border-danger'
                    : 'bg-primary text-white border-primary'
                  : 'bg-surface text-textSecondary border-border hover:border-primary'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge
                  variant={tab.urgent ? 'danger' : 'default'}
                  className={`px-1.5 py-0 text-[10px] ${isActive ? 'bg-white/25 text-white border-0' : ''}`}
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Generate bulk button ─────────────────────────────── */}
      <button
        onClick={() => setBulkOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primaryLight py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        <Zap className="h-4 w-4" />
        Generate {monthLabel} rent for all tenants
      </button>

      {/* ── Payment list ─────────────────────────────────────── */}
      {list.isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments here"
          description={
            filter === 'OVERDUE' ? 'No overdue payments. All tenants are up to date.' :
            filter === 'PAID'    ? 'No payments collected yet for this month.' :
            'Generate rent records first using the button above.'
          }
        />
      ) : (
        <div className="space-y-2">
          {rows.map(p => {
            const statusLabel  = getStatusLabel(p)
            const statusColor  = getStatusColor(p)
            const statusIcon   = getStatusIcon(p)
            const dueDateLabel = getDueDateLabel(p)
            const canAct       = statusLabel !== 'Paid' && statusLabel !== 'Waived'
            //const balanceDue   = p.amountDue - (p.amountPaid ?? 0)

            return (
              <div
                key={p.id}
                className={`rounded-xl border bg-surface overflow-hidden ${
                  statusLabel === 'Overdue'  ? 'border-danger/30'  :
                  statusLabel === 'Due Soon' ? 'border-warning/30' :
                  'border-border'
                }`}
              >
                <div className="flex items-start justify-between p-4 pb-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/payments/${p.id}`}
                      className="text-sm font-semibold text-textPrimary hover:text-primary truncate block"
                    >
                      {p.tenantName}
                    </Link>
                    <p className="text-xs text-textSecondary mt-0.5">{dueDateLabel}</p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0 ml-2 ${statusColor}`}>
                    {statusIcon}
                    {statusLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 pb-4">
                  <div>
                    <p className="text-lg font-bold text-textPrimary">
                      {formatCurrency(p.amountDue)}
                    </p>
                    {p.amountPaid != null && p.amountPaid > 0 && p.status !== 'PAID' && (
                      <p className="text-xs text-textSecondary">
                        Partial: {formatCurrency(p.amountPaid)} paid ·{' '}
                        <span className="text-danger font-medium">
                          {formatCurrency(p.amountDue)} remaining
                        </span>
                      </p>
                    )}
                  </div>

                  {canAct ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => openMarkPaid(p)} className="text-xs">
                        <IndianRupee className="h-3 w-3 mr-1" />
                        Mark Paid
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void onWaive(p)} className="text-xs">
                        Waive
                      </Button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      Collected
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Bulk generate modal ──────────────────────────────── */}
      <Modal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Generate rent for ${monthLabel}`}
        description="This will create rent records for all active tenants. You can then mark them paid as rent comes in."
      >
        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={() => setBulkOpen(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={bulk.isPending}
            onClick={async () => {
              try {
                const res = await bulk.mutateAsync(month) as any
                const count = res?.data?.length ?? 0
                toast.success(`${count > 0 ? count + ' records' : 'Records'} generated!`)
                setBulkOpen(false)
              } catch (e) {
                handleApiError(e)
              }
            }}
          >
            {bulk.isPending ? 'Generating…' : 'Yes, Generate'}
          </Button>
        </div>
      </Modal>

      {/* ── Mark paid bottom sheet ───────────────────────────── */}
      <BottomSheet
        open={Boolean(sheet)}
        onOpenChange={o => !o && setSheet(null)}
        title="Record payment"
      >
        {sheet && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-background px-4 py-3">
              <p className="text-sm font-semibold text-textPrimary">{sheet.tenantName}</p>
              <p className="text-xs text-textSecondary mt-0.5">
                Rent for {sheet.monthYear} · Total due: {formatCurrency(sheet.amountDue)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5">
                Amount received (₹)
              </label>
              <Input
                type="number"
                value={amountPaid}
                onChange={e => setAmountPaid(Number(e.target.value))}
                placeholder={String(sheet.amountDue - (sheet.amountPaid ?? 0))}
              />
              {amountPaid > 0 && amountPaid < sheet.amountDue && (
                <p className="text-xs text-warning mt-1">
                  Partial payment — {formatCurrency(sheet.amountDue - amountPaid)} will remain pending
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5">
                How did they pay?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                      paymentMode === mode
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-textSecondary border-border hover:border-primary'
                    }`}
                  >
                    {mode === 'BANK_TRANSFER' ? 'Bank Transfer' :
                     mode.charAt(0) + mode.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {['UPI', 'BANK_TRANSFER', 'CHEQUE'].includes(paymentMode) && (
              <div>
                <label className="block text-xs font-medium text-textSecondary mb-1.5">
                  {paymentMode === 'UPI' ? 'UPI transaction ID' :
                   paymentMode === 'CHEQUE' ? 'Cheque number' :
                   'Transaction reference'}
                </label>
                <Input
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="Enter reference number"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1.5">
                Date of payment
              </label>
              <Input
                type="date"
                value={paidAt}
                onChange={e => setPaidAt(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={markPaid.isPending || amountPaid <= 0}
              onClick={() => void onMarkPaid()}
            >
              {markPaid.isPending ? 'Saving…' : `Confirm — ${formatCurrency(amountPaid)} received`}
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}