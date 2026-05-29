import { Document, Page, View, Text, StyleSheet, Svg, Path, Rect, Line, Circle, G, Defs, LinearGradient, Stop, Link, Font } from "@react-pdf/renderer";
import { brl, pct, ptDate, competenciaRange, monthLabel } from "@/lib/format";

// Inter — wide unicode support, clean modern look
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
  navyMid: "#243a66",
  accent: "#3b6fa0",
  accentSoft: "#7aa6cf",
  bg: "#f6f8fb",
  white: "#ffffff",
  border: "#e3e8ef",
  borderSoft: "#eef2f7",
  text: "#0f172a",
  muted: "#64748b",
  mutedSoft: "#94a3b8",
  success: "#15803d",
  successBg: "#dcfce7",
  danger: "#b91c1c",
  dangerBg: "#fee2e2",
  warning: "#b45309",
  warningBg: "#fef3c7",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    color: C.text,
    backgroundColor: C.white,
    paddingBottom: 0,
  },
  // Header
  header: {
    backgroundColor: C.navy,
    color: C.white,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 32,
  },
  headerBrand: {
    fontSize: 8,
    letterSpacing: 3,
    color: "#9ab3d6",
    textTransform: "uppercase",
    fontWeight: 500,
  },
  headerTitle: {
    fontFamily: "DMSerif",
    color: C.white,
    fontSize: 26,
    marginTop: 12,
    lineHeight: 1.15,
  },
  headerDivider: {
    width: 44,
    height: 2,
    backgroundColor: C.accentSoft,
    marginTop: 14,
    marginBottom: 14,
  },
  headerCompLabel: {
    fontSize: 8,
    letterSpacing: 2,
    color: "#9ab3d6",
    textTransform: "uppercase",
  },
  headerComp: {
    color: C.white,
    fontSize: 12,
    marginTop: 4,
    fontWeight: 500,
  },
  // Cards
  cardsWrap: {
    paddingHorizontal: 40,
    marginTop: -24,
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 96,
  },
  cardAccent: {
    backgroundColor: C.navy,
    borderColor: C.navy,
  },
  cardIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 7.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: C.muted,
    fontWeight: 600,
  },
  cardLabelAccent: { color: "#9ab3d6" },
  cardValue: {
    fontFamily: "DMSerif",
    fontSize: 18,
    color: C.navy,
    marginTop: 6,
  },
  cardValueAccent: { color: C.white },
  // Section
  section: {
    paddingHorizontal: 40,
    marginTop: 28,
  },
  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    color: C.accent,
    textTransform: "uppercase",
    fontWeight: 600,
  },
  sectionTitle: {
    fontFamily: "DMSerif",
    fontSize: 16,
    color: C.navy,
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 9.5,
    color: C.muted,
    marginTop: 4,
    lineHeight: 1.5,
  },
  // Quote
  quoteBox: {
    marginTop: 22,
    marginHorizontal: 40,
    backgroundColor: C.navy,
    borderRadius: 14,
    paddingVertical: 36,
    paddingHorizontal: 36,
    alignItems: "center",
  },
  quoteMark: {
    fontFamily: "DMSerif",
    fontSize: 40,
    color: C.accentSoft,
    lineHeight: 1,
    marginBottom: 4,
  },
  quoteText: {
    fontFamily: "DMSerif",
    fontSize: 17,
    color: C.white,
    textAlign: "center",
    lineHeight: 1.35,
  },
  // Footer (page 1 small)
  pageNum: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: C.mutedSoft,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  // Dashboard cards
  panel: {
    marginHorizontal: 40,
    marginTop: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 18,
    backgroundColor: C.white,
  },
  panelRow: { flexDirection: "row", gap: 20 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 4,
  },
  badgeText: { fontSize: 10, fontWeight: 600 },
  // Footer
  footer: {
    marginTop: 18,
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 40,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
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
  empresas: { razao_social: string; nome_fantasia: string | null; whatsapp: string | null; area_cliente: string | null };
};

