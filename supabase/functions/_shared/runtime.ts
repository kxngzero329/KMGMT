import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/integrations/supabase/types.ts";
import type { Env } from "./types.ts";

/** These credentials are injected by Supabase, not supplied by the website. */
export function createPaymentDatabase(env: Env) {
  const url = env("SUPABASE_URL");
  const key =
    env("SUPABASE_SERVICE_ROLE_KEY") ||
    (Object.values(JSON.parse(env("SUPABASE_SECRET_KEYS") || "{}"))[0] as string | undefined);
  if (!url || !key) throw new Error("Supabase function database configuration is missing");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_secret_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        return fetch(input, { ...init, headers });
      },
    },
  });
}
