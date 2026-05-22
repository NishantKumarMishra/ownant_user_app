// src/pages/electricity/ElectricityPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Zap, Settings2, Plus, ChevronRight,
  CheckCircle2, Loader2, XCircle, Calendar, Users,
  ReceiptText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  useElectricityConfig,
  useSaveElectricityConfig,
  useElectricityBills,
  usePreviewBill,
  useGenerateBill,
  useMarkDuePaid,
  useWaiveDue,
  useElectricityBill,
} from '@/hooks/useElectricity'
import type {
  BillPreview,
  ElectricityBillSummary,
  
  RoomReading,
} from '@/api/types'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────
type BillingMode = 'SPLIT_EQUALLY' | 'FIXED_PER_TENANT' | 'PER_ROOM_UNITS'
type MeterType   = 'SINGLE' | 'PER_FLOOR' | 'PER_ROOM'

// ── Helpers ───────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

function formatAmount(n?: number | null) {
  if (n == null) return '—'
  return '₹' + n.toLocaleString('en-IN')
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    CONFIRMED:      { label: 'Active',      cls: 'bg-primary/10 text-primary' },
    PARTIALLY_PAID: { label: 'Partial',     cls: 'bg-amber-50 text-amber-600' },
    PAID:           { label: 'Fully Paid',  cls: 'bg-success/10 text-success' },
    PENDING:        { label: 'Pending',     cls: 'bg-amber-50 text-amber-600' },
    WAIVED:         { label: 'Waived',      cls: 'bg-border text-textMuted' },
    EXCLUDED:       { label: 'Excluded',    cls: 'bg-border text-textMuted' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-border text-textMuted' }
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', s.cls)}>
      {s.label}
    </span>
  )
}

const BILLING_MODES: { value: BillingMode; label: string; icon: string; desc: string }[] = [
  {
    value: 'SPLIT_EQUALLY',
    label: 'Split Equally',
    icon:  '⚖️',
    desc:  'Total bill divided among all tenants (prorated by days)',
  },
  {
    value: 'FIXED_PER_TENANT',
    label: 'Fixed Per Tenant',
    icon:  '💰',
    desc:  'Fixed monthly amount per tenant (prorated for partial month)',
  },
  {
    value: 'PER_ROOM_UNITS',
    label: 'Per Room Units',
    icon:  '🔌',
    desc:  'Enter units per room × rate (prorated by days)',
  },
]

