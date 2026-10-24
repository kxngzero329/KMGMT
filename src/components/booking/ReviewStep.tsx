import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { BookingStepHeading } from "./BookingStep";
import { StepNav } from "./Stepper";
import { createBookingHold } from "@/features/bookings/bookings.functions";
import { createPayfastPayment } from "@/features/payments/client";
import { createEftBooking } from "@/features/payments/eft-client";
import {
  paymentMethodLabel,
  PAYFAST_AVAILABLE,
  PAYFAST_NOTICE,
  type PaymentMethod,
} from "@/lib/payment-methods";
import { submitPayfastForm } from "@/features/payments/redirect";
import { formatDate, formatTime, formatZAR } from "@/lib/utils/format";
import type { PublicService } from "@/features/public/queries";
import type { ClientDetails } from "@/lib/validation/schemas";
import {
  consultationFormatLabel,
  consultationDelivery,
  type ConsultationFormat,
} from "@/lib/consultations";

export function ReviewStep({
  service,
  format,
  client,
  slot,
  paymentMethod,
  onEdit,
  onSlotTaken,
  onBusyChange,
}: {
  service: PublicService;
  format: ConsultationFormat;
  client: ClientDetails;
  slot: string;
  paymentMethod: PaymentMethod;
  onEdit: (step: number) => void;
  onSlotTaken: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const hold = useServerFn(createBookingHold);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heldFor, setHeldFor] = useState<{ key: string; bookingId: string } | null>(null);
  const submitting = useRef(false);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdKey = `${service.id}|${format}|${slot}|${client.email}`;
  const eftRequest = useRef<{ key: string; id: string } | null>(null);
  useEffect(
    () => () => {
      if (returnTimer.current) clearTimeout(returnTimer.current);
    },
    [],
  );

  async function proceed() {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    onBusyChange(true);
    setError(null);
    try {
      if (paymentMethod === "eft") {
        const requestKey = JSON.stringify({ serviceId: service.id, startTime: slot, client });
        if (eftRequest.current?.key !== requestKey) {
          eftRequest.current = { key: requestKey, id: crypto.randomUUID() };
        }
        const result = await createEftBooking({
          serviceId: service.id,
          startTime: slot,
          client,
          requestId: eftRequest.current.id,
        });
        if (!result.ok) {
          setError(result.error);
          if (result.error.includes("just taken"))
            returnTimer.current = setTimeout(onSlotTaken, 1800);
          return;
        }
        await navigate({ to: "/booking/success", search: { booking: result.bookingId } });
        return;
      }
      if (!PAYFAST_AVAILABLE) {
        setError(PAYFAST_NOTICE);
        return;
      }
      let bookingId = heldFor?.key === holdKey ? heldFor.bookingId : null;
      if (!bookingId) {
        const result = await hold({
          data: { serviceId: service.id, consultationFormat: format, startTime: slot, client },
        });
        if (!result.ok) {
          setError(result.error ?? "This time is no longer available. Please choose another time.");
          if (result.error?.includes("just taken"))
            returnTimer.current = setTimeout(onSlotTaken, 1800);
          return;
        }
        bookingId = result.bookingId;
        setHeldFor({ key: holdKey, bookingId });
      }
      const payment = await createPayfastPayment(bookingId);
      if (!payment.ok) {
        setError(payment.error);
        if (payment.error.includes("reservation has expired")) {
          setHeldFor(null);
          returnTimer.current = setTimeout(onSlotTaken, 1800);
        }
        return;
      }
      submitPayfastForm(payment.action, payment.fields);
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      submitting.current = false;
      setLoading(false);
      onBusyChange(false);
    }
  }

  const sessionRows: [string, string, number][] = [
    ["Consultation", service.name, 0],
    ["Meeting format", consultationFormatLabel(format), 0],
    ["Duration", `${service.duration_minutes} minutes`, 0],
    ["Date", formatDate(slot), 2],
    ["Time", `${formatTime(slot)} (SAST)`, 3],
    ["Payment method", paymentMethodLabel(paymentMethod), 4],
  ];
  const clientRows: [string, string, number][] = [
    ["Name", client.full_name, 1],
    ["Email", client.email, 1],
    ["WhatsApp", client.whatsapp, 1],
    ["Help with", client.help_required, 1],
  ];
  if (client.age < 18 && client.guardian_name)
    clientRows.push(["Parent/guardian", client.guardian_name, 1]);

  return (
    <div>
      <BookingStepHeading step={5} title="Your next move, ready to review">
        Check your consultation, details and payment method before confirming.
      </BookingStepHeading>
      {[
        { title: "Your session", rows: sessionRows },
        { title: "Your details", rows: clientRows },
      ].map((group) => (
        <section key={group.title} className="mt-7" aria-label={group.title}>
          <h3 className="eyebrow home-eyebrow text-[10px]">{group.title}</h3>
          <dl className="mt-3 divide-y divide-gold/20 rounded-md border border-gold/25 bg-secondary px-4 sm:px-5">
            {group.rows.map(([label, value, step]) => (
              <div key={label} className="py-4">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-2 flex items-start justify-between gap-4">
                  <span className="min-w-0 break-words text-sm font-semibold leading-6">
                    {value}
                  </span>
                  {label !== "Meeting format" && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onEdit(step)}
                      aria-label={`Edit ${label.toLowerCase()}`}
                      className="-my-2 inline-flex min-h-11 shrink-0 items-center px-1 text-xs font-semibold text-[#806022] underline decoration-gold/50 underline-offset-4 disabled:pointer-events-none disabled:opacity-50"
                    >
                      Edit
                    </button>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <p className="mt-5 rounded-md border border-gold/25 bg-secondary p-4 text-xs leading-6 text-muted-foreground">
        {consultationDelivery(format)}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-gold/30 py-5">
        <p className="text-sm font-semibold">Consultation total</p>
        <p className="text-3xl font-bold tracking-tight text-[#806022]">
          {formatZAR(service.price_cents)}
        </p>
      </div>
      <div className="mt-6 flex items-start gap-3">
        <LockKeyhole
          className="mt-0.5 h-5 w-5 shrink-0 text-[#806022]"
          strokeWidth={1.3}
          aria-hidden
        />
        <p className="text-xs leading-6 text-muted-foreground">
          {paymentMethod === "eft"
            ? "Confirm to reserve this slot and receive your booking confirmation and PDF invoice by email, with the bank details and payment reference. Pay by EFT and attach proof of payment via WhatsApp or email before your consultation. Payment remains pending until Kieraan verifies the funds."
            : "Your selected time is temporarily reserved when you continue to PayFast. Your booking is confirmed once payment is received."}
        </p>
      </div>
      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link
          to="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-gold underline-offset-4"
        >
          Terms &amp; Conditions
        </Link>
        , including the refund, cancellation and service delivery policies, and acknowledge our{" "}
        <Link
          to="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-gold underline-offset-4"
        >
          Privacy Policy
        </Link>
        . Please give at least 24 hours&apos; notice for cancellation or rescheduling. Refunds are
        reviewed and processed manually; approved refunds take 3–5 working days. Your statutory
        consumer rights still apply.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive"
        >
          {error}
        </p>
      )}
      <StepNav
        onBack={() => onEdit(4)}
        onNext={proceed}
        loading={loading}
        nextLabel={paymentMethod === "eft" ? "Confirm booking" : "Pay securely"}
        secure
      />
    </div>
  );
}
