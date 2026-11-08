import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getEmailConfig, type EmailConfig, type ResendMessage } from "./booking-email.ts";
import { DeliveryError, sendResendEmail } from "./resend.ts";
import type { Env, PaymentDependencies } from "./types.ts";

const snapshotSchema = z.object({
  review: z.object({
    id: z.string().uuid(),
    client_name: z.string().min(2).max(80),
    role_or_context: z.string().nullable(),
    rating: z.number().int().min(1).max(5),
    content: z.string().min(10).max(1500),
    created_at: z.string().datetime({ offset: true }),
  }),
  email: z.string().email().max(254),
  reply: z
    .object({
      content: z.string().min(2).max(1500),
      updated_at: z.string().datetime({ offset: true }),
    })
    .optional(),
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
  kind: z.enum(["admin_review", "reviewer_reply"]),
  snapshot: snapshotSchema,
  request_payload: payloadSchema.nullable(),
});
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );
const date = (value: string) =>
  new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value)) + " SAST";

function buildReviewEmail(job: z.infer<typeof jobSchema>, config: EmailConfig): ResendMessage {
  const { review, email, reply } = job.snapshot;
  const admin = job.kind === "admin_review";
  if (!admin && !reply) throw new DeliveryError("missing_review_reply", true);
  const url = admin
    ? `${config.siteUrl}/admin/testimonials`
    : `${config.siteUrl}/?review=${encodeURIComponent(review.id)}#reviews`;
  const title = admin ? "A new review is live." : "KMGMT replied to your review.";
  const introduction = admin
    ? "A visitor has left a review on your website. It is already public and needs no approval."
    : `Hello ${review.client_name}, thank you for sharing your experience. Kieraan has published a response to your review.`;
  const details: [string, string][] = [
    ["Reviewer", review.client_name],
    ...(admin ? [["Email (private)", email] as [string, string]] : []),
    ...(review.role_or_context
      ? [["Role / context", review.role_or_context] as [string, string]]
      : []),
    ["Rating", `${review.rating} out of 5 stars`],
    ["Published", date(review.created_at)],
  ];
  const action = admin ? "View review and reply in your dashboard" : "View your review and reply";
  const footer = admin
    ? "Reply publicly through the dashboard. Replying directly to this email contacts the reviewer privately and does not publish a website response."
    : "Your email address stays private. This is a notification about your review, not a marketing subscription. For questions about your review or notifications, reply to this email to contact KMGMT.";
  return {
    from: config.from,
    to: [admin ? config.admin : email],
    reply_to: admin ? email : config.admin,
    subject: admin
      ? `New website review (${review.rating}/5) | KMGMT`
      : "Kieraan replied to your review | KMGMT",
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0;padding:24px 12px;background:#f5f3ee;color:#242424;font:14px/1.6 Arial,sans-serif"><table role="presentation" style="width:100%;max-width:640px;margin:auto;background:#fffdf8"><tr><td style="padding:24px 28px;background:#242424;color:#fffdf8;border-bottom:2px solid #b49b66;font-size:26px;font-weight:bold;letter-spacing:3px">KMGMT</td></tr><tr><td style="padding:28px"><h1 style="font-size:24px;margin:0 0 16px">${escape(title)}</h1><p>${escape(introduction)}</p><table role="presentation" style="width:100%;border-collapse:collapse">${details.map(([label, value]) => `<tr><td style="padding:9px 12px 9px 0;border-bottom:1px solid #e8e4dc;vertical-align:top;color:#625d53">${escape(label)}</td><td style="padding:9px 0;border-bottom:1px solid #e8e4dc;overflow-wrap:anywhere">${escape(value)}</td></tr>`).join("")}</table><h2 style="font-size:16px;margin:24px 0 12px">${admin ? "Review" : "Your review"}</h2><p style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(review.content)}</p>${reply ? `<div style="margin:24px 0;border-left:2px solid #b49b66;padding:8px 18px;background:#f5f3ee"><h2 style="font-size:16px;margin:8px 0">Response from KMGMT</h2><p style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(reply.content)}</p><p style="font-size:12px;color:#625d53">${escape(date(reply.updated_at))}</p></div>` : ""}<p style="margin:28px 0"><a href="${escape(url)}" style="display:inline-block;padding:12px 18px;background:#242424;color:#fffdf8;text-decoration:none;border-radius:4px;font-weight:bold">${escape(action)}</a></p><p style="font-size:12px;color:#625d53">${escape(footer)}</p></td></tr></table></body></html>`,
    text: [
      title,
      "",
      introduction,
      "",
      ...details.map(([label, value]) => `${label}: ${value}`),
      "",
      admin ? "Review" : "Your review",
      review.content,
      ...(reply ? ["", "Response from KMGMT", reply.content, date(reply.updated_at)] : []),
      "",
      action,
      url,
      "",
      footer,
    ].join("\n"),
  };
}

