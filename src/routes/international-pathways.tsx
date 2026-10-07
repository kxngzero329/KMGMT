import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Clock,
  Compass,
  FileText,
  Globe2,
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
  Target,
  Video,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingAssurances, PitchLines, Reveal, RouteMap } from "@/components/home/HomeDetails";
import { internationalPathways } from "@/content/site";
import { servicesQuery } from "@/features/public/queries";
import { formatZAR } from "@/lib/utils/format";

export const Route = createFileRoute("/international-pathways")({
  head: () => ({
    meta: [
      { title: "International Football Pathways | KMGMT" },
      {
        name: "description",
        content:
          "Explore your next step beyond South Africa with Kieraan. Honest guidance on international football markets, player readiness, CVs, footage and career planning.",
      },
      { property: "og:title", content: "International Football Pathways | KMGMT" },
      {
        property: "og:description",
        content:
          "South African roots. International ambition. Build a clearer plan for your football career with KMGMT.",
      },
    ],
  }),
  component: Pathways,
});

const STAGE_ICONS = [Globe2, Target, RouteIcon] as const;
const PREPARATION_ICONS = [FileText, Video, Target, Compass] as const;

function Pathways() {
  const query = useQuery(servicesQuery);
  const service = query.data?.find((item) => item.slug === "international-career-consultation");

  return (
    <div className="pathways-page">
      <section className="pathways-hero relative isolate overflow-hidden bg-ink text-ink-foreground">
        <div className="container-page grid items-center gap-10 py-16 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-24">
          <div>
            <p className="eyebrow flex items-center gap-3 text-gold">
              <Globe2 className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              International pathways
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Rooted here.
              <br />
              Ready for <span className="text-gold">what's next.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-foreground/70">
              Your ambition can reach beyond South Africa. Understand what an international step
              could involve, where you stand and how to prepare with purpose.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="inverse" size="lg" className="booking-button">
                <a href="#pathways-consultation">
                  Talk through your pathway
                  <ArrowRight className="cta-arrow" aria-hidden />
                </a>
              </Button>
              <a
                href="#your-pathway"
                className="inline-flex min-h-12 items-center justify-center gap-2 text-sm font-semibold text-ink-foreground/75 hover:text-gold"
              >
                Explore the journey
                <ArrowDown className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <p className="mt-5 text-xs text-ink-foreground/50">
              Independent guidance for players and parents.
            </p>
          </div>
          <div
            className="pathways-map relative isolate aspect-[5/4] min-h-72 overflow-hidden border border-gold/20 bg-white/[0.015]"
            aria-label="Illustration of international pathways from South Africa"
          >
            <div className="absolute inset-x-0 bottom-24 top-12">
              <RouteMap className="right-0 h-full w-full min-w-0 md:right-0 md:w-full" />
              <span className="absolute left-[25%] top-[22%] text-[8px] uppercase tracking-widest text-gold/75 sm:text-[9px]">
                Explore possibilities
              </span>
              <div className="absolute left-[57%] top-[82%] flex items-center gap-1.5 whitespace-nowrap text-[9px] text-ink-foreground/80 sm:text-[10px]">
                <MapPin className="h-3 w-3 text-gold" aria-hidden />
                South Africa
              </div>
            </div>
            <div className="absolute inset-x-6 top-6 flex items-center justify-between gap-4 text-[9px] uppercase tracking-[0.18em] text-ink-foreground/45">
              <span>A wider perspective</span>
              <span className="h-2 w-2 rounded-full border border-gold/60" aria-hidden />
            </div>
            <div className="absolute inset-x-6 bottom-5 border-t border-gold/20 pt-4">
              <p className="font-display text-lg font-semibold">One career. A world to consider.</p>
              <p className="mt-1 text-[10px] text-ink-foreground/45">
                Illustrative routes, guided by your goals.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-gold/20">
          <div className="container-page grid gap-4 py-5 text-[10px] uppercase tracking-[0.15em] text-ink-foreground/65 sm:grid-cols-3">
            {["International perspective", "Personal readiness", "Considered career planning"].map(
              (text) => (
                <p key={text} className="flex items-center gap-3">
                  <span className="h-1 w-1 rounded-full bg-gold" aria-hidden />
                  {text}
                </p>
              ),
            )}
          </div>
        </div>
      </section>

      <section
        id="your-pathway"
        className="home-section scroll-mt-16 bg-secondary"
        aria-labelledby="pathway-title"
      >
        <div className="container-page">
          <Reveal>
            <p className="eyebrow home-eyebrow">Ambition, with direction</p>
            <div className="mt-4 grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-end md:gap-16">
              <h2 id="pathway-title" className="home-heading">
                A pathway starts
                <br />
                with <span className="gold-text">perspective.</span>
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                There is no single route to playing abroad. Start by understanding your own
                situation, then build a plan around what is realistic for you.
              </p>
            </div>
          </Reveal>
          <ol className="mt-12 grid gap-9 md:grid-cols-3 md:gap-8">
            {internationalPathways.stages.map((stage, i) => {
              const Icon = STAGE_ICONS[i] ?? Compass;
              return (
                <li key={stage.title} className="pathway-stage relative">
                  <Reveal delay={i * 80} className="h-full">
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-secondary font-display text-sm font-semibold text-[#806022]">
                      0{i + 1}
                    </div>
                    <div className="mt-6 flex items-start gap-3">
                      <Icon
                        className="mt-1 h-5 w-5 shrink-0 text-[#806022]"
                        strokeWidth={1.3}
                        aria-hidden
                      />
                      <h3 className="text-xl font-bold leading-snug">{stage.title}</h3>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{stage.text}</p>
                    <p className="mt-6 border-t border-gold/20 pt-4 text-[10px] uppercase leading-loose tracking-[0.1em] text-[#806022]">
                      {stage.detail}
                    </p>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="home-section relative isolate overflow-hidden bg-ink text-ink-foreground">
        <PitchLines className="absolute -bottom-48 -left-44 -z-10 h-[700px] w-[580px] rotate-12 text-gold/10" />
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow text-gold">Before the next move</p>
            <h2 className="home-heading mt-5">
              The right timing.
              <br />
              <span className="text-gold">The right preparation.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-foreground/65">
              Wanting to play abroad and being ready for the step are different questions. A focused
              conversation helps you look at both with a clear head.
            </p>
            <div className="mt-8 border-l border-gold/60 pl-5">
              <p className="font-display text-xl font-semibold leading-relaxed">
                Start with where you are.
                <br />
                Build towards where you want to be.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {internationalPathways.readiness.map((item, i) => (
              <Reveal key={item.title} delay={i * 60} className="border-t border-gold/30 pt-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs text-gold">0{i + 1}</span>
                  <span className="h-4 w-4 border-b border-r border-gold/30" aria-hidden />
                </div>
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-foreground/65">{item.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section bg-background" aria-labelledby="preparation-title">
        <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.3fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow home-eyebrow">Put the groundwork in</p>
            <h2 id="preparation-title" className="home-heading mt-4">
              Your game.
              <br />
              Your story.
              <br />
              <span className="gold-text">Your preparation.</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Make the conversation practical. Explore how to present your football background,
              prepare for possible opportunities and plan beyond a single move.
            </p>
            <a
              href="#pathways-consultation"
              className="booking-button mt-7 inline-flex min-h-11 items-center gap-3 text-sm font-semibold hover:text-[#806022]"
            >
              Discuss your preparation
              <ArrowRight className="cta-arrow h-4 w-4 text-gold" aria-hidden />
            </a>
          </Reveal>
          <Reveal>
            <Accordion
              type="single"
              defaultValue="preparation-0"
              collapsible
              className="home-faq border-t border-gold/25"
            >
              {internationalPathways.preparation.map((item, i) => {
                const Icon = PREPARATION_ICONS[i] ?? Compass;
                return (
                  <AccordionItem
                    key={item.title}
                    value={`preparation-${i}`}
                    className="border-gold/25"
                  >
                    <AccordionTrigger className="gap-4 py-6 text-left hover:text-[#806022] hover:no-underline">
                      <span className="flex items-start gap-4">
                        <Icon
                          className="mt-1 h-5 w-5 shrink-0 text-[#806022]"
                          strokeWidth={1.3}
                          aria-hidden
                        />
                        <span>
                          <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="mt-2 block text-lg font-semibold leading-snug">
                            {item.title}
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pl-9 pb-7 text-sm leading-7 text-muted-foreground">
                      <p>{item.text}</p>
                      <p className="mt-4 border-l border-gold/40 bg-secondary px-4 py-3 text-xs leading-relaxed text-foreground">
                        {item.takeaway}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-gold/20 bg-secondary">
        <div className="container-page flex flex-col gap-5 py-8 sm:flex-row sm:items-start sm:gap-6">
          <ShieldCheck className="h-7 w-7 shrink-0 text-[#806022]" strokeWidth={1.3} aria-hidden />
          <div>
            <h2 className="text-lg font-semibold">Honest guidance. Realistic expectations.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              KMGMT provides guidance and preparation. We do not guarantee trials, club placements,
              contracts or international opportunities. Your pathway depends on your circumstances
              and the opportunities available.
            </p>
          </div>
        </div>
      </section>

      <section className="home-section bg-background">
        <div className="container-page grid gap-10 md:grid-cols-[1fr_1.5fr] md:gap-16">
          <Reveal>
            <p className="eyebrow home-eyebrow">Before you look further</p>
            <h2 className="home-heading mt-4">
              Big questions.
              <br />
              <span className="gold-text">Honest answers.</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              A clearer understanding of what this conversation can do for you.
            </p>
          </Reveal>
          <Reveal>
            <Accordion type="single" collapsible className="home-faq border-t border-gold/20">
              {internationalPathways.faqs.map((faq, i) => (
                <AccordionItem key={faq.q} value={`pathway-faq-${i}`} className="border-gold/20">
                  <AccordionTrigger className="gap-5 py-6 text-left text-base font-semibold leading-relaxed hover:text-[#806022] hover:no-underline">
                    <span className="flex items-baseline gap-4">
                      <span className="text-xs text-[#806022]/65" aria-hidden>
                        0{i + 1}
                      </span>
                      <span>{faq.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-8 pb-6 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      <section
        id="pathways-consultation"
        className="home-final-cta home-section scroll-mt-16 overflow-hidden bg-ink text-ink-foreground"
        aria-labelledby="international-session-title"
      >
        <div className="container-page grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow text-gold">Start with a conversation</p>
            <h2 id="international-session-title" className="home-heading mt-5">
              A wider world.
              <br />
              <span className="text-gold">A considered next step.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-foreground/65">
              Talk through your international ambitions with Kieraan. Get perspective on your
              readiness, your profile and the questions that matter before a possible move.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-ink-foreground/75">
              {[
                "For players exploring a career abroad",
                "For parents helping plan the next stage",
                "For anyone asking: am I ready?",
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={80}>
            <div className="international-session rounded-md border border-gold/25 bg-background p-6 text-foreground sm:p-8">
              <p className="eyebrow home-eyebrow">One-to-one with Kieraan</p>
              <h3 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
                {service?.name ?? "International Career Consultation"}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {service?.short_description ??
                  "A focused look at international markets, your playing profile and preparation for the next step."}
              </p>
              {service ? (
                <>
                  <div className="mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-gold/20 pt-6">
                    <div>
                      <p className="font-display text-4xl font-bold text-[#806022]">
                        {formatZAR(service.price_cents)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">ZAR / session</p>
                    </div>
                    <span className="mb-1 inline-flex items-center gap-2 rounded-full border border-gold/20 px-3 py-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {service.duration_minutes} minutes
                    </span>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="booking-button mt-6 h-auto min-h-12 w-full justify-between gap-3 whitespace-normal px-4 py-3 text-left text-sm hover:border-gold hover:bg-gold hover:text-ink"
                  >
                    <Link
                      to="/book"
                      search={{ service: service.slug }}
                      aria-label={`Book ${service.name}`}
                    >
                      Book this consultation
                      <ArrowRight className="cta-arrow shrink-0" aria-hidden />
                    </Link>
                  </Button>
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Choose your date and time when you book.
                  </p>
                </>
              ) : query.isLoading ? (
                <div className="mt-7" role="status" aria-label="Loading consultation details">
                  <span className="sr-only">Loading price and availability…</span>
                  <Skeleton className="h-24 motion-reduce:animate-none" />
                </div>
              ) : (
                <div className="mt-7 border-t border-gold/20 pt-5">
                  <p role="status" className="text-sm leading-relaxed text-muted-foreground">
                    {query.isError
                      ? "We couldn't load the consultation details. Try again or get in touch for help."
                      : "This consultation isn't currently available to book. Get in touch to discuss your pathway."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {query.isError && (
                      <Button
                        variant="outline"
                        disabled={query.isFetching}
                        onClick={() => query.refetch()}
                      >
                        {query.isFetching ? "Trying again…" : "Try again"}
                      </Button>
                    )}
                    <Button asChild className="booking-button hover:bg-gold hover:text-ink">
                      <Link to="/contact">
                        Get in touch
                        <ArrowRight className="cta-arrow" aria-hidden />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
              <Link
                to="/services"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-[#806022]"
              >
                Explore all consultations
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="container-page mt-10">
          <BookingAssurances dark />
        </div>
      </section>
    </div>
  );
}
