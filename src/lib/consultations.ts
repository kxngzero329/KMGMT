import { z } from "zod";
import { consultationPolicy } from "@/content/site";

export const consultationFormatSchema = z.enum(["online", "in_person"]);
export type ConsultationFormat = z.infer<typeof consultationFormatSchema>;

export const CONSULTATION_FORMAT_LABEL: Record<ConsultationFormat, string> = {
  online: "Online (video call)",
  in_person: "In person (Kieraan's arrangement only)",
};

export const CONSULTATION_DELIVERY: Record<ConsultationFormat, string> = {
  online:
    "Your consultation is online. Kieraan will contact you on your booking WhatsApp number to arrange the video call and share any joining link before your appointment. Please have reliable internet and a device with a camera and microphone. Any exception must be personally confirmed by Kieraan through WhatsApp; your website booking and payment are still required.",
  in_person:
    "An alternative arrangement applies only if Kieraan personally confirms it with you through WhatsApp. Otherwise your consultation is online. All appointments must still be booked and paid for through this website as usual.",
};

export function consultationFormatLabel(format: string | null | undefined) {
  return format === "online" || format === "in_person"
    ? CONSULTATION_FORMAT_LABEL[format]
    : "To be arranged";
}

export function consultationDelivery(format: string | null | undefined) {
  return format === "online" || format === "in_person"
    ? CONSULTATION_DELIVERY[format]
    : consultationPolicy.notice;
}
