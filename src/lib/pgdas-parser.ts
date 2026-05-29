// Client-side PDF parsing + regex-based extraction for PGDAS / DAS / Recibo
// No AI involved. Uses pdfjs-dist in the browser.

import * as pdfjsLib from "pdfjs-dist";
// Vite resolves the worker as a URL and the bundle ships it next to the app.
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export type DocType = "pgdas" | "das" | "recibo";

export type PgdasFields = {
  cnpj: string | null;
  competencia: string | null; // YYYY-MM-01
  competencia_anterior: string | null; // YYYY-MM-01
  faturamento_mensal: number | null;
  faturamento_anual: number | null;
  imposto: number | null;
  aliquota: number | null;
  vencimento: string | null; // YYYY-MM-DD
  faturamento_mes_anterior: number | null;
  receita_resumo_competencia: number | null;
  validacao_ok: boolean;
  inconsistencias: string[];
  logs: Array<{ campo: string; original: string | null; convertido: number | null; salvo: number | null }>;
};

export async function pdfToText(file: File | Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as { str: string }[])
      .map((it) => it.str)
      .join(" ")
      .replace(/\s+/g, " ");
    pages.push(text);
  }
  return pages.join("\n");
}

export function detectDocType(text: string): DocType {
  if (/Discriminativo de Receitas|Apura[çc][ãa]o do Simples Nacional|Programa Gerador do Documento de Arrecada[çc][ãa]o.*Declarat[óo]rio/i.test(text)) {
    return "pgdas";
  }
  if (/Documento de Arrecada[çc][ãa]o do Simples Nacional|Composi[çc][ãa]o do DAS|C[óo]digo de Barras|DAS\s*-\s*Documento de Arrecada/i.test(text)) {
    return "das";
  }
  return "recibo";
}

const NUM = String.raw`(\d{1,3}(?:\.\d{3})*,\d{2})`;
const MAX_SAFE_FINANCIAL = 999_999_999_999.99;

