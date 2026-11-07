import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  CreditCard,
  Mail,
  RotateCw,
  Wallet,
} from "lucide-react";
import { dashboardAttentionQuery, dashboardOverviewQuery } from "@/features/admin/dashboard";
import { latestPayment, type AdminBooking } from "@/features/admin/queries";
import { formatDate, formatTime, formatZAR, toZonedDateKey } from "@/lib/utils/format";
import { paymentMethodLabel } from "@/lib/payment-methods";
import { BookingDetailDialog } from "./BookingDetailDialog";
import { PaymentBadge, Panel } from "./AdminUI";
import { ClientContactActions } from "./ClientContactActions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PitchLines } from "@/components/common/PitchLines";

const SHORTCUTS = [
  {
    to: "/admin/availability",
    title: "Manage availability",
    text: "Working hours & date exceptions",
    icon: CalendarDays,
  },
  {
    to: "/admin/bookings",
    title: "Manage bookings",
    text: "Details, statuses & client contact",
    icon: Clock3,
  },
  {
    to: "/admin/enquiries",
    title: "Follow up enquiries",
    text: "Your next conversations",
    icon: Mail,
  },
] as const;

function ReadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/15 bg-destructive/[0.03] p-4 text-sm"
    >
      <CircleAlert className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
      <p className="flex-1">Couldn't refresh this section. Please try again.</p>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function timeLeft(dueAt: string | null) {
  if (!dueAt) return "Awaiting EFT";
  const remaining = Date.parse(dueAt) - Date.now();
  if (remaining <= 0) return "Deadline passed";
  if (remaining < 3_600_000) return `${Math.max(1, Math.ceil(remaining / 60_000))} min left`;
  return `${Math.ceil(remaining / 3_600_000)}h left`;
}

function BookingContact({
  booking,
  compact = false,
}: {
  booking: AdminBooking;
  compact?: boolean;
}) {
  if (!booking.clients) return null;
  return (
    <ClientContactActions
      name={booking.clients.full_name}
      email={booking.clients.email}
      whatsapp={booking.clients.whatsapp}
      country={booking.clients.country}
      reference={booking.booking_reference}
      compact={compact}
    />
  );
}

