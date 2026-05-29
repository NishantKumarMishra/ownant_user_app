import { Outlet } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { SidebarNav } from '@/components/layout/SidebarNav'
import InstallBanner from '@/components/pwa/InstallBanner'
import { useAuthStore } from '@/store/authStore'

export function AppLayout() {
  const authed = useAuthStore((s) => !!s.accessToken)

  return (
    // ✅ FIXED: overflow-x-hidden prevents horizontal scroll at root level
    <div className="flex min-h-svh bg-background overflow-x-hidden">

      {/* Sidebar — desktop only */}
      <SidebarNav />

      {/*
        ✅ FIXED: Removed fragile [&:has(~nav)] selector.
        Simple pb-20 on mobile (bottom nav height) and pb-0 on desktop.
        lg:pb-0 hides bottom nav padding on desktop.
      */}
      <div className="flex min-h-svh flex-1 flex-col pb-20 lg:pb-0 overflow-x-hidden min-w-0">

        {/* Top */}
        <TopBar />

        {/* Main Content */}
        {/*
          ✅ FIXED: w-full + overflow-x-hidden ensures content never bleeds out.
          max-w-6xl is fine — it's capped and centered.
        */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 overflow-x-hidden">
          <Outlet />
        </main>

        {/* Bottom Nav — mobile only */}
        <BottomNav />

        {authed ? <InstallBanner /> : null}
      </div>
    </div>
  )
}