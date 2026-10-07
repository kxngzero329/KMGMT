import { FunctionsHttpError } from "@supabase/supabase-js";
import { z } from "zod";
import { supabase, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

const resultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    action: z.enum([
      "https://sandbox.payfast.co.za/eng/process",
      "https://www.payfast.co.za/eng/process",
    ]),
    fields: z.record(z.string()),
  }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);
export type PaymentResult = z.infer<typeof resultSchema>;

/** The browser supplies a booking ID, never the amount or merchant credentials. */
export async function createPayfastPayment(bookingId: string): Promise<PaymentResult> {
  const fallback: PaymentResult = {
    ok: false,
    error: "We couldn't start your payment. Please try again shortly.",
  };
  try {
    const { data, error } = await supabase.functions.invoke("create-payfast-payment", {
      headers: { "x-kmgmt-project-key": SUPABASE_PUBLISHABLE_KEY },
      body: { bookingId, returnOrigin: window.location.origin },
    });
    if (error) {
      if (error instanceof FunctionsHttpError) {
        const parsed = resultSchema.safeParse(await error.context.json());
        if (parsed.success && !parsed.data.ok) return parsed.data;
      }
      return fallback;
    }
    const result = resultSchema.safeParse(data);
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}
