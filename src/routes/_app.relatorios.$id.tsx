import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, TrendingUp, TrendingDown, MessageCircle, ExternalLink, Loader2 } from "lucide-react";
import { brl, pct, ptDate, competenciaRange, monthLabel } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { RelatorioPdf } from "@/components/RelatorioPdf";

export const Route = createFileRoute("/_app/relatorios/$id")({
  head: () => ({ meta: [{ title: "Relatório — TR Estratégia Empresarial" }] }),
  component: ReportPage,
});

function ReportPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!data) return;
    setDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(<RelatorioPdf rel={data.rel as any} cfg={cfg as any} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const empresa = (data.rel as any).empresas?.nome_fantasia || (data.rel as any).empresas?.razao_social || "relatorio";
      a.href = url;
      a.download = `TR-${empresa}-${(data.rel as any).competencia}.pdf`.replace(/\s+/g, "_");
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }


  const { data, isLoading } = useQuery({
    queryKey: ["relatorio", id],
    queryFn: async () => {
      const [rel, cfg] = await Promise.all([
        supabase.from("relatorios").select("*, empresas(*)").eq("id", id).single(),
        supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle(),
      ]);
      if (rel.error) throw rel.error;
      return { rel: rel.data, cfg: cfg.data };
    },
  });

  if (isLoading || !data) return <p className="text-center py-12 text-muted-foreground">Carregando…</p>;

  const r = data.rel as {
    competencia: string; faturamento_mensal: number; faturamento_anual: number;
    imposto: number; aliquota: number; vencimento: string | null;
    faturamento_mes_anterior: number | null; aliquota_anterior: number | null; crescimento: number | null;
    empresas: { razao_social: string; nome_fantasia: string | null; whatsapp: string | null; area_cliente: string | null };
  };
  const cfg = data.cfg ?? { frase_mes: "Empresas fortes crescem com estratégia e gestão inteligente.", whatsapp_tr: "", area_cliente_tr: "", logo_tr: "" };

  const pctAnual = r.faturamento_anual > 0 ? (Number(r.faturamento_mensal) / Number(r.faturamento_anual)) * 100 : 0;
  const compData = r.faturamento_mes_anterior != null ? [
    { mes: "Mês Anterior", valor: Number(r.faturamento_mes_anterior), kind: "prev" },
    { mes: monthLabel(r.competencia), valor: Number(r.faturamento_mensal), kind: "curr" },
  ] : [];
  const aliqData = r.aliquota_anterior != null ? [
    { mes: "Anterior", valor: Number(r.aliquota_anterior) },
    { mes: "Atual", valor: Number(r.aliquota) },
  ] : [];

  const cresc = r.crescimento ?? 0;
  const aliqDelta = r.aliquota_anterior != null ? Number(r.aliquota) - Number(r.aliquota_anterior) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 no-print">
        <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {downloading ? "Gerando PDF…" : "Baixar PDF"}
        </Button>
      </div>

      <article className="bg-card rounded-2xl overflow-hidden border" style={{ boxShadow: "var(--shadow-elegant)" }}>
        {/* Header */}
        <header className="p-8 lg:p-12 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <p className="text-xs uppercase tracking-[0.25em] opacity-70">TR Estratégia Empresarial</p>
          <h1 className="font-display text-3xl lg:text-5xl mt-3">{r.empresas.nome_fantasia || r.empresas.razao_social}</h1>
          <p className="mt-4 text-primary-foreground/80">Competência: <strong className="text-primary-foreground">{competenciaRange(r.competencia)}</strong></p>
        </header>

        <div className="p-8 lg:p-12 space-y-10">
          {/* Indicadores */}
          <section>
            <h2 className="font-display text-2xl text-primary mb-4">Indicadores Financeiros</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Metric label="Faturamento Mensal" value={brl(r.faturamento_mensal)} />
              <Metric label="DAS Simples Nacional" value={brl(r.imposto)} />
              <Metric label="Vencimento DAS" value={ptDate(r.vencimento)} />
              <Metric label="Alíquota Efetiva" value={pct(r.aliquota)} highlight />
            </div>
          </section>

          {/* Dashboard 1 — Anual vs Mês */}
          <section>
            <h2 className="font-display text-2xl text-primary mb-4">Faturamento Anual × Mensal</h2>
            <Card><CardContent className="pt-6">
              <div className="grid lg:grid-cols-2 gap-6 items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento anual (RBT12)</p>
                  <p className="font-display text-3xl text-primary">{brl(r.faturamento_anual)}</p>
                  <p className="text-sm text-muted-foreground mt-4">Faturamento de {monthLabel(r.competencia)}</p>
                  <p className="font-display text-3xl text-accent">{brl(r.faturamento_mensal)}</p>
                  <p className="mt-5 text-sm">
                    O faturamento de <strong>{monthLabel(r.competencia)}</strong> representa{" "}
                    <strong className="text-accent">{pct(pctAnual)}</strong> do faturamento anual.
                  </p>
                </div>
                <div>
                  <div className="relative h-40 rounded-lg overflow-hidden bg-muted">
                    <div className="absolute inset-y-0 left-0" style={{ width: `${Math.min(pctAnual, 100)}%`, background: "var(--gradient-accent)" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-4xl text-primary-foreground mix-blend-difference">{pct(pctAnual)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent></Card>
          </section>

          {/* Dashboard 2 — Comparação mensal */}
          {compData.length > 0 && (
            <section>
              <h2 className="font-display text-2xl text-primary mb-4">Comparação Mensal</h2>
              <Card><CardContent className="pt-6">
                <div className="grid lg:grid-cols-2 gap-6 items-center">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compData}>
                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip formatter={(v: number) => brl(v)} />
                        <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                          {compData.map((d, i) => (
                            <Cell key={i} fill={d.kind === "curr" ? "var(--color-accent)" : "var(--color-muted-foreground)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      cresc >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    }`}>
                      {cresc >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {cresc >= 0 ? "+" : ""}{pct(cresc)}
                    </div>
                    <p className="mt-4 text-sm">
                      Comparado ao mês anterior ({brl(r.faturamento_mes_anterior)}), o faturamento de{" "}
                      <strong>{monthLabel(r.competencia)}</strong> apresentou{" "}
                      {cresc >= 0 ? "crescimento" : "redução"} de <strong>{pct(Math.abs(cresc))}</strong>.
                    </p>
                  </div>
                </div>
              </CardContent></Card>
            </section>
          )}

          {/* Dashboard 3 — Evolução tributária */}
          {aliqData.length > 0 && (
            <section>
              <h2 className="font-display text-2xl text-primary mb-4">Evolução Tributária</h2>
              <Card><CardContent className="pt-6">
                <div className="grid lg:grid-cols-2 gap-6 items-center">
                  <div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Anterior</p>
                        <p className="font-display text-3xl text-muted-foreground">{pct(r.aliquota_anterior)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Atual</p>
                        <p className="font-display text-3xl text-primary">{pct(r.aliquota)}</p>
                      </div>
                    </div>
                    <div className={`mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      aliqDelta >= 0 ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
                    }`}>
                      {aliqDelta >= 0 ? "+" : ""}{aliqDelta.toFixed(2).replace(".", ",")} pp
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {aliqDelta >= 0 ? "Aumento" : "Redução"} de{" "}
                      <strong className="text-foreground">{Math.abs(aliqDelta).toFixed(2).replace(".", ",")} ponto percentual</strong>{" "}
                      na alíquota efetiva.
                    </p>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aliqData}>
                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip formatter={(v: number) => pct(v)} />
                        <Bar dataKey="valor" radius={[8, 8, 0, 0]} fill="var(--color-primary)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent></Card>
            </section>
          )}

          {/* Frase do mês */}
          <section className="rounded-xl p-8 text-center" style={{ background: "var(--gradient-accent)" }}>
            <p className="font-display text-2xl lg:text-3xl text-primary-foreground leading-snug">
              "{cfg.frase_mes}"
            </p>
          </section>
        </div>

        {/* Rodapé */}
        <footer className="px-8 lg:px-12 py-6 border-t bg-muted/30 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-base text-primary">TR Estratégia Empresarial</p>
            {cfg.logo_tr ? <img src={cfg.logo_tr} alt="TR" className="h-6 mt-1" /> : null}
          </div>
          <div className="flex items-center gap-4 text-sm">
            {cfg.whatsapp_tr && (
              <a href={`https://wa.me/${cfg.whatsapp_tr.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1.5 text-accent hover:underline">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {cfg.area_cliente_tr && (
              <a href={cfg.area_cliente_tr} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1.5 text-accent hover:underline">
                <ExternalLink className="h-4 w-4" /> Área do Cliente
              </a>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "border-accent/40 bg-accent/5" : "bg-muted/30"}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-display text-2xl mt-1 ${highlight ? "text-accent" : "text-primary"}`}>{value}</p>
    </div>
  );
}
