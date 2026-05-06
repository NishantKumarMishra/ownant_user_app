import { useState } from 'react'
import { Check, Zap, ChevronDown, ChevronUp, Plus, Minus, ShieldCheck, Clock, Star } from 'lucide-react'
import { Badge }    from '@/components/ui/Badge'
import { Button }   from '@/components/ui/Button'
import { Card }     from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  useBillingPlans,
  useSubscription,
  useAddons,
  useCheckout,
  useVerifyPayment,
  useAddonCheckout,
  useVerifyAddonPayment,
  useCancelSubscription,
} from '@/hooks/useBilling'
import { useOwnerProfile } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/format'
import { handleApiError } from '@/lib/apiError'
import type {  FullSubscription, AddonPurchase } from '@/api/types'
import toast from 'react-hot-toast'

const PLAN_ORDER = ['FREE', 'BASIC', 'PRO', 'BUSINESS']

export function BillingPage() {
  const { data: plans, isLoading: plansLoading } = useBillingPlans()
  const { data: sub,   isLoading: subLoading   } = useSubscription()
  const { data: addons                          } = useAddons()
  const owner = useOwnerProfile()

  const checkout      = useCheckout()
  const verifyPayment = useVerifyPayment()
  const addonCheckout = useAddonCheckout()
  const verifyAddon   = useVerifyAddonPayment()
  const cancelSub     = useCancelSubscription()

  const [addonQty,         setAddonQty        ] = useState(5)
  const [showAddonSection, setShowAddonSection ] = useState(false)
  const [showCancel,       setShowCancel       ] = useState(false)
  const [processingPlan,   setProcessingPlan   ] = useState<string | null>(null)

  const currentPlan  = owner.data?.subscription?.plan ?? sub?.plan ?? 'FREE'
 // const isOnPaidPlan = currentPlan !== 'FREE'
  const canBuyAddons = currentPlan !== 'BUSINESS'
  const addonTotal   = addonQty * 99

  // ── Base plan upgrade (your original pattern kept exactly) ────
  const handleUpgrade = async (planCode: string) => {
    if (!window.Razorpay) {
      toast.error('Razorpay SDK not loaded')
      return
    }
    try {
      setProcessingPlan(planCode)
      const session = await checkout.mutateAsync(planCode)
      const rzp = new window.Razorpay({
        key:             session.razorpayKeyId,
        subscription_id: session.subscriptionId,
        name:            'OWNANT',
        description:     session.planName,
        handler: async (response: any) => {
          try {
            await verifyPayment.mutateAsync({
              razorpayPaymentId:      response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature:      response.razorpay_signature,
            })
            toast.success(`Upgraded to ${planCode} plan!`)
          } catch (e) {
            handleApiError(e)
          } finally {
            setProcessingPlan(null)
          }
        },
        prefill: {
          name:    session.ownerName,
          contact: session.ownerPhone,
          email:   session.ownerEmail?.toString() ?? undefined,
        },
        theme:  { color: '#0F6E56' },
        modal:  { ondismiss: () => setProcessingPlan(null) },
      })
      rzp.open()
    } catch (e) {
      handleApiError(e)
      setProcessingPlan(null)
    }
  }

  // ── Addon beds purchase ───────────────────────────────────────
  const handleAddonPurchase = async () => {
    if (!window.Razorpay) {
      toast.error('Razorpay SDK not loaded')
      return
    }
    try {
      const session = await addonCheckout.mutateAsync({
        addonType: 'BEDS',
        quantity:  addonQty,
      })
      const rzp = new window.Razorpay({
        key:      session.razorpayKeyId,
        order_id: session.orderId,           // order not subscription
        amount:   Math.round(session.totalAmount * 100),
        currency: session.currency,
        name:     'OWNANT',
        description: `${session.quantity} extra bed${session.quantity > 1 ? 's' : ''} addon`,
        handler: async (response: any) => {
          try {
            await verifyAddon.mutateAsync({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId:   response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              addonType:         'BEDS',
              quantity:          addonQty,
            })
            toast.success(`${addonQty} addon beds activated!`)
          } catch (e) {
            handleApiError(e)
          }
        },
        prefill: { name: session.ownerName, contact: session.ownerPhone },
        theme:   { color: '#0F6E56' },
      })
      rzp.open()
    } catch (e) {
      handleApiError(e)
    }
  }

  // ── Cancel ───────────────────────────────────────────────────
  const handleCancel = async () => {
    try {
      await cancelSub.mutateAsync('Owner requested cancellation')
      toast.success('Subscription cancelled. Access continues until renewal date.')
      setShowCancel(false)
    } catch (e) {
      handleApiError(e)
    }
  }

  if (plansLoading || subLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-textPrimary">Plans & Billing</h1>
        <p className="text-sm text-textSecondary mt-0.5">
          Manage your subscription and grow at your own pace.
        </p>
      </div>

      {/* ── Current plan card ───────────────────────────────── */}
      {sub && <CurrentPlanCard sub={sub} />}

      {/* ── Plan cards (your original grid pattern) ─────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-textPrimary">Choose your plan</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {plans?.map((plan) => {
            const isActive     = plan.code === currentPlan
            const planIdx      = PLAN_ORDER.indexOf(plan.code)
            const currentIdx   = PLAN_ORDER.indexOf(currentPlan)
            const isUpgrade    = planIdx > currentIdx
            const isProcessing = processingPlan === plan.code

            return (
              <Card
                key={plan.code}
                className={`relative flex flex-col p-4 transition-all ${
                  isActive ? 'ring-2 ring-primary' : ''
                }`}
              >
                {/* Badges */}
                {isActive && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-success text-white border-0 text-xs">
                    ✓ Current Plan
                  </Badge>
                )}
                {plan.popular && !isActive && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-white border-0 text-xs">
                    Most Popular
                  </Badge>
                )}

                <h2 className="text-sm font-bold text-textPrimary mt-2">
                  {plan.code}
                </h2>

                {/* Price */}
                <div className="mt-1 mb-3">
                  {plan.priceMonthly === 0 ? (
                    <p className="text-2xl font-bold text-textPrimary">Free</p>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(plan.priceMonthly)}
                      </p>
                      <p className="text-xs text-textSecondary">per month</p>
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-1.5 mb-4">
                  {plan.features?.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-textSecondary">
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isActive ? (
                  <Button variant="secondary" className="mt-auto w-full" disabled type="button">
                    Current Plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    type="button"
                    className="mt-auto w-full"
                    disabled={!!processingPlan}
                    onClick={() => void handleUpgrade(plan.code)}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Processing…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <Zap className="h-3.5 w-3.5" />
                        Upgrade
                      </span>
                    )}
                  </Button>
                ) : (
                  <Button variant="secondary" className="mt-auto w-full opacity-40" disabled type="button">
                    Lower plan
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── Addon beds ──────────────────────────────────────── */}
      {canBuyAddons && (
        <Card className="overflow-hidden p-0">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-background/50 transition-colors"
            onClick={() => setShowAddonSection(v => !v)}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primaryLight flex items-center justify-center flex-shrink-0">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-textPrimary">Need more beds?</p>
                <p className="text-xs text-textSecondary">
                  Buy extra beds at ₹99/bed — no plan change needed
                </p>
              </div>
            </div>
            {showAddonSection
              ? <ChevronUp  className="h-4 w-4 text-textSecondary flex-shrink-0" />
              : <ChevronDown className="h-4 w-4 text-textSecondary flex-shrink-0" />
            }
          </button>

          {showAddonSection && (
            <div className="border-t border-border px-4 py-4 space-y-4">

              {sub && sub.addonBeds > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-primaryLight px-3 py-2.5">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-xs text-primary font-medium">
                    You have {sub.addonBeds} active addon beds — total capacity {sub.effectiveBedLimit} beds
                  </p>
                </div>
              )}

              {/* Quantity picker */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-textSecondary">
                  How many extra beds?
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                    <button
                      type="button"
                      className="h-6 w-6 rounded-lg border border-border bg-surface flex items-center justify-center hover:border-primary transition-colors disabled:opacity-40"
                      onClick={() => setAddonQty(q => Math.max(1, q - 1))}
                      disabled={addonQty <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-textPrimary">
                      {addonQty}
                    </span>
                    <button
                      type="button"
                      className="h-6 w-6 rounded-lg border border-border bg-surface flex items-center justify-center hover:border-primary transition-colors disabled:opacity-40"
                      onClick={() => setAddonQty(q => Math.min(100, q + 1))}
                      disabled={addonQty >= 100}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div>
                    <p className="text-base font-bold text-textPrimary">
                      {formatCurrency(addonTotal)}
                      <span className="text-xs font-normal text-textSecondary ml-1">
                        one-time
                      </span>
                    </p>
                    <p className="text-xs text-textSecondary">{addonQty} beds × ₹99</p>
                  </div>
                </div>

                {/* Quick presets */}
                <div className="flex gap-2 flex-wrap">
                  {[5, 10, 25, 50].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAddonQty(n)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                        addonQty === n
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background text-textSecondary border-border hover:border-primary'
                      }`}
                    >
                      +{n} beds
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                disabled={addonCheckout.isPending || verifyAddon.isPending}
                className="w-full"
                onClick={() => void handleAddonPurchase()}
              >
                {addonCheckout.isPending || verifyAddon.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Zap className="h-4 w-4" />
                    Buy {addonQty} beds for {formatCurrency(addonTotal)}
                  </span>
                )}
              </Button>

              {/* Addon history */}
              {addons && addons.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-textSecondary uppercase tracking-wide">
                    Purchase History
                  </p>
                  {addons.map(addon => (
                    <AddonHistoryRow key={addon.id} addon={addon} />
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Trust signals ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: ShieldCheck, label: 'Bank-grade security' },
          { icon: Clock,       label: 'Cancel anytime'      },
          { icon: Star,        label: 'No hidden charges'   },
        ].map(({ icon: Icon, label }) => (
          <Card key={label} className="flex flex-col items-center gap-1.5 p-3 text-center">
            <Icon className="h-4 w-4 text-primary" />
            <p className="text-xs text-textSecondary">{label}</p>
          </Card>
        ))}
      </div>

      {/* ── Cancel section ──────────────────────────────────── */}
      {sub?.isActive && sub?.plan !== 'FREE' &&  (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-textPrimary">
                Cancel subscription
              </p>
              {sub?.renewsAt && (
                <p className="text-xs text-textSecondary mt-0.5">
                  Access continues until{' '}
                  {new Date(sub.renewsAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCancel(v => !v)}
              className="text-xs text-danger font-medium hover:underline"
            >
              Cancel plan
            </button>
          </div>

          {showCancel && (
            <div className="mt-4 rounded-xl bg-dangerLight border border-danger/20 px-4 py-3 space-y-3">
              <p className="text-sm font-medium text-danger">Are you sure?</p>
              <p className="text-xs text-textSecondary">
                All paid features and addon beds stop after your renewal date.
                Your data is always safe and exportable.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowCancel(false)}
                >
                  Keep plan
                </Button>
                <Button
                  type="button"
                  disabled={cancelSub.isPending}
                  className="flex-1 bg-danger hover:bg-danger/90"
                  onClick={() => void handleCancel()}
                >
                  {cancelSub.isPending ? 'Cancelling…' : 'Yes, cancel'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

    </div>
  )
}

// ── Current Plan Card ─────────────────────────────────────────
function CurrentPlanCard({ sub }: { sub: FullSubscription }) {
  const effective = sub.effectiveBedLimit
  const bedPct    = effective === -1 ? 0 : Math.min(sub.bedUsagePct, 100)
  const pgPct     = sub.maxPgs === -1  ? 0 : Math.min(sub.pgUsagePct, 100)
  const bedColor  = bedPct >= 95 ? 'bg-danger'
                  : bedPct >= 80 ? 'bg-warning' : 'bg-primary'

  return (
    <Card className="p-0 overflow-hidden border-primary/30">
      <div className="bg-primaryLight px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Current Plan
              </span>
              <Badge className={`text-xs ${
                sub.isActive
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-danger/10 text-danger border-danger/20'
              }`}>
                {sub.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xl font-bold text-textPrimary">{sub.plan}</p>
            {sub.plan !== 'FREE' && (
              <p className="text-xs text-textSecondary mt-0.5">
                {formatCurrency(sub.amountMonthly)}/month
                {sub.addonBedsMonthlyPrice > 0 && (
                  <span> + {formatCurrency(sub.addonBedsMonthlyPrice)} addon</span>
                )}
              </p>
            )}
          </div>
          {sub.renewsAt && (
            <div className="text-right">
              <p className="text-xs text-textSecondary">Renews</p>
              <p className="text-sm font-semibold text-textPrimary">
                {new Date(sub.renewsAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-primary/20 space-y-2.5">
        <UsageBar label="Beds" used={sub.currentBeds} limit={effective}
          addon={sub.addonBeds} pct={bedPct} color={bedColor} />
        <UsageBar label="PGs" used={sub.currentPgs} limit={sub.maxPgs}
          pct={pgPct} color="bg-primary" />
      </div>
    </Card>
  )
}

// ── Usage Bar ─────────────────────────────────────────────────
function UsageBar({ label, used, limit, pct, color, addon }: {
  label: string; used: number; limit: number
  pct: number; color: string; addon?: number
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-textSecondary">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-textPrimary">
            {used} / {limit === -1 ? '∞' : limit}
          </span>
          {addon != null && addon > 0 && (
            <span className="text-xs text-primary">(+{addon} addon)</span>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-primary/10">
        <div className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Addon History Row ─────────────────────────────────────────
function AddonHistoryRow({ addon }: { addon: AddonPurchase }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${
          addon.status === 'ACTIVE' ? 'bg-success' : 'bg-textTertiary'
        }`} />
        <span className="text-xs text-textPrimary">{addon.quantity} extra beds</span>
        <Badge className={`text-xs ${
          addon.status === 'ACTIVE'
            ? 'bg-success/10 text-success border-success/20'
            : 'bg-background text-textTertiary'
        }`}>
          {addon.status}
        </Badge>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-textPrimary">
          {formatCurrency(addon.totalPrice)}
        </p>
        <p className="text-xs text-textSecondary">
          {new Date(addon.purchasedAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </div>
    </div>
  )
}