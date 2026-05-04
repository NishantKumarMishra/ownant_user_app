/**
 * =========================================
 * UPDATED LOGIC
 *
 * OLD:
 * Buttons were always visible:
 * - Send Reminder
 * - Give Notice
 * - Vacate Tenant
 *
 * ISSUE:
 * Even vacated tenants were showing these buttons,
 * which creates wrong UX and business confusion.
 *
 * NEW:
 * Buttons will show ONLY when:
 * t.status === "ACTIVE"
 *
 * If tenant is vacated/inactive:
 * buttons will be hidden automatically.
 * =========================================
 */

import { useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useTenant,
  useNoticeTenant,
  useVacateTenant,
} from "@/hooks/useTenants";
import { useTenantPayments, useMarkPaid } from "@/hooks/usePayments";
import {
  useTenantNotificationLogs,
  useSendReminder,
} from "@/hooks/useNotifications";
import { formatCurrency, formatDate } from "@/lib/format";
import toast from "react-hot-toast";
import { handleApiError } from "@/lib/apiError";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useQueryClient } from "@tanstack/react-query";
import type { PaymentItem } from "@/api/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TenantDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: t, isLoading } = useTenant(id);
  const payments = useTenantPayments(id);
  const logs = useTenantNotificationLogs(id);

  const notice = useNoticeTenant();
  const vacate = useVacateTenant();
  const sendReminder = useSendReminder();
  const markPaid = useMarkPaid();

  const [paidSheet, setPaidSheet] = useState<PaymentItem | null>(null);
  const [vacateOpen, setVacateOpen] = useState(false);
  const [vacateDate, setVacateDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paidAt, setPaidAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  /**
   * =========================================
   * NEW:
   * Check if tenant is active
   * =========================================
   */
  const isActiveTenant = t?.status === "ACTIVE";

  if (isLoading || !t) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const openMarkPaid = (p: PaymentItem) => {
    setPaidSheet(p);
    setAmountPaid(p.amountDue - (p.amountPaid ?? 0));
    setPaidAt(new Date().toISOString().slice(0, 10));
    setPaymentMode("CASH");
    setReferenceNumber("");
  };

  const onMarkPaid = async () => {
    if (!paidSheet) return;

    const prev = qc.getQueryData<PaymentItem[]>(["payments", "tenant", id]);

    qc.setQueryData<PaymentItem[]>(["payments", "tenant", id], (old) =>
      (old ?? []).map((x) =>
        x.id === paidSheet.id
          ? {
              ...x,
              status: "PAID",
              amountPaid,
              paidAt: `${paidAt}T00:00:00`,
            }
          : x,
      ),
    );

    try {
      await markPaid.mutateAsync({
        id: paidSheet.id,
        amountPaid,
        paymentMode,
        referenceNumber: ["UPI", "BANK_TRANSFER", "CHEQUE"].includes(
          paymentMode,
        )
          ? referenceNumber
          : undefined,
        paidAt,
      });

      toast.success("Payment recorded");
      setPaidSheet(null);
    } catch (e) {
      if (prev) {
        qc.setQueryData(["payments", "tenant", id], prev);
      }

      handleApiError(e);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* PROFILE */}

      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
          {initials(t.name)}
        </div>

        <h1 className="mt-3 text-2xl font-bold text-textPrimary">{t.name}</h1>

        <Badge
          className="mt-2"
          variant={t.status === "ACTIVE" ? "success" : "warning"}
        >
          {t.status}
        </Badge>

        <a
          href={`tel:${t.phone}`}
          className="mt-2 inline-flex items-center gap-2 text-primary"
        >
          <Phone className="h-4 w-4" />
          {t.phone}
        </a>
      </div>

      {/* BED INFO */}

      {/* BED INFO */}

      <Card className="p-4">
        <p className="text-sm font-semibold text-textPrimary">Bed</p>

        <p className="text-sm text-textSecondary">
          Room {t.bed?.roomNumber ?? "—"} · Bed {t.bed?.bedLabel ?? "—"} ·
          {t.bed?.sharingType ?? "—"}-sharing
        </p>

        {t.bed?.isAc ? (
          <Badge className="mt-2">AC</Badge>
        ) : (
          <Badge variant="outline">Non-AC</Badge>
        )}
      </Card>

      {/* DETAILS */}

      <section className="space-y-1 text-sm">
        <h2 className="font-semibold text-textPrimary">Details</h2>

        <p className="text-textSecondary">Email: {t.email ?? "—"}</p>

        <p className="text-textSecondary">Occupation: {t.occupation ?? "—"}</p>

        <p className="text-textSecondary">Company: {t.company ?? "—"}</p>

        <p className="text-textSecondary">
          Move-in: {t.moveInDate ? formatDate(t.moveInDate) : "—"}
        </p>

        <p className="text-textSecondary">
          Rent: {t.monthlyRent != null ? formatCurrency(t.monthlyRent) : "—"}
        </p>

        <p className="text-textSecondary">Due day: {t.dueDay ?? "—"}</p>

        <p className="text-textSecondary">
          Emergency: {t.emergencyName ?? "—"}{" "}
          {t.emergencyPhone ? `· ${t.emergencyPhone}` : ""}
        </p>
      </section>

      {/* PAYMENTS */}

      {/* <section>
        <h2 className="mb-2 font-semibold text-textPrimary">Payments</h2>

        {payments.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-surface">
            {(payments.data ?? []).map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-primary/5"
                onClick={() =>
                  p.status === "PENDING" || p.status === "OVERDUE"
                    ? openMarkPaid(p)
                    : undefined
                }
              >
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-medium">{p.monthYear}</span>

                  <Badge variant={p.status === "PAID" ? "success" : "warning"}>
                    {p.status}
                  </Badge>
                </div>

                <span className="text-xs text-textSecondary">
                  Due {p.dueDate ? formatDate(p.dueDate) : "—"}
                </span>

                <span className="text-sm font-semibold">
                  {formatCurrency(p.amountDue)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section> */}

      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
  {(payments.data ?? []).map((p) => {
    const isUnpaid = p.status === "PENDING" || p.status === "OVERDUE";

    return (
      <div
        key={p.id}
        className="flex items-center justify-between gap-3 px-4 py-3"
      >
        {/* LEFT SIDE */}
        <div className="flex flex-col">
          <span className="text-sm font-medium">{p.monthYear}</span>

          <span className="text-xs text-textSecondary">
            Due {p.dueDate ? formatDate(p.dueDate) : "—"}
          </span>

          <span className="text-sm font-semibold">
            {formatCurrency(p.amountDue)}
          </span>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col items-end gap-2">
          <Badge variant={p.status === "PAID" ? "success" : "warning"}>
            {p.status}
          </Badge>

          {/* ✅ NEW: Mark Paid Button */}
          {isUnpaid && isActiveTenant && (
            <Button
              size="sm"
              className="text-xs"
              onClick={() => openMarkPaid(p)}
            >
              Mark Paid
            </Button>
          )}
        </div>
      </div>
    );
  })}
</div>

      {/* NOTIFICATION LOGS */}

      <Collapsible.Root>
        <Collapsible.Trigger className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold">
          Notification logs
          <ChevronDown className="h-4 w-4" />
        </Collapsible.Trigger>

        <Collapsible.Content className="mt-2 space-y-2 text-xs text-textSecondary">
          {(logs.data ?? []).map((l) => (
            <p key={l.id}>
              {l.sentAt} — {l.channel ?? "WhatsApp"} ({l.status ?? "SENT"})
            </p>
          ))}

          {(logs.data ?? []).length === 0 ? <p>No logs yet.</p> : null}
        </Collapsible.Content>
      </Collapsible.Root>

      {/* =========================================
          OLD CODE (Always visible buttons)
          COMMENTED OUT
      ========================================= */}

      {/*
      <div className="fixed bottom-20 left-0 right-0 ...">
        Buttons always visible
      </div>
      */}

      {/* =========================================
          NEW CODE
          Show buttons ONLY for ACTIVE tenant
      ========================================= */}

      {isActiveTenant && (
        <div className="fixed bottom-20 left-0 right-0 space-y-2 border-t border-border bg-surface p-4 lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <Button
            className="w-full"
            variant="whatsapp"
            type="button"
            disabled={sendReminder.isPending}
            onClick={async () => {
              try {
                if (!id) return;

                await sendReminder.mutateAsync(id);
                toast.success("Reminder sent");
              } catch (e) {
                handleApiError(e);
              }
            }}
          >
            Send Reminder
          </Button>

          <Button
            variant="outline"
            className="w-full border-warning text-warning"
            type="button"
            disabled={notice.isPending}
            onClick={async () => {
              try {
                if (!id) return;

                await notice.mutateAsync(id);
                toast.success("Notice recorded");
              } catch (e) {
                handleApiError(e);
              }
            }}
          >
            Give Notice
          </Button>

          <Button
            variant="danger"
            className="w-full"
            type="button"
            onClick={() => setVacateOpen(true)}
          >
            Vacate Tenant
          </Button>
        </div>
      )}

      {/* VACATE SHEET */}

      <BottomSheet
        open={vacateOpen}
        onOpenChange={setVacateOpen}
        title="Vacate tenant"
      >
        <Input
          type="date"
          label="Vacate date"
          value={vacateDate}
          onChange={(e) => setVacateDate(e.target.value)}
        />

        <Button
          type="button"
          className="mt-4 w-full"
          variant="danger"
          disabled={vacate.isPending}
          onClick={async () => {
            try {
              if (!id) return;

              await vacate.mutateAsync({
                id,
                moveOutDate: vacateDate,
              });

              toast.success("Tenant vacated");
              setVacateOpen(false);
            } catch (e) {
              handleApiError(e);
            }
          }}
        >
          Confirm vacate
        </Button>
      </BottomSheet>

     {/* MARK PAID SHEET */}
      <BottomSheet
  open={!!paidSheet}
  onOpenChange={() => setPaidSheet(null)}
  title="Mark Payment"
>
  <div className="space-y-3">
    <Input
      type="number"
      label="Amount Paid"
      value={amountPaid}
      onChange={(e) => setAmountPaid(Number(e.target.value))}
    />

    <Input
      type="date"
      label="Paid Date"
      value={paidAt}
      onChange={(e) => setPaidAt(e.target.value)}
    />

    <select
      className="w-full rounded-lg border border-border px-3 py-2"
      value={paymentMode}
      onChange={(e) => setPaymentMode(e.target.value)}
    >
      <option value="CASH">Cash</option>
      <option value="UPI">UPI</option>
      <option value="BANK_TRANSFER">Bank Transfer</option>
      <option value="CHEQUE">Cheque</option>
    </select>

    {(paymentMode === "UPI" ||
      paymentMode === "BANK_TRANSFER" ||
      paymentMode === "CHEQUE") && (
      <Input
        label="Reference Number"
        value={referenceNumber}
        onChange={(e) => setReferenceNumber(e.target.value)}
      />
    )}

    <Button
      className="w-full"
      onClick={onMarkPaid}
      disabled={markPaid.isPending}
    >
      Confirm Payment
    </Button>
  </div>
</BottomSheet>
    </div>
  );
}
