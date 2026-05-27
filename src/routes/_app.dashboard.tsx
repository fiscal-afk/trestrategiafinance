import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, TrendingUp, Clock } from "lucide-react";
import { brl, ptDate } from "@/lib/format";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TR Estratégia Empresarial" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [emp, rel] = await Promise.all([
        supabase.from("empresas").select("id, razao_social, nome_fantasia, status, created_at").order("created_at", { ascending: false }),
        supabase.from("relatorios").select("id, empresa_id, competencia, faturamento_mensal, status, created_at, empresas(razao_social, nome_fantasia)").order("created_at", { ascending: false }),
      ]);
      const empresas = emp.data ?? [];
      const relatorios = rel.data ?? [];
      const ativas = empresas.filter((e) => e.status === "ativa").length;
      const now = new Date();
      const mesAtual = relatorios.filter((r) => {
        const d = new Date(r.competencia);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const faturamentoMes = mesAtual.reduce((s, r) => s + Number(r.faturamento_mensal ?? 0), 0);
      const pendentes = relatorios.filter((r) => r.status !== "concluido").length;
      return { empresas, relatorios, ativas, mesAtual: mesAtual.length, faturamentoMes, pendentes };
    },
  });

  const stats = [
    { label: "Empresas ativas", value: data?.ativas ?? 0, icon: Building2, hint: `${data?.empresas.length ?? 0} no total` },
    { label: "Relatórios do mês", value: data?.mesAtual ?? 0, icon: FileText, hint: "Competência atual" },
    { label: "Faturamento total (mês)", value: brl(data?.faturamentoMes ?? 0), icon: TrendingUp, hint: "Soma de todas as empresas" },
    { label: "Relatórios pendentes", value: data?.pendentes ?? 0, icon: Clock, hint: "Aguardando geração" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Visão geral</p>
        <h1 className="font-display text-4xl text-primary mt-1">Dashboard</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/60" style={{ boxShadow: "var(--shadow-soft)" }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className="font-display text-3xl text-primary mt-2">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{ background: "var(--gradient-accent)" }}>
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-display">Últimas empresas</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {(data?.empresas ?? []).slice(0, 6).map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{e.nome_fantasia || e.razao_social}</p>
                    <p className="text-xs text-muted-foreground">{ptDate(e.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    e.status === "ativa" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}>{e.status}</span>
                </li>
              ))}
              {(!data?.empresas || data.empresas.length === 0) && (
                <li className="py-6 text-sm text-muted-foreground text-center">
                  Nenhuma empresa cadastrada. <Link to="/empresas" className="text-accent underline">Cadastrar</Link>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">Últimos relatórios</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {(data?.relatorios ?? []).slice(0, 6).map((r) => {
                const emp = (r as unknown as { empresas: { razao_social: string; nome_fantasia: string | null } }).empresas;
                return (
                  <li key={r.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{emp?.nome_fantasia || emp?.razao_social || "—"}</p>
                      <p className="text-xs text-muted-foreground">{ptDate(r.competencia)} · {brl(r.faturamento_mensal)}</p>
                    </div>
                    <Link to="/relatorios/$id" params={{ id: r.id }} className="text-xs text-accent hover:underline">
                      Abrir
                    </Link>
                  </li>
                );
              })}
              {(!data?.relatorios || data.relatorios.length === 0) && (
                <li className="py-6 text-sm text-muted-foreground text-center">
                  Nenhum relatório gerado ainda. <Link to="/upload" className="text-accent underline">Enviar PGDAS</Link>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
