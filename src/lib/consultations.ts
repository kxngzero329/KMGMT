import { z } from "zod";

export const consultationFormatSchema = z.enum(["online", "in_person"]);
export type ConsultationFormat = z.infer<typeof consultationFormatSchema>;

export const CONSULTATION_FORMAT_LABEL: Record<ConsultationFormat, string> = {
  online: "Online (video call)",
  in_person: "In person",
};

export const CONSULTATION_DELIVERY: Record<ConsultationFormat, string> = {
  online:
    "KMGMT will contact you on the WhatsApp number you provide to arrange your video call. Any joining link will be shared directly before your appointment. Please have a reliable internet connection and a device with a camera and microphone.",
  in_person:
    "KMGMT will contact you on the WhatsApp number you provide to agree on the venue before your appointment. Please confirm the location with us before travelling. If you need a specific location, contact us before booking.",
};

export function consultationFormatLabel(format: string | null | undefined) {
  return format === "online" || format === "in_person"
    ? CONSULTATION_FORMAT_LABEL[format]
    : "To be arranged";
}

export function consultationDelivery(format: string | null | undefined) {
  return format === "online" || format === "in_person"
    ? CONSULTATION_DELIVERY[format]
    : "KMGMT will contact you to arrange your consultation details.";
}
