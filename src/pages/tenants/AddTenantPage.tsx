// src/pages/tenants/AddTenantPage.tsx
// 3-tab layout matching RentOk UX
// Tab 1: Tenant Details | Tab 2: Stay Details | Tab 3: Payment Details

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronDown, X, Search } from 'lucide-react'
import { useVacantBeds } from '@/hooks/useRooms'
import { useCreateTenant } from '@/hooks/useTenants'
import { INDIAN_PHONE_REGEX } from '@/lib/format'
import { handleApiError } from '@/lib/apiError'
import { cn } from '@/lib/utils'
import type { VacantBedOption } from '@/api/types'

// ── Schema ────────────────────────────────────────────────────
const schema = z.object({
  // Tab 1 — Tenant Details
  name:             z.string().min(2, 'Name required'),
  phone:            z.string().regex(INDIAN_PHONE_REGEX, 'Invalid phone'),
  altPhone:         z.string().optional(),
  whatsappReminder: z.boolean().default(true),
  bedId:            z.string().min(1, 'Select a bed'),
  stayType:         z.enum(['LONG', 'SHORT']).default('LONG'),

  // Tab 2 — Stay Details
  moveInDate:       z.string().min(1, 'Required'),
  moveOutExpected:  z.string().optional(),
  lockInPeriod:     z.coerce.number().default(6),
  noticePeriod:     z.coerce.number().default(30),
  agreementPeriod:  z.coerce.number().default(11),
  monthlyRent:      z.coerce.number().min(0),
  dueDay:           z.coerce.number().min(1).max(28).default(1),

  // Tab 3 — Payment Details
  securityDeposit:  z.coerce.number().min(0).default(0),
  advanceAmount:    z.coerce.number().min(0).default(0),
  depositPaidDate:  z.string().optional(),
  depositNotes:     z.string().optional(),
  tenantType:       z.string().optional(),
  referredBy:       z.string().optional(),
  notes:            z.string().optional(),
})

type Form = z.infer<typeof schema>

// ─────────────────────────────────────────────────────────────
// UI primitives
// ─────────────────────────────────────────────────────────────

function InlineRow({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center justify-between min-h-[52px] px-4 py-3">
        <span className="text-[13px] text-textSecondary w-28 flex-shrink-0">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
        <div className="flex-1 flex justify-end items-center min-w-0 overflow-hidden">{children}</div>
      </div>
      {error && <p className="text-[11px] text-red-500 px-4 pb-2 -mt-1">{error}</p>}
    </div>
  )
}

function InlineInput({ placeholder, value, onChange, type = 'text', maxLength }: {
  placeholder: string; value: string; onChange: (v: string) => void
  type?: string; maxLength?: number
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      maxLength={maxLength}
      placeholder={placeholder}
      inputMode={type === 'tel' ? 'numeric' : undefined}
      className="text-[13px] text-right text-textPrimary placeholder:text-textMuted bg-transparent outline-none min-w-0 flex-1 max-w-[180px]"
    />
  )
}

function InlineAmount({ value, onChange }: { value: number | string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[13px] text-textMuted">₹</span>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Amount"
        className="text-[13px] text-right text-textPrimary placeholder:text-textMuted bg-transparent outline-none min-w-0 flex-1 max-w-[140px]"
      />
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary flex-shrink-0">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </div>
  )
}

function TogglePills({ options, value, onChange }: {
  options: { label: string; value: string }[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex bg-surface rounded-full p-[3px] gap-[2px]">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn(
            'px-4 py-1 rounded-full text-[13px] font-medium transition-all',
            value === o.value ? 'bg-surface text-textPrimary shadow-sm' : 'text-textMuted'
          )}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Bottom Sheet ──────────────────────────────────────────────
function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-surface rounded-t-3xl max-h-[82vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <span className="font-semibold text-textPrimary text-[15px]">{title}</span>
          <button onClick={onClose}
            className="h-7 w-7 rounded-full bg-surface flex items-center justify-center">
            <X className="h-3.5 w-3.5 text-textSecondary" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pb-8">{children}</div>
      </div>
    </div>
  )
}

