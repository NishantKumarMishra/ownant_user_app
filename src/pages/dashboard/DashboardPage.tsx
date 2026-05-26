import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserPlus,
  Grid3x3,
  Bell,
  BarChart3,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { CollectionChart } from "@/components/dashboard/CollectionChart";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { useDashboard } from "@/hooks/useAnalytics";
import {
  usePaymentsList,
  isDueSoon,
  useGenerateBulkPayments,
} from "@/hooks/usePayments";
import {
  useTriggerReminders,
  usePgNotificationLogs,
} from "@/hooks/useNotifications";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useTenants } from "@/hooks/useTenants";
import toast from "react-hot-toast";
import { handleApiError } from "@/lib/apiError";
import { format, parseISO, differenceInDays } from "date-fns";
import { Percent, BedDouble, AlertCircle, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListingBanner } from "@/components/listing/ListingBanner";
import type { ActivityFeedItem } from "@/api/types";
import { PendingCheckins } from '@/components/checkin/PendingCheckins'

// Add after PropertyOverview section:



// ── Avatar helpers ────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];
function avatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

// ── Dot color map ─────────────────────────────────────────────
const DOT_COLORS = {
  green: "bg-success",
  amber: "bg-amber-400",
  red: "bg-danger",
  blue: "bg-blue-400",
  gray: "bg-gray-300",
} as const;

