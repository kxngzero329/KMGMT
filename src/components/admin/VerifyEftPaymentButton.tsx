import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useEftDeadlinePassed } from "@/hooks/use-eft-deadline";

export function VerifyEftPaymentButton({
  paymentId,
  onVerified,
  dueAt,
}: {
  paymentId: string;
  onVerified?: () => void;
  dueAt?: string | null;
}) {
  const qc = useQueryClient();
  const overdue = useEftDeadlinePassed(dueAt);
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("verify_eft_payment", { p_payment_id: paymentId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("EFT payment marked received");
      void qc.invalidateQueries({ queryKey: ["admin"] });
      onVerified?.();
    },
    onError: (error: Error) =>
      toast.error(
        error.message.includes("EFT_DEADLINE_PASSED")
          ? "The EFT deadline has passed. Contact the client to reconcile any funds and arrange a new booking or manual refund."
          : "Could not verify this EFT payment. Refresh and check that the booking is still reserved and awaiting payment.",
      ),
  });
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={mutation.isPending || overdue}
      onClick={() => {
        if (
          window.confirm(
            "Have you checked the bank account and verified that the full invoice amount has arrived? Proof of payment alone is not verification. Mark this EFT payment received?",
          )
        )
          mutation.mutate();
      }}
    >
      {mutation.isPending ? "Saving…" : overdue ? "EFT deadline passed" : "Mark EFT received"}
    </Button>
  );
}
