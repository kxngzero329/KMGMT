import { ArrowUpRight, Facebook, Instagram, Linkedin, Music2 } from "lucide-react";
import { Reveal } from "@/components/home/HomeDetails";
import { contactDetails, contactPage } from "@/content/site";

const SOCIAL_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  tiktok: Music2,
};

function profileDetails(value: string, key: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const name = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? url.hostname);
    const handle =
      (key === "instagram" || key === "tiktok") && !name.startsWith("@") ? `@${name}` : name;
    return { url: url.href, handle };
  } catch {
    return null;
  }
}

export function ContactSocials() {
  return (
    <section
      className="home-section border-t border-gold/20 bg-background"
      aria-labelledby="socials-title"
    >
      <div className="container-page">
        <Reveal className="grid gap-5 md:grid-cols-2 md:items-end md:gap-12">
          <div>
            <p className="eyebrow home-eyebrow">Stay connected</p>
            <h2 id="socials-title" className="home-heading mt-4">
              The conversation <span className="gold-text">continues.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground md:justify-self-end">
            Find KMGMT on social. Profiles marked &ldquo;coming soon&rdquo; show placeholder account
            details for now.
          </p>
        </Reveal>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactPage.socials.map((social, index) => {
            const Icon = SOCIAL_ICONS[social.key];
            const profile = profileDetails(contactDetails[social.key], social.key);
            const className =
              "block h-full min-w-0 rounded-md border border-gold/25 bg-secondary p-5 sm:p-6";
            const content = (
              <>
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-[#806022]" strokeWidth={1.3} aria-hidden />
                  {profile ? (
                    <ArrowUpRight className="cta-arrow h-4 w-4 text-[#806022]" aria-hidden />
                  ) : (
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-base font-semibold">{social.name}</h3>
                <p className="mt-2 break-words text-xs leading-6 text-muted-foreground">
                  {profile?.handle ?? social.placeholder}
                </p>
              </>
            );
            return (
              <li key={social.key} className="min-w-0">
                <Reveal delay={index * 70} className="h-full">
                  {profile ? (
                    <a
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`social-profile-link ${className}`}
                      aria-label={`${social.name}: ${profile.handle} (opens in a new tab)`}
                    >
                      {content}
                    </a>
                  ) : (
                    <div className={className}>{content}</div>
                  )}
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
