import { z } from "zod";
import { Buffer } from "node:buffer";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { getEmailConfig, snapshotSchema, type EmailConfig } from "./booking-email.ts";
import type { Env } from "./types.ts";
import type { ResendEnvelope } from "./resend.ts";

export const eftSnapshotSchema = z.object({
  booking: snapshotSchema.shape.booking,
  client: snapshotSchema.shape.client,
  service: snapshotSchema.shape.service,
  payment: z.object({
    id: z.string().uuid(),
    provider: z.literal("eft"),
    status: z.literal("pending"),
    amount_cents: z.number().int().positive(),
    currency: z.literal("ZAR"),
    invoice_number: z.string().min(1),
    invoice_issued_at: z.string().datetime({ offset: true }),
  }),
});
type EftSnapshot = z.infer<typeof eftSnapshotSchema>;
export type EftConfig = {
  email: EmailConfig;
  bank: { name: string; holder: string; number: string; type: string };
  proofEmail: string;
  whatsapp: string;
};

export function getEftConfig(env: Env): EftConfig {
  const bank = {
    name: env("EFT_BANK_NAME")?.trim() || "",
    holder: env("EFT_ACCOUNT_HOLDER")?.trim() || "",
    number: env("EFT_ACCOUNT_NUMBER")?.trim() || "",
    type: env("EFT_ACCOUNT_TYPE")?.trim() || "",
  };
  const proofEmail = env("EFT_PROOF_EMAIL")?.trim() || "";
  const whatsapp = env("EMAIL_WHATSAPP")?.trim() || "";
  if (
    Object.values(bank).some((value) => !value || /[\r\n]/.test(value)) ||
    !/^\d{6,32}$/.test(bank.number) ||
    !z.string().email().safeParse(proofEmail).success ||
    !/^\d{7,15}$/.test(whatsapp.replace(/\D/g, ""))
  )
    throw new Error("EFT configuration unavailable");
  return { email: getEmailConfig(env), bank, proofEmail, whatsapp };
}

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );

function display(snapshot: EftSnapshot) {
  const date = (iso: string) =>
    new Intl.DateTimeFormat("en-ZA", {
      timeZone: snapshot.booking.timezone,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  const time = (iso: string) =>
    new Intl.DateTimeFormat("en-ZA", {
      timeZone: snapshot.booking.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  return { date, time, amount: `R ${(snapshot.payment.amount_cents / 100).toFixed(2)}` };
}

// This PDF is generated only in an Edge Function. It is attached to private
// emails and is never exposed through public storage or a frontend API response.
async function invoicePdf(snapshot: EftSnapshot, config: EftConfig) {
  const doc = await PDFDocument.create();
  doc.setTitle(`KMGMT invoice ${snapshot.payment.invoice_number}`);
  doc.setAuthor("KMGMT");
  doc.setCreationDate(new Date(snapshot.payment.invoice_issued_at));
  doc.setModificationDate(new Date(snapshot.payment.invoice_issued_at));
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.14, 0.14, 0.14),
    gold = rgb(0.7, 0.61, 0.4),
    muted = rgb(0.38, 0.36, 0.33);
  const text = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[^\x20-\x7e]/g, " ");
  let page = doc.addPage([595.28, 841.89]);
  let y = 0;
  const header = () => {
    page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: rgb(1, 0.992, 0.973) });
    page.drawRectangle({ x: 0, y: 737, width: 595.28, height: 105, color: ink });
    page.drawText("KMGMT", { x: 42, y: 790, font: bold, size: 26, color: rgb(1, 0.99, 0.96) });
    page.drawText("INVOICE | EFT PAYMENT", { x: 330, y: 794, font: bold, size: 12, color: gold });
    page.drawText(text(snapshot.payment.invoice_number), {
      x: 330,
      y: 770,
      font: regular,
      size: 11,
      color: rgb(1, 1, 1),
    });
    page.drawRectangle({ x: 0, y: 735, width: 595.28, height: 2, color: gold });
    y = 708;
  };
  header();
  const write = (value: string, heading = false) => {
    const font = heading ? bold : regular,
      size = heading ? 12 : 10;
    // Break long email addresses/words as well as ordinary paragraphs.
    const lines: string[] = [];
    let current = "";
    for (const char of text(value)) {
      if (font.widthOfTextAtSize(current + char, size) > 510) {
        const space = current.lastIndexOf(" ");
        if (space > current.length / 2) {
          lines.push(current.slice(0, space));
          current = current.slice(space + 1) + char;
        } else {
          lines.push(current);
          current = char;
        }
      } else current += char;
    }
    lines.push(current);
    for (const line of lines) {
      if (y < 55) {
        page = doc.addPage([595.28, 841.89]);
        header();
      }
      page.drawText(line, { x: 42, y, font, size, color: heading ? ink : muted });
      y -= heading ? 22 : 15;
    }
  };
  const gap = () => {
    y -= 12;
  };
  const fmt = display(snapshot);
  write("PAYMENT PENDING - THIS INVOICE IS NOT A RECEIPT", true);
  write(`Issued: ${fmt.date(snapshot.payment.invoice_issued_at)} | Due on receipt`);
  write(`Booking reference / payment reference: ${snapshot.booking.reference}`);
  write(`Issued by KMGMT | ${config.email.siteUrl} | ${config.proofEmail}`);
  gap();
  write("BILL TO", true);
  write(snapshot.client.full_name);
  write(snapshot.client.email);
  write(snapshot.client.whatsapp);
  gap();
  write("YOUR ONLINE CONSULTATION", true);
  write(snapshot.service.name);
  write(
    `${fmt.date(snapshot.booking.start_time)}, ${fmt.time(snapshot.booking.start_time)} - ${fmt.time(snapshot.booking.end_time)} (${snapshot.booking.timezone})`,
  );
  write(`Duration: ${snapshot.service.duration_minutes} minutes | Quantity: 1`);
  gap();
  write(`TOTAL DUE: ${fmt.amount} ZAR`, true);
  gap();
  write("PAY BY EFT", true);
  write(`Bank: ${config.bank.name}`);
  write(`Account holder: ${config.bank.holder}`);
  write(`Account number: ${config.bank.number}`);
  write(`Account type: ${config.bank.type}`);
  write(`Use this payment reference: ${snapshot.booking.reference}`);
  gap();
  write("PROOF OF PAYMENT REQUIRED", true);
  write(
    `Pay and send proof before your consultation. Attach the proof to a WhatsApp message (${config.whatsapp}) or an email to ${config.proofEmail}, including your booking reference.`,
  );
  write(
    "Your appointment is reserved, but payment remains pending until Kieraan verifies receipt of funds. Sending proof does not automatically mark this invoice paid.",
  );
  gap();
  write(
    "Online consultations only, unless Kieraan personally confirms an exception through WhatsApp. Website booking and payment are still required.",
  );
  write(`Booking policies: ${config.email.siteUrl}/terms`);
  return Buffer.from(await doc.save()).toString("base64");
}

