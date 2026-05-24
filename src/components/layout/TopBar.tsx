import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Bell } from 'lucide-react'
import { PgSwitcher } from '@/components/layout/PgSwitcher'
import { useAuthStore } from '@/store/authStore'
import { usePgStore } from '@/store/pgStore'
import { useTranslation } from 'react-i18next'

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TopBar() {
  const owner            = useAuthStore((s) => s.owner)
  const { activePgName } = usePgStore()
  const { t }            = useTranslation()
  const [sheetOpen, setSheetOpen] = useState(false)

  const h         = new Date().getHours()
  const part      = h < 12 ? t('good_morning') : h < 17 ? t('good_afternoon') : t('good_evening')
  const firstName = owner?.name?.split(' ')[0] ?? 'there'

  return (
    <>
      {/* ── Green hero header ───────────────────────────────── */}
      <header className="relative z-40 overflow-hidden bg-primary px-4 pb-5 pt-4">

        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -right-2 top-8 h-20 w-20 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-6xl">

          {/* Row 1 — Logo left + Bell + Avatar right */}
          <div className="mb-3 flex items-center justify-between">

            {/* Logo + greeting */}
            <div className="flex items-center gap-2.5">
              <img
                src="/image/ownant-app-icon.png"
                alt="Ownant"
                className="h-9 w-9 rounded-xl object-cover shadow-sm"
              />
              <div>
                <p className="text-[10px] font-medium text-white/60 leading-none mb-0.5">
                  {part} 👋
                </p>
                <p className="text-sm font-bold text-white leading-none">
                  {firstName}
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Notification bell */}
              <Link
                to="/notifications"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
              </Link>

              {/* Avatar */}
              <Link
                to="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-primary shadow-sm"
                aria-label="Profile"
              >
                {owner?.name ? initials(owner.name) : '?'}
              </Link>
            </div>
          </div>

          {/* Row 2 — PG switcher pill */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-300" />
              <span className="truncate text-sm font-semibold text-white">
                {activePgName ?? 'Select PG'}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className="text-xs text-white/60">Switch</span>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </div>
          </button>

        </div>
      </header>

      <PgSwitcher open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}