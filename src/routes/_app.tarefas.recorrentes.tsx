import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { brl, ptDate } from "@/lib/format";

export const Route = createFileRoute("/_app/tarefas/recorrentes")({
  component: TarefasRecorrentes,
});

function TarefasRecorrentes() {
  const { data, isLoading } = useQuery({
    queryKey: ["tarefas", "recorrentes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tarefas")
        .select("*, empresas(razao_social, nome_fantasia)")
        .eq("recorrente", true)
        .order("competencia", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="text-center py-12 text-muted-foreground">Carregando…</p>;
  if (!data?.length) {
    return <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma tarefa recorrente.</CardContent></Card>;
  }

  return (
    <div className="space-y-2">
      {data.map((t: any) => (
        <Card key={t.id}><CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{t.titulo}</p>
            <p className="text-xs text-muted-foreground">
              {t.empresas?.nome_fantasia || t.empresas?.razao_social} · {ptDate(t.competencia)}
            </p>
          </div>
          <span className="text-sm text-muted-foreground">{t.faturamento != null ? brl(t.faturamento) : "—"}</span>
        </CardContent></Card>
      ))}
    </div>
  );
}
