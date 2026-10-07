import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Compass,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingAssurances, PitchLines, Reveal } from "@/components/home/HomeDetails";
import { ConsultationOffering } from "@/components/services/ConsultationOffering";
import { serviceGuidance } from "@/content/site";
import { servicesQuery } from "@/features/public/queries";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Consultation Services | KMGMT" },
      {
        name: "description",
        content:
          "Find the right football consultation with Kieraan. Explore career planning, international pathways, career decisions and player assessments, with clear pricing and secure booking.",
      },
      { property: "og:title", content: "Consultation Services | KMGMT" },
      {
        property: "og:description",
        content:
          "A focused conversation. An honest perspective. Choose the football consultation that fits your next step.",
      },
    ],
  }),
  component: ServicesPage,
});

const EXPECTATIONS = [
  {
    icon: MessageSquare,
    title: "Your situation, understood",
    text: "Share your playing background, goals and questions when you book, so the conversation starts with you.",
  },
  {
    icon: ShieldCheck,
    title: "An independent perspective",
    text: "Talk through your options honestly, with realistic guidance and your interests at the centre.",
  },
  {
    icon: Compass,
    title: "A clearer direction",
    text: "Use the conversation to identify priorities and understand what your next step could look like.",
  },
];
const FAQS = [
  {
    q: "Which consultation is right for me?",
    a: "Choose the session that matches your main question. Career Consultation covers your wider plan; International focuses on playing abroad; Career Decision helps you weigh a specific choice; Player Assessment looks at where you stand. If you're unsure, the General Football Consultation is a useful starting point.",
  },
  {
    q: "Can a parent book on behalf of a player?",
    a: "Yes. Parents are welcome to book. For players under 18, a parent or guardian's contact details and consent are required during booking.",
  },
  {
    q: "What should I prepare?",
    a: "Think about your current situation, the questions you want to ask and what you're hoping to understand. The booking form lets you share your playing history and, if you have one, a link to your highlight video.",
  },
  {
    q: "How do booking and payment work?",
    a: "Choose a consultation, share your details and select an available date and time. Your slot is held temporarily while you pay through PayFast. The booking is confirmed after payment has been verified.",
  },
];

