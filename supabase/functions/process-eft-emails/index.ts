import { handleEftEmailWorker } from "../_shared/eft-worker.ts";
import { createPaymentDatabase } from "../_shared/runtime.ts";

Deno.serve((request: Request) =>
  handleEftEmailWorker(request, Deno.env.get, () => createPaymentDatabase(Deno.env.get)),
);
