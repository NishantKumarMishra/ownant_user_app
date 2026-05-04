import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  hint?: string
  className?: string
  icon?: React.ReactNode
}

export function MetricCard({
  label,
  value,
  hint,
  className,
  icon,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        'rounded-xl bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
        className
      )}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between">
        <p className="text-sm text-textSecondary">
          {label}
        </p>

        {icon ? (
          <div className="text-textSecondary">
            {icon}
          </div>
        ) : null}
      </div>

      {/* Value */}
      <p className="mt-1 text-2xl font-semibold text-textPrimary">
        {value}
      </p>

      {/* Hint */}
      {hint ? (
        <p className="mt-1 text-xs font-medium text-textTertiary">
          {hint}
        </p>
      ) : null}
    </Card>
  )
}