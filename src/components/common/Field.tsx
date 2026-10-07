import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  required?: boolean | undefined;
  type?: string | undefined;
  multiline?: boolean | undefined;
  hint?: string | undefined;
  placeholder?: string | undefined;
  autoComplete?: string | undefined;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] | undefined;
}

export function Field({ label, value, onChange, error, required, type = "text", multiline, hint, placeholder, autoComplete, inputMode }: FieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    value,
    placeholder,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    "aria-required": required,
    className: `text-base ${error ? "border-destructive" : ""}`,
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label} {required ? <span className="text-gold" aria-hidden>*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {multiline ? (
        <Textarea {...common} rows={4} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input {...common} type={type} autoComplete={autoComplete} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} className={`h-12 ${common.className}`} />
      )}
      {hint && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
