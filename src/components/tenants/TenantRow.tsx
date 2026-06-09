import { useState } from 'react'
import { Phone, MessageCircle, LogOut, ShieldCheck, AlertCircle,  BellRing } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TenantListItem } from '@/api/types'
import { useSendReminder } from '@/hooks/useNotifications' // 🟢 Imported reminder mutation trigger
import { cn } from '@/lib/utils'
import { differenceInDays, parseISO, format, startOfDay } from 'date-fns'
import toast from 'react-hot-toast'
import { handleApiError } from '@/lib/apiError'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const THEMES = [
  { bg: 'from-emerald-500 to-teal-600', text: 'text-white' },
  { bg: 'from-blue-500 to-indigo-600', text: 'text-white' },
  { bg: 'from-purple-500 to-violet-600', text: 'text-white' },
  { bg: 'from-amber-500 to-orange-600', text: 'text-white' },
  { bg: 'from-rose-500 to-pink-600', text: 'text-white' },
]

export function TenantRow({ tenant }: { tenant: TenantListItem }) {
  const [showVacateModal, setShowVacateModal] = useState(false)
  const theme = THEMES[tenant.name.charCodeAt(0) % THEMES.length]
  const sendReminderMutation = useSendReminder() // 🟢 Initialized

  const isNotice  = tenant.status === 'NOTICE'
  const isVacated = tenant.status === 'VACATED'

  const roomNumber = tenant.bed?.roomNumber ?? tenant.roomNumber
  const bedLabel   = tenant.bed?.bedLabel   ?? tenant.bedLabel
  const moveOutDate = (tenant as any).moveOutDate as string | undefined

  const roomLine = [
    roomNumber ? `Room ${roomNumber}` : null,
    bedLabel   ? `Bed ${bedLabel}`   : null,
  ].filter(Boolean).join(' • ')

  // 🟢 Unified Unified Payment Parsing Engine (Mirrored with List page calculation)
  const paymentStatus = (() => {
    const cp = (tenant as any).currentPaymentStatus ?? tenant.currentMonthPayment?.status
    if (!cp) return null
    if (cp === 'PAID' || cp === 'WAIVED') return 'PAID'
    
    const dueDateStr = tenant.currentMonthPayment?.dueDate
    if ((cp === 'PENDING' || cp === 'PARTIAL') && dueDateStr) {
      const today = startOfDay(new Date())
      const due = startOfDay(parseISO(dueDateStr))
      
      if (due < today) return 'OVERDUE'
      const daysLeft = differenceInDays(due, today)
      if (daysLeft >= 0 && daysLeft <= 2) return 'DUE_SOON'
    }
    return 'PENDING'
  })()

  const daysOverdue = (() => {
    const dueDateStr = tenant.currentMonthPayment?.dueDate
    if (!dueDateStr || paymentStatus !== 'OVERDUE') return null
    return differenceInDays(startOfDay(new Date()), startOfDay(parseISO(dueDateStr)))
  })()

  // 🟢 Visibility flag logic rule
  const canSendReminder = paymentStatus === 'OVERDUE' || paymentStatus === 'DUE_SOON'

  const handleReminderDispatch = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await sendReminderMutation.mutateAsync(tenant.id)
      toast.success('WhatsApp Rent Reminder dispatched successfully!')
    } catch (err) {
      handleApiError(err)
    }
  }

  return (
    <>
      <div className={cn(
        "relative flex flex-col justify-between gap-3 rounded-2xl border bg-surface py-3 px-2.5 mx-2 mb-2.5 transition-all duration-200 border-border/70 shadow-sm",
        isNotice && "border-amber-200 bg-amber-50/20",
        isVacated && "opacity-50 bg-background/50 shadow-none"
      )}>
        
        {/* Core Info Profile Node */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link to={`/tenants/${tenant.id}`} className="shrink-0">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black tracking-wider bg-gradient-to-br shadow-sm", theme.bg, theme.text)}>
                {initials(tenant.name)}
              </div>
            </Link>

            <div className="min-w-0 flex-1">
              <Link to={`/tenants/${tenant.id}`}>
                <h4 className="text-sm font-bold tracking-tight text-textPrimary hover:text-primary transition-colors truncate">
                  {tenant.name}
                </h4>
              </Link>
              <div className="flex flex-col gap-0.5 mt-1">
                <p className="text-xs font-semibold text-textSecondary truncate">{roomLine || 'No Room Configured'}</p>
                
                {isNotice && moveOutDate && (
                  <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-0.5 truncate">
                    Out: {format(parseISO(moveOutDate), 'dd MMM yyyy')}
                  </p>
                )}
                
                {daysOverdue && daysOverdue > 0 && (
                  <span className="text-[11px] font-black text-danger flex items-center gap-0.5 mt-0.5">
                    ⚠️ {daysOverdue} days overdue
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price Console pane */}
          <div className="flex flex-col items-end gap-1 shrink-0 text-right">
            {tenant.monthlyRent != null && (
              <span className="text-sm font-black tracking-tight text-textPrimary">
                ₹{tenant.monthlyRent.toLocaleString('en-IN')}
              </span>
            )}
            
            {/* Payment Badge Renderer */}
            {paymentStatus === 'PAID' && (
              <span className="inline-flex items-center gap-0.5 rounded-lg bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success border border-success/10">
                <ShieldCheck className="h-3 w-3 stroke-[2.5]" /> Paid
              </span>
            )}
            {paymentStatus === 'OVERDUE' && (
              <span className="inline-flex items-center gap-0.5 rounded-lg bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger border border-danger/10 animate-pulse">
                <AlertCircle className="h-3 w-3 stroke-[2.5]" /> Overdue
              </span>
            )}
            {paymentStatus === 'DUE_SOON' && (
              <span className="inline-flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-200/40">
                Due Soon
              </span>
            )}
            {paymentStatus === 'PENDING' && (
              <span className="inline-flex items-center rounded-lg bg-background border border-border/80 px-2 py-0.5 text-[10px] font-bold text-textSecondary">
                Pending
              </span>
            )}
          </div>
        </div>

        <div className="w-full border-t border-gray-100/80 my-0.5" />

        {/* Dynamic Context Action Desk Section */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div>
            {/* 🟢 Render contextual reminder trigger button */}
            {canSendReminder ? (
              <button
                onClick={handleReminderDispatch}
                disabled={sendReminderMutation.isPending}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider transition active:scale-95 disabled:opacity-50 shadow-sm"
              >
                <BellRing className="h-3 w-3 stroke-[2.5] animate-bounce" /> 
                {sendReminderMutation.isPending ? 'Sending...' : 'Rent Reminder'}
              </button>
            ) : (
              <p className="text-[11px] font-semibold text-textSecondary italic">
                Account Status Active ✓
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {tenant.phone && (
              <a href={`tel:${tenant.phone}`} className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-xl bg-background border border-border/70 text-xs font-bold text-textSecondary transition active:bg-gray-50">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            )}

            {isNotice ? (
              <button onClick={() => setShowVacateModal(true)} className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-xl bg-danger/10 border border-danger/10 text-xs font-bold text-danger transition active:bg-danger/20">
                <LogOut className="h-3.5 w-3.5" /> Release Bed
              </button>
            ) : (
              tenant.phone && (
                <a href={`https://wa.me/91${tenant.phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-xl bg-success/10 border border-success/10 text-xs font-bold text-success transition active:opacity-80">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              )
            )}
          </div>
        </div>

      </div>
    </>
  )
}