// ── ICONS (svg primitives) ─────────────────────────────────────
const Icon = ({ d, color = C.accent }: { d: string; color?: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ICONS = {
  cash: "M3 7h18v10H3zM7 12h.01M17 12h.01M12 9v6",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4",
  calendar: "M3 7h18M3 7v12a2 2 0 002 2h14a2 2 0 002-2V7M8 3v4M16 3v4",
  percent: "M5 19L19 5M7 7h.01M17 17h.01",
  down: "M12 5v14M5 12l7 7 7-7",
};

// ── DONUT ─────────────────────────────────────────────────────
function Donut({ pctValue }: { pctValue: number }) {
  const size = 170;
  const cx = size / 2, cy = size / 2;
  const r = 68, rIn = 48;
  // arc for the small slice
  const p = Math.max(0.5, Math.min(99.5, pctValue));
  const angle = (p / 100) * 2 * Math.PI;
  const a0 = -Math.PI / 2;
  const a1 = a0 + angle;
  const large = angle > Math.PI ? 1 : 0;
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const xi0 = cx + rIn * Math.cos(a0), yi0 = cy + rIn * Math.sin(a0);
  const xi1 = cx + rIn * Math.cos(a1), yi1 = cy + rIn * Math.sin(a1);
  const slice = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${rIn} ${rIn} 0 ${large} 0 ${xi0} ${yi0} Z`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.accent} />
          <Stop offset="1" stopColor={C.navy} />
        </LinearGradient>
      </Defs>
      {/* ring background */}
      <Path d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`} fill={C.borderSoft} />
      <Path d={`M ${cx} ${cy - rIn} A ${rIn} ${rIn} 0 1 0 ${cx - 0.01} ${cy - rIn} Z`} fill={C.white} />
      <Path d={slice} fill="url(#dg)" />
      <Circle cx={cx} cy={cy} r={rIn - 1} fill={C.white} />
    </Svg>
  );
}

// ── BAR CHART ─────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; highlight?: boolean }[] }) {
  const W = 320, H = 170, padL = 44, padR = 12, padT = 10, padB = 28;
  const max = Math.max(...data.map((d) => d.value)) * 1.15 || 1;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const bw = Math.min(60, (innerW / data.length) * 0.55);
  const gridY = [0, 0.25, 0.5, 0.75, 1];
  return (
    <Svg width={W} height={H}>
      {/* grid */}
      {gridY.map((g, i) => {
        const y = padT + innerH * (1 - g);
        return (
          <G key={i}>
            <Line x1={padL} y1={y} x2={W - padR} y2={y} stroke={C.borderSoft} strokeWidth={0.7} />
            <Text x={padL - 6} y={y + 3} style={{ fontSize: 7, fill: C.muted, textAnchor: "end" } as any}>
              {abbrev(max * g)}
            </Text>
          </G>
        );
      })}
      {data.map((d, i) => {
        const slot = innerW / data.length;
        const x = padL + slot * i + (slot - bw) / 2;
        const h = (d.value / max) * innerH;
        const y = padT + innerH - h;
        const fill = d.highlight ? C.navy : C.accentSoft;
        return (
          <G key={i}>
            <Path d={roundedTopRect(x, y, bw, h, 5)} fill={fill} />
            <Text x={x + bw / 2} y={y - 5} style={{ fontSize: 8, fill: C.text, fontWeight: 600, textAnchor: "middle" } as any}>
              {brl(d.value).replace("R$\u00a0", "R$ ")}
            </Text>
            <Text x={x + bw / 2} y={H - 10} style={{ fontSize: 9, fill: C.muted, textAnchor: "middle" } as any}>
              {d.label}
            </Text>
          </G>
        );
      })}
      <Line x1={padL} y1={padT + innerH} x2={W - padR} y2={padT + innerH} stroke={C.border} strokeWidth={1} />
    </Svg>
  );
}

// ── LINE CHART ────────────────────────────────────────────────
function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 320, H = 170, padL = 40, padR = 16, padT = 14, padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = Math.max(...data.map((d) => d.value)) * 1.2 || 1;
  const min = Math.min(...data.map((d) => d.value)) * 0.8;
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = padL + (innerW / Math.max(1, data.length - 1)) * i;
    const y = padT + innerH - ((d.value - min) / range) * innerH;
    return { x, y, ...d };
  });
  const path = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, "");
  const area = `${path} L ${pts[pts.length - 1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`;
  return (
    <Svg width={W} height={H}>
      <Defs>
        <LinearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.accent} stopOpacity={0.35} />
          <Stop offset="1" stopColor={C.accent} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {[0, 0.5, 1].map((g, i) => {
        const y = padT + innerH * (1 - g);
        return <Line key={i} x1={padL} y1={y} x2={W - padR} y2={y} stroke={C.borderSoft} strokeWidth={0.7} />;
      })}
      <Path d={area} fill="url(#lg)" />
      <Path d={path} stroke={C.accent} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={5.5} fill={C.white} stroke={C.accent} strokeWidth={2.4} />
          <Text x={p.x} y={p.y - 12} style={{ fontSize: 9, fill: C.navy, fontWeight: 700, textAnchor: "middle" } as any}>
            {pct(p.value)}
          </Text>
          <Text x={p.x} y={H - 10} style={{ fontSize: 9, fill: C.muted, textAnchor: "middle" } as any}>
            {p.label}
          </Text>
        </G>
      ))}
    </Svg>
  );
}

