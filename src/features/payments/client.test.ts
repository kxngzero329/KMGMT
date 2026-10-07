import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { createPayfastPayment } from "./client";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
  SUPABASE_PUBLISHABLE_KEY: "public-test-key",
}));
beforeEach(() => {
  invoke.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("Browser Edge Function checkout", () => {
  it("sends only the booking and browser return origin to the Edge Function", async () => {
    invoke.mockResolvedValue({
      data: {
        ok: true,
        action: "https://sandbox.payfast.co.za/eng/process",
        fields: { amount: "350.00" },
      },
      error: null,
    });
    expect((await createPayfastPayment("test-booking")).ok).toBe(true);
    expect(invoke).toHaveBeenCalledWith("create-payfast-payment", {
      headers: { "x-kmgmt-project-key": "public-test-key" },
      body: { bookingId: "test-booking", returnOrigin: window.location.origin },
    });
  });
  it("preserves an expired hold response so the booking UI can select another slot", async () => {
    const error = { ok: false, error: "Your reservation has expired. Please choose a time again." };
    invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(Response.json(error, { status: 400 })),
    });
    expect(await createPayfastPayment("test-booking")).toEqual(error);
  });
  it.each([null, { ok: true, action: "https://evil.example", fields: {} }, { ok: true }])(
    "rejects an unexpected function response",
    async (data) => {
      invoke.mockResolvedValue({ data, error: null });
      expect((await createPayfastPayment("test-booking")).ok).toBe(false);
    },
  );
  it("handles an unreachable function without throwing into the booking UI", async () => {
    invoke.mockRejectedValue(new Error("Network error"));
    expect((await createPayfastPayment("test-booking")).ok).toBe(false);
  });
});
