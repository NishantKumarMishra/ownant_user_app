// src/components/checkin/CheckinStatusCard.tsx
// Drop into TenantDetailPage with: <CheckinStatusCard tenantId={tenant.id} />

import { FileText, CheckCircle, Clock, AlertCircle, ExternalLink, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCheckinDetail } from '@/hooks/useCheckin'
import { Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import api from '@/api/axios'
import { useState } from 'react'

function StatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') return (
    <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
      <CheckCircle className="h-3.5 w-3.5" /> Completed
    </span>
  )
  if (status === 'KYC_DONE') return (
    <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
      <Clock className="h-3.5 w-3.5" /> KYC Done
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
      <AlertCircle className="h-3.5 w-3.5" /> Pending
    </span>
  )
}

function StepRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0',
        done ? 'bg-success' : 'bg-border'
      )}>
        {done
          ? <CheckCircle className="h-3.5 w-3.5 text-white" />
          : <div className="h-2 w-2 rounded-full bg-textMuted" />
        }
      </div>
      <p className={cn(
        'text-sm',
        done ? 'text-textPrimary font-medium' : 'text-textSecondary'
      )}>
        {label}
      </p>
    </div>
  )
}

export function CheckinStatusCard({ tenantId }: { tenantId: string }) {
  const { data: checkin, isLoading, isError } = useCheckinDetail(tenantId)
  const [resending, setResending] = useState(false)

  const handleResend = async () => {
    setResending(true)
    try {
      await api.post(`/tenants/${tenantId}/checkin/resend`)
      toast.success('Checkin invite resent via WhatsApp!')
    } catch {
      toast.error('Failed to resend invite')
    } finally {
      setResending(false)
    }
  }

  if (isLoading) return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )

  // No checkin record — show invite option
  if (isError || !checkin) return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-textSecondary" />
        <h3 className="text-sm font-semibold text-textPrimary">Digital Check-in</h3>
      </div>
      <p className="text-xs text-textSecondary mb-3">
        No checkin record found. Send an invite to the tenant.
      </p>
      <button
        onClick={handleResend}
        disabled={resending}
        className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline disabled:opacity-60"
      >
        <Send className="h-3.5 w-3.5" />
        {resending ? 'Sending...' : 'Send Checkin Invite'}
      </button>
    </div>
  )

  const kycDone  = checkin.status === 'KYC_DONE' || checkin.status === 'COMPLETED'
  const signed   = checkin.status === 'COMPLETED'

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-textSecondary" />
          <h3 className="text-sm font-semibold text-textPrimary">Digital Check-in</h3>
        </div>
        <StatusBadge status={checkin.status} />
      </div>

      {/* Steps */}
      <div className="space-y-2.5">
        <StepRow done={true} label="Invite sent via WhatsApp" />
        <StepRow done={kycDone} label={kycDone
          ? `KYC verified · ${checkin.idProofType ?? 'ID proof'}`
          : 'KYC pending'
        } />
        <StepRow done={signed} label={signed ? 'Agreement signed' : 'Agreement pending'} />
      </div>

      {/* KYC Details if done */}
      {kycDone && (
        <div className="rounded-xl bg-surface2 border border-border p-3 space-y-1.5">
          <p className="text-[10px] font-semibold text-textMuted uppercase tracking-wide">KYC Details</p>
          {checkin.idProofType && (
            <p className="text-xs text-textSecondary">
              ID Type: <span className="font-semibold text-textPrimary">{checkin.idProofType}</span>
            </p>
          )}
          {checkin.emergencyName && (
            <p className="text-xs text-textSecondary">
              Emergency: <span className="font-semibold text-textPrimary">{checkin.emergencyName} · {checkin.emergencyPhone}</span>
            </p>
          )}
          {checkin.currentAddress && (
            <p className="text-xs text-textSecondary">
              Address: <span className="font-semibold text-textPrimary">{checkin.currentAddress}</span>
            </p>
          )}
          {/* ID proof photos */}
          {checkin.idFrontUrl && (
            <div className="flex gap-2 mt-2">
              <a href={checkin.idFrontUrl} target="_blank" rel="noopener noreferrer">
                <img src={checkin.idFrontUrl} alt="ID Front" className="h-16 w-24 object-cover rounded-lg border border-border" />
              </a>
              {checkin.idBackUrl && (
                <a href={checkin.idBackUrl} target="_blank" rel="noopener noreferrer">
                  <img src={checkin.idBackUrl} alt="ID Back" className="h-16 w-24 object-cover rounded-lg border border-border" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Agreement PDF */}
      {signed && checkin.agreementPdfUrl && (
        <a
          href={checkin.agreementPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 w-full justify-center rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          <FileText className="h-4 w-4" />
          View Signed Agreement
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      {/* Resend invite if pending */}
      {!signed && (
        <button
          onClick={handleResend}
          disabled={resending}
          className="flex items-center gap-2 w-full justify-center rounded-xl border border-border bg-surface py-2.5 text-xs font-semibold text-textSecondary hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-60"
        >
          <Send className="h-3.5 w-3.5" />
          {resending ? 'Sending...' : 'Resend Checkin Invite'}
        </button>
      )}
    </div>
  )
}