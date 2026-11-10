import { contactDetails, performanceFootagePolicy } from "../../../src/content/site.ts";
import { performanceFootageLinks } from "../../../src/lib/performance-footage.ts";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );

export function buildFootageEmailSection(
  reference: string,
  contact: { email: string; whatsapp: string } = contactDetails,
) {
  const links = performanceFootageLinks(reference, contact);
  const reminder =
    "The buttons open WhatsApp or your email app. Attach your video files or paste a working viewing link before sending. You can also reply directly to this booking confirmation email.";
  return {
    html: `<div style="margin:24px 0;padding:18px;background:#f5f3ee;border-left:2px solid #b49b66"><h2 style="font-size:17px;margin:0 0 12px">${escape(performanceFootagePolicy.title)}</h2><p>${escape(performanceFootagePolicy.notice)}</p><p>${escape(performanceFootagePolicy.channels)}</p><p>${escape(performanceFootagePolicy.instructions)}</p><p><a href="${escape(links.whatsapp)}" style="display:inline-block;margin:6px 8px 6px 0;padding:12px 16px;background:#242424;color:#fffdf8;text-decoration:none;font-weight:bold;border-radius:4px">Send footage via WhatsApp</a><a href="${escape(links.email)}" style="display:inline-block;margin:6px 0;padding:12px 16px;background:#b49b66;color:#242424;text-decoration:none;font-weight:bold;border-radius:4px">Send footage via email</a></p><p style="font-size:12px;color:#625d53">${escape(reminder)}</p><p style="font-size:12px;color:#625d53">WhatsApp: ${escape(contact.whatsapp)}<br>Email: ${escape(contact.email)}<br>Booking reference: ${escape(reference)}</p></div>`,
    text: [
      performanceFootagePolicy.title,
      performanceFootagePolicy.notice,
      performanceFootagePolicy.channels,
      performanceFootagePolicy.instructions,
      `Booking reference: ${reference}`,
      `WhatsApp: ${contact.whatsapp}`,
      `Send footage via WhatsApp: ${links.whatsapp}`,
      `Email: ${contact.email}`,
      `Send footage via email: ${links.email}`,
      reminder,
    ].join("\n"),
  };
}
