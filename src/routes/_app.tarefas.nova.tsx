import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tarefas/nova")({
  component: NovaTarefa,
});

function NovaTarefa() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    empresa_id: "",
    competencia: new Date().toISOString().slice(0, 7) + "-01",
    titulo: "",
    categoria: "fiscal",
    possui_imposto: true,
    faturamento: "",
    valor_imposto: "",
    recorrente: false,
  });

  const { data: empresas } = useQuery({
    queryKey: ["empresas-select"],
    queryFn: async () => {
      const { data } = await supabase.from("empresas").select("id, razao_social, nome_fantasia").order("razao_social");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.empresa_id || !form.titulo) throw new Error("Empresa e título são obrigatórios.");
      const faturamento = form.faturamento ? Number(form.faturamento) : null;
      const valor_imposto = form.valor_imposto ? Number(form.valor_imposto) : null;
      const classificacao = !form.possui_imposto
        ? "sem_imposto"
        : valor_imposto && valor_imposto > 0
          ? "com_imposto"
          : "sem_info";
      const { error, data } = await (supabase as any).from("tarefas").insert({
        empresa_id: form.empresa_id,
        competencia: form.competencia,
        titulo: form.titulo,
        categoria: form.categoria,
        possui_imposto: form.possui_imposto,
        faturamento,
        valor_imposto,
        recorrente: form.recorrente,
        classificacao,
      }).select().single();
      if (error) throw error;
      // pré-cria checklist
      await (supabase as any).from("checklist_tarefa").insert(
        ["das", "declaracao", "recibo"].map((tipo) => ({ tarefa_id: data.id, tipo })),
      );
      return data;
    },
    onSuccess: () => {
      toast({ title: "Tarefa criada" });
      navigate({ to: "/tarefas" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6 space-y-4">
        <div className="grid gap-2">
          <Label>Empresa</Label>
          <Select value={form.empresa_id} onValueChange={(v) => setForm((f) => ({ ...f, empresa_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
            <SelectContent>
              {(empresas ?? []).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome_fantasia || e.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Competência</Label>
            <Input type="date" value={form.competencia} onChange={(e) => setForm((f) => ({ ...f, competencia: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Input value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Título</Label>
          <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Ex.: Apuração mensal — Maio/2026" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Faturamento</Label>
            <Input type="number" step="0.01" value={form.faturamento} onChange={(e) => setForm((f) => ({ ...f, faturamento: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label>Valor do imposto</Label>
            <Input type="number" step="0.01" value={form.valor_imposto} onChange={(e) => setForm((f) => ({ ...f, valor_imposto: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.possui_imposto} onCheckedChange={(v) => setForm((f) => ({ ...f, possui_imposto: !!v }))} />
            Possui imposto
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.recorrente} onCheckedChange={(v) => setForm((f) => ({ ...f, recorrente: !!v }))} />
            Tarefa recorrente
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => navigate({ to: "/tarefas" })}>Cancelar</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Salvando…" : "Criar tarefa"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
