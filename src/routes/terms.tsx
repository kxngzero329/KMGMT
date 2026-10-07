import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | KMGMT" },
      { name: "description", content: "Terms and conditions for KMGMT consultations." },
      { property: "og:title", content: "Terms & Conditions | KMGMT" },
      { property: "og:description", content: "KMGMT terms and conditions." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" />
      <article className="container-page prose-legal max-w-3xl py-14">
        <p className="rounded-md border-l-2 border-gold bg-secondary p-4 text-sm">
          DRAFT - Starter template only. Final wording must be reviewed by a qualified legal professional before production.
        </p>
        <h2>1. Nature of the service</h2>
        <p>KMGMT provides independent football career guidance. Consultations are advisory and do not guarantee trials, club placements, contracts or international opportunities.</p>
        <h2>2. Bookings and payment</h2>
        <p>[PLACEHOLDER - A booking is confirmed only once payment is successfully received. Unpaid reservations are held for a limited time.]</p>
        <h2>3. Cancellations and rescheduling</h2>
        <p>[PLACEHOLDER - Cancellation notice period, rescheduling and refund policy.]</p>
        <h2>4. Players under 18</h2>
        <p>[PLACEHOLDER - Parent/guardian consent and attendance requirements.]</p>
        <h2>5. Liability</h2>
        <p>[PLACEHOLDER - Limitation of liability.]</p>
        <h2>6. Contact</h2>
        <p>[PLACEHOLDER - Contact details.]</p>
      </article>
    </>
  );
}
