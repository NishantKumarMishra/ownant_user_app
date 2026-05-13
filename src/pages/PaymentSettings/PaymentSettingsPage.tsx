import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, QrCode, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import api from '@/api/axios'
import toast from 'react-hot-toast'


// ── UPI app examples ──────────────────────────────────────────
const UPI_EXAMPLES = [
  { app: 'GPay',     format: 'yourname@okaxis',    logo: '🟦' },
  { app: 'PhonePe',  format: '9876543210@ybl',     logo: '🟣' },
  { app: 'Paytm',    format: 'yourname@paytm',     logo: '🔵' },
  { app: 'BHIM',     format: 'yourname@upi',       logo: '🟠' },
]

export function PaymentSettingsPage() {
  const navigate = useNavigate()

  const [upiId,     setUpiId]     = useState('')
  const [saved,     setSaved]     = useState('')
  const [hasUpi,    setHasUpi]    = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [qrBase64,  setQrBase64]  = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [showQr,    setShowQr]    = useState(false)
  const [amount,    setAmount]    = useState('5000')

  // Fetch existing UPI ID
  useEffect(() => {
    api.get('/payment-settings')
      .then(res => {
        const data = res.data.data
        if (data.hasUpiId) {
          setUpiId(data.upiId)
          setSaved(data.upiId)
          setHasUpi(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!upiId.trim()) { toast.error('Enter your UPI ID'); return }

    setSaving(true)
    try {
      await api.put('/payment-settings/upi', { upiId: upiId.trim() })
      setSaved(upiId.trim())
      setHasUpi(true)
      toast.success('UPI ID saved! QR code will be sent with reminders.')
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Invalid UPI ID format')
    } finally {
      setSaving(false)
    }
  }

  const handlePreviewQr = async () => {
    setQrLoading(true)
    setShowQr(true)
    try {
      const res = await api.get('/payment-settings/upi/preview', {
        params: { amount }
      })
      setQrBase64(res.data.data.qrBase64)
    } catch {
      toast.error('Failed to generate QR preview')
      setShowQr(false)
    } finally {
      setQrLoading(false)
    }
  }

  const handleRemove = async () => {
    try {
      await api.delete('/payment-settings/upi')
      setUpiId(''); setSaved(''); setHasUpi(false)
      setQrBase64(null); setShowQr(false)
      toast.success('UPI ID removed')
    } catch {
      toast.error('Failed to remove UPI ID')
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="h-8 bg-surface rounded-full animate-pulse w-1/2" />
        <div className="h-40 bg-surface rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface rounded-xl transition-colors">
          <ChevronLeft className="h-5 w-5 text-textSecondary" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-textPrimary">Payment Settings</h1>
          <p className="text-xs text-textSecondary">Add UPI ID to collect rent via QR code</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-primaryLight border border-primary/20 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-primary">💡 How it works</p>
        {[
          'Add your UPI ID below (one time)',
          'Every rent reminder includes a scannable QR code',
          'Tenant scans → GPay/PhonePe opens with amount pre-filled',
          'One tap to pay → you get money directly',
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-xs font-bold text-primary w-4 flex-shrink-0">{i + 1}.</span>
            <p className="text-xs text-primary">{s}</p>
          </div>
        ))}
      </div>

      {/* UPI ID input */}
      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-textPrimary">Your UPI ID</p>
          {hasUpi && (
            <span className="flex items-center gap-1 text-xs font-semibold text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Active
            </span>
          )}
        </div>

        <div>
          <Input
            value={upiId}
            onChange={e => setUpiId(e.target.value.toLowerCase())}
            placeholder="yourname@upi or 9876543210@paytm"
            type="text"
          />
          <p className="text-xs text-textSecondary mt-1">
            Find your UPI ID in GPay → Profile → UPI IDs
          </p>
        </div>

        {/* UPI format examples */}
        <div>
          <p className="text-xs font-semibold text-textSecondary mb-2">Examples:</p>
          <div className="grid grid-cols-2 gap-2">
            {UPI_EXAMPLES.map(ex => (
              <button
                key={ex.app}
                onClick={() => setUpiId(ex.format)}
                className="flex items-center gap-2 bg-bg rounded-xl px-3 py-2 text-left hover:bg-primaryLight transition-colors"
              >
                <span className="text-base">{ex.logo}</span>
                <div>
                  <p className="text-xs font-medium text-textPrimary">{ex.app}</p>
                  <p className="text-[10px] text-textMuted font-mono">{ex.format}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || !upiId.trim() || upiId === saved}
            className="flex-1"
          >
            {saving ? 'Saving…' : hasUpi ? 'Update UPI ID' : 'Save UPI ID'}
          </Button>
          {hasUpi && (
            <button
              onClick={handleRemove}
              className="p-3 rounded-2xl border border-danger/20 text-danger hover:bg-danger/5 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* QR Preview */}
      {hasUpi && (
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <p className="text-sm font-bold text-textPrimary">Preview QR Code</p>
          <p className="text-xs text-textSecondary">
            See how the QR will look when sent to tenants
          </p>

          <div className="flex items-center gap-3">
            <Input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              className="flex-1"
            />
            <Button
              onClick={handlePreviewQr}
              disabled={qrLoading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {qrLoading ? (
                <span className="text-xs">Generating…</span>
              ) : (
                <>
                  <QrCode className="h-4 w-4" />
                  <span className="text-xs">Preview</span>
                </>
              )}
            </Button>
          </div>

          {showQr && (
            <div className="flex flex-col items-center gap-3 pt-2">
              {qrLoading ? (
                <div className="h-48 w-48 bg-bg rounded-2xl animate-pulse" />
              ) : qrBase64 ? (
                <>
                  <div className="bg-white p-4 rounded-2xl shadow-card">
                    <img
                      src={`data:image/png;base64,${qrBase64}`}
                      alt="UPI QR Code"
                      className="h-48 w-48"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-textPrimary">
                      ₹{amount} · {saved}
                    </p>
                    <p className="text-xs text-textSecondary mt-0.5">
                      Scan with any UPI app to test
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-success/5 border border-success/20 rounded-xl px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <p className="text-xs text-success font-medium">
                      This QR will be sent with every reminder
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-danger">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-xs">QR generation failed. Check UPI ID.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* What tenant receives */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <p className="text-sm font-bold text-textPrimary mb-3">What tenant receives</p>
        <div className="bg-[#dcf8c6] rounded-2xl p-4 font-mono text-xs space-y-1 text-gray-800">
          <p className="font-bold">🏠 Rent Reminder — May 2026</p>
          <p>&nbsp;</p>
          <p>Hello Rahul,</p>
          <p>&nbsp;</p>
          <p>Your rent of <strong>₹5,000</strong> is due on <strong>5 May 2026</strong>.</p>
          <p>&nbsp;</p>
          <p>💳 <strong>Pay instantly via UPI:</strong></p>
          <p>👇 Tap the link below</p>
          <p className="text-blue-600 underline">upi://pay?pa=owner@upi&am=5000...</p>
          <p>&nbsp;</p>
          <p>📱 <strong>Or scan the QR code</strong> with:</p>
          <p>GPay · PhonePe · Paytm · BHIM</p>
          <p>&nbsp;</p>
          <p className="text-gray-500">Room 102 · Bed A · Sunshine PG</p>
          <p className="text-gray-400">Powered by Ownant</p>
        </div>
        <p className="text-xs text-textSecondary mt-3 text-center">
          + QR code image sent as separate message
        </p>
      </div>
    </div>
  )
}