function roundedTopRect(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h, w / 2);
  return `M ${x} ${y + rr} Q ${x} ${y} ${x + rr} ${y} L ${x + w - rr} ${y} Q ${x + w} ${y} ${x + w} ${y + rr} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
}
function abbrev(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toFixed(0);
}

// ── COMPONENT ─────────────────────────────────────────────────
export function RelatorioPdf({ rel, cfg }: { rel: Rel; cfg: Cfg }) {
  const pctAnual = rel.faturamento_anual > 0 ? (Number(rel.faturamento_mensal) / Number(rel.faturamento_anual)) * 100 : 0;
  const cresc = rel.crescimento ?? 0;
  const aliqDelta = rel.aliquota_anterior != null ? Number(rel.aliquota) - Number(rel.aliquota_anterior) : 0;
  const empresaNome = rel.empresas.nome_fantasia || rel.empresas.razao_social;
  const mesAtual = monthLabel(rel.competencia);
  const mesAnterior = rel.competencia_anterior ? monthLabel(rel.competencia_anterior) : monthLabel(prevMonth(rel.competencia));

  const barData = rel.faturamento_mes_anterior != null
    ? [
        { label: mesAnterior, value: Number(rel.faturamento_mes_anterior) },
        { label: mesAtual, value: Number(rel.faturamento_mensal), highlight: true },
      ]
    : [{ label: mesAtual, value: Number(rel.faturamento_mensal), highlight: true }];

  const lineData = rel.aliquota_anterior != null
    ? [
        { label: mesAnterior, value: Number(rel.aliquota_anterior) },
        { label: mesAtual, value: Number(rel.aliquota) },
      ]
    : [{ label: mesAtual, value: Number(rel.aliquota) }];

  return (
    <Document>
      {/* ───── PÁGINA 1 ───── */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.headerBrand}>TR Estratégia Empresarial</Text>
          <Text style={s.headerTitle}>{empresaNome}</Text>
          <View style={s.headerDivider} />
          <Text style={s.headerCompLabel}>Competência</Text>
          <Text style={s.headerComp}>{competenciaRange(rel.competencia)}</Text>
        </View>

        <View style={s.cardsWrap}>
          <CardItem icon={ICONS.cash} label="Faturamento Mensal" value={brl(rel.faturamento_mensal)} />
          <CardItem icon={ICONS.receipt} label="DAS Simples Nacional" value={brl(rel.imposto)} />
          <CardItem icon={ICONS.calendar} label="Vencimento DAS" value={ptDate(rel.vencimento)} />
          <CardItem icon={ICONS.percent} label="Alíquota Efetiva" value={pct(rel.aliquota)} accent />
        </View>

        <View style={s.section}>
          <Text style={s.sectionEyebrow}>Resumo Executivo</Text>
          <Text style={s.sectionTitle}>Visão geral do mês</Text>
          <Text style={s.sectionSubtitle}>
            Consolidação dos indicadores financeiros e tributários da competência de {mesAtual}, baseada nas informações
            extraídas do PGDAS-D pela equipe TR Estratégia Empresarial.
          </Text>
        </View>

        {/* Mini insights row */}
        <View style={{ ...s.panel, marginTop: 16, padding: 0, overflow: "hidden" }}>
          <View style={{ flexDirection: "row" }}>
            <InsightCol label="Faturamento Anual (RBT12)" value={brl(rel.faturamento_anual)} />
            <InsightCol label="Representatividade do Mês" value={pct(pctAnual)} />
            <InsightCol label={`Comparativo vs ${mesAnterior}`} value={`${cresc >= 0 ? "+" : ""}${pct(cresc)}`} tone={cresc >= 0 ? "up" : "down"} last />
          </View>
        </View>

        <View style={s.quoteBox}>
          <Text style={s.quoteMark}>“</Text>
          <Text style={s.quoteText}>{cfg.frase_mes}</Text>
        </View>

        <Text style={s.pageNum} fixed>TR Estratégia Empresarial   ·   Página 1 de 2</Text>
      </Page>

      {/* ───── PÁGINA 2 ───── */}
      <Page size="A4" style={s.page}>
        <View style={{ ...s.header, paddingTop: 28, paddingBottom: 24 }}>
          <Text style={s.headerBrand}>Dashboards Financeiros</Text>
          <Text style={{ ...s.headerTitle, fontSize: 20 }}>{empresaNome}</Text>
          <Text style={{ ...s.headerComp, marginTop: 6, fontSize: 10, color: "#9ab3d6" }}>
            {competenciaRange(rel.competencia)}
          </Text>
        </View>

        {/* Dashboard 1 — Donut */}
        <View style={s.section}>
          <Text style={s.sectionEyebrow}>Dashboard 01</Text>
          <Text style={s.sectionTitle}>Representatividade do faturamento mensal</Text>
          <Text style={s.sectionSubtitle}>
            Percentual que o faturamento do mês representa dentro do faturamento anual.
          </Text>
        </View>
        <View style={s.panel}>
          <View style={s.panelRow}>
            <View style={{ width: 180, alignItems: "center", justifyContent: "center" }}>
              <Donut pctValue={pctAnual} />
            </View>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={{ fontSize: 9, color: C.muted, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: 600 }}>
                Representatividade
              </Text>
              <Text style={{ fontFamily: "DMSerif", fontSize: 44, color: C.navy, marginTop: 4, lineHeight: 1 }}>
                {pct(pctAnual)}
              </Text>
              <View style={{ height: 1, backgroundColor: C.border, marginVertical: 12 }} />
              <Text style={{ fontSize: 10, color: C.text, lineHeight: 1.55 }}>
                O faturamento de <Text style={{ fontWeight: 700 }}>{mesAtual}</Text> representa{" "}
                <Text style={{ fontWeight: 700, color: C.accent }}>{pct(pctAnual)}</Text> do faturamento anual de{" "}
                <Text style={{ fontWeight: 700 }}>{brl(rel.faturamento_anual)}</Text>.
              </Text>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 12 }}>
                <Legend color={C.accent} label={`Faturamento ${mesAtual}`} />
                <Legend color={C.borderSoft} label="Restante do ano" textColor={C.muted} />
              </View>
            </View>
          </View>
        </View>

        {/* Dashboard 2 — Bar */}
        <View style={s.section}>
          <Text style={s.sectionEyebrow}>Dashboard 02</Text>
          <Text style={s.sectionTitle}>Comparação de faturamento mensal</Text>
          <Text style={s.sectionSubtitle}>
            Comparação entre o faturamento do mês anterior e o mês atual.
          </Text>
        </View>
        <View style={s.panel}>
          <View style={s.panelRow}>
            <View style={{ width: 320 }}>
              <BarChart data={barData} />
            </View>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <View style={{
                ...s.badge,
                backgroundColor: cresc >= 0 ? C.successBg : C.dangerBg,
              }}>
                <Svg width={10} height={10} viewBox="0 0 24 24">
                  <Path
                    d={cresc >= 0 ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"}
                    stroke={cresc >= 0 ? C.success : C.danger}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={{ ...s.badgeText, color: cresc >= 0 ? C.success : C.danger }}>
                  {cresc >= 0 ? "+" : ""}{pct(cresc)}
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: C.text, marginTop: 12, lineHeight: 1.55 }}>
                Em relação ao mês anterior, houve{" "}
                <Text style={{ fontWeight: 700 }}>{cresc >= 0 ? "crescimento" : "redução"}</Text> de{" "}
                <Text style={{ fontWeight: 700, color: cresc >= 0 ? C.success : C.danger }}>
                  {pct(Math.abs(cresc))}
                </Text>{" "}
                no faturamento.
              </Text>
            </View>
          </View>
        </View>

        {/* Dashboard 3 — Line */}
        <View style={s.section}>
          <Text style={s.sectionEyebrow}>Dashboard 03</Text>
          <Text style={s.sectionTitle}>Evolução da alíquota efetiva</Text>
          <Text style={s.sectionSubtitle}>
            Comparação da alíquota efetiva entre os meses.
          </Text>
        </View>
        <View style={{ ...s.panel, marginBottom: 12 }}>
          <View style={s.panelRow}>
            <View style={{ width: 320 }}>
              <LineChart data={lineData} />
            </View>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <View style={{ flexDirection: "row", gap: 18 }}>
                <View>
                  <Text style={{ fontSize: 7.5, letterSpacing: 1.4, color: C.muted, textTransform: "uppercase", fontWeight: 600 }}>Anterior</Text>
                  <Text style={{ fontFamily: "DMSerif", fontSize: 22, color: C.muted, marginTop: 2 }}>
                    {rel.aliquota_anterior != null ? pct(rel.aliquota_anterior) : "—"}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 7.5, letterSpacing: 1.4, color: C.accent, textTransform: "uppercase", fontWeight: 600 }}>Atual</Text>
                  <Text style={{ fontFamily: "DMSerif", fontSize: 22, color: C.navy, marginTop: 2 }}>{pct(rel.aliquota)}</Text>
                </View>
              </View>
              {rel.aliquota_anterior != null && (
                <View style={{
                  ...s.badge,
                  marginTop: 10,
                  backgroundColor: aliqDelta >= 0 ? C.warningBg : C.successBg,
                }}>
                  <Text style={{ ...s.badgeText, color: aliqDelta >= 0 ? C.warning : C.success }}>
                    {aliqDelta >= 0 ? "+" : ""}{aliqDelta.toFixed(2).replace(".", ",")} pp
                  </Text>
                </View>
              )}
              <Text style={{ fontSize: 10, color: C.text, marginTop: 10, lineHeight: 1.55 }}>
                {aliqDelta >= 0 ? "Aumento" : "Redução"} de{" "}
                <Text style={{ fontWeight: 700 }}>{Math.abs(aliqDelta).toFixed(2).replace(".", ",")} ponto percentual</Text>{" "}
                na alíquota efetiva.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View>
            <Text style={{ fontFamily: "DMSerif", fontSize: 13, color: C.navy }}>TR Estratégia Empresarial</Text>
            <Text style={{ fontSize: 8, color: C.muted, marginTop: 2, letterSpacing: 1 }}>
              Relatório financeiro · {competenciaRange(rel.competencia)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 16 }}>
            {cfg.whatsapp_tr ? (
              <Link src={`https://wa.me/${cfg.whatsapp_tr.replace(/\D/g, "")}`} style={{ textDecoration: "none" }}>
                <Text style={{ fontSize: 9, color: C.accent, fontWeight: 600 }}>WhatsApp</Text>
              </Link>
            ) : null}
            {cfg.area_cliente_tr ? (
              <Link src={cfg.area_cliente_tr} style={{ textDecoration: "none" }}>
                <Text style={{ fontSize: 9, color: C.accent, fontWeight: 600 }}>Área do Cliente</Text>
              </Link>
            ) : null}
          </View>
        </View>

        <Text style={s.pageNum} fixed>TR Estratégia Empresarial   ·   Página 2 de 2</Text>
      </Page>
    </Document>
  );
}

