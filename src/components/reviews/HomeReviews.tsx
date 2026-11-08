import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageSquareQuote } from "lucide-react";
import { reviewsQuery, REVIEW_PAGE_SIZE, type Quote } from "@/features/public/reviews";
import { TestimonialSlider } from "@/components/home/TestimonialSlider";
import { ReviewForm } from "./ReviewForm";
import { ReviewCard } from "./ReviewDetails";
import { ReviewFromEmail } from "./ReviewFromEmail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ReviewPage = Awaited<ReturnType<NonNullable<ReturnType<typeof reviewsQuery>["queryFn"]>>>;

function ReviewList() {
  const [page, setPage] = useState(0);
  const q = useQuery(reviewsQuery(page));
  return (
    <>
      {q.isPending && <Skeleton className="h-48" />}
      {q.isError && (
        <div role="alert" className="py-6 text-sm text-muted-foreground">
          We couldn’t load the reviews.{" "}
          <button className="ml-2 underline" onClick={() => void q.refetch()}>
            Try again
          </button>
        </div>
      )}
      {q.data && (
        <>
          <div className="space-y-4">
            {q.data.rows.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          {!q.data.rows.length && (
            <p className="py-6 text-sm text-muted-foreground">No reviews on this page.</p>
          )}
          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <Button
              variant="outline"
              disabled={page === 0 || q.isFetching}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              Page {page + 1} of {Math.max(1, Math.ceil(q.data.count / REVIEW_PAGE_SIZE))}
            </span>
            <Button
              variant="outline"
              disabled={(page + 1) * REVIEW_PAGE_SIZE >= q.data.count || q.isFetching}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </>
  );
}

export function HomeReviews({
  quotes,
  initialReviews,
}: {
  quotes: Quote[];
  initialReviews?: ReviewPage | null;
}) {
  const q = useQuery({
    ...reviewsQuery(),
    ...(initialReviews ? { initialData: initialReviews } : {}),
  });
  const [open, setOpen] = useState(false);
  const cards: Quote[] = [
    ...(q.data?.rows ?? []),
    ...quotes.map((quote) => ({ ...quote, id: `testimonial-${quote.id}` })),
  ];

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="home-section border-y border-gold/20 bg-secondary"
    >
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow home-eyebrow">First-hand perspectives</p>
            <h2 id="reviews-heading" tabIndex={-1} className="home-heading mt-4 focus:outline-none">
              Trust, in <span className="gold-text">their words.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              Experiences, shared in their own words. Leave a review of your experience with KMGMT.
            </p>
          </div>
          <ReviewForm />
        </div>
        {cards.length > 0 ? (
          <TestimonialSlider quotes={cards} />
        ) : q.isPending ? (
          <Skeleton className="mt-10 h-52" />
        ) : (
          !q.isError && (
            <div className="mt-10 rounded-lg border border-gold/20 bg-background p-8 text-center">
              <MessageSquareQuote className="mx-auto h-7 w-7 text-[#806022]" aria-hidden />
              <p className="mt-4 font-semibold">
                Your experience could help someone take their next step.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Be the first to share a review.</p>
            </div>
          )
        )}
        {q.isError && (
          <p role="alert" className="mt-5 text-sm text-muted-foreground">
            Visitor reviews are temporarily unavailable.{" "}
            <button className="underline underline-offset-4" onClick={() => void q.refetch()}>
              Try again
            </button>
          </p>
        )}
        {!!q.data?.count && (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-gold/20 pt-5">
            <p className="text-xs text-muted-foreground">
              {q.data.count} visitor {q.data.count === 1 ? "review" : "reviews"} · Published
              directly by visitors
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="min-h-11">
                  View all reviews
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Reviews from our visitors</DialogTitle>
                  <DialogDescription>
                    Reviews publish automatically and are not verified against bookings. KMGMT
                    replies appear below the original review.
                  </DialogDescription>
                </DialogHeader>
                {open && <ReviewList />}
              </DialogContent>
            </Dialog>
          </div>
        )}
        <ReviewFromEmail />
      </div>
    </section>
  );
}
