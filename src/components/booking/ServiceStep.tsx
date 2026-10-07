import { Check, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StepNav } from "./Stepper";
import { BookingNotice, BookingStepHeading } from "./BookingStep";
import { formatZAR } from "@/lib/utils/format";
import type { PublicService } from "@/features/public/queries";

export function ServiceStep({
  services,
  loading,
  error,
  retrying,
  selected,
  onSelect,
  onNext,
  onRetry,
}: {
  services: PublicService[] | undefined;
  loading: boolean;
  error: boolean;
  retrying: boolean;
  selected: PublicService | null;
  onSelect: (service: PublicService) => void;
  onNext: () => void;
  onRetry: () => void;
}) {
  return (
    <div>
      <BookingStepHeading step={0} title="Choose your consultation">
        Select the session that best fits the question on your mind.
      </BookingStepHeading>
      {loading ? (
        <div role="status" aria-label="Loading consultations" className="mt-7 space-y-4">
          <span className="sr-only">Loading consultations…</span>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-36 motion-reduce:animate-none" />
          ))}
        </div>
      ) : error && !services?.length ? (
        <BookingNotice
          title="Consultations couldn't load"
          error
          onRetry={onRetry}
          retrying={retrying}
        >
          Please try again to see the available sessions.
        </BookingNotice>
      ) : !services?.length ? (
        <BookingNotice title="No consultations available right now">
          Please check back soon or get in touch to discuss your next step.
        </BookingNotice>
      ) : (
        <fieldset className="mt-7 space-y-4">
          <legend className="sr-only">Choose a consultation</legend>
          {services.map((service) => {
            const active = selected?.id === service.id;
            const recommended = service.slug === "general-football-consultation";
            const nameId = `booking-service-${service.id}`;
            const descriptionId = `${nameId}-description`;
            return (
              <label
                key={service.id}
                className={`booking-service-option relative flex cursor-pointer gap-3 rounded-md border p-4 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold sm:gap-4 sm:p-5 ${active ? "border-gold bg-gold/5 ring-1 ring-gold/40" : "border-border bg-background hover:border-gold/65"}`}
              >
                <input
                  type="radio"
                  name="consultation"
                  value={service.id}
                  checked={active}
                  onChange={() => onSelect(service)}
                  aria-labelledby={nameId}
                  aria-describedby={descriptionId}
                  className="sr-only"
                />
                <span
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-gold bg-gold text-ink" : "border-foreground/25"}`}
                  aria-hidden
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  {recommended && (
                    <span className="mb-3 inline-block rounded-sm border border-gold/35 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#806022]">
                      A good place to start
                    </span>
                  )}
                  <span className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start sm:gap-5">
                    <span
                      id={nameId}
                      className="text-base font-bold leading-6 tracking-tight sm:text-lg"
                    >
                      {service.name}
                    </span>
                    <span className="shrink-0 text-xl font-bold leading-6 tracking-tight text-[#806022] sm:text-2xl">
                      {formatZAR(service.price_cents)}
                    </span>
                  </span>
                  <span
                    id={descriptionId}
                    className="mt-3 block text-sm leading-6 text-muted-foreground"
                  >
                    {service.short_description}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/20 px-2.5 py-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-[#806022]" strokeWidth={1.4} aria-hidden />
                    {service.duration_minutes} minutes
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      )}
      <StepNav
        onNext={onNext}
        nextLabel="Your details"
        disabled={loading || !selected || !services?.some((service) => service.id === selected.id)}
      />
    </div>
  );
}
