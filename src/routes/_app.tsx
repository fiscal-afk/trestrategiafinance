import { createFileRoute, redirect, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { TrLogo } from "@/components/TrLogo";
import { LayoutDashboard, Building2, Upload, Settings, LogOut, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/upload", label: "Upload PGDAS", icon: Upload },
  { to: "/tarefas", label: "Tarefas", icon: ListChecks },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function AppLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-muted/40">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground p-5 sticky top-0 h-screen no-print">
        <div className="px-1 mb-8"><TrLogo className="text-sidebar-foreground" /></div>
        <nav className="flex-1 space-y-1">
          {navItems.map((it) => {
            const active = pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}>
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" onClick={logout}
                className="justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </aside>

      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground no-print">
          <TrLogo className="text-sidebar-foreground" />
          <Button variant="ghost" size="sm" onClick={logout} className="text-sidebar-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="lg:hidden flex gap-1 overflow-x-auto bg-sidebar/95 text-sidebar-foreground px-2 pb-2 no-print">
          {navItems.map((it) => {
            const active = pathname.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to}
                    className={`whitespace-nowrap px-3 py-1.5 rounded text-xs ${
                      active ? "bg-sidebar-accent" : "opacity-70"
                    }`}>
                {it.label}
              </Link>
            );
          })}
        </div>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
