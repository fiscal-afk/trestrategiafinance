import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { brl, pct, ptDate, competenciaRange, monthLabel } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, LabelList,
} from "recharts";

export const Route = createFileRoute("/_app/relatorios/$id")({
  head: () => ({ meta: [{ title: "Relatório — TR Estratégia Empresarial" }] }),
  component: ReportPage,
});

const PIE_COLORS = ["#3b6fa0", "#0f1b3d", "#7aa6cf"];

function ReportPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [isPrintMode, setIsPrintMode] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrintMode(true);
    const handleAfterPrint = () => setIsPrintMode(false);

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);



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

  const relatorio = data.rel as {
    id: string;
    competencia: string; faturamento_mensal: number; faturamento_anual: number;
    imposto: number; aliquota: number; vencimento: string | null;
    competencia_anterior: string | null; faturamento_mes_anterior: number | null; aliquota_anterior: number | null; crescimento: number | null;
    empresas: { razao_social: string; nome_fantasia: string | null; whatsapp: string | null; area_cliente: string | null; cnpj?: string };
  };
  const config = data.cfg ?? { frase_mes: "Empresas fortes crescem com estratégia e gestão inteligente.", whatsapp_tr: "", area_cliente_tr: "", logo_tr: "" };

  const faturamentoMensal = Number(relatorio.faturamento_mensal);
  const faturamentoAnual = Number(relatorio.faturamento_anual);
  const percentual = faturamentoAnual > 0 ? (faturamentoMensal / faturamentoAnual) * 100 : 0;

  const prevMonthName = relatorio.competencia_anterior ? monthLabel(relatorio.competencia_anterior) : "Mês Anterior";
  const currMonthName = monthLabel(relatorio.competencia);
  const fmAnt = relatorio.faturamento_mes_anterior != null ? Number(relatorio.faturamento_mes_anterior) : null;

  const barData = fmAnt != null ? [
    { mes: prevMonthName, valor: fmAnt },
    { mes: currMonthName, valor: faturamentoMensal },
  ] : [{ mes: currMonthName, valor: faturamentoMensal }];

  const dadosPizza = [
    { nome: "Receita Mensal", valor: faturamentoMensal },
    { nome: "Receita Restante (Anual)", valor: Math.max(0, faturamentoAnual - faturamentoMensal) },
  ];

  // Recalcula crescimento ao vivo — não confia no valor salvo
  const cresc = fmAnt != null && fmAnt > 0
    ? ((faturamentoMensal - fmAnt) / fmAnt) * 100
    : 0;

  const renderBarValue = ({ x = 0, y = 0, width = 0, value = 0 }: any) => (
    <text
      x={Number(x) + Number(width) / 2}
      y={Number(y) - 8}
      textAnchor="middle"
      fill="#0f1b3d"
      fontSize={isPrintMode ? 10 : 11}
      fontWeight={600}
    >
      {brl(Number(value))}
    </text>
  );

  async function imprimirRelatorio() {
    setIsPrintMode(true);

    if (typeof document !== "undefined" && "fonts" in document) {
      await document.fonts.ready.catch(() => undefined);
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    window.print();
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 no-print">
        <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button onClick={imprimirRelatorio}>
          <Download className="h-4 w-4 mr-2" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <article id="relatorio-print" className="bg-card rounded-xl overflow-hidden border" style={{ boxShadow: "var(--shadow-elegant)" }}>
        <header className="p-8 lg:p-12 text-primary-foreground flex items-start justify-between gap-6" style={{ background: "var(--gradient-primary)" }}>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.25em] opacity-70">TR Estratégia Empresarial</p>
            <h1 className="font-display text-3xl lg:text-5xl mt-3">{relatorio.empresas.nome_fantasia || relatorio.empresas.razao_social}</h1>
            <p className="mt-4 text-primary-foreground/80">Competência: <strong className="text-primary-foreground">{competenciaRange(relatorio.competencia)}</strong></p>
          </div>
          <TrLogo className="text-primary-foreground shrink-0" />
        </header>

        <div className="p-6 lg:p-8 space-y-6 print-flow">
          {/* Indicadores */}
          <section className="print-order-1">

            <h2 className="font-display text-2xl text-primary mb-4">Indicadores Financeiros</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Metric label="Faturamento Mensal" value={brl(relatorio.faturamento_mensal)} />
              <Metric label="DAS Simples Nacional" value={brl(relatorio.imposto)} />
              <Metric label="Vencimento DAS" value={ptDate(relatorio.vencimento)} />
              <Metric label="Alíquota Efetiva" value={pct(relatorio.aliquota)} highlight />
            </div>
          </section>

          {/* Faturamento Anual × Mensal — Pizza premium */}
          <section className="print-order-3">
            <h2 className="font-display text-2xl text-primary mb-3">Faturamento Anual × Mensal</h2>
            <Card style={{ boxShadow: "var(--shadow-soft)" }}>
              <CardContent className="pt-5 print-compact">
                <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] gap-5 items-center">
                  <div style={{ height: isPrintMode ? 170 : 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosPizza}
                          dataKey="valor"
                          nameKey="nome"
                          outerRadius={isPrintMode ? 74 : 102}
                          innerRadius={isPrintMode ? 38 : 54}
                          paddingAngle={4}
                          label={false}
                          labelLine={false}
                          isAnimationActive={false}
                        >
                          {dadosPizza.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number, n: string) =>
                            n === "Percentual" ? [pct(v), n] : [brl(v), n]
                          }
                        />
                        {!isPrintMode && <Legend />}
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Receita Mensal</p>
                      <p className="font-display text-2xl text-primary mt-1">{brl(faturamentoMensal)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Receita Anual (RBT12)</p>
                      <p className="font-display text-2xl text-primary mt-1">{brl(faturamentoAnual)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Percentual</p>
                      <p className="font-display text-2xl text-accent mt-1">{pct(percentual)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground mt-2">
              A receita mensal representa {pct(percentual)} da receita acumulada considerada para a apuração.
            </p>
          </section>

          {/* Comparação Mensal — Bar Chart */}
          {fmAnt != null && (
            <section className="print-order-4">
              <h2 className="font-display text-2xl text-primary mb-3">Comparação Mensal</h2>
              <Card style={{ boxShadow: "var(--shadow-soft)" }}>
                <CardContent className="pt-5">
                  <div style={{ height: isPrintMode ? 180 : 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ef" />
                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => brl(Number(v))} tick={{ fontSize: isPrintMode ? 10 : 11 }} width={isPrintMode ? 72 : 88} />
                        <Tooltip formatter={(v: number) => brl(v)} />
                        <Bar dataKey="valor" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                          {barData.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? "#7aa6cf" : "#0f1b3d"} />
                          ))}
                          <LabelList dataKey="valor" content={renderBarValue} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <p className="text-sm text-muted-foreground mt-2">
                {cresc >= 0
                  ? `Em comparação à competência anterior, o faturamento apresentou crescimento de ${pct(Math.abs(cresc))}.`
                  : `Em comparação à competência anterior, o faturamento apresentou redução de ${pct(Math.abs(cresc))}.`}
              </p>
            </section>
          )}
        </div>

        <footer className="px-6 lg:px-8 py-4 border-t bg-muted/30 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-base text-primary">TR Estratégia Empresarial</p>
            {config.logo_tr ? <img src={config.logo_tr} alt="TR" className="h-6 mt-1" /> : null}
          </div>
          <p className="text-sm text-muted-foreground">Relatório gerencial</p>
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
