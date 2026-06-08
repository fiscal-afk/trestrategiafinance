import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { brl, ptDate } from "@/lib/format";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Plus, ExternalLink, Send, RefreshCw } from "lucide-react";
import { ensureTarefasCompetencia, currentCompetencia } from "@/lib/ensure-tarefas";


export const Route = createFileRoute("/_app/tarefas/")({
  component: TarefasList,
});

type Tarefa = {
  id: string; empresa_id: string; competencia: string; titulo: string;
  categoria: string | null; status: string; classificacao: string;
  possui_imposto: boolean | null; faturamento: number | null; valor_imposto: number | null;
  vencimento: string | null; enviado_ao_cliente: boolean | null; enviado_em: string | null;
  relatorio_id: string | null;
  recorrente: boolean; concluido_em: string | null;
  empresas?: { razao_social: string; nome_fantasia: string | null } | null;
};
type Item = { id: string; tarefa_id: string; tipo: string; concluido: boolean; arquivo_url: string | null };

const TIPOS = ["das", "declaracao", "recibo"] as const;
const TIPO_LABEL: Record<string, string> = { das: "DAS", declaracao: "Declaração", recibo: "Recibo" };

const CLASSIF: Record<string, { label: string; cls: string }> = {
  com_imposto: { label: "Com imposto", cls: "bg-success/15 text-success border-success/30" },
  sem_imposto: { label: "Sem imposto", cls: "bg-muted text-muted-foreground border-border" },
  sem_info: { label: "Sem informação", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

type Filtro = "todos" | "com_imposto" | "sem_imposto" | "sem_info";
const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "com_imposto", label: "Com imposto" },
  { id: "sem_imposto", label: "Sem imposto" },
  { id: "sem_info", label: "Sem informação" },
];

const competenciaLabel = (value: string) => {
  const [year, month] = value.slice(0, 7).split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date).replace(/^./, (char) => char.toUpperCase());
};

