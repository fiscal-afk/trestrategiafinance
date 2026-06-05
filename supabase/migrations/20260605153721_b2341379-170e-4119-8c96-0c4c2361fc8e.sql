
ALTER TABLE public.tarefas
  ADD COLUMN IF NOT EXISTS vencimento date,
  ADD COLUMN IF NOT EXISTS enviado_ao_cliente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enviado_em timestamptz,
  ADD COLUMN IF NOT EXISTS ultimo_lembrete_em timestamptz;
