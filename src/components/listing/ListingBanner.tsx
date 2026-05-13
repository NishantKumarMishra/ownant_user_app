import { Link } from 'react-router-dom'
import { ChevronRight, Sparkles } from 'lucide-react'
import { useListing } from '@/hooks/useListing'
import { cn } from '@/lib/utils'

export function ListingBanner() {
  const { data: listing, isLoading } = useListing()

  // Don't show if loading or already listed
  if (isLoading || !listing) return null
  if (listing.isListed) return null

  const pct = listing.completionPercent

  // Color based on completion
  const barColor = pct >= 60 ? 'bg-success' : pct >= 30 ? 'bg-amber-400' : 'bg-primary'
  const message  = pct >= 60
    ? 'Ready to go live! Publish your listing.'
    : `Complete your profile to get more tenants.`

  return (
    <Link
      to="/listing/setup"
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
        pct >= 60
          ? 'border-success/20 bg-success/5 hover:bg-success/10'
          : 'border-primary/15 bg-primaryLight hover:bg-primary/10',
      )}
    >
      {/* Icon */}
      <div className={cn(
        'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0',
        pct >= 60 ? 'bg-success/10' : 'bg-primary/10',
      )}>
        <Sparkles className={cn('h-4 w-4', pct >= 60 ? 'text-success' : 'text-primary')} />
      </div>

      {/* Text + progress */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-xs font-semibold',
          pct >= 60 ? 'text-success' : 'text-primary',
        )}>
          {pct >= 60 ? '🎉 Get more tenants' : '🏠 Get more tenants'}
        </p>
        <p className="text-xs text-textSecondary mt-0.5 truncate">{message}</p>
        {/* Progress bar */}
        <div className="mt-1.5 h-1 w-full bg-border rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-textSecondary mt-0.5">{pct}% complete</p>
      </div>

      <ChevronRight className="h-4 w-4 text-textSecondary flex-shrink-0" />
    </Link>
  )
}