import { cn } from '@/lib/utils'

export function BedSlot({ occupied }: { occupied: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-block h-3 w-3 rounded-full border',
          occupied ? 'border-primary bg-primary' : 'border-border bg-surface'
        )}
        aria-label={occupied ? 'Occupied' : 'Vacant'}
      />
    
    </div>
  )
}
