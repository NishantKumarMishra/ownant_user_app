import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import * as Switch from '@radix-ui/react-switch'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCreateRoom } from '@/hooks/useRooms'
import { handleApiError } from '@/lib/apiError'

const schema = z.object({
  roomNumber: z.string().min(1, 'Required'),
  floor: z.string().optional(),
  sharingType: z.coerce.number().min(1).max(20),
  rentPerBed: z.coerce.number().min(0),
  notes: z.string().optional(),
  isAc: z.boolean(),
})

type Form = z.infer<typeof schema>

export function AddRoomPage() {
  const navigate = useNavigate()
  const create = useCreateRoom()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { sharingType: 2, rentPerBed: 5000, isAc: false },
  })
  const isAc = watch('isAc')

  const onSubmit = async (data: Form) => {
    try {
      await create.mutateAsync(data)
      navigate('/rooms')
    } catch (e) {
      handleApiError(e)
    }
  }

  return (
    <div className="mx-auto max-w-lg pb-8">
      <h1 className="text-xl font-bold text-textPrimary">Add room</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <Input label="Room number" error={errors.roomNumber?.message} {...register('roomNumber')} />
        <Input label="Floor" {...register('floor')} />
        <Input
          label="Sharing type"
          type="number"
          min={1}
          max={20}
          error={errors.sharingType?.message}
          {...register('sharingType')}
        />
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
          <span className="text-sm font-medium">AC room</span>
          <Switch.Root
            checked={isAc}
            onCheckedChange={(v) => setValue('isAc', v)}
            className="h-6 w-11 rounded-full bg-border data-[state=checked]:bg-primary"
          >
            <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-5" />
          </Switch.Root>
        </div>
        <Input
          label="Rent per bed (₹)"
          type="number"
          error={errors.rentPerBed?.message}
          {...register('rentPerBed')}
        />
        <Input label="Notes" {...register('notes')} />
        <Button type="submit" className="w-full" disabled={create.isPending}>
          Save
        </Button>
      </form>
    </div>
  )
}
