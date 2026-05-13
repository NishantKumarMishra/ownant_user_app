import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useOwnerProfile, useLogout } from '@/hooks/useAuth'
import { usePgsList } from '@/hooks/usePgs'
import { useListing, usePublishListing, useUnpublishListing } from '@/hooks/useListing'
import { useAuthStore } from '@/store/authStore'
import { usePgStore } from '@/store/pgStore'
import {
  ChevronRight, Sparkles, Globe, Copy, Share2,
  Eye, MessageSquare, TrendingUp, ExternalLink,
  CheckCircle2, AlertCircle, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Completion step ───────────────────────────────────────────
function CompletionStep({
  done, label,
}: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(
        'h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0',
        done ? 'bg-success/10' : 'bg-border',
      )}>
        {done
          ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          : <div className="h-2 w-2 rounded-full bg-border" />
        }
      </div>
      <p className={cn('text-xs', done ? 'text-textSecondary line-through' : 'text-textPrimary font-medium')}>
        {label}
      </p>
    </div>
  )
}

export function ProfilePage() {
  const navigate        = useNavigate()
  const { data: owner, isLoading } = useOwnerProfile()
  const pgs             = usePgsList()
  const logout          = useLogout()
  const { data: listing, isLoading: listingLoading } = useListing()
  const publish         = usePublishListing()
  const unpublish       = useUnpublishListing()
  const logoutStore     = useAuthStore(s => s.logout)
  const clearActivePg   = usePgStore(s => s.clearActivePg)

  const [pgSheet,       setPgSheet]       = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [confirmToggle, setConfirmToggle] = useState(false)

  const sub    = owner?.subscription
  const bedPct = sub?.bedUsagePct ?? 0
  const pgPct  = sub?.pgUsagePct  ?? 0

  const barColor = bedPct > 95 ? 'bg-danger'
                 : bedPct > 80 ? 'bg-warning'
                 : 'bg-success'

  // useEffect(() => {
  //   if (!isLoading && owner && sub) {
  //     if ((sub.maxBeds !== -1 && sub.currentBeds > sub.maxBeds) ||
  //         (sub.maxPgs  !== -1 && sub.currentPgs  > sub.maxPgs)) {
  //       navigate('/billing')
  //     }
  //   }
  // }, [isLoading, owner, navigate])

  const handleCopyLink = () => {
    if (listing?.publicUrl) {
      navigator.clipboard.writeText(listing.publicUrl)
      toast.success('Link copied!')
    }
  }

  const handleWhatsAppShare = () => {
    if (!listing?.publicUrl) return
    const text = encodeURIComponent(
      `🏠 Check out my PG on Ownant!\n\n${listing.publicUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleToggleListing = async () => {
    setConfirmToggle(false)
    try {
      if (listing?.isListed) {
        await unpublish.mutateAsync()
        toast.success('Listing hidden from public search')
      } else {
        await publish.mutateAsync()
        toast.success('🎉 Your PG is now live!')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Something went wrong')
    }
  }

  // Missing fields for completion steps
  const missingFields = listing?.missingFields ?? []
  const completionPct = listing?.completionPercent ?? 0

  const completionBarColor = completionPct >= 60 ? 'bg-success'
                           : completionPct >= 30  ? 'bg-amber-400'
                           : 'bg-primary'

  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-5 pb-24">

      <h1 className="text-xl font-bold text-textPrimary">Profile & Settings</h1>

      {isLoading || !owner ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* ── Profile card ──────────────────────────────── */}
          <div className="flex items-center gap-4 bg-surface rounded-2xl border border-border p-4">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {initials(owner.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-textPrimary">{owner.name}</h2>
              <p className="text-sm text-textSecondary">{owner.phone}</p>
              <p className="text-xs text-textMuted mt-0.5">
                Member since {new Date(owner.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* ── Public profile section ────────────────────── */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <p className="text-sm font-bold text-textPrimary">Public Profile</p>
              </div>
              {listing?.isListed && (
                <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Live
                </span>
              )}
            </div>

            {listingLoading ? (
              <div className="p-4">
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ) : listing ? (
              <div className="p-4 space-y-4">

                {/* Completion progress */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-textSecondary uppercase tracking-wide">
                      Profile completion
                    </p>
                    <p className={cn(
                      'text-xs font-bold',
                      completionPct >= 60 ? 'text-success' : 'text-amber-600',
                    )}>
                      {completionPct}%
                    </p>
                  </div>
                  <div className="h-2 w-full bg-bg rounded-full overflow-hidden border border-border">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', completionBarColor)}
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-textSecondary mt-1.5">
                    {completionPct >= 60
                      ? 'Ready to publish! Add more details to rank higher.'
                      : 'Complete your profile to appear in search results.'}
                  </p>
                </div>

                {/* Completion steps */}
                {missingFields.length > 0 && (
                  <div className="bg-bg rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-textSecondary mb-2">Still needed:</p>
                    {missingFields.map(f => (
                      <CompletionStep key={f} done={false} label={f} />
                    ))}
                  </div>
                )}

                {/* Stats — show only if listed */}
                {listing.isListed && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: <Eye className="h-4 w-4" />,           label: 'Views',     value: listing.viewsCount },
                      { icon: <MessageSquare className="h-4 w-4" />, label: 'Enquiries', value: listing.enquiriesCount },
                      { icon: <TrendingUp className="h-4 w-4" />,    label: 'Pending',   value: listing.pendingEnquiries },
                    ].map(s => (
                      <div key={s.label} className="bg-bg rounded-xl border border-border p-3 text-center">
                        <div className="flex justify-center text-primary mb-1">{s.icon}</div>
                        <p className="font-bold text-textPrimary text-lg">{s.value}</p>
                        <p className="text-[10px] text-textSecondary">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  {/* Setup / Edit button */}
                  <Link
                    to="/listing/setup"
                    className="flex items-center justify-between w-full rounded-2xl border border-border bg-bg px-4 py-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-textPrimary">
                        {listing.completionPercent > 0 ? 'Edit profile' : 'Complete profile'}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-textSecondary" />
                  </Link>

                  {/* Public URL — show only if listed or ready */}
                  {listing.isListed && listing.publicUrl && (
                    <>
                      {/* View page */}
                      <a
                        href={listing.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between w-full rounded-2xl border border-primary/20 bg-primaryLight px-4 py-3 hover:bg-primary/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <ExternalLink className="h-4 w-4 text-primary" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-primary">Your public page</p>
                            <p className="text-xs text-textSecondary truncate">{listing.publicUrl}</p>
                          </div>
                        </div>
                      </a>

                      {/* Share buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleCopyLink}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-2.5 text-xs font-semibold text-textPrimary hover:border-primary/30 transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5 text-textSecondary" />
                          Copy link
                        </button>
                        <button
                          onClick={handleWhatsAppShare}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 py-2.5 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          Share on WhatsApp
                        </button>
                      </div>
                    </>
                  )}

                  {/* Go live / Unpublish toggle */}
                  {completionPct >= 60 && (
                    <button
                      onClick={() => setConfirmToggle(true)}
                      disabled={publish.isPending || unpublish.isPending}
                      className={cn(
                        'flex items-center justify-between w-full rounded-2xl px-4 py-3 transition-colors disabled:opacity-60',
                        listing.isListed
                          ? 'border border-danger/20 bg-danger/5 hover:bg-danger/10'
                          : 'border border-success/20 bg-success/5 hover:bg-success/10',
                      )}
                    >
                      <p className={cn(
                        'text-sm font-semibold',
                        listing.isListed ? 'text-danger' : 'text-success',
                      )}>
                        {listing.isListed ? 'Hide from search' : '🚀 Go live now'}
                      </p>
                      {listing.isListed
                        ? <ToggleRight className="h-5 w-5 text-danger" />
                        : <ToggleLeft className="h-5 w-5 text-success" />
                      }
                    </button>
                  )}

                  {/* Not ready hint */}
                  {completionPct < 60 && (
                    <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <p className="text-xs text-amber-700 font-medium">
                        Complete at least 60% to publish your listing
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* ── Subscription card ─────────────────────────── */}
          <div className="bg-surface rounded-2xl border border-border border-t-4 border-t-success p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-textPrimary">{sub?.plan ?? 'Free'} Plan</h3>
                <p className="text-xs text-success font-medium">{sub?.status ?? 'Active'}</p>
              </div>
              <Link to="/billing" className="text-sm font-semibold text-primary">
                Upgrade →
              </Link>
            </div>

            {sub && (
              <>
                <p className="text-xs text-textSecondary mb-4">
                  Renews {new Date(sub.renewsAt).toDateString()}
                </p>

                {[
                  { label: 'Beds', current: sub.currentBeds, max: sub.maxBeds, pct: bedPct, color: barColor },
                  { label: 'PGs',  current: sub.currentPgs,  max: sub.maxPgs,  pct: pgPct,  color: 'bg-success' },
                ].map(item => (
                  <div key={item.label} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-textSecondary">{item.label}</span>
                      <span className="font-medium">{item.current}/{item.max === -1 ? '∞' : item.max}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-bg border border-border overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', item.color)}
                        style={{ width: `${Math.min(item.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* ── Menu ──────────────────────────────────────── */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <button
              onClick={() => setPgSheet(true)}
              className="flex w-full items-center justify-between px-4 py-4 text-sm font-medium hover:bg-bg transition-colors"
            >
              My PGs
              <div className="flex items-center gap-2">
                <span className="bg-primaryLight text-primary text-xs px-2 py-0.5 rounded-full">
                  {pgs.data?.length ?? 0}
                </span>
                <ChevronRight className="h-4 w-4 text-textSecondary" />
              </div>
            </button>
            <button disabled className="px-4 py-4 text-left text-sm text-textMuted w-full">
              Notification settings (coming soon)
            </button>
            <a href="mailto:support@ownant.com" className="flex items-center justify-between px-4 py-4 text-sm hover:bg-bg transition-colors">
              Help & Support
              <ChevronRight className="h-4 w-4 text-textSecondary" />
            </a>
            <a href="/privacy" className="flex items-center justify-between px-4 py-4 text-sm hover:bg-bg transition-colors">
              Terms & Privacy
              <ChevronRight className="h-4 w-4 text-textSecondary" />
            </a>
            <Link to="/payment-settings" className="flex items-center justify-between px-4 py-4 text-sm hover:bg-bg transition-colors">
  Payment Settings (UPI)
  <ChevronRight className="h-4 w-4 text-textSecondary" />
</Link>
          </div>

          {/* Logout */}
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full text-center text-danger font-semibold py-3 text-sm"
          >
            Log out
          </button>
        </>
      )}

      {/* ── PG sheet ──────────────────────────────────────── */}
      <BottomSheet open={pgSheet} onOpenChange={setPgSheet} title="Your PGs">
        <ul className="space-y-2">
          {(pgs.data ?? []).map(pg => (
            <li key={pg.id} className="rounded-xl border border-border p-3 text-sm">
              <p className="font-medium text-textPrimary">{pg.name}</p>
              <p className="text-xs text-textSecondary">{pg.city}</p>
            </li>
          ))}
        </ul>
      </BottomSheet>

      {/* ── Toggle listing confirm ─────────────────────────── */}
      <Modal
        open={confirmToggle}
        onOpenChange={setConfirmToggle}
        title={listing?.isListed ? 'Hide listing?' : 'Go live?'}
        description={listing?.isListed
          ? 'Your PG will be hidden from search results. You can re-publish anytime.'
          : 'Your PG will appear on find.ownant.com and tenants can find you.'}
      >
        <div className="flex gap-2 mt-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmToggle(false)}>
            Cancel
          </Button>
          <Button
            variant={listing?.isListed ? 'danger' : 'primary' as any}
            className="flex-1"
            disabled={publish.isPending || unpublish.isPending}
            onClick={handleToggleListing}
          >
            {publish.isPending || unpublish.isPending
              ? 'Saving…'
              : listing?.isListed ? 'Hide' : 'Go Live 🚀'}
          </Button>
        </div>
      </Modal>

      {/* ── Logout confirm ─────────────────────────────────── */}
      <Modal
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Log out?"
        description="You will need OTP to sign in again."
      >
        <div className="flex gap-2 mt-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmLogout(false)}>
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
            {logout.isPending ? 'Logging out…' : 'Log out'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}