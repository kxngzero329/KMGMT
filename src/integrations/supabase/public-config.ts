/** Check configuration without ever including credential values in errors. */
export function getPublicSupabaseConfig(rawUrl: string | undefined, rawKey: string | undefined) {
  const url = rawUrl?.trim();
  const key = rawKey?.trim();
  if (!url || !key) {
    throw new Error(
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the build environment.",
    );
  }

  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password)
      throw new Error();
  } catch {
    throw new Error("VITE_SUPABASE_URL must be a valid HTTP(S) project URL.");
  }

  // Check key type only; Supabase still verifies signatures and access rights.
  let publicKey = key.startsWith("sb_publishable_") && key.length > "sb_publishable_".length;
  if (!publicKey && key.split(".").length === 3) {
    try {
      const payload = key.split(".")[1]!;
      const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      publicKey = decoded?.role === "anon";
    } catch {
      publicKey = false;
    }
  }
  if (!publicKey) {
    throw new Error(
      "VITE_SUPABASE_PUBLISHABLE_KEY must be a publishable key or legacy anon key. Private keys cannot be used in the browser.",
    );
  }

  return { url, key };
}
