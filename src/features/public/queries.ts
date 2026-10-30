import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicBookingSummary } from "@/types/domain";
import { withPlayerPhotos, PHOTO_REFRESH_INTERVAL_MS } from "@/features/players/photos";

export const servicesQuery = queryOptions({
  queryKey: ["public", "services"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("services")
      .select(
        "id, name, slug, short_description, full_description, duration_minutes, price_cents, display_order",
      )
      .eq("active", true)
      .order("display_order");
    if (error) throw error;
    return data;
  },
  staleTime: 60_000,
});

export type PublicService = Awaited<ReturnType<NonNullable<typeof servicesQuery.queryFn>>>[number];

export const playersQuery = (limit?: number) =>
  queryOptions({
    queryKey: ["public", "players", limit ?? "all"],
    queryFn: async ({ client }) => {
      let q = supabase
        .from("represented_players")
        .select("*")
        .eq("visible", true)
        .eq("active", true)
        .order("display_order");
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return withPlayerPhotos(data, client);
    },
    staleTime: 60_000,
    refetchInterval: PHOTO_REFRESH_INTERVAL_MS,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

export const testimonialsQuery = queryOptions({
  queryKey: ["public", "testimonials"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("id, client_name, role_or_context, content")
      .eq("approved", true)
      .order("display_order");
    if (error) throw error;
    return data;
  },
  staleTime: 60_000,
});

export const bookingSettingsQuery = queryOptions({
  queryKey: ["public", "booking-settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("booking_settings")
      .select("max_advance_days, timezone")
      .single();
    if (error) throw error;
    return data;
  },
});

export const availableDatesQuery = (serviceId: string, from: string, to: string) =>
  queryOptions({
    queryKey: ["public", "dates", serviceId, from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_available_dates", {
        p_service_id: serviceId,
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return data as string[];
    },
    staleTime: 15_000,
  });

export const availableSlotsQuery = (serviceId: string, date: string) =>
  queryOptions({
    queryKey: ["public", "slots", serviceId, date],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_service_id: serviceId,
        p_date: date,
      });
      if (error) throw error;
      return (data as string[]).slice().sort();
    },
    staleTime: 0,
  });

export async function fetchBookingSummary(bookingId: string): Promise<PublicBookingSummary | null> {
  const { data, error } = await supabase.rpc("get_booking_public", { p_booking_id: bookingId });
  if (error) throw error;
  return (data as unknown as PublicBookingSummary) ?? null;
}

export async function submitEnquiry(input: {
  name: string;
  email: string;
  phone?: string | undefined;
  subject: string;
  message: string;
}) {
  const { error } = await supabase.from("contact_enquiries").insert({
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    subject: input.subject,
    message: input.message,
  });
  if (error) {
    if (error.message.includes("ENQUIRY_RATE_LIMIT")) throw new Error("ENQUIRY_RATE_LIMIT");
    throw new Error("ENQUIRY_SUBMISSION_FAILED");
  }
}
