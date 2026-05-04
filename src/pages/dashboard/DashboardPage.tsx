import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Grid3x3, Bell, CreditCard } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { CollectionChart } from '@/components/dashboard/CollectionChart'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { useDashboard } from '@/hooks/useAnalytics'
import { useGenerateBulkPayments } from '@/hooks/usePayments'
import { useTriggerReminders } from '@/hooks/useNotifications'
import toast from 'react-hot-toast'
import { handleApiError } from '@/lib/apiError'
import { format } from 'date-fns'
import {
  Percent,
  BedDouble,
  AlertCircle,
  IndianRupee,
} from 'lucide-react'

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard()
  console.log('Dashboard data:', data)
  const [bulkOpen, setBulkOpen] = useState(false)

  const bulk = useGenerateBulkPayments()
  const reminders = useTriggerReminders()

  const monthYear = format(new Date(), 'yyyy-MM')

  // Backend nested DTO mapping fix
  const trend =
    data?.sixMonthTrend?.map((t) => ({
      month: t.monthYear,
      expected: t.expected,
      collected: t.collected,
    })) ?? []

  if (isError) {
    return (
      <div className="rounded-xl border border-dangerLight bg-dangerLight/30 p-4 text-sm text-danger">
        Could not load dashboard{' '}
        <button
          type="button"
          className="font-semibold underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-24 w-full"
            />
          ))}
        </div>

        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Backend nested object values
  const overdue = data.collection?.overdueCount ?? 0
  const collectionRate = data.collection?.collectionRate ?? 0
  const occupiedBeds = data.occupancy?.occupiedBeds ?? 0
  const totalBeds = data.occupancy?.totalBeds ?? 0
  const expectedRevenue = data.collection?.totalExpected ?? 0
  
 // const activeTenants = data.tenants?.activeTenants ?? 0
  const revenue = data.collection?.totalCollected?? 0

  return (
    <div className="space-y-6">
      {overdue > 0 ? (
        <Link
          to="/payments?filter=overdue"
          className="flex items-center justify-between rounded-xl border border-warning bg-warningLight px-4 py-3 text-sm font-medium text-warning"
        >
          <span>
            {overdue} payment{overdue > 1 ? 's' : ''} overdue — View
          </span>
          <span aria-hidden>→</span>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="Collection rate"
          value={`${Math.round(collectionRate)}%`}
          hint="vs expected"
           icon={<Percent className="h-5 w-5" />}
        />

        <MetricCard
          label="Beds occupied"
          value={`${occupiedBeds}/${totalBeds}`}
          icon={<BedDouble className="h-5 w-5" />}
        />

        <MetricCard
          label="Overdue payments"
          value={String(overdue)}
           icon={<AlertCircle className="h-5 w-5" />}
        />

        <MetricCard
          label="This month"
         value={`₹ ${Intl.NumberFormat('en-IN').format(revenue)}`}
         hint={`Expected ₹ ${Intl.NumberFormat('en-IN').format(expectedRevenue)}`}
          icon={<IndianRupee className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          variant="secondary"
          className="h-auto w-full flex-col gap-1 py-3"
          asChild
        >
          <Link to="/tenants/add">
            <UserPlus className="h-5 w-5 text-primary" />
            <span className="text-xs">Add Tenant</span>
          </Link>
        </Button>

        <Button
          variant="secondary"
          className="h-auto w-full flex-col gap-1 py-3"
          asChild
        >
          <Link to="/rooms">
            <Grid3x3 className="h-5 w-5 text-primary" />
            <span className="text-xs">View Rooms</span>
          </Link>
        </Button>

        <Button
          variant="secondary"
          className="h-auto w-full flex-col gap-1 py-3"
          type="button"
          onClick={() => setBulkOpen(true)}
        >
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="text-xs">Generate Payments</span>
        </Button>

        <Button
          variant="secondary"
          className="h-auto w-full flex-col gap-1 py-3"
          type="button"
          disabled={reminders.isPending}
          onClick={async () => {
            try {
              const r = await reminders.mutateAsync()

              toast.success(
                `Sent ${r.sent}, skipped ${r.skipped}, failed ${r.failed}`
              )
            } catch (e) {
              handleApiError(e)
            }
          }}
        >
          <Bell className="h-5 w-5 text-primary" />
          <span className="text-xs">Send Reminders</span>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-textPrimary">
          6-month collection
        </h2>

        <p className="text-xs text-textSecondary">
          Expected vs collected
        </p>

        <div className="mt-4">
          <CollectionChart data={trend} />
        </div>
      </div>

      <Modal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Generate payments"
        description={`Create rent entries for all active tenants for ${format(
          new Date(),
          'MMMM yyyy'
        )}.`}
      >
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            type="button"
            onClick={() => setBulkOpen(false)}
          >
            Cancel
          </Button>

          <Button
            className="flex-1"
            type="button"
            disabled={bulk.isPending}
            onClick={async () => {
              try {
                await bulk.mutateAsync(monthYear)

                toast.success('Payments generated')
                setBulkOpen(false)
              } catch (e) {
                handleApiError(e)
              }
            }}
          >
            {bulk.isPending ? 'Working…' : 'Confirm'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}