import { z } from "zod";
import type { Env } from "./types.ts";

export const emailKind = z.enum([
  "customer_confirmation",
  "admin_confirmation",
  "admin_payment_followup",
]);
export const snapshotSchema = z.object({
  booking: z.object({
    id: z.string().uuid(),
    reference: z.string(),
    start_time: z.string().datetime({ offset: true }),
    end_time: z.string().datetime({ offset: true }),
    timezone: z.string(),
    status: z.string(),
    notes: z.string().nullable(),
    consultation_format: z.enum(["online", "in_person"]).nullable().optional(),
  }),
  payment: z.object({
    id: z.string().uuid(),
    provider: z.string(),
    reference: z.string(),
    amount_cents: z.number().int().nonnegative(),
    currency: z.literal("ZAR"),
    paid_at: z.string().datetime({ offset: true }),
  }),
  service: z.object({ name: z.string(), duration_minutes: z.number() }),
  client: z.object({
    full_name: z.string(),
    email: z.string().email(),
    whatsapp: z.string(),
    age: z.number(),
    country: z.string(),
    position: z.string().nullable(),
    current_club: z.string().nullable(),
    previous_clubs: z.string().nullable(),
    playing_level: z.string().nullable(),
    help_required: z.string(),
    situation_description: z.string().nullable(),
    social_profile: z.string().nullable(),
    highlight_video_url: z.string().nullable(),
    guardian_name: z.string().nullable(),
    guardian_email: z.string().nullable(),
    guardian_phone: z.string().nullable(),
    guardian_consent: z.boolean(),
  }),
});
export type EmailSnapshot = z.infer<typeof snapshotSchema>;
export type EmailKind = z.infer<typeof emailKind>;
export type EmailConfig = {
  from: string;
  admin: string;
  siteUrl: string;
  apiKey: string;
  whatsapp?: string;
};
export type ResendMessage = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
};