export async function buildEftEmail(
  kind: "customer_invoice" | "admin_notification",
  snapshot: EftSnapshot,
  config: EftConfig,
): Promise<ResendEnvelope> {
  const admin = kind === "admin_notification";
  const { booking, client, service, payment } = snapshot;
  const fmt = display(snapshot);
  const proofMessage = `Hello Kieraan, attached is my proof of EFT payment for booking ${booking.reference}, invoice ${payment.invoice_number}.`;
  const whatsappUrl = `https://wa.me/${config.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(proofMessage)}`;
  const mailUrl = `mailto:${config.proofEmail}?subject=${encodeURIComponent(`EFT proof of payment - ${booking.reference}`)}&body=${encodeURIComponent(proofMessage)}`;
  const rows: [string, string][] = [
    ["Booking reference", booking.reference],
    ["Invoice", payment.invoice_number],
    ["Consultation", service.name],
    ["Meeting format", "Online (video call)"],
    ["Date", fmt.date(booking.start_time)],
    [
      "Time",
      `${fmt.time(booking.start_time)} - ${fmt.time(booking.end_time)} (${booking.timezone})`,
    ],
    ["Duration", `${service.duration_minutes} minutes`],
    ["Client", client.full_name],
    ["Email", client.email],
    ["WhatsApp", client.whatsapp],
    ["Payment method", "EFT / bank transfer"],
    ["Payment status", "Awaiting EFT payment - not paid"],
    ["Amount due", `${fmt.amount} ZAR`],
    ["Invoice issued", fmt.date(payment.invoice_issued_at)],
    ["Payment reference", booking.reference],
  ];
  const bankRows: [string, string][] = [
    ["Bank", config.bank.name],
    ["Account holder", config.bank.holder],
    ["Account number", config.bank.number],
    ["Account type", config.bank.type],
  ];
  const clientRows: [string, string][] = admin
    ? ([
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
  const table = (items: [string, string][]) =>
    `<table role="presentation" style="width:100%;border-collapse:collapse">${items.map(([key, value]) => `<tr><td style="width:36%;padding:10px 12px 10px 0;border-bottom:1px solid #e8e4dc;vertical-align:top;color:#625d53">${escape(key)}</td><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;white-space:pre-wrap;overflow-wrap:anywhere">${escape(value)}</td></tr>`).join("")}</table>`;
  const title = admin ? "New EFT booking — payment pending" : "Booking confirmation & EFT invoice";
  const intro = admin
    ? "A client has reserved an online consultation and selected EFT. Their invoice is attached. No funds have been verified; review proof and your bank account before marking the payment received in admin."
    : `Hi ${client.full_name}, your consultation slot is reserved. Your invoice is attached. Please pay by EFT using the details below and send proof of payment before your consultation. Payment is still pending and will be verified manually by Kieraan.`;
  const action = admin
    ? `${config.email.siteUrl}/admin/bookings`
    : `${config.email.siteUrl}/booking/success?booking=${encodeURIComponent(booking.id)}`;
  const proof =
    "Attach your proof of payment to your WhatsApp message or email and include your booking reference. The buttons open your chosen app; please attach the proof before sending. Do not send card details, banking passwords, PINs or one-time passwords.";
  const delivery =
    "Kieraan will arrange your online video call through your booking WhatsApp number. Any joining link is shared before the appointment. Consultations are online unless Kieraan personally confirms an alternative through WhatsApp. Your website booking and payment are still required.";
  const policies =
    "Give at least 24 hours' notice to cancel or reschedule. Refunds are handled manually; approved refunds take 3–5 working days. Statutory consumer rights still apply.";
  return {
    from: config.email.from,
    to: [admin ? config.email.admin : client.email],
    reply_to: admin ? client.email : config.proofEmail,
    subject: `${title} | ${booking.reference} | KMGMT`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0;background:#f5f3ee;color:#242424;font:14px/1.6 Arial,sans-serif"><table role="presentation" style="width:100%;padding:24px 12px"><tr><td><table role="presentation" style="width:100%;max-width:660px;margin:auto;background:#fffdf8"><tr><td style="padding:28px 32px;background:#242424;color:#fffdf8;border-bottom:2px solid #b49b66;font-size:26px;font-weight:bold;letter-spacing:3px">KMGMT</td></tr><tr><td style="padding:28px 32px"><h1 style="font-size:24px;margin:0 0 16px">${escape(title)}</h1><p>${escape(intro)}</p><p style="padding:14px;background:#f5f3ee;border-left:2px solid #b49b66;font-weight:bold">EFT payment pending · ${escape(fmt.amount)} ZAR due<br>Use reference: ${escape(booking.reference)}</p><h2 style="font-size:16px;margin-top:28px">Booking &amp; invoice details</h2>${table(rows)}<h2 style="font-size:16px;margin-top:28px">Bank details for EFT</h2>${table(bankRows)}<h2 style="font-size:16px;margin-top:28px">Send proof of payment</h2><p>${escape(proof)}</p><p><a href="${escape(whatsappUrl)}" style="display:inline-block;margin:6px 8px 6px 0;padding:12px 16px;background:#242424;color:#fffdf8;text-decoration:none;font-weight:bold;border-radius:4px">Send proof via WhatsApp</a><a href="${escape(mailUrl)}" style="display:inline-block;margin:6px 0;padding:12px 16px;background:#b49b66;color:#242424;text-decoration:none;font-weight:bold;border-radius:4px">Send proof via email</a></p><p style="font-size:12px;color:#625d53">WhatsApp: ${escape(config.whatsapp)}<br>Email: ${escape(config.proofEmail)}</p>${clientRows.length ? `<h2 style="font-size:16px;margin-top:28px">Client details</h2>${table(clientRows)}` : ""}<p style="margin-top:24px">${escape(delivery)}</p><p><a href="${escape(action)}" style="color:#242424;font-weight:bold">${admin ? "Open admin bookings" : "View your booking"}</a></p><p style="color:#625d53;font-size:12px">${escape(policies)} <a href="${escape(config.email.siteUrl)}/terms" style="color:#625d53">Booking policies</a></p></td></tr></table></td></tr></table></body></html>`,
    text: [
      title,
      intro,
      "",
      ...rows.map(([key, value]) => `${key}: ${value}`),
      "",
      "Bank details for EFT",
      ...bankRows.map(([key, value]) => `${key}: ${value}`),
      "",
      proof,
      `Send proof via WhatsApp: ${whatsappUrl}`,
      `Send proof via email: ${config.proofEmail}`,
      mailUrl,
      "",
      ...clientRows.map(([key, value]) => `${key}: ${value}`),
      delivery,
      action,
      policies,
      `${config.email.siteUrl}/terms`,
    ].join("\n"),
    attachments: [
      {
        filename: `KMGMT-${payment.invoice_number}.pdf`,
        content: await invoicePdf(snapshot, config),
      },
    ],
  };
}
