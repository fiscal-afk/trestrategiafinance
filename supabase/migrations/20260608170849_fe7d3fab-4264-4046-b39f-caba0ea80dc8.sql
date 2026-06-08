
-- Remove duplicate tarefas keeping the most informative (com_imposto > sem_imposto > sem_info), then most recent
WITH ranked AS (
  SELECT id, empresa_id, competencia,
    ROW_NUMBER() OVER (
      PARTITION BY empresa_id, competencia
      ORDER BY
        CASE classificacao WHEN 'com_imposto' THEN 1 WHEN 'sem_imposto' THEN 2 ELSE 3 END,
        (relatorio_id IS NULL),
        created_at DESC
    ) AS rn
  FROM public.tarefas
)
DELETE FROM public.checklist_tarefa WHERE tarefa_id IN (SELECT id FROM ranked WHERE rn > 1);

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY empresa_id, competencia
      ORDER BY
        CASE classificacao WHEN 'com_imposto' THEN 1 WHEN 'sem_imposto' THEN 2 ELSE 3 END,
        (relatorio_id IS NULL),
        created_at DESC
    ) AS rn
  FROM public.tarefas
)
DELETE FROM public.tarefas WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Unique constraint to prevent future duplicates
ALTER TABLE public.tarefas
  ADD CONSTRAINT tarefas_empresa_competencia_uniq UNIQUE (empresa_id, competencia);
