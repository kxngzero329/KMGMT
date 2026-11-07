import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  PanelLeftClose,
  PanelLeftOpen,
  Shirt,
  Tag,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_GROUPS = [
  {
    label: "Your day",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard },
      { to: "/admin/bookings", label: "Bookings", icon: ClipboardList },
      { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      { to: "/admin/availability", label: "Availability", icon: Clock },
    ],
  },
  {
    label: "People & payments",
    items: [
      { to: "/admin/clients", label: "Clients", icon: Users },
      { to: "/admin/payments", label: "Payments", icon: CreditCard },
      { to: "/admin/enquiries", label: "Enquiries", icon: Mail },
    ],
  },
  {
    label: "Your website",
    items: [
      { to: "/admin/services", label: "Services", icon: Tag },
      { to: "/admin/players", label: "Players", icon: Shirt },
      { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    ],
  },
] as const;
const SIDEBAR_PREFERENCE = "kmgmt-admin-sidebar-collapsed";

function RailTip({
  label,
  enabled,
  children,
  side = "right",
}: {
  label: string;
  enabled: boolean;
  children: ReactNode;
  side?: "right" | "bottom";
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Tooltip
      open={enabled && hovered}
      onOpenChange={(open) => {
        if (!open) setHovered(false);
      }}
      disableHoverableContent
    >
      <TooltipTrigger
        asChild
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={() => setHovered(false)}
        onPointerCancel={() => setHovered(false)}
        onFocus={(event) => event.preventDefault()}
        onBlur={() => setHovered(false)}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={14}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function AdminWorkspace({ userEmail }: { userEmail: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname.replace(/\/$/, ""),
  });
  const activePage =
    NAV_GROUPS.map((group) => group.items.find((item) => item.to === pathname)?.label).find(
      Boolean,
    ) ?? "Workspace";

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_PREFERENCE) === "true");
    } catch {
      /* Storage may be disabled. */
    }
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeMobile = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener("change", closeMobile);
    return () => desktop.removeEventListener("change", closeMobile);
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_PREFERENCE, String(next));
    } catch {
      /* Keep this session usable. */
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await qc.cancelQueries();
      qc.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await navigate({ to: "/admin/login", replace: true });
    } catch {
      toast.error("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  const navigation = (rail: boolean) => (
    <nav
      aria-label={rail ? "Admin navigation, collapsed" : "Admin navigation"}
      className="admin-sidebar-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-6"
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p
            className={
              rail
                ? "sr-only"
                : "mb-2.5 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55"
            }
          >
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => (
              <RailTip key={item.to} label={item.label} enabled={rail}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === "/admin" }}
                  aria-label={item.label}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex min-h-11 items-center rounded-lg text-sm transition-colors hover:bg-white/[0.055] hover:text-white data-[status=active]:bg-white/[0.07] data-[status=active]:text-gold motion-reduce:transition-none ${rail ? "justify-center px-0" : "gap-3 px-3"} ${pathname === item.to ? "text-gold" : "text-sidebar-foreground/60"}`}
                >
                  <span
                    className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-gold opacity-0 group-data-[status=active]:opacity-100"
                    aria-hidden
                  />
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} aria-hidden />
                  {!rail && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight
                        className="h-3 w-3 opacity-0 group-data-[status=active]:opacity-60"
                        aria-hidden
                      />
                    </>
                  )}
                </Link>
              </RailTip>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const account = (rail: boolean) => (
    <div className="border-t border-white/10 p-3">
      {!rail && (
        <div className="mb-3 flex min-w-0 items-center gap-3 px-2 py-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 text-xs font-semibold text-gold"
            aria-hidden
          >
            K
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-sidebar-foreground">KMGMT admin</span>
            <span className="mt-1 block truncate text-[10px] text-sidebar-foreground/55">
              {userEmail}
            </span>
          </span>
        </div>
      )}
      <RailTip label="Sign out" enabled={rail}>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          aria-label="Sign out"
          className={`flex min-h-11 w-full items-center rounded-lg text-xs text-sidebar-foreground/55 transition-colors hover:bg-white/5 hover:text-sidebar-foreground disabled:opacity-50 ${rail ? "justify-center" : "gap-3 px-3"}`}
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
          {!rail && (signingOut ? "Signing out…" : "Sign out")}
        </button>
      </RailTip>
    </div>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={`admin-workspace flex min-h-dvh flex-col bg-secondary text-foreground transition-[padding] duration-200 motion-reduce:transition-none ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}
      >
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-background focus:p-3"
        >
          Skip to workspace
        </a>
        <aside
          id="admin-desktop-sidebar"
          aria-label="Desktop sidebar"
          className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/5 bg-[#151410] transition-[width] duration-200 motion-reduce:transition-none lg:flex ${collapsed ? "w-20" : "w-64"}`}
        >
          <div
            className={`flex h-24 shrink-0 items-center border-b border-white/[0.07] ${collapsed ? "justify-center" : "px-6"}`}
          >
            <Link to="/admin" aria-label="KMGMT admin overview" className="text-sidebar-foreground">
              <span className={`wordmark ${collapsed ? "text-sm" : "text-xl"}`}>
                {collapsed ? "KM" : "KMGMT"}
              </span>
              {!collapsed && (
                <span className="mt-2 block text-[9px] uppercase tracking-[0.25em] text-sidebar-foreground/55">
                  The workspace
                </span>
              )}
            </Link>
          </div>
          {navigation(collapsed)}
          {account(collapsed)}
        </aside>
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur-sm sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open admin navigation"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-white lg:hidden"
                >
                  <Menu className="h-4 w-4" aria-hidden />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-[min(20rem,90vw)] flex-col gap-0 border-white/10 bg-[#151410] p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground"
              >
                <div className="border-b border-white/10 px-6 py-7">
                  <SheetTitle className="wordmark text-xl text-sidebar-foreground">
                    KMGMT
                  </SheetTitle>
                  <SheetDescription className="mt-2 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/55">
                    Your admin workspace
                  </SheetDescription>
                </div>
                {navigation(false)}
                {account(false)}
              </SheetContent>
            </Sheet>
            <RailTip
              label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              enabled={collapsed}
              side="bottom"
            >
              <button
                type="button"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
                aria-controls="admin-desktop-sidebar"
                onClick={toggleSidebar}
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-white text-muted-foreground transition-colors hover:border-gold/50 hover:text-[#806022] lg:flex"
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
                ) : (
                  <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
                )}
              </button>
            </RailTip>
            <div className="flex min-w-0 items-center gap-2 text-xs">
              <span className="hidden text-muted-foreground sm:inline">Workspace</span>
              <ChevronRight
                className="hidden h-3 w-3 text-muted-foreground/50 sm:block"
                aria-hidden
              />
              <span className="truncate font-semibold">{activePage}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="hidden border-r pr-4 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline">
              South African time · SAST
            </span>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-[#806022]"
            >
              View website
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          </div>
        </header>
        <main
          id="admin-main"
          className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 px-4 py-7 sm:px-7 sm:py-9 lg:px-9 lg:py-10"
        >
          <Outlet />
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-4 py-5 text-[10px] text-muted-foreground sm:px-7 lg:px-9">
          <span>KMGMT · Independent guidance. Clear direction.</span>
          <span>Admin workspace</span>
        </footer>
      </div>
    </TooltipProvider>
  );
}
