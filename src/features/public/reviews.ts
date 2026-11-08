import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { supabase, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

export const REVIEW_PAGE_SIZE = 6;
export const REVIEW_SELECT =
  "id, client_name, role_or_context, rating, content, created_at, review_replies(content, updated_at)" as const;

export const reviewSchema = z.object({
  client_name: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(80, "Use 80 characters or fewer."),
  role_or_context: z.string().trim().max(100, "Use 100 characters or fewer."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Use 254 characters or fewer."),
  rating: z.number().int().min(1, "Choose a star rating.").max(5),
  content: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters.")
    .max(1500, "Use 1,500 characters or fewer."),
  consent: z
    .boolean()
    .refine((value) => value, "Please confirm that your review can be published."),
});

export const reviewsQuery = (page = 0) =>
  queryOptions({
    queryKey: ["public", "reviews", page],
    queryFn: async ({ signal }) => {
      const { data, error, count } = await supabase
        .from("reviews")
        .select(REVIEW_SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(page * REVIEW_PAGE_SIZE, (page + 1) * REVIEW_PAGE_SIZE - 1)
        .abortSignal(signal);
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
    staleTime: 15_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

export type PublicReview = Awaited<
  ReturnType<NonNullable<ReturnType<typeof reviewsQuery>["queryFn"]>>
>["rows"][number];

export const reviewQuery = (id: string | null) =>
  queryOptions({
    queryKey: ["public", "review", id],
    enabled: id !== null,
    queryFn: async ({ signal }) => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("reviews")
        .select(REVIEW_SELECT)
        .eq("id", id)
        .abortSignal(signal)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 15_000,
    refetchOnWindowFocus: "always",
  });

export type Quote = {
  id: string;
  client_name: string;
  role_or_context: string | null;
  content: string;
  rating?: number;
  created_at?: string;
  review_replies?: { content: string; updated_at: string } | null;
};

export async function submitReview(
  input: z.infer<typeof reviewSchema> & { id: string; website: string },
) {
  const { data, error } = await supabase.functions.invoke<{ id: string }>("submit-review", {
    body: input,
    headers: { "x-kmgmt-project-key": SUPABASE_PUBLISHABLE_KEY },
  });
  if (error) {
    let message = "We couldn't publish your review. Please try again shortly.";
    if (error.context instanceof Response) {
      try {
        const response: unknown = await error.context.json();
        if (
          response &&
          typeof response === "object" &&
          "error" in response &&
          typeof response.error === "string"
        )
          message = response.error;
      } catch {
        /* Use the safe fallback for network and gateway errors. */
      }
    }
    throw new Error(message);
  }
  if (!data?.id) throw new Error("We couldn't confirm your submission. Please try again.");
  return data.id;
}
