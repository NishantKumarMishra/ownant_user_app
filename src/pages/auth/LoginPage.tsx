import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import {  ShieldCheck, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

import { useSendOtp } from '@/hooks/useAuth'
import { INDIAN_PHONE_REGEX } from '@/lib/format'
import { handleApiError } from '@/lib/apiError'

const schema = z.object({
  phone: z
    .string()
    .regex(
      INDIAN_PHONE_REGEX,
      'Enter a valid 10-digit Indian mobile number'
    ),
})

type Form = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()

  const sendOtp = useSendOtp()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  })

  const onSubmit = async (data: Form) => {
    try {
      await sendOtp.mutateAsync(data.phone)

      navigate(`/otp?phone=${encodeURIComponent(data.phone)}`)
    } catch (e) {
      handleApiError(e)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Background Glow */}
      <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="absolute bottom-[-120px] right-[-120px] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      {/* Card */}
     <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface/95 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur md:p-8">
  
  {/* Top Badge */}
  <div className="mb-5 flex items-center justify-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-black shadow-lg overflow-hidden border border-white/10">
      
     <img
  src="/image/ownant-app-icon.png"
  alt="Ownant App Icon"
  className="h-full w-full object-cover"
/>

    </div>
  </div>



        {/* Heading */}
        <div className="text-center">
          <p className="px-3 pb-4 text-lg font-bold text-primary">OWNANT</p>
    

     
     


    


          {/* <p className="mt-2 text-sm leading-6 text-textSecondary">
            Sign in to manage your PG operations,
            tenants, payments and occupancy.
          </p> */}
        </div>

        {/* Feature Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            PG Management
          </div>

          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Rent Tracking
          </div>

          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Smart Analytics
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 space-y-5"
        >
          <Input
            label="Mobile number"
            placeholder="Enter your mobile number"
            inputMode="numeric"
            maxLength={10}
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Button
            type="submit"
            className="h-12 w-full rounded-xl text-sm font-semibold"
            disabled={sendOtp.isPending}
          >
            <div className="flex items-center justify-center gap-2">
              <span>
                {sendOtp.isPending
                  ? 'Sending OTP...'
                  : 'Continue'}
              </span>

              {!sendOtp.isPending ? (
                <ArrowRight className="h-4 w-4" />
              ) : null}
            </div>
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-textTertiary">
          <ShieldCheck className="h-4 w-4" />

          <span>
            Secure OTP authentication powered login
          </span>
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-textTertiary">
          By continuing, you agree to our Terms of Service
          and Privacy Policy.
        </p>
      </div>
    </div>
  )
}