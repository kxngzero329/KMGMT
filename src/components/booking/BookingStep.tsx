import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookingStepHeading({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="eyebrow home-eyebrow text-[10px]">
        Step {String(step + 1).padStart(2, "0")} / 05
      </p>
      <h2
        tabIndex={-1}
        className="mt-3 text-2xl font-bold leading-tight tracking-tight focus:outline-none sm:text-3xl"
      >
        {title}
      </h2>
      <div className="mt-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </div>
  );
}

export function BookingNotice({
  title,
  children,
  error = false,
  onRetry,
  retrying,
}: {
  title: string;
  children: ReactNode;
  error?: boolean;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const Icon = error ? AlertCircle : CalendarDays;
  return (
    <div
      role={error ? "alert" : "status"}
      className="mt-6 rounded-md border border-gold/25 bg-secondary p-5 sm:p-6"
    >
      <Icon className="h-6 w-6 text-[#806022]" strokeWidth={1.4} aria-hidden />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <div className="mt-2 text-sm leading-7 text-muted-foreground">{children}</div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {onRetry && (
          <Button type="button" variant="outline" onClick={onRetry} disabled={retrying}>
            {retrying ? "Trying again…" : "Try again"}
          </Button>
        )}
        <Link
          to="/contact"
          target="_blank"
          className="inline-flex min-h-11 items-center text-xs font-semibold underline decoration-gold/50 underline-offset-4 hover:text-[#806022]"
        >
          Contact KMGMT<span className="sr-only"> (opens in a new tab)</span>
        </Link>
      </div>
    </div>
  );
}
