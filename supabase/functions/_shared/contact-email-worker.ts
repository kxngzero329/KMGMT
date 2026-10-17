import { z } from "zod";
import { getEmailConfig, type EmailConfig, type ResendMessage } from "./booking-email.ts";
import { DeliveryError, sendResendEmail } from "./resend.ts";
import type { PaymentDependencies } from "./types.ts";

const enquirySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().nullable(),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(5).max(3000),
  created_at: z.string().datetime({ offset: true }),
});
const payloadSchema = z.object({
  from: z.string(),
  to: z.array(z.string().email()).length(1),
  reply_to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  text: z.string(),
});
const jobSchema = z.object({
  id: z.string().uuid(),
  lock_token: z.string().uuid(),
  snapshot: enquirySchema,
  request_payload: payloadSchema.nullable(),
});

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );

function buildContactEmail(
  enquiry: z.infer<typeof enquirySchema>,
  config: EmailConfig,
): ResendMessage {
  const received =
    new Intl.DateTimeFormat("en-ZA", {
      timeZone: "Africa/Johannesburg",
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(enquiry.created_at)) + " SAST";
  const details: [string, string][] = [
    ["Name", enquiry.name],
    ["Email", enquiry.email],
    ["WhatsApp / phone", enquiry.phone || "Not supplied"],
    ["Subject", enquiry.subject],
    ["Received", received],
    ["Enquiry reference", enquiry.id],
  ];
  const adminUrl = `${config.siteUrl}/admin/enquiries`;
  return {
    from: config.from,
    to: [config.admin],
    reply_to: enquiry.email,
    subject: `New website enquiry | ${enquiry.subject.replace(/[\r\n]+/g, " ")} | KMGMT`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0;padding:24px 12px;background:#f5f3ee;color:#242424;font:14px/1.6 Arial,sans-serif"><table role="presentation" style="width:100%;max-width:640px;margin:auto;background:#fffdf8"><tr><td style="padding:24px 28px;background:#242424;color:#fffdf8;border-bottom:2px solid #b49b66;font-size:26px;font-weight:bold;letter-spacing:3px">KMGMT</td></tr><tr><td style="padding:28px"><h1 style="font-size:24px;margin:0 0 16px">New website enquiry</h1><p>A visitor submitted the contact form on kmgmt.co.za.</p><table role="presentation" style="width:100%;border-collapse:collapse">${details.map(([label, value]) => `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid #e8e4dc;vertical-align:top;color:#625d53">${escape(label)}</td><td style="padding:10px 0;border-bottom:1px solid #e8e4dc;overflow-wrap:anywhere">${escape(value)}</td></tr>`).join("")}</table><h2 style="font-size:16px;margin:24px 0 12px">Message</h2><p style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(enquiry.message)}</p><p>Reply to this email to respond directly to ${escape(enquiry.name)} at ${escape(enquiry.email)}.</p><p style="margin-top:24px"><a href="${escape(adminUrl)}" style="color:#242424;font-weight:bold">Open admin enquiries</a></p></td></tr></table></body></html>`,
    text: [
      "New KMGMT website enquiry",
      "",
      ...details.map(([label, value]) => `${label}: ${value}`),
      "",
      "Message",
      enquiry.message,
      "",
      `Reply to this email to respond to ${enquiry.email}.`,
      adminUrl,
    ].join("\n"),
  };
}

export async function processContactEmails(deps: PaymentDependencies) {
  const config = getEmailConfig(deps.env);
  const { data, error } = await deps.supabase.rpc("claim_contact_email_jobs", { p_limit: 4 });
  if (error) throw new Error("Contact email queue unavailable");
  const jobs = z
    .array(z.object({ id: z.string().uuid(), lock_token: z.string().uuid() }).passthrough())
    .parse(data);
  let sent = 0;
  let failed = 0;
  for (const [index, raw] of jobs.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 650));
    try {
      const parsed = jobSchema.safeParse(raw);
      if (!parsed.success) throw new DeliveryError("invalid_contact_snapshot", true);
      const job = parsed.data;
      const proposed = job.request_payload ?? buildContactEmail(job.snapshot, config);
      const frozen = await deps.supabase.rpc("freeze_contact_email_request", {
        p_id: job.id,
        p_lock: job.lock_token,
        p_payload: proposed,
      });
      if (frozen.error) throw new DeliveryError("contact_payload_storage_failed");
      const message = payloadSchema.parse(frozen.data);
      const id = await sendResendEmail(message, config, `kmgmt-contact-email/${job.id}`);
      const saved = await deps.supabase.rpc("finish_contact_email_job", {
        p_id: job.id,
        p_lock: job.lock_token,
        p_resend_id: id,
      });
      if (saved.error) throw new DeliveryError("contact_receipt_storage_failed");
      sent++;
    } catch (error) {
      const code = error instanceof DeliveryError ? error.code : "contact_email_processing_failed";
      const saved = await deps.supabase.rpc("finish_contact_email_job", {
        p_id: raw.id,
        p_lock: raw.lock_token,
        p_error_code: code,
        p_permanent: error instanceof DeliveryError && error.permanent,
      });
      if (saved.error) console.error("Could not record contact email retry", raw.id);
      console.error("Contact email delivery deferred", raw.id, code);
      failed++;
    }
  }
  return { sent, failed };
}
