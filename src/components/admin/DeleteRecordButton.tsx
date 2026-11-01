import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DELETE_DETAILS, type DeletableEntity } from "@/features/admin/deletion";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function DeleteRecordButton({
  entity,
  recordId,
  recordLabel,
  onDeleted,
  disabled = false,
  buttonLabel = "Delete",
}: {
  entity: DeletableEntity;
  recordId: string;
  recordLabel: string;
  onDeleted?: () => void;
  disabled?: boolean;
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const locked = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const qc = useQueryClient();
  const detail = DELETE_DETAILS[entity];
  const deletion = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_delete_record", {
        p_entity: entity,
        p_id: recordId,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      // Stop stale in-flight reads from restoring deleted rows on another screen.
      await qc.cancelQueries({ queryKey: ["admin"] });
      await qc.cancelQueries({ queryKey: ["public"] });
      await qc.cancelQueries({ queryKey: ["booking-summary"] });
      setOpen(false);
      setConfirmation("");
      toast.success(`${detail.label.charAt(0).toUpperCase() + detail.label.slice(1)} deleted`);
      onDeleted?.();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin"] }),
        qc.invalidateQueries({ queryKey: ["public"] }),
        qc.invalidateQueries({ queryKey: ["booking-summary"] }),
      ]);
    },
    onError: (error: Error) =>
      toast.error(
        error.message.includes("RECORD_NOT_FOUND")
          ? "This record no longer exists. Refresh the page."
          : error.message.includes("ADMIN_REQUIRED") || error.message.includes("permission")
            ? "Admin access is required. Sign in again."
            : "Could not confirm deletion. Refresh the page to check whether the record still exists before retrying.",
      ),
    onSettled: () => {
      locked.current = false;
    },
  });

  return (
    <>
      <Button
        ref={trigger}
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || deletion.isPending}
        aria-label={`${buttonLabel}: ${recordLabel}`}
        className="gap-2 border-destructive/30 text-destructive hover:border-destructive hover:text-destructive"
        onClick={(event) => {
          event.stopPropagation();
          setConfirmation("");
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {buttonLabel}
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!locked.current) {
            setOpen(next);
            setConfirmation("");
          }
        }}
      >
        <AlertDialogContent
          className="max-h-[90dvh] overflow-y-auto"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            trigger.current?.focus();
          }}
          onClick={(event) => event.stopPropagation()}
          onEscapeKeyDown={(event) => {
            if (locked.current) event.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {detail.label} permanently?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="break-words font-semibold text-foreground">{recordLabel}</p>
                <p>{detail.effect}</p>
                <p>This cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="space-y-2 text-sm">
            <span className="block">
              Type <strong>DELETE</strong> to confirm.
            </span>
            <input
              aria-label="Type DELETE to confirm"
              autoComplete="off"
              spellCheck={false}
              disabled={deletion.isPending}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3"
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletion.isPending}>Keep {detail.label}</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmation !== "DELETE" || deletion.isPending}
              onClick={() => {
                if (confirmation !== "DELETE" || locked.current) return;
                locked.current = true;
                deletion.mutate();
              }}
            >
              {deletion.isPending ? (
                <>
                  <LoaderCircle className="animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete permanently"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
