import { Star } from "lucide-react";
import type { Quote } from "@/features/public/reviews";

export function ReviewStars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex gap-1 text-[#806022]"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden
          className={`h-3.5 w-3.5 ${star <= rating ? "fill-current" : "opacity-25"}`}
        />
      ))}
    </span>
  );
}

export function ReviewDate({ value }: { value: string }) {
  return (
    <time dateTime={value} className="text-xs text-muted-foreground">
      {new Intl.DateTimeFormat("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Johannesburg",
      }).format(new Date(value))}
    </time>
  );
}

export function ReviewReply({
  reply,
  compact = false,
}: {
  reply: Quote["review_replies"];
  compact?: boolean;
}) {
  if (!reply) return null;
  return (
    <div className="mt-6 border-l-2 border-gold/40 bg-secondary/70 px-4 py-3">
      <p className="text-xs font-semibold">Response from KMGMT</p>
      <p
        className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere] ${compact ? "line-clamp-3" : ""}`}
      >
        {reply.content}
      </p>
      <div className="mt-2">
        <ReviewDate value={reply.updated_at} />
      </div>
    </div>
  );
}

export function ReviewCard({ review }: { review: Quote }) {
  return (
    <article className="rounded-lg border border-gold/20 bg-background p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {review.rating !== undefined && <ReviewStars rating={review.rating} />}
        {review.created_at && <ReviewDate value={review.created_at} />}
      </div>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]">
        {review.content}
      </p>
      <p className="mt-5 break-words text-sm font-semibold [overflow-wrap:anywhere]">
        {review.client_name}
      </p>
      {review.role_or_context && (
        <p className="mt-1 text-xs text-muted-foreground">{review.role_or_context}</p>
      )}
      <ReviewReply reply={review.review_replies} />
    </article>
  );
}
