import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

const HIDE_ON = ['/tenants/add', '/tenants/new']

// ── 3D Premium Nav Icons ──────────────────────────────────────
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="nav-home" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
      </defs>
      {active ? (
        <>
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H15v-5a1 1 0 00-1-1h-4a1 1 0 00-1 1v5H4a1 1 0 01-1-1V10.5z"
            fill="url(#nav-home)" />
          <path d="M3 10.5L12 3l9 7.5" stroke="#059669" strokeWidth="0.5" fill="none"/>
        </>
      ) : (
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H15v-5a1 1 0 00-1-1h-4a1 1 0 00-1 1v5H4a1 1 0 01-1-1V10.5z"
          fill="none" stroke="#9CA3AF" strokeWidth="1.6" strokeLinejoin="round"/>
      )}
    </svg>
  )
}

function RoomsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="nav-rooms" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA"/>
          <stop offset="100%" stopColor="#2563EB"/>
        </linearGradient>
      </defs>
      {active ? (
        <>
          <rect x="3" y="3" width="7" height="7" rx="2" fill="url(#nav-rooms)"/>
          <rect x="14" y="3" width="7" height="7" rx="2" fill="url(#nav-rooms)" fillOpacity="0.7"/>
          <rect x="3" y="14" width="7" height="7" rx="2" fill="url(#nav-rooms)" fillOpacity="0.7"/>
          <rect x="14" y="14" width="7" height="7" rx="2" fill="url(#nav-rooms)"/>
        </>
      ) : (
        <>
          <rect x="3" y="3" width="7" height="7" rx="2" stroke="#9CA3AF" strokeWidth="1.6" fill="none"/>
          <rect x="14" y="3" width="7" height="7" rx="2" stroke="#9CA3AF" strokeWidth="1.6" fill="none"/>
          <rect x="3" y="14" width="7" height="7" rx="2" stroke="#9CA3AF" strokeWidth="1.6" fill="none"/>
          <rect x="14" y="14" width="7" height="7" rx="2" stroke="#9CA3AF" strokeWidth="1.6" fill="none"/>
        </>
      )}
    </svg>
  )
}

function TenantsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="nav-tenants" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA"/>
          <stop offset="100%" stopColor="#7C3AED"/>
        </linearGradient>
      </defs>
      {active ? (
        <>
          <circle cx="9" cy="7" r="3.5" fill="url(#nav-tenants)"/>
          <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
            stroke="url(#nav-tenants)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          <circle cx="19" cy="8" r="2.5" fill="url(#nav-tenants)" fillOpacity="0.6"/>
          <path d="M22 20c0-2.21-1.79-4-4-4"
            stroke="url(#nav-tenants)" strokeWidth="1.6" strokeLinecap="round" fill="none" strokeOpacity="0.6"/>
        </>
      ) : (
        <>
          <circle cx="9" cy="7" r="3.5" stroke="#9CA3AF" strokeWidth="1.6" fill="none"/>
          <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
            stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
          <circle cx="19" cy="8" r="2.5" stroke="#9CA3AF" strokeWidth="1.6" fill="none"/>
          <path d="M22 20c0-2.21-1.79-4-4-4"
            stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        </>
      )}
    </svg>
  )
}

function PaymentsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="nav-pay" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FCD34D"/>
          <stop offset="100%" stopColor="#D97706"/>
        </linearGradient>
      </defs>
      {active ? (
        <>
          <rect x="2" y="5" width="20" height="14" rx="3" fill="url(#nav-pay)"/>
          <rect x="2" y="9" width="20" height="3" fill="#D97706" fillOpacity="0.4"/>
          <rect x="5" y="14" width="4" height="2" rx="0.5" fill="white" fillOpacity="0.9"/>
        </>
      ) : (
        <>
          <rect x="2" y="5" width="20" height="14" rx="3" stroke="#9CA3AF" strokeWidth="1.6" fill="none"/>
          <line x1="2" y1="9" x2="22" y2="9" stroke="#9CA3AF" strokeWidth="1.4"/>
          <rect x="5" y="13" width="4" height="2" rx="0.5" fill="#9CA3AF"/>
        </>
      )}
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="nav-profile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F472B6"/>
          <stop offset="100%" stopColor="#DB2777"/>
        </linearGradient>
      </defs>
      {active ? (
        <>
          <circle cx="12" cy="8" r="3.5" fill="url(#nav-profile)"/>
          <path d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7"
            stroke="url(#nav-profile)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        </>
      ) : (
        <>
          <circle cx="12" cy="8" r="3.5" stroke="#9CA3AF" strokeWidth="1.6" fill="none"/>
          <path d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7"
            stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        </>
      )}
    </svg>
  )
}

export function BottomNav() {
  
  const { pathname } = useLocation()

  if (HIDE_ON.some(p => pathname.startsWith(p))) return null

  const items = [
    { to: '/dashboard', label: 'Home',     Icon: HomeIcon     },
    { to: '/rooms',     label: 'Rooms',    Icon: RoomsIcon    },
    { to: '/tenants',   label: 'Tenants',  Icon: TenantsIcon  },
    { to: '/payments',  label: 'Payments', Icon: PaymentsIcon },
    { to: '/profile',   label: 'Profile',  Icon: ProfileIcon  },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl lg:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 -8px 32px -4px rgba(0,0,0,0.08)',
      }}
    >
      <ul className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to}
              className="flex flex-col items-center gap-1.5 py-3 w-full relative">
              {({ isActive }) => (
                <>
                  {/* Active pill */}
                  {isActive && (
                    <span className="absolute top-2 left-1/2 -translate-x-1/2 h-8 w-12 rounded-2xl bg-primary/8"
                      style={{ background: 'rgba(29,158,117,0.08)' }}
                    />
                  )}
                  <span className={cn(
                    'relative z-10 transition-all duration-200',
                    isActive ? 'scale-110' : 'opacity-70',
                  )}>
                    <Icon active={isActive} />
                  </span>
                  <span className={cn(
                    'text-[10px] font-bold tracking-wide truncate w-full text-center leading-none relative z-10 transition-colors duration-200',
                    isActive ? 'text-primary' : 'text-gray-400',
                  )}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}