const METER_TYPES: { value: MeterType; label: string; icon: string }[] = [
  { value: 'SINGLE',    label: 'One meter', icon: '🏢' },
  { value: 'PER_FLOOR', label: 'Per floor', icon: '🏬' },
  { value: 'PER_ROOM',  label: 'Per room',  icon: '🚪' },
]

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export function ElectricityPage() {
  const navigate        = useNavigate()
  const [tab, setTab]   = useState<'bills' | 'config'>('bills')

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-surface rounded-xl transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-textSecondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-textPrimary flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Electricity
          </h1>
          <p className="text-xs text-textSecondary">
            Manage electricity bills for your tenants
          </p>
        </div>
        <button
          onClick={() => setTab(t => t === 'bills' ? 'config' : 'bills')}
          className="p-2 hover:bg-surface rounded-xl transition-colors"
        >
          <Settings2 className="h-5 w-5 text-textSecondary" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface rounded-2xl p-1 mb-6">
        {(['bills', 'config'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 rounded-xl text-sm font-semibold transition-all',
              tab === t
                ? 'bg-primary text-white shadow-sm'
                : 'text-textSecondary'
            )}
          >
            {t === 'bills' ? 'Bills' : 'Settings'}
          </button>
        ))}
      </div>

      {tab === 'bills'
        ? <BillsTab />
        : <ConfigTab onSaved={() => setTab('bills')} />
      }
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BILLS TAB
// ═══════════════════════════════════════════════════════════════
function BillsTab() {
  const { data: config }              = useElectricityConfig()
  const { data: bills, isLoading }    = useElectricityBills()
  const [showGenerate, setShowGenerate] = useState(false)
  const [selectedBill, setSelectedBill] = useState<string | null>(null)

  if (isLoading) return <LoadingSkeleton />

  if (!config) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
          <Settings2 className="h-8 w-8 text-amber-500" />
        </div>
        <p className="font-semibold text-textPrimary">Setup Required</p>
        <p className="text-sm text-textSecondary">
          Configure electricity billing settings first
        </p>
      </div>
    )
  }

  if (selectedBill) {
    return (
      <BillDetail
        billId={selectedBill}
        onBack={() => setSelectedBill(null)}
      />
    )
  }

  if (showGenerate) {
    return (
      <GenerateBillForm
        config={config}
        onCancel={() => setShowGenerate(false)}
        onGenerated={() => setShowGenerate(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowGenerate(true)}
        className="w-full flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Generate New Bill
      </Button>

      {!bills?.length ? (
        <div className="text-center py-12 space-y-2">
          <ReceiptText className="h-10 w-10 text-textMuted mx-auto" />
          <p className="font-semibold text-textPrimary">No bills yet</p>
          <p className="text-sm text-textSecondary">
            Generate your first electricity bill
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map(bill => (
            <BillCard
              key={bill.id}
              bill={bill}
              onClick={() => setSelectedBill(bill.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Bill card ─────────────────────────────────────────────────
function BillCard({
  bill, onClick
}: {
  bill: ElectricityBillSummary
  onClick: () => void
}) {
  const paidPct = bill.totalTenants > 0
    ? Math.round((bill.paidTenants / bill.totalTenants) * 100)
    : 0

  const modeLabel: Record<string, string> = {
    SPLIT_EQUALLY:    'Split Equally',
    FIXED_PER_TENANT: 'Fixed Per Tenant',
    PER_ROOM_UNITS:   'Per Room Units',
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-surface border border-border rounded-2xl p-4 text-left hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-textPrimary">
            {formatDate(bill.billingPeriodFrom)} — {formatDate(bill.billingPeriodTo)}
          </p>
          <p className="text-xs text-textSecondary mt-0.5">
            {modeLabel[bill.billingMode] ?? bill.billingMode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(bill.status)}
          <ChevronRight className="h-4 w-4 text-textMuted" />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div>
          <p className="text-xs text-textSecondary">Total</p>
          <p className="text-sm font-bold text-textPrimary">
            {formatAmount(bill.totalDuesAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-textSecondary">Tenants</p>
          <p className="text-sm font-bold text-textPrimary">{bill.totalTenants}</p>
        </div>
        <div>
          <p className="text-xs text-textSecondary">Paid</p>
          <p className="text-sm font-bold text-success">{bill.paidTenants}</p>
        </div>
        <div>
          <p className="text-xs text-textSecondary">Pending</p>
          <p className="text-sm font-bold text-amber-600">{bill.pendingTenants}</p>
        </div>
      </div>

      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-success rounded-full transition-all"
          style={{ width: `${paidPct}%` }}
        />
      </div>
      <p className="text-[10px] text-textMuted mt-1">{paidPct}% collected</p>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// GENERATE BILL FORM
// ═══════════════════════════════════════════════════════════════
function GenerateBillForm({
  config, onCancel, onGenerated,
}: {
  config:      NonNullable<ReturnType<typeof useElectricityConfig>['data']>
  onCancel:    () => void
  onGenerated: () => void
}) {
  const today    = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split('T')[0]
  const lastDay  = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString().split('T')[0]

  const [from,         setFrom]         = useState(firstDay)
  const [to,           setTo]           = useState(lastDay)
  const [totalAmount,  setTotalAmount]  = useState('')
  const [fixedAmount,  setFixedAmount]  = useState(
    config.fixedAmountPerTenant?.toString() ?? ''
  )
  const [notes,        setNotes]        = useState('')
  const [preview,      setPreview]      = useState<BillPreview | null>(null)
  const [roomReadings, setRoomReadings] = useState<RoomReading[]>([])

  const previewMutation  = usePreviewBill()
  const generateMutation = useGenerateBill()

  const mode = config.billingMode

  const buildPayload = () => ({
    billingPeriodFrom:    from,
    billingPeriodTo:      to,
    totalAmount:          mode === 'SPLIT_EQUALLY'    ? Number(totalAmount) : null,
    fixedAmountPerTenant: mode === 'FIXED_PER_TENANT' ? Number(fixedAmount) : null,
    roomReadings:         mode === 'PER_ROOM_UNITS'   ? roomReadings        : undefined,
    notes:                notes || undefined,
  })

  const handlePreview = async () => {
    if (!from || !to) { toast.error('Select billing period'); return }
    if (mode === 'SPLIT_EQUALLY'    && !totalAmount)  { toast.error('Enter total bill amount'); return }
    if (mode === 'FIXED_PER_TENANT' && !fixedAmount)  { toast.error('Enter fixed amount'); return }
    const result = await previewMutation.mutateAsync(buildPayload())
    setPreview(result)
  }

  const handleGenerate = async () => {
    await generateMutation.mutateAsync(buildPayload())
    onGenerated()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-surface rounded-xl transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-textSecondary" />
        </button>
        <h2 className="font-bold text-textPrimary">Generate Bill</h2>
      </div>

      {/* Mode badge */}
      <div className="bg-primaryLight border border-primary/20 rounded-xl px-4 py-3">
        <p className="text-xs text-primary">
          <span className="font-semibold">Mode: </span>
          {mode === 'SPLIT_EQUALLY'    && 'Split Equally — total bill shared among tenants'}
          {mode === 'FIXED_PER_TENANT' && 'Fixed Per Tenant — each tenant pays fixed amount'}
          {mode === 'PER_ROOM_UNITS'   && 'Per Room Units — calculated from meter readings'}
        </p>
      </div>

      {/* Billing period */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-textPrimary flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Billing Period
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-textSecondary mb-1 block">From</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-textSecondary mb-1 block">To</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Mode-specific inputs */}
      {mode === 'SPLIT_EQUALLY' && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-textPrimary">Total Bill Amount</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary font-semibold">₹</span>
            <input
              type="number"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-background border border-border rounded-xl pl-7 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <p className="text-xs text-textSecondary">
            Enter your total electricity bill. System will split proportionally
            based on days each tenant stayed.
          </p>
        </div>
      )}

      {mode === 'FIXED_PER_TENANT' && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-textPrimary">Fixed Amount Per Tenant</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary font-semibold">₹</span>
            <input
              type="number"
              value={fixedAmount}
              onChange={e => setFixedAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full bg-background border border-border rounded-xl pl-7 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <p className="text-xs text-textSecondary">
            Each full-month tenant pays this amount. Partial month tenants pay prorated amount.
          </p>
        </div>
      )}

      {mode === 'PER_ROOM_UNITS' && (
        <RoomReadingsInput
          readings={roomReadings}
          perUnitRate={config.perUnitRate ?? 0}
          onChange={setRoomReadings}
        />
      )}

      {/* Notes */}
      <div>
        <label className="text-xs text-textSecondary mb-1 block">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. June 2026 BESCOM bill"
          rows={2}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none"
        />
      </div>

      {/* Preview results */}
      {preview && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-textPrimary flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Preview — {preview.activeTenants} tenants · {preview.totalDays} days
          </p>
          <div className="space-y-2">
            {preview.tenantDues.map(due => (
              <div
                key={due.tenantId}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-textPrimary">{due.tenantName}</p>
                  <p className="text-xs text-textSecondary">
                    Room {due.roomNumber} · {due.daysInPeriod}/{due.totalDays} days
                    {due.isPartialMonth && (
                      <span className="ml-1 text-amber-600 font-medium">(partial)</span>
                    )}
                  </p>
                </div>
                <p className="text-sm font-bold text-textPrimary">
                  {formatAmount(due.amount)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-sm font-bold text-textPrimary">Total</p>
            <p className="text-base font-bold text-primary">
              {formatAmount(preview.totalAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={handlePreview}
          disabled={previewMutation.isPending}
          className="flex-1"
        >
          {previewMutation.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : 'Preview'
          }
        </Button>
        {preview && (
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="flex-1"
          >
            {generateMutation.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : 'Confirm & Notify'
            }
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Room readings input ───────────────────────────────────────
function RoomReadingsInput({
  readings, perUnitRate, onChange
}: {
  readings:    RoomReading[]
  perUnitRate: number
  onChange:    (r: RoomReading[]) => void
}) {
  const addRoom = () =>
    onChange([...readings, { roomId: '', roomNumber: '', units: undefined, amount: undefined }])

  const update = (i: number, field: keyof RoomReading, val: string) => {
    const updated = [...readings]
    if (field === 'units') {
      const units = Number(val)
      updated[i] = { ...updated[i], units, amount: units * perUnitRate }
    } else if (field === 'amount') {
      updated[i] = { ...updated[i], amount: Number(val) }
    } else {
      updated[i] = { ...updated[i], [field]: val }
    }
    onChange(updated)
  }

  const remove = (i: number) => onChange(readings.filter((_, idx) => idx !== i))

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-textPrimary">Room Readings</p>
        <button
          onClick={addRoom}
          className="text-xs text-primary font-semibold flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add Room
        </button>
      </div>

      {readings.length === 0 && (
        <p className="text-xs text-textMuted text-center py-4">
          Add rooms to enter meter readings
        </p>
      )}

      {readings.map((r, i) => (
        <div key={i} className="bg-background rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <input
              value={r.roomNumber}
              onChange={e => update(i, 'roomNumber', e.target.value)}
              placeholder="Room number e.g. 101"
              className="text-sm font-medium bg-transparent outline-none text-textPrimary placeholder:text-textMuted flex-1"
            />
            <button onClick={() => remove(i)} className="text-danger p-1">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-textSecondary block mb-1">Units consumed</label>
              <input
                type="number"
                value={r.units ?? ''}
                onChange={e => update(i, 'units', e.target.value)}
                placeholder="0"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-textSecondary block mb-1">Amount (₹)</label>
              <input
                type="number"
                value={r.amount ?? ''}
                onChange={e => update(i, 'amount', e.target.value)}
                placeholder="auto"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          {perUnitRate > 0 && r.units != null && r.units > 0 && (
            <p className="text-xs text-textSecondary">
              {r.units} units × ₹{perUnitRate}/unit =
              <span className="font-semibold text-primary ml-1">
                ₹{(r.units * perUnitRate).toFixed(2)}
              </span>
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// BILL DETAIL
// ═══════════════════════════════════════════════════════════════
function BillDetail({ billId, onBack }: { billId: string; onBack: () => void }) {
  const { data: bill, isLoading } = useElectricityBill(billId)
  const markPaid = useMarkDuePaid(billId)
  const waive    = useWaiveDue(billId)
  const [payMode, setPayMode] = useState('CASH')

  if (isLoading) return <LoadingSkeleton />
  if (!bill)     return null

  const totalDues   = bill.dues.length
  const paidDues    = bill.dues.filter(d => d.status === 'PAID').length
  const pendingDues = bill.dues.filter(d => d.status === 'PENDING').length
  const paidPct     = totalDues > 0 ? Math.round((paidDues / totalDues) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-surface rounded-xl transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-textSecondary" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-textPrimary">Bill Details</h2>
          <p className="text-xs text-textSecondary">
            {formatDate(bill.billingPeriodFrom)} — {formatDate(bill.billingPeriodTo)}
          </p>
        </div>
        {statusBadge(bill.status)}
      </div>

      {/* Summary card */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-textSecondary">Total</p>
            <p className="text-base font-bold text-textPrimary">
              {formatAmount(bill.totalDuesAmount)}
            </p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-textSecondary">Paid</p>
            <p className="text-base font-bold text-success">{paidDues}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-textSecondary">Pending</p>
            <p className="text-base font-bold text-amber-600">{pendingDues}</p>
          </div>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all"
            style={{ width: `${paidPct}%` }}
          />
        </div>
        <p className="text-xs text-textMuted text-center">{paidPct}% collected</p>
      </div>

      {/* Dues list */}
      <div className="space-y-2">
        {bill.dues.map(due => (
          <div
            key={due.id}
            className="bg-surface border border-border rounded-2xl p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-textPrimary">{due.tenantName}</p>
                <p className="text-xs text-textSecondary">
                  Room {due.roomNumber} · {due.daysInPeriod}/{due.totalDaysInPeriod} days
                  {due.daysInPeriod < due.totalDaysInPeriod && (
                    <span className="ml-1 text-amber-600">(partial)</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-textPrimary">
                  {formatAmount(due.amount)}
                </p>
                {statusBadge(due.status)}
              </div>
            </div>

            {/* Actions for pending dues */}
            {due.status === 'PENDING' && (
              <div className="flex gap-2 mt-3">
                {/* Pay mode selector */}
                <select
                  value={payMode}
                  onChange={e => setPayMode(e.target.value)}
                  className="text-xs bg-background border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
                <Button
                  onClick={() => markPaid.mutate({
                    dueId: due.id,
                    data:  { paymentMode: payMode, paidDate: new Date().toISOString().split('T')[0] }
                  })}
                  disabled={markPaid.isPending}
                  className="flex-1 text-xs py-1.5"
                >
                  {markPaid.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : '✓ Mark Paid'
                  }
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => waive.mutate({ dueId: due.id })}
                  disabled={waive.isPending}
                  className="text-xs py-1.5 px-3"
                >
                  Waive
                </Button>
              </div>
            )}

            {/* Paid info */}
            {due.status === 'PAID' && due.paidDate && (
              <p className="text-xs text-success mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Paid on {formatDate(due.paidDate)}
                {due.paymentMode && ` via ${due.paymentMode}`}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      {bill.notes && (
        <div className="bg-surface border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-textSecondary">{bill.notes}</p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CONFIG TAB
// ═══════════════════════════════════════════════════════════════
function ConfigTab({ onSaved }: { onSaved: () => void }) {
  const { data: existing } = useElectricityConfig()
  const save               = useSaveElectricityConfig()

  const [mode,        setMode]        = useState<BillingMode>(
    (existing?.billingMode as BillingMode) ?? 'SPLIT_EQUALLY'
  )
  const [meterType,   setMeterType]   = useState<MeterType>(
    (existing?.meterType as MeterType) ?? 'SINGLE'
  )
  const [fixedAmount, setFixedAmount] = useState(
    existing?.fixedAmountPerTenant?.toString() ?? ''
  )
  const [unitRate,    setUnitRate]    = useState(
    existing?.perUnitRate?.toString() ?? ''
  )

  const handleSave = async () => {
    await save.mutateAsync({
      billingMode:           mode,
      meterType,
      fixedAmountPerTenant:  mode === 'FIXED_PER_TENANT' ? Number(fixedAmount) : null,
      perUnitRate:           mode === 'PER_ROOM_UNITS'   ? Number(unitRate)    : null,
    })
    onSaved()
  }

  return (
    <div className="space-y-5">
      {/* Billing mode */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold text-textPrimary">Billing Mode</p>
        <div className="space-y-2">
          {BILLING_MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                mode === m.value
                  ? 'border-primary bg-primaryLight'
                  : 'border-border bg-background hover:border-primary/30'
              )}
            >
              <span className="text-xl">{m.icon}</span>
              <div className="flex-1">
                <p className={cn(
                  'text-sm font-semibold',
                  mode === m.value ? 'text-primary' : 'text-textPrimary'
                )}>
                  {m.label}
                </p>
                <p className="text-xs text-textSecondary mt-0.5">{m.desc}</p>
              </div>
              {mode === m.value && (
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Meter type */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold text-textPrimary">Meter Setup</p>
        <div className="grid grid-cols-3 gap-2">
          {METER_TYPES.map(m => (
            <button
              key={m.value}
              onClick={() => setMeterType(m.value)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all',
                meterType === m.value
                  ? 'border-primary bg-primaryLight'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <span className="text-xl">{m.icon}</span>
              <p className={cn(
                'text-xs font-semibold',
                meterType === m.value ? 'text-primary' : 'text-textSecondary'
              )}>
                {m.label}
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs text-textMuted">
          This helps you know what readings to enter each month.
        </p>
      </div>

      {/* Mode-specific config */}
      {mode === 'FIXED_PER_TENANT' && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-textPrimary">Default Fixed Amount</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary font-semibold">₹</span>
            <input
              type="number"
              value={fixedAmount}
              onChange={e => setFixedAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full bg-background border border-border rounded-xl pl-7 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <p className="text-xs text-textSecondary">
            Default per-tenant amount (you can override when generating each bill)
          </p>
        </div>
      )}

      {mode === 'PER_ROOM_UNITS' && (
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-textPrimary">Per Unit Rate</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary font-semibold">₹</span>
            <input
              type="number"
              value={unitRate}
              onChange={e => setUnitRate(e.target.value)}
              placeholder="e.g. 8"
              className="w-full bg-background border border-border rounded-xl pl-7 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <p className="text-xs text-textSecondary">
            Cost per unit (kWh). Amount = units consumed × this rate.
          </p>
        </div>
      )}

      {/* Proration info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-amber-700 mb-2">⚡ Smart Proration</p>
        <p className="text-xs text-amber-600">
          Tenants who join or leave mid-month automatically get prorated bills.
          A tenant who joined on the 16th pays only for the days they stayed.
        </p>
      </div>

      <Button
        onClick={handleSave}
        disabled={save.isPending}
        className="w-full"
      >
        {save.isPending
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : 'Save Configuration'
        }
      </Button>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
      ))}
    </div>
  )
}