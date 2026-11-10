import { Film, Mail, MessageCircle } from "lucide-react";
import { contactDetails, performanceFootagePolicy } from "@/content/site";
import { performanceFootageLinks } from "@/lib/performance-footage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PerformanceFootageNotice({
  bookingReference,
  compact = false,
  className,
}: {
  bookingReference?: string;
  compact?: boolean;
  className?: string;
}) {
  const links = bookingReference ? performanceFootageLinks(bookingReference) : null;
  return (
    <aside
      aria-label={performanceFootagePolicy.title}
      className={cn(
        "w-full rounded-md border border-gold/30 bg-background p-5 text-left",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Film className="mt-0.5 h-5 w-5 shrink-0 text-[#806022]" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{performanceFootagePolicy.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {performanceFootagePolicy.notice}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {performanceFootagePolicy.channels}
          </p>
          {!compact && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {performanceFootagePolicy.instructions}
            </p>
          )}
          {links && !compact && (
            <>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <a href={links.whatsapp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
                    Send footage via WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={links.email}>
                    <Mail className="mr-2 h-4 w-4" aria-hidden />
                    Send footage via email
                  </a>
                </Button>
              </div>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                These buttons open your chosen app. Attach your videos or paste the viewing link
                before sending. You can also reply to your booking confirmation email.
              </p>
              <p className="mt-2 break-words text-xs leading-6 text-muted-foreground">
                WhatsApp: {contactDetails.whatsapp}
                <br />
                Email: {contactDetails.email}
                <br />
                Booking reference: {bookingReference}
              </p>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
