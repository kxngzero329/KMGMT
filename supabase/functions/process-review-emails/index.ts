import { handleReviewEmailWorker } from "../_shared/review-email-worker.ts";
import { createPaymentDatabase } from "../_shared/runtime.ts";

Deno.serve((request: Request) =>
  handleReviewEmailWorker(request, Deno.env.get, () => createPaymentDatabase(Deno.env.get)),
);
