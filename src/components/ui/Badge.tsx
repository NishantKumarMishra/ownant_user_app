import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primaryLight text-primary',
        success: 'border-transparent bg-successLight text-success',
        warning: 'border-transparent bg-warningLight text-warning',
        danger: 'border-transparent bg-dangerLight text-danger',
        secondary: 'border-border bg-background text-textSecondary',
        outline: 'border-border text-textSecondary',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
