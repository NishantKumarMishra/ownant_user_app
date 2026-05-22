// src/pages/checkin/CheckinPage.tsx
// Public page — no auth required
// Accessed via: app.ownant.com/checkin/go?t=TOKEN

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle2, ChevronRight, Loader2, Upload,
  X, User, Phone, MapPin, FileText, PenLine,
  Shield, Home, Calendar, Banknote, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── API base (public — no auth header needed) ─────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ?? 'http://localhost:8080'
const IK_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string
const IK_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

// ── Types ─────────────────────────────────────────────────────
interface CheckinInfo {
  status: string
  pgName: string
  pgAddress: string
  pgCity: string
  tenantName: string
  roomNumber: string
  bedLabel: string
  moveInDate: string
  monthlyRent: number
  expired: boolean
}

// ── Signature pad ─────────────────────────────────────────────
function SignaturePad({ onSign }: { onSign: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasSigned, setHasSigned] = useState(false)

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const pos    = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    isDrawing.current = true
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const pos    = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    setHasSigned(true)
  }

  const endDraw = () => {
    isDrawing.current = false
    if (hasSigned) {
      onSign(canvasRef.current!.toDataURL('image/png'))
    }
  }

  const clear = () => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSigned(false)
    onSign('')
  }

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-border rounded-2xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={340}
          height={140}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasSigned && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-textMuted text-sm">Sign here</p>
          </div>
        )}
        {hasSigned && (
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-danger/10 flex items-center justify-center"
          >
            <X className="h-3.5 w-3.5 text-danger" />
          </button>
        )}
      </div>
      <p className="text-xs text-textMuted text-center">Draw your signature above</p>
    </div>
  )
}

