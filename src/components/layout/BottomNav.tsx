import { NavLink, useLocation } from 'react-router-dom'
import { CreditCard, Home, LayoutGrid, UserRound, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

// Pages where bottom nav should be hidden
const HIDE_ON = [
  '/tenants/add',
  '/tenants/new',
]

export function BottomNav() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  if (HIDE_ON.some(p => pathname.startsWith(p))) return null

  const items = [
    { to: '/dashboard', label: t('dashboard'),    icon: Home       },
    { to: '/rooms',     label: t('rooms'),         icon: LayoutGrid },
    { to: '/tenants',   label: t('users'),         icon: Users      },
    { to: '/payments',  label: t('rent_reminder'), icon: CreditCard },
    { to: '/profile',   label: t('profile'),       icon: UserRound  },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface lg:hidden"
      // ✅ FIXED: pb-safe doesn't exist in Tailwind by default.
      // Use inline style with env() for iPhone notch / home indicator support.
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/*
        ✅ FIXED: Use grid instead of flex justify-between so items
        are evenly spread on all screen widths without overflow.
      */}
      <ul
        className="mx-auto grid max-w-lg pt-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 text-xs font-medium w-full',
                  isActive ? 'text-primary' : 'text-textTertiary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                    )}
                  </span>
                  {/* ✅ FIXED: truncate label so it never wraps or overflows */}
                  <span className="truncate w-full text-center leading-none">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}