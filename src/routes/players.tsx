import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDown, ArrowRight, Compass, Search, ShieldCheck, Shirt, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PitchLines, Reveal } from "@/components/home/HomeDetails";
import { PlayerProfileCard } from "@/components/players/PlayerProfileCard";
import { playersPage } from "@/content/site";
import { playersQuery } from "@/features/public/queries";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Represented Players | KMGMT" },
      {
        name: "description",
        content:
          "Meet the players KMGMT works with. Explore player profiles, playing backgrounds and the people behind each football journey.",
      },
      { property: "og:title", content: "Represented Players | KMGMT" },
      {
        property: "og:description",
        content:
          "Individual talent. Shared ambition. Meet the players behind the journeys at KMGMT.",
      },
    ],
  }),
  component: Players,
});

const APPROACH_ICONS = [Users, ShieldCheck, Compass] as const;

function Players() {
  const query = useQuery(playersQuery());
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const players = query.data ?? [];
  const positions = [
    ...new Set(
      players.map((player) => player.position?.trim()).filter((value): value is string => !!value),
    ),
  ].sort();
  const term = search.trim().toLocaleLowerCase();
  const filtered = players.filter(
    (player) =>
      (!position || player.position?.trim() === position) &&
      (!term ||
        [player.name, player.position, player.current_club, player.nationality].some((value) =>
          value?.toLocaleLowerCase().includes(term),
        )),
  );
  const clear = () => {
    setSearch("");
    setPosition("");
  };

  return (
    <div className="players-page">
      <section className="players-hero relative isolate overflow-hidden bg-ink text-ink-foreground">
        <div className="container-page grid items-center gap-10 py-16 md:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:py-24">
          <div>
            <p className="eyebrow flex items-center gap-3 text-gold">
              <span className="h-px w-8 bg-gold" aria-hidden />
              The players
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Individual talent.
              <br />
              <span className="text-gold">Shared ambition.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-foreground/70">
              Behind every player is a story, a goal and a next chapter. Meet the people behind the
              football journeys at KMGMT.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="inverse" size="lg" className="booking-button">
                <a href="#player-roster">
                  Meet the players
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </a>
              </Button>
              <Link
                to="/about"
                className="booking-button inline-flex min-h-12 items-center justify-center gap-3 px-3 text-sm font-semibold text-ink-foreground/75 hover:text-gold"
              >
                Meet Kieraan
                <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="relative isolate mx-auto flex aspect-4/3 w-full max-w-md flex-col justify-between overflow-hidden border border-gold/25 bg-white/1.5 p-7 sm:p-9">
            <PitchLines className="absolute -inset-y-10 inset-x-0 -z-10 h-[calc(100%+5rem)] w-full text-gold/20" />
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-ink-foreground/55">
              <span>The KMGMT approach</span>
              <Shirt className="h-4 w-4 text-gold" strokeWidth={1.2} aria-hidden />
            </div>
            <p className="my-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              PLAYER
              <br />
              <span className="players-outline-text">FIRST.</span>
            </p>
            <p className="border-t border-gold/30 pt-4 text-[9px] uppercase tracking-[0.14em] text-gold/80">
              The person. The potential. The plan.
            </p>
          </div>
        </div>
      </section>

      <section
        id="player-roster"
        className="home-section scroll-mt-16 bg-secondary"
        aria-labelledby="roster-title"
      >
        <div className="container-page">
          <Reveal>
            <p className="eyebrow home-eyebrow">Represented players</p>
            <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <h2 id="roster-title" className="home-heading">
                The names.
                <br />
                <span className="gold-text">The journeys.</span>
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Explore each player's position, club and playing background. Every journey has its
                own starting point.
              </p>
            </div>
          </Reveal>
          {players.length > 0 && (
            <div className="mt-9 border-y border-gold/20 py-5">
              <div className="grid items-end gap-4 sm:grid-cols-[1fr_0.7fr] lg:grid-cols-[1fr_0.65fr_auto]">
                <label className="block text-xs font-semibold" htmlFor="player-search">
                  Find a player
                  <span className="relative mt-2 block">
                    <Search
                      className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="player-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Name, club or nationality"
                      className="h-11 bg-background pl-10 text-base"
                      aria-controls="roster-grid"
                    />
                  </span>
                </label>
                <div>
                  <label className="block text-xs font-semibold" htmlFor="player-position">
                    Playing position
                  </label>
                  <select
                    id="player-position"
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-base"
                    aria-controls="roster-grid"
                  >
                    <option value="">All positions</option>
                    {positions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <p
                  role="status"
                  aria-live="polite"
                  className="py-3 text-xs text-muted-foreground lg:pl-4"
                >
                  {filtered.length} {filtered.length === 1 ? "player" : "players"}
                  {search || position ? ` of ${players.length}` : ""}
                </p>
              </div>
            </div>
          )}
          {query.isLoading && (
            <div
              className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              role="status"
              aria-label="Loading player profiles"
            >
              <span className="sr-only">Loading player profiles…</span>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-4/5 motion-reduce:animate-none" />
              ))}
            </div>
          )}
          {query.isError && players.length === 0 && (
            <div
              role="alert"
              className="mt-10 rounded-md border border-gold/25 bg-background p-8 sm:p-12"
            >
              <h3 className="text-xl font-bold">Player profiles couldn't load.</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Please try again. You can also get in touch with KMGMT for player enquiries.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Button onClick={() => query.refetch()} disabled={query.isFetching}>
                  {query.isFetching ? "Trying again…" : "Try again"}
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Get in touch</Link>
                </Button>
              </div>
            </div>
          )}
          {query.isSuccess && players.length === 0 && (
            <Reveal className="mt-10">
              <div className="relative isolate overflow-hidden rounded-md border border-gold/25 bg-background p-8 sm:p-12">
                <PitchLines className="absolute -right-32 -top-24 -z-10 h-120 w-100 rotate-12 text-gold/15" />
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30">
                  <Shirt className="h-5 w-5 text-[#806022]" strokeWidth={1.2} aria-hidden />
                </span>
                <h3 className="mt-5 text-2xl font-bold sm:text-3xl">
                  Player profiles are on the way.
                </h3>
                <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
                  We're preparing this space to share the players and their football journeys. For
                  player enquiries, speak with KMGMT directly.
                </p>
                <Button asChild className="booking-button mt-6 hover:bg-gold hover:text-ink">
                  <Link to="/contact">
                    Contact KMGMT
                    <ArrowRight className="cta-arrow" aria-hidden />
                  </Link>
                </Button>
              </div>
            </Reveal>
          )}
          <div id="roster-grid" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((player) => (
              <Reveal key={player.id}>
                <PlayerProfileCard player={player} number={players.indexOf(player) + 1} />
              </Reveal>
            ))}
          </div>
          {players.length > 0 && filtered.length === 0 && (
            <div
              role="status"
              className="rounded-md border border-gold/20 bg-background p-8 text-center"
            >
              <h3 className="text-xl font-semibold">No players match this search.</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Try a different name or position, or explore the full roster.
              </p>
              <Button variant="outline" onClick={clear} className="mt-5">
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="home-section border-y border-gold/20 bg-background">
        <div className="container-page">
          <Reveal>
            <p className="eyebrow home-eyebrow">The player comes first</p>
            <h2 className="home-heading mt-4">
              More than a profile.
              <br />
              <span className="gold-text">A personal journey.</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {playersPage.approach.map((item, i) => {
              const Icon = APPROACH_ICONS[i] ?? Compass;
              return (
                <Reveal key={item.title} delay={i * 70} className="border-t border-gold/30 pt-6">
                  <Icon className="h-6 w-6 text-[#806022]" strokeWidth={1.3} aria-hidden />
                  <h3 className="mt-5 text-xl font-semibold leading-snug">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.text}</p>
                </Reveal>
              );
            })}
          </div>
          <Link
            to="/about"
            className="booking-button mt-8 inline-flex min-h-11 items-center gap-3 text-sm font-semibold hover:text-[#806022]"
          >
            Get to know Kieraan
            <ArrowRight className="cta-arrow h-4 w-4 text-gold" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="home-final-cta home-section relative isolate overflow-hidden bg-ink text-ink-foreground">
        <PitchLines className="absolute -right-44 -top-44 -z-10 h-160 w-135 -rotate-12 text-gold/10" />
        <Reveal className="container-page grid items-center gap-8 md:grid-cols-[1.4fr_1fr] md:gap-16">
          <div>
            <p className="eyebrow text-gold">Your own next chapter</p>
            <h2 className="home-heading mt-5">
              Your story.
              <br />
              <span className="text-gold">Your next move.</span>
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink-foreground/65">
              Looking for clarity in your football career? A consultation with Kieraan is a place to
              talk through your situation, your options and what comes next.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <Button asChild variant="inverse" size="lg" className="booking-button w-full sm:w-auto">
              <Link to="/book">
                Book a Consultation
                <ArrowRight className="cta-arrow" aria-hidden />
              </Link>
            </Button>
            <Link
              to="/contact"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-foreground/65 hover:text-gold"
            >
              For player enquiries, get in touch
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-ink-foreground/45 md:text-right">
              A consultation provides career guidance. It does not guarantee representation or club
              opportunities.
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