export function getEmailConfig(env: Env): EmailConfig {
  const from = env("EMAIL_FROM")?.trim();
  const admin = env("ADMIN_NOTIFICATION_EMAIL")?.trim();
  const apiKey = env("RESEND_API_KEY")?.trim();
  const siteUrl = env("EMAIL_SITE_URL")?.trim();
  if (!from || !admin || !apiKey || !siteUrl || !z.string().email().safeParse(admin).success)
    throw new Error("Email Edge Function secrets are missing or invalid");
  const parsed = new URL(siteUrl);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || /[\r\n]/.test(from))
    throw new Error("Email Edge Function settings are invalid");
  return {
    from,
    admin,
    apiKey,
    siteUrl: parsed.origin,
    whatsapp: env("EMAIL_WHATSAPP")?.trim() || "",
  };
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export function buildBookingEmail(
  kind: EmailKind,
  snapshot: EmailSnapshot,
  config: EmailConfig,
  test = false,
): ResendMessage {
  const { booking, payment, client, service } = snapshot;
  const format = booking.consultation_format;
  const meetingFormat =
    format === "online"
      ? "Online (video call)"
      : format === "in_person"
        ? "In person"
        : "To be arranged";
  const delivery =
    format === "online"
      ? "KMGMT will contact you on your booking WhatsApp number to arrange your video call. Any joining link will be shared directly before your appointment. Please have a reliable internet connection and a device with a camera and microphone."
      : format === "in_person"
        ? "KMGMT will contact you on your booking WhatsApp number to agree on the venue before your appointment. Please confirm the location before travelling."
        : "KMGMT will contact you to arrange your consultation details.";
  const admin = kind !== "customer_confirmation";
  const followup = kind === "admin_payment_followup";
  const title = followup
    ? "Payment received — booking needs attention"
    : admin
      ? "Booking & Payment Received"
      : "Booking confirmed";
  const intro = followup
    ? "Payment was received, but the booking could not be confirmed. Contact the client to arrange another time or a refund."
    : admin
      ? "A consultation booking is confirmed and its PayFast payment has been verified."
      : `Hi ${client.full_name}, your payment has been received and your KMGMT consultation is confirmed.`;
  const date = (iso: string) =>
    new Intl.DateTimeFormat("en-ZA", {
      timeZone: booking.timezone,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  const time = (iso: string) =>
    new Intl.DateTimeFormat("en-ZA", {
      timeZone: booking.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  const money = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: payment.currency,
  }).format(payment.amount_cents / 100);
  const details: [string, string][] = [
    ["Booking reference", booking.reference],
    ["Consultation", service.name],
    ["Meeting format", meetingFormat],
    ["Date", date(booking.start_time)],
    ["Time", `${time(booking.start_time)} – ${time(booking.end_time)} (${booking.timezone})`],
    ["Duration", `${service.duration_minutes} minutes`],
    ["Booking status", booking.status],
    ["Client", client.full_name],
    ["Email", client.email],
    ["WhatsApp", client.whatsapp],
  ];
  const paid: [string, string][] = [
    ["Amount paid", money],
    ["Currency", payment.currency],
    ["Payment status", "Paid"],
    ["Payment method", "PayFast"],
    ["PayFast reference", payment.reference],
    ["Payment record", payment.id],
    ["Paid on", `${date(payment.paid_at)}, ${time(payment.paid_at)} (${booking.timezone})`],
  ];
  if (!followup) details.push(["Session arrangements", delivery]);
  const extra: [string, string][] = admin
    ? ([
        ["Booking ID", booking.id],
        ["Age", String(client.age)],
        ["Country", client.country],
        ["Position", client.position || ""],
        ["Current club", client.current_club || ""],
        ["Previous clubs", client.previous_clubs || ""],
        ["Playing level", client.playing_level || ""],
        ["Help required", client.help_required],
        ["Situation", client.situation_description || ""],
        ["Social profile", client.social_profile || ""],
        ["Highlight video", client.highlight_video_url || ""],
        ["Guardian", client.guardian_name || ""],
        ["Guardian email", client.guardian_email || ""],
        ["Guardian phone", client.guardian_phone || ""],
        ...(client.age < 18
          ? [["Guardian consent", client.guardian_consent ? "Yes" : "No"] as [string, string]]
          : []),
        ["Internal notes", booking.notes || ""],
      ].filter(([, value]) => !!value) as [string, string][])
    : [];
  const section = (name: string, rows: [string, string][]) =>
    `<h2 style="font-size:16px;margin:28px 0 12px">${name}</h2><table role="presentation" style="width:100%;border-collapse:collapse">${rows.map(([label, value]) => `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid #e8e4dc;color:#625d53;width:36%;vertical-align:top">${escapeHtml(label)}</td><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`).join("")}</table>`;
  const target = admin
    ? `${config.siteUrl}/admin/bookings`
    : `${config.siteUrl}/booking/success?booking=${encodeURIComponent(booking.id)}`;
  const notice = test ? "DELIVERY TEST: No booking was created and no payment was taken." : "";
  const whatsappDigits = (config.whatsapp || "").replace(/\D/g, "");
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hello KMGMT, regarding booking ${booking.reference}: `)}`
    : "";
  const changes =
    "For cancellation or rescheduling, please give at least 24 hours' notice. Refunds are handled manually; approved refunds take 3–5 working days. Statutory consumer rights still apply.";
  const supportHtml = `<p style="margin-top:24px;color:#625d53">${escapeHtml(changes)} <a href="${escapeHtml(config.siteUrl)}/terms" style="color:#625d53">Booking policies</a>.</p><p style="margin-top:16px;color:#625d53">${whatsappUrl ? `<a href="${escapeHtml(whatsappUrl)}" style="color:#625d53">Contact KMGMT on WhatsApp: ${escapeHtml(config.whatsapp || "")}</a><br>` : ""}For assistance, visit <a href="${escapeHtml(config.siteUrl)}/contact" style="color:#625d53">KMGMT contact</a>.</p>`;
  const linkLabel = admin ? "Open admin bookings" : "View your booking";
  return {
    from: config.from,
    to: [test || admin ? config.admin : client.email],
    subject: `${test ? "[TEST] " : ""}${title} | ${booking.reference} | KMGMT`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f3ee;color:#242424;font-family:Arial,sans-serif;font-size:14px;line-height:1.6"><table role="presentation" style="width:100%;padding:24px 12px"><tr><td><table role="presentation" style="width:100%;max-width:640px;margin:auto;background:#fffdf8"><tr><td style="padding:28px 32px;background:#242424;color:#fffdf8;border-bottom:2px solid #b49b66;font-size:26px;font-weight:bold;letter-spacing:3px">KMGMT</td></tr><tr><td style="padding:24px 32px"><h1 style="font-size:24px;margin:0 0 16px">${escapeHtml(title)}</h1>${notice ? `<p style="font-weight:bold">${notice}</p>` : ""}<p>${escapeHtml(intro)}</p>${section("Booking details", details)}${section("Payment receipt", paid)}${extra.length ? section("Client details", extra) : ""}${test ? "" : `<p style="margin-top:28px"><a href="${escapeHtml(target)}" style="color:#242424;font-weight:bold">${linkLabel}</a></p>`}${supportHtml}</td></tr></table></td></tr></table></body></html>`,
    text: [
      title,
      notice,
      intro,
      "",
      "Booking details",
      ...details.map(([key, value]) => `${key}: ${value}`),
      "",
      "Payment receipt",
      ...paid.map(([key, value]) => `${key}: ${value}`),
      ...(extra.length
        ? ["", "Client details", ...extra.map(([key, value]) => `${key}: ${value}`)]
        : []),
      ...(test ? [] : ["", `${linkLabel}: ${target}`]),
      "",
      changes,
      `Booking policies: ${config.siteUrl}/terms`,
      ...(whatsappUrl ? [`WhatsApp: ${config.whatsapp}`, whatsappUrl] : []),
      "",
      `Contact: ${config.siteUrl}/contact`,
    ]
      .filter((line) => line !== undefined)
      .join("\n"),
  };
}
