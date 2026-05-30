import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

// Pages where bottom nav should be hidden
const HIDE_ON = ['/tenants/add', '/tenants/new']

// Premium SVG icons — custom drawn, not lucide
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H15v-5a1 1 0 00-1-1h-4a1 1 0 00-1 1v5H4a1 1 0 01-1-1V10.5z"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.6}
      strokeLinejoin="round"
    />
  </svg>
)

const RoomsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 1.6} />
    <rect x="14" y="3" width="7" height="7" rx="1.5"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 1.6} />
    <rect x="3" y="14" width="7" height="7" rx="1.5"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 1.6} />
    <rect x="14" y="14" width="7" height="7" rx="1.5"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 1.6} />
  </svg>
)

const TenantsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="3.5"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 1.6} />
    <path
      d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      fill="none"
    />
    <circle cx="19" cy="8" r="2.5"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 1.6} />
    <path
      d="M22 20c0-2.21-1.79-4-4-4"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      fill="none"
    />
  </svg>
)

const PaymentsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="2.5"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 1.6} />
    <path d="M2 9h20" stroke={active ? 'white' : 'currentColor'} strokeWidth="1.6" />
    <rect x="5" y="13" width="4" height="2" rx="0.5"
      fill={active ? 'white' : 'currentColor'} />
  </svg>
)

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.5"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={active ? 0 : 1.6} />
    <path
      d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      fill="none"
    />
  </svg>
)

export function BottomNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  if (HIDE_ON.some(p => pathname.startsWith(p))) return null

  const items = [
    { to: '/dashboard', label: t('dashboard'),    Icon: HomeIcon     },
    { to: '/rooms',     label: t('rooms'),         Icon: RoomsIcon    },
    { to: '/tenants',   label: t('users'),         Icon: TenantsIcon  },
    { to: '/payments',  label: t('rent_reminder'), Icon: PaymentsIcon },
    { to: '/profile',   label: t('profile'),       Icon: ProfileIcon  },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white lg:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -1px 0 0 rgba(0,0,0,0.06), 0 -8px 24px -4px rgba(0,0,0,0.08)',
      }}
    >
      <ul
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className="flex flex-col items-center gap-1 py-2.5 w-full relative"
            >
              {({ isActive }) => (
                <>
                  {/* Active pill background */}
                  {isActive && (
                    <span className="absolute top-1.5 left-1/2 -translate-x-1/2 h-8 w-12 rounded-2xl bg-primary/10" />
                  )}

                  <span className={cn(
                    'relative z-10 transition-all duration-200',
                    isActive ? 'text-primary scale-110' : 'text-gray-400',
                  )}>
                    <Icon active={isActive} />
                  </span>

                  <span className={cn(
                    'text-[10px] font-semibold tracking-wide truncate w-full text-center leading-none relative z-10 transition-colors duration-200',
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