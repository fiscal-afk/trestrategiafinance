import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cnpjFormat } from "@/lib/format";

export const Route = createFileRoute("/_app/empresas")({
  head: () => ({ meta: [{ title: "Empresas — TR Estratégia Empresarial" }] }),
  component: EmpresasPage,
});

type Empresa = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  whatsapp: string | null;
  email: string | null;
  area_cliente: string | null;
  status: string;
};

const empty: Omit<Empresa, "id"> = {
  razao_social: "", nome_fantasia: "", cnpj: "", whatsapp: "", email: "", area_cliente: "", status: "ativa",
};

function EmpresasPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [form, setForm] = useState<Omit<Empresa, "id">>(empty);

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("*").order("razao_social");
      if (error) throw error;
      return data as Empresa[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("empresas").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("empresas").insert(form);
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
      razao_social: e.razao_social, nome_fantasia: e.nome_fantasia ?? "", cnpj: e.cnpj,
      whatsapp: e.whatsapp ?? "", email: e.email ?? "", area_cliente: e.area_cliente ?? "", status: e.status,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Cadastro</p>
          <h1 className="font-display text-4xl text-primary mt-1">Empresas</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova empresa</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle className="font-display text-2xl">{editing ? "Editar empresa" : "Nova empresa"}</DialogTitle></DialogHeader>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Razão social *</Label>
                <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Nome fantasia</Label>
                <Input value={form.nome_fantasia ?? ""} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ *</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: cnpjFormat(e.target.value) })} required />
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
      </header>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Razão social</th>
                  <th className="px-4 py-3 font-medium">CNPJ</th>
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando…</td></tr>}
                {!isLoading && empresas.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhuma empresa cadastrada.</td></tr>
                )}
                {empresas.map((e) => (
                  <tr key={e.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <p className="font-medium">{e.razao_social}</p>
                      {e.nome_fantasia && <p className="text-xs text-muted-foreground">{e.nome_fantasia}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{e.cnpj}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {e.whatsapp && <p>{e.whatsapp}</p>}
                      {e.email && <p>{e.email}</p>}
                    </td>
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
        </CardContent>
      </Card>
    </div>
  );
}
