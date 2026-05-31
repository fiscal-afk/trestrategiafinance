import { Document, Page, View, Text, StyleSheet, Font, Link } from "@react-pdf/renderer";
import { brl, pct, ptDate, competenciaRange, monthLabel } from "@/lib/format";

/**
 * Componente EXCLUSIVO de PDF — clean, corporativo, premium.
 * Sem Recharts, sem ResponsiveContainer, sem HTML/Tailwind.
 * Apenas primitivas do @react-pdf/renderer: Document/Page/View/Text.
 */

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1Zl7SUc.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7SUc.ttf", fontWeight: 700 },
  ],
});
Font.register({
  family: "DMSerif",
  src: "https://fonts.gstatic.com/s/dmserifdisplay/v15/-nFnOHM81r4j6k0gjAW3mujVU2B2K_d709jy92k.ttf",
});

const C = {
  navy: "#0f1b3d",
  navySoft: "#1e3a5f",
  accent: "#3b6fa0",
  accentSoft: "#7aa6cf",
  bg: "#f6f8fb",
  white: "#ffffff",
  border: "#e3e8ef",
  borderSoft: "#eef2f7",
  text: "#0f172a",
  muted: "#64748b",
  mutedSoft: "#94a3b8",
};

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 10, color: C.text, backgroundColor: C.white },

  // CAPA
  cover: { flex: 1, backgroundColor: C.navy, color: C.white, padding: 56, justifyContent: "space-between" },
  coverBrand: { fontSize: 9, letterSpacing: 4, color: C.accentSoft, textTransform: "uppercase", fontWeight: 600 },
  coverDivider: { width: 60, height: 2, backgroundColor: C.accentSoft, marginTop: 18, marginBottom: 28 },
  coverEyebrow: { fontSize: 10, letterSpacing: 2.5, color: C.accentSoft, textTransform: "uppercase", fontWeight: 600 },
  coverTitle: { fontFamily: "DMSerif", fontSize: 38, color: C.white, marginTop: 12, lineHeight: 1.1 },
  coverSub: { fontSize: 12, color: "#cdd9ec", marginTop: 18, lineHeight: 1.5 },
  coverFootLabel: { fontSize: 8, letterSpacing: 2, color: C.accentSoft, textTransform: "uppercase" },
  coverFootValue: { fontSize: 11, color: C.white, marginTop: 4, fontWeight: 500 },

  // PÁGINA CONTEÚDO
  body: { padding: 40, paddingBottom: 60 },
  pageHeader: { borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 12, marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  pageHeaderBrand: { fontSize: 8, letterSpacing: 2, color: C.muted, textTransform: "uppercase", fontWeight: 600 },
  pageHeaderEmp: { fontFamily: "DMSerif", fontSize: 14, color: C.navy, marginTop: 2 },
  pageHeaderRight: { fontSize: 9, color: C.muted, textAlign: "right" },

  section: { marginBottom: 22 },
  sectionEyebrow: { fontSize: 8, letterSpacing: 2, color: C.accent, textTransform: "uppercase", fontWeight: 700 },
  sectionTitle: { fontFamily: "DMSerif", fontSize: 18, color: C.navy, marginTop: 4, marginBottom: 10 },
  paragraph: { fontSize: 10, color: C.text, lineHeight: 1.6 },

  // Cards financeiros
  cardsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  card: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, backgroundColor: C.white },
  cardAccent: { backgroundColor: C.navy, borderColor: C.navy },
  cardLabel: { fontSize: 7.5, letterSpacing: 1.4, textTransform: "uppercase", color: C.muted, fontWeight: 600 },
  cardLabelAccent: { color: "#9ab3d6" },
  cardValue: { fontFamily: "DMSerif", fontSize: 17, color: C.navy, marginTop: 8 },
  cardValueAccent: { color: C.white },

  // Tabela
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 8, overflow: "hidden" },
  thead: { flexDirection: "row", backgroundColor: C.navy },
  th: { paddingVertical: 10, paddingHorizontal: 12, fontSize: 9, color: C.white, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" },
  tr: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.borderSoft, backgroundColor: C.white },
  trAlt: { backgroundColor: C.bg },
  td: { paddingVertical: 9, paddingHorizontal: 12, fontSize: 10, color: C.text },

  // Resumo analítico (linhas chave/valor)
  kvRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  kvKey: { fontSize: 10, color: C.muted },
  kvVal: { fontSize: 10, color: C.navy, fontWeight: 600 },

  // Quote
  quote: { marginTop: 8, padding: 22, backgroundColor: C.navy, borderRadius: 10 },
  quoteText: { fontFamily: "DMSerif", fontSize: 15, color: C.white, textAlign: "center", lineHeight: 1.4 },

  // Conclusão
  conclusion: { padding: 18, backgroundColor: C.bg, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: C.accent },

  // Footer
  pageFooter: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  footerText: { fontSize: 8, color: C.mutedSoft, letterSpacing: 1, textTransform: "uppercase" },
});

