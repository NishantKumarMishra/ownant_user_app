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

const main = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/rooms', label: 'Rooms', icon: LayoutGrid },
  { to: '/tenants', label: 'Tenants', icon: Users },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserRound },
] as const

export function SidebarNav() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-surface lg:block">
      <div className="sticky top-0 flex h-svh flex-col gap-1 p-3 pt-6">
        <p className="px-3 pb-4 text-lg font-bold text-primary">OWNANT</p>
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
