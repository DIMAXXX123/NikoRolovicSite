-- ============================================================
-- Shared (cross-instance) rate limiting
-- ============================================================
-- src/lib/rate-limit.ts used to keep counters in a per-process Map. On
-- Vercel every serverless instance got its own Map, so the limit was
-- trivially bypassable. Counters now live in this table and are bumped
-- through consume_rate_limit(), called by the server routes with the
-- service_role key.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket      TEXT PRIMARY KEY,
  hits        INT NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx
  ON public.rate_limits (expires_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (which bypasses RLS) may touch it.
REVOKE ALL ON TABLE public.rate_limits FROM anon, authenticated;

COMMENT ON TABLE public.rate_limits IS
  'Fixed-window rate limit counters. Written only by consume_rate_limit(); rows expire and are swept lazily.';

-- Fixed window counter. Returns {allowed, hits, limit, reset_at}.
-- SECURITY INVOKER: the only caller is service_role, which bypasses RLS,
-- so there is no need for a SECURITY DEFINER escalation here.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key             TEXT,
  p_max             INT,
  p_window_seconds  INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_reset_at     TIMESTAMPTZ;
  v_bucket       TEXT;
  v_hits         INT;
BEGIN
  IF p_max < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'consume_rate_limit: p_max and p_window_seconds must be >= 1';
  END IF;

  -- Align to a fixed window so all instances agree on the same bucket.
  v_window_start := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds
  );
  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);
  v_bucket   := p_key || '@' || extract(epoch FROM v_window_start)::BIGINT;

  INSERT INTO rate_limits AS rl (bucket, hits, expires_at)
  VALUES (v_bucket, 1, v_reset_at)
  ON CONFLICT (bucket) DO UPDATE SET hits = rl.hits + 1
  RETURNING rl.hits INTO v_hits;

  -- Lazy cleanup of expired windows (~1 call in 50) so the table stays small
  -- without needing a scheduled job.
  IF random() < 0.02 THEN
    DELETE FROM rate_limits WHERE expires_at < clock_timestamp() - INTERVAL '1 hour';
  END IF;

  RETURN jsonb_build_object(
    'allowed',  v_hits <= p_max,
    'hits',     v_hits,
    'limit',    p_max,
    'reset_at', v_reset_at
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INT, INT) TO service_role;
