import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Compass, Quote, Target, Users } from "lucide-react";
import { BookingAssurances, PitchLines, Reveal } from "@/components/home/HomeDetails";
import { Button } from "@/components/ui/button";
import { aboutPage, consultant } from "@/content/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Kieraan | KMGMT" },
      {
        name: "description",
        content:
          "Meet Kieraan, the independent football career consultant behind KMGMT. Personal, honest guidance for players and parents planning their next step.",
      },
      { property: "og:title", content: "About Kieraan | KMGMT" },
      {
        property: "og:description",
        content: "The person behind the guidance. Meet Kieraan and the approach behind KMGMT.",
      },
    ],
  }),
  component: About,
});

const PRINCIPLE_ICONS = [Users, Compass, Target] as const;

function ConsultantPortrait() {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <figure className="consultant-frame relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="relative isolate flex aspect-[4/5] min-h-[420px] flex-col justify-between overflow-hidden bg-ink p-7 text-ink-foreground sm:min-h-0 sm:p-9">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_20%,rgba(180,140,60,0.12),transparent_65%)]" />
        <PitchLines className="absolute -right-12 -top-16 -z-10 h-[115%] w-[115%] rotate-12 text-gold/20" />
        {consultant.portrait && !imageFailed ? (
          <img
            src={consultant.portrait}
            alt={`${consultant.name}, ${consultant.title}`}
            width={640}
            height={800}
            fetchPriority="high"
            className="absolute inset-0 -z-10 h-full w-full object-cover grayscale"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <>
            <p className="eyebrow text-[9px] tracking-[0.2em] text-gold">
              Independent football guidance
            </p>
            <div className="relative my-8">
              <span className="about-monogram absolute -top-20 right-0" aria-hidden>
                K
              </span>
              <p className="relative text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                The player.
                <br />
                The person.
                <br />
                <span className="text-gold">The next step.</span>
              </p>
              <div className="mt-7 h-px w-14 bg-gold/65" aria-hidden />
            </div>
          </>
        )}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
        <figcaption className="mt-auto border-t border-gold/30 pt-5">
          <p className="text-2xl font-semibold tracking-tight">{consultant.name}</p>
          <p className="mt-2 max-w-[15rem] text-xs leading-relaxed text-ink-foreground/70">
            {consultant.title}
          </p>
        </figcaption>
      </div>
      <p className="mt-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-px w-7 shrink-0 bg-gold/60" aria-hidden />A personal approach to your
        career
      </p>
    </figure>
  );
}

