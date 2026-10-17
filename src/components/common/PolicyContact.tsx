import { Link } from "@tanstack/react-router";
import { contactDetails } from "@/content/site";

export function PolicyContact() {
  const digits = contactDetails.whatsapp.replace(/\D/g, "");
  return (
    <p>
      Contact KMGMT{" "}
      {digits ? (
        <>
          <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer">
            on WhatsApp at {contactDetails.whatsapp}
          </a>{" "}
          or{" "}
        </>
      ) : (
        "through "
      )}
      <Link to="/contact">our contact form</Link>.
      {contactDetails.email && (
        <>
          {" "}
          You can also email <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>.
        </>
      )}{" "}
      For a booking request, include your name, booking reference and scheduled consultation date.
    </p>
  );
}
