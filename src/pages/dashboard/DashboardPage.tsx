import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CollectionChart } from "@/components/dashboard/CollectionChart";
import { PropertyOverviewSection } from "@/components/dashboard/PropertyOverviewSection";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { useDashboard } from "@/hooks/useAnalytics";
import { usePaymentsList, isDueSoon, useGenerateBulkPayments } from "@/hooks/usePayments";
import { useTriggerReminders, usePgNotificationLogs } from "@/hooks/useNotifications";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useTenants } from "@/hooks/useTenants";
import toast from "react-hot-toast";
import { handleApiError } from "@/lib/apiError";
import { format, parseISO, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { ListingBanner } from "@/components/listing/ListingBanner";
import type { ActivityFeedItem } from "@/api/types";
import { PendingCheckins } from "@/components/checkin/PendingCheckins";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { ChevronRight } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700",
];
function avatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}
const fmtINR = (n: number) =>
  "₹" + Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

// ── 3D Premium Icons ──────────────────────────────────────────
const Icon3D = {
  addTenant: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="g-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA"/>
          <stop offset="100%" stopColor="#2563EB"/>
        </linearGradient>
        <filter id="f-blue" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2563EB" floodOpacity="0.35"/>
        </filter>
      </defs>
      <rect width="28" height="28" rx="9" fill="url(#g-blue)" filter="url(#f-blue)"/>
      <circle cx="12" cy="11" r="3.5" fill="white" fillOpacity="0.95"/>
      <path d="M5 22c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <line x1="21" y1="15" x2="21" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="18" x2="24" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  rooms: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="g-green" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
        <filter id="f-green" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#059669" floodOpacity="0.35"/>
        </filter>
      </defs>
      <rect width="28" height="28" rx="9" fill="url(#g-green)" filter="url(#f-green)"/>
      <rect x="6" y="6" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.95"/>
      <rect x="16" y="6" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.95"/>
      <rect x="6" y="16" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.95"/>
      <rect x="16" y="16" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.95"/>
    </svg>
  ),
  reminder: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="g-violet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA"/>
          <stop offset="100%" stopColor="#7C3AED"/>
        </linearGradient>
        <filter id="f-violet" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#7C3AED" floodOpacity="0.35"/>
        </filter>
      </defs>
      <rect width="28" height="28" rx="9" fill="url(#g-violet)" filter="url(#f-violet)"/>
      <path d="M14 7a5 5 0 015 5v3l1.5 2.5H7.5L9 15v-3a5 5 0 015-5z" fill="white" fillOpacity="0.95"/>
      <path d="M12 18.5a2 2 0 004 0" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  analytics: () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="g-amber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FCD34D"/>
          <stop offset="100%" stopColor="#D97706"/>
        </linearGradient>
        <filter id="f-amber" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#D97706" floodOpacity="0.35"/>
        </filter>
      </defs>
      <rect width="28" height="28" rx="9" fill="url(#g-amber)" filter="url(#f-amber)"/>
      <rect x="7" y="16" width="3.5" height="6" rx="1" fill="white" fillOpacity="0.95"/>
      <rect x="12.25" y="12" width="3.5" height="10" rx="1" fill="white" fillOpacity="0.95"/>
      <rect x="17.5" y="8" width="3.5" height="14" rx="1" fill="white" fillOpacity="0.95"/>
    </svg>
  ),
  collection: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="g-col" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
        <filter id="f-col" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#059669" floodOpacity="0.3"/>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#g-col)" filter="url(#f-col)"/>
      <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">%</text>
    </svg>
  ),
  beds: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="g-beds" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60A5FA"/>
          <stop offset="100%" stopColor="#2563EB"/>
        </linearGradient>
        <filter id="f-beds" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#2563EB" floodOpacity="0.3"/>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#g-beds)" filter="url(#f-beds)"/>
      <rect x="8" y="15" width="16" height="7" rx="2" fill="white" fillOpacity="0.9"/>
      <rect x="8" y="10" width="7" height="6" rx="1.5" fill="white" fillOpacity="0.7"/>
    </svg>
  ),
  overdue: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="g-over" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F87171"/>
          <stop offset="100%" stopColor="#DC2626"/>
        </linearGradient>
        <filter id="f-over" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#DC2626" floodOpacity="0.3"/>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#g-over)" filter="url(#f-over)"/>
      <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">!</text>
    </svg>
  ),
  revenue: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="g-rev" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FCD34D"/>
          <stop offset="100%" stopColor="#D97706"/>
        </linearGradient>
        <filter id="f-rev" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#D97706" floodOpacity="0.3"/>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#g-rev)" filter="url(#f-rev)"/>
      <text x="16" y="21" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">₹</text>
    </svg>
  ),
}

