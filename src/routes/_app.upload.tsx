import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, FileCheck2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { extractPgdas, type PgdasExtraction } from "@/lib/extract-pgdas.functions";
import { brl, pct, ptDate } from "@/lib/format";

export const Route = createFileRoute("/_app/upload")({
  head: () => ({ meta: [{ title: "Upload PGDAS — TR Estratégia Empresarial" }] }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const extract = useServerFn(extractPgdas);

  const [empresaId, setEmpresaId] = useState("");
  const [pgdas, setPgdas] = useState<File | null>(null);
  const [recibo, setRecibo] = useState<File | null>(null);
  const [das, setDas] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<(PgdasExtraction & { _pgdasPath?: string }) | null>(null);

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas", "ativas"],
    queryFn: async () => {
      const { data } = await supabase.from("empresas").select("id, razao_social, nome_fantasia").eq("status", "ativa").order("razao_social");
      return data ?? [];
    },
  });

  const upload = async (file: File, tipo: string) => {
    const path = `${empresaId}/${tipo}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("documentos").upload(path, file);
    if (error) throw error;
    await supabase.from("documentos").insert({
      empresa_id: empresaId, tipo, arquivo: path, nome_arquivo: file.name,
    });
    return path;
  };

  const process = useMutation({
    mutationFn: async () => {
      if (!empresaId) throw new Error("Selecione uma empresa");
      if (!pgdas) throw new Error("Envie a declaração PGDAS");
      const pgdasPath = await upload(pgdas, "pgdas");
      if (recibo) await upload(recibo, "recibo");
      if (das) await upload(das, "das");
      const result = await extract({ data: { bucketPath: pgdasPath } });
      return { ...result, _pgdasPath: pgdasPath };
    },
    onSuccess: (data) => {
      setExtracted(data);
      toast.success("Dados extraídos com sucesso");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const generate = useMutation({
    mutationFn: async () => {
      if (!extracted || !empresaId) throw new Error("Dados incompletos");
      const { data, error } = await supabase.from("relatorios").insert({
        empresa_id: empresaId,
        competencia: extracted.competencia ?? new Date().toISOString().slice(0, 10),
        faturamento_mensal: extracted.faturamento_mensal ?? 0,
        faturamento_anual: extracted.faturamento_anual ?? 0,
        imposto: extracted.imposto ?? 0,
        aliquota: extracted.aliquota ?? 0,
        vencimento: extracted.vencimento,
        status: "concluido",
      }).select("id").single();
      if (error) throw error;

      // Look up previous report for comparison
      const prev = await supabase.from("relatorios")
        .select("faturamento_mensal, aliquota")
        .eq("empresa_id", empresaId)
        .lt("competencia", extracted.competencia ?? new Date().toISOString().slice(0, 10))
        .order("competencia", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prev.data) {
        const crescimento = prev.data.faturamento_mensal > 0
          ? ((Number(extracted.faturamento_mensal ?? 0) - Number(prev.data.faturamento_mensal)) / Number(prev.data.faturamento_mensal)) * 100
          : 0;
        await supabase.from("relatorios").update({
          faturamento_mes_anterior: prev.data.faturamento_mensal,
          aliquota_anterior: prev.data.aliquota,
          crescimento,
        }).eq("id", data.id);
      }
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Relatório gerado!");
      navigate({ to: "/relatorios/$id", params: { id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Processamento</p>
        <h1 className="font-display text-4xl text-primary mt-1">Upload de Documentos PGDAS</h1>
        <p className="text-sm text-muted-foreground mt-2">Envie os documentos e a IA extrai os dados automaticamente.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="font-display">1. Selecione a empresa</CardTitle></CardHeader>
        <CardContent>
          <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">— Escolha uma empresa —</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">2. Envie os documentos</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <FileBox label="Declaração PGDAS *" file={pgdas} setFile={setPgdas} />
          <FileBox label="Recibo" file={recibo} setFile={setRecibo} />
          <FileBox label="DAS" file={das} setFile={setDas} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={() => process.mutate()} disabled={process.isPending || !empresaId || !pgdas}>
          {process.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extraindo dados…</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Processar Relatório</>
          )}
        </Button>
      </div>

      {extracted && (
        <Card className="border-accent/40" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <CardHeader><CardTitle className="font-display">3. Confira os dados extraídos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <EditableField label="Competência" type="date"
                value={extracted.competencia ?? ""}
                onChange={(v) => setExtracted({ ...extracted, competencia: v })}
                display={extracted.competencia ? ptDate(extracted.competencia) : "—"} />
              <EditableField label="Faturamento Mensal" type="number" step="0.01"
                value={String(extracted.faturamento_mensal ?? "")}
                onChange={(v) => setExtracted({ ...extracted, faturamento_mensal: Number(v) || 0 })}
                display={brl(extracted.faturamento_mensal)} />
              <EditableField label="Faturamento Anual (RBT12)" type="number" step="0.01"
                value={String(extracted.faturamento_anual ?? "")}
                onChange={(v) => setExtracted({ ...extracted, faturamento_anual: Number(v) || 0 })}
                display={brl(extracted.faturamento_anual)} />
              <EditableField label="DAS" type="number" step="0.01"
                value={String(extracted.imposto ?? "")}
                onChange={(v) => setExtracted({ ...extracted, imposto: Number(v) || 0 })}
                display={brl(extracted.imposto)} />
              <EditableField label="Alíquota Efetiva (%)" type="number" step="0.01"
                value={String(extracted.aliquota ?? "")}
                onChange={(v) => setExtracted({ ...extracted, aliquota: Number(v) || 0 })}
                display={pct(extracted.aliquota)} />
              <EditableField label="Vencimento" type="date"
                value={extracted.vencimento ?? ""}
                onChange={(v) => setExtracted({ ...extracted, vencimento: v })}
                display={extracted.vencimento ? ptDate(extracted.vencimento) : "—"} />
            </div>
            <div className="flex justify-end mt-6 gap-2">
              <Button variant="outline" onClick={() => setExtracted(null)}>Cancelar</Button>
              <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
                {generate.isPending ? "Gerando..." : "Confirmar e gerar relatório"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FileBox({ label, file, setFile }: { label: string; file: File | null; setFile: (f: File | null) => void }) {
  return (
    <label className="block cursor-pointer">
      <span className="text-sm font-medium">{label}</span>
      <div className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition ${
        file ? "border-success/40 bg-success/5" : "border-border hover:border-accent/60 hover:bg-accent/5"
      }`}>
        {file ? (
          <>
            <FileCheck2 className="h-8 w-8 mx-auto text-success" />
            <p className="mt-2 text-xs font-medium truncate">{file.name}</p>
          </>
        ) : (
          <>
            <UploadIcon className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-xs text-muted-foreground">PDF ou imagem</p>
          </>
        )}
      </div>
      <input type="file" accept=".pdf,image/*" className="hidden"
             onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
    </label>
  );
}

function EditableField({ label, value, onChange, display, type = "text", step }: {
  label: string; value: string; onChange: (v: string) => void; display: string; type?: string; step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
      <p className="text-xs text-muted-foreground">Extraído: <span className="font-medium text-foreground">{display}</span></p>
    </div>
  );
}
