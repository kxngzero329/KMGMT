import { Check, ArrowLeft, ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BOOKING_STEPS = ["Consultation", "Your details", "Date", "Time", "Review"] as const;
const MOBILE_LABELS = ["Session", "Details", "Date", "Time", "Review"];

export function Stepper({ current, onEdit }: { current: number; onEdit?: (step: number) => void }) {
  return (
    <nav aria-label="Booking progress" className="mb-7 sm:mb-9">
      <p className="mb-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Step <span className="font-semibold text-foreground">{current + 1}</span> of{" "}
          {BOOKING_STEPS.length}
        </span>
        <span className="font-semibold text-[#806022]">{BOOKING_STEPS[current]}</span>
      </p>
      <ol className="grid grid-cols-5">
        {BOOKING_STEPS.map((label, index) => {
          const completed = index < current;
          const active = index === current;
          const content = (
            <>
              <span
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold tabular-nums sm:h-10 sm:w-10 ${active ? "border-gold bg-ink text-gold ring-4 ring-gold/10" : completed ? "border-gold/50 bg-secondary text-[#806022]" : "border-border bg-secondary text-muted-foreground"}`}
                aria-hidden
              >
                {completed ? <Check className="h-4 w-4" /> : String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={`mt-3 text-[10px] font-semibold sm:text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}
              >
                <span className="sm:hidden">{MOBILE_LABELS[index]}</span>
                <span className="hidden sm:inline">{label}</span>
              </span>
            </>
          );
          return (
            <li key={label} aria-current={active ? "step" : undefined} className="relative">
              {index < BOOKING_STEPS.length - 1 && (
                <span
                  className={`absolute left-1/2 right-[-50%] top-[18px] h-px sm:top-5 ${completed ? "bg-gold/50" : "bg-border"}`}
                  aria-hidden
                />
              )}
              {completed && onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(index)}
                  aria-label={`Edit ${label.toLowerCase()}`}
                  className="relative flex min-h-16 w-full flex-col items-center rounded-md focus-visible:outline-offset-4"
                >
                  {content}
                </button>
              ) : (
                <div
                  className="relative flex min-h-16 flex-col items-center"
                  aria-label={`${label}: ${active ? "current step" : completed ? "completed step" : "upcoming step"}`}
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StepNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  disabled,
  loading,
  submit = false,
  secure = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  submit?: boolean;
  secure?: boolean;
}) {
  return (
    <div className="booking-step-nav sticky bottom-0 z-20 -mx-5 -mb-5 mt-9 flex items-center gap-3 rounded-b-md border-t border-gold/20 bg-background/95 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:-mx-8 sm:-mb-8 sm:px-8 sm:py-6">
      {onBack && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="h-12 gap-2 px-3 text-xs sm:px-4 sm:text-sm"
        >
          <ArrowLeft className="hidden h-4 w-4 sm:block" aria-hidden />
          Back
        </Button>
      )}
      {(onNext || submit) && (
        <Button
          type={submit ? "submit" : "button"}
          onClick={submit ? undefined : onNext}
          disabled={disabled || loading}
          className="booking-button h-12 min-w-0 flex-1 px-3 text-sm hover:bg-gold hover:text-ink sm:ml-auto sm:flex-none sm:px-6"
        >
          {loading ? (
            <>
              <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden />
              Please wait…
            </>
          ) : (
            <>
              {nextLabel}
              {secure ? (
                <LockKeyhole aria-hidden />
              ) : (
                <ArrowRight className="cta-arrow" aria-hidden />
              )}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
