import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { reviewQuery } from "@/features/public/reviews";
import { ReviewCard } from "./ReviewDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Email links contain only a public review UUID, never the reviewer's address.
export function ReviewFromEmail() {
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const candidate = new URLSearchParams(search).get("review");
  const id =
    candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)
      ? candidate
      : null;
  const [dismissed, setDismissed] = useState<string | null>(null);
  const open = id !== null && dismissed !== id;
  const q = useQuery({ ...reviewQuery(id), enabled: open });
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setDismissed(id);
      }}
    >
      <DialogContent
        className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-2xl"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById("reviews-heading")?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Your review and KMGMT’s reply</DialogTitle>
          <DialogDescription>
            Read the original review and the latest public response from KMGMT.
          </DialogDescription>
        </DialogHeader>
        {q.isPending && <Skeleton className="h-48" />}
        {q.isError && (
          <div role="alert" className="text-sm text-muted-foreground">
            We couldn’t load this review.
            <Button variant="outline" className="mt-4" onClick={() => void q.refetch()}>
              Try again
            </Button>
          </div>
        )}
        {q.data && <ReviewCard review={q.data} />}
        {q.isSuccess && !q.data && (
          <p className="py-6 text-sm text-muted-foreground">This review is no longer available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
