import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { PolicyContact } from "@/components/common/PolicyContact";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | KMGMT" },
      {
        name: "description",
        content:
          "How KMGMT handles personal information, player CVs, football footage, bookings and payment records under South Africa's POPIA.",
      },
      { property: "og:title", content: "Privacy Policy | KMGMT" },
      {
        property: "og:description",
        content:
          "Your personal information, football materials and privacy rights when using KMGMT.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <article className="container-page prose-legal max-w-3xl py-14">
        <p className="text-sm text-muted-foreground">Last updated: 17 October 2026</p>
        <h2>1. Who this policy covers</h2>
        <p>
          KMGMT provides football consultations, career guidance and player advisory services
          through kmgmt.co.za. KMGMT is responsible for the personal information it collects for
          those services. This policy explains how we handle that information under the{" "}
          <a
            href="https://www.gov.za/documents/protection-personal-information-act"
            target="_blank"
            rel="noopener noreferrer"
          >
            Protection of Personal Information Act 4 of 2013 (POPIA)
          </a>{" "}
          and other applicable South African law.
        </p>
        <p>
          For privacy questions or to request access, correction or deletion, contact KMGMT and mark
          your message &quot;Privacy request&quot;.
        </p>
        <PolicyContact />
        <h2>2. Information we collect</h2>
        <ul>
          <li>
            <strong>Identity and contact details:</strong> your name, age, email, WhatsApp number
            and country of residence.
          </li>
          <li>
            <strong>Football background:</strong> position, current and previous clubs, playing
            level, career goals, what you need help with and the situation you choose to describe.
          </li>
          <li>
            <strong>Player materials:</strong> social profile and highlight-video links submitted in
            the booking form, and player CVs, football footage or supporting materials you send
            separately for an agreed service. The booking form collects links; it does not require a
            CV upload.
          </li>
          <li>
            <strong>Booking records:</strong> consultation, online or in-person format, appointment
            date and time, booking reference, status, session arrangements and relevant
            communications or notes.
          </li>
          <li>
            <strong>Payments:</strong> amount, currency, status, PayFast references and payment
            notifications. PayFast processes payment credentials; KMGMT does not collect or store
            your full card number, security code, banking password or one-time password.
          </li>
          <li>
            <strong>Guardian details:</strong> parent or guardian name, email, phone and consent for
            players under 18.
          </li>
          <li>
            <strong>Enquiries and technical information:</strong> messages sent through our contact
            form or WhatsApp, and technical information such as IP addresses, request details and
            security or error logs processed by the website and its providers.
          </li>
        </ul>
        <p>
          Required fields let us reserve, prepare for and deliver your session and handle payment.
          Without them we may be unable to provide the service. Optional football details and links
          are your choice. Please avoid sending unnecessary identity documents or sensitive
          information.
        </p>

        <h2>3. Purposes and lawful processing</h2>
        <p>
          We use information to answer enquiries, manage bookings, prepare and deliver
          consultations, provide agreed guidance, verify payments, send confirmations and receipts,
          arrange calls or venues, and handle cancellations, refunds and complaints. We also keep
          records for accounting, legal obligations, security and resolving disputes.
        </p>
        <p>
          The lawful basis depends on the purpose: taking steps at your request or performing our
          agreement, legal obligations, legitimate interests where lawful, or your consent. Where
          consent is required, you can withdraw it for future processing. Transactional booking
          messages do not automatically subscribe you to marketing; any electronic marketing is
          subject to applicable consent and opt-out requirements.
        </p>

        <h2>4. Player CVs, footage and confidentiality</h2>
        <p>
          Player materials are used to understand your circumstances and provide the requested
          guidance. Share only materials you have authority to provide, including any permission
          needed for identifiable people in footage. You retain your rights in your materials.
        </p>
        <p>
          Submitting a CV, profile or video does not authorise public posting, inclusion on our
          player pages, marketing use or circulation to clubs and agents. Any such disclosure
          requires your authority or another lawful basis. Where wider career management or advisory
          work is agreed, we explain relevant sharing before it takes place.
        </p>

        <h2>5. Players under 18</h2>
        <p>
          The booking form requires parent or guardian details and consent for players under 18. We
          use a child&apos;s information for the relevant booking and agreed services with the
          authority required by POPIA. Parents or guardians can contact us about the child&apos;s
          records; we may need proportionate verification of identity and authority.
        </p>

        <h2>6. Sharing and service providers</h2>
        <p>
          KMGMT personnel receive the information needed to deliver your service. The following
          providers also process relevant information:
        </p>
        <ul>
          <li>
            <strong>Supabase:</strong> booking, client and payment records, authentication, storage
            and server-side processing.
          </li>
          <li>
            <strong>Netlify:</strong> website hosting and delivery.
          </li>
          <li>
            <strong>PayFast:</strong> payment processing and transaction verification.
          </li>
          <li>
            <strong>Resend:</strong> booking confirmation, receipt and admin enquiry emails. Client
            emails contain booking and payment details; KMGMT&apos;s admin notifications include
            submitted booking information or contact-form name, email, optional phone, subject and
            message, as appropriate. Enquiry notifications use the submitted email as the reply
            address.
          </li>
          <li>
            <strong>WhatsApp and an agreed video-call provider:</strong> communications and online
            arrangements when those channels are used. Their own privacy terms also apply.
          </li>
          <li>
            <strong>Professional advisers and authorities:</strong> where necessary and lawful for
            accounting, legal obligations or protecting legal rights.
          </li>
        </ul>
        <p>
          We do not sell your information. Providers may process information outside South Africa.
          International transfers are subject to applicable POPIA safeguards, such as adequate
          protection, appropriate contractual obligations or another lawful transfer basis.
        </p>

        <h2>7. Security and retention</h2>
        <p>
          We use reasonable technical and organisational safeguards, including restricted access to
          client records and server-side payment and email credentials. No website or communication
          channel can guarantee absolute security. Do not send banking passwords, card security
          information or one-time passwords to KMGMT.
        </p>
        <p>
          Information is kept for as long as reasonably needed for the collection purpose, agreed
          services, record-keeping obligations and legitimate legal claims. Unneeded information is
          deleted, de-identified or otherwise handled lawfully. Deletion requests may not remove
          transaction records that must be retained. Legally required security-compromise
          notifications are made to the Information Regulator and affected people.
        </p>

        <h2>8. Website storage and external links</h2>
        <p>
          The website and its providers use technical information to deliver and secure the service.
          Admin sign-in uses browser storage to maintain the session. External footage,
          social-media, PayFast and WhatsApp links are governed by those providers&apos; privacy and
          storage practices.
        </p>

        <h2>9. Your rights and complaints</h2>
        <p>
          Subject to applicable law, you may request access, correction or deletion, object to
          qualifying processing, withdraw consent where it is the processing basis, and opt out of
          direct marketing. We may need proportionate identity verification to protect your
          information.
        </p>
        <p>
          Contact KMGMT with enough information to identify your request. You may also lodge a
          complaint about unlawful processing with the{" "}
          <a
            href="https://inforegulator.org.za/complaints/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Information Regulator of South Africa
          </a>
          .
        </p>
        <PolicyContact />

        <h2>10. Updates and related policies</h2>
        <p>
          This policy may change as our services or legal obligations change; the date above
          identifies this version. Our <Link to="/terms">Terms &amp; Conditions</Link> cover service
          delivery, payments, cancellation, rescheduling and manual refunds.
        </p>
      </article>
    </>
  );
}
