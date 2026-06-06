import { useState} from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, ChevronDown } from 'lucide-react'
import { PgSwitcher } from '@/components/layout/PgSwitcher'
import { useAuthStore } from '@/store/authStore'
import { usePgStore } from '@/store/pgStore'
import { useTranslation } from 'react-i18next'

const HIDE_ON = ['/tenants/add', '/tenants/new']

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Animated mesh background ──────────────────────────────────
function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #0d7a57 0%, #1D9E75 40%, #16a06a 100%)' }} />

      {/* Mesh orbs */}
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #4ade80 0%, transparent 70%)',
          animation: 'orb1 8s ease-in-out infinite' }} />
      <div className="absolute -bottom-4 -left-6 h-32 w-32 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)',
          animation: 'orb2 10s ease-in-out infinite' }} />
      <div className="absolute top-2 left-1/2 h-24 w-24 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #6ee7b7 0%, transparent 70%)',
          animation: 'orb3 6s ease-in-out infinite' }} />

      {/* Subtle grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Shine overlay */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />

      <style>{`
        @keyframes orb1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-10px, 8px) scale(1.1); }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(8px, -6px) scale(1.15); }
        }
        @keyframes orb3 {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, 4px) scale(0.9); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}

// ── Live status dot ───────────────────────────────────────────
function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"
        style={{ animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-300"
        style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </span>
  )
}

// ── Greeting logic ────────────────────────────────────────────
function getEmoji(h: number) {
  if (h < 6)  return '🌙'
  if (h < 12) return '☀️'
  if (h < 17) return '🌤️'
  if (h < 20) return '🌆'
  return '🌙'
}

// ── Main TopBar ───────────────────────────────────────────────
export function TopBar() {
  const owner            = useAuthStore((s) => s.owner)
  const { activePgName } = usePgStore()
  const { t }            = useTranslation()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { pathname }     = useLocation()

  if (HIDE_ON.some(p => pathname.startsWith(p))) return null

  const h         = new Date().getHours()
  const part      = h < 12 ? t('good_morning') : h < 17 ? t('good_afternoon') : t('good_evening')
  const firstName = owner?.name?.split(' ')[0] ?? 'there'
  const emoji     = getEmoji(h)

  return (
    <>
      <header
        className="sticky top-0 z-40 "
        style={{
          borderRadius: '0 0 24px 24px',
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          overflow: 'hidden',
        }}
      >
        <MeshBackground />

        <div className="relative z-10 max-w-6xl mx-auto">

          {/* ── Row 1: Greeting + Actions ──────────────────── */}
          <div className="flex items-center justify-between mb-4">

            {/* Left: Logo + greeting */}
            <div className="flex items-center gap-3 min-w-0">
              {/* App icon with glow */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-2xl blur-md opacity-40"
                  style={{ background: 'rgba(255,255,255,0.5)', transform: 'scale(0.8) translateY(4px)' }} />
                <img
                  src="/image/ownant-app-icon.png"
                  alt="Ownant"
                  className="relative h-10 w-10 rounded-2xl object-cover"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)' }}
                />
              </div>

              {/* Greeting text */}
              <div className="min-w-0">
                <p className="text-[11px] font-medium leading-none mb-1"
                  style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {part} {emoji}
                </p>
                <p className="text-base font-extrabold text-white leading-none truncate tracking-tight">
                  {firstName}
                </p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">

              {/* Notification bell */}
              <Link to="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-2xl transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
                aria-label="Notifications">
                <Bell className="h-[18px] w-[18px] text-white" />
                {/* Notification dot */}
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 border border-white/30" />
              </Link>

              {/* Avatar */}
              <Link to="/profile"
                className="relative flex h-9 w-9 items-center justify-center rounded-2xl transition-all active:scale-95 overflow-hidden"
                style={{
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
                aria-label="Profile">
                <span className="text-sm font-extrabold text-primary tracking-tight">
                  {owner?.name ? initials(owner.name) : '?'}
                </span>
                {/* Shine */}
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
              </Link>
            </div>
          </div>

          {/* ── Row 2: Stats strip ─────────────────────────── */}
          {/* Quick stat pills */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar">
            {[
              { label: 'Live listing', icon: '🟢', highlight: true },
              { label: 'Ownant Pro', icon: '⚡', highlight: false },
            ].map((pill, i) => (
              <div key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
                style={{
                  background: pill.highlight
                    ? 'rgba(255,255,255,0.18)'
                    : 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                <span className="text-[11px]">{pill.icon}</span>
                <span className="text-[11px] font-bold text-white/90">{pill.label}</span>
              </div>
            ))}
          </div>

          {/* ── Row 3: PG Switcher ─────────────────────────── */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="w-full flex items-center justify-between rounded-2xl px-4 py-3 transition-all active:scale-[0.98] relative overflow-hidden group"
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            {/* Shimmer on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none overflow-hidden">
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: '40%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                animation: 'shimmer-slide 1.5s ease-in-out infinite',
              }} />
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <LiveDot />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-white/50 leading-none mb-0.5">
                  Active property
                </p>
                <p className="text-sm font-bold text-white truncate leading-none">
                  {activePgName ?? 'Select PG'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span className="text-[11px] font-semibold text-white/50">Switch</span>
              <div className="h-6 w-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <ChevronDown className="h-3.5 w-3.5 text-white/70" />
              </div>
            </div>
          </button>

        </div>
      </header>

      <PgSwitcher open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}