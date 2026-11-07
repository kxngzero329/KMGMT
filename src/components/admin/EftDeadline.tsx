import { formatDate, formatTime } from "@/lib/utils/format";
import { useEftDeadlinePassed } from "@/hooks/use-eft-deadline";

export function EftDeadline({
  dueAt,
  paymentStatus,
  cancellationReason,
}: {
  dueAt: string | null | undefined;
  paymentStatus: string | null | undefined;
  cancellationReason?: string | null;
}) {
  const passed = useEftDeadlinePassed(dueAt);
  if (!dueAt) return null;
  return (
    <span className="mt-2 block text-xs leading-5 text-muted-foreground">
      <span className="block">
        EFT deadline: {formatDate(dueAt)}, {formatTime(dueAt)} SAST
      </span>
      {paymentStatus === "pending" && (
        <span className={`block ${passed ? "font-semibold text-destructive" : ""}`}>
          {passed
            ? "Deadline passed — automatic cancellation pending. Check any payment with the client before arranging another booking."
            : "Verify funds and mark EFT received before this deadline to prevent automatic cancellation."}
        </span>
      )}
      {cancellationReason === "eft_payment_overdue" && (
        <span className="block font-semibold text-destructive">
          Automatically cancelled: EFT payment deadline passed.
        </span>
      )}
    </span>
  );
}