function ServicesPage() {
  const query = useQuery(servicesQuery);
  const services = query.data ?? [];
  const featured = services.find((service) => service.slug === "general-football-consultation");
  const otherServices = services.filter((service) => service.id !== featured?.id);

  return (
    <div className="services-page">
      <section className="services-hero relative isolate overflow-hidden bg-ink text-ink-foreground">
        <div className="container-page grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[1.4fr_0.8fr] lg:gap-16 lg:py-24">
          <div>
            <p className="eyebrow flex items-center gap-3 text-gold">
              <span className="h-px w-8 bg-gold" aria-hidden />
              The consultations
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Your next chapter.
              <br />A <span className="text-gold">clearer game plan.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-foreground/70">
              Big ambitions. Difficult decisions. Questions about what comes next. Find the right
              conversation to move your football career forward.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="inverse" size="lg" className="booking-button">
                <a href="#consultations">
                  Find your consultation
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </a>
              </Button>
              <Link
                to="/contact"
                className="booking-button inline-flex min-h-12 items-center justify-center gap-3 px-4 text-sm font-semibold hover:text-gold"
              >
                Ask a question
                <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="relative isolate overflow-hidden border border-gold/25 bg-white/[0.025] p-7 sm:p-9">
            <PitchLines className="absolute -right-14 -top-16 -z-10 h-[460px] w-[380px] rotate-12 text-gold/15" />
            <div className="flex items-end justify-between gap-5 border-b border-gold/25 pb-6">
              <span className="font-display text-6xl font-semibold tracking-tight text-gold">
                1:1
              </span>
              <p className="max-w-32 text-right text-xs leading-relaxed text-ink-foreground/65">
                Your career.
                <br />
                Our full attention.
              </p>
            </div>
            <p className="mt-6 text-[10px] uppercase tracking-[0.16em] text-ink-foreground/50">
              A conversation with Kieraan
            </p>
            <ol className="mt-5 space-y-5">
              {["Where you are.", "What's possible.", "What comes next."].map((text, i) => (
                <li key={text} className="flex items-center gap-4">
                  <span className="font-display text-[10px] text-gold" aria-hidden>
                    0{i + 1}
                  </span>
                  <span className="font-display text-lg font-semibold">{text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="border-t border-gold/20">
          <div className="container-page flex flex-wrap gap-x-8 gap-y-3 py-5 text-xs text-ink-foreground/65">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-gold" aria-hidden />
              One-to-one with Kieraan
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden />
              Independent advice
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-gold" aria-hidden />
              Book a time that suits you
            </span>
          </div>
        </div>
      </section>

      <section
        id="consultations"
        className="home-section scroll-mt-16 bg-secondary"
        aria-labelledby="consultations-title"
      >
        <div className="container-page">
          <Reveal>
            <p className="eyebrow home-eyebrow">Choose your conversation</p>
            <div className="mt-4 grid gap-5 md:grid-cols-[1.4fr_1fr] md:items-end md:gap-16">
              <h2 id="consultations-title" className="home-heading">
                Different moments.
                <br />
                <span className="gold-text">The right guidance.</span>
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Start with the question that matters most to you. Each session is a focused
                conversation about your football career. All prices are in South African Rand.
              </p>
            </div>
          </Reveal>
          {services.length > 0 && (
            <nav
              className="mt-8 flex flex-wrap gap-2"
              aria-label="Find a consultation by situation"
            >
              {services.map((service) => (
                <a
                  key={service.id}
                  href={`#consultation-${service.id}`}
                  className="consultation-shortcut inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/25 bg-background px-4 py-2 text-xs font-medium leading-relaxed hover:border-gold hover:bg-gold/10"
                >
                  {serviceGuidance[service.slug]?.situation ?? service.name}
                  <ArrowDown className="h-3 w-3 shrink-0 text-[#806022]" aria-hidden />
                </a>
              ))}
            </nav>
          )}
          {query.isLoading && (
            <div className="mt-10" role="status" aria-label="Loading consultations">
              <span className="sr-only">Loading consultations…</span>
              <Skeleton className="h-96 motion-reduce:animate-none" />
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Skeleton className="h-96 motion-reduce:animate-none" />
                <Skeleton className="h-96 motion-reduce:animate-none" />
              </div>
            </div>
          )}
          {query.isError && services.length === 0 && (
            <div
              role="alert"
              className="mt-10 rounded-md border border-gold/25 bg-background p-8 sm:p-12"
            >
              <h3 className="text-xl font-bold">We couldn't load the consultations.</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Please try again, or get in touch and we'll help you find the right session.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-5">
                <Button onClick={() => query.refetch()} disabled={query.isFetching}>
                  {query.isFetching ? "Trying again…" : "Try again"}
                </Button>
                <Link
                  to="/contact"
                  className="text-sm font-semibold underline decoration-gold underline-offset-4"
                >
                  Contact KMGMT
                </Link>
              </div>
            </div>
          )}
          {query.isSuccess && services.length === 0 && (
            <div
              role="status"
              className="mt-10 rounded-md border border-gold/25 bg-background p-8 sm:p-12"
            >
              <h3 className="text-xl font-bold">New conversations are on the way.</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Consultations aren't available to book just yet. Get in touch to discuss what you're
                looking for.
              </p>
              <Button asChild className="booking-button mt-6">
                <Link to="/contact">
                  Get in touch
                  <ArrowRight className="cta-arrow" aria-hidden />
                </Link>
              </Button>
            </div>
          )}
          {featured && (
            <Reveal className="mt-10">
              <ConsultationOffering service={featured} featured number={1} />
            </Reveal>
          )}
          {otherServices.length > 0 && (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {otherServices.map((service, i) => (
                <Reveal key={service.id} delay={(i % 2) * 70}>
                  <ConsultationOffering service={service} number={i + (featured ? 2 : 1)} />
                </Reveal>
              ))}
            </div>
          )}
          {services.length > 0 && (
            <div className="mt-9">
              <BookingAssurances />
            </div>
          )}
        </div>
      </section>

      <section className="home-section border-y border-gold/20 bg-background">
        <div className="container-page">
          <Reveal>
            <p className="eyebrow home-eyebrow">More than a conversation</p>
            <h2 className="home-heading mt-4">
              A little perspective.
              <br />
              <span className="gold-text">A lot more direction.</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {EXPECTATIONS.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 70} className="border-t border-gold/30 pt-6">
                <Icon className="h-6 w-6 text-[#806022]" strokeWidth={1.25} aria-hidden />
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-10 border-l border-gold pl-4 text-xs leading-relaxed text-muted-foreground">
            Guidance you can trust starts with realistic expectations. Consultations do not
            guarantee trials, contracts or club placements.
          </p>
        </div>
      </section>

      <section className="home-section bg-secondary">
        <div className="container-page grid gap-10 md:grid-cols-[1fr_1.5fr] md:gap-16">
          <Reveal>
            <p className="eyebrow home-eyebrow">A few things to know</p>
            <h2 className="home-heading mt-4">
              Come with questions.
              <br />
              <span className="gold-text">Start with confidence.</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              You don't need all the answers before you book. That's what the conversation is for.
            </p>
          </Reveal>
          <Reveal>
            <Accordion type="single" collapsible className="home-faq border-t border-gold/20">
              {FAQS.map((faq, i) => (
                <AccordionItem key={faq.q} value={`service-faq-${i}`} className="border-gold/20">
                  <AccordionTrigger className="gap-5 py-6 text-left text-base font-semibold leading-relaxed hover:text-[#806022] hover:no-underline">
                    <span className="flex items-baseline gap-4">
                      <span className="text-xs text-[#806022]/65" aria-hidden>
                        0{i + 1}
                      </span>
                      <span>{faq.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pl-8 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      <section className="home-final-cta home-section relative isolate overflow-hidden bg-ink text-ink-foreground">
        <PitchLines className="absolute -right-40 -top-48 -z-10 h-[650px] w-[540px] rotate-12 text-gold/10" />
        <Reveal className="container-page grid items-center gap-8 md:grid-cols-[1.5fr_1fr] md:gap-16">
          <div>
            <p className="eyebrow text-gold">You don't have to figure it out alone</p>
            <h2 className="home-heading mt-4">
              Let's find your
              <br />
              <span className="text-gold">next step.</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink-foreground/65">
              Whether you're a player weighing your options or a parent looking for clarity, the
              right conversation is a good place to start.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <Button asChild variant="inverse" size="lg" className="booking-button w-full sm:w-auto">
              <Link to="/book" search={featured ? { service: featured.slug } : {}}>
                Book a Consultation
                <ArrowRight className="cta-arrow" aria-hidden />
              </Link>
            </Button>
            <Link
              to="/contact"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-foreground/65 hover:text-gold"
            >
              Have a question first? Get in touch
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
