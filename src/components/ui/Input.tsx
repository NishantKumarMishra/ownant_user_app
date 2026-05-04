import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <div className="w-full space-y-1.5 text-left">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-textPrimary">
            {label}
          </label>
        ) : null}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-textPrimary placeholder:text-textTertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            error && 'border-danger',
            className,
          )}
          ref={ref}
          {...props}
        />
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    )
  },
)
Input.displayName = 'Input'
