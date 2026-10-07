import { Link, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/services", label: "Services" },
  { to: "/international-pathways", label: "International" },
  { to: "/players", label: "Players" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("wordmark inline-flex min-h-11 items-center text-xl", className)}
      aria-label="KMGMT home"
    >
      KMGMT
      <span className="ml-1 text-gold" aria-hidden>
        .
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const transparent = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onResize);
    return () => desktop.removeEventListener("change", onResize);
  }, []);

  return (
    <header
      className={`site-header sticky top-0 z-40 border-b ${transparent ? "site-header-transparent border-white/10 bg-transparent text-ink-foreground" : "border-gold/20 bg-background/95 text-foreground shadow-[0_4px_24px_-20px_rgba(13,12,11,0.25)] backdrop-blur-xl"}`}
    >
      <div className="container-page flex h-[63px] items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Wordmark />
          <span
            className={`hidden border-l pl-5 text-[9px] uppercase leading-relaxed tracking-[0.16em] xl:block ${transparent ? "border-white/20 text-white/55" : "border-gold/25 text-muted-foreground"}`}
          >
            Football career
            <br />
            consultancy
          </span>
        </div>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="header-link inline-flex min-h-11 items-center text-[13px] font-semibold"
              activeProps={{ "aria-current": "page" }}
            >
              {item.label}
            </Link>
          ))}
          <Button
            asChild
            variant={transparent ? "inverse" : "default"}
            className="booking-button ml-1 px-4 text-xs hover:border-gold hover:bg-gold hover:text-ink"
          >
            <Link to="/book">
              Book a Consultation
              <ArrowRight className="cta-arrow" aria-hidden />
            </Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/book"
            className={`booking-button inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-xs font-semibold ${transparent ? "text-ink-foreground hover:bg-white/10" : "hover:bg-gold/10"}`}
            aria-label="Book a consultation"
          >
            Book
            <ArrowUpRight className="h-4 w-4 text-gold" aria-hidden />
          </Link>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className={`inline-flex h-11 w-11 items-center justify-center rounded-md border transition-colors ${transparent ? "border-white/25 hover:border-gold hover:bg-white/10" : "border-gold/30 hover:border-gold hover:bg-gold/10"}`}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="nav-overlay fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" />
              <Dialog.Content className="mobile-nav-panel fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-gold/20 bg-ink text-ink-foreground shadow-2xl sm:max-w-md">
                <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-gold/20 px-6">
                  <Link
                    to="/"
                    onClick={() => setOpen(false)}
                    className="wordmark inline-flex min-h-11 items-center text-xl"
                    aria-label="KMGMT home"
                  >
                    KMGMT
                    <span className="ml-1 text-gold" aria-hidden>
                      .
                    </span>
                  </Link>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 hover:border-gold hover:text-gold"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="mobile-nav-scroll flex flex-1 flex-col overflow-y-auto overscroll-contain px-6 pb-8 pt-8 sm:px-8">
                  <Dialog.Title className="eyebrow text-gold">Explore KMGMT</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Explore our services, players and consultancy, or book a consultation with
                    Kieraan.
                  </Dialog.Description>
                  <nav className="mt-5 border-t border-white/10" aria-label="Mobile">
                    {NAV.map((item, index) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="mobile-nav-link group flex min-h-16 items-center gap-4 border-b border-white/10 py-4 text-2xl font-semibold tracking-tight"
                        activeProps={{ "aria-current": "page" }}
                      >
                        <span
                          className="w-5 text-[10px] font-normal tracking-widest text-gold/75"
                          aria-hidden
                        >
                          0{index + 1}
                        </span>
                        {item.label}
                        <ArrowUpRight
                          className="ml-auto h-4 w-4 text-white/30 transition-colors group-hover:text-gold"
                          aria-hidden
                        />
                      </Link>
                    ))}
                  </nav>
                  <div className="mt-auto pt-9">
                    <p className="font-display text-xl font-semibold">
                      Your next step starts here.
                    </p>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-foreground/60">
                      A focused conversation. An honest perspective. A clearer plan.
                    </p>
                    <Button
                      asChild
                      variant="inverse"
                      size="lg"
                      className="booking-button mt-6 w-full justify-between px-5"
                    >
                      <Link to="/book" onClick={() => setOpen(false)}>
                        Book a Consultation
                        <ArrowRight className="cta-arrow" aria-hidden />
                      </Link>
                    </Button>
                    <p className="mt-5 text-[10px] uppercase tracking-[0.14em] text-ink-foreground/45">
                      Independent guidance · South Africa
                    </p>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