function TarefasList() {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [competencia, setCompetencia] = useState("todos");
  const [empresaFiltro, setEmpresaFiltro] = useState("todos");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  const { data: tarefas, isLoading } = useQuery({
    queryKey: ["tarefas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tarefas")
        .select("*, empresas(razao_social, nome_fantasia)")
        .order("competencia", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Tarefa[];
    },
  });

  const gerarTarefasMutation = useMutation({
    mutationFn: async (comp: string) => ensureTarefasCompetencia(comp),
    onSuccess: (created, comp) => {
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      toast.success(
        created > 0
          ? `${created} tarefa(s) criada(s) para ${competenciaLabel(comp)}`
          : `Todas as empresas já possuem tarefa em ${competenciaLabel(comp)}`,
      );
    },
    onError: (e: any) => toast.error("Erro", { description: e.message }),
  });

  // Auto-gera tarefas da competência atual na primeira carga
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !tarefas) return;
    autoRan.current = true;
    const comp = currentCompetencia();
    ensureTarefasCompetencia(comp).then((n) => {
      if (n > 0) qc.invalidateQueries({ queryKey: ["tarefas"] });
    }).catch(() => {});
  }, [tarefas, qc]);

  const filtered = (tarefas ?? []).filter((t) => {
    if (filtro !== "todos" && t.classificacao !== filtro) return false;
    if (competencia !== "todos" && !t.competencia.startsWith(competencia)) return false;
    if (empresaFiltro !== "todos" && t.empresa_id !== empresaFiltro) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      t.titulo.toLowerCase().includes(s) ||
      (t.empresas?.razao_social ?? "").toLowerCase().includes(s) ||
      (t.empresas?.nome_fantasia ?? "").toLowerCase().includes(s)
    );
  });

  const competencias = Array.from(new Set((tarefas ?? []).map((t) => t.competencia.slice(0, 7)))).sort((a, b) => b.localeCompare(a));
  const empresasUnicas = Array.from(
    new Map(
      (tarefas ?? []).map((t) => [t.empresa_id, t.empresas?.nome_fantasia || t.empresas?.razao_social || "—"] as const),
    ).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const counts = {
    todos: tarefas?.length ?? 0,
    com_imposto: tarefas?.filter((t) => t.classificacao === "com_imposto").length ?? 0,
    sem_imposto: tarefas?.filter((t) => t.classificacao === "sem_imposto").length ?? 0,
    sem_info: tarefas?.filter((t) => t.classificacao === "sem_info").length ?? 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Input placeholder="Buscar por empresa ou título…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
          <select
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="todos">Todas as competências</option>
            {competencias.map((item) => (
              <option key={item} value={item}>{competenciaLabel(item)}</option>
            ))}
          </select>
          <select
            value={empresaFiltro}
            onChange={(e) => setEmpresaFiltro(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm max-w-xs"
          >
            <option value="todos">Todas as empresas</option>
            {empresasUnicas.map(([id, nome]) => (
              <option key={id} value={id}>{nome}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => gerarTarefasMutation.mutate(competencia !== "todos" ? competencia : currentCompetencia())}
            disabled={gerarTarefasMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${gerarTarefasMutation.isPending ? "animate-spin" : ""}`} />
            Gerar tarefas da competência
          </Button>
          <Button asChild>
            <Link to="/tarefas/nova"><Plus className="h-4 w-4 mr-2" /> Nova tarefa</Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`px-3 py-1.5 rounded-full border text-sm transition ${
              filtro === f.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted border-border text-muted-foreground"
            }`}
          >
            {f.label} <span className="opacity-60 ml-1">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center py-12 text-muted-foreground">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Nenhuma tarefa encontrada. <Link to="/tarefas/nova" className="text-accent underline">Criar a primeira</Link>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TarefaRow
              key={t.id}
              t={t}
              open={!!expanded[t.id]}
              onToggle={() => setExpanded((s) => ({ ...s, [t.id]: !s[t.id] }))}
              onChange={() => qc.invalidateQueries({ queryKey: ["tarefas"] })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TarefaRow({
  t, open, onToggle, onChange,
}: { t: Tarefa; open: boolean; onToggle: () => void; onChange: () => void }) {
  const empresaNome = t.empresas?.nome_fantasia || t.empresas?.razao_social || "—";
  const cls = CLASSIF[t.classificacao] ?? CLASSIF.sem_info;
  const concluida = t.status === "concluida";

  const { data: items } = useQuery({
    queryKey: ["tarefa-items", t.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("checklist_tarefa")
        .select("*")
        .eq("tarefa_id", t.id);
      if (error) throw error;
      // garante 3 itens (DAS / Declaração / Recibo)
      const list = (data ?? []) as Item[];
      const existing = new Set(list.map((i) => i.tipo));
      const missing = TIPOS.filter((x) => !existing.has(x));
      if (missing.length) {
        const { data: ins } = await (supabase as any)
          .from("checklist_tarefa")
          .insert(missing.map((tipo) => ({ tarefa_id: t.id, tipo })))
          .select();
        return [...list, ...((ins ?? []) as Item[])].sort(
          (a, b) => TIPOS.indexOf(a.tipo as any) - TIPOS.indexOf(b.tipo as any),
        );
      }
      return list.sort((a, b) => TIPOS.indexOf(a.tipo as any) - TIPOS.indexOf(b.tipo as any));
    },
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
      const { error } = await (supabase as any).from("checklist_tarefa").update({ concluido }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      onChange();
      toast.success("Checklist atualizado");
    },
    onError: (e: any) => toast.error("Erro", { description: e.message }),
  });

  const marcarEnviado = useMutation({
    mutationFn: async ({ id, enviado }: { id: string; enviado: boolean }) => {
      const { error } = await (supabase as any)
        .from("tarefas")
        .update({ enviado_ao_cliente: enviado, enviado_em: enviado ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      onChange();
      toast.success("Tarefa atualizada");
    },
    onError: (e: any) => toast.error("Erro", { description: e.message }),
  });

  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition"
        >
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          {concluida ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{t.titulo}</p>
            <p className="text-xs text-muted-foreground truncate">
              {empresaNome} · {ptDate(t.competencia)}{t.recorrente ? " · Recorrente" : ""}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${cls.cls}`}>{cls.label}</span>
          {t.faturamento != null && (
            <span className="text-xs text-muted-foreground hidden md:inline">{brl(t.faturamento)}</span>
          )}
        </button>

        {open && (
          <div className="border-t p-4 bg-muted/20 space-y-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <Info label="Faturamento" value={t.faturamento != null ? brl(t.faturamento) : "—"} />
              <Info label="Valor do DAS" value={t.valor_imposto != null ? brl(t.valor_imposto) : "—"} />
              <Info label="Vencimento" value={t.vencimento ? ptDate(t.vencimento) : "—"} />
              <Info label="Status" value={concluida ? `Concluída em ${ptDate(t.concluido_em)}` : "Pendente"} />
            </div>

            {t.relatorio_id && (
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/relatorios/$id" params={{ id: t.relatorio_id }}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Visualizar relatório
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/relatorios/$id" params={{ id: t.relatorio_id }}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Abrir relatório
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant={t.enviado_ao_cliente ? "secondary" : "default"}
                  onClick={() => marcarEnviado.mutate({ id: t.id, enviado: !t.enviado_ao_cliente })}
                  disabled={marcarEnviado.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t.enviado_ao_cliente
                    ? `Enviado em ${ptDate(t.enviado_em)}`
                    : "Marcar como enviado ao cliente"}
                </Button>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Checklist obrigatório</p>
              <div className="space-y-2">
                {(items ?? []).map((it) => (
                  <label key={it.id} className="flex items-center gap-3 p-2 rounded border bg-card cursor-pointer">
                    <Checkbox
                      checked={it.concluido}
                      onCheckedChange={(v) => toggleItem.mutate({ id: it.id, concluido: !!v })}
                    />
                    <span className="text-sm">{TIPO_LABEL[it.tipo] ?? it.tipo}</span>
                    {it.concluido && <CheckCircle2 className="h-4 w-4 text-success ml-auto" />}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ao marcar os 3 itens, a tarefa será concluída automaticamente.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-medium mt-1">{value}</p>
    </div>
  );
}