function About() {
  const facts = [
    ["Qualifications", consultant.qualifications],
    ["FIFA licensing", consultant.fifaLicensing],
    ["Agency affiliation", consultant.agencyAffiliation],
    ["Experience", consultant.yearsExperience],
    ["Location", consultant.location],
  ].filter(([, value]) => value);

  return (
    <div className="about-page">
      <section className="overflow-hidden border-b border-gold/20 bg-secondary">
        <div className="container-page grid items-center gap-14 py-16 md:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:py-24">
          <Reveal>
            <p className="eyebrow home-eyebrow flex items-center gap-3">
              <span className="h-px w-8 bg-gold" aria-hidden />
              The person behind KMGMT
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Meet {consultant.name}.
              <br />
              <span className="gold-text">See your next move.</span>
            </h1>
            <p className="mt-6 text-sm font-semibold">{consultant.title}</p>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
              {consultant.bio}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="booking-button hover:bg-gold hover:text-ink">
                <Link to="/book">
                  Book a Consultation
                  <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <a
                href="#the-approach"
                className="booking-button inline-flex min-h-12 items-center justify-center gap-3 px-3 text-sm font-semibold text-muted-foreground hover:text-[#806022]"
              >
                The KMGMT approach
                <ArrowDown className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              One-on-one consultations for players and parents.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <ConsultantPortrait key={consultant.portrait} />
          </Reveal>
          {facts.length > 0 && (
            <div className="border-t border-gold/25 pt-8 lg:col-span-2">
              <p className="eyebrow home-eyebrow">Background &amp; credentials</p>
              <dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map(([label, value]) => (
                  <div key={label} className="min-w-0 border-l border-gold/40 pl-4">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-2 break-words text-sm font-semibold leading-relaxed">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>

      <section
        className="relative isolate overflow-hidden bg-ink py-14 text-ink-foreground md:py-20"
        aria-label="Kieraan's philosophy"
      >
        <Quote
          className="pointer-events-none absolute -left-5 top-4 -z-10 h-48 w-48 text-gold/[0.08] md:left-12 md:h-64 md:w-64"
          strokeWidth={0.7}
          aria-hidden
        />
        <Reveal className="container-page grid gap-8 md:grid-cols-[0.55fr_1.45fr] md:gap-12">
          <div>
            <p className="eyebrow text-gold">A word from Kieraan</p>
            <p className="mt-4 max-w-[12rem] text-sm leading-6 text-ink-foreground/60">
              The thinking behind every conversation.
            </p>
          </div>
          <figure>
            <blockquote className="max-w-3xl text-2xl font-medium leading-[1.45] tracking-tight sm:text-3xl lg:text-4xl">
              &ldquo;{consultant.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 text-xs text-ink-foreground/65">
              <span className="h-px w-8 bg-gold/70" aria-hidden />
              {consultant.name}, KMGMT
            </figcaption>
          </figure>
        </Reveal>
      </section>

      <section
        id="the-approach"
        className="home-section scroll-mt-16 bg-background"
        aria-labelledby="approach-title"
      >
        <div className="container-page">
          <Reveal className="grid gap-5 md:grid-cols-2 md:items-end md:gap-12">
            <div>
              <p className="eyebrow home-eyebrow">The KMGMT approach</p>
              <h2 id="approach-title" className="home-heading mt-4">
                Your ambition.
                <br />
                <span className="gold-text">Grounded in reality.</span>
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-muted-foreground md:justify-self-end">
              Football decisions can feel complicated. A focused conversation gives you space to
              look at the bigger picture, ask questions and understand your options.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
            {aboutPage.principles.map((principle, index) => {
              const Icon = PRINCIPLE_ICONS[index % PRINCIPLE_ICONS.length] ?? Users;
              return (
                <Reveal key={principle.title} delay={index * 90}>
                  <div className="flex items-center justify-between border-t border-gold/30 pt-6">
                    <Icon className="h-7 w-7 text-[#806022]" strokeWidth={1.2} aria-hidden />
                    <span className="text-xs tabular-nums text-muted-foreground" aria-hidden>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">{principle.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{principle.text}</p>
                </Reveal>
              );
            })}
          </div>
          <Reveal className="mt-12 border-t border-gold/20 pt-7">
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              <span className="font-semibold text-foreground">
                Independent guidance, clear expectations.
              </span>{" "}
              KMGMT helps you understand your options and prepare for your next step. Consultations
              do not promise trials, contracts or club placements.
            </p>
          </Reveal>
        </div>
      </section>

      <section
        className="home-section border-t border-gold/20 bg-secondary"
        aria-labelledby="conversation-title"
      >
        <div className="container-page">
          <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow home-eyebrow">From conversation to direction</p>
              <h2 id="conversation-title" className="home-heading mt-4">
                A session built
                <br />
                <span className="gold-text">around you.</span>
              </h2>
            </div>
            <Link
              to="/services"
              className="booking-button inline-flex min-h-12 items-center gap-3 self-start text-sm font-semibold hover:text-[#806022] md:self-auto"
            >
              Explore the consultations
              <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
          <ol className="about-conversation mt-12 grid gap-9 md:grid-cols-3 md:gap-8">
            {aboutPage.conversation.map((step, index) => (
              <li key={step.title} className="relative min-w-0">
                <Reveal delay={index * 90}>
                  <span
                    className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-gold/45 bg-secondary text-xs font-semibold tabular-nums text-[#806022]"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{step.text}</p>
                  <p className="mt-5 border-t border-gold/20 pt-4 text-xs leading-6 text-[#806022]">
                    {step.detail}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="home-final-cta home-section relative isolate overflow-hidden bg-ink text-ink-foreground"
        aria-labelledby="about-cta-title"
      >
        <PitchLines className="absolute -right-40 -top-28 -z-10 h-[650px] w-[540px] rotate-12 text-gold/[0.08]" />
        <div className="container-page">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="eyebrow text-gold">Your next chapter</p>
            <h2 id="about-cta-title" className="home-heading mt-5">
              You bring the ambition.
              <br />
              <span className="text-gold">Let's find the direction.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-ink-foreground/65">
              Wherever you are in your football journey, start with a conversation about what comes
              next.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                variant="inverse"
                className="booking-button w-full sm:w-auto"
              >
                <Link to="/book">
                  Book a Consultation
                  <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Link
                to="/contact"
                className="booking-button inline-flex min-h-12 items-center gap-3 px-3 text-sm font-semibold text-ink-foreground/75 hover:text-gold"
              >
                Have a question?
                <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-9 border-t border-gold/20 pt-7">
              <BookingAssurances dark />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
