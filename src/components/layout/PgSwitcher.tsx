import { useNavigate } from 'react-router-dom'
import { Check, Plus } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { usePgsList, useSwitchPg } from '@/hooks/usePgs'
import { usePgStore } from '@/store/pgStore'
import { cn } from '@/lib/utils'

interface PgSwitcherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PgSwitcher({ open, onOpenChange }: PgSwitcherProps) {
  const navigate = useNavigate()
  const { activePgId, setActivePg } = usePgStore()
  const { data: pgs, isLoading } = usePgsList(open)
  const switchPg = useSwitchPg()

  const handleSelect = async (id: string, name: string) => {
    if (id === activePgId) {
      onOpenChange(false)
      return
    }
    try {
      const data = await switchPg.mutateAsync(id)
      console.log('Switched PG:', data)
      setActivePg(id, data?.pg?.name ?? name)
      onOpenChange(false)
      navigate('/dashboard')
    } catch {
      /* toast from mutation */
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Your PGs">
      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          : (pgs ?? []).map((pg) => {
              const active = pg.id === activePgId
              return (
                <button
                  key={pg.id}
                  type="button"
                  onClick={() => void handleSelect(pg.id, pg.name)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border border-border bg-surface p-3 text-left transition hover:bg-primary/5',
                    active && 'border-l-4 border-l-primary pl-2.5',
                  )}
                >
                  <div>
                    <p className="font-semibold text-textPrimary">{pg.name}</p>
                    <p className="text-xs text-textSecondary">
                      {pg.city ?? '—'}
                      {pg.totalBeds != null ? ` · ${pg.occupiedBeds ?? 0}/${pg.totalBeds} beds` : ''}
                      {pg.occupancyPercent != null ? ` · ${pg.occupancyPercent}%` : ''}
                    </p>
                  </div>
                  {active ? <Check className="h-5 w-5 text-primary" /> : null}
                </button>
              )
            })}
        <Button
          type="button"
          variant="secondary"
          className="mt-2 w-full"
          onClick={() => {
            onOpenChange(false)
            navigate('/onboarding/pg')
          }}
        >
          <Plus className="h-4 w-4" />
          Add New PG
        </Button>
      </div>
    </BottomSheet>
  )
}
