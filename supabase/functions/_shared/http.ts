import type { Env } from "./types.ts";

export function allowedOrigin(origin: string | null, env: Env): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.origin !== origin || url.username || url.password) return null;
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if ((env("PAYFAST_MODE") || "sandbox") === "sandbox" && local) return origin;
    if (url.protocol !== "https:") return null;
    const configured = [
      env("SITE_URL") || "",
      ...(env("PAYFAST_ALLOWED_ORIGINS") || "").split(","),
    ].map((value) => value.trim().replace(/\/$/, ""));
    return configured.includes(origin) ? origin : null;
  } catch {
    return null;
  }
}

export function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, x-kmgmt-project-key, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

export function hasPublicApiKey(request: Request, env: Env): boolean {
  const supplied = [
    request.headers.get("x-kmgmt-project-key"),
    request.headers.get("apikey"),
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""),
  ].filter((key): key is string => typeof key === "string" && key.length > 0);
  const accepted = [env("SUPABASE_ANON_KEY"), env("SUPABASE_PUBLISHABLE_KEY")].filter(Boolean);
  // Gateways can forward a different legacy JWT than the one injected at runtime.
  // PAYFAST_PUBLIC_KEYS contains only this project's public keys, set via its CLI.
  for (const name of ["SUPABASE_PUBLISHABLE_KEYS", "PAYFAST_PUBLIC_KEYS"]) {
    try {
      const parsed = JSON.parse(env(name) || "{}");
      if (parsed && typeof parsed === "object")
        accepted.push(
          ...Object.values(parsed).filter((key): key is string => typeof key === "string"),
        );
    } catch {
      /* A missing/malformed key list must never authorize a caller. */
    }
  }
  return supplied.some((key) => accepted.includes(key));
}
