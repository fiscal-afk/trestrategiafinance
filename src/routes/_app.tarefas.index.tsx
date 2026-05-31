import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { brl, ptDate } from "@/lib/format";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/tarefas/")({
  component: TarefasList,
});

type Tarefa = {
  id: string; empresa_id: string; competencia: string; titulo: string;
  categoria: string | null; status: string; classificacao: string;
  possui_imposto: boolean | null; faturamento: number | null; valor_imposto: number | null;
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

function TarefasList() {
  const [q, setQ] = useState("");
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

  const filtered = (tarefas ?? []).filter((t) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      t.titulo.toLowerCase().includes(s) ||
      (t.empresas?.razao_social ?? "").toLowerCase().includes(s) ||
      (t.empresas?.nome_fantasia ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input placeholder="Buscar por empresa ou título…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
        <Button asChild>
          <Link to="/tarefas/nova"><Plus className="h-4 w-4 mr-2" /> Nova tarefa</Link>
        </Button>
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
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <Info label="Faturamento" value={t.faturamento != null ? brl(t.faturamento) : "—"} />
              <Info label="Valor do imposto" value={t.valor_imposto != null ? brl(t.valor_imposto) : "—"} />
              <Info label="Status" value={concluida ? `Concluída em ${ptDate(t.concluido_em)}` : "Pendente"} />
            </div>
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
