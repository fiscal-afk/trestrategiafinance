import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, TrendingUp, Clock, AlertCircle, Landmark, Percent } from "lucide-react";
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
        supabase.from("relatorios").select("id, empresa_id, competencia, faturamento_mensal, imposto, aliquota, status, created_at, empresas(razao_social, nome_fantasia)").order("competencia", { ascending: false }),
      ]);
      const empresas = emp.data ?? [];
      const relatorios = rel.data ?? [];
      const ativas = empresas.filter((e) => e.status === "ativa").length;

      // Último relatório por empresa
      const latestByEmp = new Map<string, typeof relatorios[number]>();
      for (const r of relatorios) {
        if (!latestByEmp.has(r.empresa_id)) latestByEmp.set(r.empresa_id, r);
      }
      const faturamentoTotal = Array.from(latestByEmp.values())
        .reduce((s, r) => s + Number(r.faturamento_mensal ?? 0), 0);

      let comImposto = 0, semImposto = 0;
      for (const r of latestByEmp.values()) {
        const fat = Number(r.faturamento_mensal ?? 0);
        const imp = Number(r.imposto ?? 0);
        if (fat > 0 && imp > 0) comImposto++;
        else semImposto++;
      }
      const semRelatorio = empresas.filter((e) => !latestByEmp.has(e.id)).length;

      return { empresas, relatorios, ativas, faturamentoTotal, comImposto, semImposto, semRelatorio };
    },
  });

  const [competencia, setCompetencia] = useState("todas");

  const competencias = useMemo(
    () => Array.from(new Set((data?.relatorios ?? []).map((r) => r.competencia.slice(0, 7)))).sort((a, b) => b.localeCompare(a)),
    [data?.relatorios],
  );

  const relatoriosCompetencia = useMemo(
    () => (data?.relatorios ?? []).filter((r) => competencia === "todas" || r.competencia.startsWith(competencia)),
    [competencia, data?.relatorios],
  );

  const latestByEmpCompetencia = useMemo(() => {
    const map = new Map<string, typeof relatoriosCompetencia[number]>();
    for (const r of relatoriosCompetencia) {
      if (!map.has(r.empresa_id)) map.set(r.empresa_id, r);
    }
    return Array.from(map.values());
  }, [relatoriosCompetencia]);

  const totalEmpresas = data?.empresas.length ?? 0;
  const faturamentoTotal = latestByEmpCompetencia.reduce((sum, item) => sum + Number(item.faturamento_mensal ?? 0), 0);
  const dasTotal = latestByEmpCompetencia.reduce((sum, item) => sum + Number(item.imposto ?? 0), 0);
  const empresasComImposto = latestByEmpCompetencia.filter((item) => Number(item.imposto ?? 0) > 0).length;
  const empresasSemImposto = latestByEmpCompetencia.filter((item) => Number(item.imposto ?? 0) <= 0).length;
  const empresasSemInformacoes = Math.max(0, totalEmpresas - latestByEmpCompetencia.length);
  const aliquotaMedia = latestByEmpCompetencia.length
    ? latestByEmpCompetencia.reduce((sum, item) => sum + Number(item.aliquota ?? 0), 0) / latestByEmpCompetencia.length
    : 0;

  const competenciaLabel = (value: string) => {
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date).replace(/^./, (char) => char.toUpperCase());
  };

  const stats = [
    { label: "Total empresas", value: totalEmpresas, icon: Building2, hint: `${data?.ativas ?? 0} ativas na base` },
    { label: "Faturamento total", value: brl(faturamentoTotal), icon: TrendingUp, hint: "Somatório da competência selecionada" },
    { label: "DAS total", value: brl(dasTotal), icon: Landmark, hint: "Total de imposto apurado" },
    { label: "Com imposto", value: empresasComImposto, icon: FileText, hint: "Empresas com DAS no período" },
    { label: "Sem imposto", value: empresasSemImposto, icon: Clock, hint: "Relatórios sem imposto na competência" },
    { label: "Sem informações", value: empresasSemInformacoes, icon: AlertCircle, hint: "Empresas sem relatório nessa competência" },
    { label: "Alíquota média", value: `${aliquotaMedia.toFixed(2).replace(".", ",")}%`, icon: Percent, hint: "Média dos relatórios exibidos" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Visão geral</p>
        <h1 className="font-display text-4xl text-primary mt-1">Dashboard</h1>
      </header>

      <div className="flex justify-end">
        <select
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="todas">Todas as competências</option>
          {competencias.map((item) => (
            <option key={item} value={item}>{competenciaLabel(item)}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
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
          <CardHeader><CardTitle className="font-display">Indicadores gerenciais</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              <li className="py-3 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Cobertura de relatórios</span>
                <span className="font-display text-2xl text-primary">
                  {totalEmpresas ? `${Math.round((latestByEmpCompetencia.length / totalEmpresas) * 100)}%` : "0%"}
                </span>
              </li>
              <li className="py-3 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Ticket médio por empresa</span>
                <span className="font-display text-2xl text-primary">
                  {brl(latestByEmpCompetencia.length ? faturamentoTotal / latestByEmpCompetencia.length : 0)}
                </span>
              </li>
              <li className="py-3 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Carga tributária média</span>
                <span className="font-display text-2xl text-primary">
                  {faturamentoTotal > 0 ? `${((dasTotal / faturamentoTotal) * 100).toFixed(2).replace(".", ",")}%` : "0,00%"}
                </span>
              </li>
              <li className="py-3 flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Relatórios emitidos</span>
                <span className="font-display text-2xl text-primary">{latestByEmpCompetencia.length}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">Últimos relatórios</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {relatoriosCompetencia.slice(0, 6).map((r) => {
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
