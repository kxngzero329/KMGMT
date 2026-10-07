import type { ReactNode } from "react";
import type { BookingStatus, PaymentStatus } from "@/types/domain";
import { BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/types/domain";

export function AdminTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
      {children}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border bg-card ${className}`}>{children}</div>;
}

const BOOKING_TONE: Record<BookingStatus, string> = {
  pending_payment: "border-warning text-warning",
  confirmed: "border-success text-success",
  completed: "border-foreground/40 text-foreground",
  cancelled: "border-destructive/60 text-destructive",
  no_show: "border-destructive/60 text-destructive",
  expired: "border-border text-muted-foreground",
};
const PAYMENT_TONE: Record<PaymentStatus, string> = {
  pending: "border-warning text-warning",
  paid: "border-success text-success",
  failed: "border-destructive/60 text-destructive",
  cancelled: "border-border text-muted-foreground",
  refunded: "border-border text-muted-foreground",
};

export function BookingBadge({ status }: { status: BookingStatus }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${BOOKING_TONE[status]}`}>{BOOKING_STATUS_LABEL[status]}</span>;
}
export function PaymentBadge({ status }: { status?: PaymentStatus | null | undefined }) {
  if (!status) return <span className="text-xs text-muted-foreground"></span>;
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${PAYMENT_TONE[status]}`}>{PAYMENT_STATUS_LABEL[status]}</span>;
}

export const selectCls = "h-10 rounded-md border border-input bg-background px-3 text-sm";
export const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
