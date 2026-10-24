import { pageSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { PolicyContact } from "@/components/common/PolicyContact";

export const Route = createFileRoute("/terms")({
  head: () => pageSeo("/terms"),
  component: Terms,
});

function Terms() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" />
      <article className="container-page prose-legal max-w-3xl py-14">
        <p className="text-sm text-muted-foreground">Last updated: 24 October 2026</p>
        <p>
          These terms apply to kmgmt.co.za and to football consultations, career guidance and player
          advisory services booked through KMGMT. They include our refund, cancellation,
          rescheduling and service delivery policies. Please read them before paying for a booking.
        </p>
        <nav
          aria-label="Booking policies"
          className="my-7 rounded-md border border-gold/25 bg-secondary p-5"
        >
          <ul>
            <li>
              <a href="#services">Services and client responsibilities</a>
            </li>
            <li>
              <a href="#payments">Bookings and payments</a>
            </li>
            <li>
              <a href="#service-delivery">Service Delivery Policy</a>
            </li>
            <li>
              <a href="#cancellations">Cancellation and Rescheduling Policy</a>
            </li>
            <li>
              <a href="#refunds">Refund Policy</a>
            </li>
          </ul>
        </nav>

        <h2 id="services" className="scroll-mt-24">
          1. Our services
        </h2>
        <p>
          KMGMT provides independent football consultations, career planning, player assessments and
          advice on career decisions and international pathways. Guidance depends on the information
          you share and your circumstances. A consultation does not guarantee trials, a club
          placement, a playing contract, representation, a visa or any particular career outcome.
        </p>
        <p>
          Career management, ongoing player advisory work, representation or other services beyond
          the booked consultation require a separate agreement describing the scope, fees and
          responsibilities. Paying for a consultation does not appoint KMGMT as your agent or commit
          either party to a management or representation agreement.
        </p>

        <h2 id="payments" className="scroll-mt-24">
          2. Bookings and payments
        </h2>
        <p>
          Choose your online consultation, enter your details, select an available date and time,
          choose a payment method and review the total before confirming. Prices are displayed in
          South African rand (ZAR). The session duration and price are shown for your selected
          service. All appointments must be booked through this website and paid using the selected
          method, including any alternative arrangement personally confirmed by Kieraan through
          WhatsApp.
        </p>
        <p>
          EFT / bank transfer is currently available. Confirming an EFT booking reserves your slot
          and sends a booking confirmation and PDF invoice by email, including bank details, the
          amount due and your booking reference to use as the payment reference. The reservation
          does not mean that payment has been received. Pay on receipt of the invoice and before
          your consultation; contact KMGMT promptly if you cannot do so.
        </p>
        <p>
          For EFT, attach proof of payment to a WhatsApp message or email using the buttons in your
          invoice email or booking status page. Include your booking reference. Payment remains
          pending until Kieraan verifies the funds in his bank account; sending proof alone does not
          mark the invoice paid. KMGMT receives the booking, selected payment method and invoice
          details. Check your inbox, spam folder and contact details. If your invoice does not
          arrive or you are unsure about a payment, contact KMGMT before paying again.
        </p>
        <p>
          Online PayFast payments are displayed but temporarily disabled while merchant verification
          is completed. When available, a PayFast checkout reserves the slot temporarily; an unpaid
          hold can expire. PayFast bookings are confirmed and confirmation and receipt emails are
          sent only after payment verification. Returning to the website alone does not confirm a
          PayFast payment. Do not send card details, banking passwords, PINs or one-time passwords
          to KMGMT.
        </p>

        <h2 id="service-delivery" className="scroll-mt-24">
          3. Service Delivery Policy
        </h2>
        <p>
          Consultations take place at the date and time selected during booking. Times on this
          website are shown in South African Standard Time (SAST, Africa/Johannesburg). KMGMT uses
          your submitted football background and questions to prepare for the session.
        </p>
        <p>
          <strong>Consultations are online only</strong> unless Kieraan personally confirms an
          alternative arrangement with you through WhatsApp. An exception does not replace the
          website booking or payment requirement.
        </p>
        <ul>
          <li>
            <strong>Online consultations:</strong> KMGMT contacts you using the WhatsApp number
            supplied with your booking to arrange the video call. Any joining link or agreed
            platform details are shared directly before the appointment. Have a working camera and
            microphone, reliable internet and a quiet place to speak.
          </li>
          <li>
            <strong>Exceptions by Kieraan&apos;s arrangement only:</strong> any alternative to an
            online consultation must be personally arranged and confirmed by Kieraan through
            WhatsApp. Selecting or paying for a consultation does not entitle you to an in-person
            meeting. Any agreed details are shared privately; KMGMT does not publish a consultation
            address. Complete the normal website booking and payment even if Kieraan agrees an
            exception.
          </li>
          <li>
            <strong>Joining and attendance:</strong> be ready at the scheduled time and provide a
            reachable WhatsApp number and email address. Contact us promptly if you have not
            received the arrangements or cannot join.
          </li>
          <li>
            <strong>Delivery issues:</strong> if KMGMT cannot deliver a session or a technical
            problem prevents it from taking place, contact us to arrange an alternative session or
            an appropriate refund for the undelivered service, subject to applicable law.
          </li>
        </ul>
        <p>
          Any additional deliverables or follow-up work must be agreed separately. A consultation
          fee does not include travel, ongoing management, introductions or written reports unless
          expressly agreed.
        </p>

        <h2 id="cancellations" className="scroll-mt-24">
          4. Cancellation and Rescheduling Policy
        </h2>
        <p>
          Please give at least <strong>24 hours&apos; notice before the scheduled start</strong> to
          cancel or request rescheduling. Send the request via WhatsApp with your name, booking
          reference, appointment date and time, and your preferred alternative if rescheduling. If
          WhatsApp is unavailable, use the contact form so your request is recorded.
        </p>
        <p>
          Rescheduling is handled manually, depends on availability and is confirmed when KMGMT
          agrees the new date and time with you. A request alone does not change the appointment.
          Cancelling your consultation does not automatically refund a payment: ask for a refund as
          described below.
        </p>
        <p>
          Requests made with less than 24 hours&apos; notice and missed appointments are considered
          according to the circumstances and applicable South African consumer protection laws. Any
          cancellation charge must be reasonable and lawful; it is not an automatic forfeiture of
          the full payment. Statutory cancellation rights and any legally required exceptions,
          including qualifying death or hospitalisation circumstances, remain available.
        </p>
        <p>
          If KMGMT needs to cancel or move your appointment, we will contact you and offer an
          alternative time or an appropriate refund for services not delivered. You do not have to
          accept a replacement session where the law entitles you to a refund.
        </p>

        <h2 id="refunds" className="scroll-mt-24">
          5. Refund Policy
        </h2>
        <p>
          You can request a refund via WhatsApp when cancelling at least{" "}
          <strong>24 hours before your scheduled consultation</strong>, subject to applicable South
          African consumer protection laws. Include your booking reference, name, scheduled date and
          reason for the request. KMGMT reviews the request and communicates the decision directly.
        </p>
        <p>
          <strong>Refunds are a manual process.</strong> A website cancellation, request, or change
          in booking status does not automatically issue a PayFast refund. Approved refunds take{" "}
          <strong>3–5 working days</strong> after approval; weekends and South African public
          holidays are not working days. We will communicate the refund arrangements and any
          provider or banking delay.
        </p>
        <p>
          Duplicate charges, payments for sessions that cannot be delivered, and any refund required
          by law can also be raised with KMGMT. The 24-hour notice policy does not remove a refund,
          cooling-off, cancellation or service-quality remedy that applies under the Consumer
          Protection Act, the Electronic Communications and Transactions Act or other applicable
          law.
        </p>
        <PolicyContact />

        <h2>6. Your responsibilities and submitted materials</h2>
        <p>
          Provide accurate contact information, your age, football background and relevant
          questions. Submit only CVs, photographs, footage and links that you own or have permission
          to share. Do not knowingly provide misleading career information or another person&apos;s
          confidential information without authority.
        </p>
        <p>
          Use advice responsibly and make your own informed decisions about clubs, agents,
          contracts, travel and career opportunities. Get suitable professional advice where legal,
          financial, medical or immigration advice is needed. Treat KMGMT and other participants
          respectfully. Do not record or distribute a consultation without the agreement of everyone
          involved.
        </p>

        <h2>7. Players under 18</h2>
        <p>
          A parent or guardian must authorise a booking for a player under 18. The booking form
          requires their name, email, phone number and consent. The parent or guardian must be
          available to assist with consultation arrangements and should attend where appropriate.
          Please do not submit a child&apos;s CV or footage without the necessary authority.
        </p>

        <h2>8. Privacy and confidentiality</h2>
        <p>
          Personal information, football history, player CVs, footage and booking details are
          handled as described in our <Link to="/privacy">Privacy Policy</Link>. Sharing materials
          for a consultation does not give KMGMT permission to publish your profile or use your
          footage in marketing.
        </p>

        <h2>9. Consumer rights, concerns and changes</h2>
        <p>
          South African law applies. These terms do not exclude rights or remedies that cannot
          lawfully be excluded, or liability that cannot lawfully be limited. If something about a
          service is wrong, contact KMGMT so we can address it. You may still use any complaint
          process or remedy available under applicable law.
        </p>
        <p>
          We may update these policies for future bookings. The version agreed when you book applies
          to that booking, subject to applicable law and any changes agreed with you.
        </p>

        <h2>10. Contact KMGMT</h2>
        <PolicyContact />
      </article>
    </>
  );
}
