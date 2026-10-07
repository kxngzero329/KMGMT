import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { createPayfastPayment } from "@/features/payments/client";
import { submitPayfastForm } from "@/features/payments/redirect";

export const Route = createFileRoute("/booking/cancelled")({
  validateSearch: z.object({ booking: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Payment Cancelled | KMGMT" },
      { name: "description", content: "Your payment was cancelled." },
      { property: "og:title", content: "Payment Cancelled | KMGMT" },
      { property: "og:description", content: "Your payment was cancelled." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Cancelled,
});

function Cancelled() {
  const { booking } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      const r = await createPayfastPayment(booking);
      if (!r.ok) setError(r.error);
      else submitPayfastForm(r.action, r.fields);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex max-w-xl flex-col items-center py-16 text-center">
      <h1 className="text-3xl font-extrabold">Payment cancelled</h1>
      <p className="mt-3 text-muted-foreground">
        No problem, you haven't been charged. Your chosen time is held for a short while (up to 15
        minutes from when you started payment) if you'd like to try again.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}{" "}
          {error.includes("expired") && (
            <Link to="/book" className="underline">
              Start a new booking
            </Link>
          )}
        </p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {booking && (
          <Button size="lg" onClick={retry} disabled={loading}>
            {loading ? "Please wait…" : "Try Payment Again"}
          </Button>
        )}
        <Button asChild size="lg" variant="outline">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
