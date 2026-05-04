import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useBulkRooms } from '@/hooks/useRooms'
import type { RoomTypeBulkRow } from '@/api/types'
import { handleApiError } from '@/lib/apiError'
import * as Switch from '@radix-ui/react-switch'

const emptyRow = (): RoomTypeBulkRow => ({
  sharingType: 2,
  numberOfRooms: 1,
  rentPerBed: 5000,
  isAc: false,
})

export function OnboardingRoomsPage() {
  const navigate = useNavigate()
  const bulk = useBulkRooms()
  const [rows, setRows] = useState<RoomTypeBulkRow[]>([emptyRow()])

  const update = (i: number, patch: Partial<RoomTypeBulkRow>) => {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)))
  }

  const onSubmit = async () => {
     console.log("ROOM PAYLOAD:", rows)
    try {
      await bulk.mutateAsync(rows)
      navigate('/dashboard')
    } catch (e) {
      handleApiError(e)
    }
  }

  return (
    <div className="min-h-svh bg-background px-4 py-8">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full w-full rounded-full bg-primary" />
        </div>
        <p className="text-xs font-medium text-textSecondary">Step 2 of 2</p>
        <h1 className="text-2xl font-bold text-textPrimary">Set up your rooms</h1>
        <p className="rounded-lg bg-primaryLight p-3 text-xs text-primary">
          Beds are created automatically — a 3-sharing room gets beds A, B, C.
        </p>

        {rows.map((row, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Sharing (1–20)"
                type="number"
                min={1}
                max={20}
                value={row.sharingType}
                onChange={(e) => update(i, { sharingType: Number(e.target.value) })}
              />
              <Input
  label="Number of rooms"
  type="number"
  min={1}
  value={row.numberOfRooms}
  onChange={(e) => update(i, { numberOfRooms: Number(e.target.value) })}
/>
            </div>
            <div>
              <label className="text-sm font-medium text-textPrimary">Rent per bed</label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary">₹</span>
                <input
                  type="number"
                  className="h-11 w-full rounded-lg border border-border pl-8 pr-3 text-sm"
                  value={row.rentPerBed}
                  onChange={(e) => update(i, { rentPerBed: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-textSecondary">AC rooms</span>
              <Switch.Root
                checked={row.isAc}
                onCheckedChange={(v) => update(i, { isAc: v })}
                className="h-6 w-11 rounded-full bg-border data-[state=checked]:bg-primary"
              >
                <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-5" />
              </Switch.Root>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-danger"
              onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setRows((r) => [...r, emptyRow()])}
        >
          + Add room type
        </Button>
        <Button type="button" className="w-full" disabled={bulk.isPending} onClick={() => void onSubmit()}>
          {bulk.isPending ? 'Creating…' : 'Create my PG'}
        </Button>
      </div>
    </div>
  )
}
