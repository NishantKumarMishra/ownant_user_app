import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useCreatePg } from '@/hooks/usePgs'
import { CitySearch } from '@/components/location/CitySearch'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  name:    z.string().min(2, 'PG name must be at least 2 characters'),
  address: z.string().min(5, 'Address is required'),
  city:    z.string().min(2, 'City is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode').optional().or(z.literal('')),
  phone:   z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit number').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export function OnboardingPgPage() {
  const navigate       = useNavigate()
  const createPg       = useCreatePg()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const setActivePgId  = useAuthStore((s) => s.setActivePgId)

  const [cityLat, setCityLat] = useState<number | undefined>()
  const [cityLng, setCityLng] = useState<number | undefined>()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await createPg.mutateAsync({
        name:      values.name,
        address:   values.address,
        city:      values.city,
        pincode:   values.pincode || undefined,
        phone:     values.phone   || undefined,
        latitude:  cityLat,
        longitude: cityLng,
      })

      if (result?.accessToken) setAccessToken(result.accessToken)
      if (result?.pg?.id)      setActivePgId(result.pg.id)

      toast.success('PG created successfully')
      navigate('/onboarding/rooms')

    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Failed to create PG'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-svh bg-background px-4 py-8">
      <div className="mx-auto max-w-md">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-textPrimary">Step 1 of 2</span>
            <span className="text-sm text-textSecondary">PG Details</span>
          </div>
          <div className="h-2 rounded-full bg-border">
            <div className="h-2 rounded-full bg-primary w-1/2 transition-all" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-textPrimary mb-1">Add your PG</h1>
        <p className="text-sm text-textSecondary mb-8">
          Tell us about your property. You can update this anytime.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* PG Name */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-1">
              PG Name <span className="text-danger">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Sri Balaji PG"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-1">
              Address <span className="text-danger">*</span>
            </label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="Street, Area"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            {errors.address && <p className="mt-1 text-xs text-danger">{errors.address.message}</p>}
          </div>

          {/* City + Pincode */}
          <div className="grid grid-cols-2 gap-3">
            <CitySearch
              label="City"
              placeholder="Type city name..."
              value={watch('city') ?? ''}
              onChange={(city, lat, lng) => {
                setValue('city', city, {
                  shouldValidate: true,
                  shouldDirty:    true,
                  shouldTouch:    true,
                })
                setCityLat(lat)
                setCityLng(lng)
              }}
              error={errors.city?.message}
            />
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Pincode
              </label>
              <input
                {...register('pincode')}
                placeholder="600020"
                inputMode="numeric"
                maxLength={6}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {errors.pincode && <p className="mt-1 text-xs text-danger">{errors.pincode.message}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-1">
              PG Contact Number
            </label>
            <input
              {...register('phone')}
              placeholder="9876543210"
              inputMode="tel"
              maxLength={10}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>}
          </div>

          <button
            type="submit"
            disabled={createPg.isPending}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60 mt-6"
          >
            {createPg.isPending ? 'Creating PG…' : 'Continue →'}
          </button>

        </form>
      </div>
    </div>
  )
}