import { handleEftBooking } from "../_shared/eft-booking-handler.ts";
import { createPaymentDatabase } from "../_shared/runtime.ts";

Deno.serve((request: Request) =>
  handleEftBooking(request, Deno.env.get, () => createPaymentDatabase(Deno.env.get)),
);
