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
// ✅ FIXED: SVG calc() in attributes is invalid. Now uses a
// percentage-based viewBox approach with a ResizeObserver to
// measure the real pixel size and draw the rect correctly.
function TrainBorder() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rectRef = useRef<SVGRectElement>(null)
  const [size, setSize] = useState({ w: 300, h: 50 })
  const [perimeter, setPerimeter] = useState(0)

  // Measure container so SVG rect matches exactly
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Recalculate perimeter when size changes
  useEffect(() => {
    if (rectRef.current) {
      try {
        const p = rectRef.current.getTotalLength()
        if (p > 0) setPerimeter(p)
      } catch {
        // getTotalLength not available yet
        const rx = 15
        setPerimeter(2 * (size.w + size.h - 4 * rx) + 2 * Math.PI * rx)
      }
    }
  }, [size])

  const { w, h } = size
  const rx = 15
  const pad = 1.5

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <defs>
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
          x={pad} y={pad}
          width={w - pad * 2} height={h - pad * 2}
          rx={rx}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="2"
        />

        {/* Train — animated stroke segment */}
        <rect
          ref={rectRef}
          x={pad} y={pad}
          width={w - pad * 2} height={h - pad * 2}
          rx={rx}
          fill="none"
          stroke="url(#trainGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={perimeter > 0 ? `${perimeter * 0.35} ${perimeter * 0.65}` : '150 300'}
          strokeDashoffset="0"
          style={{
            animation: `trainMove ${perimeter > 0 ? perimeter / 60 : 6}s linear infinite`,
          }}
        />

        <style>{`
          @keyframes trainMove {
            from { stroke-dashoffset: 0; }
            to   { stroke-dashoffset: -${perimeter > 0 ? perimeter : 400}; }
          }
        `}</style>
      </svg>
    </div>
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
        className="sticky top-0 z-40 bg-primary px-4 pb-5 pt-4"
        // ✅ FIXED: removed overflow-hidden — it was clipping the train SVG.
        // Safe area top padding for iPhone notch.
        style={{
          borderRadius: '0 0 20px 20px',
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
        }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -right-2 top-8 h-20 w-20 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-white/5" />

        {/* ✅ FIXED: overflow-hidden on inner div only, not the header */}
        <div className="relative mx-auto max-w-6xl overflow-hidden">

          {/* Row 1 — Logo + greeting | Bell + Avatar */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/image/ownant-app-icon.png"
                alt="Ownant"
                className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-white/60 leading-none mb-0.5">
                  {part} 👋
                </p>
                {/* ✅ FIXED: truncate so long names don't overflow */}
                <p className="text-sm font-bold text-white leading-none truncate">
                  {firstName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
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
            <TrainBorder />

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 transition active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(8px)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 shrink-0 rounded-full bg-green-300" />
                {/* ✅ FIXED: truncate so long PG names don't overflow */}
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