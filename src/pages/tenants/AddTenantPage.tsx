import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useVacantBeds } from '@/hooks/useRooms'
import { useCreateTenant } from '@/hooks/useTenants'
import { INDIAN_PHONE_REGEX } from '@/lib/format'
import { handleApiError } from '@/lib/apiError'
import * as Collapsible from '@radix-ui/react-collapsible'

const schema = z.object({
  bedId: z.string().min(1, 'Select a bed'),
  name: z.string().min(2, 'Required'),
  phone: z.string().regex(INDIAN_PHONE_REGEX, 'Invalid phone'),
  email: z.string().email().optional().or(z.literal('')),
  emergencyPhone: z.string().optional(),
  emergencyName: z.string().optional(),
  moveInDate: z.string().min(1, 'Required'),
  monthlyRent: z.coerce.number().min(0),
  dueDay: z.coerce.number().min(1).max(28),
  occupation: z.string().optional(),
  company: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  notes: z.string().optional(),
})

type Form = z.infer<typeof schema>

export function AddTenantPage() {
  const [params] = useSearchParams()
  const presetBed = params.get('bedId')
  const navigate = useNavigate()
  const { data: beds = [], isLoading } = useVacantBeds()
  const create = useCreateTenant()
  const [openEmergency, setOpenEmergency] = useState(false)
  const [openMore, setOpenMore] = useState(false)

  const bedOptions = useMemo(() => {
    const map = new Map<string, typeof beds>()
    for (const b of beds) {
      const key = b.roomNumber
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(b)
    }
    return map
  }, [beds])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      bedId: presetBed ?? '',
      dueDay: 1,
      moveInDate: new Date().toISOString().slice(0, 10),
      monthlyRent: 0,
    },
  })

  const selectedBedId = watch('bedId')
  const selectedBed = beds.find((b) => b.bedId === selectedBedId)

  useEffect(() => {
    if (selectedBed) setValue('monthlyRent', selectedBed.rentPerBed)
  }, [selectedBed, setValue])

  const onSubmit = async (data: Form) => {
    try {
      await create.mutateAsync({
        bedId: data.bedId,
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        emergencyPhone: data.emergencyPhone,
        emergencyName: data.emergencyName,
        moveInDate: data.moveInDate,
        monthlyRent: data.monthlyRent,
        dueDay: data.dueDay,
        occupation: data.occupation,
        company: data.company,
        idProofType: data.idProofType,
        idProofNumber: data.idProofNumber,
        notes: data.notes,
      })
      navigate('/tenants')
    } catch (e) {
      handleApiError(e)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <h1 className="text-xl font-bold text-textPrimary">Add tenant</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-textPrimary">Bed assignment</h2>
        {isLoading ? (
          <p className="text-sm text-textSecondary">Loading beds…</p>
        ) : (
          <select
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            value={selectedBedId}
            disabled={Boolean(presetBed)}
            onChange={(e) => setValue('bedId', e.target.value)}
          >
         <option value="">Select a vacant bed</option>
            {[...bedOptions.entries()].map(([room, list]) => (
              <optgroup key={room} label={`Room ${room} · ${list[0].sharingType}-sharing · ${list[0].isAc ? 'AC' : 'Non-AC'}`}>
                {list.slice(0, 1).map((b) => (
                  <option key={b.bedId} value={b.bedId}>
                    Bed {b.bedLabel} · {b.sharingType}-sharing · {b.isAc ? 'AC' : 'Non-AC'} · ₹{b.rentPerBed}/bed
                    
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
        {errors.bedId ? <p className="text-xs text-danger">{errors.bedId.message}</p> : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-textPrimary">Personal details</h2>
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Input label="Phone" error={errors.phone?.message} {...register('phone')} maxLength={10} />
        <Input label="Email (optional)" type="email" error={errors.email?.message} {...register('email')} />
      </section>

      <Collapsible.Root open={openEmergency} onOpenChange={setOpenEmergency}>
        <Collapsible.Trigger asChild>
          <Button variant="ghost" type="button" className="w-full justify-between">
            Emergency contact
            <ChevronDown className={openEmergency ? 'rotate-180' : ''} />
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content className="space-y-3 pt-2">
          <Input label="Emergency phone" {...register('emergencyPhone')} />
          <Input label="Emergency name" {...register('emergencyName')} />
        </Collapsible.Content>
      </Collapsible.Root>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-textPrimary">Stay details</h2>
        <Input type="date" label="Move-in date" error={errors.moveInDate?.message} {...register('moveInDate')} />
        <Input
          label="Monthly rent (₹)"
          type="number"
          error={errors.monthlyRent?.message}
          {...register('monthlyRent')}
        />
        <Input label="Due day (1–28)" type="number" min={1} max={28} error={errors.dueDay?.message} {...register('dueDay')} />
      </section>

      <Collapsible.Root open={openMore} onOpenChange={setOpenMore}>
        <Collapsible.Trigger asChild>
          <Button variant="ghost" type="button" className="w-full justify-between">
            Additional
            <ChevronDown className={openMore ? 'rotate-180' : ''} />
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content className="space-y-3 pt-2">
          <Input label="Occupation" {...register('occupation')} />
          <Input label="Company / College" {...register('company')} />
          <div>
            <label className="text-sm font-medium">ID proof type</label>
            <select
              className="mt-1.5 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              {...register('idProofType')}
            >
              <option value="">—</option>
              <option value="AADHAAR">AADHAAR</option>
              <option value="PAN">PAN</option>
              <option value="PASSPORT">PASSPORT</option>
              <option value="VOTER_ID">VOTER_ID</option>
              <option value="DRIVING_LICENSE">DRIVING_LICENSE</option>
            </select>
          </div>
          <Input label="ID proof number" {...register('idProofNumber')} />
          <Input label="Notes" {...register('notes')} />
        </Collapsible.Content>
      </Collapsible.Root>

      <Button type="button" className="w-full" disabled={create.isPending} onClick={handleSubmit(onSubmit)}>
        Save tenant
      </Button>
    </div>
  )
}
