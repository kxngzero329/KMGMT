import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { StepNav } from "./Stepper";
import { BookingNotice, BookingStepHeading } from "./BookingStep";
import {
  availableDatesQuery,
  availableSlotsQuery,
  bookingSettingsQuery,
  type PublicService,
} from "@/features/public/queries";
import {
  dateKeyToLocal,
  formatDate,
  formatTime,
  localDateKey,
  toZonedDateKey,
} from "@/lib/utils/format";

export function DateStep({
  serviceId,
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  serviceId: string;
  selected: string | null;
  onSelect: (date: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const settings = useQuery(bookingSettingsQuery);
  const today = toZonedDateKey(new Date());
  const max = settings.data?.max_advance_days ?? 42;
  const end = useMemo(() => {
    const date = dateKeyToLocal(today);
    date.setDate(date.getDate() + max);
    return localDateKey(date);
  }, [today, max]);
  const dates = useQuery({
    ...availableDatesQuery(serviceId, today, end),
    enabled: !!settings.data,
  });
  const available = useMemo(() => new Set(dates.data ?? []), [dates.data]);
  const loading = settings.isLoading || (!!settings.data && dates.isLoading);
  const failed = settings.isError || dates.isError;
  const retry = () => {
    if (settings.isError) void settings.refetch();
    else void dates.refetch();
  };

  return (
    <div>
      <BookingStepHeading step={2} title="Find a date that suits you">
        Only dates with available times can be selected. All appointments use South African time
        (SAST, UTC+2).
      </BookingStepHeading>
      {loading ? (
        <div role="status" aria-label="Loading available dates" className="mt-7">
          <Skeleton className="mx-auto h-80 w-full max-w-sm motion-reduce:animate-none" />
        </div>
      ) : failed ? (
        <BookingNotice
          title="Available dates couldn't load"
          error
          onRetry={retry}
          retrying={settings.isFetching || dates.isFetching}
        >
          Please try again before choosing a date.
        </BookingNotice>
      ) : available.size === 0 ? (
        <BookingNotice title="No dates available right now">
          Please check back soon or contact KMGMT for help.
        </BookingNotice>
      ) : (
        <>
          <div className="booking-calendar mt-7 flex justify-center rounded-md border border-gold/25 bg-secondary px-0 py-5 sm:p-6">
            <Calendar
              mode="single"
              selected={selected ? dateKeyToLocal(selected) : undefined}
              onSelect={(date) => date && onSelect(localDateKey(date))}
              disabled={(date) => !available.has(localDateKey(date))}
              startMonth={dateKeyToLocal(today)}
              endMonth={dateKeyToLocal(end)}
              {...(selected
                ? { defaultMonth: dateKeyToLocal(selected) }
                : dates.data?.[0]
                  ? { defaultMonth: dateKeyToLocal(dates.data[0]) }
                  : {})}
              className="bg-transparent p-0 [--cell-size:clamp(1.875rem,calc((100vw-6rem)/7),2.75rem)] sm:[--cell-size:2.75rem]"
            />
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-[#806022]" aria-hidden />
            Times are shown in SAST.
          </p>
        </>
      )}
      {selected && available.has(selected) && !failed && (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-md border border-gold/25 bg-gold/5 p-4"
        >
          <CalendarDays
            className="mt-0.5 h-5 w-5 shrink-0 text-[#806022]"
            strokeWidth={1.4}
            aria-hidden
          />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Your selected date
            </p>
            <p className="mt-1 text-sm font-semibold leading-6">
              {formatDate(`${selected}T12:00:00+02:00`)}
            </p>
          </div>
        </div>
      )}
      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextLabel="Choose a time"
        disabled={!selected || !available.has(selected) || loading || failed || dates.isFetching}
      />
    </div>
  );
}

export function TimeStep({
  service,
  date,
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  service: PublicService;
  date: string;
  selected: string | null;
  onSelect: (slot: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const slots = useQuery(availableSlotsQuery(service.id, date));
  return (
    <div>
      <BookingStepHeading step={3} title="Make time for your next move">
        {formatDate(`${date}T12:00:00+02:00`)}
      </BookingStepHeading>
      <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 px-3 py-1.5">
          <Clock className="h-3.5 w-3.5 text-[#806022]" aria-hidden />
          {service.duration_minutes} minutes
        </span>
        <span className="inline-flex items-center rounded-full border border-gold/25 px-3 py-1.5">
          SAST · UTC+2
        </span>
      </div>
      {slots.isLoading ? (
        <div
          role="status"
          aria-label="Loading available times"
          className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-16 motion-reduce:animate-none" />
          ))}
        </div>
      ) : slots.isError ? (
        <BookingNotice
          title="Available times couldn't load"
          error
          onRetry={() => void slots.refetch()}
          retrying={slots.isFetching}
        >
          Please try again, or choose a different date.
        </BookingNotice>
      ) : !slots.data?.length ? (
        <BookingNotice title="No times left on this date">
          Go back and choose another available date.
        </BookingNotice>
      ) : (
        <fieldset className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <legend className="sr-only">Available times, South African time</legend>
          {slots.data.map((slot) => {
            const active = selected === slot;
            return (
              <label key={slot} className="relative block cursor-pointer">
                <input
                  type="radio"
                  name="booking-time"
                  value={slot}
                  checked={active}
                  onChange={() => onSelect(slot)}
                  aria-label={`${formatTime(slot)} SAST`}
                  className="peer sr-only"
                />
                <span
                  className={`booking-time-option flex min-h-16 items-center justify-center gap-2 rounded-md border text-base font-semibold tabular-nums peer-focus-visible:ring-2 peer-focus-visible:ring-gold ${active ? "border-gold bg-ink text-gold" : "border-border bg-secondary hover:border-gold"}`}
                >
                  {formatTime(slot)}
                  {active && <Check className="h-3.5 w-3.5" aria-hidden />}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}
      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextLabel="Review booking"
        disabled={
          !selected ||
          !slots.data?.includes(selected) ||
          slots.isLoading ||
          slots.isError ||
          slots.isFetching
        }
      />
    </div>
  );
}
