import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Globe2,
  LockKeyhole,
  Scale,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceCard } from "@/components/common/ServiceCard";
import {
  BookingAssurances,
  MobileBookingCTA,
  PitchLines,
  PlayerCollection,
  Reveal,
  RouteMap,
} from "@/components/home/HomeDetails";
import { playersQuery, servicesQuery, testimonialsQuery } from "@/features/public/queries";
import { TestimonialSlider } from "@/components/home/TestimonialSlider";
import { consultant } from "@/content/site";
import hero from "@/assets/hero.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KMGMT | Professional Guidance for Your Football Career" },
      {
        name: "description",
        content:
          "Book a football career consultation with KMGMT. Player assessments, career decisions and international pathway guidance for South African players and parents.",
      },
      { property: "og:title", content: "KMGMT | Professional Guidance for Your Football Career" },
      {
        property: "og:description",
        content:
          "Football career consultations, player assessments and international pathway guidance.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  { title: "Choose a consultation", text: "Pick the conversation that fits your next step." },
  { title: "Tell us your story", text: "Share your level, your situation and your goals." },
  { title: "Find your time", text: "Choose from available dates and times." },
  {
    title: "Complete secure payment",
    text: "Pay through PayFast while your slot is held.",
    icon: LockKeyhole,
  },
  {
    title: "Receive confirmation",
    text: "View your booking reference and details once payment is verified.",
    icon: CheckCircle2,
  },
  { title: "Plan your next move", text: "Meet with Kieraan for honest, practical guidance." },
];
const ADVANTAGES = [
  {
    icon: ShieldCheck,
    title: "Independent guidance",
    text: "Your interests come first. Advice built around the player, not an agenda.",
  },
  {
    icon: Scale,
    title: "Personal career assessment",
    text: "An honest look at where you are and what your options really mean.",
  },
  {
    icon: Compass,
    title: "Clear next steps",
    text: "Leave with direction. Practical guidance you can put into action.",
  },
];
const AUDIENCES = [
  {
    icon: Users,
    title: "Parents",
    text: "Understand the football landscape, protect your child's interests and make informed decisions together.",
  },
  {
    icon: TrendingUp,
    title: "Youth & academy players",
    text: "Navigate academy pathways, trials and the jump to senior football with a clear head.",
  },
  {
    icon: Globe2,
    title: "Senior players",
    text: "Evaluate offers, contract stages and career moves, locally or internationally.",
  },
];
const FAQS = [
  {
    q: "Do you guarantee trials, contracts or club placements?",
    a: "No. KMGMT provides independent career guidance. We help you understand your options realistically and never promise trials, contracts or placements.",
  },
  {
    q: "Which consultation should I book?",
    a: "If you're unsure, start with the General Football Consultation. It's the best way to understand your situation and decide on next steps.",
  },
  {
    q: "Are consultations online?",
    a: "Consultation details are confirmed with your booking. Reach out via the contact page if you have a specific preference.",
  },
  {
    q: "Can a parent book for their child?",
    a: "Yes. For players under 18, a parent or guardian's details and consent are required as part of the booking.",
  },
  {
    q: "How does payment work?",
    a: "Payment is handled securely by PayFast. Your booking is confirmed only once the payment has been verified.",
  },
];

