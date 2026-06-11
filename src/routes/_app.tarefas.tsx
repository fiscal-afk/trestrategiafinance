import { createFileRoute, Link, useNavigate, useRouterState, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas — TR Estratégia Empresarial" }] }),
  component: TarefasLayout,
});

const tabs = [
  { to: "/tarefas", label: "Todas as tarefas", exact: true },
  { to: "/tarefas/recorrentes", label: "Recorrentes" },
];

function TarefasLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Operação fiscal</p>
        <h1 className="font-display text-4xl text-primary mt-1">Tarefas</h1>
      </header>
      <nav className="flex gap-2 border-b">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link key={t.to} to={t.to}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                    active
                      ? "border-accent text-accent"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}>
              {t.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
