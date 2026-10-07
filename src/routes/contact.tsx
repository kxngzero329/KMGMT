import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MapPin,
  MessageCircle,
  Send,
} from "lucide-react";
import { BookingAssurances, PitchLines, Reveal } from "@/components/home/HomeDetails";
import { ContactSocials } from "@/components/contact/ContactSocials";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/common/Field";
import { contactSchema } from "@/lib/validation/schemas";
import { submitEnquiry } from "@/features/public/queries";
import { contactDetails, contactPage } from "@/content/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | KMGMT" },
      {
        name: "description",
        content:
          "Have a question about your football career? Send KMGMT an enquiry, connect on social or book a consultation with Kieraan.",
      },
      { property: "og:title", content: "Contact | KMGMT" },
      {
        property: "og:description",
        content: "Good questions. Better direction. Get in touch with KMGMT.",
      },
    ],
  }),
  component: Contact,
});

const EMPTY_VALUES = { name: "", email: "", phone: "", subject: "", message: "" };

function ContactMethods() {
  const phoneDigits = contactDetails.whatsapp.replace(/\D/g, "");
  const methods = [
    {
      label: "Email",
      icon: Mail,
      value: contactDetails.email,
      placeholder: contactPage.placeholders.email,
      href: contactDetails.email ? `mailto:${contactDetails.email}` : "",
    },
    {
      label: "WhatsApp",
      icon: MessageCircle,
      value: contactDetails.whatsapp,
      placeholder: contactPage.placeholders.whatsapp,
      href: phoneDigits ? `https://wa.me/${phoneDigits}` : "",
    },
    {
      label: "Location",
      icon: MapPin,
      value: contactDetails.location,
      placeholder: contactPage.placeholders.location,
      href: "",
    },
  ];
  return (
    <div className="rounded-md border border-gold/25 bg-background p-6 sm:p-8">
      <p className="eyebrow home-eyebrow">Direct contact</p>
      <h3 className="mt-3 text-xl font-semibold tracking-tight">Other ways to connect.</h3>
      <dl className="mt-6 divide-y divide-gold/20">
        {methods.map(({ label, icon: Icon, value, placeholder, href }) => (
          <div key={label} className="flex gap-4 py-5 first:pt-0 last:pb-0">
            <Icon
              className="mt-0.5 h-5 w-5 shrink-0 text-[#806022]"
              strokeWidth={1.3}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-2 break-words text-sm font-semibold leading-6">
                {href ? (
                  <a
                    href={href}
                    className="booking-button inline-flex min-h-11 max-w-full items-center gap-2 hover:text-[#806022]"
                    {...(label === "WhatsApp"
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    <span className="min-w-0 break-all">{value}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {label === "WhatsApp" && <span className="sr-only">(opens in a new tab)</span>}
                  </a>
                ) : (
                  value || placeholder
                )}
              </dd>
              {!value && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {label === "Location" ? "Details coming soon" : "Placeholder contact details"}
                </p>
              )}
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Contact() {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (state === "sent") successHeading.current?.focus();
  }, [state]);

  const set = (key: keyof typeof values) => (value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    if (state === "error") setState("idle");
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    const result = contactSchema.safeParse(values);
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setErrors({});
    submitting.current = true;
    setState("sending");
    try {
      await submitEnquiry(result.data);
      setState("sent");
    } catch {
      setState("error");
    } finally {
      submitting.current = false;
    }
  }

  function resetForm() {
    setValues(EMPTY_VALUES);
    setErrors({});
    setState("idle");
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>("input")?.focus());
  }

  return (
    <div className="contact-page">
      <section className="contact-hero relative isolate overflow-hidden bg-ink text-ink-foreground">
        <PitchLines className="absolute -right-28 -top-36 -z-10 h-[620px] w-[520px] rotate-12 text-gold/[0.08]" />
        <div className="container-page grid items-center gap-8 py-16 md:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
          <div>
            <p className="eyebrow flex items-center gap-3 text-gold">
              <span className="h-px w-8 bg-gold" aria-hidden />
              Get in touch
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Good questions.
              <br />
              <span className="text-gold">Better direction.</span>
            </h1>
          </div>
          <div className="border-l border-gold/30 pl-6">
            <p className="max-w-md text-base leading-7 text-ink-foreground/70">
              Have a question before booking, or want to understand how KMGMT can help? Start the
              conversation here.
            </p>
            <a
              href="#enquiry"
              className="booking-button mt-6 inline-flex min-h-12 items-center gap-3 text-sm font-semibold hover:text-gold"
            >
              Send a message
              <ArrowDown className="h-4 w-4" aria-hidden />
            </a>
            <p className="mt-4 text-xs text-ink-foreground/60">Players and parents are welcome.</p>
          </div>
        </div>
      </section>

      <section
        id="enquiry"
        className="home-section scroll-mt-16 bg-secondary"
        aria-labelledby="enquiry-title"
      >
        <div className="container-page grid gap-10 lg:grid-cols-[1.45fr_0.85fr] lg:gap-12">
          <div className="min-w-0">
            <Reveal>
              <p className="eyebrow home-eyebrow">Your enquiry</p>
              <h2 id="enquiry-title" className="home-heading mt-4">
                Tell us what's <span className="gold-text">on your mind.</span>
              </h2>
              <p
                id="enquiry-intro"
                className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground"
              >
                A little background helps us understand your question. For a dedicated conversation
                with Kieraan, you can{" "}
                <Link
                  to="/book"
                  className="font-semibold underline decoration-gold/60 underline-offset-4 hover:text-[#806022]"
                >
                  book a consultation directly
                </Link>
                .
              </p>
            </Reveal>
            <div className="mt-8 rounded-md border border-gold/25 bg-background p-6 sm:p-8">
              {state === "sent" ? (
                <div
                  role="status"
                  className="flex min-h-[390px] flex-col items-start justify-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-secondary">
                    <CheckCircle2
                      className="h-6 w-6 text-[#806022]"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </span>
                  <p className="eyebrow home-eyebrow mt-7">Thank you for reaching out</p>
                  <h3
                    ref={successHeading}
                    tabIndex={-1}
                    className="mt-3 text-3xl font-bold tracking-tight"
                  >
                    Message received.
                  </h3>
                  <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                    Your enquiry has been sent to KMGMT. We'll get back to you as soon as possible.
                  </p>
                  <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
                    <Button asChild className="booking-button hover:bg-gold hover:text-ink">
                      <Link to="/book">
                        Book a Consultation
                        <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Send another message
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  ref={formRef}
                  onSubmit={onSubmit}
                  noValidate
                  aria-describedby="enquiry-intro"
                  aria-busy={state === "sending"}
                  className="contact-enquiry-form [&_input]:bg-secondary [&_input]:shadow-none [&_textarea]:min-h-40 [&_textarea]:resize-y [&_textarea]:bg-secondary [&_textarea]:shadow-none"
                >
                  <p className="mb-7 text-xs text-muted-foreground">
                    Required fields are marked{" "}
                    <span className="font-semibold text-[#806022]">*</span>.
                  </p>
                  <fieldset disabled={state === "sending"} className="min-w-0 space-y-6">
                    <legend className="sr-only">Your contact details and message</legend>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field
                        label="Full name"
                        required
                        value={values.name}
                        onChange={set("name")}
                        error={errors.name}
                        autoComplete="name"
                        placeholder="Your name"
                      />
                      <Field
                        label="Email"
                        type="email"
                        required
                        value={values.email}
                        onChange={set("email")}
                        error={errors.email}
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field
                        label="WhatsApp / phone"
                        type="tel"
                        value={values.phone}
                        onChange={set("phone")}
                        error={errors.phone}
                        autoComplete="tel"
                        placeholder="+27 82 123 4567"
                      />
                      <Field
                        label="Subject"
                        required
                        value={values.subject}
                        onChange={set("subject")}
                        error={errors.subject}
                        placeholder="What would you like to discuss?"
                      />
                    </div>
                    <Field
                      label="Message"
                      required
                      multiline
                      value={values.message}
                      onChange={set("message")}
                      error={errors.message}
                      placeholder="Tell us a little about your situation and how we can help."
                      hint="Up to 3,000 characters."
                    />
                  </fieldset>
                  {Object.keys(errors).length > 0 && (
                    <p role="alert" className="mt-5 text-sm text-destructive">
                      Please check the highlighted fields before sending.
                    </p>
                  )}
                  {state === "error" && (
                    <p
                      role="alert"
                      className="mt-5 rounded-md border border-destructive/25 bg-destructive/5 p-4 text-sm leading-6 text-destructive"
                    >
                      Your message couldn't be sent. Your details are still here. Please try again.
                    </p>
                  )}
                  <div className="mt-7 flex flex-col gap-5 border-t border-gold/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xs text-xs leading-6 text-muted-foreground">
                      Read how we handle your information in our{" "}
                      <Link
                        to="/privacy"
                        className="underline decoration-gold/60 underline-offset-4 hover:text-[#806022]"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={state === "sending"}
                      className="booking-button shrink-0 hover:bg-gold hover:text-ink"
                    >
                      {state === "sending" ? (
                        <>
                          <LoaderCircle
                            className="h-4 w-4 animate-spin motion-reduce:animate-none"
                            aria-hidden
                          />
                          Sending…
                        </>
                      ) : (
                        <>
                          Send message
                          <Send className="h-4 w-4" aria-hidden />
                        </>
                      )}
                    </Button>
                  </div>
                  <p role="status" aria-live="polite" className="sr-only">
                    {state === "sending" ? "Sending your message." : ""}
                  </p>
                </form>
              )}
            </div>
          </div>
          <aside className="min-w-0 space-y-6 lg:pt-1" aria-label="More ways to get in touch">
            <Reveal>
              <ContactMethods />
            </Reveal>
            <Reveal delay={90}>
              <div className="relative isolate overflow-hidden rounded-md border border-gold/30 bg-ink p-6 text-ink-foreground sm:p-8">
                <PitchLines className="absolute -right-24 -top-10 -z-10 h-[400px] w-[330px] rotate-12 text-gold/10" />
                <MessageCircle className="h-7 w-7 text-gold" strokeWidth={1.2} aria-hidden />
                <p className="eyebrow mt-6 text-gold">Ready for a conversation?</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                  Make time for your next move.
                </h3>
                <p className="mt-4 text-sm leading-7 text-ink-foreground/65">
                  Choose your consultation, then select an available date and time. Your booking
                  starts there.
                </p>
                <Button
                  asChild
                  variant="inverse"
                  className="booking-button mt-6 w-full justify-between px-4 text-sm"
                >
                  <Link to="/book">
                    Book a Consultation
                    <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Link
                  to="/services"
                  className="booking-button mt-3 inline-flex min-h-11 items-center gap-2 text-xs text-ink-foreground/70 hover:text-gold"
                >
                  Explore the consultations
                  <ArrowRight className="cta-arrow h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      <ContactSocials />

      <section
        className="home-final-cta home-section relative isolate overflow-hidden bg-ink text-ink-foreground"
        aria-labelledby="contact-cta-title"
      >
        <PitchLines className="absolute -right-40 -top-28 -z-10 h-[650px] w-[540px] rotate-12 text-gold/[0.08]" />
        <div className="container-page">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="eyebrow text-gold">A conversation with purpose</p>
            <h2 id="contact-cta-title" className="home-heading mt-5">
              Your next move starts <span className="text-gold">with the right conversation.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-ink-foreground/65">
              Get personal guidance from Kieraan and a clearer view of the options ahead.
            </p>
            <Button
              asChild
              variant="inverse"
              size="lg"
              className="booking-button mt-8 w-full sm:w-auto"
            >
              <Link to="/book">
                Book a Consultation
                <ArrowRight className="cta-arrow h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <div className="mt-9 border-t border-gold/20 pt-7">
              <BookingAssurances dark />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
