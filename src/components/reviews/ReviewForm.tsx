import { useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LoaderCircle, Star } from "lucide-react";
import { reviewSchema, submitReview } from "@/features/public/reviews";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const inputClass =
  "mt-2 w-full rounded-md border border-input bg-background px-3 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";
const initial = {
  client_name: "",
  email: "",
  role_or_context: "",
  rating: 0,
  content: "",
  consent: false,
};

function Form() {
  const qc = useQueryClient();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initial, string>>>({});
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);
  const submitting = useRef(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const parsed = reviewSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    setError("");
    setPending(true);
    submitting.current = true;
    try {
      requestId.current ??= crypto.randomUUID();
      await submitReview({ ...parsed.data, id: requestId.current, website });
      setSent(true);
      // Cancel older requests so a stale response cannot overwrite the refresh.
      await qc.cancelQueries({ queryKey: ["public", "reviews"] });
      await qc.invalidateQueries({ queryKey: ["public", "reviews"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again shortly.");
    } finally {
      setPending(false);
      submitting.current = false;
    }
  }

  if (sent)
    return (
      <div className="py-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#806022]" aria-hidden />
        <h3 className="mt-5 text-xl font-semibold">Your review is published.</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Thank you for sharing your experience with KMGMT. We’ll email you when Kieraan replies.
        </p>
      </div>
    );

  return (
    <form onSubmit={send} noValidate className="space-y-5">
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        <div>
          <label htmlFor="review-name" className="text-sm font-semibold">
            Display name
          </label>
          <input
            id="review-name"
            autoComplete="nickname"
            maxLength={80}
            required
            aria-invalid={!!errors.client_name}
            aria-describedby="review-name-hint"
            value={values.client_name}
            onChange={(e) => setValues({ ...values, client_name: e.target.value })}
            className={inputClass}
            placeholder="The name shown with your review"
          />
          <p
            id="review-name-hint"
            className={`mt-1 text-xs ${errors.client_name ? "text-destructive" : "text-muted-foreground"}`}
          >
            {errors.client_name || "Use a name you’re comfortable displaying publicly."}
          </p>
        </div>
        <div>
          <label htmlFor="review-email" className="text-sm font-semibold">
            Email address <span className="font-normal text-muted-foreground">(private)</span>
          </label>
          <input
            id="review-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            required
            aria-invalid={!!errors.email}
            aria-describedby="review-email-hint"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
            className={inputClass}
            placeholder="you@example.com"
          />
          <p
            id="review-email-hint"
            className={`mt-1 text-xs ${errors.email ? "text-destructive" : "text-muted-foreground"}`}
          >
            {errors.email ||
              "Your email won’t be published. We use it to notify you when KMGMT replies to your review."}
          </p>
        </div>
        <div>
          <label htmlFor="review-context" className="text-sm font-semibold">
            Role / context <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="review-context"
            maxLength={100}
            value={values.role_or_context}
            onChange={(e) => setValues({ ...values, role_or_context: e.target.value })}
            className={inputClass}
            placeholder="e.g. Football player or parent"
          />
        </div>
        <fieldset aria-describedby={errors.rating ? "review-rating-error" : undefined}>
          <legend className="text-sm font-semibold">Your rating</legend>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <label
                key={star}
                className="cursor-pointer rounded-md p-2 has-focus-visible:ring-2 has-focus-visible:ring-ring"
              >
                <input
                  type="radio"
                  name="review-rating"
                  className="sr-only"
                  value={star}
                  checked={values.rating === star}
                  onChange={() => setValues({ ...values, rating: star })}
                  aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                />
                <Star
                  aria-hidden
                  className={`h-7 w-7 text-[#806022] ${star <= values.rating ? "fill-current" : "opacity-35"}`}
                />
              </label>
            ))}
          </div>
          {errors.rating && (
            <p id="review-rating-error" className="mt-1 text-xs text-destructive">
              {errors.rating}
            </p>
          )}
        </fieldset>
        <div>
          <label htmlFor="review-content" className="text-sm font-semibold">
            Your experience
          </label>
          <textarea
            id="review-content"
            maxLength={1500}
            rows={4}
            required
            aria-invalid={!!errors.content}
            aria-describedby="review-content-hint"
            value={values.content}
            onChange={(e) => setValues({ ...values, content: e.target.value })}
            className={inputClass}
            placeholder="Tell others about your experience with KMGMT."
          />
          <p
            id="review-content-hint"
            className={`mt-1 text-xs ${errors.content ? "text-destructive" : "text-muted-foreground"}`}
          >
            {errors.content ||
              `${values.content.length}/1,500 characters. Keep booking, payment and other private details out of your review.`}
          </p>
        </div>
        <div hidden aria-hidden="true">
          <label htmlFor="review-website">
            Website
            <input
              id="review-website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            checked={values.consent}
            onChange={(e) => setValues({ ...values, consent: e.target.checked })}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "review-consent-error" : undefined}
            className="mt-1 h-4 w-4 shrink-0 accent-[#806022]"
          />
          <span>
            I am 18 or older and agree to my display name, rating, review and optional role being
            published immediately on this website, and my private email being used for notifications
            about KMGMT’s replies. I have read the{" "}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              Privacy Policy<span className="sr-only"> (opens in a new tab)</span>
            </Link>
            .
          </span>
        </label>
        {errors.consent && (
          <p id="review-consent-error" className="text-xs text-destructive">
            {errors.consent}
          </p>
        )}
      </fieldset>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? (
          <>
            <LoaderCircle aria-hidden className="mr-2 h-4 w-4 animate-spin" />
            Publishing…
          </>
        ) : (
          "Publish review"
        )}
      </Button>
    </form>
  );
}

export function ReviewForm() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11">
          <Star className="mr-2 h-4 w-4" aria-hidden />
          Leave a review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share your experience.</DialogTitle>
          <DialogDescription>
            Your review appears publicly after you submit. No sign-in needed.
          </DialogDescription>
        </DialogHeader>
        {open && <Form />}
      </DialogContent>
    </Dialog>
  );
}
