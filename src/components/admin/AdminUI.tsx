import type { ReactNode } from "react";
import type { BookingStatus, PaymentStatus } from "@/types/domain";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/types/domain";
import { cn } from "@/lib/utils";

const PAGE_DESCRIPTIONS: Record<string, string> = {
  Bookings: "Every consultation, from first reservation to the final whistle.",
  Calendar: "A clear view of your schedule. All times are shown in SAST.",
  Availability: "Set your working hours and make room for the conversations that matter.",
  Clients: "The people behind the bookings. Find their details and get in touch.",
  Payments: "Follow every payment, invoice and EFT verification in one place.",
  Services: "Shape your consultations, pricing and what clients can book.",
  "Represented players": "Manage the players and stories featured on your website.",
  Testimonials: "Share the words that reflect your work. You control what goes live.",
  Enquiries: "New conversations and follow-ups, ready for your next move.",
};

export function AdminTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-9">
      <div>
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#806022]">
          KMGMT workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.035em] md:text-4xl">{title}</h1>
        {PAGE_DESCRIPTIONS[title] && (
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {PAGE_DESCRIPTIONS[title]}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card shadow-[0_2px_12px_rgba(30,25,15,0.025)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

const BOOKING_TONE: Record<BookingStatus, string> = {
  pending_payment: "border-[#806022]/15 bg-[#806022]/[0.055] text-[#806022]",
  confirmed: "border-success/15 bg-success/[0.055] text-[#2c674b]",
  completed: "border-foreground/10 bg-secondary text-foreground/75",
  cancelled: "border-border bg-secondary/60 text-muted-foreground",
  no_show: "border-destructive/15 bg-destructive/5 text-destructive",
  expired: "border-border bg-secondary/60 text-muted-foreground",
};
const PAYMENT_TONE: Record<PaymentStatus, string> = {
  pending: "border-[#806022]/15 bg-[#806022]/[0.055] text-[#806022]",
  paid: "border-success/15 bg-success/[0.055] text-[#2c674b]",
  failed: "border-destructive/15 bg-destructive/5 text-destructive",
  cancelled: "border-border bg-secondary/60 text-muted-foreground",
  refunded: "border-border bg-secondary/60 text-muted-foreground",
};

export function BookingBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-semibold ${BOOKING_TONE[status]}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" aria-hidden />
      {BOOKING_STATUS_LABEL[status]}
    </span>
  );
}
export function PaymentBadge({ status }: { status?: PaymentStatus | null | undefined }) {
  if (!status) return <span className="text-xs text-muted-foreground"></span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-semibold ${PAYMENT_TONE[status]}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" aria-hidden />
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}

export const selectCls =
  "h-11 min-w-0 rounded-lg border border-input/80 bg-white px-3 text-sm transition-colors focus:border-gold";
export const inputCls =
  "h-11 w-full min-w-0 rounded-lg border border-input/80 bg-white px-3 text-sm transition-colors placeholder:text-muted-foreground/60 focus:border-gold";