// ── Photo upload box ──────────────────────────────────────────
function PhotoUploadBox({
  label, url, onUpload, loading
}: {
  label: string
  url: string | null
  onUpload: (file: File) => void
  loading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onClick={() => !loading && inputRef.current?.click()}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all',
        url ? 'border-success bg-success/5' : 'border-border hover:border-primary/40 hover:bg-primaryLight',
        loading && 'opacity-70 cursor-wait'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
      {loading ? (
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      ) : url ? (
        <>
          <img src={url} alt={label} className="w-full h-24 object-cover rounded-xl mb-2" />
          <CheckCircle2 className="h-4 w-4 text-success" />
          <p className="text-xs text-success font-medium mt-1">Uploaded ✓</p>
        </>
      ) : (
        <>
          <Upload className="h-6 w-6 text-textSecondary mb-2" />
          <p className="text-xs font-medium text-textPrimary">{label}</p>
          <p className="text-xs text-textMuted mt-0.5">Tap to upload</p>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export function CheckinPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t') ?? ''

  const [step,       setStep]       = useState(0)
  const [info,       setInfo]       = useState<CheckinInfo | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Step 2 — KYC state
  const [idProofType,    setIdProofType]    = useState('AADHAAR')
  const [idFrontUrl,     setIdFrontUrl]     = useState<string | null>(null)
  const [idBackUrl,      setIdBackUrl]      = useState<string | null>(null)
  const [uploadingFront, setUploadingFront] = useState(false)
  const [uploadingBack,  setUploadingBack]  = useState(false)
  const [emergencyName,  setEmergencyName]  = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [currentAddress, setCurrentAddress] = useState('')

  // Step 3 — Sign state
  const [signatureUrl, setSignatureUrl] = useState('')
  const [agreed,       setAgreed]       = useState(false)
  const [completed,    setCompleted]    = useState(false)

  // Load checkin info
  useEffect(() => {
    if (!token) { setError('Invalid link'); setLoading(false); return }
    fetch(`${API_BASE}/public/checkin/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setInfo(d.data)
          if (d.data.status === 'KYC_DONE')   setStep(2)
          else if (d.data.status === 'COMPLETED') { setCompleted(true); setStep(3) }
        } else {
          setError(d.message ?? 'Invalid check-in link')
        }
      })
      .catch(() => setError('Failed to load. Please try again.'))
      .finally(() => setLoading(false))
  }, [token])

  // ── Upload via backend-signed ImageKit ────────────────────────
  // WHY: Public checkin page has no JWT → can't use authenticated endpoint
  // Solution: backend provides public auth endpoint at /public/imagekit/auth
  const handleUpload = async (file: File, side: 'front' | 'back') => {
    const setUploading = side === 'front' ? setUploadingFront : setUploadingBack
    const setUrl       = side === 'front' ? setIdFrontUrl     : setIdBackUrl
    setUploading(true)
    setError('')
    try {
      // Step 1 — get signed auth from public backend endpoint (no JWT needed)
      const authRes = await fetch(`${API_BASE}/api/v1/public/imagekit/auth`)
      if (!authRes.ok) throw new Error('Auth failed')
      const authData = await authRes.json()
      const auth = authData.data ?? authData

      // Step 2 — upload to ImageKit with signature
      const formData = new FormData()
      formData.append('file',              file)
      formData.append('publicKey',         IK_PUBLIC_KEY)
      formData.append('fileName',          `kyc-${side}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`)
      formData.append('folder',            '/ownant/kyc')
      formData.append('useUniqueFileName', 'true')
      formData.append('signature',         auth.signature)
      formData.append('expire',            String(auth.expire))
      formData.append('token',             auth.token)

      const res  = await fetch(IK_UPLOAD_URL, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Upload failed')
      setUrl(data.url)
    } catch (e: any) {
      setError('Upload failed: ' + (e.message ?? 'Please try again'))
    } finally {
      setUploading(false)
    }
  }

  const submitKyc = async () => {
    if (!idFrontUrl || !idBackUrl)         { setError('Please upload both ID photos'); return }
    if (!emergencyName || !emergencyPhone) { setError('Emergency contact is required'); return }
    if (!currentAddress)                   { setError('Current address is required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/public/checkin/${token}/kyc`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idProofType, idFrontUrl, idBackUrl, emergencyName, emergencyPhone, currentAddress })
      })
      const data = await res.json()
      if (res.ok) setStep(2)
      else setError(data.message ?? 'Submission failed')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitSign = async () => {
    if (!signatureUrl) { setError('Please sign the agreement'); return }
    if (!agreed)       { setError('Please agree to the terms'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/public/checkin/${token}/sign`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ signatureImageUrl: signatureUrl })
      })
      const data = await res.json()
      if (res.ok) { setCompleted(true); setStep(3) }
      else setError(data.message ?? 'Submission failed')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-textSecondary">Loading your check-in...</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────
  if (!token || (error && !info)) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-danger" />
          </div>
          <h1 className="text-lg font-bold text-textPrimary">Invalid Link</h1>
          <p className="text-sm text-textSecondary">
            This check-in link is invalid or has expired. Please contact your PG owner.
          </p>
        </div>
      </div>
    )
  }

  // ── Completed ─────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-sm w-full">
          <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-textPrimary mb-2">Check-in Complete! 🎉</h1>
            <p className="text-sm text-textSecondary">
              Welcome to <span className="font-semibold text-textPrimary">{info?.pgName}</span>!
              Your signed agreement has been sent to your WhatsApp.
            </p>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-4 text-left space-y-3">
            {[
              { icon: Home,     label: 'Property',    value: info?.pgName },
              { icon: FileText, label: 'Room & Bed',  value: `Room ${info?.roomNumber} · Bed ${info?.bedLabel}` },
              { icon: Calendar, label: 'Move-in Date',value: info?.moveInDate },
              { icon: Banknote, label: 'Monthly Rent', value: `₹${info?.monthlyRent}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-primaryLight flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-textSecondary">{label}</p>
                  <p className="text-sm font-semibold text-textPrimary">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-textMuted">~ Powered by Ownant</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Green header */}
      <div className="bg-primary px-4 pt-10 pb-6">
        <div className="max-w-md mx-auto">
          <p className="text-white/70 text-xs font-medium mb-1">~ Powered by Ownant</p>
          <h1 className="text-white font-bold text-xl">Digital Check-in ⚡</h1>
          <p className="text-white/80 text-sm mt-1">Complete in 60 seconds</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-32">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['Property Details', 'Tenant Verification', 'Rental Agreement'].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                i < step    ? 'bg-success text-white'
                : i === step  ? 'bg-primary text-white'
                : 'bg-border text-textMuted'
              )}>
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <p className={cn(
                'text-[10px] leading-tight hidden sm:block',
                i === step ? 'text-primary font-semibold' : 'text-textMuted'
              )}>{label}</p>
              {i < 2 && <div className={cn('h-px flex-1', i < step ? 'bg-success' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-danger/5 border border-danger/20 rounded-2xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* ── STEP 0 — Property Details ─────────────────────── */}
        {step === 0 && info && (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primaryLight flex items-center justify-center flex-shrink-0">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-textPrimary text-lg">{info.pgName}</h2>
                  <p className="text-sm text-textSecondary">
                    {info.pgAddress}{info.pgCity ? `, ${info.pgCity}` : ''}
                  </p>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tenant',   value: info.tenantName },
                  { label: 'Room/Unit', value: `Room ${info.roomNumber} · Bed ${info.bedLabel}` },
                  { label: 'Check-in',  value: info.moveInDate },
                  { label: 'Rent',      value: `₹${info.monthlyRent}/mo` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-background rounded-xl p-3">
                    <p className="text-xs text-textSecondary mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-textPrimary">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Wrong details?</span>{' '}
                  Contact your PG owner to update.
                </p>
              </div>
            </div>

            <button
              onClick={() => { setError(''); setStep(1) }}
              className="w-full bg-primary text-white rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2"
            >
              Fast Check-in ⚡
              <ChevronRight className="h-5 w-5" />
            </button>
            <p className="text-center text-xs text-textMuted">~ Powered by Ownant</p>
          </div>
        )}

        {/* ── STEP 1 — KYC ─────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-bold text-textPrimary text-lg mb-1">Tenant Verification</h2>
              <p className="text-sm text-textSecondary">Upload your ID proof and emergency contact</p>
            </div>

            {/* ID Proof Type */}
            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                ID Proof Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setIdProofType(type)}
                    className={cn(
                      'py-2.5 rounded-xl border text-xs font-semibold transition-all',
                      idProofType === type
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface border-border text-textSecondary'
                    )}
                  >
                    {type === 'DRIVING_LICENSE' ? 'Driving License' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* ID Photos */}
            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                ID Photos <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <PhotoUploadBox
                  label="Front side"
                  url={idFrontUrl}
                  onUpload={f => handleUpload(f, 'front')}
                  loading={uploadingFront}
                />
                <PhotoUploadBox
                  label="Back side"
                  url={idBackUrl}
                  onUpload={f => handleUpload(f, 'back')}
                  loading={uploadingBack}
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                Emergency Contact <span className="text-danger">*</span>
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    value={emergencyName}
                    onChange={e => setEmergencyName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    placeholder="Phone number"
                    inputMode="tel"
                    maxLength={10}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Current Address */}
            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                Permanent / Current Address <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-textSecondary" />
                <textarea
                  value={currentAddress}
                  onChange={e => setCurrentAddress(e.target.value)}
                  placeholder="Full address with city, state, pincode"
                  rows={3}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="bg-primaryLight border border-primary/20 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-primary">
                  Your information is encrypted and stored securely. It will only be shared with your PG owner.
                </p>
              </div>
            </div>

            <button
              onClick={submitKyc}
              disabled={submitting}
              className="w-full bg-primary text-white rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>Submit & Continue <ChevronRight className="h-5 w-5" /></>
              )}
            </button>
          </div>
        )}

        {/* ── STEP 2 — Agreement + Sign ────────────────────── */}
        {step === 2 && info && (
          <div className="space-y-5">
            <div>
              <h2 className="font-bold text-textPrimary text-lg mb-1">Rental Agreement</h2>
              <p className="text-sm text-textSecondary">Review and sign your agreement</p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3 text-sm">
              <h3 className="font-bold text-textPrimary">Leave and License Agreement</h3>
              <div className="space-y-2 text-textSecondary text-xs leading-relaxed">
                <p><span className="font-semibold text-textPrimary">Property:</span> {info.pgName}</p>
                <p><span className="font-semibold text-textPrimary">Tenant:</span> {info.tenantName}</p>
                <p><span className="font-semibold text-textPrimary">Unit:</span> Room {info.roomNumber} · Bed {info.bedLabel}</p>
                <p><span className="font-semibold text-textPrimary">Move-in:</span> {info.moveInDate}</p>
                <p><span className="font-semibold text-textPrimary">Duration:</span> 11 months</p>
                <p><span className="font-semibold text-textPrimary">Rent:</span> ₹{info.monthlyRent}/month</p>
                <p><span className="font-semibold text-textPrimary">Lock-in:</span> 6 months</p>
                <p><span className="font-semibold text-textPrimary">Notice Period:</span> 30 days</p>
              </div>
              <div className="h-px bg-border" />
              <p className="text-xs text-textMuted leading-relaxed">
                By signing, you agree to pay rent on time via Ownant platform, use the premises for residential purposes only, and abide by all house rules and terms of this agreement.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                Your Signature <span className="text-danger">*</span>
              </label>
              <SignaturePad onSign={setSignatureUrl} />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary"
              />
              <p className="text-xs text-textSecondary leading-relaxed">
                I have read and agree to the terms of this rental agreement. I confirm all information provided is accurate.
              </p>
            </label>

            <button
              onClick={submitSign}
              disabled={submitting || !signatureUrl || !agreed}
              className="w-full bg-primary text-white rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  <PenLine className="h-5 w-5" />
                  Sign & Complete Check-in
                </>
              )}
            </button>
            <p className="text-center text-xs text-textMuted">~ Powered by Ownant</p>
          </div>
        )}
      </div>
    </div>
  )
}