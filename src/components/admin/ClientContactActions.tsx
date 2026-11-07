import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function whatsappNumber(value: string | null | undefined, country: string | null | undefined) {
  if (!value) return null;
  let digits = value.replace(/\D/g, "");
  const southAfrica = ["southafrica", "za", "rsa"].includes(
    (country ?? "").toLowerCase().replace(/\s/g, ""),
  );
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (southAfrica && digits.length === 9) digits = `27${digits}`;
  if (southAfrica && digits.startsWith("270") && digits.length === 12)
    digits = `27${digits.slice(3)}`;
  if (digits.startsWith("0")) {
    if (!southAfrica || digits.length !== 10) return null;
    digits = `27${digits.slice(1)}`;
  }
  return /^[1-9]\d{6,14}$/.test(digits) ? digits : null;
}

/** These links open the admin's app; nothing is sent or recorded automatically. */
export function ClientContactActions({
  name,
  email,
  whatsapp,
  country,
  reference,
  compact = false,
}: {
  name: string;
  email?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  reference?: string;
  compact?: boolean;
}) {
  const phone = whatsappNumber(whatsapp, country);
  const validEmail = !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const subject = reference ? `Your KMGMT booking — ${reference}` : "Your KMGMT consultation";
  const message = `Hi ${name.trim().split(/\s+/)[0] || "there"}, this is Kieraan from KMGMT${reference ? ` regarding your booking ${reference}` : " regarding your consultation"}. `;
  if (!phone && !validEmail) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
      {phone && (
        <Button
          asChild
          size={compact ? "icon" : "sm"}
          variant="outline"
          className={
            compact
              ? "h-9 w-9 rounded-lg border-border bg-background text-muted-foreground hover:text-[#806022]"
              : "rounded-lg"
          }
        >
          <a
            href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`WhatsApp ${name}`}
            aria-label={`WhatsApp ${name} (opens in a new tab)`}
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            {!compact && "WhatsApp"}
          </a>
        </Button>
      )}
      {validEmail && (
        <Button
          asChild
          size={compact ? "icon" : "sm"}
          variant="outline"
          className={
            compact
              ? "h-9 w-9 rounded-lg border-border bg-background text-muted-foreground hover:text-[#806022]"
              : "rounded-lg"
          }
        >
          <a
            href={`mailto:${encodeURIComponent(email!)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
            title={`Email ${name}`}
            aria-label={`Email ${name}`}
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            {!compact && "Email"}
          </a>
        </Button>
      )}
    </div>
  );
}
