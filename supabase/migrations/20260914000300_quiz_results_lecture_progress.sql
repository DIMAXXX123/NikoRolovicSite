-- ============================================================
-- Direktor panel, phase A.3: server copies of quiz results and reading progress
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL only for seeded pupils (meta.sid)
  lecture_id     UUID REFERENCES public.lectures(id) ON DELETE SET NULL,
  subject        TEXT,
  class_number   INT,
  section_number INT,
  score          NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  correct        INT NOT NULL DEFAULT 0,
  total          INT NOT NULL DEFAULT 0,
  duration_s     INT,
  answers        JSONB,
  meta           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_results_created_idx  ON public.quiz_results (created_at);
CREATE INDEX IF NOT EXISTS quiz_results_user_idx     ON public.quiz_results (user_id, created_at);
CREATE INDEX IF NOT EXISTS quiz_results_lecture_idx  ON public.quiz_results (lecture_id);
CREATE INDEX IF NOT EXISTS quiz_results_subject_idx  ON public.quiz_results (subject, class_number, created_at);
CREATE INDEX IF NOT EXISTS quiz_results_sid_idx      ON public.quiz_results ((meta->>'sid'), created_at) WHERE meta ? 'sid';

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quiz_results_insert_own ON public.quiz_results;
CREATE POLICY quiz_results_insert_own ON public.quiz_results
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS quiz_results_select ON public.quiz_results;
CREATE POLICY quiz_results_select ON public.quiz_results
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_school_staff());

REVOKE ALL ON TABLE public.quiz_results FROM anon, authenticated;
GRANT INSERT, SELECT ON TABLE public.quiz_results TO authenticated;
GRANT USAGE ON SEQUENCE public.quiz_results_id_seq TO authenticated;

-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lecture_progress_srv (
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lecture_id  UUID NOT NULL REFERENCES public.lectures(id) ON DELETE CASCADE,
  read_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (user_id, lecture_id)
);

CREATE INDEX IF NOT EXISTS lecture_progress_srv_lecture_idx ON public.lecture_progress_srv (lecture_id, read_at);
CREATE INDEX IF NOT EXISTS lecture_progress_srv_read_at_idx ON public.lecture_progress_srv (read_at);

ALTER TABLE public.lecture_progress_srv ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lecture_progress_srv_write_own ON public.lecture_progress_srv;
CREATE POLICY lecture_progress_srv_write_own ON public.lecture_progress_srv
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS lecture_progress_srv_select_staff ON public.lecture_progress_srv;
CREATE POLICY lecture_progress_srv_select_staff ON public.lecture_progress_srv
  FOR SELECT TO authenticated
  USING (public.is_school_staff());

REVOKE ALL ON TABLE public.lecture_progress_srv FROM anon, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE public.lecture_progress_srv TO authenticated;

COMMENT ON TABLE public.quiz_results IS
  'Server copy of finished quizzes (signed-in pupils; seeded rows carry meta.seed/meta.sid and user_id NULL). localStorage stays the source for the pupil UI.';
COMMENT ON TABLE public.lecture_progress_srv IS
  'Server copy of "lecture finished" (upserted on markDone, deleted on unmark). Real users only - seeded reads live in app_events.';
