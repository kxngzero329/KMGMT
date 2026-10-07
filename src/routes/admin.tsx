import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, ClipboardList, Clock, CreditCard, LayoutDashboard, LogOut, Mail, Menu, MessageSquareQuote, Shirt, Tag, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/admin/login" });
    const { data: ok } = await supabase.rpc("is_admin");
    if (!ok) throw redirect({ to: "/admin/login" });
    return { user: data.user };
  },
  head: () => ({ meta: [{ title: "Admin | KMGMT" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/availability", label: "Availability", icon: Clock },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/services", label: "Services", icon: Tag },
  { to: "/admin/players", label: "Players", icon: Shirt },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { to: "/admin/enquiries", label: "Enquiries", icon: Mail },
] as const;

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Admin">
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          activeOptions={{ exact: "exact" in n }}
          onClick={() => setOpen(false)}
          className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-primary"
        >
          <n.icon className="h-4 w-4" /> {n.label}
        </Link>
      ))}
      <button onClick={signOut} className="mt-4 flex h-10 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-secondary lg:flex">
      <aside className="hidden w-60 shrink-0 bg-sidebar lg:block">
        <p className="wordmark px-6 py-6 text-lg text-sidebar-foreground">KMGMT</p>
        {nav}
      </aside>
      <header className="flex h-14 items-center justify-between bg-sidebar px-4 lg:hidden">
        <p className="wordmark text-sidebar-foreground">KMGMT</p>
        <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="text-sidebar-foreground"><Menu /></button>
      </header>
      {open && <div className="bg-sidebar lg:hidden">{nav}</div>}
      <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
