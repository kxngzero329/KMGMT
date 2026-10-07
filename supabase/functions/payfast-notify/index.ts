import { handlePayfastNotification } from "../_shared/notify.ts";
import { createPaymentDatabase } from "../_shared/runtime.ts";

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    return await handlePayfastNotification(request, {
      env: Deno.env.get,
      supabase: createPaymentDatabase(Deno.env.get),
    });
  } catch (error) {
    console.error("PayFast notification unavailable", error);
    return new Response("Notification unavailable", { status: 503 });
  }
});
