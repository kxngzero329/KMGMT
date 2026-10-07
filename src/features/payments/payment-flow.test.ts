import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { preparePayfastPayment as checkout } from "../../../supabase/functions/_shared/checkout.ts";
import { handlePayfastNotification as notify } from "../../../supabase/functions/_shared/notify.ts";
import {
  getPayfastConfig as config,
  pfSignature,
  pfNotificationSignature,
} from "../../../supabase/functions/_shared/payfast.ts";
import { allowedOrigin } from "../../../supabase/functions/_shared/http.ts";
import type { PaymentDependencies } from "../../../supabase/functions/_shared/types.ts";
const mocks = { from: vi.fn() };
const env = (name: string) => process.env[name];
const deps = () => ({
  env,
  supabase: { from: mocks.from } as unknown as PaymentDependencies["supabase"],
});
const getPayfastConfig = () => config(env);
const preparePayfastPayment = (id: string, origin: string) => checkout(id, origin, deps());
const handlePayfastNotification = (request: Request) => notify(request, deps());

const bookingId = "11111111-1111-4111-8111-111111111111";
const booking = () => ({
  id: bookingId,
  booking_reference: "KM-TEST1234",
  status: "pending_payment",
  hold_expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
  services: { name: "Career Consultation", price_cents: 50000 },
  clients: { full_name: "Test Player", email: "test@example.com" },
});
const payment = (status = "pending") => ({
  id: "22222222-2222-4222-8222-222222222222",
  booking_id: bookingId,
  amount_cents: 50000,
  status,
  provider_payment_id: status === "paid" ? "pf-test-123" : null,
});

function query(data: unknown = null, error: unknown = null) {
  const result = { data, error };
  const chain = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  mocks.from.mockReturnValueOnce(chain);
  return chain;
}

