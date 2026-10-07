import { z } from "zod";
import { allowedOrigin, corsHeaders, hasPublicApiKey } from "./http.ts";
import { preparePayfastPayment } from "./checkout.ts";
import type { Env, PaymentDependencies } from "./types.ts";

const inputSchema = z
  .object({ bookingId: z.string().uuid(), returnOrigin: z.string().url() })
  .strict();

export async function handleCheckout(
  request: Request,
  env: Env,
  database: () => PaymentDependencies["supabase"],
): Promise<Response> {
  const origin = allowedOrigin(request.headers.get("origin"), env);
  if (!origin)
    return Response.json(
      { ok: false, error: "This website is not enabled for payments." },
      { status: 403 },
    );
  const headers = corsHeaders(origin);
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);
  if (!hasPublicApiKey(request, env))
    return json({ ok: false, error: "Invalid project API key." }, 401);
  try {
    const raw = await request.text();
    if (raw.length > 2048) return json({ ok: false, error: "Invalid checkout request." }, 400);
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return json({ ok: false, error: "Invalid checkout request." }, 400);
    }
    const parsed = inputSchema.safeParse(payload);
    if (!parsed.success || parsed.data.returnOrigin !== origin)
      return json({ ok: false, error: "Invalid checkout request." }, 400);
    const result = await preparePayfastPayment(parsed.data.bookingId, origin, {
      env,
      supabase: database(),
    });
    return json(result, result.ok ? 200 : 400);
  } catch (error) {
    console.error("PayFast checkout unavailable", error);
    return json(
      { ok: false, error: "We couldn't start your payment. Please try again shortly." },
      503,
    );
  }
}
