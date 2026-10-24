import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchBookingSummary } from "@/features/public/queries";
import { formatDate, formatTime, formatZAR } from "@/lib/utils/format";
import { consultationFormatLabel, consultationDelivery } from "@/lib/consultations";
import { contactDetails } from "@/content/site";
import { proofOfPaymentLinks } from "@/lib/payment-methods";

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
    refetchInterval: (query) =>
      query.state.data?.status === "confirmed" || Date.now() - startedAt.current > 90_000
        ? false
        : 3000,
  });
  const b = q.data;
  const whatsappDigits = contactDetails.whatsapp.replace(/\D/g, "");

  if (!booking || (q.isFetched && !b)) {
    return (
      <Shell>
        <h1 className="text-3xl font-bold">Booking not found</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn't find this booking. If you paid, please contact us with your payment reference.
        </p>
        <Button asChild className="mt-8">
          <Link to="/contact">Contact us</Link>
        </Button>
      </Shell>
    );
  }

  if (b?.payment_provider === "eft") {
    const active = b.status === "confirmed" || b.status === "completed";
    const paid = b.payment_status === "paid";
    const awaitingPayment = active && b.payment_status === "pending";
    const proof = proofOfPaymentLinks(b.booking_reference, b.invoice_number);
    return (
      <Shell>
        <CheckCircle2 className="h-10 w-10 text-[#806022]" aria-hidden />
        <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">
          {!active
            ? "Booking closed"
            : paid
              ? "Booking confirmed — EFT received"
              : awaitingPayment
                ? "Booking reserved — EFT payment pending"
                : "Booking payment needs attention"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {!active
            ? "This reservation is no longer active. Please contact KMGMT before making any payment."
            : awaitingPayment
              ? "Your selected slot is reserved. Your booking confirmation and PDF invoice will be emailed to the address you provided, including the bank details and payment reference. Check your inbox and spam folder; contact KMGMT if the invoice does not arrive."
              : paid
                ? "Kieraan has verified receipt of your EFT payment. Your consultation details are below."
                : "Please contact KMGMT about the payment status of this booking before making another payment."}
        </p>
        <dl className="mt-8 w-full divide-y rounded-md border bg-card text-left">
          {[
            ["Booking reference", b.booking_reference],
            ["Invoice", b.invoice_number ?? ""],
            ["Consultation", b.service_name],
            ["Meeting format", consultationFormatLabel(b.consultation_format)],
            ["Date", formatDate(b.start_time)],
            ["Time", `${formatTime(b.start_time)} (SAST)`],
            ["Duration", `${b.duration_minutes} minutes`],
            ["Name", b.client_name],
            ["Payment method", "EFT / bank transfer"],
            [
              "Payment status",
              paid
                ? "Paid — verified manually"
                : awaitingPayment
                  ? "Awaiting EFT payment"
                  : (b.payment_status ?? "Not recorded"),
            ],
            [
              paid ? "Amount paid" : awaitingPayment ? "Amount due" : "Invoice total",
              formatZAR(b.amount_cents),
            ],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 p-4">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="break-words text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        {awaitingPayment && (
          <div className="mt-6 rounded-md border border-gold/30 bg-secondary p-5 text-left">
            <h2 className="font-semibold">Pay by EFT and attach proof of payment</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Use the bank details in your email invoice and reference{" "}
              <strong>{b.booking_reference}</strong>. Pay and send proof before your consultation.
              Choose a button below, attach your proof in WhatsApp or email, then send it. Payment
              stays pending until Kieraan verifies the funds in his bank account.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <a href={proof.whatsapp} target="_blank" rel="noopener noreferrer">
                  Send proof via WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={proof.email}>Send proof via email</a>
              </Button>
            </div>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              WhatsApp: {contactDetails.whatsapp}
              <br />
              Email: {contactDetails.email}
            </p>
          </div>
        )}
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          {consultationDelivery(b.consultation_format)}
        </p>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          For cancellations, rescheduling or manual refunds, contact KMGMT with your booking
          reference. Please give at least 24 hours’ notice. Your statutory consumer rights still
          apply.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/contact">Contact KMGMT</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Return home</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  if (!b || b.status !== "confirmed") {
    const stuck = Date.now() - startedAt.current > 90_000;
    return (
      <Shell>
        {!stuck && <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />}
        <h1 className="mt-4 text-3xl font-bold">
          {stuck ? "Payment still processing" : "Confirming your payment…"}
        </h1>
        <p role="status" className="mt-3 text-muted-foreground">
          {stuck
            ? "We haven't received confirmation from PayFast yet. You'll receive an email once your payment is confirmed. If you were charged and don't hear from us, please contact us."
            : "This usually takes a few seconds. Please keep this page open."}
        </p>
        {b && (
          <p className="mt-6 text-sm">
            Booking reference: <span className="font-bold">{b.booking_reference}</span>
          </p>
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
      <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">Consultation Confirmed</h1>
      <p className="mt-3 text-muted-foreground">
        Thank you, {b.client_name.split(" ")[0]}. A confirmation will be sent to your email. Feel
        free to screenshot this.
      </p>
      <dl className="mt-8 divide-y rounded-md border bg-card text-left">
        {[
          ["Booking reference", b.booking_reference],
          ["Consultation", b.service_name],
          ["Meeting format", consultationFormatLabel(b.consultation_format)],
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
      <p className="mt-6 text-sm leading-7 text-muted-foreground">
        {consultationDelivery(b.consultation_format)}
      </p>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        Need to cancel or reschedule? Contact KMGMT with your booking reference at least 24 hours
        before your appointment. Refunds are handled manually, subject to your statutory consumer
        rights.
      </p>
      {whatsappDigits ? (
        <Button asChild variant="outline" className="mt-5">
          <a
            href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hello KMGMT, regarding booking ${b.booking_reference}: `)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact KMGMT on WhatsApp
          </a>
        </Button>
      ) : (
        <Button asChild variant="outline" className="mt-5">
          <Link to="/contact">Contact KMGMT</Link>
        </Button>
      )}
      <Button asChild variant="outline" className="mt-3">
        <Link to="/">Return home</Link>
      </Button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page flex max-w-xl flex-col items-center py-16 text-center">
      {children}
    </div>
  );
}
