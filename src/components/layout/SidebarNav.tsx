import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CreditCard,
  Home,
  LayoutGrid,
  UserRound,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useTranslation } from "react-i18next";

export function SidebarNav() {

  const { t } = useTranslation();

  const main = [
    { to: '/dashboard', label: t("dashboard"), icon: Home },
    { to: '/rooms', label: t("rooms"), icon: LayoutGrid },
    { to: '/tenants', label: t("users"), icon: Users },
    { to: '/payments', label: t("rent_reminder"), icon: CreditCard },
    { to: '/analytics', label: t("analytics"), icon: BarChart3 },
    { to: '/notifications', label: t("notifications"), icon: Bell },
    { to: '/profile', label: t("profile_title"), icon: UserRound },
  ] as const

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-surface lg:block">
      <div className="sticky top-0 flex h-svh flex-col gap-1 p-3 pt-6">

        <p className="px-3 pb-4 text-lg font-bold text-primary">
          OWNANT
        </p>

        {main.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-primaryLight text-primary'
                  : 'text-textSecondary hover:bg-background',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}