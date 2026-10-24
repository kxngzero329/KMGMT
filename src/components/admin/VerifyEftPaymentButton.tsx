import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function VerifyEftPaymentButton({
  paymentId,
  onVerified,
}: {
  paymentId: string;
  onVerified?: () => void;
}) {
  const qc = useQueryClient();
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
    onError: () =>
      toast.error(
        "Could not verify this EFT payment. Refresh and check that the booking is still reserved and awaiting payment.",
      ),
  });
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={mutation.isPending}
      onClick={() => {
        if (
          window.confirm(
            "Have you checked the bank account and verified that the full invoice amount has arrived? Proof of payment alone is not verification. Mark this EFT payment received?",
          )
        )
          mutation.mutate();
      }}
    >
      {mutation.isPending ? "Saving…" : "Mark EFT received"}
    </Button>
  );
}
