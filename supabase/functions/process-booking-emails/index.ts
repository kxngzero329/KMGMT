import { handleEmailWorker } from "../_shared/email-worker.ts";
import { createPaymentDatabase } from "../_shared/runtime.ts";

Deno.serve((request: Request) =>
  handleEmailWorker(request, Deno.env.get, () => createPaymentDatabase(Deno.env.get)),
);
