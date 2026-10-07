import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { LockKeyhole } from "lucide-react";
import { Stepper } from "@/components/booking/Stepper";
import { DetailsStep } from "@/components/booking/DetailsStep";
import { emptyDetails, type DetailsDraft } from "@/components/booking/details-draft";
import { ServiceStep } from "@/components/booking/ServiceStep";
import { DateStep, TimeStep } from "@/components/booking/DateTimeSteps";
import { ReviewStep } from "@/components/booking/ReviewStep";
import { BookingSummary, MobileBookingSummary } from "@/components/booking/BookingSummary";
import { BookingAssurances, PitchLines } from "@/components/home/HomeDetails";
import { servicesQuery, type PublicService } from "@/features/public/queries";
import type { ClientDetails } from "@/lib/validation/schemas";

export const Route = createFileRoute("/book")({
  validateSearch: z.object({ service: z.string().max(80).optional() }),
  head: () => ({
    meta: [
      { title: "Book a Consultation | KMGMT" },
      {
        name: "description",
        content:
          "Book a personal football career consultation with Kieraan. Choose your session, share your details, find an available time and pay securely with PayFast.",
      },
      { property: "og:title", content: "Book a Consultation | KMGMT" },
      {
        property: "og:description",
        content:
          "Your next move starts here. Book a consultation with Kieraan in five clear steps.",
      },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const search = Route.useSearch();
  const services = useQuery(servicesQuery);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<PublicService | null>(null);
  const [draft, setDraft] = useState<DetailsDraft>(emptyDetails);
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(0);

  useEffect(() => {
    if (!service && search.service && services.data) {
      const requested = services.data.find((service) => service.slug === search.service);
      if (requested) setService(requested);
    }
  }, [search.service, services.data, service]);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    workspaceRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    workspaceRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }, [step]);

  const go = (next: number) => {
    if (!busy) setStep(next);
  };
  const unavailableLink =
    search.service &&
    services.data &&
    !services.data.some((service) => service.slug === search.service);

  return (
    <div className="booking-page">
      <section className="booking-hero relative isolate overflow-hidden bg-ink text-ink-foreground">
        <PitchLines className="absolute -right-28 -top-36 -z-10 h-[560px] w-[470px] rotate-12 text-gold/[0.07]" />
        <div className="container-page grid items-center gap-7 py-12 md:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <p className="eyebrow flex items-center gap-3 text-gold">
              <span className="h-px w-8 bg-gold" aria-hidden />
              Book with Kieraan
            </p>
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
              Your next move.
              <br />
              <span className="text-gold">Starts here.</span>
            </h1>
          </div>
          <div className="max-w-md">
            <p className="text-sm leading-7 text-ink-foreground/70">
              Choose a consultation, share your background and find a time that works for you. A
              focused conversation about what comes next.
            </p>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-ink-foreground/60">
              <LockKeyhole className="h-3.5 w-3.5 text-gold" strokeWidth={1.3} aria-hidden />
              Five clear steps. Secure PayFast payment.
            </p>
          </div>
        </div>
      </section>
      <section className="bg-secondary py-9 md:py-12" aria-label="Build your consultation booking">
        <div ref={workspaceRef} id="booking-workspace" className="container-page scroll-mt-20">
          <Stepper current={step} {...(!busy ? { onEdit: go } : {})} />
          <MobileBookingSummary service={service} date={date} slot={slot} />
          <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_0.85fr] lg:gap-10">
            <div
              id="booking-step"
              className="min-w-0 rounded-md border border-gold/25 bg-background p-5 sm:p-8"
            >
              {step === 0 && (
                <>
                  {unavailableLink && (
                    <p
                      role="status"
                      className="mb-6 rounded-md border border-gold/25 bg-secondary p-4 text-xs leading-6 text-muted-foreground"
                    >
                      The consultation in that link isn't currently available. Please choose from
                      the options below.
                    </p>
                  )}
                  <ServiceStep
                    services={services.data}
                    loading={services.isLoading}
                    error={services.isError}
                    retrying={services.isFetching}
                    selected={service}
                    onSelect={(selected) => {
                      if (selected.id !== service?.id) {
                        setDate(null);
                        setSlot(null);
                      }
                      setService(selected);
                    }}
                    onNext={() => service && go(1)}
                    onRetry={() => void services.refetch()}
                  />
                </>
              )}
              {step === 1 && (
                <DetailsStep
                  value={draft}
                  onChange={setDraft}
                  onBack={() => go(0)}
                  onNext={(parsed) => {
                    setClient(parsed);
                    go(2);
                  }}
                />
              )}
              {step === 2 && service && (
                <DateStep
                  serviceId={service.id}
                  selected={date}
                  onSelect={(selected) => {
                    setDate(selected);
                    setSlot(null);
                  }}
                  onBack={() => go(1)}
                  onNext={() => date && go(3)}
                />
              )}
              {step === 3 && service && date && (
                <TimeStep
                  service={service}
                  date={date}
                  selected={slot}
                  onSelect={setSlot}
                  onBack={() => go(2)}
                  onNext={() => slot && go(4)}
                />
              )}
              {step === 4 && service && client && slot && (
                <ReviewStep
                  service={service}
                  client={client}
                  slot={slot}
                  onEdit={go}
                  onSlotTaken={() => {
                    setSlot(null);
                    go(3);
                  }}
                  onBusyChange={setBusy}
                />
              )}
            </div>
            <BookingSummary service={service} date={date} slot={slot} />
          </div>
          <div className="mt-9 border-t border-gold/20 pt-7">
            <BookingAssurances />
          </div>
        </div>
      </section>
    </div>
  );
}
