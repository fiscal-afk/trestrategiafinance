import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — TR Estratégia Empresarial" }] }),
  component: ConfigPage,
});

type Config = {
  id: number;
  frase_mes: string;
  whatsapp_tr: string | null;
  area_cliente_tr: string | null;
  logo_tr: string | null;
};

function ConfigPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Config>({ id: 1, frase_mes: "", whatsapp_tr: "", area_cliente_tr: "", logo_tr: "" });

  const { data } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const { data } = await supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle();
      return data as Config | null;
    },
  });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("configuracoes").upsert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas. Aplicadas em todos os relatórios futuros.");
      qc.invalidateQueries({ queryKey: ["config"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Sistema</p>
        <h1 className="font-display text-4xl text-primary mt-1">Configurações Globais</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Campos aplicados automaticamente em todos os relatórios.
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle className="font-display">Frase do Mês</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea rows={3} value={form.frase_mes} onChange={(e) => setForm({ ...form, frase_mes: e.target.value })}
                    placeholder="Empresas fortes crescem com estratégia..." />
          <p className="text-xs text-muted-foreground">
            Esta frase aparece em todos os relatórios gerados a partir de agora.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Contato TR (rodapé)</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>WhatsApp da TR</Label>
            <Input value={form.whatsapp_tr ?? ""} onChange={(e) => setForm({ ...form, whatsapp_tr: e.target.value })}
                   placeholder="55 11 90000-0000" />
          </div>
          <div className="space-y-2">
            <Label>Link da Área do Cliente (TR)</Label>
            <Input value={form.area_cliente_tr ?? ""} onChange={(e) => setForm({ ...form, area_cliente_tr: e.target.value })}
                   placeholder="https://..." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>URL do logo TR (rodapé)</Label>
            <Input value={form.logo_tr ?? ""} onChange={(e) => setForm({ ...form, logo_tr: e.target.value })}
                   placeholder="https://... (opcional — usa marca textual se vazio)" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}
