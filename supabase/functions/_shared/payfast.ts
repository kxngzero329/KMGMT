import { createHash } from "node:crypto";
import type { Env } from "./types.ts";

export function getPayfastConfig(env: Env) {
  const mode = env("PAYFAST_MODE") || "sandbox";
  const merchantId = env("PAYFAST_MERCHANT_ID") || "";
  const merchantKey = env("PAYFAST_MERCHANT_KEY") || "";
  const passphrase = env("PAYFAST_PASSPHRASE") || "";
  const host = mode === "live" ? "https://www.payfast.co.za" : "https://sandbox.payfast.co.za";
  const supabaseUrl = (env("SUPABASE_URL") || "").replace(/\/$/, "");
  return {
    mode,
    merchantId,
    merchantKey,
    passphrase,
    supabaseUrl,
    processUrl: `${host}/eng/process`,
    validateUrl: `${host}/eng/query/validate`,
    configured: !!(
      merchantId &&
      merchantKey &&
      passphrase &&
      supabaseUrl &&
      ["sandbox", "live"].includes(mode)
    ),
  };
}

/** PHP-style urlencode as PayFast expects (spaces as +, uppercase hex). */
export function pfEncode(value: string, trim = true): string {
  return encodeURIComponent(trim ? value.trim() : value)
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

export function pfParamString(entries: [string, string][]): string {
  return entries
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${pfEncode(v)}`)
    .join("&");
}

export function pfSignature(entries: [string, string][], passphrase?: string): string {
  let s = pfParamString(entries);
  if (passphrase) s += `&passphrase=${pfEncode(passphrase)}`;
  return createHash("md5").update(s).digest("hex");
}

export function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** ITNs sign every posted field, including empty values, without trimming them. */
export function pfNotificationString(entries: [string, string][]): string {
  return entries.map(([key, value]) => `${key}=${pfEncode(value, false)}`).join("&");
}

export function pfNotificationSignature(entries: [string, string][], passphrase: string): string {
  const parameters = `${pfNotificationString(entries)}&passphrase=${pfEncode(passphrase, false)}`;
  return createHash("md5").update(parameters).digest("hex");
}