type Cfg = { frase_mes: string; whatsapp_tr: string | null; area_cliente_tr: string | null; logo_tr: string | null };
type Rel = {
  competencia: string;
  competencia_anterior: string | null;
  faturamento_mensal: number;
  faturamento_anual: number;
  imposto: number;
  aliquota: number;
  vencimento: string | null;
  faturamento_mes_anterior: number | null;
  aliquota_anterior: number | null;
  crescimento: number | null;
  empresas: { razao_social: string; nome_fantasia: string | null; whatsapp: string | null; area_cliente: string | null; cnpj?: string };
};

function PageFooter({ empresa, competencia }: { empresa: string; competencia: string }) {
  return (
    <View style={s.pageFooter} fixed>
      <Text style={s.footerText}>TR Estratégia Empresarial · {empresa}</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${competenciaRange(competencia)}  ·  ${pageNumber}/${totalPages}`} />
    </View>
  );
}

export function ReportPDF({ rel, cfg }: { rel: Rel; cfg: Cfg }) {
  const empresa = rel.empresas.nome_fantasia || rel.empresas.razao_social;
  const pctAnual = rel.faturamento_anual > 0 ? (Number(rel.faturamento_mensal) / Number(rel.faturamento_anual)) * 100 : 0;
  const cresc = Number(rel.crescimento ?? 0);
  const mesAtual = monthLabel(rel.competencia);
  const mesAnterior = rel.competencia_anterior ? monthLabel(rel.competencia_anterior) : "Mês anterior";

  return (
    <Document title={`Relatório TR — ${empresa} — ${rel.competencia}`} author="TR Estratégia Empresarial">
      {/* ── CAPA ───────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.cover}>
          <View>
            <Text style={s.coverBrand}>TR Estratégia Empresarial</Text>
            <View style={s.coverDivider} />
            <Text style={s.coverEyebrow}>Relatório Financeiro</Text>
            <Text style={s.coverTitle}>{empresa}</Text>
            <Text style={s.coverSub}>
              Análise da competência fiscal com base nas informações extraídas do PGDAS-D, consolidando indicadores de faturamento e carga tributária.
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 40 }}>
            <View>
              <Text style={s.coverFootLabel}>Competência</Text>
              <Text style={s.coverFootValue}>{competenciaRange(rel.competencia)}</Text>
            </View>
            {rel.empresas.cnpj ? (
              <View>
                <Text style={s.coverFootLabel}>CNPJ</Text>
                <Text style={s.coverFootValue}>{rel.empresas.cnpj}</Text>
              </View>
            ) : null}
            <View>
              <Text style={s.coverFootLabel}>Emissão</Text>
              <Text style={s.coverFootValue}>{ptDate(new Date())}</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ── PÁGINA 2 — RESUMO + CARDS + TABELA ─────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.body}>
          <View style={s.pageHeader}>
            <View>
              <Text style={s.pageHeaderBrand}>Relatório Financeiro · {mesAtual}</Text>
              <Text style={s.pageHeaderEmp}>{empresa}</Text>
            </View>
            <Text style={s.pageHeaderRight}>{competenciaRange(rel.competencia)}</Text>
          </View>

          {/* Resumo Executivo */}
          <View style={s.section}>
            <Text style={s.sectionEyebrow}>01 · Resumo Executivo</Text>
            <Text style={s.sectionTitle}>Visão geral do mês</Text>
            <Text style={s.paragraph}>
              Em {mesAtual}, {empresa} registrou faturamento de{" "}
              <Text style={{ fontWeight: 700, color: C.navy }}>{brl(rel.faturamento_mensal)}</Text>, com DAS apurado de{" "}
              <Text style={{ fontWeight: 700, color: C.navy }}>{brl(rel.imposto)}</Text> e alíquota efetiva de{" "}
              <Text style={{ fontWeight: 700, color: C.navy }}>{pct(rel.aliquota)}</Text>. O faturamento mensal representa{" "}
              <Text style={{ fontWeight: 700, color: C.navy }}>{pct(pctAnual)}</Text> do faturamento anual acumulado (RBT12) de{" "}
              <Text style={{ fontWeight: 700, color: C.navy }}>{brl(rel.faturamento_anual)}</Text>.
            </Text>
          </View>

          {/* Cards financeiros */}
          <View style={s.section}>
            <Text style={s.sectionEyebrow}>02 · Indicadores Financeiros</Text>
            <Text style={s.sectionTitle}>Métricas do período</Text>
            <View style={s.cardsRow}>
              <View style={s.card}>
                <Text style={s.cardLabel}>Faturamento Mensal</Text>
                <Text style={s.cardValue}>{brl(rel.faturamento_mensal)}</Text>
              </View>
              <View style={s.card}>
                <Text style={s.cardLabel}>DAS Simples Nacional</Text>
                <Text style={s.cardValue}>{brl(rel.imposto)}</Text>
              </View>
            </View>
            <View style={{ ...s.cardsRow, marginTop: 10 }}>
              <View style={s.card}>
                <Text style={s.cardLabel}>Vencimento DAS</Text>
                <Text style={s.cardValue}>{ptDate(rel.vencimento)}</Text>
              </View>
              <View style={{ ...s.card, ...s.cardAccent }}>
                <Text style={{ ...s.cardLabel, ...s.cardLabelAccent }}>Alíquota Efetiva</Text>
                <Text style={{ ...s.cardValue, ...s.cardValueAccent }}>{pct(rel.aliquota)}</Text>
              </View>
            </View>
          </View>

          {/* Tabela Tributária */}
          <View style={s.section}>
            <Text style={s.sectionEyebrow}>03 · Demonstrativo Tributário</Text>
            <Text style={s.sectionTitle}>Detalhamento</Text>
            <View style={s.table}>
              <View style={s.thead}>
                <Text style={{ ...s.th, flex: 2 }}>Descrição</Text>
                <Text style={{ ...s.th, flex: 1, textAlign: "right" }}>Valor</Text>
              </View>
              <Row label="Faturamento do mês" value={brl(rel.faturamento_mensal)} />
              <Row label="Faturamento anual (RBT12)" value={brl(rel.faturamento_anual)} alt />
              <Row label="Representatividade mensal" value={pct(pctAnual)} />
              <Row label="DAS Simples Nacional" value={brl(rel.imposto)} alt />
              <Row label="Alíquota efetiva" value={pct(rel.aliquota)} />
              <Row label="Vencimento" value={ptDate(rel.vencimento)} alt />
            </View>
          </View>
        </View>
        <PageFooter empresa={empresa} competencia={rel.competencia} />
      </Page>

      {/* ── PÁGINA 3 — ANÁLISE + CONCLUSÃO ─────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.body}>
          <View style={s.pageHeader}>
            <View>
              <Text style={s.pageHeaderBrand}>Análise Financeira · {mesAtual}</Text>
              <Text style={s.pageHeaderEmp}>{empresa}</Text>
            </View>
            <Text style={s.pageHeaderRight}>{competenciaRange(rel.competencia)}</Text>
          </View>

          {/* Análise Financeira (resumo textual + tabela comparativa) */}
          <View style={s.section}>
            <Text style={s.sectionEyebrow}>04 · Análise Financeira</Text>
            <Text style={s.sectionTitle}>Comparativo mensal</Text>

            {rel.faturamento_mes_anterior != null ? (
              <>
                <View style={{ ...s.table, marginBottom: 12 }}>
                  <View style={s.thead}>
                    <Text style={{ ...s.th, flex: 2 }}>Competência</Text>
                    <Text style={{ ...s.th, flex: 1, textAlign: "right" }}>Faturamento</Text>
                  </View>
                  <Row label={mesAnterior} value={brl(rel.faturamento_mes_anterior)} />
                  <Row label={mesAtual} value={brl(rel.faturamento_mensal)} alt highlight />
                </View>
                <Text style={s.paragraph}>
                  Comparado a {mesAnterior} ({brl(rel.faturamento_mes_anterior)}), o faturamento de {mesAtual} apresentou{" "}
                  <Text style={{ fontWeight: 700, color: cresc >= 0 ? "#15803d" : "#b91c1c" }}>
                    {cresc >= 0 ? "crescimento" : "redução"} de {pct(Math.abs(cresc))}
                  </Text>.
                </Text>
              </>
            ) : (
              <Text style={s.paragraph}>Sem competência anterior disponível para comparação.</Text>
            )}
          </View>

          {/* Observações */}
          <View style={s.section}>
            <Text style={s.sectionEyebrow}>05 · Observações</Text>
            <Text style={s.sectionTitle}>Pontos relevantes</Text>
            <View style={s.kvRow}>
              <Text style={s.kvKey}>Regime tributário</Text>
              <Text style={s.kvVal}>Simples Nacional</Text>
            </View>
            <View style={s.kvRow}>
              <Text style={s.kvKey}>Fonte dos dados</Text>
              <Text style={s.kvVal}>PGDAS-D · Receita Federal</Text>
            </View>
            <View style={s.kvRow}>
              <Text style={s.kvKey}>Data de emissão</Text>
              <Text style={s.kvVal}>{ptDate(new Date())}</Text>
            </View>
            <View style={s.kvRow}>
              <Text style={s.kvKey}>Próximo vencimento DAS</Text>
              <Text style={s.kvVal}>{ptDate(rel.vencimento)}</Text>
            </View>
          </View>

          {/* Conclusão */}
          <View style={s.section}>
            <Text style={s.sectionEyebrow}>06 · Conclusão</Text>
            <Text style={s.sectionTitle}>Recomendações</Text>
            <View style={s.conclusion}>
              <Text style={s.paragraph}>
                O período analisado consolida {brl(rel.faturamento_mensal)} de receita e {brl(rel.imposto)} de obrigação tributária.
                A carga efetiva de {pct(rel.aliquota)} mantém-se dentro do enquadramento do Simples Nacional. Recomendamos atenção ao
                vencimento do DAS em {ptDate(rel.vencimento)} para evitar acréscimos legais.
              </Text>
            </View>
          </View>

          {/* Frase do mês */}
          <View style={s.quote}>
            <Text style={s.quoteText}>"{cfg.frase_mes}"</Text>
          </View>

          {/* Contato */}
          <View style={{ marginTop: 18, flexDirection: "row", justifyContent: "space-between" }}>
            {cfg.whatsapp_tr ? (
              <View>
                <Text style={s.coverFootLabel}>WhatsApp</Text>
                <Link src={`https://wa.me/${cfg.whatsapp_tr.replace(/\D/g, "")}`} style={{ ...s.kvVal, color: C.accent, marginTop: 4 }}>
                  {cfg.whatsapp_tr}
                </Link>
              </View>
            ) : null}
            {cfg.area_cliente_tr ? (
              <View>
                <Text style={s.coverFootLabel}>Área do Cliente</Text>
                <Link src={cfg.area_cliente_tr} style={{ ...s.kvVal, color: C.accent, marginTop: 4 }}>
                  Acessar portal
                </Link>
              </View>
            ) : null}
          </View>
        </View>
        <PageFooter empresa={empresa} competencia={rel.competencia} />
      </Page>
    </Document>
  );
}

function Row({ label, value, alt, highlight }: { label: string; value: string; alt?: boolean; highlight?: boolean }) {
  return (
    <View style={{ ...s.tr, ...(alt ? s.trAlt : {}) }}>
      <Text style={{ ...s.td, flex: 2, fontWeight: highlight ? 700 : 400, color: highlight ? C.navy : C.text }}>{label}</Text>
      <Text style={{ ...s.td, flex: 1, textAlign: "right", fontWeight: highlight ? 700 : 500, color: highlight ? C.navy : C.text }}>{value}</Text>
    </View>
  );
}
