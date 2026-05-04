import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pg-pwa-banner-dismissed') === '1',
  )

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  if (dismissed || !deferred) return null

  const isMobile = window.matchMedia('(max-width: 768px)').matches
  if (!isMobile) return null

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 rounded-xl border border-border bg-surface p-3 shadow-lg lg:bottom-4">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold text-textPrimary">Add OWNANT to your home screen</p>
          <p className="mt-0.5 text-xs text-textSecondary">Quick access like a native app.</p>
          <Button
            type="button"
            size="sm"
            className="mt-2"
            onClick={async () => {
              await deferred.prompt()
              setDeferred(null)
            }}
          >
            Install
          </Button>
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-textTertiary hover:bg-background"
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem('pg-pwa-banner-dismissed', '1')
            setDismissed(true)
          }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
