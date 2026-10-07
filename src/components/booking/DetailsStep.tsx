import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Shirt } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/common/Field";
import { clientDetailsSchema, type ClientDetails } from "@/lib/validation/schemas";
import { BookingStepHeading } from "./BookingStep";
import { StepNav } from "./Stepper";

import type { DetailsDraft } from "./details-draft";

const BACKGROUND_FIELDS = [
  "position",
  "current_club",
  "previous_clubs",
  "playing_level",
  "social_profile",
  "highlight_video_url",
] as const;

export function DetailsStep({
  value,
  onChange,
  onBack,
  onNext,
}: {
  value: DetailsDraft;
  onChange: (value: DetailsDraft) => void;
  onBack: () => void;
  onNext: (parsed: ClientDetails) => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof DetailsDraft, string>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const backgroundRef = useRef<HTMLDetailsElement>(null);
  const set = (key: keyof DetailsDraft) => (nextValue: string) => {
    onChange({ ...value, [key]: nextValue });
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };
  const age = Number(value.age);
  const isMinor = value.age !== "" && !Number.isNaN(age) && age < 18;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = clientDetailsSchema.safeParse(value);
    if (!result.success) {
      const nextErrors = Object.fromEntries(
        result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      );
      setErrors(nextErrors);
      if (BACKGROUND_FIELDS.some((key) => nextErrors[key]) && backgroundRef.current)
        backgroundRef.current.open = true;
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setErrors({});
    onNext(result.data);
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="booking-details-form [&_input]:bg-secondary [&_input]:shadow-none [&_textarea]:min-h-32 [&_textarea]:resize-y [&_textarea]:bg-secondary [&_textarea]:shadow-none"
    >
      <BookingStepHeading step={1} title="The person behind the player">
        Add the player's details and what you'd like guidance on. Fields marked{" "}
        <span className="text-[#806022]">*</span> are required.
      </BookingStepHeading>
      <fieldset className="mt-8 min-w-0 space-y-5 border-t border-gold/25 pt-6">
        <legend className="pr-3 text-sm font-semibold">
          <span className="mr-2 text-xs font-normal text-[#806022]" aria-hidden>
            01
          </span>
          Player &amp; contact details
        </legend>
        <Field
          label="Full name"
          required
          value={value.full_name}
          onChange={set("full_name")}
          error={errors.full_name}
          autoComplete="name"
          placeholder="Player's full name"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Age"
            required
            type="number"
            inputMode="numeric"
            value={value.age}
            onChange={set("age")}
            error={errors.age}
            placeholder="Player's age"
          />
          <Field
            label="Country of residence"
            required
            value={value.country}
            onChange={set("country")}
            error={errors.country}
            autoComplete="country-name"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Email"
            required
            type="email"
            value={value.email}
            onChange={set("email")}
            error={errors.email}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field
            label="WhatsApp number"
            required
            type="tel"
            value={value.whatsapp}
            onChange={set("whatsapp")}
            error={errors.whatsapp}
            autoComplete="tel"
            placeholder="+27 82 123 4567"
          />
        </div>
      </fieldset>
      {isMinor && (
        <fieldset className="mt-8 min-w-0 space-y-5 rounded-md border border-gold/40 bg-gold/5 p-4 sm:p-5">
          <legend className="px-2 text-xs font-semibold text-[#806022]">
            Parent / guardian · Required for under 18
          </legend>
          <p className="text-xs leading-6 text-muted-foreground">
            A parent or guardian's details and consent are required for a player under 18.
          </p>
          <Field
            label="Parent/guardian full name"
            required
            value={value.guardian_name}
            onChange={set("guardian_name")}
            error={errors.guardian_name}
            autoComplete="name"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Parent/guardian email"
              required
              type="email"
              value={value.guardian_email}
              onChange={set("guardian_email")}
              error={errors.guardian_email}
              autoComplete="email"
            />
            <Field
              label="Parent/guardian phone"
              required
              type="tel"
              value={value.guardian_phone}
              onChange={set("guardian_phone")}
              error={errors.guardian_phone}
              autoComplete="tel"
            />
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="booking-guardian-consent"
              checked={value.guardian_consent}
              onCheckedChange={(checked) => {
                onChange({ ...value, guardian_consent: checked === true });
                setErrors((previous) => {
                  const next = { ...previous };
                  delete next.guardian_consent;
                  return next;
                });
              }}
              aria-invalid={!!errors.guardian_consent}
              aria-describedby={errors.guardian_consent ? "booking-consent-error" : undefined}
              className="mt-0.5 h-5 w-5 shrink-0"
            />
            <label htmlFor="booking-guardian-consent" className="text-sm leading-7">
              I am the parent/guardian and I consent to this player booking a consultation and to
              KMGMT processing the information provided, as described in the{" "}
              <Link
                to="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-gold underline-offset-4"
              >
                Privacy Policy<span className="sr-only"> (opens in a new tab)</span>
              </Link>
              .
            </label>
          </div>
          {errors.guardian_consent && (
            <p id="booking-consent-error" className="text-sm text-destructive">
              {errors.guardian_consent}
            </p>
          )}
        </fieldset>
      )}
      <fieldset className="mt-8 min-w-0 space-y-5 border-t border-gold/25 pt-6">
        <legend className="pr-3 text-sm font-semibold">
          <span className="mr-2 text-xs font-normal text-[#806022]" aria-hidden>
            02
          </span>
          Your goals &amp; questions
        </legend>
        <Field
          label="What do you want help with?"
          required
          value={value.help_required}
          onChange={set("help_required")}
          error={errors.help_required}
          placeholder="e.g. Understanding my career options"
        />
        <Field
          label="Brief description of your situation"
          multiline
          value={value.situation_description}
          onChange={set("situation_description")}
          error={errors.situation_description}
          placeholder="Where are you now, and what would you like your next step to look like?"
        />
      </fieldset>
      <details
        ref={backgroundRef}
        className="group mt-8 rounded-md border border-gold/25 bg-secondary/50"
      >
        <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
          <Shirt className="h-5 w-5 shrink-0 text-[#806022]" strokeWidth={1.3} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              Football background{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </span>
            <span className="mt-1 block text-xs leading-6 text-muted-foreground">
              Your playing history, social profile and footage.
            </span>
            {BACKGROUND_FIELDS.some((key) => value[key]) && (
              <span className="mt-1 block text-[10px] font-semibold text-[#806022]">
                Details added
              </span>
            )}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-[#806022] transition-transform group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden
          />
        </summary>
        <fieldset className="min-w-0 space-y-5 border-t border-gold/20 p-4 sm:p-5">
          <legend className="sr-only">Optional football background</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Position"
              value={value.position}
              onChange={set("position")}
              error={errors.position}
              placeholder="e.g. Central midfielder"
            />
            <Field
              label="Current playing level"
              value={value.playing_level}
              onChange={set("playing_level")}
              error={errors.playing_level}
              placeholder="e.g. School, amateur, semi-pro"
            />
          </div>
          <Field
            label="Current club / team"
            value={value.current_club}
            onChange={set("current_club")}
            error={errors.current_club}
          />
          <Field
            label="Previous clubs"
            value={value.previous_clubs}
            onChange={set("previous_clubs")}
            error={errors.previous_clubs}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Instagram / social profile"
              value={value.social_profile}
              onChange={set("social_profile")}
              error={errors.social_profile}
              placeholder="@username or link"
            />
            <Field
              label="Highlight video link"
              type="url"
              value={value.highlight_video_url}
              onChange={set("highlight_video_url")}
              error={errors.highlight_video_url}
              placeholder="https://"
            />
          </div>
        </fieldset>
      </details>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          Please check the highlighted fields before continuing.
        </p>
      )}
      <p className="mt-6 text-xs leading-6 text-muted-foreground">
        These details help Kieraan prepare for your consultation. Read our{" "}
        <Link
          to="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-gold/60 underline-offset-4 hover:text-[#806022]"
        >
          Privacy Policy<span className="sr-only"> (opens in a new tab)</span>
        </Link>
        .
      </p>
      <StepNav onBack={onBack} submit nextLabel="Choose a date" />
    </form>
  );
}
