import { useEffect, useRef } from "react";
import type { testimonialsQuery } from "@/features/public/queries";

type Testimonial = Awaited<ReturnType<NonNullable<typeof testimonialsQuery.queryFn>>>[number];

export function TestimonialSlider({ quotes }: { quotes: Testimonial[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const looping = quotes.length > 1;

  useEffect(() => {
    const node = viewport.current;
    const firstGroup = group.current;
    if (!node || !firstGroup || !looping) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastTime = 0;
    let remainder = 0;
    let visible = false;
    let interacting = false;
    let resumeAt = 0;
    let cycleWidth = firstGroup.getBoundingClientRect().width;
    const resize = new ResizeObserver(() => {
      cycleWidth = firstGroup.getBoundingClientRect().width;
    });
    resize.observe(firstGroup);
    const observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
    });
    observer.observe(node);
    const hold = () => {
      interacting = true;
    };
    const release = () => {
      interacting = false;
      resumeAt = performance.now() + 2000;
    };
    const manualScroll = () => {
      resumeAt = performance.now() + 2000;
    };
    node.addEventListener("pointerdown", hold);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    node.addEventListener("wheel", manualScroll, { passive: true });

    const tick = (time: number) => {
      const elapsed = lastTime ? Math.min(time - lastTime, 50) : 0;
      lastTime = time;
      const reading = node.matches(":hover") && window.matchMedia("(hover: hover)").matches;
      if (
        !reducedMotion.matches &&
        visible &&
        !document.hidden &&
        !interacting &&
        !reading &&
        !node.matches(":focus-within") &&
        time >= resumeAt &&
        cycleWidth > 0
      ) {
        // Keep fractional movement across frames for the same gentle speed at any refresh rate.
        remainder += elapsed * 0.028;
        const pixels = Math.floor(remainder);
        remainder -= pixels;
        if (pixels) node.scrollLeft = (node.scrollLeft + pixels) % cycleWidth;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      node.removeEventListener("pointerdown", hold);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      node.removeEventListener("wheel", manualScroll);
    };
  }, [looping, quotes.length]);

  const cards = (duplicate = false) => (
    <div
      ref={duplicate ? undefined : group}
      className="testimonial-group"
      aria-hidden={duplicate || undefined}
    >
      {quotes.map((quote) => (
        <figure
          key={quote.id}
          className={`testimonial-card relative isolate flex flex-col overflow-hidden border-t border-gold/40 bg-background p-7 md:p-10 ${!looping ? "md:px-16 md:py-12" : ""}`}
        >
          <span
            className="pointer-events-none absolute -top-8 right-5 -z-10 font-serif text-[220px] leading-none text-gold/10"
            aria-hidden
          >
            “
          </span>
          <blockquote
            className={`flex-1 font-display font-semibold leading-relaxed ${!looping ? "max-w-4xl text-2xl md:text-3xl" : "text-xl"}`}
          >
            “{quote.content}”
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-4">
            <span className="h-px w-8 bg-gold" aria-hidden />
            <div>
              <p className="text-sm font-bold">{quote.client_name}</p>
              {quote.role_or_context && (
                <p className="mt-1 text-xs text-muted-foreground">{quote.role_or_context}</p>
              )}
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );

  return (
    <div
      className="testimonial-slider mt-10"
      data-looping={looping}
      data-pair={quotes.length === 2}
    >
      <div
        ref={viewport}
        className="testimonial-viewport"
        role="region"
        aria-label="Client testimonials"
        tabIndex={looping ? 0 : undefined}
        onKeyDown={(event) => {
          if (!looping || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const node = event.currentTarget;
          if (event.key === "Home") node.scrollLeft = 0;
          else if (event.key === "End")
            node.scrollLeft = Math.max(0, (group.current?.scrollWidth ?? 0) - node.clientWidth);
          else node.scrollLeft += (event.key === "ArrowRight" ? 1 : -1) * node.clientWidth * 0.85;
        }}
      >
        <div className="testimonial-track">
          {cards()}
          {looping && cards(true)}
        </div>
      </div>
    </div>
  );
}
