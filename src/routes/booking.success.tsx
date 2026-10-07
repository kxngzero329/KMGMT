import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchBookingSummary } from "@/features/public/queries";
import { formatDate, formatTime, formatZAR } from "@/lib/utils/format";

export const Route = createFileRoute("/booking/success")({
  validateSearch: z.object({ booking: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Booking Status | KMGMT" },
      { name: "description", content: "Your KMGMT consultation booking status." },
      { property: "og:title", content: "Booking Status | KMGMT" },
      { property: "og:description", content: "Your KMGMT consultation booking status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

function Success() {
  const { booking } = Route.useSearch();
  const startedAt = useRef(Date.now());
  const q = useQuery({
    queryKey: ["booking-summary", booking],
    queryFn: () => fetchBookingSummary(booking!),
    enabled: !!booking,
    // Poll until PayFast's server notification confirms payment.
    refetchInterval: (query) => (query.state.data?.status === "confirmed" || Date.now() - startedAt.current > 90_000 ? false : 3000),
  });
  const b = q.data;

  if (!booking || (q.isFetched && !b)) {
    return (
      <Shell>
        <h1 className="text-3xl font-bold">Booking not found</h1>
        <p className="mt-3 text-muted-foreground">We couldn't find this booking. If you paid, please contact us with your payment reference.</p>
        <Button asChild className="mt-8"><Link to="/contact">Contact us</Link></Button>
      </Shell>
    );
  }

  if (!b || b.status !== "confirmed") {
    const stuck = Date.now() - startedAt.current > 90_000;
    return (
      <Shell>
        {!stuck && <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />}
        <h1 className="mt-4 text-3xl font-bold">{stuck ? "Payment still processing" : "Confirming your payment…"}</h1>
        <p role="status" className="mt-3 text-muted-foreground">
          {stuck
            ? "We haven't received confirmation from PayFast yet. You'll receive an email once your payment is confirmed. If you were charged and don't hear from us, please contact us."
            : "This usually takes a few seconds. Please keep this page open."}
        </p>
        {b && <p className="mt-6 text-sm">Booking reference: <span className="font-bold">{b.booking_reference}</span></p>}
      </Shell>
    );
  }

  return (
    <Shell>
      <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
      <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">Consultation Confirmed</h1>
      <p className="mt-3 text-muted-foreground">Thank you, {b.client_name.split(" ")[0]}. A confirmation will be sent to your email. Feel free to screenshot this.</p>
      <dl className="mt-8 divide-y rounded-md border bg-card text-left">
        {[
          ["Booking reference", b.booking_reference],
          ["Consultation", b.service_name],
          ["Date", formatDate(b.start_time)],
          ["Time", `${formatTime(b.start_time)} (SAST)`],
          ["Duration", `${b.duration_minutes} minutes`],
          ["Name", b.client_name],
          ["Amount paid", formatZAR(b.amount_cents)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 p-4">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <Button asChild variant="outline" className="mt-8"><Link to="/">Return home</Link></Button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="container-page flex max-w-xl flex-col items-center py-16 text-center">{children}</div>;
}
