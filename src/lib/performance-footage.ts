import { contactDetails } from "../content/site.ts";

export function performanceFootageLinks(
  bookingReference: string,
  contact: { email: string; whatsapp: string } = contactDetails,
) {
  const message = `Hello Kieraan, I am sending performance footage for booking ${bookingReference}.\n\nPlayer name: \nVideo or viewing link: `;
  return {
    whatsapp: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
    email: `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(`Performance footage - ${bookingReference}`)}&body=${encodeURIComponent(message)}`,
  };
}
