import { z } from "zod";
import { createHash, timingSafeEqual } from "node:crypto";
import { buildEftEmail, eftSnapshotSchema, getEftConfig } from "./eft-email.ts";
import { DeliveryError, sendResendEmail } from "./resend.ts";
import type { Env, PaymentDependencies } from "./types.ts";

const payloadSchema = z.object({
  from: z.string(),
  to: z.array(z.string().email()).length(1),
  reply_to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  text: z.string(),
  attachments: z
    .array(z.object({ filename: z.string().endsWith(".pdf"), content: z.string().min(1) }))
    .length(1)
    .optional(),
});
const jobSchema = z.object({
  id: z.string().uuid(),
  lock_token: z.string().uuid(),
  kind: z.enum(["customer_invoice", "admin_notification"]),
  snapshot: eftSnapshotSchema,
  request_payload: payloadSchema.nullable(),
});

export async function processEftEmails(deps: PaymentDependencies) {
  const config = getEftConfig(deps.env);
  const { data, error } = await deps.supabase.rpc("claim_eft_email_jobs", { p_limit: 2 });
  if (error) throw new Error("EFT email queue unavailable");
  const jobs = z
    .array(z.object({ id: z.string().uuid(), lock_token: z.string().uuid() }).passthrough())
    .parse(data);
  let sent = 0,
    failed = 0;
  for (const [index, raw] of jobs.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 650));
    try {
      const parsed = jobSchema.safeParse(raw);
      if (!parsed.success) throw new DeliveryError("invalid_eft_snapshot", true);
      const job = parsed.data;
      const proposed = job.request_payload ?? (await buildEftEmail(job.kind, job.snapshot, config));
      const frozen = await deps.supabase.rpc("freeze_eft_email_request", {
        p_id: job.id,
        p_lock: job.lock_token,
        p_payload: proposed,
      });
      if (frozen.error) throw new DeliveryError("eft_payload_storage_failed");
      const message = payloadSchema.parse(frozen.data);
      if (job.kind === "customer_invoice" && message.attachments?.length !== 1)
        throw new DeliveryError("customer_invoice_attachment_missing", true);
      const id = await sendResendEmail(message, config.email, `kmgmt-eft-email/${job.id}`);
      const saved = await deps.supabase.rpc("finish_eft_email_job", {
        p_id: job.id,
        p_lock: job.lock_token,
        p_resend_id: id,
      });
      if (saved.error) throw new DeliveryError("eft_receipt_storage_failed");
      sent++;
    } catch (error) {
      const code = error instanceof DeliveryError ? error.code : "eft_email_processing_failed";
      const saved = await deps.supabase.rpc("finish_eft_email_job", {
        p_id: raw.id,
        p_lock: raw.lock_token,
        p_error_code: code,
        p_permanent: error instanceof DeliveryError && error.permanent,
      });
      if (saved.error) console.error("Could not record EFT email retry", raw.id);
      console.error("EFT invoice delivery deferred", raw.id, code);
      failed++;
    }
  }
  return { sent, failed };
}

export async function handleEftEmailWorker(
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
  const raw = await request.text();
  try {
    if (raw.length > 256) throw new Error("Invalid body");
    z.object({})
      .strict()
      .parse(JSON.parse(raw || "{}"));
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    return Response.json({ ok: true, ...(await processEftEmails({ env, supabase: database() })) });
  } catch {
    console.error("EFT email worker temporarily unavailable");
    return Response.json({ ok: false, error: "EFT delivery unavailable" }, { status: 503 });
  }
}
