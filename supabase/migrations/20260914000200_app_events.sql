-- ============================================================
-- Direktor panel, phase A.2: app_events (client telemetry)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_events (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL = guest / seeded pupil
  role           TEXT,
  class_number   INT,
  section_number INT,
  event          TEXT NOT NULL,
  entity_id      UUID,          -- lecture / news / event / photo
  subject        TEXT,          -- lectures only
  value          NUMERIC,       -- score %, seconds, ...
  meta           JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_id     TEXT,
  platform       TEXT,          -- 'pwa' | 'browser' (OS family in meta.os)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_events_created_at_idx     ON public.app_events (created_at);
CREATE INDEX IF NOT EXISTS app_events_event_created_idx  ON public.app_events (event, created_at);
CREATE INDEX IF NOT EXISTS app_events_user_created_idx   ON public.app_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS app_events_entity_idx         ON public.app_events (entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS app_events_class_section_idx  ON public.app_events (class_number, section_number, created_at);
-- Seeded pupils have no auth user; they are keyed by meta.sid (scripts/seed-analytics.mjs).
CREATE INDEX IF NOT EXISTS app_events_sid_idx            ON public.app_events ((meta->>'sid'), created_at) WHERE meta ? 'sid';
CREATE INDEX IF NOT EXISTS app_events_seed_idx           ON public.app_events (created_at) WHERE (meta->>'seed') = 'true';

ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

-- Anyone (guest included) may append events, but only as themselves or anonymously.
DROP POLICY IF EXISTS app_events_insert ON public.app_events;
CREATE POLICY app_events_insert ON public.app_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Raw rows are readable only by school staff (the aggregate views sit on top of this).
DROP POLICY IF EXISTS app_events_select_staff ON public.app_events;
CREATE POLICY app_events_select_staff ON public.app_events
  FOR SELECT TO authenticated
  USING (public.is_school_staff());

REVOKE ALL ON TABLE public.app_events FROM anon, authenticated;
GRANT INSERT ON TABLE public.app_events TO anon, authenticated;
GRANT SELECT ON TABLE public.app_events TO authenticated;
GRANT USAGE ON SEQUENCE public.app_events_id_seq TO anon, authenticated;

COMMENT ON TABLE public.app_events IS
  'Client telemetry written through POST /api/track. meta.seed=true marks demo rows; meta.sid keys seeded pupils without an auth user.';
