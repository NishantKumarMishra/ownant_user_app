import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Bell } from 'lucide-react'
import { PgSwitcher } from '@/components/layout/PgSwitcher'
import { useAuthStore } from '@/store/authStore'
import { usePgStore } from '@/store/pgStore'
import { useTranslation } from 'react-i18next'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Train border component ────────────────────────────────────
// SVG rect stroke with dashoffset animation
// The stroke path IS the border — train runs exactly on it
function TrainBorder() {
  const ref = useRef<SVGRectElement>(null)
  const [perimeter, setPerimeter] = useState(0)

  useEffect(() => {
    if (ref.current) {
      const p = ref.current.getTotalLength()
      setPerimeter(p)
    }
  }, [])

  return (
    <svg
      aria-hidden="true"
      style={{
        position:  'absolute',
        inset:     0,
        width:     '100%',
        height:    '100%',
        pointerEvents: 'none',
        zIndex:    10,
        overflow:  'visible',
      }}
    >
      <defs>
        {/* Train gradient — white → green → yellow → red → white */}
        <linearGradient id="trainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="30%"  stopColor="#4CAF50" stopOpacity="1" />
          <stop offset="60%"  stopColor="#FFD700" stopOpacity="1" />
          <stop offset="85%"  stopColor="#FF4444" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Track — faint border */}
      <rect
        x="1" y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        rx="15"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="3"
      />

      {/* Train — colored stroke segment running on track */}
      <rect
        ref={ref}
        x="1" y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        rx="15"
        fill="none"
        stroke="url(#trainGrad)"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeDasharray={perimeter > 0 ? `${perimeter * 0.5} ${perimeter * 0.5}` : '200 200'}
        strokeDashoffset="0"
        style={{
          animation: perimeter > 0
            ? `trainMove ${perimeter / 40}s linear infinite`
            : 'trainMove 8s linear infinite',
        }}
      />

      <style>{`
        @keyframes trainMove {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -${perimeter > 0 ? perimeter : 400}; }
        }
      `}</style>
    </svg>
  )
}

// ── Main TopBar ───────────────────────────────────────────────
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
      <header
  className="sticky top-0 z-40 overflow-hidden bg-primary px-4 pb-5 pt-4"
  style={{ borderRadius: '0 0 20px 20px' }}
>

        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -right-2 top-8 h-20 w-20 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-6xl">

          {/* Row 1 — Logo + greeting | Bell + Avatar */}
          <div className="mb-3 flex items-center justify-between">
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

            <div className="flex items-center gap-2">
              <Link
                to="/notifications"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
              </Link>
              <Link
                to="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-primary shadow-sm"
                aria-label="Profile"
              >
                {owner?.name ? initials(owner.name) : '?'}
              </Link>
            </div>
          </div>

          {/* Row 2 — PG Switcher with train border */}
          <div style={{ position: 'relative' }}>
            {/* Train SVG — sits exactly on button border */}
            <TrainBorder />

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 transition active:scale-[0.98]"
              style={{
                background:   'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(8px)',
                border:       'none',
                cursor:       'pointer',
              }}
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

        </div>
      </header>

      <PgSwitcher open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}