import { FunctionsHttpError } from "@supabase/supabase-js";
import { z } from "zod";
import { supabase, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import type { ClientDetails } from "@/lib/validation/schemas";

const resultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    bookingId: z.string().uuid(),
    reference: z.string(),
    invoiceNumber: z.string(),
  }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);

export async function createEftBooking(input: {
  serviceId: string;
  startTime: string;
  client: ClientDetails;
  requestId: string;
}): Promise<z.infer<typeof resultSchema>> {
  const fallback = {
    ok: false as const,
    error:
      "We couldn't confirm your booking. Please try again with the same details; your request can be safely retried.",
  };
  try {
    const { data, error } = await supabase.functions.invoke("create-eft-booking", {
      headers: { "x-kmgmt-project-key": SUPABASE_PUBLISHABLE_KEY },
      body: input,
    });
    if (error) {
      if (error instanceof FunctionsHttpError) {
        const parsed = resultSchema.safeParse(await error.context.json());
        if (parsed.success && !parsed.data.ok) return parsed.data;
      }
      return fallback;
    }
    const parsed = resultSchema.safeParse(data);
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}
