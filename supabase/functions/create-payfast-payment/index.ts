import { handleCheckout } from "../_shared/checkout-handler.ts";
import { createPaymentDatabase } from "../_shared/runtime.ts";

Deno.serve((request: Request) =>
  handleCheckout(request, Deno.env.get, () => createPaymentDatabase(Deno.env.get)),
);