// ── Select Sheet ──────────────────────────────────────────────
function SelectSheet({ open, onClose, title, options, value, onChange }: {
  open: boolean; onClose: () => void; title: string
  options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {options.map(opt => (
        <button key={opt} type="button"
          onClick={() => { onChange(opt); onClose() }}
          className={cn(
            'w-full text-left px-5 py-4 border-b border-border',
            'flex items-center justify-between active:bg-surface',
            value === opt ? 'bg-primary/10' : ''
          )}>
          <span className="text-[14px] text-textPrimary">{opt}</span>
          <div className={cn(
            'h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0',
            value === opt ? 'border-[var(--primary,#2C6C28)]' : 'border-border'
          )}>
            {value === opt && <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary,#2C6C28)]" />}
          </div>
        </button>
      ))}
    </Sheet>
  )
}

// ── Room Picker Sheet ─────────────────────────────────────────
function RoomSheet({ open, onClose, beds, selectedBedId, onSelect }: {
  open: boolean; onClose: () => void; beds: VacantBedOption[]
  selectedBedId: string; onSelect: (bedId: string, rent: number) => void
}) {
  const [search, setSearch] = useState('')

  const rooms = useMemo(() => {
    const map = new Map<string, VacantBedOption[]>()
    for (const b of beds) {
      if (!map.has(b.roomNumber)) map.set(b.roomNumber, [])
      map.get(b.roomNumber)!.push(b)
    }
    return map
  }, [beds])

  const filtered = [...rooms.entries()].filter(([r]) =>
    r.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Sheet open={open} onClose={onClose} title="Select Units">
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-2.5">
          <Search className="h-4 w-4 text-textMuted flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search Units/Rooms"
            className="flex-1 bg-transparent text-[13px] outline-none text-textPrimary" />
        </div>
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-textMuted py-8">No vacant rooms found</p>
      )}
      {filtered.map(([roomNum, roomBeds]) => {
        const isSelected = roomBeds.some(b => b.bedId === selectedBedId)
        const hasVacant  = roomBeds.some(b => !b.isOccupied)
        return (
          <button key={roomNum} type="button"
            onClick={() => {
              const vacant = roomBeds.find(b => !b.isOccupied)
              if (vacant) { onSelect(vacant.bedId, vacant.rentPerBed); onClose() }
            }}
            disabled={!hasVacant}
            className={cn(
              'w-full text-left px-4 py-4 border-b border-border',
              'active:bg-[#f9f9f9]',
              isSelected ? 'bg-primary/10' : '',
              !hasVacant ? 'opacity-40' : ''
            )}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-textPrimary text-[15px]">{roomNum}</span>
              <span className="text-[13px] text-textSecondary">
                ₹{roomBeds[0]?.rentPerBed?.toLocaleString('en-IN')}/bed
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              {roomBeds.map((b, i) => (
                <span key={i} className={cn(
                  'text-[18px]',
                  b.isOccupied ? 'opacity-40' : 'opacity-100'
                )}>
                  {b.isOccupied ? '🛏' : '🛏'}
                </span>
              ))}
              <div className={cn(
                'ml-auto h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center',
                isSelected ? 'border-[var(--primary,#2C6C28)]' : 'border-border'
              )}>
                {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary,#2C6C28)]" />}
              </div>
            </div>
          </button>
        )
      })}
    </Sheet>
  )
}

