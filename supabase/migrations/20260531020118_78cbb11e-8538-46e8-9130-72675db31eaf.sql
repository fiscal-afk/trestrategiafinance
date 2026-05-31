-- Tarefas mensais por empresa/competência
CREATE TABLE public.tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  relatorio_id uuid,
  competencia date NOT NULL,
  titulo text NOT NULL,
  categoria text,
  status text NOT NULL DEFAULT 'pendente', -- pendente | concluida
  classificacao text NOT NULL DEFAULT 'sem_info', -- com_imposto (verde) | sem_imposto (cinza) | sem_info (vermelho)
  possui_imposto boolean,
  faturamento numeric(15,2),
  valor_imposto numeric(15,2),
  recorrente boolean NOT NULL DEFAULT false,
  concluida_automaticamente boolean NOT NULL DEFAULT false,
  concluido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefas TO authenticated;
GRANT ALL ON public.tarefas TO service_role;

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read tarefas" ON public.tarefas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert tarefas" ON public.tarefas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update tarefas" ON public.tarefas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete tarefas" ON public.tarefas FOR DELETE TO authenticated USING (true);

CREATE TRIGGER tg_tarefas_updated
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_tarefas_empresa ON public.tarefas(empresa_id);
CREATE INDEX idx_tarefas_competencia ON public.tarefas(competencia);

-- Checklist obrigatório (DAS, Declaração, Recibo)
CREATE TABLE public.checklist_tarefa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id uuid NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- das | declaracao | recibo
  concluido boolean NOT NULL DEFAULT false,
  arquivo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_tarefa TO authenticated;
GRANT ALL ON public.checklist_tarefa TO service_role;

ALTER TABLE public.checklist_tarefa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read checklist" ON public.checklist_tarefa FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert checklist" ON public.checklist_tarefa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update checklist" ON public.checklist_tarefa FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete checklist" ON public.checklist_tarefa FOR DELETE TO authenticated USING (true);

CREATE TRIGGER tg_checklist_updated
  BEFORE UPDATE ON public.checklist_tarefa
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_checklist_tarefa ON public.checklist_tarefa(tarefa_id);
CREATE UNIQUE INDEX uniq_checklist_tarefa_tipo ON public.checklist_tarefa(tarefa_id, tipo);

-- Função: ao marcar todos itens do checklist como concluídos, concluir a tarefa automaticamente
CREATE OR REPLACE FUNCTION public.tg_checklist_auto_conclude()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total int;
  feitos int;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE concluido)
    INTO total, feitos
    FROM public.checklist_tarefa
    WHERE tarefa_id = NEW.tarefa_id;

  IF total >= 3 AND feitos >= 3 THEN
    UPDATE public.tarefas
      SET status = 'concluida',
          concluida_automaticamente = true,
          concluido_em = COALESCE(concluido_em, now())
      WHERE id = NEW.tarefa_id AND status <> 'concluida';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_checklist_after_update
  AFTER INSERT OR UPDATE ON public.checklist_tarefa
  FOR EACH ROW EXECUTE FUNCTION public.tg_checklist_auto_conclude();
