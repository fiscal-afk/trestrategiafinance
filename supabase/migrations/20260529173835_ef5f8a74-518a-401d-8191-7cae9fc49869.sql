ALTER TABLE public.relatorios
  ALTER COLUMN faturamento_mensal TYPE NUMERIC(15,2),
  ALTER COLUMN faturamento_anual TYPE NUMERIC(15,2),
  ALTER COLUMN imposto TYPE NUMERIC(15,2),
  ALTER COLUMN faturamento_mes_anterior TYPE NUMERIC(15,2),
  ALTER COLUMN aliquota TYPE NUMERIC(9,4),
  ALTER COLUMN aliquota_anterior TYPE NUMERIC(9,4),
  ALTER COLUMN crescimento TYPE NUMERIC(9,4);

ALTER TABLE public.relatorios
  ADD COLUMN IF NOT EXISTS competencia_anterior DATE;