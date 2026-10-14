import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildBookingEmail,
  getEmailConfig,
  type EmailSnapshot,
} from "../../../supabase/functions/_shared/booking-email.ts";
import {
  handleEmailWorker,
  processBookingEmails,
} from "../../../supabase/functions/_shared/email-worker.ts";
import type { PaymentDependencies } from "../../../supabase/functions/_shared/types.ts";

const bookingId = "11111111-1111-4111-8111-111111111111";
const paymentId = "22222222-2222-4222-8222-222222222222";
const jobId = "33333333-3333-4333-8333-333333333333";
const lock = "44444444-4444-4444-8444-444444444444";
const variables: Record<string, string> = {
  EMAIL_FROM: "KMGMT <bookings@kmgmt.example>",
  ADMIN_NOTIFICATION_EMAIL: "admin@example.com",
  EMAIL_SITE_URL: "https://kmgmt.example",
  RESEND_API_KEY: "private-api-test",
  EMAIL_WORKER_TOKEN: "worker-test-token-with-more-than-32-characters",
};
const env = (name: string) => variables[name];
const snapshot = (): EmailSnapshot => ({
  booking: {
    id: bookingId,
    reference: "KM-TEST",
    start_time: "2030-01-01T09:00:00Z",
    end_time: "2030-01-01T10:00:00Z",
    timezone: "Africa/Johannesburg",
    status: "confirmed",
    notes: "INTERNAL-ADMIN-NOTE",
  },
  payment: {
    id: paymentId,
    provider: "payfast",
    reference: "PF-TEST-RECEIPT",
    amount_cents: 50000,
    currency: "ZAR",
    paid_at: "2029-12-31T08:00:00Z",
  },
  service: { name: "Career consultation", duration_minutes: 60 },
  client: {
    full_name: "Player <script>alert(1)</script>",
    email: "player@example.com",
    whatsapp: "+27820000000",
    age: 17,
    country: "South Africa",
    position: "Striker",
    current_club: "Test club",
    previous_clubs: "Previous club",
    playing_level: "Academy",
    help_required: "Career plan",
    situation_description: "PRIVATE-SITUATION",
    social_profile: "Test social",
    highlight_video_url: "https://video.example/player",
    guardian_name: "Test Guardian",
    guardian_email: "guardian@example.com",
    guardian_phone: "+27820000001",
    guardian_consent: true,
  },
});
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Booking receipt templates", () => {
  it("renders customer booking/payment details in Johannesburg time and escapes submitted HTML", () => {
    const message = buildBookingEmail("customer_confirmation", snapshot(), getEmailConfig(env));
    expect(message.to).toEqual(["player@example.com"]);
    expect(message.text).toContain("11:00 – 12:00 (Africa/Johannesburg)");
    expect(message.text).toContain("PF-TEST-RECEIPT");
    expect(message.text).toContain("500,00");
    expect(message.html).toContain("&lt;script&gt;");
    expect(message.html).not.toContain("<script>");
    expect(message.text).not.toContain("INTERNAL-ADMIN-NOTE");
    expect(message.text).not.toContain("PRIVATE-SITUATION");
    expect(message.text).toContain(`https://kmgmt.example/booking/success?booking=${bookingId}`);
  });
  it("sends the full submission and payment record only to the configured admin", () => {
    const message = buildBookingEmail("admin_confirmation", snapshot(), getEmailConfig(env));
    expect(message.to).toEqual(["admin@example.com"]);
    expect(message.subject).toContain("Booking & Payment Received");
    for (const value of [
      "PRIVATE-SITUATION",
      "guardian@example.com",
      "INTERNAL-ADMIN-NOTE",
      "Guardian consent: Yes",
      paymentId,
    ])
      expect(message.text).toContain(value);
    expect(message.text).toContain("https://kmgmt.example/admin/bookings");
  });
  it("labels the paid slot-conflict notification as requiring attention", () => {
    const sample = snapshot();
    sample.booking.status = "expired";
    const message = buildBookingEmail("admin_payment_followup", sample, getEmailConfig(env));
    expect(message.subject).toContain("needs attention");
    expect(message.text).toContain("could not be confirmed");
    expect(message.to).toEqual(["admin@example.com"]);
  });
});

function queueDatabase() {
  let sent = false;
  let frozen: unknown = null;
  const rpc = vi.fn(async (name: string, args?: Record<string, unknown>) => {
    if (name === "claim_booking_email_jobs")
      return {
        data: sent
          ? []
          : [
              {
                id: jobId,
                lock_token: lock,
                kind: "customer_confirmation",
                snapshot: snapshot(),
                request_payload: frozen,
              },
            ],
        error: null,
      };
    if (name === "freeze_booking_email_request") {
      frozen ??= args?.["p_payload"];
      return { data: frozen, error: null };
    }
    if (name === "finish_booking_email_job") {
      sent = !!args?.["p_resend_id"];
      return { data: null, error: null };
    }
    throw new Error("Unexpected RPC");
  });
  return { rpc, supabase: { rpc } as unknown as PaymentDependencies["supabase"] };
}

