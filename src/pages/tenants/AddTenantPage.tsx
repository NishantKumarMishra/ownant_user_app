// src/pages/tenants/AddTenantPage.tsx

import { useEffect, useMemo, useRef, useState } from 'react'
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
  name:             z.string().min(2, 'Name required'),
  phone:            z.string().regex(INDIAN_PHONE_REGEX, 'Invalid phone'),
  altPhone:         z.string().optional(),
  whatsappReminder: z.boolean().default(true),
  bedId:            z.string().min(1, 'Select a bed'),
  stayType:         z.enum(['LONG', 'SHORT']).default('LONG'),
  moveInDate:       z.string().min(1, 'Required'),
  moveOutExpected:  z.string().optional(),
  lockInPeriod:     z.coerce.number().default(6),
  noticePeriod:     z.coerce.number().default(30),
  agreementPeriod:  z.coerce.number().default(11),
  monthlyRent:      z.coerce.number().min(0),
  dueDay:           z.coerce.number().min(1).max(28).default(1),
  securityDeposit:  z.coerce.number().min(0).default(0),
  advanceAmount:    z.coerce.number().min(0).default(0),
  depositPaidDate:  z.string().optional(),
  depositNotes:     z.string().optional(),
  tenantType:       z.string().optional(),
  referredBy:       z.string().optional(),
  notes:            z.string().optional(),
})
type Form = z.infer<typeof schema>

// ── Contact book icon (matches screenshot) ────────────────────
function ContactIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="14" height="20" rx="2" stroke="var(--primary,#2C6C28)" strokeWidth="1.6"/>
      <path d="M2 7h2M2 12h2M2 17h2" stroke="var(--primary,#2C6C28)" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="11" cy="9" r="2.5" stroke="var(--primary,#2C6C28)" strokeWidth="1.4"/>
      <path d="M7 16c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="var(--primary,#2C6C28)" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

// ── Calendar icon ─────────────────────────────────────────────
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary,#2C6C28)" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

// ── Form row ──────────────────────────────────────────────────
function InlineRow({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between min-h-[64px] px-4 py-3">
        <span className="text-[15px] text-gray-500 w-36 flex-shrink-0 font-medium">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </span>
        <div className="flex-1 flex justify-end items-center gap-2 min-w-0">{children}</div>
      </div>
      {error && <p className="text-[12px] text-red-500 px-4 pb-2 -mt-1">{error}</p>}
    </div>
  )
}

// ── Text input (right-aligned, with optional icon) ────────────
function InlineInput({ placeholder, value, onChange, type = 'text', maxLength, icon }: {
  placeholder: string; value: string; onChange: (v: string) => void
  type?: string; maxLength?: number; icon?: React.ReactNode
}) {
  return (
    <>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        inputMode={type === 'tel' ? 'numeric' : undefined}
        className="text-[15px] text-right text-gray-800 placeholder:text-gray-300 bg-transparent outline-none min-w-0 flex-1"
      />
      {icon && <span className="flex-shrink-0">{icon}</span>}
    </>
  )
}

// ── Amount input ──────────────────────────────────────────────
function InlineAmount({ value, onChange }: { value: number | string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[15px] text-gray-400">₹</span>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        className="text-[15px] text-right text-gray-800 placeholder:text-gray-300 bg-transparent outline-none min-w-0 w-28"
      />
    </div>
  )
}

// ── Toggle pills (Long / Short) ───────────────────────────────
function TogglePills({ options, value, onChange }: {
  options: { label: string; value: string }[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex bg-gray-100 rounded-full p-[3px] gap-[2px]">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn(
            'px-5 py-1.5 rounded-full text-[13px] font-medium transition-all',
            value === o.value
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-400'
          )}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Bottom sheet wrapper ──────────────────────────────────────
function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[82vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <span className="font-semibold text-gray-800 text-[15px]">{title}</span>
          <button onClick={onClose} className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pb-8">{children}</div>
      </div>
    </div>
  )
}

// ── Generic select sheet ──────────────────────────────────────
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
            'w-full text-left px-5 py-4 border-b border-gray-100',
            'flex items-center justify-between',
            value === opt ? 'bg-primary/5' : ''
          )}>
          <span className="text-[14px] text-gray-800">{opt}</span>
          <div className={cn(
            'h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0',
            value === opt ? 'border-[var(--primary,#2C6C28)]' : 'border-gray-200'
          )}>
            {value === opt && <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary,#2C6C28)]" />}
          </div>
        </button>
      ))}
    </Sheet>
  )
}

