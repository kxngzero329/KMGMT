import { describe, expect, it } from "vitest";
import { getPublicSupabaseConfig } from "./public-config";

const url = "https://project.example";
const jwt = (role: string) =>
  `${btoa(JSON.stringify({ alg: "HS256" }))}.${btoa(JSON.stringify({ role }))}.test-signature`;

describe("Public Supabase configuration", () => {
  it.each(["sb_publishable_test", jwt("anon")])("accepts a public key format", (key) => {
    expect(getPublicSupabaseConfig(url, key)).toEqual({ url, key });
  });

  it.each(["sb_secret_private-test", jwt("service_role"), jwt("authenticated"), "invalid-key"])(
    "rejects private and unrecognized keys without exposing their values",
    (key) => {
      expect(() => getPublicSupabaseConfig(url, key)).toThrow("must be a publishable key");
      try {
        getPublicSupabaseConfig(url, key);
      } catch (error) {
        expect(String(error)).not.toContain(key);
      }
    },
  );

  it.each([[undefined, "sb_publishable_test"], [url, undefined], ["", ""]])(
    "rejects missing build settings",
    (projectUrl, key) => {
      expect(() => getPublicSupabaseConfig(projectUrl, key)).toThrow("Set VITE_SUPABASE_URL");
    },
  );

  it.each(["not-a-url", "javascript:alert(1)", "https://user:password@project.example"])(
    "rejects invalid project URLs without including them in errors",
    (projectUrl) => {
      expect(() => getPublicSupabaseConfig(projectUrl, "sb_publishable_test")).toThrow(
        "must be a valid HTTP(S) project URL",
      );
    },
  );
});
