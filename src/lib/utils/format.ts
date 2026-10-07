export const TIMEZONE = "Africa/Johannesburg";

export function formatZAR(cents: number | null | undefined): string {
  if (cents == null) return "";
  const rands = cents / 100;
  return `R${rands.toLocaleString("en-ZA", { minimumFractionDigits: rands % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  }).format(new Date(iso));
}

export function formatShortDate(iso: string | Date): string {
  return formatDate(iso, { weekday: "short", day: "numeric", month: "short", year: undefined });
}

export function formatTime(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | Date): string {
  return `${formatShortDate(iso)}, ${formatTime(iso)}`;
}

/** YYYY-MM-DD for a Date as seen in Johannesburg. */
export function toZonedDateKey(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return parts;
}

/** Local calendar Date (midnight browser-local) to YYYY-MM-DD, ignoring timezone. */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateKeyToLocal(key: string): Date {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}