// ── Move-out Sheet ────────────────────────────────────────────
function MoveOutSheet({ open, onClose, onSelect }: {
  open: boolean; onClose: () => void; onSelect: (v: string) => void
}) {
  const [selected, setSelected] = useState('Not sure')
  const options = ['Not sure', '3 Months', '6 Months', '9 Months', '10 Months', '11 Months', '1 Year', '2 Years']

  const pick = (opt: string) => {
    setSelected(opt)
    if (opt === 'Not sure') { onSelect(''); return }
    const d = new Date()
    const m = opt === '1 Year' ? 12 : opt === '2 Years' ? 24 : parseInt(opt)
    d.setMonth(d.getMonth() + m)
    onSelect(d.toISOString().slice(0, 10))
  }

  return (
    <Sheet open={open} onClose={onClose} title="Select Move-out Date">
      <div className="px-4 pt-3 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-textSecondary">Custom Date</span>
          <input type="date"
            onChange={e => { setSelected('custom'); onSelect(e.target.value); onClose() }}
            className="text-[13px] text-[var(--primary,#2C6C28)] outline-none bg-transparent" />
        </div>
      </div>
      {options.map(opt => (
        <button key={opt} type="button"
          onClick={() => { pick(opt); onClose() }}
          className={cn(
            'w-full text-left px-5 py-4 border-b border-border',
            'flex items-center justify-between active:bg-surface',
            selected === opt ? 'bg-primary/10' : ''
          )}>
          <span className="text-[14px] text-textPrimary">{opt}</span>
          <div className={cn(
            'h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0',
            selected === opt ? 'border-[var(--primary,#2C6C28)]' : 'border-border'
          )}>
            {selected === opt && <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary,#2C6C28)]" />}
          </div>
        </button>
      ))}
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export function AddTenantPage() {
  const [searchParams] = useSearchParams()
  const presetBed      = searchParams.get('bedId')
  const navigate       = useNavigate()
  const { data: beds = [], isLoading } = useVacantBeds()
  const create = useCreateTenant()

  const [activeTab, setActiveTab] = useState(0)

  // Sheet states
  const [showRoom,      setShowRoom]      = useState(false)
  const [showMoveOut,   setShowMoveOut]   = useState(false)
  const [showLockIn,    setShowLockIn]    = useState(false)
  const [showNotice,    setShowNotice]    = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [showDueDay,    setShowDueDay]    = useState(false)
  const [showTenantType,setShowTenantType]= useState(false)
  const [showReferredBy,setShowReferredBy]= useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      bedId:           presetBed ?? '',
      dueDay:          1,
      moveInDate:      new Date().toISOString().slice(0, 10),
      monthlyRent:     0,
      stayType:        'LONG',
      lockInPeriod:    6,
      noticePeriod:    30,
      agreementPeriod: 11,
      whatsappReminder: true,
      securityDeposit: 0,
      advanceAmount:   0,
      depositPaidDate: new Date().toISOString().slice(0, 10),
    },
  })

  const name            = watch('name')            ?? ''
  const phone           = watch('phone')           ?? ''
  const altPhone        = watch('altPhone')        ?? ''
  const bedId           = watch('bedId')           ?? ''
  const stayType        = watch('stayType')
  const moveInDate      = watch('moveInDate')
  const moveOutExpected = watch('moveOutExpected') ?? ''
  const lockInPeriod    = watch('lockInPeriod')
  const noticePeriod    = watch('noticePeriod')
  const agreementPeriod = watch('agreementPeriod')
  const monthlyRent     = watch('monthlyRent')
  const dueDay          = watch('dueDay')
  const securityDeposit = watch('securityDeposit')
  const advanceAmount   = watch('advanceAmount')
  const tenantType      = watch('tenantType')      ?? ''
  const referredBy      = watch('referredBy')      ?? ''
  const whatsapp        = watch('whatsappReminder')

  const selectedBed = beds.find(b => b.bedId === bedId)

  useEffect(() => {
    if (selectedBed) {
      setValue('monthlyRent',     selectedBed.rentPerBed)
      setValue('securityDeposit', selectedBed.rentPerBed * 2)
    }
  }, [selectedBed, setValue])

  useEffect(() => {
    if (presetBed && beds.length > 0) {
      const bed = beds.find(b => b.bedId === presetBed)
      if (bed) {
        setValue('bedId', presetBed)
        setValue('monthlyRent', bed.rentPerBed)
        setValue('securityDeposit', bed.rentPerBed * 2)
      }
    }
  }, [presetBed, beds, setValue])

  const formatDate = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const onSubmit = async (data: Form) => {
    try {
      await create.mutateAsync({
        bedId:           data.bedId,
        name:            data.name,
        phone:           data.phone,
        email:           undefined,
        emergencyContact: undefined,
        emergencyName:   undefined,
        moveInDate:      data.moveInDate,
        monthlyRent:     data.monthlyRent,
        dueDay:          data.dueDay,
        // Deposit
        securityDeposit: Number(data.securityDeposit) || 0,
        advanceAmount:   Number(data.advanceAmount)   || 0,
        depositPaidDate: data.depositPaidDate || undefined,
        depositNotes:    data.depositNotes    || undefined,
        // Stay details
        stayType:        data.stayType,
        lockInPeriod:    data.lockInPeriod,
        noticePeriod:    data.noticePeriod,
        agreementPeriod: data.agreementPeriod,
        tenantType:      data.tenantType      || undefined,
        referredBy:      data.referredBy      || undefined,
        moveOutExpected: data.moveOutExpected || undefined,
        notes:           data.notes           || undefined,
      })
      navigate('/tenants')
    } catch (e) {
      handleApiError(e)
    }
  }

  const TABS = ['Tenant\nDetails', 'Stay\nDetails', 'Payment\nDetails']

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-surface px-4 pt-4 pb-3 flex items-center gap-2 border-b border-border sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ChevronLeft className="h-5 w-5 text-textPrimary" />
        </button>
        <h1 className="text-[17px] font-bold text-textPrimary">Add Tenant</h1>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="bg-surface border-b border-border flex sticky top-[53px] z-10">
        {TABS.map((tab, i) => (
          <button key={i} type="button" onClick={() => setActiveTab(i)}
            className={cn(
              'flex-1 py-3 text-[11px] font-semibold text-center whitespace-pre-line leading-tight transition-colors',
              activeTab === i
                ? 'text-[var(--primary,#2C6C28)] border-b-2 border-[var(--primary,#2C6C28)]'
                : 'text-textMuted'
            )}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-28">

        {/* ════════════════════════════════════════════════════
            TAB 1 — Tenant Details
        ════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <div className="p-4 space-y-3">

            {/* Name + Phone */}
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
              <InlineRow label="Name" required error={errors.name?.message}>
                <InlineInput placeholder="Add Name" value={name} onChange={v => setValue('name', v)} />
              </InlineRow>
              <InlineRow label="Phone" required error={errors.phone?.message}>
                <InlineInput placeholder="Add Phone" value={phone}
                  onChange={v => setValue('phone', v)} type="tel" maxLength={10} />
              </InlineRow>
              <InlineRow label="Alt Phone">
                <InlineInput placeholder="Add Alt Phone" value={altPhone}
                  onChange={v => setValue('altPhone', v)} type="tel" maxLength={10} />
              </InlineRow>
            </div>

            {/* WhatsApp toggle */}
            <div className="bg-surface rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3">
              <div
                onClick={() => setValue('whatsappReminder', !whatsapp)}
                className={cn(
                  'h-5 w-5 rounded flex items-center justify-center cursor-pointer border-2 transition-colors',
                  whatsapp ? 'bg-[var(--primary,#2C6C28)] border-[var(--primary,#2C6C28)]' : 'border-border'
                )}>
                {whatsapp && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-[13px] text-textPrimary">Send WhatsApp Rent Reminder</span>
            </div>

            {/* Room selector */}
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
              <InlineRow label="Room/Bed" required error={errors.bedId?.message}>
                {isLoading ? (
                  <span className="text-[13px] text-textMuted">Loading...</span>
                ) : (
                  <button type="button" onClick={() => setShowRoom(true)}
                    className="flex items-center gap-1 text-[13px] font-semibold text-textPrimary">
                    {selectedBed
                      ? `Room ${selectedBed.roomNumber} · Bed ${selectedBed.bedLabel}`
                      : <span className="font-normal text-textMuted">Select Room</span>
                    }
                    <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                  </button>
                )}
              </InlineRow>
              {selectedBed && (
                <div className="px-4 pb-3 flex gap-2">
                  <span className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full font-medium',
                    selectedBed.isAc ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  )}>
                    {selectedBed.isAc ? 'AC' : 'Non-AC'}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface text-textSecondary font-medium">
                    {selectedBed.sharingType}-sharing
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                    ₹{selectedBed.rentPerBed}/bed
                  </span>
                </div>
              )}
            </div>

            {/* Stay Type */}
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
              <InlineRow label="Stay Type">
                <TogglePills
                  options={[{ label: 'Long', value: 'LONG' }, { label: 'Short', value: 'SHORT' }]}
                  value={stayType}
                  onChange={v => setValue('stayType', v as 'LONG' | 'SHORT')}
                />
              </InlineRow>
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB 2 — Stay Details
        ════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <div className="p-4 space-y-3">

            {/* Stay type repeat */}
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
              <InlineRow label="Stay Type">
                <TogglePills
                  options={[{ label: 'Long', value: 'LONG' }, { label: 'Short', value: 'SHORT' }]}
                  value={stayType}
                  onChange={v => setValue('stayType', v as 'LONG' | 'SHORT')}
                />
              </InlineRow>
            </div>

            {/* Dates */}
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
              <InlineRow label="Move-in" required>
                <input type="date" value={moveInDate}
                  onChange={e => setValue('moveInDate', e.target.value)}
                  className="text-[13px] text-textPrimary bg-transparent outline-none text-right" />
              </InlineRow>
              <InlineRow label="Move-out">
                <button type="button" onClick={() => setShowMoveOut(true)}
                  className="flex items-center gap-1 text-[13px] text-textPrimary">
                  {moveOutExpected
                    ? formatDate(moveOutExpected)
                    : <span className="text-textMuted">Select Date</span>
                  }
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </button>
              </InlineRow>
            </div>

            {/* Lock-in, Notice, Agreement — only for LONG */}
            {stayType === 'LONG' && (
              <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
                <InlineRow label="Lock-in Period">
                  <button type="button" onClick={() => setShowLockIn(true)}
                    className="flex items-center gap-1 text-[13px] font-semibold text-textPrimary">
                    {lockInPeriod} Months
                    <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                  </button>
                </InlineRow>
                <InlineRow label="Notice Period">
                  <button type="button" onClick={() => setShowNotice(true)}
                    className="flex items-center gap-1 text-[13px] font-semibold text-textPrimary">
                    {noticePeriod} Days
                    <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                  </button>
                </InlineRow>
                <InlineRow label="Agreement Period">
                  <button type="button" onClick={() => setShowAgreement(true)}
                    className="flex items-center gap-1 text-[13px] font-semibold text-textPrimary">
                    {agreementPeriod} Months
                    <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                  </button>
                </InlineRow>
              </div>
            )}

            {/* Rent */}
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
              <InlineRow label="Rental Frequency">
                <span className="text-[13px] font-semibold text-textPrimary flex items-center gap-1">
                  {stayType === 'SHORT' ? 'Daily' : 'Monthly'}
                  <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                </span>
              </InlineRow>
              <InlineRow label="Add Rent On">
                <button type="button" onClick={() => setShowDueDay(true)}
                  className="flex items-center gap-1 text-[13px] font-semibold text-textPrimary">
                  {dueDay === 1 ? '1st of month' : `${dueDay}th of month`}
                  <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                </button>
              </InlineRow>
              <InlineRow label="Fixed Rent" error={errors.monthlyRent?.message}>
                <InlineAmount
                  value={monthlyRent}
                  onChange={v => setValue('monthlyRent', Number(v))}
                />
              </InlineRow>
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════════════════
            TAB 3 — Payment Details
        ════════════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <div className="p-4 space-y-3">

            {/* Security Deposit */}
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
              <InlineRow label="Security Deposit">
                <InlineAmount
                  value={securityDeposit}
                  onChange={v => setValue('securityDeposit', Number(v))}
                />
              </InlineRow>
              <InlineRow label="Advance Amount">
                <InlineAmount
                  value={advanceAmount}
                  onChange={v => setValue('advanceAmount', Number(v))}
                />
              </InlineRow>
              <InlineRow label="Deposit Date">
                <input type="date"
                  {...register('depositPaidDate')}
                  className="text-[13px] text-textPrimary bg-transparent outline-none text-right" />
              </InlineRow>
              <InlineRow label="Deposit Notes">
                <input placeholder="e.g. Cash, Cheque no."
                  {...register('depositNotes')}
                  className="text-[13px] text-right text-textPrimary placeholder:text-textMuted bg-transparent outline-none min-w-0 flex-1 max-w-[180px]" />
              </InlineRow>
              {(Number(securityDeposit) > 0 || Number(advanceAmount) > 0) && (
                <div className="px-4 py-3 bg-[#f0fbf4] border-t border-[#e0f5e8]">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#4CAF50]">Total at move-in</span>
                    <span className="text-[14px] font-bold text-[#4CAF50]">
                      ₹{(Number(securityDeposit) + Number(advanceAmount)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Referred by + Tenant Type */}
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
              <InlineRow label="Referred by">
                <button type="button" onClick={() => setShowReferredBy(true)}
                  className="flex items-center gap-1 text-[13px] text-textPrimary">
                  {referredBy || <span className="text-textMuted">Referred by</span>}
                  <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                </button>
              </InlineRow>
              <InlineRow label="Tenant Type">
                <button type="button" onClick={() => setShowTenantType(true)}
                  className="flex items-center gap-1 text-[13px] text-textPrimary">
                  {tenantType || <span className="text-textMuted">Tenant Type</span>}
                  <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                </button>
              </InlineRow>
            </div>

            {/* Remarks */}
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
              <InlineRow label="Remarks">
                <input placeholder="Remarks" {...register('notes')}
                  className="text-[13px] text-right text-textPrimary placeholder:text-textMuted bg-transparent outline-none min-w-0 flex-1 max-w-[180px]" />
              </InlineRow>
            </div>

            {/* Opening balance preview */}
            <div className="bg-surface rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3.5 border-b border-border">
                <span className="text-[14px] font-semibold text-textPrimary">Opening Balance</span>
              </div>
              <div className="px-4 py-3.5">
                <p className="text-[13px] font-semibold text-textPrimary mb-2">
                  {new Date().toLocaleString('default', { month: 'long' })} Rent
                </p>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] text-textMuted">Due</span>
                  <span className="text-[13px] font-semibold text-red-500">
                    ₹{Number(monthlyRent).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-textMuted">Collection</span>
                  <span className="text-[13px] font-semibold text-green-500">₹0</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Add Tenant Button ────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-4 py-3 pb-safe">
        <button type="button" disabled={create.isPending}
          onClick={handleSubmit(onSubmit)}
          className="w-full bg-[var(--primary,#2C6C28)] text-white font-bold text-[15px] py-4 rounded-2xl disabled:opacity-60 active:opacity-90 transition-opacity">
          {create.isPending ? 'Adding...' : 'Add Tenant'}
        </button>
      </div>

      {/* ── Bottom Sheets ────────────────────────────────────── */}
      <RoomSheet
        open={showRoom} onClose={() => setShowRoom(false)}
        beds={beds} selectedBedId={bedId}
        onSelect={(id, rent) => {
          setValue('bedId', id)
          setValue('monthlyRent', rent)
          setValue('securityDeposit', rent * 2)
        }}
      />
      <MoveOutSheet
        open={showMoveOut} onClose={() => setShowMoveOut(false)}
        onSelect={v => setValue('moveOutExpected', v)}
      />
      <SelectSheet
        open={showLockIn} onClose={() => setShowLockIn(false)}
        title="Lock-in Period"
        options={['0 Months', '1 Month', '2 Months', '3 Months', '6 Months', '12 Months']}
        value={`${lockInPeriod} Months`}
        onChange={v => setValue('lockInPeriod', parseInt(v))}
      />
      <SelectSheet
        open={showNotice} onClose={() => setShowNotice(false)}
        title="Notice Period"
        options={['7 Days', '15 Days', '30 Days', '45 Days', '60 Days']}
        value={`${noticePeriod} Days`}
        onChange={v => setValue('noticePeriod', parseInt(v))}
      />
      <SelectSheet
        open={showAgreement} onClose={() => setShowAgreement(false)}
        title="Agreement Period"
        options={['6 Months', '11 Months', '12 Months', '24 Months']}
        value={`${agreementPeriod} Months`}
        onChange={v => setValue('agreementPeriod', parseInt(v))}
      />
      <SelectSheet
        open={showDueDay} onClose={() => setShowDueDay(false)}
        title="Add Rent On"
        options={['1st of month', '5th of month', '7th of month', '10th of month', '15th of month', '28th of month']}
        value={dueDay === 1 ? '1st of month' : `${dueDay}th of month`}
        onChange={v => {
          const d = parseInt(v)
          setValue('dueDay', isNaN(d) ? 1 : d)
        }}
      />
      <SelectSheet
        open={showTenantType} onClose={() => setShowTenantType(false)}
        title="Tenant Type"
        options={['Student', 'Working Professional', 'Bachelor', 'Family', 'Couple', 'Company', 'Property Staff', 'Relatives & Friends', 'Other']}
        value={tenantType}
        onChange={v => setValue('tenantType', v)}
      />
      <SelectSheet
        open={showReferredBy} onClose={() => setShowReferredBy(false)}
        title="Referred By"
        options={['NoBroker', 'MagicBricks', '99acres', 'Facebook', 'Instagram', 'WhatsApp', 'Word of mouth', 'Google', 'findpg.ownant.com', 'Other']}
        value={referredBy}
        onChange={v => setValue('referredBy', v)}
      />

    </div>
  )
}