import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Compass,
  LockKeyhole,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { PitchLines } from "@/components/home/HomeDetails";
import { formatDate, formatTime, formatZAR } from "@/lib/utils/format";
import type { PublicService } from "@/features/public/queries";
import { consultant } from "@/content/site";

type SummaryProps = { service: PublicService | null; date: string | null; slot: string | null };

function SummaryDetails({ service, date, slot, dark = false }: SummaryProps & { dark?: boolean }) {
  const rows = [
    {
      label: "Session length",
      value: service ? `${service.duration_minutes} minutes` : "Choose a consultation",
      icon: Clock,
    },
    {
      label: "Date",
      value: date
        ? formatDate(`${date}T12:00:00+02:00`, {
            weekday: "short",
            month: "short",
            year: undefined,
          })
        : "Not chosen yet",
      icon: CalendarDays,
    },
    { label: "Time", value: slot ? `${formatTime(slot)} SAST` : "Not chosen yet", icon: Clock },
  ];
  return (
    <dl className={`space-y-5 ${dark ? "text-ink-foreground" : "text-foreground"}`}>
      {rows.map(({ label, value, icon: Icon }) => (
        <div key={label} className="grid grid-cols-[1.25rem_1fr] gap-x-3">
          <dt
            className={`col-span-2 flex items-center gap-3 text-[10px] uppercase tracking-[0.1em] ${dark ? "text-ink-foreground/55" : "text-muted-foreground"}`}
          >
            <Icon
              className={`h-4 w-4 ${dark ? "text-gold" : "text-[#806022]"}`}
              strokeWidth={1.3}
              aria-hidden
            />
            {label}
          </dt>
          <dd className="col-start-2 mt-1 text-sm font-medium leading-6">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MobileBookingSummary(props: SummaryProps) {
  if (!props.service) return null;
  return (
    <details className="group mb-6 rounded-md border border-gold/25 bg-background px-4 py-3 lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
            Your consultation
          </span>
          <span className="mt-1 block text-xs font-semibold leading-5">{props.service.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-sm font-bold text-[#806022]">
          {formatZAR(props.service.price_cents)}
          <ChevronDown
            className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden
          />
        </span>
      </summary>
      <div className="mt-4 border-t border-gold/20 pt-5">
        <SummaryDetails {...props} />
      </div>
    </details>
  );
}

export function BookingSummary(props: SummaryProps) {
  return (
    <aside
      className="sticky top-24 hidden space-y-5 self-start lg:block"
      aria-label="Your booking summary"
    >
      <div className="relative isolate overflow-hidden rounded-md border border-gold/30 bg-ink p-7 text-ink-foreground">
        <PitchLines className="absolute -right-20 -top-20 -z-10 h-[450px] w-[370px] rotate-12 text-gold/[0.08]" />
        <span
          className="absolute left-0 top-0 h-7 w-7 border-l border-t border-gold/80"
          aria-hidden
        />
        <p className="eyebrow text-[10px] text-gold">Your consultation</p>
        <div className="mt-5 flex items-center gap-3 border-b border-gold/20 pb-5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-sm font-semibold text-gold"
            aria-hidden
          >
            {consultant.name.charAt(0)}
          </span>
          <div>
            <p className="text-sm font-semibold">With {consultant.name}</p>
            <p className="mt-1 text-[11px] text-ink-foreground/60">Independent career guidance</p>
          </div>
        </div>
        {props.service ? (
          <>
            <h2 className="mt-6 text-xl font-semibold leading-7 tracking-tight">
              {props.service.name}
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-gold">
              {formatZAR(props.service.price_cents)}
            </p>
            <p className="mt-2 text-[11px] text-ink-foreground/55">
              Consultation total · Payment at the final step
            </p>
            <div className="mt-7 border-t border-gold/20 pt-6">
              <SummaryDetails {...props} dark />
            </div>
          </>
        ) : (
          <div className="py-7">
            <Compass className="h-7 w-7 text-gold" strokeWidth={1.3} aria-hidden />
            <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-tight">
              One conversation.
              <br />
              <span className="text-gold">A clearer next step.</span>
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink-foreground/65">
              Choose a consultation to start building your booking.
            </p>
          </div>
        )}
        <p className="mt-7 flex items-start gap-2.5 border-t border-gold/20 pt-5 text-[11px] leading-6 text-ink-foreground/60">
          <LockKeyhole className="mt-1 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
          Secure payment through PayFast. Your booking is confirmed after payment is received.
        </p>
      </div>
      <div className="rounded-md border border-gold/25 bg-background p-6">
        <MessageCircle className="h-5 w-5 text-[#806022]" strokeWidth={1.3} aria-hidden />
        <p className="mt-3 text-sm font-semibold">A question before you book?</p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          We're here to help you understand the options.
        </p>
        <Link
          to="/contact"
          target="_blank"
          className="booking-button mt-2 inline-flex min-h-11 items-center gap-2 text-xs font-semibold hover:text-[#806022]"
        >
          Contact KMGMT
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </div>
    </aside>
  );
}
