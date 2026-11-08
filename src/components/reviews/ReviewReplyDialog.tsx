import { MessageSquareReply } from "lucide-react";
import type { Quote } from "@/features/public/reviews";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReviewReply } from "./ReviewDetails";

export function ReviewReplyDialog({
  reply,
  reviewerName,
  duplicate,
  onOpenChange,
}: {
  reply: Quote["review_replies"];
  reviewerName: string;
  duplicate: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!reply) return null;

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          tabIndex={duplicate ? -1 : undefined}
          aria-label={`View KMGMT’s reply to ${reviewerName}`}
          className="mt-4 inline-flex min-h-11 items-center gap-2 self-start rounded-sm text-xs font-semibold text-[#806022] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <MessageSquareReply className="h-4 w-4" aria-hidden />
          View reply
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%_-_2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Response from KMGMT</DialogTitle>
          <DialogDescription className="break-words [overflow-wrap:anywhere]">
            In reply to {reviewerName}’s review.
          </DialogDescription>
        </DialogHeader>
        <ReviewReply reply={reply} />
      </DialogContent>
    </Dialog>
  );
}
