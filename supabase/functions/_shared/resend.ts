import { z } from "zod";
import type { EmailConfig, ResendMessage } from "./booking-email.ts";

export type ResendEnvelope = ResendMessage & {
  attachments?: { filename: string; content: string }[];
};

export class DeliveryError extends Error {
  constructor(
    readonly code: string,
    readonly permanent = false,
  ) {
    super(code);
  }
}

export async function sendResendEmail(
  message: ResendEnvelope,
  config: EmailConfig,
  idempotencyKey: string,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new DeliveryError("resend_network_error");
  }
  if (!response.ok) {
    // Provider responses can contain recipient details; record only the status.
    throw new DeliveryError(`resend_http_${response.status}`, [400, 422].includes(response.status));
  }
  try {
    const result: unknown = await response.json();
    return z.object({ id: z.string().min(1) }).parse(result).id;
  } catch {
    throw new DeliveryError("resend_invalid_response");
  }
}