// ── Metric Card ───────────────────────────────────────────────
function MetricCard({
  label,
  value,
  hint,
  icon,
  danger = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        danger ? "border-danger/20 bg-dangerLight" : "border-border bg-surface",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p
          className={cn(
            "text-xs font-medium",
            danger ? "text-danger/70" : "text-textSecondary",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "opacity-40",
            danger ? "text-danger" : "text-textSecondary",
          )}
        >
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "text-2xl font-bold tracking-tight",
          danger ? "text-danger" : "text-textPrimary",
        )}
      >
        {value}
      </p>
      {hint && (
        <p
          className={cn(
            "text-xs mt-1",
            danger ? "text-danger/60" : "text-textSecondary",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

// ── Activity Item ─────────────────────────────────────────────
function ActivityItem({ item }: { item: ActivityFeedItem }) {
  const inner = (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:border-primary/20 transition-colors">
      <div
        className={cn(
          "h-2 w-2 rounded-full flex-shrink-0",
          DOT_COLORS[item.dotColor],
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-textPrimary leading-snug">{item.title}</p>
        <p className="text-xs text-textSecondary mt-0.5">{item.subtitle}</p>
      </div>
      {item.href && (
        <ChevronRight className="h-3.5 w-3.5 text-textSecondary flex-shrink-0 opacity-50" />
      )}
    </div>
  );

  if (item.href) {
    return <Link to={item.href}>{inner}</Link>;
  }
  return inner;
}

// ── Main Page ─────────────────────────────────────────────────
export function DashboardPage() {
  // 🌍 Translation
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useDashboard();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const bulk = useGenerateBulkPayments();
  const reminders = useTriggerReminders();
  const monthYear = format(new Date(), "yyyy-MM");

  // Upcoming dues — pending payments due within 2 days
  const { data: pendingPayments = [] } = usePaymentsList("PENDING", monthYear);
  const upcomingDues = pendingPayments.filter((p) => isDueSoon(p)).slice(0, 6);

  // Paid payments this month — for activity feed
  const { data: paidPayments = [] } = usePaymentsList("PAID", monthYear);

  // Active tenants — to show newly added ones in activity feed
  const { data: activeTenants = [] } = useTenants({
    status: "ACTIVE",
    size: 50,
  });

  // PG notification logs — for activity feed
  const { data: notifLogs = [] } = usePgNotificationLogs(30);

  // Unified activity feed — merges payments + notifications + new tenants
  const activityFeed = useActivityFeed(
    paidPayments,
    notifLogs,
    activeTenants,
    10,
  );

  const trend =
    data?.sixMonthTrend?.map((t) => ({
      month: t.monthYear,
      expected: t.expected,
      collected: t.collected,
    })) ?? [];

  if (isError) {
    return (
      <div className="rounded-2xl border border-danger/20 bg-dangerLight p-4 text-sm text-danger">
        {t("dashboard_load_error")}{" "}
        <button
          type="button"
          className="font-semibold underline"
          onClick={() => void refetch()}
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4 pb-24">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const overdue = data.collection?.overdueCount ?? 0;
  const collectionRate = data.collection?.collectionRate ?? 0;
  const occupiedBeds = data.occupancy?.occupiedBeds ?? 0;
  const totalBeds = data.occupancy?.totalBeds ?? 0;
  const expectedRev = data.collection?.totalExpected ?? 0;
  const revenue = data.collection?.totalCollected ?? 0;

  const fmtINR = (n: number) =>
    "₹" + Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-5 pb-24">
      {/* ── Listing banner ────────────────────────────────── */}
      <ListingBanner />

      {/* ── Overdue alert ─────────────────────────────────── */}
      {overdue > 0 && (
        <Link
          to="/payments?filter=overdue"
          className="flex items-center justify-between rounded-2xl border border-danger/20 bg-dangerLight px-4 py-3"
        >
          <p className="text-sm font-semibold text-danger">
           {overdue} {t("overdue")} — {t("collect_now")}
          </p>
          <ChevronRight className="h-4 w-4 text-danger flex-shrink-0" />
        </Link>
      )}

      {/* ── Metric cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          // OLD
          // label="Collection rate"

          // NEW
          label={t("collection_rate")}
          value={`${Math.round(collectionRate)}%`}
          // NEW
hint={t("vs_expected")}
          icon={<Percent className="h-4 w-4" />}
        />
        <MetricCard
          label={t("beds_occupied")}
          value={`${occupiedBeds}/${totalBeds}`}
          hint={`${totalBeds - occupiedBeds} ${t("available")}`}
          icon={<BedDouble className="h-4 w-4" />}
        />
        <MetricCard
          label={t("overdue")}
          value={String(overdue)}
          hint={overdue > 0 ? t("need_collection") : t("all_clear")}
          icon={<AlertCircle className="h-4 w-4" />}
          danger={overdue > 0}
        />
        <MetricCard
          label={t("this_month")}

          value={fmtINR(revenue)}
          hint={`Expected ${fmtINR(expectedRev)}`}
          icon={<IndianRupee className="h-4 w-4" />}
        />
      </div>

      {/* ── Upcoming dues ─────────────────────────────────── */}
      {upcomingDues.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-textPrimary">
              {t("upcoming_dues")}
            </h2>
            <Link to="/payments" className="text-xs font-medium text-primary">
              {t("next_2_days")}
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {upcomingDues.map((p) => {
              const name = p.tenantName ?? "Tenant";
              const daysLeft = differenceInDays(
                parseISO(p.dueDate!),
                new Date(),
              );
              const dueLabel =
                daysLeft === 0
                  ? "Due today"
                  : daysLeft === 1
                    ? "Due tomorrow"
                    : format(parseISO(p.dueDate!), "MMM d");

              return (
                <Link
                  key={p.id}
                  to={`/payments/${p.id}`}
                  className="flex-shrink-0 w-44 rounded-2xl border border-border bg-surface p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0",
                        avatarColor(name),
                      )}
                    >
                      {getInitials(name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-textPrimary truncate">
                        {name}
                      </p>
                      <p className="text-xs text-textSecondary">
                        {p.roomNumber ? `Room ${p.roomNumber}` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-base font-bold text-textPrimary">
                        {fmtINR(p.amountDue)}
                      </p>
                      <p className="text-xs text-textSecondary mt-0.5">
                        {dueLabel}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-xl bg-successLight flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-3.5 w-3.5 text-success" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Quick actions ──────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-textPrimary mb-3">
          {t("quick_actions")}
        </h2>
        <div className="grid grid-cols-4 gap-3">
          <Link
            to="/tenants/add"
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-4 px-1 hover:border-primary/30 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-medium text-textSecondary text-center leading-tight">
              {t("Add Tenant")}
            </span>
          </Link>

          <Link
            to="/rooms"
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-4 px-1 hover:border-primary/30 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Grid3x3 className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-medium text-textSecondary text-center leading-tight">
              {t("view_rooms")}
            </span>
          </Link>

          <button
            type="button"
            disabled={reminders.isPending}
            onClick={async () => {
              try {
                const r = await reminders.mutateAsync();
                toast.success(`Sent ${r.sent}, skipped ${r.skipped}`);
              } catch (e) {
                handleApiError(e);
              }
            }}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-4 px-1 hover:border-primary/30 transition-colors disabled:opacity-60"
          >
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
              {reminders.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
              ) : (
                <Bell className="h-5 w-5 text-violet-600" />
              )}
            </div>
            <span className="text-[10px] font-medium text-textSecondary text-center leading-tight">
              {reminders.isPending ? "Sending…" : `${t("send_reminder")}`}
            </span>
          </button>

          <Link
            to="/analytics"
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-4 px-1 hover:border-primary/30 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-[10px] font-medium text-textSecondary text-center leading-tight">
              {t("reports")}
            </span>
          </Link>
        </div>
      </section>

      {/* ── Recent activity ────────────────────────────────── */}
      {activityFeed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-textPrimary">
              {t("recent_activity")}
            </h2>
          </div>
          <div className="space-y-2">
            {(showAllActivity ? activityFeed : activityFeed.slice(0, 4)).map(
              (item) => (
                <ActivityItem key={item.id} item={item} />
              ),
            )}
          </div>
          {activityFeed.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllActivity((v) => !v)}
              className="mt-3 w-full rounded-2xl border border-border bg-surface py-3 text-xs font-medium text-textSecondary hover:text-primary hover:border-primary/30 transition-colors"
            >
              {showAllActivity
                ? t("show_less")
                : `${t("see_all")} ${activityFeed.length} ${t("activities")}`}
            </button>
          )}
        </section>
      )}

      {/* <PropertyOverview /> */}

      {/* ── 6-month chart ──────────────────────────────────── */}
      {trend.length > 0 && (
        <section>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold text-textPrimary">
              {t("six_month_collection")}
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              {t("expected_vs_collected")}
            </p>
            <div className="mt-4">
              <CollectionChart data={trend} />
            </div>
          </div>
        </section>
      )}
      <PendingCheckins />

      {/* ── Generate payments modal ────────────────────────── */}
      <Modal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Generate payments"
        description={`Create rent entries for all active tenants for ${format(new Date(), "MMMM yyyy")}.`}
      >
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setBulkOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={bulk.isPending}
            onClick={async () => {
              try {
                await bulk.mutateAsync(monthYear);
                toast.success("Payments generated");
                setBulkOpen(false);
              } catch (e) {
                handleApiError(e);
              }
            }}
          >
            {bulk.isPending ? "Working…" : "Confirm"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
