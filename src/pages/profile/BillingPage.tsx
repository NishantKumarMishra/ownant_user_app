import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBillingPlans, useCheckout, useVerifyPayment } from '@/hooks/useBilling'
import { useOwnerProfile } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/format'
import toast from 'react-hot-toast'
import { handleApiError } from '@/lib/apiError'

export function BillingPage() {
  const { data: plans, isLoading } = useBillingPlans()
  const owner = useOwnerProfile()
  const checkout = useCheckout()
  const verify = useVerifyPayment()
  const current = owner.data?.subscription?.plan

  

  const startRazorpay = async (planCode: string) => {
    if (!window.Razorpay) {
      toast.error('Razorpay SDK not loaded')
      return
    }
    try {
      const session = await checkout.mutateAsync(planCode)
      const rzp = new window.Razorpay({
        key: session.razorpayKeyId,
        subscription_id: session.subscriptionId,
        name: 'OWNANT',
        description: session.planName,
        handler: async (response) => {
          try {
            const verifyResponse = await verify.mutateAsync({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature: response.razorpay_signature,
            })
            console.log('VERIFY RESPONSE => ', verifyResponse)
            toast.success('Subscription updated')
          } catch (e) {
            handleApiError(e)
          }
        },
        prefill: {
          name: session.ownerName,
          contact: session.ownerPhone,
          email: session.ownerEmail,
        },
        theme: { color: '#0F6E56' },
      })
      rzp.open()
    } catch (e) {
      handleApiError(e)
    }
  }

  if (isLoading || !plans) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-xl font-bold text-textPrimary">Billing</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const active = plan.code === current
          const popular = plan.popular || plan.code === 'PRO'
          return (
            <Card
              key={plan.code}
              className={`relative flex flex-col p-4 ${active ? 'ring-2 ring-primary' : ''}`}
            >
              {popular ? (
                <Badge className="absolute right-3 top-3">Most Popular</Badge>
              ) : null}
              <h2 className="text-lg font-bold">{plan.name}</h2>
              <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(plan.priceMonthly)}</p>
              <p className="text-xs text-textSecondary">per month</p>
              <ul className="mt-4 flex-1 space-y-2 text-xs text-textSecondary">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {active ? (
                <Button variant="secondary" className="mt-4 w-full" disabled type="button">
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="mt-4 w-full"
                  type="button"
                  disabled={checkout.isPending}
                  onClick={() => void startRazorpay(plan.code)}
                >
                  Upgrade
                </Button>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