// ── Room picker sheet ─────────────────────────────────────────
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
    <Sheet open={open} onClose={onClose} title="Select Room / Bed">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="flex-1 bg-transparent text-[13px] outline-none text-gray-800" />
        </div>
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">No vacant rooms found</p>
      )}
      {filtered.map(([roomNum, roomBeds]) => {
        const isSelected = roomBeds.some(b => b.bedId === selectedBedId)
        const hasVacant = roomBeds.some(b => !b.isOccupied)
        return (
          <button key={roomNum} type="button"
            onClick={() => {
              const vacant = roomBeds.find(b => !b.isOccupied)
              if (vacant) { onSelect(vacant.bedId, vacant.rentPerBed); onClose() }
            }}
            disabled={!hasVacant}
            className={cn(
              'w-full text-left px-4 py-4 border-b border-gray-100',
              isSelected ? 'bg-primary/5' : '',
              !hasVacant ? 'opacity-40' : ''
            )}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-gray-800 text-[15px]">{roomNum}</span>
              <span className="text-[13px] text-gray-500">
                ₹{roomBeds[0]?.rentPerBed?.toLocaleString('en-IN')}/bed
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {roomBeds.map((b, i) => (
                <span key={i} className={cn('text-[16px]', b.isOccupied ? 'opacity-30' : 'opacity-100')}>🛏</span>
              ))}
              <div className={cn(
                'ml-auto h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center',
                isSelected ? 'border-[var(--primary,#2C6C28)]' : 'border-gray-200'
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

// ── Move-out picker ───────────────────────────────────────────
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
    <Sheet open={open} onClose={onClose} title="Move-out Date">
      <div className="px-4 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-500">Custom Date</span>
          <input type="date"
            onChange={e => { setSelected('custom'); onSelect(e.target.value); onClose() }}
            className="text-[13px] text-[var(--primary,#2C6C28)] outline-none bg-transparent" />
        </div>
      </div>
      {options.map(opt => (
        <button key={opt} type="button"
          onClick={() => { pick(opt); onClose() }}
          className={cn(
            'w-full text-left px-5 py-4 border-b border-gray-100 flex items-center justify-between',
            selected === opt ? 'bg-primary/5' : ''
          )}>
          <span className="text-[14px] text-gray-800">{opt}</span>
          <div className={cn(
            'h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0',
            selected === opt ? 'border-[var(--primary,#2C6C28)]' : 'border-gray-200'
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
  const presetBed = searchParams.get('bedId')
  const navigate  = useNavigate()
  const { data: beds = [], isLoading } = useVacantBeds()
  const create = useCreateTenant()

  const [activeTab, setActiveTab] = useState(0)

  // Refs for each section + scroll container
  const scrollRef   = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])
  // Prevent observer from fighting tab clicks
  const isScrollingTo = useRef(false)

  const [showRoom,       setShowRoom]       = useState(false)
  const [showMoveOut,    setShowMoveOut]    = useState(false)
  const [showLockIn,     setShowLockIn]     = useState(false)
  const [showNotice,     setShowNotice]     = useState(false)
  const [showAgreement,  setShowAgreement]  = useState(false)
  const [showDueDay,     setShowDueDay]     = useState(false)
  const [showTenantType, setShowTenantType] = useState(false)
  const [showReferredBy, setShowReferredBy] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      bedId:            presetBed ?? '',
      dueDay:           1,
      moveInDate:       new Date().toISOString().slice(0, 10),
      monthlyRent:      0,
      stayType:         'LONG',
      lockInPeriod:     6,
      noticePeriod:     30,
      agreementPeriod:  11,
      whatsappReminder: true,
      securityDeposit:  0,
      advanceAmount:    0,
      depositPaidDate:  new Date().toISOString().slice(0, 10),
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
        setValue('monthlyRent',     bed.rentPerBed)
        setValue('securityDeposit', bed.rentPerBed * 2)
      }
    }
  }, [presetBed, beds, setValue])

  // ── IntersectionObserver: update active tab while scrolling ──
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const observers = sectionRefs.current.map((section, i) => {
      if (!section) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          // Only update tab if user is naturally scrolling (not programmatic)
          if (entry.isIntersecting && !isScrollingTo.current) {
            setActiveTab(i)
          }
        },
        {
          root: null,
          // Fire when section top crosses 40% from top of scroll container
          rootMargin: '-40% 0px -55% 0px',
          threshold: 0,
        }
      )
      obs.observe(section)
      return obs
    })

    return () => observers.forEach(o => o?.disconnect())
  }, [])

  // ── Tab click: scroll to section ─────────────────────────────
  const scrollToTab = (i: number) => {
    const section = sectionRefs.current[i]
    const container = scrollRef.current
    if (!section || !container) return

    isScrollingTo.current = true
    setActiveTab(i)

    const headerHeight = 106 // header (~53px) + tabs (~53px)
    const top = section.getBoundingClientRect().top + window.scrollY - headerHeight
    window.scrollTo({ top, behavior: "smooth" })

    // Re-enable observer after scroll settles
    setTimeout(() => { isScrollingTo.current = false }, 800)
  }

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
        securityDeposit: Number(data.securityDeposit) || 0,
        advanceAmount:   Number(data.advanceAmount)   || 0,
        depositPaidDate: data.depositPaidDate || undefined,
        depositNotes:    data.depositNotes    || undefined,
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

  const TABS = [
    { label: 'Tenant',  sub: 'Details' },
    { label: 'Stay',    sub: 'Details' },
    { label: 'Payment', sub: 'Details' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky header + tabs block ── */}
      <div className="fixed top-0 left-0 right-0 z-20">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3" style={{ background: "#EAF3E9" }}>
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-full active:bg-green-100">
          <ChevronLeft className="h-5 w-5 text-gray-800" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">Add Tenant</h1>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-100 bg-white">
        {TABS.map((tab, i) => (
          <button key={i} type="button" onClick={() => scrollToTab(i)}
            className={cn(
              'flex-1 pt-3 pb-2.5 flex flex-col items-center gap-0 transition-colors relative',
              activeTab === i ? 'text-[#2C6C28]' : 'text-[#2C6C28]/50'
            )}>
            <span className={cn('text-[13px] leading-tight', activeTab === i ? 'font-bold' : 'font-medium')}>
              {tab.label}
            </span>
            <span className={cn('text-[13px] leading-tight', activeTab === i ? 'font-bold' : 'font-medium')}>
              {tab.sub}
            </span>
            {activeTab === i && (
              <span className="absolute bottom-0 left-4 right-4 h-[2.5px] bg-[var(--primary,#2C6C28)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      </div> {/* end sticky block */}

      {/* ── Single scrollable page — all 3 sections stacked ── */}
      <div ref={scrollRef} className="flex-1 pb-28 pt-[106px]">

        {/* ── SECTION 1: Tenant Details ── */}
        <div ref={el => { sectionRefs.current[0] = el }} className="py-3 space-y-[1px]">

          <div className="bg-white overflow-hidden border-t border-b border-gray-100">
            <InlineRow label="Name" required error={errors.name?.message}>
              <InlineInput placeholder="Add Name" value={name}
                onChange={v => setValue('name', v)} icon={<ContactIcon />} />
            </InlineRow>
            <InlineRow label="Phone" required error={errors.phone?.message}>
              <InlineInput placeholder="Add Phone" value={phone}
                onChange={v => setValue('phone', v)} type="tel" maxLength={10} icon={<ContactIcon />} />
            </InlineRow>
            <InlineRow label="Alt Phone">
              <InlineInput placeholder="Add Alt Phone" value={altPhone}
                onChange={v => setValue('altPhone', v)} type="tel" maxLength={10} icon={<ContactIcon />} />
            </InlineRow>
          </div>

          <div className="bg-white px-4 py-3.5 flex items-center gap-3">
            <button type="button"
              onClick={() => setValue('whatsappReminder', !whatsapp)}
              className={cn(
                'h-5 w-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                whatsapp ? 'bg-[var(--primary,#2C6C28)] border-[var(--primary,#2C6C28)]' : 'border-gray-300'
              )}>
              {whatsapp && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className="text-[13px] text-gray-700">Send WhatsApp Rent Reminder</span>
          </div>

          <div className="bg-white overflow-hidden border-t border-b border-gray-100">
            <InlineRow label="Property">
              <span className="text-[13px] font-semibold text-gray-800 flex items-center gap-1">
                {selectedBed?.roomNumber
                  ? 'Selected PG'
                  : <span className="font-normal text-gray-400">Select Property</span>
                }
                <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
              </span>
            </InlineRow>
            <InlineRow label="Room/Flat" required error={errors.bedId?.message}>
              {isLoading ? (
                <span className="text-[13px] text-gray-400">Loading...</span>
              ) : (
                <button type="button" onClick={() => setShowRoom(true)}
                  className="flex items-center gap-1 text-[15px] font-semibold text-gray-800">
                  {selectedBed
                    ? `Room ${selectedBed.roomNumber} · Bed ${selectedBed.bedLabel}`
                    : <span className="font-normal text-gray-400">Select Room</span>
                  }
                  <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                </button>
              )}
            </InlineRow>
            {selectedBed && (
              <div className="px-4 pb-3 flex gap-2 flex-wrap">
                <span className={cn('text-[11px] px-2.5 py-0.5 rounded-full font-medium',
                  selectedBed.isAc ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')}>
                  {selectedBed.isAc ? 'AC' : 'Non-AC'}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                  {selectedBed.sharingType}-sharing
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                  ₹{selectedBed.rentPerBed}/bed
                </span>
              </div>
            )}
          </div>

       

        </div>

        {/* ── SECTION 2: Stay Details ── */}
        <div ref={el => { sectionRefs.current[1] = el }} className="pb-3 space-y-[1px]">

          <div className="bg-white overflow-hidden border-t border-b border-gray-100">
            <InlineRow label="Stay Type">
              <TogglePills
                options={[{ label: 'Long', value: 'LONG' }, { label: 'Short', value: 'SHORT' }]}
                value={stayType} onChange={v => setValue('stayType', v as 'LONG' | 'SHORT')} />
            </InlineRow>
          </div>

          <div className="bg-white overflow-hidden border-t border-b border-gray-100">
            <InlineRow label="Move-in" required>
              <div className="flex items-center gap-2">
                <input type="date" value={moveInDate}
                  onChange={e => {
                    setValue('moveInDate', e.target.value)
                    const day = new Date(e.target.value).getDate()
                    if (day) setValue('dueDay', Math.min(day, 28))
                  }}
                  className="text-[13px] text-gray-800 bg-transparent outline-none text-right" />
                <CalendarIcon />
              </div>
            </InlineRow>

            <InlineRow label="Due Day">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-gray-400">Day</span>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={dueDay}
                  onChange={e => {
                    const v = Math.min(28, Math.max(1, Number(e.target.value)))
                    setValue('dueDay', v)
                  }}
                  className="text-[13px] font-semibold text-gray-800 bg-gray-100 rounded-lg px-2 py-1 w-14 text-center outline-none"
                />
                <span className="text-[12px] text-gray-400">of every month</span>
              </div>
            </InlineRow>

            <InlineRow label="Move-out">
              <button type="button" onClick={() => setShowMoveOut(true)}
                className="flex items-center gap-2 text-[15px] text-gray-800">
                {moveOutExpected
                  ? formatDate(moveOutExpected)
                  : <span className="text-gray-400">Select Date</span>
                }
                <CalendarIcon />
              </button>
            </InlineRow>
          </div>

          {stayType === 'LONG' && (
            <div className="bg-white overflow-hidden border-t border-b border-gray-100">
              <InlineRow label="Lock-in Period">
                <button type="button" onClick={() => setShowLockIn(true)}
                  className="flex items-center gap-1 text-[15px] font-semibold text-gray-800">
                  {lockInPeriod} Months
                  <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                </button>
              </InlineRow>
              <InlineRow label="Notice Period">
                <button type="button" onClick={() => setShowNotice(true)}
                  className="flex items-center gap-1 text-[15px] font-semibold text-gray-800">
                  {noticePeriod} Days
                  <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                </button>
              </InlineRow>
              <InlineRow label="Agreement">
                <button type="button" onClick={() => setShowAgreement(true)}
                  className="flex items-center gap-1 text-[15px] font-semibold text-gray-800">
                  {agreementPeriod} Months
                  <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
                </button>
              </InlineRow>
            </div>
          )}

          <div className="bg-white overflow-hidden border-t border-b border-gray-100">
            <InlineRow label="Rental Frequency">
              <span className="text-[13px] font-semibold text-gray-800 flex items-center gap-1">
                {stayType === 'SHORT' ? 'Daily' : 'Monthly'}
                <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
              </span>
            </InlineRow>
            <InlineRow label="Add Rent On">
              <span className="text-[13px] font-semibold text-gray-800">
                {dueDay === 1 ? '1st' : dueDay === 2 ? '2nd' : dueDay === 3 ? '3rd' : `${dueDay}th`} of month
              </span>
            </InlineRow>
            <InlineRow label="Fixed Rent" error={errors.monthlyRent?.message}>
              <InlineAmount value={monthlyRent} onChange={v => setValue('monthlyRent', Number(v))} />
            </InlineRow>
          </div>

        </div>

        {/* ── SECTION 3: Payment Details ── */}
        <div ref={el => { sectionRefs.current[2] = el }} className="pb-3 space-y-[1px]">

          <div className="bg-white overflow-hidden border-t border-b border-gray-100">
            <InlineRow label="Security Deposit">
              <InlineAmount value={securityDeposit} onChange={v => setValue('securityDeposit', Number(v))} />
            </InlineRow>
            <InlineRow label="Advance Amount">
              <InlineAmount value={advanceAmount} onChange={v => setValue('advanceAmount', Number(v))} />
            </InlineRow>
            <InlineRow label="Deposit Date">
              <input type="date" {...register('depositPaidDate')}
                className="text-[13px] text-gray-800 bg-transparent outline-none text-right" />
            </InlineRow>
            <InlineRow label="Deposit Notes">
              <input placeholder="e.g. Cash, Cheque no." {...register('depositNotes')}
                className="text-[13px] text-right text-gray-800 placeholder:text-gray-300 bg-transparent outline-none flex-1 min-w-0" />
            </InlineRow>
            {(Number(securityDeposit) > 0 || Number(advanceAmount) > 0) && (
              <div className="px-4 py-3 bg-green-50 border-t border-green-100">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-green-600">Total at move-in</span>
                  <span className="text-[14px] font-bold text-green-600">
                    ₹{(Number(securityDeposit) + Number(advanceAmount)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white overflow-hidden border-t border-b border-gray-100">
            <InlineRow label="Referred by">
              <button type="button" onClick={() => setShowReferredBy(true)}
                className="flex items-center gap-1 text-[15px] text-gray-800">
                {referredBy || <span className="text-gray-400">Select source</span>}
                <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
              </button>
            </InlineRow>
            <InlineRow label="Tenant Type">
              <button type="button" onClick={() => setShowTenantType(true)}
                className="flex items-center gap-1 text-[15px] text-gray-800">
                {tenantType || <span className="text-gray-400">Select type</span>}
                <ChevronDown className="h-4 w-4 text-[var(--primary,#2C6C28)]" />
              </button>
            </InlineRow>
          </div>

          <div className="bg-white overflow-hidden border-t border-b border-gray-100">
            <InlineRow label="Remarks">
              <input placeholder="Any notes..." {...register('notes')}
                className="text-[13px] text-right text-gray-800 placeholder:text-gray-300 bg-transparent outline-none flex-1 min-w-0" />
            </InlineRow>
          </div>

          <div className="bg-white overflow-hidden border-t border-b border-gray-100">
            <div className="px-4 py-3.5 border-b border-gray-100">
              <span className="text-[14px] font-semibold text-gray-800">Opening Balance</span>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[13px] font-semibold text-gray-800 mb-2">
                {new Date().toLocaleString('default', { month: 'long' })} Rent
              </p>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] text-gray-400">Due</span>
                <span className="text-[13px] font-semibold text-red-500">
                  ₹{Number(monthlyRent).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-gray-400">Collection</span>
                <span className="text-[13px] font-semibold text-green-500">₹0</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Add Tenant Button ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button type="button" disabled={create.isPending}
          onClick={handleSubmit(onSubmit)}
          className="w-full bg-[var(--primary,#2C6C28)] text-white font-bold text-[15px] py-4 rounded-2xl disabled:opacity-60 active:opacity-90 transition-opacity"
          style={{ boxShadow: '0 4px 20px rgba(44,108,40,0.35)' }}>
          {create.isPending ? 'Adding...' : 'Add Tenant'}
        </button>
      </div>

      {/* ── Sheets ── */}
      <RoomSheet open={showRoom} onClose={() => setShowRoom(false)}
        beds={beds} selectedBedId={bedId}
        onSelect={(id, rent) => { setValue('bedId', id); setValue('monthlyRent', rent); setValue('securityDeposit', rent * 2) }} />
      <MoveOutSheet open={showMoveOut} onClose={() => setShowMoveOut(false)}
        onSelect={v => setValue('moveOutExpected', v)} />
      <SelectSheet open={showLockIn} onClose={() => setShowLockIn(false)} title="Lock-in Period"
        options={['0 Months', '1 Month', '2 Months', '3 Months', '6 Months', '12 Months']}
        value={`${lockInPeriod} Months`} onChange={v => setValue('lockInPeriod', parseInt(v))} />
      <SelectSheet open={showNotice} onClose={() => setShowNotice(false)} title="Notice Period"
        options={['7 Days', '15 Days', '30 Days', '45 Days', '60 Days']}
        value={`${noticePeriod} Days`} onChange={v => setValue('noticePeriod', parseInt(v))} />
      <SelectSheet open={showAgreement} onClose={() => setShowAgreement(false)} title="Agreement Period"
        options={['6 Months', '11 Months', '12 Months', '24 Months']}
        value={`${agreementPeriod} Months`} onChange={v => setValue('agreementPeriod', parseInt(v))} />
      <SelectSheet open={showDueDay} onClose={() => setShowDueDay(false)} title="Add Rent On"
        options={['1st of month', '5th of month', '7th of month', '10th of month', '15th of month', '28th of month']}
        value={dueDay === 1 ? '1st of month' : `${dueDay}th of month`}
        onChange={v => { const d = parseInt(v); setValue('dueDay', isNaN(d) ? 1 : d) }} />
      <SelectSheet open={showTenantType} onClose={() => setShowTenantType(false)} title="Tenant Type"
        options={['Student', 'Working Professional', 'Bachelor', 'Family', 'Couple', 'Company', 'Property Staff', 'Relatives & Friends', 'Other']}
        value={tenantType} onChange={v => setValue('tenantType', v)} />
      <SelectSheet open={showReferredBy} onClose={() => setShowReferredBy(false)} title="Referred By"
        options={['NoBroker', 'MagicBricks', '99acres', 'Facebook', 'Instagram', 'WhatsApp', 'Word of mouth', 'Google', 'findpg.ownant.com', 'Other']}
        value={referredBy} onChange={v => setValue('referredBy', v)} />
    </div>
  )
}