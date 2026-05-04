import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useOwnerProfile, useLogout } from '@/hooks/useAuth'
import { usePgsList } from '@/hooks/usePgs'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { usePgStore } from '@/store/pgStore'
import { useEffect } from 'react'

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ProfilePage() {

  const navigate = useNavigate()

  const { data: owner, isLoading } = useOwnerProfile()
  const pgs = usePgsList()
  const logout = useLogout()

  const logoutStore = useAuthStore((s) => s.logout)
  const clearActivePg = usePgStore((s) => s.clearActivePg)

  const [pgSheet, setPgSheet] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const sub = owner?.subscription

  // current plan voilate limit, redirect to billing if so owner can upgrade the next plan before the next billing cycle
  useEffect(() => {
    console.log("owner.........",owner)
    if (!isLoading && owner) {
     

      if (
  sub &&
  (sub.maxBeds !== -1 || sub.maxPgs !== -1) &&
  (sub.currentBeds > sub.maxBeds || sub.currentPgs > sub.maxPgs)
) { 
        navigate('/billing')
      }
    }
  }, [isLoading, owner, navigate])  


  

  const bedPct = sub?.bedUsagePct ?? 0
  const pgPct = sub?.pgUsagePct ?? 0

  const barColor =
    bedPct > 95
      ? 'bg-red-500'
      : bedPct > 80
      ? 'bg-yellow-500'
      : 'bg-green-600'

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-6">

      {/* ================= HEADER ================= */}
      <h1 className="text-2xl font-bold text-textPrimary">
        Profile & Settings
      </h1>

      {isLoading || !owner ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : (
        <>
          {/* ================= PROFILE CARD ================= */}
          <Card className="flex items-center gap-4 p-4 rounded-2xl shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
              {initials(owner.name)}
            </div>

            <div>
              <h2 className="text-lg font-semibold">{owner.name}</h2>
              <p className="text-sm text-textSecondary">{owner.phone}</p>
              <p className="text-xs text-textTertiary">
                Member since {new Date(owner.memberSince).toLocaleDateString()}
              </p>
            </div>
          </Card>

          {/* ================= SUBSCRIPTION ================= */}
          <Card className="p-5 rounded-2xl shadow-sm border-t-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {sub?.plan ?? 'Starter Plan'}
                </h3>
                <p className="text-xs text-green-600 font-medium">
                  {sub?.status ?? 'Active'}
                </p>
              </div>

              <Link
                to="/billing"
                className="text-sm font-semibold text-primary"
              >
                Upgrade
              </Link>
            </div>

            {sub && (
              <>
                {/* Renewal */}
                <p className="mt-3 text-sm text-textSecondary">
                  Renews {new Date(sub.renewsAt).toDateString()}
                </p>

                {/* Beds */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Beds</span>
                    <span>
                      {sub.currentBeds} / {sub.maxBeds}
                    </span>
                  </div>

                  <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${barColor}`}
                      style={{ width: `${bedPct}%` }}
                    />
                  </div>
                </div>

                {/* PGs */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span>PGs</span>
                    <span>
                      {sub.currentPgs} / {sub.maxPgs}
                    </span>
                  </div>

                  <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-600"
                      style={{ width: `${pgPct}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* ================= MENU ================= */}
          <Card className="divide-y rounded-2xl overflow-hidden">
            <button
              onClick={() => setPgSheet(true)}
              className="flex w-full items-center justify-between px-4 py-4 text-sm font-medium hover:bg-gray-50"
            >
              My PGs
              <div className="flex items-center gap-2">
                <span className="bg-primaryLight text-primary text-xs px-2 py-0.5 rounded-full">
                  {pgs.data?.length ?? 0}
                </span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>

            <button
              disabled
              className="px-4 py-4 text-left text-sm text-gray-400"
            >
              Notification settings (coming soon)
            </button>

            <a
              href="mailto:support@pgmanager.app"
              className="flex items-center justify-between px-4 py-4 text-sm"
            >
              Help & Support
              <ChevronRight className="h-4 w-4" />
            </a>

            <a
              href="#"
              className="flex items-center justify-between px-4 py-4 text-sm"
            >
              Terms & Privacy
              <ChevronRight className="h-4 w-4" />
            </a>
          </Card>

          {/* ================= LOGOUT ================= */}
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full text-center text-red-500 font-semibold py-3"
          >
            Log out
          </button>
        </>
      )}

      {/* ================= PG SHEET ================= */}
      <BottomSheet open={pgSheet} onOpenChange={setPgSheet} title="Your PGs">
        <ul className="space-y-2">
          {(pgs.data ?? []).map((pg) => (
            <li
              key={pg.id}
              className="border rounded-lg p-3 text-sm"
            >
              {pg.name} · {pg.city}
            </li>
          ))}
        </ul>
      </BottomSheet>

      {/* ================= LOGOUT MODAL ================= */}
      <Modal
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Logout?"
        description="You will need OTP to sign in again."
      >
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setConfirmLogout(false)}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            className="flex-1"
            disabled={logout.isPending}
            onClick={async () => {
              await logout.mutateAsync()
              logoutStore()
              clearActivePg()
              navigate('/login', { replace: true })
            }}
          >
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}