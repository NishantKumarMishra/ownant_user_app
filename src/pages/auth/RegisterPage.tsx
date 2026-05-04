import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRegister } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { usePgStore } from '@/store/pgStore'
import { handleApiError } from '@/lib/apiError'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
})

type Form = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const owner = useAuthStore((s) => s.owner)
  const registerApi = useRegister()
  const setOwner = useAuthStore((s) => s.setOwner)
  const setActivePg = usePgStore((s) => s.setActivePg)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    const regPhone = owner?.phone ?? sessionStorage.getItem('pg-reg-phone') ?? ''
    if (!regPhone) {
      navigate('/login', { replace: true })
      return
    }
    try {
      const profile = await registerApi.mutateAsync({
        phone: regPhone,
        name: data.name,
        email: data.email || undefined,
      })
      console.log('Registered profile:', profile) 
      setOwner({
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        activePgId: profile.activePgId ?? null,
      })
      sessionStorage.removeItem('pg-reg-phone')
      if (profile.activePgId) {
        const name = (profile as { activePgName?: string }).activePgName ?? 'My PG'
        setActivePg(profile.activePgId, name)
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/onboarding/pg', { replace: true })
      }
    } catch (e) {
      handleApiError(e)
    }
  }

  return (
    <div className="min-h-svh bg-background px-4 py-10">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-xl font-bold text-textPrimary">Complete your profile</h1>
        <p className="mt-1 text-sm text-textSecondary">We’ll use this on receipts and reminders.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input label="Full name" error={errors.name?.message} {...register('name')} />
          <Input label="Email (optional)" type="email" error={errors.email?.message} {...register('email')} />
          <Button type="submit" className="w-full" disabled={registerApi.isPending}>
            {registerApi.isPending ? 'Saving…' : 'Get Started'}
          </Button>
        </form>
      </div>
    </div>
  )
}
