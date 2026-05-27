export const brl = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));

export const pct = (v: number | null | undefined, digits = 2) =>
  `${Number(v ?? 0).toFixed(digits).replace(".", ",")}%`;

export const ptDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
};

export const monthLabel = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d + (d.length === 10 ? "T00:00:00" : "")) : d;
  const m = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
  return m.charAt(0).toUpperCase() + m.slice(1);
};

export const competenciaRange = (competencia: string) => {
  // competencia in YYYY-MM-DD or YYYY-MM
  const [y, m] = competencia.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return `${ptDate(start)} a ${ptDate(end)}`;
};

export const cnpjFormat = (v: string) => {
  const n = v.replace(/\D/g, "").slice(0, 14);
  return n
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};