function notification(overrides: Record<string, string> = {}, invalidSignature = false) {
  const fields = {
    merchant_id: getPayfastConfig().merchantId,
    m_payment_id: bookingId,
    pf_payment_id: "pf-test-123",
    payment_status: "COMPLETE",
    amount_gross: "500.00",
    ...overrides,
  };
  const signature = invalidSignature
    ? "0".repeat(32)
    : pfNotificationSignature(Object.entries(fields), getPayfastConfig().passphrase);
  return new Request("https://project.supabase.co/functions/v1/payfast-notify", {
    method: "POST",
    body: new URLSearchParams({ ...fields, signature }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReset();
  for (const name of [
    "PAYFAST_MERCHANT_ID",
    "PAYFAST_MERCHANT_KEY",
    "PAYFAST_PASSPHRASE",
    "SITE_URL",
  ])
    vi.stubEnv(name, "");
  vi.stubEnv("PAYFAST_MODE", "sandbox");
  vi.stubEnv("PAYFAST_MERCHANT_ID", "test-merchant");
  vi.stubEnv("PAYFAST_MERCHANT_KEY", "test-key");
  vi.stubEnv("PAYFAST_PASSPHRASE", "test-passphrase");
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => new Response("VALID")),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PayFast checkout", () => {
  it("uses the database price and produces a correctly signed sandbox request", async () => {
    query(booking());
    const pending = query({ id: payment().id });
    const result = await preparePayfastPayment(bookingId, "http://localhost:3000");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.action).toBe("https://sandbox.payfast.co.za/eng/process");
    expect(result.fields["amount"]).toBe("500.00");
    expect(result.fields["notify_url"]).toBe(
      "https://project.supabase.co/functions/v1/payfast-notify",
    );
    expect(pending.update).toHaveBeenCalledWith({ amount_cents: 50000, status: "pending" });
    expect(pending.in).toHaveBeenCalledWith("status", ["pending", "cancelled", "failed"]);
    expect(result.fields["signature"]).toBe(
      pfSignature(
        Object.entries(result.fields).filter(([key]) => key !== "signature"),
        getPayfastConfig().passphrase,
      ),
    );
    expect(Object.keys(result.fields)).not.toContain("SUPABASE_SECRET_KEY");
  });

  it("allows the configured HTTPS site and rejects an unapproved return origin", () => {
    vi.stubEnv("SITE_URL", "https://kmgmt.example/");
    expect(allowedOrigin("https://kmgmt.example", env)).toBe("https://kmgmt.example");
    expect(allowedOrigin("https://untrusted.example", env)).toBeNull();
  });

  it.each([null, "invalid", new Date(0).toISOString()])(
    "rejects invalid/expired holds (%s)",
    async (expires) => {
      query({ ...booking(), hold_expires_at: expires });
      expect(await preparePayfastPayment(bookingId, "http://localhost:3000")).toMatchObject({
        ok: false,
        error: expect.stringContaining("expired"),
      });
      expect(mocks.from).toHaveBeenCalledTimes(1);
    },
  );

  it("does not create checkout for a confirmed booking", async () => {
    query({ ...booking(), status: "confirmed" });
    expect(await preparePayfastPayment(bookingId, "http://localhost:3000")).toMatchObject({
      ok: false,
    });
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("does not redirect when the payment write fails", async () => {
    query(booking());
    query(null, { message: "Database unavailable" });
    expect(await preparePayfastPayment(bookingId, "http://localhost:3000")).toMatchObject({
      ok: false,
    });
  });

  it("does not restart an already-paid/refunded payment", async () => {
    query(booking());
    query(null);
    expect(await preparePayfastPayment(bookingId, "http://localhost:3000")).toMatchObject({
      ok: false,
      error: expect.stringContaining("cannot be restarted"),
    });
  });

  it("keeps database/configuration errors out of the browser response", async () => {
    mocks.from.mockImplementationOnce(() => {
      throw new Error("Missing SUPABASE_SECRET_KEY");
    });
    const result = await preparePayfastPayment(bookingId, "http://localhost:3000");
    expect(result).toMatchObject({ ok: false });
    expect(JSON.stringify(result)).not.toContain("SUPABASE_SECRET_KEY");
  });

  it("requires explicit merchant settings and blocks local return origins in live mode", () => {
    vi.stubEnv("PAYFAST_MODE", "live");
    vi.stubEnv("PAYFAST_PASSPHRASE", "");
    expect(getPayfastConfig().configured).toBe(false);
    vi.stubEnv("PAYFAST_PASSPHRASE", "test-passphrase");
    expect(getPayfastConfig().configured).toBe(true);
    expect(allowedOrigin("http://localhost:3000", env)).toBeNull();
    expect(allowedOrigin("https://untrusted.example", env)).toBeNull();
  });
});

describe("PayFast notifications", () => {
  it("rejects a forged signature before contacting PayFast or the database", async () => {
    expect((await handlePayfastNotification(notification({}, true))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each(["NaN", "Infinity", "-500.00", "", "500.001"])(
    "rejects invalid amounts (%s)",
    async (amount) => {
      expect((await handlePayfastNotification(notification({ amount_gross: amount }))).status).toBe(
        400,
      );
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

  it("rejects duplicate parameters", async () => {
    const req = notification();
    const body = `${await req.text()}&amount_gross=1.00`;
    const response = await handlePayfastNotification(
      new Request(req.url, { method: "POST", body }),
    );
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a different merchant", async () => {
    expect(
      (await handlePayfastNotification(notification({ merchant_id: "wrong-merchant" }))).status,
    ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires successful PayFast server validation", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("VALID", { status: 500 }));
    expect((await handlePayfastNotification(notification())).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("returns a retryable response when PayFast is unreachable", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network unavailable"));
    expect((await handlePayfastNotification(notification())).status).toBe(502);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejects an amount that differs from the stored payment without changing it", async () => {
    const stored = query(payment());
    expect((await handlePayfastNotification(notification({ amount_gross: "499.99" }))).status).toBe(
      400,
    );
    expect(stored.update).not.toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("records payment and confirms the booking only after successful writes", async () => {
    query(payment());
    const paid = query({ id: payment().id });
    const confirmed = query({ id: bookingId });
    expect((await handlePayfastNotification(notification())).status).toBe(200);
    expect(paid.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "paid", provider_payment_id: "pf-test-123" }),
    );
    expect(confirmed.update).toHaveBeenCalledWith({ status: "confirmed", hold_expires_at: null });
  });

  it("returns 500 when saving payment fails so PayFast can retry", async () => {
    query(payment());
    query(null, { message: "Write failed" });
    expect((await handlePayfastNotification(notification())).status).toBe(500);
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it("does not confirm a booking when its payment changed concurrently", async () => {
    query(payment());
    query(null);
    expect((await handlePayfastNotification(notification())).status).toBe(500);
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it("recovers booking confirmation after an earlier attempt saved only the payment", async () => {
    query(payment("paid"));
    query(null, { code: "08006", message: "Connection failed" });
    expect((await handlePayfastNotification(notification())).status).toBe(500);
    query(payment("paid"));
    const confirmed = query({ id: bookingId });
    expect((await handlePayfastNotification(notification())).status).toBe(200);
    expect(confirmed.update).toHaveBeenCalled();
  });

  it("accepts duplicate notifications for an already-confirmed booking", async () => {
    query(payment("paid"));
    query(null);
    expect((await handlePayfastNotification(notification())).status).toBe(200);
  });

  it("records a slot conflict for admin follow-up while keeping payment paid", async () => {
    query(payment());
    query({ id: payment().id });
    query(null, { code: "23P01", message: "Slot conflict" });
    const followup = query();
    expect((await handlePayfastNotification(notification())).status).toBe(200);
    expect(followup.update).toHaveBeenCalledWith(
      expect.objectContaining({ notes: expect.stringContaining("PAID AFTER HOLD EXPIRED") }),
    );
  });

  it("does not let a later cancellation overwrite a paid payment", async () => {
    const stored = query(payment("paid"));
    expect(
      (await handlePayfastNotification(notification({ payment_status: "CANCELLED" }))).status,
    ).toBe(200);
    expect(stored.update).not.toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
});
