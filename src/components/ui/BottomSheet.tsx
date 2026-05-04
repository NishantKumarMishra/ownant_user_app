import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function BottomSheet({ open, onOpenChange, title, children, className }: BottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl border border-border bg-surface p-4 pb-8 shadow-xl focus:outline-none md:left-auto md:right-4 md:top-1/2 md:max-h-[85vh] md:w-full md:max-w-md md:-translate-y-1/2 md:rounded-xl',
            className,
          )}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border md:hidden" aria-hidden />
          {title ? (
            <Dialog.Title className="mb-3 text-center text-base font-semibold text-textPrimary md:text-left">
              {title}
            </Dialog.Title>
          ) : null}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
