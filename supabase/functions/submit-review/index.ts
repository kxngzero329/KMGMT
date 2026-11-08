import { z } from "zod";
import { corsHeaders, hasPublicApiKey } from "../_shared/http.ts";
import { createPaymentDatabase } from "../_shared/runtime.ts";

const env = Deno.env.get;
const schema = z
  .object({
    id: z.string().uuid(),
    client_name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    role_or_context: z.string().trim().max(100).default(""),
    rating: z.number().int().min(1).max(5),
    content: z.string().trim().min(10).max(1500),
    consent: z.literal(true),
    website: z.string().max(200).default(""),
  })
  .strict();

function reviewOrigin(origin: string | null): string | null {
  if (!origin) return null;
  const configured = [
    "https://kmgmt.co.za",
    "https://www.kmgmt.co.za",
    env("SITE_URL") || "",
    ...(env("REVIEW_ALLOWED_ORIGINS") || "").split(","),
    ...(env("PAYFAST_ALLOWED_ORIGINS") || "").split(","),
  ];
  try {
    const url = new URL(origin);
    if (url.origin !== origin) return null;
    if (
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
      ["http:", "https:"].includes(url.protocol)
    )
      return origin;
    return url.protocol === "https:" &&
      configured.some((value) => value.trim().replace(/\/$/, "") === origin)
      ? origin
      : null;
  } catch {
    return null;
  }
}

async function hash(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (request: Request) => {
  const origin = reviewOrigin(request.headers.get("origin"));
  if (!origin) return new Response(null, { status: 403 });
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };
  const respond = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return respond(405, "Method not allowed.");
  if (!hasPublicApiKey(request, env)) return respond(401, "Unable to authorise this request.");
  if (!request.headers.get("content-type")?.includes("application/json"))
    return respond(415, "JSON required.");
  try {
    // Bound streamed bodies too; Content-Length alone is supplied by the caller.
    const reader = request.body?.getReader();
    if (!reader) return respond(400, "Please complete the review form.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 12_000) {
        await reader.cancel();
        return respond(413, "Your review is too long.");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let input: unknown;
    try {
      input = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return respond(400, "Please complete the review form.");
    }
    const parsed = schema.safeParse(input);
    if (!parsed.success)
      return respond(400, "Check your name, email, rating, review and publishing consent.");
    const review = parsed.data;
    if (review.website) return respond(400, "Unable to publish this submission.");
    // Network hints are only one abuse signal; a header-independent global cap
    // and content fingerprint also apply. No raw network address is persisted.
    const network =
      request.headers.get("cf-connecting-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unavailable";
    const secret = env("REVIEW_HASH_SECRET");
    if (!secret) throw new Error("Missing review hash configuration");
    const networkHash = await hash(`network:${network}`, secret);
    const fingerprint = await hash(
      JSON.stringify([review.client_name.toLowerCase(), review.content.toLowerCase()]),
      secret,
    );
    const db = createPaymentDatabase(env);
    const { data, error } = await db.rpc("submit_public_review_with_email", {
      p_id: review.id,
      p_network_hash: networkHash,
      p_fingerprint: fingerprint,
      p_client_name: review.client_name,
      p_role_or_context: review.role_or_context,
      p_rating: review.rating,
      p_content: review.content,
      p_email: review.email.toLowerCase(),
      p_email_hash: await hash(`email:${review.email.toLowerCase()}`, secret),
    });
    if (error) {
      if (error.message.includes("REVIEW_RATE_LIMIT"))
        return new Response(
          JSON.stringify({ error: "Too many reviews submitted. Please try again later." }),
          { status: 429, headers: { ...headers, "Retry-After": "3600" } },
        );
      if (error.message.includes("REVIEW_DUPLICATE"))
        return respond(409, "This review has already been published.");
      if (error.message.includes("REVIEW_CONFLICT"))
        return respond(409, "Please close the form and try again.");
      throw new Error("Review database operation failed");
    }
    return new Response(JSON.stringify({ id: data }), { status: 200, headers });
  } catch {
    // Do not log review text, IPs or credentials.
    console.error("Review submission unavailable");
    return respond(503, "We couldn't publish your review. Please try again shortly.");
  }
});
