import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { handleCheckout } from "../../../supabase/functions/_shared/checkout-handler.ts";
import { allowedOrigin } from "../../../supabase/functions/_shared/http.ts";
import { createPaymentDatabase } from "../../../supabase/functions/_shared/runtime.ts";
import {
  pfNotificationSignature,
  pfNotificationString,
} from "../../../supabase/functions/_shared/payfast.ts";
import { createHash } from "node:crypto";

const env = (name: string) => process.env[name];
const bookingId = "11111111-1111-4111-8111-111111111111";
const database = vi.fn();
function request(
  body: unknown = { bookingId, returnOrigin: "http://localhost:3000" },
  headers: Record<string, string> = {},
) {
  return new Request("https://project.supabase.co/functions/v1/create-payfast-payment", {
    method: "POST",
    headers: { origin: "http://localhost:3000", apikey: "test-anon-key", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("PAYFAST_MODE", "sandbox");
  vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEYS", JSON.stringify({ default: "sb_publishable_test" }));
  vi.stubEnv("SITE_URL", "");
  vi.stubEnv("PAYFAST_ALLOWED_ORIGINS", "");
  vi.stubEnv("PAYFAST_PUBLIC_KEYS", "[]");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Edge checkout boundary", () => {
  it("rejects an unrecognized project public key before accessing the database", async () => {
    expect(
      (await handleCheckout(request(undefined, { apikey: "wrong" }), env, database)).status,
    ).toBe(401);
    expect(database).not.toHaveBeenCalled();
  });
  it("accepts an explicitly configured project key through the gateway-safe header", async () => {
    vi.stubEnv("PAYFAST_PUBLIC_KEYS", JSON.stringify(["verified-project-public-key"]));
    database.mockImplementationOnce(() => {
      throw new Error("Database unavailable");
    });
    const response = await handleCheckout(
      request(undefined, { apikey: "", "x-kmgmt-project-key": "verified-project-public-key" }),
      env,
      database,
    );
    expect(response.status).toBe(503);
    expect(database).toHaveBeenCalledOnce();
  });
  it("allows anonymous localhost CORS preflight without opening the database", async () => {
    const response = await handleCheckout(
      new Request(request().url, {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      }),
      env,
      database,
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect(response.headers.get("access-control-allow-headers")).toContain("apikey");
    expect(database).not.toHaveBeenCalled();
  });
  it.each([
    "https://evil.example",
    "http://localhost.evil.example",
    "null",
    "http://localhost:3000/path",
    "javascript:alert(1)",
  ])("rejects unapproved origins: %s", async (origin) => {
    const response = await handleCheckout(request(undefined, { origin }), env, database);
    expect(response.status).toBe(403);
    expect(database).not.toHaveBeenCalled();
  });

  it.each([
    { bookingId, returnOrigin: "http://localhost:3000", amount: "1.00" },
    { bookingId: "not-a-uuid", returnOrigin: "http://localhost:3000" },
    { bookingId, returnOrigin: "https://evil.example" },
    "invalid json",
  ])("rejects malformed or tampered input before database access", async (body) => {
    expect((await handleCheckout(request(body), env, database)).status).toBe(400);
    expect(database).not.toHaveBeenCalled();
  });
  it.each(["test-anon-key", "sb_publishable_test"])(
    "accepts the project's public key format (%s) and sanitizes runtime errors",
    async (apikey) => {
      database.mockImplementationOnce(() => {
        throw new Error("private-server-key");
      });
      const response = await handleCheckout(request(undefined, { apikey }), env, database);
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain("private-server-key");
      expect(database).toHaveBeenCalledOnce();
    },
  );
  it("allows an explicitly configured hosted site in live mode", () => {
    vi.stubEnv("PAYFAST_MODE", "live");
    vi.stubEnv("SITE_URL", "https://kmgmt.example/");
    expect(allowedOrigin("https://kmgmt.example", env)).toBe("https://kmgmt.example");
    expect(allowedOrigin("http://localhost:3000", env)).toBeNull();
  });
});

describe("Edge runtime credentials and ITN encoding", () => {
  it("uses the service key injected by Supabase without a website-side key", async () => {
    const variables: Record<string, string> = {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "runtime-test-key",
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response("[]"));
    vi.stubGlobal("fetch", fetchMock);
    await createPaymentDatabase((name) => variables[name])
      .from("bookings")
      .select("id");
    expect(new Headers(fetchMock.mock.calls[0]![1].headers).get("apikey")).toBe("runtime-test-key");
  });
  it("supports the injected secret-key dictionary without sending an opaque key as a bearer JWT", async () => {
    const variables: Record<string, string> = {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SECRET_KEYS: JSON.stringify({ default: "sb_secret_runtime-test" }),
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response("[]"));
    vi.stubGlobal("fetch", fetchMock);
    await createPaymentDatabase((name) => variables[name])
      .from("bookings")
      .select("id");
    const headers = new Headers(fetchMock.mock.calls[0]![1].headers);
    expect(headers.get("apikey")).toBe("sb_secret_runtime-test");
    expect(headers.has("authorization")).toBe(false);
  });
  it("includes empty ITN fields and exact whitespace in the signature and validation payload", () => {
    const fields: [string, string][] = [
      ["item_name", "Test & play"],
      ["custom_str1", ""],
      ["name_last", " Doe "],
    ];
    const expected = "item_name=Test+%26+play&custom_str1=&name_last=+Doe+";
    expect(pfNotificationString(fields)).toBe(expected);
    expect(pfNotificationSignature(fields, "test salt")).toBe(
      createHash("md5").update(`${expected}&passphrase=test+salt`).digest("hex"),
    );
  });
});
