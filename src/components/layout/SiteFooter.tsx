import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ArrowUp, ArrowUpRight, Compass, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/SiteHeader";
import { contactDetails } from "@/content/site";

const FOOTER_GROUPS = [
  {
    title: "Explore",
    links: [
      { to: "/services", label: "Consultations" },
      { to: "/international-pathways", label: "International" },
      { to: "/players", label: "Our players" },
    ],
  },
  {
    title: "KMGMT",
    links: [
      { to: "/about", label: "Meet Kieraan" },
      { to: "/contact", label: "Get in touch" },
      { to: "/book", label: "Book a session" },
    ],
  },
] as const;

export function SiteFooter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const backToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    document
      .querySelector<HTMLAnchorElement>('header a[aria-label="KMGMT home"]')
      ?.focus({ preventScroll: true });
  };

  return (
    <footer
      className={`site-footer border-t border-gold/20 bg-ink text-ink-foreground ${isHome ? "home-footer" : ["/services", "/international-pathways", "/players", "/about", "/contact", "/book"].includes(pathname) ? "" : "mt-24"}`}
    >
      <div className="container-page">
        <div className="grid gap-10 py-12 md:grid-cols-2 md:gap-x-12 md:py-16 lg:grid-cols-[1.1fr_1fr_1fr] lg:gap-12">
          <div>
            <Wordmark className="text-2xl" />
            <p className="mt-4 max-w-xs text-sm leading-7 text-ink-foreground/60">
              Independent football career guidance. Helping players and parents make informed
              decisions about what comes next.
            </p>
            <p className="mt-6 flex items-center gap-2.5 text-xs text-ink-foreground/65">
              <Compass className="h-4 w-4 text-gold" strokeWidth={1.5} aria-hidden />
              South African roots. A wider perspective.
            </p>
            {contactDetails.email && (
              <a
                href={`mailto:${contactDetails.email}`}
                className="footer-link mt-3 inline-flex min-h-11 items-center gap-2 break-all text-sm"
              >
                {contactDetails.email}
                <ArrowUpRight className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              </a>
            )}
          </div>
          <nav className="grid grid-cols-2 gap-5" aria-label="Footer">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                  {group.title}
                </h2>
                <ul className="mt-4 space-y-1">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="footer-link inline-flex min-h-11 items-center text-sm text-ink-foreground/70"
                        activeProps={{ "aria-current": "page" }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="relative border border-gold/20 bg-white/[0.025] p-6 md:col-span-2 lg:col-span-1">
            <span
              className="absolute -left-px -top-px h-6 w-6 border-l border-t border-gold/70"
              aria-hidden
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
              Make your next move count
            </p>
            <h2 className="mt-3 text-xl font-semibold">Let's talk football.</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-foreground/60">
              Personal guidance with Kieraan, at a time that works for you.
            </p>
            <Button
              asChild
              variant="inverse"
              className="booking-button mt-5 w-full justify-between px-4 text-xs"
            >
              <Link to="/book">
                Book a Consultation
                <ArrowRight className="cta-arrow" aria-hidden />
              </Link>
            </Button>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-ink-foreground/50">
              <LockKeyhole className="h-3 w-3 text-gold" aria-hidden />
              Secure payment through PayFast
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <p className="text-[11px] leading-relaxed text-ink-foreground/45">
            © {new Date().getFullYear()} KMGMT. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link
              to="/privacy"
              className="footer-link inline-flex min-h-11 items-center text-xs text-ink-foreground/60"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="footer-link inline-flex min-h-11 items-center text-xs text-ink-foreground/60"
            >
              Terms
            </Link>
            <button
              type="button"
              onClick={backToTop}
              className="footer-link ml-auto inline-flex min-h-11 items-center gap-2 text-xs text-ink-foreground/70 sm:ml-3"
            >
              Back to top
              <ArrowUp className="h-3.5 w-3.5 text-gold" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
