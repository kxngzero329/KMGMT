import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerProfileCard } from "@/components/players/PlayerProfileCard";
import type { RepresentedPlayer } from "@/types/domain";
import { cn } from "@/lib/utils";

export { PitchLines } from "@/components/common/PitchLines";

/** Content stays visible without JS, IntersectionObserver, or when motion is reduced. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (
      !node ||
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    if (node.getBoundingClientRect().top < window.innerHeight) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.removeAttribute("data-reveal-pending");
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    node.setAttribute("data-reveal-pending", "true");
    observer.observe(node);
    return () => {
      observer.disconnect();
      node.removeAttribute("data-reveal-pending");
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function BookingAssurances({ dark = false }: { dark?: boolean }) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs ${dark ? "text-ink-foreground/65" : "text-muted-foreground"}`}
      aria-label="Booking reassurance"
    >
      {[
        { icon: LockKeyhole, text: "Secure PayFast payment" },
        { icon: CheckCircle2, text: "Clear booking confirmation" },
        { icon: CalendarDays, text: "Choose an available time" },
      ].map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-gold" aria-hidden />
          {text}
        </li>
      ))}
    </ul>
  );
}

export function RouteMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 520"
      fill="none"
      aria-hidden="true"
      className={cn(
        "route-map pointer-events-none absolute right-[-12%] top-1/2 w-[105%] min-w-[660px] -translate-y-1/2 text-gold md:right-[-5%] md:w-[75%]",
        className,
      )}
    >
      <g stroke="currentColor" opacity="0.12" strokeWidth="1">
        <ellipse cx="480" cy="260" rx="350" ry="205" />
        <ellipse cx="480" cy="260" rx="230" ry="205" />
        <ellipse cx="480" cy="260" rx="100" ry="205" />
        <path d="M130 260H830 M162 175H798 M162 345H798 M242 110H718 M242 410H718" />
        <path d="M222 149l54-38 70 9 22 35-30 19-5 47-31 9-23-35-44-13Z M327 247l49 19 29 51-21 48-32 29-8-63-25-35Z M455 160l31-30 54 8 17 33-40 16-24-9-29 18Z M452 206l53-14 50 36-3 62-33 78-33-30-12-54-31-42Z M542 135l62-31 96 17 54 57-47 21-56-20-15 60-30 15-39-65-32-19Z M681 332l51-21 49 21 5 32-50 14-45-19Z" />
      </g>
      <g stroke="currentColor" strokeWidth="1" opacity="0.35" strokeDasharray="4 7">
        <path d="M510 367Q350 170 481 154 M510 367Q553 115 682 175 M510 367Q414 76 286 164" />
      </g>
      {[
        [510, 367],
        [481, 154],
        [682, 175],
        [286, 164],
      ].map(([cx, cy]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r="12" stroke="currentColor" opacity="0.22" />
          <circle cx={cx} cy={cy} r="3" fill="currentColor" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

export function PlayerCollection({ players }: { players: RepresentedPlayer[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const carousel = players.length > 4;
  const move = (direction: number) => {
    const node = ref.current;
    if (!node) return;
    node.scrollBy({
      left: direction * node.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  return (
    <>
      {carousel && (
        <div className="mb-5 flex items-center justify-end gap-2">
          <span className="mr-3 text-xs text-muted-foreground">Explore the players</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => move(-1)}
            aria-label="Previous players"
            aria-controls="home-players"
          >
            <ArrowLeft aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => move(1)}
            aria-label="Next players"
            aria-controls="home-players"
          >
            <ArrowRight aria-hidden />
          </Button>
        </div>
      )}
      <div
        ref={ref}
        id="home-players"
        className={
          carousel
            ? "player-carousel grid auto-cols-[82%] grid-flow-col gap-6 overflow-x-auto pb-5 sm:auto-cols-[46%] lg:auto-cols-[calc((100%_-_3rem)/3)]"
            : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {players.map((player, i) => (
          <PlayerProfileCard key={player.id} player={player} number={i + 1} />
        ))}
      </div>
    </>
  );
}

export function MobileBookingCTA() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("home-hero");
    if (!hero) return;
    const update = () => setVisible(hero.getBoundingClientRect().bottom <= 64);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  if (!visible) return null;
  return (
    <aside
      className="mobile-booking fixed inset-x-0 bottom-0 z-30 border-t border-gold/20 bg-ink/95 px-5 pt-3 backdrop-blur md:hidden"
      aria-label="Book a consultation"
    >
      <Button asChild variant="inverse" className="booking-button w-full justify-between">
        <Link to="/book">
          Book Consultation
          <ArrowRight className="cta-arrow" aria-hidden />
        </Link>
      </Button>
    </aside>
  );
}
