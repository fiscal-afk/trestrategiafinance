
-- ============================================
-- ROLES & ACCESS CONTROL
-- ============================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Security definer helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid) TO authenticated, service_role;

-- Seed: grant admin to all existing auth users so the app keeps working
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

-- Auto-assign 'staff' role to every new signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'staff')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;

-- ============================================
-- FIX EXISTING TRIGGER FUNCTIONS (search_path + revoke EXECUTE)
-- ============================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_checklist_auto_conclude() FROM PUBLIC, anon, authenticated;

-- ============================================
-- REPLACE PERMISSIVE RLS POLICIES
-- ============================================

-- EMPRESAS
DROP POLICY IF EXISTS "auth read empresas" ON public.empresas;
DROP POLICY IF EXISTS "auth insert empresas" ON public.empresas;
DROP POLICY IF EXISTS "auth update empresas" ON public.empresas;
DROP POLICY IF EXISTS "auth delete empresas" ON public.empresas;
CREATE POLICY "staff read empresas" ON public.empresas FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "staff insert empresas" ON public.empresas FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "staff update empresas" ON public.empresas FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "admin delete empresas" ON public.empresas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RELATORIOS
DROP POLICY IF EXISTS "auth read relatorios" ON public.relatorios;
DROP POLICY IF EXISTS "auth insert relatorios" ON public.relatorios;
DROP POLICY IF EXISTS "auth update relatorios" ON public.relatorios;
DROP POLICY IF EXISTS "auth delete relatorios" ON public.relatorios;
CREATE POLICY "staff read relatorios" ON public.relatorios FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "staff insert relatorios" ON public.relatorios FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "staff update relatorios" ON public.relatorios FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "admin delete relatorios" ON public.relatorios FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TAREFAS
DROP POLICY IF EXISTS "auth read tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "auth insert tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "auth update tarefas" ON public.tarefas;
DROP POLICY IF EXISTS "auth delete tarefas" ON public.tarefas;
CREATE POLICY "staff read tarefas" ON public.tarefas FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "staff insert tarefas" ON public.tarefas FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "staff update tarefas" ON public.tarefas FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "admin delete tarefas" ON public.tarefas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DOCUMENTOS
DROP POLICY IF EXISTS "auth read documentos" ON public.documentos;
DROP POLICY IF EXISTS "auth insert documentos" ON public.documentos;
DROP POLICY IF EXISTS "auth update documentos" ON public.documentos;
DROP POLICY IF EXISTS "auth delete documentos" ON public.documentos;
CREATE POLICY "staff read documentos" ON public.documentos FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "staff insert documentos" ON public.documentos FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "staff update documentos" ON public.documentos FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "admin delete documentos" ON public.documentos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CHECKLIST_TAREFA
DROP POLICY IF EXISTS "auth read checklist" ON public.checklist_tarefa;
DROP POLICY IF EXISTS "auth insert checklist" ON public.checklist_tarefa;
DROP POLICY IF EXISTS "auth update checklist" ON public.checklist_tarefa;
DROP POLICY IF EXISTS "auth delete checklist" ON public.checklist_tarefa;
DROP POLICY IF EXISTS "auth read checklist_tarefa" ON public.checklist_tarefa;
DROP POLICY IF EXISTS "auth insert checklist_tarefa" ON public.checklist_tarefa;
DROP POLICY IF EXISTS "auth update checklist_tarefa" ON public.checklist_tarefa;
DROP POLICY IF EXISTS "auth delete checklist_tarefa" ON public.checklist_tarefa;
CREATE POLICY "staff read checklist" ON public.checklist_tarefa FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "staff insert checklist" ON public.checklist_tarefa FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "staff update checklist" ON public.checklist_tarefa FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid())) WITH CHECK (public.has_any_role(auth.uid()));
CREATE POLICY "staff delete checklist" ON public.checklist_tarefa FOR DELETE TO authenticated USING (public.has_any_role(auth.uid()));

-- CONFIGURACOES — admin-only writes; staff can read
DROP POLICY IF EXISTS "auth read configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "auth insert configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "auth update configuracoes" ON public.configuracoes;
CREATE POLICY "staff read configuracoes" ON public.configuracoes FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
CREATE POLICY "admin insert configuracoes" ON public.configuracoes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update configuracoes" ON public.configuracoes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete configuracoes" ON public.configuracoes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- STORAGE: documentos bucket — require role
-- ============================================
DROP POLICY IF EXISTS "auth read docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "auth upload docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "auth update docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "auth delete docs bucket" ON storage.objects;
CREATE POLICY "staff read docs bucket" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos' AND public.has_any_role(auth.uid()));
CREATE POLICY "staff upload docs bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos' AND public.has_any_role(auth.uid()));
CREATE POLICY "staff update docs bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documentos' AND public.has_any_role(auth.uid())) WITH CHECK (bucket_id = 'documentos' AND public.has_any_role(auth.uid()));
CREATE POLICY "admin delete docs bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos' AND public.has_role(auth.uid(), 'admin'));
