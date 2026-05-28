import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Upload as UploadIcon, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { cnpjFormat } from "@/lib/format";
import { formatCnpj } from "@/lib/pgdas-parser";

export const Route = createFileRoute("/_app/empresas")({
  head: () => ({ meta: [{ title: "Empresas — TR Estratégia Empresarial" }] }),
  component: EmpresasPage,
});

type Empresa = {
  id: string;
  numero_interno: number | null;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  whatsapp: string | null;
  email: string | null;
  area_cliente: string | null;
  status: string;
};

const empty: Omit<Empresa, "id"> = {
  numero_interno: null,
  razao_social: "", nome_fantasia: "", cnpj: "", whatsapp: "", email: "", area_cliente: "", status: "ativa",
};

type SortKey = "numero_interno" | "razao_social" | "cnpj" | "status";
const PAGE_SIZE = 12;

function EmpresasPage() {
  const qc = useQueryClient();
  const importRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [form, setForm] = useState<Omit<Empresa, "id">>(empty);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "numero_interno", dir: "asc" });
  const [page, setPage] = useState(1);

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("empresas") as any).select("*").order("razao_social");
      if (error) throw error;
      return data as Empresa[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = empresas;
    if (q) {
      list = list.filter((e) => {
        const num = e.numero_interno != null ? String(e.numero_interno) : "";
        return (
          num.includes(q) ||
          e.razao_social.toLowerCase().includes(q) ||
          (e.nome_fantasia ?? "").toLowerCase().includes(q) ||
          e.cnpj.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
        );
      });
    }
    list = [...list].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const av = (a as any)[sort.key];
      const bv = (b as any)[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "pt-BR") * dir;
    });
    return list;
  }, [empresas, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form, cnpj: form.cnpj.replace(/\D/g, "") };
      if (editing) {
        const { error } = await (supabase.from("empresas") as any).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("empresas") as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Empresa atualizada" : "Empresa cadastrada");
      qc.invalidateQueries({ queryKey: ["empresas"] });
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("empresas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresa removida");
      qc.invalidateQueries({ queryKey: ["empresas"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (e: Empresa) => {
    setEditing(e);
    setForm({
      numero_interno: e.numero_interno,
      razao_social: e.razao_social, nome_fantasia: e.nome_fantasia ?? "", cnpj: formatCnpj(e.cnpj),
      whatsapp: e.whatsapp ?? "", email: e.email ?? "", area_cliente: e.area_cliente ?? "", status: e.status,
    });
    setOpen(true);
  };

  const importXlsx = useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
      const records: { numero_interno: number | null; razao_social: string; cnpj: string }[] = [];
      for (const r of rows) {
        const keys = Object.keys(r);
        const numKey = keys.find((k) => /n[º°o]/i.test(k) || /numero/i.test(k));
        const empKey = keys.find((k) => /empresa|raz[ãa]o/i.test(k));
        const cnpjKey = keys.find((k) => /cnpj/i.test(k));
        if (!empKey || !cnpjKey) continue;
        const empresa = String(r[empKey] ?? "").trim();
        const cnpjRaw = r[cnpjKey];
        if (!empresa || cnpjRaw == null) continue;
        const cnpj = String(typeof cnpjRaw === "number" ? Math.round(cnpjRaw) : cnpjRaw).replace(/\D/g, "").padStart(14, "0").slice(-14);
        if (cnpj.length !== 14) continue;
        const num = numKey ? Number(r[numKey]) : NaN;
        records.push({ numero_interno: Number.isFinite(num) ? num : null, razao_social: empresa, cnpj });
      }
      if (!records.length) throw new Error("Nenhuma linha válida encontrada na planilha");
      const { data, error } = await (supabase.from("empresas") as any)
        .upsert(records, { onConflict: "cnpj", ignoreDuplicates: true })
        .select("id");
      if (error) throw error;
      return { processed: records.length, inserted: data?.length ?? 0 };
    },
    onSuccess: ({ processed, inserted }) => {
      toast.success(`${inserted} novas empresas importadas (${processed - inserted} já existiam).`);
      qc.invalidateQueries({ queryKey: ["empresas"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Cadastro</p>
          <h1 className="font-display text-4xl text-primary mt-1">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresas.length} empresas cadastradas</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={importRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importXlsx.mutate(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => importRef.current?.click()} disabled={importXlsx.isPending}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {importXlsx.isPending ? "Importando…" : "Importar planilha"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova empresa</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Editar empresa" : "Nova empresa"}</DialogTitle></DialogHeader>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número interno</Label>
                  <Input type="number" value={form.numero_interno ?? ""}
                    onChange={(e) => setForm({ ...form, numero_interno: e.target.value === "" ? null : Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ *</Label>
                  <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: cnpjFormat(e.target.value) })} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Razão social *</Label>
                  <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Nome fantasia</Label>
                  <Input value={form.nome_fantasia ?? ""} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={form.whatsapp ?? ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 90000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Link da área do cliente</Label>
                  <Input value={form.area_cliente ?? ""} onChange={(e) => setForm({ ...form, area_cliente: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending || !form.razao_social || !form.cnpj}>
                  {save.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Card>
        <div className="p-4 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por número, nome ou CNPJ…"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground ml-auto">{filtered.length} resultado(s)</p>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <Th label="Nº" k="numero_interno" sort={sort} onClick={toggleSort} className="w-20" />
                  <Th label="Razão social" k="razao_social" sort={sort} onClick={toggleSort} />
                  <Th label="CNPJ" k="cnpj" sort={sort} onClick={toggleSort} />
                  <Th label="Status" k="status" sort={sort} onClick={toggleSort} className="w-28" />
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>}
                {!isLoading && pageData.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma empresa encontrada.</td></tr>
                )}
                {pageData.map((e) => (
                  <tr key={e.id} className="border-t border-border/60 hover:bg-muted/20 transition">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {e.numero_interno != null ? `#${e.numero_interno}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{e.razao_social}</p>
                      {e.nome_fantasia && <p className="text-xs text-muted-foreground">{e.nome_fantasia}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{formatCnpj(e.cnpj)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        e.status === "ativa" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}>{e.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"
                              onClick={() => confirm(`Excluir ${e.razao_social}?`) && del.mutate(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t text-sm">
              <p className="text-muted-foreground">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Th({ label, k, sort, onClick, className = "" }: {
  label: string; k: SortKey; sort: { key: SortKey; dir: "asc" | "desc" }; onClick: (k: SortKey) => void; className?: string;
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={`px-4 py-3 font-medium ${className}`}>
      <button className="inline-flex items-center gap-1 hover:text-primary transition" onClick={() => onClick(k)}>
        {label} <Icon className="h-3 w-3 opacity-60" />
      </button>
    </th>
  );
}