describe("Durable Edge Function email delivery", () => {
  it("retries with the identical body and idempotency key, then skips a completed job", async () => {
    const database = queueDatabase();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 502 }))
      .mockResolvedValueOnce(Response.json({ id: "resend-test-id" }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await processBookingEmails({ env, supabase: database.supabase })).toEqual({
      sent: 0,
      failed: 1,
    });
    const changedEnv = (name: string) =>
      name === "EMAIL_FROM" ? "New Sender <new@kmgmt.example>" : env(name);
    expect(await processBookingEmails({ env: changedEnv, supabase: database.supabase })).toEqual({
      sent: 1,
      failed: 0,
    });
    expect(fetchMock.mock.calls[0]![1].body).toBe(fetchMock.mock.calls[1]![1].body);
    expect(fetchMock.mock.calls[0]![1].headers["Idempotency-Key"]).toBe(
      `kmgmt-booking-email/${jobId}`,
    );
    expect(fetchMock.mock.calls[1]![1].headers["Idempotency-Key"]).toBe(
      `kmgmt-booking-email/${jobId}`,
    );
    expect(await processBookingEmails({ env, supabase: database.supabase })).toEqual({
      sent: 0,
      failed: 0,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("records a retryable network error without logging API keys or submitted details", async () => {
    const database = queueDatabase();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("private-api-test player@example.com")),
    );
    expect(await processBookingEmails({ env, supabase: database.supabase })).toEqual({
      sent: 0,
      failed: 1,
    });
    expect(database.rpc).toHaveBeenLastCalledWith(
      "finish_booking_email_job",
      expect.objectContaining({ p_error_code: "resend_network_error", p_permanent: false }),
    );
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private-api-test");
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("player@example.com");
  });
  it("does not claim work when email secrets are missing", async () => {
    const database = queueDatabase();
    await expect(
      processBookingEmails({ env: () => undefined, supabase: database.supabase }),
    ).rejects.toThrow("secrets");
    expect(database.rpc).not.toHaveBeenCalled();
  });
  it("marks invalid provider requests for review instead of endlessly retrying", async () => {
    const database = queueDatabase();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("invalid recipient", { status: 422 })),
    );
    expect(await processBookingEmails({ env, supabase: database.supabase })).toEqual({
      sent: 0,
      failed: 1,
    });
    expect(database.rpc).toHaveBeenLastCalledWith(
      "finish_booking_email_job",
      expect.objectContaining({ p_permanent: true, p_error_code: "resend_http_422" }),
    );
  });
});

describe("Private email worker endpoint", () => {
  it.each([undefined, "public-anon-key", "wrong-token"])(
    "rejects unauthorized callers before accessing the database",
    async (token) => {
      const database = vi.fn();
      const response = await handleEmailWorker(
        new Request("https://project.example/email", {
          method: "POST",
          headers: token ? { "x-email-worker-token": token } : {},
          body: "{}",
        }),
        env,
        database,
      );
      expect(response.status).toBe(401);
      expect(database).not.toHaveBeenCalled();
    },
  );
  it("rejects arbitrary recipients even with a worker token", async () => {
    const database = vi.fn();
    const response = await handleEmailWorker(
      new Request("https://project.example/email", {
        method: "POST",
        headers: { "x-email-worker-token": env("EMAIL_WORKER_TOKEN")! },
        body: JSON.stringify({ to: "other@example.com", test: true }),
      }),
      env,
      database,
    );
    expect(response.status).toBe(400);
    expect(database).not.toHaveBeenCalled();
  });
  it("sends explicitly labelled deployment samples only to the admin, without creating bookings", async () => {
    const database = vi.fn();
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({ id: "resend-test" }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await handleEmailWorker(
      new Request("https://project.example/email", {
        method: "POST",
        headers: { "x-email-worker-token": env("EMAIL_WORKER_TOKEN")! },
        body: JSON.stringify({ test: true }),
      }),
      env,
      database,
    );
    expect(response.status).toBe(200);
    expect(database).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [, options] of fetchMock.mock.calls) {
      const message = JSON.parse(options.body);
      expect(message.to).toEqual(["admin@example.com"]);
      expect(message.subject).toContain("[TEST]");
      expect(message.text).toContain("No booking was created and no payment was taken");
    }
  });
});
