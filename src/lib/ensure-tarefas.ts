import { supabase } from "@/integrations/supabase/client";

/**
 * Garante que toda empresa ativa tenha uma tarefa para a competência informada.
 * - Se não existir: cria tarefa classificada como "sem_info" (vermelho).
 * - Se existir relatório: cria/atualiza tarefa com classificação correta (com/sem imposto).
 */
export async function ensureTarefasCompetencia(competencia: string): Promise<number> {
  // competencia formato: YYYY-MM-01
  const comp = competencia.length === 7 ? `${competencia}-01` : competencia;

  const [empresasRes, tarefasRes, relatoriosRes] = await Promise.all([
    (supabase.from("empresas") as any)
      .select("id, razao_social, nome_fantasia, status")
      .eq("status", "ativa"),
    (supabase.from("tarefas") as any)
      .select("id, empresa_id, classificacao, relatorio_id")
      .eq("competencia", comp),
    (supabase.from("relatorios") as any)
      .select("id, empresa_id, faturamento_mensal, imposto, aliquota, vencimento, competencia")
      .eq("competencia", comp),
  ]);

  const empresas = (empresasRes.data ?? []) as Array<{
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
  }>;
  const tarefas = (tarefasRes.data ?? []) as Array<{
    id: string;
    empresa_id: string;
    classificacao: string;
    relatorio_id: string | null;
  }>;
  const relatorios = (relatoriosRes.data ?? []) as Array<{
    id: string;
    empresa_id: string;
    faturamento_mensal: number;
    imposto: number;
    aliquota: number;
    vencimento: string | null;
  }>;

  const tarefaByEmp = new Map(tarefas.map((t) => [t.empresa_id, t]));
  const relByEmp = new Map(relatorios.map((r) => [r.empresa_id, r]));

  const toInsert: any[] = [];
  let created = 0;

  for (const emp of empresas) {
    if (tarefaByEmp.has(emp.id)) continue;
    const rel = relByEmp.get(emp.id);
    const nome = emp.nome_fantasia || emp.razao_social;
    if (rel) {
      const imp = Number(rel.imposto ?? 0);
      const possui = imp > 0;
      toInsert.push({
        empresa_id: emp.id,
        relatorio_id: rel.id,
        competencia: comp,
        titulo: `${nome} — ${comp}`,
        categoria: possui ? "Imposto a pagar" : "Sem imposto",
        classificacao: possui ? "com_imposto" : "sem_imposto",
        possui_imposto: possui,
        faturamento: Number(rel.faturamento_mensal ?? 0),
        valor_imposto: imp,
        vencimento: rel.vencimento,
        status: "pendente",
      });
    } else {
      toInsert.push({
        empresa_id: emp.id,
        competencia: comp,
        titulo: `${nome} — ${comp}`,
        categoria: "Sem informações",
        classificacao: "sem_info",
        possui_imposto: false,
        status: "pendente",
      });
    }
  }

  if (toInsert.length) {
    const { error } = await (supabase as any).from("tarefas").insert(toInsert);
    if (error) throw error;
    created = toInsert.length;
  }

  return created;
}

export function currentCompetencia(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
