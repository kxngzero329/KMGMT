import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_SETTABLE_STATUSES, BOOKING_STATUS_LABEL, type BookingStatus } from "@/types/domain";
import { formatDate, formatTime, formatZAR, formatDateTime } from "@/lib/utils/format";
import { BOOKING_SELECT, latestPayment, type AdminBooking } from "@/features/admin/queries";
import { BookingBadge, PaymentBadge } from "./AdminUI";
import { consultationFormatLabel, consultationDelivery } from "@/lib/consultations";
import { paymentMethodLabel } from "@/lib/payment-methods";
import { VerifyEftPaymentButton } from "./VerifyEftPaymentButton";
import { DeleteRecordButton } from "./DeleteRecordButton";
import { EftDeadline } from "./EftDeadline";
import { ClientContactActions } from "./ClientContactActions";

export function BookingDetailDialog({
  booking: selectedBooking,
  onClose,
}: {
  booking: AdminBooking | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const current = useQuery({
    queryKey: ["admin", "booking-detail", selectedBooking?.id],
    enabled: !!selectedBooking,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("id", selectedBooking!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const booking = selectedBooking
    ? current.data === undefined
      ? selectedBooking
      : current.data
    : null;
  useEffect(() => {
    if (selectedBooking && current.isSuccess && current.data === null) onClose();
  }, [selectedBooking, current.isSuccess, current.data, onClose]);
  const m = useMutation({
    mutationFn: async (status: BookingStatus) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", booking!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking updated");
      qc.invalidateQueries({ queryKey: ["admin"] });
      onClose();
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("no_overlapping")
          ? "That time overlaps another booking."
          : e.message.includes("EFT_DEADLINE_PASSED")
            ? "The EFT deadline has passed. This reservation cannot be restored; reconcile any funds and arrange a new booking."
            : e.message.includes("EFT_PAYMENT_REQUIRED")
              ? "Verify the EFT payment before marking this consultation completed."
              : "Update failed",
      ),
  });
  if (!booking) return null;
  const c = booking.clients;
  const p = latestPayment(booking);
  const unpaid = p?.status !== "paid";

  const section = (title: string, rows: [string, React.ReactNode][]) => (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
      </dl>
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {booking.booking_reference} · {c?.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <BookingBadge status={booking.status} />
          <PaymentBadge status={p?.status} />
        </div>
        {c && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/70 bg-secondary/50 p-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold">Contact {c.full_name}</p>
              <p className="mt-1 break-all text-[11px] text-muted-foreground">{c.email}</p>
            </div>
            <ClientContactActions
              name={c.full_name}
              email={c.email}
              whatsapp={c.whatsapp}
              country={c.country}
              reference={booking.booking_reference}
            />
          </div>
        )}
        <div className="space-y-6">
          {section("Consultation", [
            ["Service", booking.services?.name],
            ["Meeting format", consultationFormatLabel(booking.consultation_format)],
            ["Arrangements", consultationDelivery(booking.consultation_format)],
            ["Date", formatDate(booking.start_time)],
            ["Time", `${formatTime(booking.start_time)}–${formatTime(booking.end_time)} SAST`],
            ["Price", formatZAR(booking.services?.price_cents)],
            ["Notes", booking.notes],
          ])}
          {section("Payment", [
            ["Method", paymentMethodLabel(p?.provider)],
            ["Invoice", p?.invoice_number],
            ["Status", <PaymentBadge status={p?.status} />],
            ["Amount", formatZAR(p?.amount_cents)],
            ["Payment reference", p?.provider_payment_id],
            ["Paid at", p?.paid_at ? formatDateTime(p.paid_at) : null],
          ])}
          {p?.provider === "eft" && (
            <EftDeadline
              dueAt={p.due_at}
              paymentStatus={p.status}
              cancellationReason={booking.cancellation_reason}
            />
          )}
          {p?.provider === "eft" &&
            p.status === "pending" &&
            (booking.status === "confirmed" || booking.status === "completed") && (
              <div className="space-y-3">
                <p className="text-xs leading-6 text-muted-foreground">
                  Verify the full amount in the bank account before marking this invoice paid. Proof
                  of payment does not automatically verify funds.
                </p>
                <VerifyEftPaymentButton paymentId={p.id} dueAt={p.due_at} onVerified={onClose} />
              </div>
            )}
          {c &&
            section("Client", [
              ["Name", c.full_name],
              ["Age", String(c.age)],
              ["Email", c.email],
              ["WhatsApp", c.whatsapp],
              ["Country", c.country],
            ])}
          {c &&
            section("Football", [
              ["Position", c.position],
              ["Current club", c.current_club],
              ["Previous clubs", c.previous_clubs],
              ["Level", c.playing_level],
              ["Help with", c.help_required],
              ["Situation", c.situation_description],
              ["Social", c.social_profile],
              [
                "Highlights",
                c.highlight_video_url && (
                  <a
                    href={c.highlight_video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-gold"
                  >
                    {c.highlight_video_url}
                  </a>
                ),
              ],
            ])}
          {c &&
            c.age < 18 &&
            section("Parent / guardian", [
              ["Name", c.guardian_name],
              ["Email", c.guardian_email],
              ["Phone", c.guardian_phone],
              ["Consent", c.guardian_consent ? "Given" : "Not given"],
            ])}
          <div className="border-t pt-4">
            <p className="eyebrow mb-2">Update booking status</p>
            {unpaid && (
              <p className="mb-3 rounded-md border border-warning/50 bg-warning/10 p-3 text-xs">
                This booking has <strong>no verified payment</strong>. Changing the booking status
                does not mark it as paid.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {ADMIN_SETTABLE_STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={m.isPending || booking.status === s}
                  onClick={() => {
                    if (
                      s !== "confirmed" ||
                      !unpaid ||
                      confirm("Confirm without verified payment?")
                    )
                      m.mutate(s);
                  }}
                  className="h-9 rounded-md border px-3 text-sm hover:border-gold disabled:opacity-40"
                >
                  {BOOKING_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="mb-3 text-xs leading-6 text-muted-foreground">
              Permanent deletion removes this booking and its related payment and email records. Use
              Cancelled above to keep the history instead.
            </p>
            <DeleteRecordButton
              entity="booking"
              recordId={booking.id}
              recordLabel={booking.booking_reference}
              disabled={m.isPending}
              onDeleted={onClose}
              buttonLabel="Delete booking"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
