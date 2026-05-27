import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  bucketPath: z.string().min(1),
});

export type PgdasExtraction = {
  competencia: string | null; // YYYY-MM-DD (first day of month)
  faturamento_mensal: number | null;
  faturamento_anual: number | null;
  imposto: number | null;
  aliquota: number | null;
  vencimento: string | null; // YYYY-MM-DD
  raw_text?: string;
};

export const extractPgdas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<PgdasExtraction> => {
    const { supabase } = context;

    // Download file from storage
    const { data: file, error } = await supabase.storage.from("documentos").download(data.bucketPath);
    if (error || !file) throw new Error("Não foi possível baixar o documento: " + (error?.message ?? ""));

    const arrayBuf = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    const mimeType = file.type || "application/pdf";

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurado");

    const prompt = `Você é um extrator de dados de declarações PGDAS-D (Simples Nacional) brasileiras.
Analise o documento e retorne APENAS um JSON válido com os seguintes campos (use null quando não encontrar):
{
  "competencia": "YYYY-MM-01" (primeiro dia do mês de competência),
  "faturamento_mensal": número (receita bruta do mês, em reais, apenas dígitos com ponto decimal),
  "faturamento_anual": número (receita bruta acumulada nos últimos 12 meses ou RBT12, em reais),
  "imposto": número (valor total do DAS a recolher, em reais),
  "aliquota": número (alíquota efetiva em percentual, ex: 8.53),
  "vencimento": "YYYY-MM-DD" (data de vencimento do DAS, geralmente dia 20 do mês seguinte)
}
Não inclua texto antes ou depois do JSON. Não use markdown. Apenas o objeto JSON puro.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Limite de requisições da IA atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error(`Falha na extração (${res.status}): ${txt}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    let parsed: PgdasExtraction;
    try {
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : cleaned);
    } catch {
      throw new Error("A IA não retornou um JSON válido. Tente novamente.");
    }

    return parsed;
  });
