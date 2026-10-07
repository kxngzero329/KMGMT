import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { formatZAR } from "@/lib/utils/format";
import type { PublicService } from "@/features/public/queries";

export function ServiceCard({ service, full = false }: { service: PublicService; full?: boolean }) {
  const recommended = service.slug === "general-football-consultation";
  return (
    <article
      className={`service-card group relative flex h-full flex-col rounded-md border bg-card p-7 ${recommended ? "border-gold/65" : "border-border"}`}
    >
      <div className="mb-6 flex min-h-6 flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-gold" aria-hidden /> {service.duration_minutes} min
        </span>
        {recommended && (
          <span className="rounded-sm bg-gold/15 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-[#806022]">
            RECOMMENDED
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold leading-tight">{service.name}</h3>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
        {full ? service.full_description : service.short_description}
      </p>
      <div className="mt-8 border-t border-gold/20 pt-6">
        <span className="font-display text-3xl font-bold tracking-tight text-[#806022]">
          {formatZAR(service.price_cents)}
        </span>
        <span className="ml-2 text-xs text-muted-foreground">/ session</span>
      </div>
      <Link
        to="/book"
        search={{ service: service.slug }}
        aria-label={`Book ${service.name}`}
        className={`booking-button mt-6 inline-flex min-h-12 items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm font-semibold ${recommended ? "border-ink bg-ink text-ink-foreground" : "border-foreground/20"} hover:border-gold hover:bg-gold hover:text-ink`}
      >
        Book this consultation <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
      </Link>
    </article>
  );
}
