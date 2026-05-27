
-- EMPRESAS
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  area_cliente TEXT,
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read empresas" ON public.empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert empresas" ON public.empresas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update empresas" ON public.empresas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete empresas" ON public.empresas FOR DELETE TO authenticated USING (true);

-- RELATORIOS
CREATE TABLE public.relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia DATE NOT NULL,
  faturamento_mensal NUMERIC(14,2) NOT NULL DEFAULT 0,
  faturamento_anual NUMERIC(14,2) NOT NULL DEFAULT 0,
  imposto NUMERIC(14,2) NOT NULL DEFAULT 0,
  aliquota NUMERIC(6,2) NOT NULL DEFAULT 0,
  vencimento DATE,
  faturamento_mes_anterior NUMERIC(14,2),
  aliquota_anterior NUMERIC(6,2),
  crescimento NUMERIC(6,2),
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_relatorios_empresa ON public.relatorios(empresa_id, competencia DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios TO authenticated;
GRANT ALL ON public.relatorios TO service_role;
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read relatorios" ON public.relatorios FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert relatorios" ON public.relatorios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update relatorios" ON public.relatorios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete relatorios" ON public.relatorios FOR DELETE TO authenticated USING (true);

-- DOCUMENTOS
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  relatorio_id UUID REFERENCES public.relatorios(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  arquivo TEXT NOT NULL,
  nome_arquivo TEXT,
  extraido JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documentos_empresa ON public.documentos(empresa_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos TO authenticated;
GRANT ALL ON public.documentos TO service_role;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read documentos" ON public.documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert documentos" ON public.documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update documentos" ON public.documentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete documentos" ON public.documentos FOR DELETE TO authenticated USING (true);

-- CONFIGURACOES (singleton row)
CREATE TABLE public.configuracoes (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  frase_mes TEXT NOT NULL DEFAULT 'Empresas fortes crescem com estratégia e gestão inteligente.',
  whatsapp_tr TEXT,
  area_cliente_tr TEXT,
  logo_tr TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read config" ON public.configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth upsert config" ON public.configuracoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update config" ON public.configuracoes FOR UPDATE TO authenticated USING (true);

INSERT INTO public.configuracoes (id, frase_mes) VALUES (1, 'Empresas fortes crescem com estratégia e gestão inteligente.') ON CONFLICT DO NOTHING;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_empresas_upd BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_relatorios_upd BEFORE UPDATE ON public.relatorios FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_config_upd BEFORE UPDATE ON public.configuracoes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false) ON CONFLICT DO NOTHING;
CREATE POLICY "auth read docs bucket" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos');
CREATE POLICY "auth upload docs bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos');
CREATE POLICY "auth update docs bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documentos');
CREATE POLICY "auth delete docs bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos');
