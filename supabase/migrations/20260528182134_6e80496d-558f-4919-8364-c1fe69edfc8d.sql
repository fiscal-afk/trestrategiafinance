ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS numero_interno integer;

CREATE UNIQUE INDEX IF NOT EXISTS empresas_cnpj_unique ON public.empresas (cnpj);
CREATE INDEX IF NOT EXISTS empresas_numero_interno_idx ON public.empresas (numero_interno);