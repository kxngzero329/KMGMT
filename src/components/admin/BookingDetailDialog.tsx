import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_SETTABLE_STATUSES, BOOKING_STATUS_LABEL, type BookingStatus } from "@/types/domain";
import { formatDate, formatTime, formatZAR, formatDateTime } from "@/lib/utils/format";
import { latestPayment, type AdminBooking } from "@/features/admin/queries";
import { BookingBadge, PaymentBadge } from "./AdminUI";

export function BookingDetailDialog({ booking, onClose }: { booking: AdminBooking | null; onClose: () => void }) {
  const qc = useQueryClient();
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
    onError: (e: Error) => toast.error(e.message.includes("no_overlapping") ? "That time overlaps another booking." : "Update failed"),
  });
  if (!booking) return null;
  const c = booking.clients;
  const p = latestPayment(booking);
  const unpaid = p?.status !== "paid";

  const section = (title: string, rows: [string, React.ReactNode][]) => (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="break-words">{v}</dd></div>
        ))}
      </dl>
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{booking.booking_reference} · {c?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2"><BookingBadge status={booking.status} /><PaymentBadge status={p?.status} /></div>
        <div className="space-y-6">
          {section("Consultation", [
            ["Service", booking.services?.name],
            ["Date", formatDate(booking.start_time)],
            ["Time", `${formatTime(booking.start_time)}–${formatTime(booking.end_time)} SAST`],
            ["Price", formatZAR(booking.services?.price_cents)],
            ["Notes", booking.notes],
          ])}
          {section("Payment", [
            ["Status", <PaymentBadge status={p?.status} />],
            ["Amount", formatZAR(p?.amount_cents)],
            ["PayFast ref", p?.provider_payment_id],
            ["Paid at", p?.paid_at ? formatDateTime(p.paid_at) : null],
          ])}
          {c && section("Client", [
            ["Name", c.full_name], ["Age", String(c.age)], ["Email", c.email], ["WhatsApp", c.whatsapp], ["Country", c.country],
          ])}
          {c && section("Football", [
            ["Position", c.position], ["Current club", c.current_club], ["Previous clubs", c.previous_clubs], ["Level", c.playing_level],
            ["Help with", c.help_required], ["Situation", c.situation_description], ["Social", c.social_profile],
            ["Highlights", c.highlight_video_url && <a href={c.highlight_video_url} target="_blank" rel="noreferrer" className="underline decoration-gold">{c.highlight_video_url}</a>],
          ])}
          {c && c.age < 18 && section("Parent / guardian", [
            ["Name", c.guardian_name], ["Email", c.guardian_email], ["Phone", c.guardian_phone], ["Consent", c.guardian_consent ? "Given" : "Not given"],
          ])}
          <div className="border-t pt-4">
            <p className="eyebrow mb-2">Update booking status</p>
            {unpaid && (
              <p className="mb-3 rounded-md border border-warning/50 bg-warning/10 p-3 text-xs">
                This booking has <strong>no verified payment</strong>. Changing the booking status does not mark it as paid.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {ADMIN_SETTABLE_STATUSES.map((s) => (
                <button key={s} disabled={m.isPending || booking.status === s}
                  onClick={() => { if (s !== "confirmed" || !unpaid || confirm("Confirm without verified payment?")) m.mutate(s); }}
                  className="h-9 rounded-md border px-3 text-sm hover:border-gold disabled:opacity-40">
                  {BOOKING_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
