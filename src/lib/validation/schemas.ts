import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number, e.g. +27 82 123 4567");
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Enter a full link starting with https://")
  .optional();

export const clientDetailsSchema = z
  .object({
    full_name: z.string().trim().min(2, "Please enter your full name").max(120),
    age: z.coerce.number({ invalid_type_error: "Please enter your age" }).int().min(6, "Age must be 6 or older").max(100),
    email: z.string().trim().email("Enter a valid email address").max(255),
    whatsapp: phone,
    position: optionalText(60),
    current_club: optionalText(120),
    previous_clubs: optionalText(500),
    playing_level: optionalText(80),
    country: z.string().trim().min(2, "Please enter your country").max(80),
    help_required: z.string().trim().min(2, "Tell us briefly what you need help with").max(500),
    situation_description: optionalText(2000),
    social_profile: optionalText(300),
    highlight_video_url: optionalUrl,
    guardian_name: optionalText(120),
    guardian_email: z.string().trim().max(255).optional().or(z.literal("")),
    guardian_phone: z.string().trim().max(20).optional().or(z.literal("")),
    guardian_consent: z.boolean().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.age < 18) {
      if (!v.guardian_name || v.guardian_name.length < 2)
        ctx.addIssue({ code: "custom", path: ["guardian_name"], message: "Parent/guardian name is required" });
      if (!v.guardian_email || !z.string().email().safeParse(v.guardian_email).success)
        ctx.addIssue({ code: "custom", path: ["guardian_email"], message: "Enter a valid parent/guardian email" });
      if (!v.guardian_phone || !/^\+?[0-9 ()-]{7,20}$/.test(v.guardian_phone))
        ctx.addIssue({ code: "custom", path: ["guardian_phone"], message: "Enter a valid parent/guardian phone" });
      if (!v.guardian_consent)
        ctx.addIssue({ code: "custom", path: ["guardian_consent"], message: "Parent/guardian consent is required" });
    }
  });

export type ClientDetails = z.infer<typeof clientDetailsSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[0-9 ()-]{7,20}$/.test(v), "Enter a valid phone number")
    .optional(),
  subject: z.string().trim().min(2, "Please add a subject").max(150),
  message: z.string().trim().min(5, "Please write a short message").max(3000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const uuidSchema = z.string().uuid();