export function AdminDashboard() {
  const overview = useQuery(dashboardOverviewQuery);
  const attention = useQuery(dashboardAttentionQuery);
  const [open, setOpen] = useState<AdminBooking | null>(null);
  const [selectedView, setSelectedView] = useState<"eft" | "today" | "enquiries" | null>(null);
  const d = overview.data;
  const work = attention.data;
  const view = selectedView ?? (work?.eftCount ? "eft" : work?.todayCount ? "today" : "enquiries");
  const now = new Date();
  const refreshing = overview.isFetching || attention.isFetching;
  const updatedAt = Math.min(
    overview.dataUpdatedAt || Infinity,
    attention.dataUpdatedAt || Infinity,
  );
  const stats = [
    {
      label: "Today's consultations",
      value: d?.today,
      detail: "Across today's schedule",
      icon: CalendarDays,
      to: "/admin/calendar",
    },
    {
      label: "Upcoming bookings",
      value: d?.upcomingCount,
      detail: "Reserved future sessions",
      icon: Clock3,
      to: "/admin/bookings",
    },
    {
      label: "Awaiting EFT",
      value: d?.pendingEft,
      detail: "Funds to verify",
      icon: CreditCard,
      to: "/admin/payments",
    },
    {
      label: "Received this month",
      value: d ? formatZAR(d.received) : undefined,
      detail: now.toLocaleDateString("en-ZA", {
        timeZone: "Africa/Johannesburg",
        month: "long",
        year: "numeric",
      }),
      icon: Wallet,
      to: "/admin/payments",
    },
  ] as const;
  const attentionTabs = [
    { value: "eft", label: "EFT due soon", count: work?.eftCount, icon: CreditCard },
    { value: "today", label: "Today's sessions", count: work?.todayCount, icon: CalendarDays },
    { value: "enquiries", label: "New enquiries", count: work?.enquiryCount, icon: Mail },
  ] as const;

  return (
    <>
      <section className="relative isolate mb-7 overflow-hidden rounded-xl border border-gold/20 bg-[#191815] px-6 py-8 text-ink-foreground sm:px-8 sm:py-9">
        <PitchLines className="pointer-events-none absolute -right-28 -top-52 -z-10 w-[500px] rotate-12 text-gold/[0.07]" />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.23em] text-gold">
              Behind the game
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-[-0.035em] sm:text-4xl">
              Your day. <span className="text-ink-foreground/50">One clear view.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-7 text-ink-foreground/55">
              The bookings, conversations and next steps that need you.
            </p>
          </div>
          <div className="border-l border-gold/25 pl-5">
            <p className="text-[10px] uppercase tracking-wider text-ink-foreground/60">
              Your workspace today
            </p>
            <p className="mt-2 text-sm font-medium">
              {formatDate(now, { weekday: "long", day: "numeric", month: "long", year: undefined })}
            </p>
            <p className="mt-2 text-[10px] text-ink-foreground/60">South African Standard Time</p>
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          At a glance
        </p>
        <div className="flex items-center gap-3">
          {Number.isFinite(updatedAt) && (
            <span className="text-[10px] text-muted-foreground">
              Updated {formatTime(new Date(updatedAt))} SAST
            </span>
          )}
          <button
            type="button"
            disabled={refreshing}
            onClick={() => {
              void overview.refetch();
              void attention.refetch();
            }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-[11px] font-semibold text-muted-foreground hover:text-[#806022] disabled:opacity-50"
          >
            <RotateCw
              className={`h-3 w-3 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>
      </div>
      {overview.isError && (
        <div className="mb-4">
          <ReadError onRetry={() => void overview.refetch()} />
        </div>
      )}
      <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="group min-w-0 rounded-xl border border-border/80 bg-card p-4 shadow-[0_2px_12px_rgba(30,25,15,0.025)] transition-colors hover:border-gold/50 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium leading-5 text-muted-foreground">
                {stat.label}
              </p>
              <stat.icon
                className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-[#806022]"
                strokeWidth={1.4}
                aria-hidden
              />
            </div>
            {stat.value === undefined ? (
              overview.isPending ? (
                <Skeleton className="my-3 h-9 w-20" />
              ) : (
                <p className="my-3 text-2xl text-muted-foreground">—</p>
              )
            ) : (
              <p className="my-3 break-words text-3xl font-semibold tabular-nums tracking-[-0.04em]">
                {stat.value}
              </p>
            )}
            <p className="text-[10px] leading-5 text-muted-foreground/70">{stat.detail}</p>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Panel className="overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-border/70 p-5 sm:px-6">
              <div>
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#806022]">
                  Your next move
                </p>
                <h2 className="text-lg font-semibold tracking-tight">Needs attention</h2>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  A short list to help you focus on what matters next.
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/20 text-[#806022]">
                <CircleAlert className="h-4 w-4" strokeWidth={1.4} aria-hidden />
              </span>
            </div>
            <div
              className="grid grid-cols-3 gap-1 border-b border-border/70 bg-secondary/40 p-2"
              aria-label="Choose an attention list"
            >
              {attentionTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.value}
                  aria-pressed={view === tab.value}
                  onClick={() => setSelectedView(tab.value)}
                  className={`flex min-h-16 flex-col items-start justify-center gap-1 rounded-lg px-3 text-left transition-colors sm:flex-row sm:items-center sm:gap-2 ${view === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/60"}`}
                >
                  <tab.icon
                    className={`hidden h-3.5 w-3.5 shrink-0 sm:block ${view === tab.value ? "text-[#806022]" : ""}`}
                    aria-hidden
                  />
                  <span className="flex-1 text-[10px] font-semibold leading-5 sm:text-xs">
                    {tab.label}
                  </span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${view === tab.value ? "text-[#806022]" : ""}`}
                  >
                    {tab.count ?? "—"}
                  </span>
                </button>
              ))}
            </div>
            {attention.isError && (
              <div className="p-5">
                <ReadError onRetry={() => void attention.refetch()} />
              </div>
            )}
            {attention.isPending && (
              <div className="space-y-4 p-6">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-16" />
                ))}
              </div>
            )}
            {work && (
              <>
                {view === "eft" && (
                  <>
                    <div className="border-b border-border/60 bg-[#806022]/[0.025] px-5 py-3 text-[11px] leading-6 text-muted-foreground sm:px-6">
                      EFT deadlines within the next 24 hours, including overdue items. Check funds
                      and mark payment received before the deadline.
                    </div>
                    <ul className="divide-y divide-border/60">
                      {work.eft.map((item) => {
                        const b = item.bookings;
                        return (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                          >
                            <button
                              type="button"
                              onClick={() => setOpen(b)}
                              className="min-w-0 flex-1 rounded text-left"
                            >
                              <span className="block text-sm font-semibold hover:text-[#806022]">
                                {b.clients?.full_name ?? "Client"}
                              </span>
                              <span className="mt-1 block text-[11px] text-muted-foreground">
                                {b.booking_reference} · {b.services?.name}
                              </span>
                              <span
                                className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold ${item.due_at && Date.parse(item.due_at) <= Date.now() ? "text-destructive" : "text-[#806022]"}`}
                              >
                                <Clock3 className="h-3 w-3" aria-hidden />
                                {timeLeft(item.due_at)}
                                {item.due_at &&
                                  ` · ${formatDate(item.due_at, { weekday: undefined, year: undefined })}, ${formatTime(item.due_at)} SAST`}
                              </span>
                            </button>
                            <BookingContact booking={b} compact />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setOpen(b)}
                              className="rounded-lg"
                            >
                              Review
                              <ArrowUpRight className="h-3 w-3" aria-hidden />
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                    {!work.eft.length && (
                      <EmptyWork text="No EFT deadlines in the next 24 hours." />
                    )}
                    <AttentionFooter to="/admin/payments" label="View all payments" />
                  </>
                )}
                {view === "today" && (
                  <>
                    <ul className="divide-y divide-border/60">
                      {work.today.map((b) => (
                        <li
                          key={b.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                        >
                          <button
                            type="button"
                            onClick={() => setOpen(b)}
                            className="min-w-0 flex-1 rounded text-left"
                          >
                            <span className="block text-sm font-semibold hover:text-[#806022]">
                              {b.clients?.full_name ?? "Client"}
                            </span>
                            <span className="mt-1 block text-[11px] text-muted-foreground">
                              {b.services?.name} · {b.booking_reference}
                            </span>
                            <span className="mt-2 block text-[11px] font-semibold text-[#806022]">
                              {formatTime(b.start_time)}–{formatTime(b.end_time)} SAST
                            </span>
                          </button>
                          <BookingContact booking={b} compact />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setOpen(b)}
                            className="rounded-lg"
                          >
                            Details
                            <ArrowUpRight className="h-3 w-3" aria-hidden />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    {!work.today.length && (
                      <EmptyWork text="No more consultations on today's schedule." />
                    )}
                    <AttentionFooter to="/admin/calendar" label="Open your calendar" />
                  </>
                )}
                {view === "enquiries" && (
                  <>
                    <ul className="divide-y divide-border/60">
                      {work.enquiries.map((enquiry) => (
                        <li key={enquiry.id} className="px-5 py-4 sm:px-6">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{enquiry.name}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(enquiry.created_at, {
                                weekday: undefined,
                                year: undefined,
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-medium">{enquiry.subject}</p>
                          <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground">
                            {enquiry.message}
                          </p>
                          <a
                            href={`mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(`Re: ${enquiry.subject}`)}`}
                            className="mt-2 inline-flex min-h-9 items-center gap-2 text-[11px] font-semibold hover:text-[#806022]"
                          >
                            <Mail className="h-3 w-3" aria-hidden />
                            Reply via email
                            <ArrowUpRight className="h-3 w-3" aria-hidden />
                          </a>
                        </li>
                      ))}
                    </ul>
                    {!work.enquiries.length && (
                      <EmptyWork text="You're up to date. No new enquiries waiting." />
                    )}
                    <AttentionFooter to="/admin/enquiries" label="View all enquiries" />
                  </>
                )}
              </>
            )}
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 p-5 sm:px-6">
              <div>
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Coming up
                </p>
                <h2 className="text-lg font-semibold tracking-tight">Your next consultations</h2>
              </div>
              <Link
                to="/admin/calendar"
                className="inline-flex min-h-10 items-center gap-2 text-[11px] font-semibold text-muted-foreground hover:text-[#806022]"
              >
                Calendar
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            {overview.isPending && (
              <div className="space-y-4 p-6">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            )}
            {overview.isError && !d && (
              <div className="p-5">
                <ReadError onRetry={() => void overview.refetch()} />
              </div>
            )}
            {d && (
              <ul className="divide-y divide-border/60">
                {d.upcoming.map((b) => (
                  <li key={b.id} className="flex items-start gap-4 px-5 py-5 sm:px-6">
                    <div className="hidden w-12 shrink-0 rounded-lg border bg-secondary/50 py-2 text-center sm:block">
                      <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {new Intl.DateTimeFormat("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                          month: "short",
                        }).format(new Date(b.start_time))}
                      </span>
                      <span className="mt-1 block text-xl font-semibold leading-none">
                        {new Intl.DateTimeFormat("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                          day: "2-digit",
                        }).format(new Date(b.start_time))}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setOpen(b)}
                          className="min-w-0 rounded text-left"
                        >
                          <span className="block text-sm font-semibold hover:text-[#806022]">
                            {b.clients?.full_name ?? "Client"}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {b.services?.name}
                          </span>
                        </button>
                        <PaymentBadge status={latestPayment(b)?.status} />
                      </div>
                      <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
                        {toZonedDateKey(new Date(b.start_time)) === toZonedDateKey(now)
                          ? "Today"
                          : formatDate(b.start_time, { year: undefined })}{" "}
                        · {formatTime(b.start_time)} SAST ·{" "}
                        {paymentMethodLabel(latestPayment(b)?.provider)}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <BookingContact booking={b} compact />
                        <button
                          type="button"
                          onClick={() => setOpen(b)}
                          className="inline-flex min-h-9 items-center gap-2 rounded text-[11px] font-semibold text-muted-foreground hover:text-[#806022]"
                        >
                          View booking
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {d && !d.upcoming.length && (
              <EmptyWork text="No upcoming consultations. Your next bookings will appear here." />
            )}
          </Panel>
        </div>

        <aside className="space-y-5" aria-label="Workspace shortcuts and payment guidance">
          <Panel className="p-5 sm:p-6">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#806022]">
              Keep things moving
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">A clear next step</h2>
            <div className="mt-5 space-y-2">
              {SHORTCUTS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex min-h-18 items-center gap-3 rounded-lg border border-transparent px-2 py-3 transition-colors hover:border-border hover:bg-secondary/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground group-hover:text-[#806022]">
                    <item.icon className="h-4 w-4" strokeWidth={1.4} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold">{item.title}</span>
                    <span className="mt-1 block text-[10px] leading-5 text-muted-foreground">
                      {item.text}
                    </span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden />
                </Link>
              ))}
            </div>
          </Panel>
          <div className="rounded-xl border border-gold/20 bg-[#806022]/[0.025] p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#806022]" strokeWidth={1.4} aria-hidden />
              <h2 className="text-sm font-semibold">A note on EFT</h2>
            </div>
            <p className="mt-3 text-xs leading-7 text-muted-foreground">
              New EFT bookings need payment verified within 72 hours, or before the consultation if
              sooner. Check the bank account and mark funds received before the deadline to keep the
              reservation.
            </p>
            <p className="mt-3 border-t border-gold/15 pt-3 text-[10px] leading-6 text-muted-foreground">
              Sending proof alone doesn't verify payment. Existing EFT bookings keep their original
              terms.
            </p>
            <Link
              to="/admin/payments"
              className="mt-3 inline-flex min-h-9 items-center gap-2 text-[11px] font-semibold hover:text-[#806022]"
            >
              Review payments
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </aside>
      </div>
      <BookingDetailDialog booking={open} onClose={() => setOpen(null)} />
    </>
  );
}

function EmptyWork({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-secondary/40 text-muted-foreground">
        <Check className="h-4 w-4" strokeWidth={1.4} aria-hidden />
      </span>
      <p className="max-w-xs text-xs leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
function AttentionFooter({
  to,
  label,
}: {
  to: "/admin/payments" | "/admin/calendar" | "/admin/enquiries";
  label: string;
}) {
  return (
    <div className="border-t border-border/70 px-5 py-2 sm:px-6">
      <Link
        to={to}
        className="inline-flex min-h-10 items-center gap-2 text-[11px] font-semibold text-muted-foreground hover:text-[#806022]"
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
