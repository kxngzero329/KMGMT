import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareReply } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { REVIEW_SELECT, type PublicReview } from "@/features/public/reviews";
import { ReviewCard } from "@/components/reviews/ReviewDetails";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Panel, inputCls } from "./AdminUI";

const PAGE_SIZE = 10;

export function AdminReviews() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState<{
    review: PublicReview;
    content: string;
    canNotify: boolean;
  } | null>(null);
  const q = useQuery({
    queryKey: ["admin", "reviews", page],
    queryFn: async ({ signal }) => {
      const { data, count, error } = await supabase
        .from("reviews")
        .select(REVIEW_SELECT, { count: "exact" })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .abortSignal(signal);
      if (error) throw error;
      const { data: contacts, error: contactError } = data.length
        ? await supabase
            .from("review_contacts")
            .select("review_id")
            .in(
              "review_id",
              data.map((review) => review.id),
            )
            .abortSignal(signal)
        : { data: [], error: null };
      if (contactError) throw contactError;
      const contactIds = new Set(contacts.map((contact) => contact.review_id));
      return {
        rows: data.map((review) => ({ ...review, canNotify: contactIds.has(review.id) })),
        count: count ?? 0,
      };
    },
    refetchInterval: 30_000,
  });
  const reply = useMutation({
    mutationFn: async ({
      id,
      content,
    }: {
      id: string;
      content: string | null;
      canNotify: boolean;
    }) => {
      if (content !== null && (content.trim().length < 2 || content.trim().length > 1500))
        throw new Error("Write a reply between 2 and 1,500 characters.");
      const { error } =
        content === null
          ? await supabase.from("review_replies").delete().eq("review_id", id)
          : await supabase
              .from("review_replies")
              .upsert({ review_id: id, content: content.trim() }, { onConflict: "review_id" });
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      toast.success(
        variables.content === null
          ? "Your reply was removed"
          : variables.canNotify
            ? "Your reply is public. An email notification has been queued."
            : "Your reply is public. This older review has no email address to notify.",
      );
      setEdit(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
        qc.invalidateQueries({ queryKey: ["public", "reviews"] }),
        qc.invalidateQueries({ queryKey: ["public", "review"] }),
      ]);
    },
    onError: () => toast.error("Unable to save your reply. Please try again."),
  });

  return (
    <section aria-labelledby="visitor-reviews-heading" className="mb-10">
      <Panel className="mb-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="visitor-reviews-heading" className="text-lg font-semibold">
              Visitor reviews{q.data ? ` (${q.data.count})` : ""}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Reviews publish automatically. You can respond publicly as KMGMT; the visitor’s
              original words and rating stay unchanged. Publishing a reply also queues an email to
              the reviewer when a private email address is available.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={q.isFetching}
            onClick={() => void q.refetch()}
          >
            Refresh
          </Button>
        </div>
      </Panel>
      {q.isPending && <Skeleton className="h-48" />}
      {q.isError && (
        <p role="alert" className="mb-5 text-sm text-destructive">
          Couldn’t load visitor reviews. Use Refresh to try again.
        </p>
      )}
      <ul className="space-y-4">
        {(q.data?.rows ?? []).map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {review.canNotify
                  ? "Reviewer will be notified by email when you reply."
                  : "Older review · No email address was collected."}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setEdit({
                    review,
                    content: review.review_replies?.content ?? "",
                    canNotify: review.canNotify,
                  })
                }
              >
                <MessageSquareReply className="mr-2 h-4 w-4" aria-hidden />
                {review.review_replies ? "Edit your reply" : "Reply as KMGMT"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {q.data && !q.data.rows.length && (
        <p className="py-6 text-sm text-muted-foreground">No visitor reviews on this page yet.</p>
      )}
      {!!q.data?.count && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={page === 0 || q.isFetching}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {Math.max(1, Math.ceil(q.data.count / PAGE_SIZE))}
          </span>
          <Button
            variant="outline"
            disabled={(page + 1) * PAGE_SIZE >= q.data.count || q.isFetching}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      )}
      {edit && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !reply.isPending) setEdit(null);
          }}
        >
          <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reply to {edit.review.client_name}</DialogTitle>
              <DialogDescription>
                Your response will be displayed publicly below this review as “Response from KMGMT”.
              </DialogDescription>
            </DialogHeader>
            <p className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-secondary p-4 text-sm leading-6 [overflow-wrap:anywhere]">
              {edit.review.content}
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                reply.mutate({
                  id: edit.review.id,
                  content: edit.content,
                  canNotify: edit.canNotify,
                });
              }}
              className="space-y-4"
            >
              <label className="block text-sm font-semibold">
                Your reply
                <textarea
                  required
                  minLength={2}
                  maxLength={1500}
                  rows={5}
                  disabled={reply.isPending}
                  value={edit.content}
                  onChange={(event) => setEdit({ ...edit, content: event.target.value })}
                  className={`${inputCls} mt-2 h-auto py-3`}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                {edit.content.length}/1,500 characters. Don’t include private client or booking
                details.
              </p>
              <div className="flex flex-wrap justify-between gap-3">
                {edit.review.review_replies && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reply.isPending}
                    onClick={() =>
                      reply.mutate({ id: edit.review.id, content: null, canNotify: edit.canNotify })
                    }
                  >
                    Remove your reply
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={
                    reply.isPending ||
                    edit.content.trim().length < 2 ||
                    edit.content.trim() === edit.review.review_replies?.content
                  }
                >
                  {reply.isPending ? "Saving…" : "Publish reply"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
