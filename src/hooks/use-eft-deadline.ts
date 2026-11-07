import { useEffect, useState } from "react";
import { eftDeadlinePassed } from "@/lib/eft-policy";

/** Update controls at the deadline even when cached booking data is unchanged. */
export function useEftDeadlinePassed(dueAt: string | null | undefined) {
  const [passed, setPassed] = useState(() => eftDeadlinePassed(dueAt));
  useEffect(() => {
    setPassed(eftDeadlinePassed(dueAt));
    if (!dueAt || eftDeadlinePassed(dueAt)) return;
    const timer = setTimeout(
      () => setPassed(true),
      Math.min(2_147_483_647, Math.max(0, Date.parse(dueAt) - Date.now() + 50)),
    );
    return () => clearTimeout(timer);
  }, [dueAt]);
  return passed;
}
