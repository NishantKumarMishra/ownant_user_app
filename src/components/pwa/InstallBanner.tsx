import { usePWAInstall } from '@/hooks/usePWAInstall'

export function InstallBanner() {
  const { install, canInstall } = usePWAInstall()

  if (!canInstall) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 rounded-xl bg-[#2C6C28] p-4 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Install Ownant</p>
          <p className="text-xs opacity-80">Add app to your home screen</p>
        </div>

        <button
          onClick={install}
          className="rounded-lg bg-white px-3 py-1 text-sm font-semibold text-[#2C6C28]"
        >
          Install
        </button>
      </div>
    </div>
  )
}