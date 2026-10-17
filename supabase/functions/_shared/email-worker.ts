import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Env, PaymentDependencies } from "./types.ts";
import { DeliveryError, sendResendEmail } from "./resend.ts";
import { processContactEmails } from "./contact-email-worker.ts";
export { sendResendEmail } from "./resend.ts";
import {
  buildBookingEmail,
  emailKind,
  getEmailConfig,
  snapshotSchema,
  type EmailSnapshot,
} from "./booking-email.ts";

const messageSchema = z.object({
  from: z.string(),
  to: z.array(z.string().email()).length(1),
  subject: z.string(),
  html: z.string(),
  text: z.string(),
});
const jobSchema = z.object({
  id: z.string().uuid(),
  lock_token: z.string().uuid(),
  kind: emailKind,
  snapshot: snapshotSchema,
  request_payload: messageSchema.nullable(),
});

/** Only called from Edge Functions; database leases and provider keys protect retries. */
export async function processBookingEmails(deps: PaymentDependencies) {
  const config = getEmailConfig(deps.env);
  const { data, error } = await deps.supabase.rpc("claim_booking_email_jobs", { p_limit: 4 });
  if (error) throw new Error("Email queue unavailable");
  const jobs = z
    .array(z.object({ id: z.string().uuid(), lock_token: z.string().uuid() }).passthrough())
    .parse(data);
  let sent = 0;
  let failed = 0;
  for (const [index, raw] of jobs.entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, 650));
    try {
      const parsed = jobSchema.safeParse(raw);
      if (!parsed.success) throw new DeliveryError("invalid_email_snapshot", true);
      const job = parsed.data;
      if (
        (job.kind === "customer_confirmation" || job.kind === "admin_confirmation") &&
        job.snapshot.booking.status !== "confirmed"
      )
        throw new DeliveryError("booking_not_confirmed", true);
      const proposed = job.request_payload ?? buildBookingEmail(job.kind, job.snapshot, config);
      const frozen = await deps.supabase.rpc("freeze_booking_email_request", {
        p_id: job.id,
        p_lock: job.lock_token,
        p_payload: proposed,
      });
      if (frozen.error) throw new DeliveryError("email_payload_storage_failed");
      const message = messageSchema.parse(frozen.data);
      const id = await sendResendEmail(message, config, `kmgmt-booking-email/${job.id}`);
      const saved = await deps.supabase.rpc("finish_booking_email_job", {
        p_id: job.id,
        p_lock: job.lock_token,
        p_resend_id: id,
      });
      if (saved.error) throw new DeliveryError("email_receipt_storage_failed");
      sent++;
    } catch (error) {
      const code = error instanceof DeliveryError ? error.code : "email_processing_failed";
      const permanent = error instanceof DeliveryError && error.permanent;
      const saved = await deps.supabase.rpc("finish_booking_email_job", {
        p_id: raw.id,
        p_lock: raw.lock_token,
        p_error_code: code,
        p_permanent: permanent,
      });
      if (saved.error) console.error("Could not record email retry", raw.id);
      console.error("Booking email delivery deferred", raw.id, code);
      failed++;
    }
  }
  return { sent, failed };
}

function authorized(request: Request, env: Env) {
  const expected = env("EMAIL_WORKER_TOKEN");
  const supplied = request.headers.get("x-email-worker-token");
  if (!expected || expected.length < 32 || !supplied) return false;
  return timingSafeEqual(
    createHash("sha256").update(expected).digest(),
    createHash("sha256").update(supplied).digest(),
  );
}

// A protected delivery check sends both sample templates ONLY to the admin secret.
// It creates no booking/payment rows and cannot accept arbitrary recipients.
function testSnapshot(): EmailSnapshot {
  return {
    booking: {
      id: "00000000-0000-4000-8000-000000000001",
      reference: "EMAIL-SETUP-TEST",
      start_time: "2030-01-01T10:00:00Z",
      end_time: "2030-01-01T11:00:00Z",
      timezone: "Africa/Johannesburg",
      status: "confirmed",
      notes: null,
    },
    payment: {
      id: "00000000-0000-4000-8000-000000000002",
      provider: "payfast",
      reference: "TEST-NO-PAYMENT-TAKEN",
      amount_cents: 12345,
      currency: "ZAR",
      paid_at: "2030-01-01T09:00:00Z",
    },
    service: { name: "Email delivery test consultation", duration_minutes: 60 },
    client: {
      full_name: "KMGMT Email Test",
      email: "test@example.com",
      whatsapp: "+27820000000",
      age: 25,
      country: "South Africa",
      position: null,
      current_club: null,
      previous_clubs: null,
      playing_level: null,
      help_required: "Email delivery test",
      situation_description: null,
      social_profile: null,
      highlight_video_url: null,
      guardian_name: null,
      guardian_email: null,
      guardian_phone: null,
      guardian_consent: false,
    },
  };
}

export async function handleEmailWorker(
  request: Request,
  env: Env,
  database: () => PaymentDependencies["supabase"],
) {
  if (request.method !== "POST")
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  if (!authorized(request, env)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const raw = await request.text();
  if (raw.length > 256) return Response.json({ error: "Invalid request" }, { status: 400 });
  let input: { test?: true | undefined };
  try {
    input = z
      .object({ test: z.literal(true).optional() })
      .strict()
      .parse(JSON.parse(raw || "{}"));
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    if (input.test) {
      const config = getEmailConfig(env);
      const key = createHash("sha256")
        .update(env("EMAIL_WORKER_TOKEN")!)
        .digest("hex")
        .slice(0, 20);
      const customer = await sendResendEmail(
        buildBookingEmail("customer_confirmation", testSnapshot(), config, true),
        config,
        `kmgmt-email-setup/${key}/customer`,
      );
      await new Promise((resolve) => setTimeout(resolve, 650));
      const admin = await sendResendEmail(
        buildBookingEmail("admin_confirmation", testSnapshot(), config, true),
        config,
        `kmgmt-email-setup/${key}/admin`,
      );
      return Response.json({
        ok: true,
        test: true,
        customer_email_id: customer,
        admin_email_id: admin,
      });
    }
    const deps = { env, supabase: database() };
    // A problem with one queue must not prevent processing the other queue.
    let booking = { sent: 0, failed: 0 };
    let contact = { sent: 0, failed: 0 };
    let unavailable = false;
    try {
      booking = await processBookingEmails(deps);
    } catch {
      unavailable = true;
      console.error("Booking email queue temporarily unavailable");
    }
    if (booking.sent + booking.failed > 0) await new Promise((resolve) => setTimeout(resolve, 650));
    try {
      contact = await processContactEmails(deps);
    } catch {
      unavailable = true;
      console.error("Contact email queue temporarily unavailable");
    }
    return Response.json(
      {
        ok: !unavailable,
        sent: booking.sent + contact.sent,
        failed: booking.failed + contact.failed,
      },
      { status: unavailable ? 503 : 200 },
    );
  } catch (error) {
    const code = error instanceof DeliveryError ? error.code : "email_worker_unavailable";
    console.error("Email worker unavailable", code);
    return Response.json({ ok: false, error: code }, { status: 503 });
  }
}