// ── Metric Card ───────────────────────────────────────────────
function MetricCard({ label, value, hint, icon, danger = false }: {
  label: string; value: string; hint?: string
  icon: React.ReactNode; danger?: boolean
}) {
  return (
    <div className={cn(
      "relative rounded-3xl p-4 overflow-hidden",
      danger ? "bg-red-50 border border-red-100" : "bg-white border border-gray-100"
    )}
      style={{ boxShadow: danger
        ? "0 2px 12px rgba(220,38,38,0.08)"
        : "0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)"
      }}
    >
      {/* Subtle shine */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

      <div className="flex items-start justify-between mb-3">
        <p className={cn(
          "text-[10px] font-bold uppercase tracking-widest",
          danger ? "text-red-400" : "text-gray-400"
        )}>{label}</p>
        {icon}
      </div>
      <p className={cn(
        "text-2xl font-black tracking-tight",
        danger ? "text-red-600" : "text-gray-900"
      )}>{value}</p>
      {hint && (
        <p className={cn(
          "text-[11px] mt-1 font-medium",
          danger ? "text-red-400" : "text-gray-400"
        )}>{hint}</p>
      )}
    </div>
  );
}

// ── Activity dot ──────────────────────────────────────────────
const DOT: Record<string, string> = {
  green: "bg-emerald-400", amber: "bg-amber-400",
  red: "bg-red-400", blue: "bg-blue-400", gray: "bg-gray-300",
}

function ActivityItem({ item }: { item: ActivityFeedItem }) {
  const inner = (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 hover:border-primary/20 transition-all"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className={cn("h-2 w-2 rounded-full flex-shrink-0", DOT[item.dotColor])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-snug">{item.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{item.subtitle}</p>
      </div>
      {item.href && <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />}
    </div>
  );
  return item.href ? <Link to={item.href}>{inner}</Link> : inner;
}

// ── Main Page ─────────────────────────────────────────────────
export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useDashboard();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const bulk      = useGenerateBulkPayments();
  const reminders = useTriggerReminders();
  const monthYear = format(new Date(), "yyyy-MM");

  const { data: pendingPayments = [] } = usePaymentsList("PENDING", monthYear);
  const upcomingDues = pendingPayments.filter(isDueSoon).slice(0, 5);
  const { data: paidPayments = [] } = usePaymentsList("PAID", monthYear);
  const { data: activeTenants = [] } = useTenants({ status: "ACTIVE", size: 50 });
  const { data: notifLogs = [] } = usePgNotificationLogs(30);
  const activityFeed = useActivityFeed(paidPayments, notifLogs, activeTenants, 10);

  const trend = data?.sixMonthTrend?.map(t => ({
    month: t.monthYear, expected: t.expected, collected: t.collected,
  })) ?? [];

  if (isError) return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
      {t("dashboard_load_error")}{" "}
      <button className="font-semibold underline" onClick={() => void refetch()}>
        {t("retry")}
      </button>
    </div>
  );

  if (isLoading || !data) return (
    <div className="space-y-4 pb-24">
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}
      </div>
      <Skeleton className="h-44 rounded-3xl" />
      <Skeleton className="h-32 rounded-3xl" />
    </div>
  );

  const overdue        = data.collection?.overdueCount     ?? 0;
  const collectionRate = data.collection?.collectionRate   ?? 0;
  const occupiedBeds   = data.occupancy?.occupiedBeds      ?? 0;
  const totalBeds      = data.occupancy?.totalBeds         ?? 0;
  const expectedRev    = data.collection?.totalExpected    ?? 0;
  const revenue        = data.collection?.totalCollected   ?? 0;

  return (
    <div className="space-y-0 pb-28 bg-gray-50 -mx-4 -mt-4">

      {/* ── Listing banner ──────────────────────────────── */}
      <div className="px-4 pt-4">
        <ListingBanner />
      </div>

      {/* ── Leaderboard / Metrics ────────────────────────── */}
      <section className="px-4 pt-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-black text-gray-900 tracking-tight">
              This Month 📊
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(new Date(), "MMMM yyyy")}
            </p>
          </div>
          <Link to="/analytics"
            className="text-xs font-bold text-primary bg-primaryLt px-3 py-1.5 rounded-full">
            Full report →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Collection"
            value={`${Math.round(collectionRate)}%`}
            hint="of expected rent"
            icon={<Icon3D.collection />}
          />
          <MetricCard
            label="Occupancy"
            value={`${occupiedBeds}/${totalBeds}`}
            hint={`${totalBeds - occupiedBeds} beds free`}
            icon={<Icon3D.beds />}
          />
          <MetricCard
            label="Overdue"
            value={String(overdue)}
            hint={overdue > 0 ? "Need attention" : "All clear ✓"}
            icon={<Icon3D.overdue />}
            danger={overdue > 0}
          />
          <MetricCard
            label="Revenue"
            value={fmtINR(revenue)}
            hint={`of ${fmtINR(expectedRev)}`}
            icon={<Icon3D.revenue />}
          />
        </div>
      </section>

      {/* ── Fast Collections ─────────────────────────────── */}
      {upcomingDues.length > 0 && (
        <section className="bg-white px-4 py-5 border-y border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-gray-900">Fast Collections 💸</h2>
              <p className="text-xs text-gray-400 mt-0.5">Due soon — collect now</p>
            </div>
            <Link to="/payments"
              className="text-xs font-bold text-primary">
              View all →
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
            {upcomingDues.map(p => {
              const name     = p.tenantName ?? "Tenant";
              const daysLeft = differenceInDays(parseISO(p.dueDate!), new Date());
              const dueLabel = daysLeft === 0 ? "Due today"
                : daysLeft === 1 ? "Due tomorrow"
                : format(parseISO(p.dueDate!), "MMM d");

              return (
                <Link key={p.id} to={`/payments/${p.id}`}
                  className="flex-shrink-0 w-44 rounded-3xl border border-gray-100 bg-gray-50 p-4 hover:border-primary/20 transition-all"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={cn(
                      "h-9 w-9 rounded-2xl flex items-center justify-center text-xs font-black flex-shrink-0",
                      avatarColor(name)
                    )}>
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{name}</p>
                      <p className="text-[10px] text-gray-400">
                        {p.roomNumber ? `Room ${p.roomNumber}` : "—"}
                      </p>
                    </div>
                  </div>
                  <p className="text-base font-black text-gray-900">{fmtINR(p.amountDue)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{dueLabel}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Quick Actions ─────────────────────────────────── */}
      <section className="bg-white px-4 py-5 border-b border-gray-100">
        <h2 className="text-sm font-black text-gray-900 mb-4">Quick Actions 🚀</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { to: "/tenants/add", label: "Add Tenant", icon: <Icon3D.addTenant /> },
            { to: "/rooms",       label: "View Rooms", icon: <Icon3D.rooms />    },
            { to: "/analytics",   label: "Reports",    icon: <Icon3D.analytics /> },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl hover:bg-gray-50 transition-colors">
              {item.icon}
              <span className="text-[10px] font-bold text-gray-500 text-center leading-tight">
                {item.label}
              </span>
            </Link>
          ))}

          {/* Send Reminder */}
          <button type="button"
            disabled={reminders.isPending}
            onClick={async () => {
              try {
                const r = await reminders.mutateAsync();
                toast.success(`Sent ${r.sent}, skipped ${r.skipped}`);
              } catch (e) { handleApiError(e); }
            }}
            className="flex flex-col items-center gap-2 py-3 px-1 rounded-2xl hover:bg-gray-50 transition-colors disabled:opacity-50">
            {reminders.isPending
              ? <div className="w-7 h-7 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              : <Icon3D.reminder />
            }
            <span className="text-[10px] font-bold text-gray-500 text-center leading-tight">
              {reminders.isPending ? "Sending…" : "Remind"}
            </span>
          </button>
        </div>
      </section>

      {/* ── Property Overview ─────────────────────────────── */}
      <div className="px-4 py-4">
        <PropertyOverviewSection />
      </div>

      {/* ── 6-month chart ─────────────────────────────────── */}
      {trend.length > 0 && (
        <section className="bg-white px-4 py-5 border-y border-gray-100">
          <h2 className="text-sm font-black text-gray-900">Collection Trend 📈</h2>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Expected vs collected (6 months)</p>
          <CollectionChart data={trend} />
        </section>
      )}

      {/* ── Recent activity ───────────────────────────────── */}
      {activityFeed.length > 0 && (
        <section className="px-4 py-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-2">
            {(showAllActivity ? activityFeed : activityFeed.slice(0, 4)).map(item => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
          {activityFeed.length > 4 && (
            <button type="button"
              onClick={() => setShowAllActivity(v => !v)}
              className="mt-3 w-full rounded-2xl border border-gray-100 bg-white py-3 text-xs font-bold text-gray-400 hover:text-primary hover:border-primary/20 transition-all"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {showAllActivity ? "Show less" : `See all ${activityFeed.length} activities`}
            </button>
          )}
        </section>
      )}

      <PendingCheckins />
      <DashboardFooter />

      {/* Modal */}
      <Modal open={bulkOpen} onOpenChange={setBulkOpen}
        title="Generate payments"
        description={`Create rent entries for all active tenants for ${format(new Date(), "MMMM yyyy")}.`}>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setBulkOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={bulk.isPending}
            onClick={async () => {
              try {
                await bulk.mutateAsync(monthYear);
                toast.success("Payments generated");
                setBulkOpen(false);
              } catch (e) { handleApiError(e); }
            }}>
            {bulk.isPending ? "Working…" : "Confirm"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}