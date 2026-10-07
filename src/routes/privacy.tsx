import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | KMGMT" },
      { name: "description", content: "How KMGMT collects and uses personal information." },
      { property: "og:title", content: "Privacy Policy | KMGMT" },
      { property: "og:description", content: "KMGMT privacy policy." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <article className="container-page prose-legal max-w-3xl py-14">
        <p className="rounded-md border-l-2 border-gold bg-secondary p-4 text-sm">
          DRAFT - This is a starter template. Final wording must be reviewed by a qualified legal professional (including POPIA compliance) before production.
        </p>
        <h2>1. Who we are</h2>
        <p>[PLACEHOLDER - Legal entity name, registration details and contact address for KMGMT.]</p>
        <h2>2. Information we collect</h2>
        <ul>
          <li>Contact information: name, email address and WhatsApp/phone number.</li>
          <li>Age, to determine whether parent/guardian consent is needed.</li>
          <li>Football history: position, playing level, current and previous clubs.</li>
          <li>Social media profile links and highlight video links you choose to share.</li>
          <li>Booking information: consultation type, date, time and notes about your situation.</li>
          <li>Payment references from our payment provider (PayFast). We do not store card details.</li>
          <li>Parent/guardian name, email, phone and consent for players under 18.</li>
        </ul>
        <h2>3. How we use it</h2>
        <p>[PLACEHOLDER: Purposes: to deliver consultations, communicate about bookings, process payments and meet legal obligations.]</p>
        <h2>4. Minors</h2>
        <p>[PLACEHOLDER: How information about players under 18 is handled and the role of parent/guardian consent.]</p>
        <h2>5. Sharing</h2>
        <p>[PLACEHOLDER: Service providers such as hosting, payment (PayFast) and email providers.]</p>
        <h2>6. Retention</h2>
        <p>[PLACEHOLDER: How long information is kept.]</p>
        <h2>7. Your rights</h2>
        <p>[PLACEHOLDER: Access, correction and deletion requests; contact details of the Information Officer.]</p>
      </article>
    </>
  );
}