function CardItem({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <View style={[s.card, accent ? s.cardAccent : {}]}>
      <View style={[s.cardIcon, accent ? { backgroundColor: "#1e3a5f" } : {}]}>
        <Icon d={icon} color={accent ? C.accentSoft : C.accent} />
      </View>
      <Text style={[s.cardLabel, accent ? s.cardLabelAccent : {}]}>{label}</Text>
      <Text style={[s.cardValue, accent ? s.cardValueAccent : {}]}>{value}</Text>
    </View>
  );
}

function InsightCol({ label, value, tone, last }: { label: string; value: string; tone?: "up" | "down"; last?: boolean }) {
  const color = tone === "up" ? C.success : tone === "down" ? C.danger : C.navy;
  return (
    <View style={{
      flex: 1,
      padding: 18,
      borderRightWidth: last ? 0 : 1,
      borderRightColor: C.border,
    }}>
      <Text style={{ fontSize: 7.5, letterSpacing: 1.4, textTransform: "uppercase", color: C.muted, fontWeight: 600 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: "DMSerif", fontSize: 18, color, marginTop: 6 }}>{value}</Text>
    </View>
  );
}

function Legend({ color, label, textColor }: { color: string; label: string; textColor?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ fontSize: 8.5, color: textColor || C.text }}>{label}</Text>
    </View>
  );
}

function prevMonth(competencia: string) {
  const [y, m] = competencia.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
