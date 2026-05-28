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
  faturamento_mensal: number | null;
  faturamento_anual: number | null;
  imposto: number | null;
  aliquota: number | null;
  vencimento: string | null; // YYYY-MM-DD
  faturamento_mes_anterior: number | null;
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

export function brlToNumber(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", "."));
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
  // CNPJ — prefer "CNPJ Matriz:"
  const cnpjMatriz = text.match(/CNPJ\s+Matriz[:\s]*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i);
  const cnpj = (cnpjMatriz ? cnpjMatriz[1] : extractCnpj(text))?.replace(/\D/g, "") || null;

  // Competência via "Período de Apuração: DD/MM/YYYY a DD/MM/YYYY"
  const compM = text.match(/Per[ií]odo de Apura[çc][ãa]o[:\s]*(\d{2})\/(\d{2})\/(\d{4})/i);
  let competencia: string | null = null;
  let vencimento: string | null = null;
  if (compM) {
    const [, , mm, yyyy] = compM;
    competencia = `${yyyy}-${mm}-01`;
    const mi = Number(mm), yi = Number(yyyy);
    const nm = mi === 12 ? 1 : mi + 1;
    const ny = mi === 12 ? yi + 1 : yi;
    vencimento = `${ny}-${String(nm).padStart(2, "0")}-20`;
  }

  // Faturamento mensal (RPA - Competência) — first money after that label
  const rpa = text.match(new RegExp(`Receita Bruta do PA[^\\n]{0,80}${NUM}`, "i"));
  const faturamento_mensal = rpa ? brlToNumber(rpa[1]) : null;

  // RBT12
  const rbt = text.match(new RegExp(`(?:RBT12\\)|RBT12\\s*\\))[^\\n]{0,80}?${NUM}`, "i"));
  const faturamento_anual = rbt ? brlToNumber(rbt[1]) : null;

  // Imposto: "Valor Total do Débito Declarado" pattern after receita auferida
  // Usually the row "Receita Bruta Auferida ... X,XX  Y,YY" where Y is the débito.
  let imposto: number | null = null;
  const resumo = text.match(new RegExp(`Receita Bruta Auferida[^\\n]{0,120}?${NUM}\\s+${NUM}`, "i"));
  if (resumo) imposto = brlToNumber(resumo[2]);
  if (imposto == null) {
    const debito = text.match(new RegExp(`Valor Total do D[ée]bito Declarado[^\\n]{0,120}?${NUM}`, "i"));
    if (debito) imposto = brlToNumber(debito[1]);
  }

  const aliquota =
    imposto != null && faturamento_mensal != null && faturamento_mensal > 0
      ? Number(((imposto / faturamento_mensal) * 100).toFixed(2))
      : null;

  // Faturamento do mês anterior
  let faturamento_mes_anterior: number | null = null;
  if (competencia) {
    const [yy, mm] = competencia.split("-").map(Number);
    const pm = mm === 1 ? 12 : mm - 1;
    const py = mm === 1 ? yy - 1 : yy;
    const tag = `${String(pm).padStart(2, "0")}\\/${py}`;
    const re = new RegExp(`${tag}\\s+${NUM}`);
    const m = text.match(re);
    if (m) faturamento_mes_anterior = brlToNumber(m[1]);
  }

  return {
    cnpj,
    competencia,
    faturamento_mensal,
    faturamento_anual,
    imposto,
    aliquota,
    vencimento,
    faturamento_mes_anterior,
  };
}
