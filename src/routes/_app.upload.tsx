import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileText, CheckCircle2, AlertTriangle, Loader2, Sparkles, X, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { brl, pct, ptDate } from "@/lib/format";
import {
  pdfToText,
  detectDocType,
  extractPgdasFields,
  extractCnpj,
  formatCnpj,
  type DocType,
  type PgdasFields,
} from "@/lib/pgdas-parser";

export const Route = createFileRoute("/_app/upload")({
  head: () => ({ meta: [{ title: "Upload de Documentos — TR Estratégia Empresarial" }] }),
  component: UploadPage,
});

type ParsedFile = {
  id: string;
  file: File;
  status: "parsing" | "ready" | "error";
  docType?: DocType;
  cnpj?: string | null;
  fields?: PgdasFields;
  error?: string;
};

type Empresa = { id: string; numero_interno: number | null; razao_social: string; nome_fantasia: string | null; cnpj: string };

const DOC_LABEL: Record<DocType, string> = { pgdas: "Declaração PGDAS", das: "DAS", recibo: "Recibo" };
const DOC_TONE: Record<DocType, string> = {
  pgdas: "bg-accent/15 text-accent",
  das: "bg-primary/15 text-primary",
  recibo: "bg-muted text-muted-foreground",
};

function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<ParsedFile[]>([]);

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas", "all"],
    queryFn: async () => {
      const { data } = await (supabase.from("empresas") as any)
        .select("id, numero_interno, razao_social, nome_fantasia, cnpj")
        .order("razao_social");
      return (data ?? []) as Empresa[];
    },
  });

  const empresasByCnpj = useMemo(() => {
    const m = new Map<string, Empresa>();
    for (const e of empresas) m.set(e.cnpj.replace(/\D/g, ""), e);
    return m;
  }, [empresas]);

  const pgdasParsed = files.find((f) => f.docType === "pgdas" && f.status === "ready");
  const matchedEmpresa = pgdasParsed?.cnpj ? empresasByCnpj.get(pgdasParsed.cnpj) : undefined;
  const extractionErrors = pgdasParsed?.fields?.inconsistencias ?? [];

  const onDrop = useCallback(async (accepted: File[]) => {
    const incoming: ParsedFile[] = accepted.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file: f,
      status: "parsing",
    }));
    setFiles((prev) => [...prev, ...incoming]);

    for (const item of incoming) {
      try {
        const text = await pdfToText(item.file);
        const docType = detectDocType(text);
        const cnpj = extractCnpj(text);
        const fields = docType === "pgdas" ? extractPgdasFields(text) : undefined;
        setFiles((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: "ready", docType, cnpj: fields?.cnpj ?? cnpj, fields } : p,
          ),
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: "error", error: (err as Error).message } : p,
          ),
        );
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  const removeFile = (id: string) => setFiles((prev) => prev.filter((p) => p.id !== id));

  const generate = useMutation({
    mutationFn: async () => {
      if (!pgdasParsed || !pgdasParsed.fields) throw new Error("Envie ao menos uma Declaração PGDAS válida");
      if (!matchedEmpresa) throw new Error("Empresa não encontrada — cadastre o CNPJ primeiro");
      if (!pgdasParsed.fields.validacao_ok) {
        throw new Error(pgdasParsed.fields.inconsistencias[0] ?? "A validação dos valores do PGDAS-D falhou");
      }
      const empresa_id = matchedEmpresa.id;

      // Upload all files
      const uploads: { tipo: DocType; path: string; nome: string }[] = [];
      for (const f of files) {
        if (f.status !== "ready" || !f.docType) continue;
        const path = `${empresa_id}/${f.docType}/${Date.now()}-${f.file.name}`;
        const { error } = await supabase.storage.from("documentos").upload(path, f.file);
        if (error) throw new Error(`Falha ao enviar ${f.file.name}: ${error.message}`);
        uploads.push({ tipo: f.docType, path, nome: f.file.name });
      }

      const ext = pgdasParsed.fields;
      for (const log of ext.logs) {
        console.info(`[PGDAS] ${log.campo}`, {
          original: log.original,
          convertido: log.convertido,
          salvo: log.salvo,
        });
      }

      // Create relatório
      const { data: rel, error: relErr } = await supabase
        .from("relatorios")
        .insert({
          empresa_id,
          competencia: ext.competencia ?? new Date().toISOString().slice(0, 10),
          faturamento_mensal: ext.faturamento_mensal ?? 0,
          faturamento_anual: ext.faturamento_anual ?? 0,
          imposto: ext.imposto ?? 0,
          aliquota: ext.aliquota ?? 0,
          vencimento: ext.vencimento,
          competencia_anterior: ext.competencia_anterior,
          faturamento_mes_anterior: ext.faturamento_mes_anterior,
          status: "concluido",
        })
        .select("id")
        .single();
      if (relErr) throw relErr;

      // Save documentos
      if (uploads.length) {
        await supabase.from("documentos").insert(
          uploads.map((u) => ({
            empresa_id,
            relatorio_id: rel.id,
            tipo: u.tipo,
            arquivo: u.path,
            nome_arquivo: u.nome,
            extraido: u.tipo === "pgdas" ? (ext as any) : null,
          })),
        );
      }

      // Compare with previous
      const prev = await supabase
        .from("relatorios")
        .select("faturamento_mensal, aliquota")
        .eq("empresa_id", empresa_id)
        .lt("competencia", ext.competencia ?? new Date().toISOString().slice(0, 10))
        .order("competencia", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prev.data) {
        const fm = Number(ext.faturamento_mensal ?? 0);
        const pm = Number(prev.data.faturamento_mensal);
        const crescimento = pm > 0 ? ((fm - pm) / pm) * 100 : 0;
        await supabase
          .from("relatorios")
          .update({
            competencia_anterior: ext.competencia_anterior,
            faturamento_mes_anterior: ext.faturamento_mes_anterior ?? prev.data.faturamento_mensal,
            aliquota_anterior: prev.data.aliquota,
            crescimento,
          })
          .eq("id", rel.id);
      }

      // Cria tarefa automática e classifica
      const fatNum = Number(ext.faturamento_mensal ?? 0);
      const impNum = Number(ext.imposto ?? 0);
      const possuiImposto = fatNum > 0 && impNum > 0;
      const classificacao = possuiImposto ? "com_imposto" : (fatNum === 0 && impNum === 0 ? "sem_imposto" : "sem_imposto");
      const titulo = `${matchedEmpresa.nome_fantasia || matchedEmpresa.razao_social} — ${ext.competencia ?? ""}`;
      await (supabase as any).from("tarefas").insert({
        empresa_id,
        relatorio_id: rel.id,
        competencia: ext.competencia ?? new Date().toISOString().slice(0, 10),
        titulo,
        categoria: possuiImposto ? "Imposto a pagar" : "Sem imposto",
        classificacao,
        possui_imposto: possuiImposto,
        faturamento: fatNum,
        valor_imposto: impNum,
        status: "pendente",
      });

      return rel.id as string;
    },
    onSuccess: (id) => {
      toast.success("Relatório gerado!");
      navigate({ to: "/relatorios/$id", params: { id } });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const canGenerate = !!pgdasParsed && !!matchedEmpresa && extractionErrors.length === 0 && !generate.isPending;
  const anyParsing = files.some((f) => f.status === "parsing");

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Processamento automático</p>
        <h1 className="font-display text-4xl text-primary mt-1">Upload de Documentos</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Arraste os PDFs e o sistema identifica automaticamente a empresa, o tipo do documento e extrai todos os
          dados financeiros via parser nativo — sem IA.
        </p>
      </header>

      {/* DROPZONE */}
      <div
        {...getRootProps()}
        className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition ${
          isDragActive
            ? "border-accent bg-accent/10"
            : "border-border hover:border-accent/60 hover:bg-accent/5"
        }`}
        style={isDragActive ? { boxShadow: "var(--shadow-elegant)" } : {}}
      >
        <input {...getInputProps()} />
        <div className="mx-auto inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground mb-4"
             style={{ background: "var(--gradient-primary)" }}>
          <UploadIcon className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl text-primary">
          {isDragActive ? "Solte os PDFs aqui" : "Arraste os PDFs aqui"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
        <div className="mt-6 flex items-center justify-center gap-4 flex-wrap text-xs">
          <DocChip label="Declaração PGDAS" />
          <DocChip label="Recibo" />
          <DocChip label="DAS" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-4">Upload múltiplo permitido</p>
      </div>

      {/* FILES LIST */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-0 divide-y">
            {files.map((f) => (
              <FileRow key={f.id} item={f} empresa={f.cnpj ? empresasByCnpj.get(f.cnpj) : undefined} onRemove={() => removeFile(f.id)} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* SUMMARY + ACTION */}
      {pgdasParsed && pgdasParsed.fields && (
        <Card className="border-accent/40" style={{ boxShadow: "var(--shadow-soft)" }}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-accent font-semibold">Pré-visualização</p>
                <h3 className="font-display text-2xl text-primary mt-1">
                  {matchedEmpresa ? (matchedEmpresa.nome_fantasia || matchedEmpresa.razao_social) : "Empresa não encontrada"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  CNPJ {pgdasParsed.cnpj ? formatCnpj(pgdasParsed.cnpj) : "—"}
                  {matchedEmpresa?.numero_interno != null && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-muted text-xs">#{matchedEmpresa.numero_interno}</span>
                  )}
                </p>
              </div>
              {!matchedEmpresa && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/15 text-warning text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Cadastre essa empresa antes de continuar.
                </div>
              )}
            </div>

            {extractionErrors.length > 0 && (
              <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <div className="font-semibold">Validação do PGDAS-D falhou</div>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {extractionErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Metric label="Competência" value={pgdasParsed.fields.competencia ? ptDate(pgdasParsed.fields.competencia) : "—"} />
              <Metric label="Competência Anterior" value={pgdasParsed.fields.competencia_anterior ? ptDate(pgdasParsed.fields.competencia_anterior) : "—"} />
              <Metric label="Faturamento Mensal" value={brl(pgdasParsed.fields.faturamento_mensal)} />
              <Metric label="Faturamento Anual" value={brl(pgdasParsed.fields.faturamento_anual)} />
              <Metric label="Resumo da Declaração" value={brl(pgdasParsed.fields.receita_resumo_competencia)} />
              <Metric label="Mês Anterior" value={brl(pgdasParsed.fields.faturamento_mes_anterior)} />
              <Metric label="DAS" value={brl(pgdasParsed.fields.imposto)} />
              <Metric label="Alíquota Efetiva" value={pct(pgdasParsed.fields.aliquota)} highlight />
              <Metric label="Vencimento" value={pgdasParsed.fields.vencimento ? ptDate(pgdasParsed.fields.vencimento) : "—"} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-3">
        {anyParsing && (
          <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Lendo PDFs…
          </span>
        )}
        <Button size="lg" disabled={!canGenerate} onClick={() => generate.mutate()}>
          {generate.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando relatório…</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Gerar Relatório</>
          )}
        </Button>
      </div>
    </div>
  );
}

function FileRow({ item, empresa, onRemove }: { item: ParsedFile; empresa?: Empresa; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm truncate">{item.file.name}</p>
          {item.docType && (
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${DOC_TONE[item.docType]}`}>
              {DOC_LABEL[item.docType]}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {item.status === "parsing" && "Lendo PDF…"}
          {item.status === "ready" && (
            empresa
              ? `${empresa.razao_social} · CNPJ ${formatCnpj(item.cnpj!)}`
              : item.cnpj
                ? `CNPJ ${formatCnpj(item.cnpj)} — empresa não cadastrada`
                : "CNPJ não identificado"
          )}
          {item.status === "error" && (item.error ?? "Erro ao ler o PDF")}
        </p>
      </div>
      <div className="shrink-0">
        {item.status === "parsing" && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {item.status === "ready" && (empresa ? <CheckCircle2 className="h-5 w-5 text-success" /> : <FileSearch className="h-5 w-5 text-warning" />)}
        {item.status === "error" && <AlertTriangle className="h-5 w-5 text-destructive" />}
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove}><X className="h-4 w-4" /></Button>
    </div>
  );
}

function DocChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-foreground/80">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {label}
    </span>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "border-accent/40 bg-accent/5" : "bg-muted/30"}`}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className={`font-display text-xl mt-1 ${highlight ? "text-accent" : "text-primary"}`}>{value}</p>
    </div>
  );
}
