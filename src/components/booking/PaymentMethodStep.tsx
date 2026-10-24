import { Landmark, CreditCard } from "lucide-react";
import { BookingStepHeading } from "./BookingStep";
import { StepNav } from "./Stepper";
import { PAYFAST_AVAILABLE, PAYFAST_NOTICE, type PaymentMethod } from "@/lib/payment-methods";

export function PaymentMethodStep({
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <BookingStepHeading step={4} title="Choose how to pay">
        Choose your payment method before reviewing your online consultation.
      </BookingStepHeading>
      <fieldset className="mt-7 space-y-4">
        <legend className="sr-only">Payment method</legend>
        <label
          className={`flex cursor-pointer items-start gap-4 rounded-md border p-5 ${selected === "eft" ? "border-gold bg-secondary" : "border-border hover:border-gold/60"}`}
        >
          <input
            type="radio"
            name="payment-method"
            value="eft"
            checked={selected === "eft"}
            onChange={() => onSelect("eft")}
            className="mt-1 h-4 w-4 accent-[#806022]"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Landmark className="h-4 w-4 text-[#806022]" aria-hidden /> EFT / bank transfer
            </span>
            <span className="mt-2 block text-sm leading-7 text-muted-foreground">
              Receive a booking confirmation and PDF invoice by email, including the bank details
              and your payment reference. Pay by EFT and attach proof of payment via WhatsApp or
              email before your consultation.
            </span>
          </span>
        </label>
        <label className="flex cursor-not-allowed items-start gap-4 rounded-md border border-border bg-secondary/60 p-5">
          <input
            type="radio"
            name="payment-method"
            value="payfast"
            disabled={!PAYFAST_AVAILABLE}
            checked={selected === "payfast"}
            onChange={() => onSelect("payfast")}
            aria-describedby="payfast-notice"
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
              <CreditCard className="h-4 w-4" aria-hidden /> Pay online with PayFast{" "}
              <span className="rounded border px-2 py-0.5 text-[10px]">
                Temporarily unavailable
              </span>
            </span>
            <span
              id="payfast-notice"
              className="mt-2 block text-sm leading-7 text-muted-foreground"
            >
              {PAYFAST_NOTICE}
            </span>
          </span>
        </label>
      </fieldset>
      <p className="mt-5 rounded-md border border-gold/25 bg-secondary p-4 text-xs leading-6 text-muted-foreground">
        With EFT, your slot is reserved when you confirm your booking. Payment stays pending until
        Kieraan verifies the funds in his bank account. Sending proof does not automatically mark
        your booking paid.
      </p>
      <StepNav
        onBack={onBack}
        onNext={onNext}
        disabled={!selected || (selected === "payfast" && !PAYFAST_AVAILABLE)}
        nextLabel="Review booking"
      />
    </div>
  );
}