async function processReviewEmails(deps: PaymentDependencies) {
  const config = getEmailConfig(deps.env);
  const { data, error } = await deps.supabase.rpc("claim_review_email_jobs", { p_limit: 4 });
  if (error) throw new Error("Review email queue unavailable");
  const jobs = z
    .array(z.object({ id: z.string().uuid(), lock_token: z.string().uuid() }).passthrough())
    .parse(data);
  let sent = 0,
    failed = 0;
  for (const [index, raw] of jobs.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 650));
    try {
      const parsed = jobSchema.safeParse(raw);
      if (!parsed.success) throw new DeliveryError("invalid_review_snapshot", true);
      const job = parsed.data;
      const proposed = job.request_payload ?? buildReviewEmail(job, config);
      const frozen = await deps.supabase.rpc("freeze_review_email_request", {
        p_id: job.id,
        p_lock: job.lock_token,
        p_payload: proposed,
      });
      if (frozen.error) throw new DeliveryError("review_payload_storage_failed");
      const message = payloadSchema.parse(frozen.data);
      const id = await sendResendEmail(message, config, `kmgmt-review-email/${job.id}`);
      const saved = await deps.supabase.rpc("finish_review_email_job", {
        p_id: job.id,
        p_lock: job.lock_token,
        p_resend_id: id,
      });
      if (saved.error) throw new DeliveryError("review_receipt_storage_failed");
      sent++;
    } catch (error) {
      const code = error instanceof DeliveryError ? error.code : "review_email_processing_failed";
      const saved = await deps.supabase.rpc("finish_review_email_job", {
        p_id: raw.id,
        p_lock: raw.lock_token,
        p_error_code: code,
        p_permanent: error instanceof DeliveryError && error.permanent,
      });
      if (saved.error) console.error("Could not record review email retry", raw.id);
      console.error("Review email delivery deferred", raw.id, code);
      failed++;
    }
  }
  return { sent, failed };
}

export async function handleReviewEmailWorker(
  request: Request,
  env: Env,
  database: () => PaymentDependencies["supabase"],
) {
  if (request.method !== "POST")
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  const expected = env("EMAIL_WORKER_TOKEN"),
    supplied = request.headers.get("x-email-worker-token");
  if (
    !expected ||
    expected.length < 32 ||
    !supplied ||
    !timingSafeEqual(
      createHash("sha256").update(expected).digest(),
      createHash("sha256").update(supplied).digest(),
    )
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const raw = await request.text();
    if (raw.length > 256) throw new Error("Invalid body");
    z.object({})
      .strict()
      .parse(JSON.parse(raw || "{}"));
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    return Response.json({
      ok: true,
      ...(await processReviewEmails({ env, supabase: database() })),
    });
  } catch {
    console.error("Review email worker temporarily unavailable");
    return Response.json({ error: "Review email delivery unavailable" }, { status: 503 });
  }
}
