import { Outlet } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { InstallBanner } from '@/components/pwa/InstallBanner'
import { useAuthStore } from '@/store/authStore'

export function AppLayout() {
  // ✅ safer auth check (fixes your previous error)
  const authed = useAuthStore((s) => !!s.accessToken)

  return (
    <div className="flex min-h-svh bg-background">
      
      {/* Sidebar (desktop only) */}
      <SidebarNav />

      <div className="flex min-h-svh flex-1 flex-col pb-24 lg:pb-0">
        
        {/* Top */}
        <TopBar />

        {/* Main Content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
          <Outlet />
        </main>

        {/* Bottom Nav (mobile) */}
        <BottomNav />

        {/* ✅ New Install Banner */}
        {authed ? <InstallBanner /> : null}
      </div>
    </div>
  )
}