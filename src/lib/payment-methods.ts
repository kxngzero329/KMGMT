import { contactDetails } from "@/content/site";

export type PaymentMethod = "eft" | "payfast";
export const PAYFAST_AVAILABLE = false;
export const PAYFAST_NOTICE =
  "Online PayFast payments are temporarily unavailable while merchant verification is being completed. Please choose EFT to book.";

export function paymentMethodLabel(method: string | null | undefined) {
  return method === "eft"
    ? "EFT / bank transfer"
    : method === "payfast"
      ? "PayFast"
      : method === "manual"
        ? "Manual"
        : "Not recorded";
}

export function proofOfPaymentLinks(reference: string, invoice: string | null) {
  const message = `Hello Kieraan, attached is my proof of EFT payment for booking ${reference}${invoice ? `, invoice ${invoice}` : ""}.`;
  return {
    whatsapp: `https://wa.me/${contactDetails.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
    email: `mailto:${contactDetails.email}?subject=${encodeURIComponent(`EFT proof of payment - ${reference}`)}&body=${encodeURIComponent(message)}`,
  };
}
