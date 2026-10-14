import { handlePayfastNotification } from "../_shared/notify.ts";
import { createPaymentDatabase } from "../_shared/runtime.ts";
import { processBookingEmails } from "../_shared/email-worker.ts";

declare const EdgeRuntime: { waitUntil(task: Promise<unknown>): void };

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const deps = {
      env: Deno.env.get,
      supabase: createPaymentDatabase(Deno.env.get),
    };
    const response = await handlePayfastNotification(request, deps);
    if (response.status === 200) {
      // Confirmation atomically queues email in SQL. Do not hold up PayFast's
      // acknowledgement or reverse a successful payment if Resend is unavailable.
      EdgeRuntime.waitUntil(
        processBookingEmails(deps).catch(() => {
          console.error("Immediate booking email delivery deferred to scheduled worker");
        }),
      );
    }
    return response;
  } catch (error) {
    console.error("PayFast notification unavailable", error);
    return new Response("Notification unavailable", { status: 503 });
  }
});