export function brlToNumber(s: string): number | null {
  const raw = s.trim();
  if (!/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(raw) && !/^\d+,\d{2}$/.test(raw)) return null;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstNumberAfterLabel(text: string, label: string, maxDistance = 220) {
  const regex = new RegExp(`${escapeRegex(label)}[\\s\\S]{0,${maxDistance}}?${NUM}`, "i");
  const match = text.match(regex);
  return match ? match[1] : null;
}

function firstMatch(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return match ? match[1] ?? null : null;
}

function parseCompetencia(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function addLog(
  logs: PgdasFields["logs"],
  campo: string,
  original: string | null,
  convertido: number | null,
  salvo: number | null,
) {
  logs.push({ campo, original, convertido, salvo });
}

function validateMoney(value: number | null, label: string, inconsistencias: string[]) {
  if (value == null) return;
  if (!Number.isFinite(value)) inconsistencias.push(`${label} inválido após conversão decimal.`);
  if (Math.abs(value) > MAX_SAFE_FINANCIAL) inconsistencias.push(`${label} excede o limite financeiro suportado.`);
}

export function extractCnpj(text: string): string | null {
  const m = text.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
  return m ? m[1].replace(/\D/g, "") : null;
}

export function formatCnpj(c: string): string {
  const d = c.replace(/\D/g, "");
  if (d.length !== 14) return c;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function extractPgdasFields(text: string): PgdasFields {
  const normalizedText = normalizeText(text);
  const inconsistencias: string[] = [];
  const logs: PgdasFields["logs"] = [];

  const cnpjMatriz = normalizedText.match(/CNPJ\s+Matriz[:\s]*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i);
  const cnpj = (cnpjMatriz ? cnpjMatriz[1] : extractCnpj(normalizedText))?.replace(/\D/g, "") || null;

  const compM = normalizedText.match(/Per[ií]odo de Apura[çc][ãa]o[:\s]*(\d{2})\/(\d{2})\/(\d{4})/i);
  let competencia: string | null = null;
  let competencia_anterior: string | null = null;
  let vencimento: string | null = null;
  if (compM) {
    const [, , mm, yyyy] = compM;
    competencia = `${yyyy}-${mm}-01`;
    const mi = Number(mm);
    const yi = Number(yyyy);
    const nm = mi === 12 ? 1 : mi + 1;
    const ny = mi === 12 ? yi + 1 : yi;
    vencimento = `${ny}-${String(nm).padStart(2, "0")}-20`;

    const pm = mi === 1 ? 12 : mi - 1;
    const py = mi === 1 ? yi - 1 : yi;
    competencia_anterior = parseCompetencia(py, pm);
  }

  const rpaRaw = firstNumberAfterLabel(normalizedText, "Receita Bruta do PA (RPA) - Competência");
  const faturamento_mensal = rpaRaw ? brlToNumber(rpaRaw) : null;
  addLog(logs, "faturamento_mensal", rpaRaw, faturamento_mensal, faturamento_mensal);

  const rbaRaw = firstMatch(
    normalizedText,
    /Receita bruta acumulada no ano-calend[aá]rio corrente\s+(\d{1,3}(?:\.\d{3})*,\d{2})/i,
  );
  const faturamento_anual = rbaRaw ? brlToNumber(rbaRaw) : null;
  addLog(logs, "faturamento_anual", rbaRaw, faturamento_anual, faturamento_anual);

  const receitaResumoRaw = firstNumberAfterLabel(normalizedText, "Receita Bruta Auferida (regime competência)");
  const receita_resumo_competencia = receitaResumoRaw ? brlToNumber(receitaResumoRaw) : null;
  addLog(logs, "receita_resumo_competencia", receitaResumoRaw, receita_resumo_competencia, receita_resumo_competencia);

  const impostoRaw = firstMatch(
    normalizedText,
    /2\.6\) Resumo da Declara[çc][ãa]o[\s\S]{0,180}?Receita Bruta Auferida \(regime compet[eê]ncia\)[\s\S]{0,120}?Valor Total do D[ée]bito Declarado \(R\$\)\s+(?:\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})/i,
  ) ?? firstNumberAfterLabel(normalizedText, "Valor Total do Débito Declarado (R$)");
  const imposto = impostoRaw ? brlToNumber(impostoRaw) : null;
  addLog(logs, "imposto", impostoRaw, imposto, imposto);

  const aliquota =
    imposto != null && faturamento_mensal != null && faturamento_mensal > 0
      ? Number(((imposto / faturamento_mensal) * 100).toFixed(2))
      : null;
  addLog(logs, "aliquota", null, aliquota, aliquota);

  let faturamento_mes_anterior: number | null = null;
  let faturamentoMesAnteriorRaw: string | null = null;
  if (competencia_anterior) {
    const [yy, mm] = competencia_anterior.split("-").map(Number);
    const section = normalizedText.match(/2\.2\.1\) Mercado Interno([\s\S]*?)2\.2\.2\) Mercado Externo/i)?.[1] ?? normalizedText;
    const match = section.match(new RegExp(`${String(mm).padStart(2, "0")}\\/${yy}\\s+${NUM}`, "i"));
    faturamentoMesAnteriorRaw = match ? match[1] : null;
    faturamento_mes_anterior = faturamentoMesAnteriorRaw ? brlToNumber(faturamentoMesAnteriorRaw) : null;
  }
  addLog(logs, "faturamento_mes_anterior", faturamentoMesAnteriorRaw, faturamento_mes_anterior, faturamento_mes_anterior);

  if (faturamento_mensal == null) inconsistencias.push("Faturamento mensal não encontrado no PGDAS-D.");
  if (faturamento_anual == null) inconsistencias.push("Faturamento anual não encontrado no PGDAS-D.");
  if (imposto == null) inconsistencias.push("Imposto DAS não encontrado no PGDAS-D.");
  if (competencia_anterior && faturamento_mes_anterior == null) {
    inconsistencias.push("Faturamento do mês anterior não encontrado na seção 2.2.1.");
  }
  if (
    faturamento_mensal != null &&
    receita_resumo_competencia != null &&
    Math.abs(faturamento_mensal - receita_resumo_competencia) > 0.009
  ) {
    inconsistencias.push("O faturamento mensal difere da Receita Bruta Auferida do resumo da declaração.");
  }

  validateMoney(faturamento_mensal, "Faturamento mensal", inconsistencias);
  validateMoney(faturamento_anual, "Faturamento anual", inconsistencias);
  validateMoney(imposto, "Imposto DAS", inconsistencias);
  validateMoney(faturamento_mes_anterior, "Faturamento do mês anterior", inconsistencias);

  return {
    cnpj,
    competencia,
    competencia_anterior,
    faturamento_mensal,
    faturamento_anual,
    imposto,
    aliquota,
    vencimento,
    faturamento_mes_anterior,
    receita_resumo_competencia,
    validacao_ok: inconsistencias.length === 0,
    inconsistencias,
    logs,
  };
}
