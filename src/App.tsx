import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { CatchAll } from '@/routes/CatchAll'
import { AppLayout } from '@/components/layout/AppLayout'
import InstallBanner from '@/components/pwa/InstallBanner'

import { LoginPage } from '@/pages/auth/LoginPage'
import { OtpPage } from '@/pages/auth/OtpPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { OnboardingPgPage } from '@/pages/onboarding/OnboardingPgPage'
import { OnboardingRoomsPage } from '@/pages/onboarding/OnboardingRoomsPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { RoomListPage } from '@/pages/rooms/RoomListPage'
import { RoomDetailPage } from '@/pages/rooms/RoomDetailPage'
import { AddRoomPage } from '@/pages/rooms/AddRoomPage'
import { TenantListPage } from '@/pages/tenants/TenantListPage'
import { AddTenantPage } from '@/pages/tenants/AddTenantPage'
import { TenantDetailPage } from '@/pages/tenants/TenantDetailPage'
import { TenantImportPage } from '@/pages/tenants/TenantImportPage'
import { PaymentListPage } from '@/pages/payments/PaymentListPage'
import { PaymentDetailPage } from '@/pages/payments/PaymentDetailPage'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { BillingPage } from '@/pages/profile/BillingPage'
import { ListingSetupPage } from '@/pages/ListingSetupPage/ListingSetupPage'
import { PaymentSettingsPage } from '@/pages/PaymentSettings/PaymentSettingsPage'
import { CheckinPage } from '@/pages/checkin/CheckinPage'
import { ElectricityPage } from '@/pages/electricity/ElectricityPage'

export default function App() {
  return (
    <BrowserRouter>
      <InstallBanner />

      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/otp"      element={<OtpPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkin/go" element={<CheckinPage />} />

        <Route
          path="/onboarding/pg"
          element={<ProtectedRoute><OnboardingPgPage /></ProtectedRoute>}
        />
        <Route
          path="/onboarding/rooms"
          element={<ProtectedRoute><OnboardingRoomsPage /></ProtectedRoute>}
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/listing/setup" element={<ListingSetupPage />} />
          <Route path="/"                element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"       element={<DashboardPage />} />
          <Route path="/rooms"           element={<RoomListPage />} />
          <Route path="/rooms/add"       element={<AddRoomPage />} />
          <Route path="/rooms/:id"       element={<RoomDetailPage />} />
          <Route path="/rooms/:id/edit"  element={<AddRoomPage />} />
          <Route path="/tenants"         element={<TenantListPage />} />
          <Route path="/tenants/add"     element={<AddTenantPage />} />
          <Route path="/tenants/import"  element={<TenantImportPage />} />
          <Route path="/tenants/:id"     element={<TenantDetailPage />} />
          <Route path="/payments"        element={<PaymentListPage />} />
          <Route path="/payments/:id"    element={<PaymentDetailPage />} />
          <Route path="/analytics"       element={<AnalyticsPage />} />
          <Route path="/notifications"   element={<NotificationsPage />} />
          <Route path="/profile"         element={<ProfilePage />} />
          <Route path="/billing"         element={<BillingPage />} />
          <Route path="/payment-settings" element={<PaymentSettingsPage />} />
          <Route path="/electricity" element={<ElectricityPage />} />
          
        </Route>

        <Route path="*" element={<CatchAll />} />
      </Routes>
    </BrowserRouter>
  )
}