function Home() {
  const services = useQuery(servicesQuery);
  const players = useQuery(playersQuery());
  const testimonials = useQuery(testimonialsQuery);
  const credentials = [
    ["Qualifications", consultant.qualifications],
    ["FIFA licensing", consultant.fifaLicensing],
    ["Agency", consultant.agencyAffiliation],
    ["Experience", consultant.yearsExperience],
    ["Based in", consultant.location],
  ].filter(([, value]) => value);
  const quotes = testimonials.data ?? [];

  return (
    <div className="homepage">
      <section
        id="home-hero"
        className="home-hero relative isolate -mt-16 overflow-hidden bg-ink text-ink-foreground"
      >
        <img
          src={hero}
          alt=""
          aria-hidden
          className="hero-image absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center]"
          width={1672}
          height={941}
          fetchPriority="high"
        />
        <div className="hero-shade absolute inset-0 -z-10" />
        <div className="hero-glow pointer-events-none absolute inset-0 -z-10" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-linear-to-t from-ink to-transparent" />
        <div className="container-page flex min-h-[max(640px,100svh)] items-center pb-20 pt-32">
          <div className="max-w-3xl">
            <p className="hero-enter eyebrow text-gold">KMGMT · Football Career Consultancy</p>
            <h1 className="hero-enter hero-heading mt-6 max-w-187.5 font-extrabold leading-[1.02] tracking-tight">
              Professional guidance for your{" "}
              <span className="text-gold sm:whitespace-nowrap">football career.</span>
            </h1>
            <span className="gold-rule hero-rule mt-8" />
            <p className="hero-enter hero-copy mt-6 max-w-lg text-base leading-relaxed text-ink-foreground/80 sm:text-lg">
              Helping football players understand their current position, evaluate their options and
              plan the next stage of their career.
            </p>
            <div className="hero-enter hero-actions mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="inverse" className="booking-button">
                <Link to="/book">
                  Book a Consultation
                  <ArrowRight className="cta-arrow" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="border border-ink-foreground/30 text-ink-foreground hover:border-gold hover:bg-transparent hover:text-gold"
              >
                <Link to="/services">Explore Services</Link>
              </Button>
            </div>
            <p className="hero-enter hero-actions mt-5 flex items-center gap-2 text-xs text-ink-foreground/60">
              <LockKeyhole className="h-3 w-3 text-gold" aria-hidden />
              Secure online booking through PayFast
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-6 hidden sm:block">
          <div className="container-page flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-ink-foreground/45">
            <span>Independent advice. Informed decisions.</span>
            <a href="#meet-kieraan" className="hover:text-gold">
              Discover KMGMT ↓
            </a>
          </div>
        </div>
      </section>

      <section className="home-trust border-b border-gold/20 bg-[#F7F4EF]">
        <div className="container-page grid py-5 md:grid-cols-3 md:py-10">
          {ADVANTAGES.map(({ icon: Icon, title, text }, i) => (
            <Reveal
              key={title}
              delay={i * 70}
              className="flex gap-4 border-b border-gold/20 py-6 last:border-0 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:pr-0"
            >
              <Icon className="mt-1 h-7 w-7 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
              <div>
                <h2 className="text-lg font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="meet-kieraan" className="home-section scroll-mt-20 bg-background">
        <div className="container-page grid items-center gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <Reveal>
            <div className="consultant-frame relative mx-auto max-w-md">
              <div className="relative isolate aspect-4/5 overflow-hidden bg-ink text-ink-foreground">
                {consultant.portrait ? (
                  <img
                    src={consultant.portrait}
                    alt={`${consultant.name}, ${consultant.title}`}
                    className="absolute inset-0 h-full w-full object-cover grayscale"
                    loading="lazy"
                    width={600}
                    height={750}
                  />
                ) : (
                  <>
                    <PitchLines className="absolute inset-0 h-full w-full text-gold/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(180,140,60,0.12),transparent_65%)]" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pb-12">
                      <span className="wordmark text-4xl text-ink-foreground/80">KMGMT</span>
                      <span className="mt-5 text-[10px] uppercase tracking-[0.25em] text-gold">
                        The player comes first
                      </span>
                    </div>
                  </>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink via-ink/90 to-transparent px-8 pb-8 pt-20">
                  <p className="font-display text-3xl font-bold">{consultant.name}</p>
                  <p className="mt-2 max-w-48 text-xs leading-relaxed text-ink-foreground/65">
                    {consultant.title}
                  </p>
                </div>
                <span
                  className="absolute right-5 top-5 h-8 w-8 border-r border-t border-gold/60"
                  aria-hidden
                />
              </div>
              <p className="mt-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-px w-8 bg-gold" />A personal approach to your career
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p className="eyebrow home-eyebrow">The person in your corner</p>
            <h2 className="home-heading mt-4">
              Meet <span className="gold-text">{consultant.name}.</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
              {consultant.bio}
            </p>
            <blockquote className="mt-8 border-l border-gold pl-6 font-display text-xl font-semibold leading-relaxed">
              “{consultant.quote}”
            </blockquote>
            {credentials.length > 0 && (
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-gold/20 py-6">
                {credentials.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-2 text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <Link
              to="/about"
              className="booking-button mt-8 inline-flex items-center gap-3 text-sm font-semibold hover:text-[#806022]"
            >
              More about {consultant.name}
              <ArrowRight className="cta-arrow h-4 w-4 text-gold" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="home-section relative isolate overflow-hidden bg-ink text-ink-foreground">
        <span
          className="outline-number pointer-events-none absolute -right-4 -top-14 -z-10"
          aria-hidden
        >
          03
        </span>
        <div className="container-page">
          <Reveal>
            <p className="eyebrow text-gold">Who we guide</p>
            <h2 className="home-heading mt-4 max-w-2xl">
              Guidance for every <span className="text-gold">stage of the game.</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
            {AUDIENCES.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 80} className="border-t border-gold/25 pt-7">
                <div className="flex items-center justify-between">
                  <Icon className="h-7 w-7 text-gold" strokeWidth={1.25} aria-hidden />
                  <span className="font-display text-xs text-ink-foreground/35">0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold">{title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-ink-foreground/65">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section relative isolate overflow-hidden bg-secondary">
        <PitchLines className="absolute -right-40 -top-64 -z-10 h-150 w-125 rotate-90 text-gold/15" />
        <div className="container-page">
          <Reveal>
            <p className="eyebrow home-eyebrow">The right conversation changes things</p>
            <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <h2 className="home-heading max-w-xl">
                Invest in your <span className="gold-text">next step.</span>
              </h2>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Not sure where to begin? Start with the General Football Consultation.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.isLoading &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
            {services.data?.map((service, i) => (
              <Reveal key={service.id} delay={(i % 3) * 70}>
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </div>
          {services.isError && (
            <div
              role="status"
              className="mt-6 rounded-md border border-gold/20 bg-background p-8 text-center"
            >
              <p>Consultations couldn't load. Please try again.</p>
              <Button variant="outline" className="mt-4" onClick={() => services.refetch()}>
                Try again
              </Button>
            </div>
          )}
          {services.isSuccess && services.data.length === 0 && (
            <p className="mt-6 text-muted-foreground">
              Consultations will be available soon.{" "}
              <Link to="/contact" className="underline decoration-gold underline-offset-4">
                Get in touch
              </Link>{" "}
              for guidance.
            </p>
          )}
          <div className="mt-9">
            <BookingAssurances />
          </div>
        </div>
      </section>

      <section className="home-section border-t border-gold/20 bg-background">
        <div className="container-page">
          <Reveal>
            <p className="eyebrow home-eyebrow">From a question to a plan</p>
            <h2 className="home-heading mt-4">
              A clear path. <span className="gold-text">Every step.</span>
            </h2>
            <p className="mt-5 text-muted-foreground">
              A few minutes to book. A focused conversation to move forward.
            </p>
          </Reveal>
          <ol className="booking-journey mt-12 grid gap-y-9 md:grid-cols-3 md:gap-x-8 lg:grid-cols-6 lg:gap-x-5">
            {STEPS.map(({ title, text, icon: Icon }, i) => (
              <li key={title} className="journey-step relative">
                <div className="journey-marker relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-background font-display text-sm font-semibold text-[#806022]">
                  {`0${i + 1}`}
                  {Icon && (
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-1">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  )}
                </div>
                <div className="journey-copy">
                  <h3 className="mt-5 text-base font-bold leading-snug">{title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-section relative isolate overflow-hidden bg-ink text-ink-foreground">
        <RouteMap />
        <div className="container-page relative">
          <Reveal className="max-w-xl">
            <p className="eyebrow flex items-center gap-3 text-gold">
              <Globe2 className="h-4 w-4" aria-hidden />
              Beyond borders
            </p>
            <h2 className="home-heading mt-5">
              Your ambition.
              <br />
              <span className="text-gold">A wider world.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-foreground/70">
              Thinking about football outside South Africa? Understand the markets, what clubs look
              for and how to prepare for an international pathway.
            </p>
            <p className="mt-6 max-w-sm text-[10px] uppercase leading-loose tracking-[0.14em] text-gold">
              International opportunities · Club pathways · Career planning
            </p>
            <Button asChild variant="inverse" size="lg" className="booking-button mt-8">
              <Link to="/international-pathways">
                Explore International Pathways
                <ArrowRight className="cta-arrow" aria-hidden />
              </Link>
            </Button>
            <p className="mt-4 text-xs text-ink-foreground/45">
              Honest guidance. No promises of placements.
            </p>
          </Reveal>
        </div>
      </section>

      {(players.data?.length ?? 0) > 0 && (
        <section className="home-section bg-background">
          <div className="container-page">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="eyebrow home-eyebrow">Represented players</p>
                  <h2 className="home-heading mt-4">
                    The players. <span className="gold-text">Their journeys.</span>
                  </h2>
                </div>
                <Link
                  to="/players"
                  className="booking-button inline-flex items-center gap-3 text-sm font-semibold"
                >
                  View all players
                  <ArrowRight className="cta-arrow h-4 w-4 text-gold" aria-hidden />
                </Link>
              </div>
              <div className="mt-10">
                <PlayerCollection players={players.data!} />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {quotes.length > 0 && (
        <section className="home-section border-y border-gold/20 bg-secondary">
          <div className="container-page">
            <Reveal>
              <p className="eyebrow home-eyebrow">First-hand perspectives</p>
              <h2 className="home-heading mt-4">
                Trust, in <span className="gold-text">their words.</span>
              </h2>
              <TestimonialSlider quotes={quotes} />
            </Reveal>
          </div>
        </section>
      )}

      <section className="home-section bg-background">
        <div className="container-page grid gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <Reveal>
            <p className="eyebrow home-eyebrow">Before you book</p>
            <h2 className="home-heading mt-4">
              Good questions.
              <br />
              <span className="gold-text">Straight answers.</span>
            </h2>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Still have something on your mind? We're here to help you take the next step with
              confidence.
            </p>
            <Link
              to="/contact"
              className="booking-button mt-6 inline-flex items-center gap-3 text-sm font-semibold"
            >
              Get in touch
              <ArrowRight className="cta-arrow h-4 w-4 text-gold" aria-hidden />
            </Link>
          </Reveal>
          <Reveal>
            <Accordion
              type="single"
              collapsible
              className="home-faq w-full border-t border-gold/20"
            >
              {FAQS.map((faq, i) => (
                <AccordionItem key={faq.q} value={`f${i}`} className="border-gold/20">
                  <AccordionTrigger className="gap-5 py-7 text-left text-base font-semibold leading-relaxed hover:text-[#806022] hover:no-underline">
                    <span className="flex items-baseline gap-4">
                      <span className="font-display text-xs text-[#806022]/65" aria-hidden>
                        0{i + 1}
                      </span>
                      <span>{faq.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-7 pl-8 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      <section className="home-final-cta home-section relative isolate overflow-hidden bg-ink text-ink-foreground">
        <PitchLines className="absolute -right-40 -top-40 -z-10 h-175 w-145 -rotate-12 text-gold/10" />
        <Reveal className="container-page text-center">
          <p className="eyebrow text-gold">Your career deserves a clear plan</p>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.12] tracking-tight md:text-6xl">
            Your next move starts with <span className="text-gold">the right conversation.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-ink-foreground/65">
            Bring your questions. Get an honest perspective. Take the next step in your football
            career with Kieraan.
          </p>
          <Button asChild size="lg" variant="inverse" className="booking-button mt-9">
            <Link to="/book">
              Book a Consultation
              <ArrowRight className="cta-arrow" aria-hidden />
            </Link>
          </Button>
          <div className="mt-8">
            <BookingAssurances dark />
          </div>
        </Reveal>
      </section>
      <MobileBookingCTA />
    </div>
  );
}
