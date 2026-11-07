import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";

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

function AdminLayout() {
  const { user } = Route.useRouteContext();
  return <AdminWorkspace userEmail={user.email ?? ""} />;
}
