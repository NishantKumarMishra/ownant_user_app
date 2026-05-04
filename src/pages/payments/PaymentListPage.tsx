import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addMonths, format } from 'date-fns'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  usePaymentStats,
  usePaymentsList,
  useMarkPaid,
  useWaivePayment,
  useGenerateBulkPayments,
  type PaymentFilter,
} from '@/hooks/usePayments'
import { formatCurrency, formatMonthYear } from '@/lib/format'
import type { PaymentItem } from '@/api/types'
import toast from 'react-hot-toast'
import { handleApiError } from '@/lib/apiError'
import { useQueryClient } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'

export function PaymentListPage() {
  const [params, setParams] = useSearchParams()
  const initialFilter = (params.get('filter')?.toUpperCase() as PaymentFilter) || 'ALL'
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [filter, setFilter] = useState<PaymentFilter>(
    ['ALL', 'PENDING', 'PAID', 'OVERDUE'].includes(initialFilter) ? initialFilter : 'ALL',
  )
  const [bulkOpen, setBulkOpen] = useState(false)
  const [sheet, setSheet] = useState<PaymentItem | null>(null)
  const [amountPaid, setAmountPaid] = useState(0)
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10))

  const stats = usePaymentStats(month)
  const list = usePaymentsList(filter, month)
  const markPaid = useMarkPaid()
  const waive = useWaivePayment()
  const bulk = useGenerateBulkPayments()
  const qc = useQueryClient()

  const rows = list.data ?? []

  const openPaid = (p: PaymentItem) => {
    setSheet(p)
    setAmountPaid(p.amountDue - (p.amountPaid ?? 0))
    setPaidAt(new Date().toISOString().slice(0, 10))
    setPaymentMode('CASH')
    setReferenceNumber('')
  }

  const listKey = useMemo(() => ['payments', 'list', filter, month] as const, [filter, month])

  const onMarkPaid = async () => {
    if (!sheet) return
    const prev = qc.getQueryData<PaymentItem[]>(listKey)
    qc.setQueryData<PaymentItem[]>(listKey, (old) =>
      (old ?? []).map((x) =>
        x.id === sheet.id ? { ...x, status: 'PAID', amountPaid, paidAt: `${paidAt}T00:00:00` } : x,
      ),
    )
    try {
      await markPaid.mutateAsync({
        id: sheet.id,
        amountPaid,
        paymentMode,
        referenceNumber: ['UPI', 'BANK_TRANSFER', 'CHEQUE'].includes(paymentMode)
          ? referenceNumber
          : undefined,
        paidAt,
      })
      toast.success('Saved')
      setSheet(null)
    } catch (e) {
      if (prev) qc.setQueryData(listKey, prev)
      handleApiError(e)
    }
  }

  const onWaive = async (p: PaymentItem) => {
    try {
      await waive.mutateAsync(p.id)
      toast.success('Waived')
    } catch (e) {
      handleApiError(e)
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-2 text-sm font-semibold"
          onClick={() => setMonth((m) => format(addMonths(new Date(`${m}-01`), -1), 'yyyy-MM'))}
        >
          ‹
        </button>
        <p className="text-sm font-semibold">{formatMonthYear(month)}</p>
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-2 text-sm font-semibold"
          onClick={() => setMonth((m) => format(addMonths(new Date(`${m}-01`), 1), 'yyyy-MM'))}
        >
          ›
        </button>
      </div>

      {stats.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : stats.data ? (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-3 text-sm md:grid-cols-4">
          <div>
            <p className="text-textTertiary">Expected</p>
            <p className="font-semibold">{formatCurrency(stats.data.expected)}</p>
          </div>
          <div>
            <p className="text-textTertiary">Collected</p>
            <p className="font-semibold">{formatCurrency(stats.data.collected)}</p>
          </div>
          <div>
            <p className="text-textTertiary">Collection rate</p>
            <p className="font-semibold">{Math.round(stats.data.collectionRate)}%</p>
          </div>
          <div>
            <p className="text-textTertiary">Overdue</p>
            <p className="font-semibold text-danger">{stats.data.overdueCount}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(['ALL', 'PENDING', 'PAID', 'OVERDUE'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFilter(f)
              setParams(f === 'OVERDUE' ? { filter: 'overdue' } : {})
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              filter === f ? 'border-primary bg-primaryLight text-primary' : 'border-border bg-surface'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending' : f === 'PAID' ? 'Paid' : 'Overdue'}
          </button>
        ))}
      </div>

      <Button type="button" variant="secondary" className="w-full" onClick={() => setBulkOpen(true)}>
        Generate bulk payments
      </Button>

      {list.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments"
          description="Generate payments for this month to see them here."
        />
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border bg-surface">
          {rows.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link to={`/payments/${p.id}`} className="font-semibold text-textPrimary hover:underline">
                  {p.tenantName}
                </Link>
                <p className="text-xs text-textSecondary">
                  {p.monthYear} · Due {p.dueDate ? format(new Date(p.dueDate), 'd MMM') : '—'}
                </p>
                <p className="text-sm font-semibold">{formatCurrency(p.amountDue)}</p>
                <Badge variant={p.status === 'PAID' ? 'success' : 'warning'}>{p.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" type="button" variant="secondary" onClick={() => openPaid(p)}>
                  Mark Paid
                </Button>
                <Button size="sm" type="button" variant="outline" onClick={() => void onWaive(p)}>
                  Waive
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Generate bulk payments"
        description="Create rent entries for all active tenants for the selected month."
      >
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" type="button" onClick={() => setBulkOpen(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            type="button"
            disabled={bulk.isPending}
            onClick={async () => {
              try {
                await bulk.mutateAsync(month)
                toast.success('Generated')
                setBulkOpen(false)
              } catch (e) {
                handleApiError(e)
              }
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>

      <BottomSheet open={Boolean(sheet)} onOpenChange={(o) => !o && setSheet(null)} title="Mark paid">
        {sheet ? (
          <div className="space-y-3">
            <Input
              label="Amount paid"
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
            />
            <div>
              <label className="text-sm font-medium">Payment mode</label>
              <select
                className="mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                {['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            {['UPI', 'BANK_TRANSFER', 'CHEQUE'].includes(paymentMode) ? (
              <Input
                label="Reference number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            ) : null}
            <Input type="date" label="Paid date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            <Button type="button" className="w-full" disabled={markPaid.isPending} onClick={() => void onMarkPaid()}>
              Save
            </Button>
          </div>
        ) : null}
      </BottomSheet>
    </div>
  )
}
