import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useSendOtp, useVerifyOtp } from '@/hooks/useAuth'
import { maskPhone } from '@/lib/format'
import { handleApiError } from '@/lib/apiError'
import { useAuthStore } from '@/store/authStore'
import { usePgStore } from '@/store/pgStore'
import toast from 'react-hot-toast'

export function OtpPage() {
  const [params] = useSearchParams()
  const phone = params.get('phone') ?? ''
  const navigate = useNavigate()
  const [digits, setDigits] = useState<string[]>(() => Array(6).fill(''))
  const [seconds, setSeconds] = useState(60)
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const verify = useVerifyOtp()
  const resend = useSendOtp()
  const setTokens = useAuthStore((s) => s.setTokens)
  const setOwner = useAuthStore((s) => s.setOwner)
  const setActivePg = usePgStore((s) => s.setActivePg)

  useEffect(() => {
    if (!phone) navigate('/login', { replace: true })
  }, [phone, navigate])

  useEffect(() => {
    if (seconds <= 0) return
    const t = window.setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => window.clearInterval(t)
  }, [seconds])

  const otp = digits.join('')

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = d
    setDigits(next)
    if (d && i < 5) inputs.current[i + 1]?.focus()
  }

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  const onVerify = async () => {
    try {
      const data = await verify.mutateAsync({ phone, otp })
      console.log(data)
      setTokens(data.accessToken, data.refreshToken)
      if (data.owner) {
        setOwner({
          id: data.owner.id,
          name: data.owner.name,
          phone: data.owner.phone,
          activePgId: data.owner.activePgId ?? null,
        })
        if (data.owner.activePgId) {
          const pgName = (data.owner as { activePgName?: string }).activePgName ?? 'My PG'
          setActivePg(data.owner.activePgId, pgName)
        }
      }
      if (data.isNewUser) {
        sessionStorage.setItem('pg-reg-phone', phone)
        navigate('/register', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (e) {
      handleApiError(e)
    }
  }

  const onResend = async () => {
    try {
      await resend.mutateAsync(phone)
      setSeconds(60)
      setDigits(Array(6).fill(''))
      toast.success('OTP sent again')
    } catch (e) {
      handleApiError(e)
    }
  }

  const focusFirstEmpty = useCallback(() => {
    const idx = digits.findIndex((d) => !d)
    inputs.current[idx === -1 ? 5 : idx]?.focus()
  }, [digits])

  useEffect(() => {
    focusFirstEmpty()
  }, [focusFirstEmpty])

  return (
    <div className="min-h-svh bg-background px-4 py-6">
      <div className="mx-auto max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-textSecondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-textPrimary">Enter OTP</h1>
        <p className="mt-1 text-sm text-textSecondary">Sent to {maskPhone(phone)}</p>

        <div className="mt-8 flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el
              }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="h-12 w-10 rounded-lg border border-border text-center text-lg font-semibold text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-textSecondary">
          {seconds > 0 ? (
            <>Resend OTP in {seconds}s</>
          ) : (
            <button type="button" className="font-semibold text-primary" onClick={() => void onResend()}>
              Resend OTP
            </button>
          )}
        </p>

        <Button
          type="button"
          className="mt-8 w-full"
          disabled={otp.length !== 6 || verify.isPending}
          onClick={() => void onVerify()}
        >
          {verify.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner />
              Verifying…
            </span>
          ) : (
            'Verify OTP'
          )}
        </Button>
      </div>
    </div>
  )
}
