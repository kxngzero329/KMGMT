import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, Compass, Globe2, Route, Scale, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { serviceGuidance } from "@/content/site";
import type { PublicService } from "@/features/public/queries";
import { formatZAR } from "@/lib/utils/format";

const ICONS: Record<string, typeof Compass> = {
  "general-football-consultation": Compass,
  "career-consultation": Route,
  "international-career-consultation": Globe2,
  "career-decision-consultation": Scale,
  "player-assessment-consultation": ScanLine,
};

export function ConsultationOffering({
  service,
  featured = false,
  number,
}: {
  service: PublicService;
  featured?: boolean;
  number: number;
}) {
  const guidance = serviceGuidance[service.slug];
  const Icon = ICONS[service.slug] ?? Compass;
  return (
    <article
      id={`consultation-${service.id}`}
      tabIndex={-1}
      className={`consultation-offering group flex h-full scroll-mt-24 flex-col overflow-hidden rounded-md border bg-card ${featured ? "border-gold/45 lg:grid lg:grid-cols-[1.6fr_1fr]" : "border-gold/15"}`}
      aria-labelledby={`consultation-title-${service.id}`}
    >
      <div className={`flex flex-1 flex-col p-6 sm:p-8 ${featured ? "lg:p-10" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
            <Icon className="h-5 w-5 text-[#806022]" strokeWidth={1.3} aria-hidden />
          </span>
          {featured ? (
            <span className="rounded-sm bg-gold/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#806022]">
              Recommended starting point
            </span>
          ) : (
            <span className="font-display text-xs text-muted-foreground/65" aria-hidden>
              {String(number).padStart(2, "0")}
            </span>
          )}
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#806022]">
          {guidance?.eyebrow ?? "A focused conversation"}
        </p>
        <h3
          id={`consultation-title-${service.id}`}
          className={`mt-3 max-w-lg font-bold leading-tight ${featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}
        >
          {service.name}
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          {service.full_description || service.short_description}
        </p>
        {guidance && (
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              What we can cover
            </p>
            <ul className={`mt-3 grid gap-2.5 ${featured ? "sm:grid-cols-2 lg:grid-cols-1" : ""}`}>
              {guidance.focus.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#806022]"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div
        className={
          featured
            ? "relative flex flex-col justify-center border-t border-gold/20 bg-ink p-6 text-ink-foreground sm:p-8 lg:border-l lg:border-t-0 lg:p-10"
            : "mt-auto px-6 pb-6 sm:px-8 sm:pb-8"
        }
      >
        {featured && (
          <>
            <p className="eyebrow text-gold">Your first conversation</p>
            <p className="mt-3 mb-8 text-sm leading-relaxed text-ink-foreground/65">
              For players and parents who want a clearer sense of where to begin.
            </p>
          </>
        )}
        <div
          className={`flex flex-wrap items-end justify-between gap-4 ${featured ? "" : "border-t border-gold/20 pt-6"}`}
        >
          <div>
            <p
              className={`font-display text-4xl font-bold tracking-tight ${featured ? "text-gold" : "text-[#806022]"}`}
            >
              {formatZAR(service.price_cents)}
            </p>
            <p
              className={`mt-1.5 text-xs ${featured ? "text-ink-foreground/55" : "text-muted-foreground"}`}
            >
              ZAR / session
            </p>
          </div>
          <span
            className={`mb-1 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${featured ? "border-gold/30 text-ink-foreground/75" : "border-gold/20 text-muted-foreground"}`}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {service.duration_minutes} minutes
          </span>
        </div>
        <Button
          asChild
          variant={featured ? "inverse" : "default"}
          className="booking-button mt-6 h-auto min-h-12 w-full justify-between gap-3 whitespace-normal px-4 py-3 text-left text-sm hover:border-gold hover:bg-gold hover:text-ink"
        >
          <Link to="/book" search={{ service: service.slug }} aria-label={`Book ${service.name}`}>
            Book this consultation
            <ArrowRight className="cta-arrow shrink-0" aria-hidden />
          </Link>
        </Button>
        {featured && (
          <p className="mt-4 text-center text-[11px] text-ink-foreground/50">
            Choose an available time when you book.
          </p>
        )}
      </div>
    </article>
  );
}
