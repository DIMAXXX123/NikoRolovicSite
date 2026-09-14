-- ============================================================
-- Direktor panel, phase A.4: AI analysis jobs (worker pattern like lecture_jobs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind            TEXT NOT NULL CHECK (kind IN ('daily','weekly','adhoc','question')),
  scope           JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {period, class, section, subject}
  question        TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','error')),
  input_snapshot  JSONB,                                -- aggregates only: never names/emails/user ids
  output          JSONB,
  model           TEXT,
  tokens_in       INT,
  tokens_out      INT,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  error           TEXT
);

CREATE INDEX IF NOT EXISTS analysis_jobs_status_idx  ON public.analysis_jobs (status, created_at);
CREATE INDEX IF NOT EXISTS analysis_jobs_kind_idx    ON public.analysis_jobs (kind, created_at DESC);

ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analysis_jobs_select_staff ON public.analysis_jobs;
CREATE POLICY analysis_jobs_select_staff ON public.analysis_jobs
  FOR SELECT TO authenticated
  USING (public.is_school_staff());
-- Inserts go through the API (service role) so the per-day quota is enforced server-side.

REVOKE ALL ON TABLE public.analysis_jobs FROM anon, authenticated;
GRANT SELECT ON TABLE public.analysis_jobs TO authenticated;

-- "Oznaci uradjeno" on a recommendation: one row per (job, recommendation index).
CREATE TABLE IF NOT EXISTS public.analysis_actions (
  job_id   UUID NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  index    INT  NOT NULL,
  done_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  done_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, index)
);

ALTER TABLE public.analysis_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analysis_actions_select_staff ON public.analysis_actions;
CREATE POLICY analysis_actions_select_staff ON public.analysis_actions
  FOR SELECT TO authenticated
  USING (public.is_school_staff());

DROP POLICY IF EXISTS analysis_actions_write_staff ON public.analysis_actions;
CREATE POLICY analysis_actions_write_staff ON public.analysis_actions
  FOR ALL TO authenticated
  USING (public.is_school_staff())
  WITH CHECK (public.is_school_staff() AND done_by = auth.uid());

REVOKE ALL ON TABLE public.analysis_actions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.analysis_actions TO authenticated;

COMMENT ON TABLE public.analysis_jobs IS
  'AI analysis queue polled by tools/lekcija-worker.mjs --analysis. input_snapshot holds aggregates only (privacy contract in src/lib/analysis-snapshot.ts).';
