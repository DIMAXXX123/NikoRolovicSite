-- ============================================================
-- Direktor panel, phase B.2: direktor_stats() (+ faster v_school_health,
-- at-risk rule tweak). B.3 (20260914000700) adds the other functions.
-- ============================================================
-- One JSON per panel: every block a screen needs (spec §3.1-§3.5, plan §C),
-- with previous-period values, deltas, 30-point sparklines and the "Signali"
-- list (spec §5.1 rules, no cron). SECURITY DEFINER with an explicit role
-- guard at the top; the API routes re-check roles server-side and call these
-- with the service key (auth.role() = 'service_role').
--
-- Shapes are mirrored by hand in src/lib/direktor-types.ts - keep both in sync.

CREATE OR REPLACE FUNCTION public.kpi_json(v NUMERIC, p NUMERIC, s JSONB DEFAULT NULL)
RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object('value', v, 'prev', p, 'delta_pct', public.pct_delta(v, p),
                            'series', coalesce(s, '[]'::jsonb));
$$;

-- Fix: inactive_days could go negative for the handful of seeded rows that sit
-- a few minutes in the future.
CREATE OR REPLACE VIEW public.v_at_risk_students AS
WITH today AS (SELECT public.ev_local_day(now()) AS d),
e AS (
  SELECT public.ev_student_key(user_id, meta) AS sk, user_id, meta->>'sid' AS sid,
         class_number, section_number, event, value, session_id, created_at,
         public.ev_local_day(created_at) AS d
    FROM public.app_events
   WHERE user_id IS NOT NULL OR meta ? 'sid'
), per AS (
  SELECT e.sk, max(e.user_id::text)::uuid AS user_id, max(e.sid)::uuid AS sid,
         mode() WITHIN GROUP (ORDER BY e.class_number) AS class_number,
         mode() WITHIN GROUP (ORDER BY e.section_number) AS section_number,
         count(DISTINCT session_id) FILTER (WHERE event = 'session_start') AS sessions,
         max(e.d) AS last_d,
         avg(value) FILTER (WHERE event = 'quiz_finish' AND e.d >= t.d - 29) AS s30,
         count(*)   FILTER (WHERE event = 'quiz_finish' AND e.d >= t.d - 29) AS n30,
         avg(value) FILTER (WHERE event = 'quiz_finish' AND e.d >= t.d - 59 AND e.d < t.d - 29) AS s60,
         count(*)   FILTER (WHERE event = 'quiz_finish' AND e.d >= t.d - 59 AND e.d < t.d - 29) AS n60
    FROM e CROSS JOIN today t
   GROUP BY e.sk
), last3 AS (
  SELECT sk, bool_and(event = 'quiz_abandon') AS all_abandon
    FROM (SELECT sk, event, row_number() OVER (PARTITION BY sk ORDER BY created_at DESC) AS rn
            FROM e WHERE event IN ('quiz_finish','quiz_abandon')) q
   WHERE rn <= 3 GROUP BY sk HAVING count(*) = 3
), rules AS (
  SELECT per.*, t.d AS today_d,
         GREATEST(0, t.d - per.last_d) AS inactive_days,
         (per.sessions >= 5 AND t.d - per.last_d BETWEEN 14 AND 60) AS r_inactive,
         (per.n30 >= 3 AND per.n60 >= 3 AND per.s60 - per.s30 >= 20) AS r_drop,
         coalesce(l3.all_abandon, false) AS r_abandon,
         round(per.s60 - per.s30) AS drop_pp
    FROM per CROSS JOIN today t LEFT JOIN last3 l3 USING (sk)
)
SELECT sk AS student_key, user_id, sid, class_number, section_number,
       ARRAY_REMOVE(ARRAY[
         CASE WHEN r_inactive THEN 'Neaktivan ' || inactive_days || ' dana' END,
         CASE WHEN r_drop THEN 'Rezultat −' || drop_pp || ' p.p.' END,
         CASE WHEN r_abandon THEN '3 napuštena kviza' END
       ], NULL) AS reasons,
       LEAST(100, (CASE WHEN r_inactive THEN 40 ELSE 0 END)
                + (CASE WHEN r_drop THEN 35 ELSE 0 END)
                + (CASE WHEN r_abandon THEN 25 ELSE 0 END)) AS score,
       last_d AS last_active,
       inactive_days
  FROM rules
 WHERE (r_inactive OR r_drop OR r_abandon)
   AND public.analytics_access();

-- v_school_health, faster: one daily pre-aggregate + trailing-window sums instead
-- of per-day scans of app_events (same formula as in 20260914000500).
CREATE OR REPLACE VIEW public.v_school_health AS
WITH today AS (SELECT public.ev_local_day(now()) AS d),
days AS (SELECT (t.d - g)::date AS d FROM today t, generate_series(0, 96) g),
e AS (
  SELECT public.ev_student_key(user_id, meta) AS sk, event, value, public.ev_local_day(created_at) AS d
    FROM public.app_events
   WHERE created_at >= public.local_day_start(public.ev_local_day(now()) - 96)
),
daily AS (
  SELECT days.d,
         coalesce(sum(value) FILTER (WHERE event = 'quiz_finish'), 0) AS qsum,
         count(*) FILTER (WHERE event = 'quiz_finish') AS qn,
         count(*) FILTER (WHERE event = 'lecture_open') AS opens
    FROM days LEFT JOIN e ON e.d = days.d GROUP BY days.d
),
roll AS (
  SELECT d,
         sum(qsum)  OVER w AS qsum7, sum(qn) OVER w AS qn7,
         sum(opens) OVER w AS opens7
    FROM daily WINDOW w AS (ORDER BY d ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
),
dsk AS (SELECT DISTINCT sk, d FROM e WHERE sk IS NOT NULL),
firsts AS (
  SELECT public.ev_student_key(user_id, meta) AS sk, min(public.ev_local_day(created_at)) AS fd
    FROM public.app_events WHERE user_id IS NOT NULL OR meta ? 'sid' GROUP BY 1
), total AS (SELECT count(*) AS n FROM public.verified_students),
lect AS (SELECT count(*) AS n FROM public.lectures),
c AS (
  SELECT r.d,
         (SELECT count(*) FROM firsts f WHERE f.fd <= r.d) AS seen,
         (SELECT count(DISTINCT sk) FROM dsk WHERE dsk.d BETWEEN r.d - 6 AND r.d) AS wau,
         r.qsum7 / NULLIF(r.qn7, 0) AS avg_score,
         100.0 * r.qn7 / NULLIF(r.opens7, 0) AS funnel,
         (SELECT 100.0 * count(*) / NULLIF((SELECT n FROM lect), 0) FROM public.lectures l
           WHERE public.ev_local_day(coalesce(l.updated_at, l.created_at)) >= r.d - 89) AS freshness
    FROM roll r WHERE r.d > (SELECT d FROM today) - 90
)
SELECT c.d AS date,
       round(0.30 * coalesce(100.0 * c.seen / NULLIF(total.n, 0), 0)
           + 0.25 * coalesce(100.0 * c.wau / NULLIF(c.seen, 0), 0)
           + 0.20 * coalesce(c.avg_score, 0)
           + 0.15 * LEAST(100, coalesce(c.funnel, 0))
           + 0.10 * coalesce(c.freshness, 0), 1) AS score,
       round(coalesce(100.0 * c.seen / NULLIF(total.n, 0), 0), 1) AS coverage,
       round(coalesce(100.0 * c.wau / NULLIF(c.seen, 0), 0), 1) AS wau,
       round(coalesce(c.avg_score, 0)::numeric, 1) AS avg_score,
       round(LEAST(100, coalesce(c.funnel, 0))::numeric, 1) AS funnel,
       round(coalesce(c.freshness, 0)::numeric, 1) AS freshness
  FROM c CROSS JOIN total
 WHERE public.analytics_access();

-- ============================================================
-- direktor_stats
-- ============================================================
CREATE OR REPLACE FUNCTION public.direktor_stats(
  period TEXT,
  class_number INT DEFAULT NULL,
  section_number INT DEFAULT NULL,
  subject TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
#variable_conflict use_column
DECLARE
  p_period  TEXT := period;
  p_class   INT  := class_number;
  p_section INT  := section_number;
  p_subject TEXT := subject;
  role_     TEXT := public.caller_role();
  b         RECORD;
  today     DATE := public.ev_local_day(now());
  lo_ts     TIMESTAMPTZ;
  act_from  DATE;
  act_len   INT;
  verified_total INT;
  demo_share NUMERIC;

  j_meta JSONB; j_health JSONB; j_kpi JSONB; j_ret JSONB; j_act JSONB; j_heat JSONB;
  j_signals JSONB; j_dev JSONB; j_ai JSONB; j_learn JSONB; j_classes JSONB;
  j_detail JSONB; j_teach JSONB; j_comm JSONB;
  ser RECORD;
  latest_ai RECORD;
  n_risk INT;
  n_churn INT;
BEGIN
  IF role_ IS NULL OR role_ NOT IN ('direktor','admin','creator','pedagog','service_role') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO b FROM public.direktor_period_bounds(p_period);
  lo_ts    := LEAST(b.prev_from, public.local_day_start(today - 59));
  act_from := LEAST(b.from_day, today - 6);
  act_len  := today - act_from + 1;

  -- ---------- working set ----------
  -- Two scans of app_events only: `ev` (the period + the previous one, at least
  -- 60 days) and `firsts` (one row per student, all time). Everything else is
  -- computed from these temp tables.
  DROP TABLE IF EXISTS pg_temp.ev, pg_temp.dsk, pg_temp.days30, pg_temp.firsts, pg_temp.runs,
                       pg_temp.daily, pg_temp.ldaily, pg_temp.dq, pg_temp.health, pg_temp.cstats, pg_temp.risk;

  CREATE TEMP TABLE ev ON COMMIT DROP AS
  SELECT x.sk, x.cls, x.sec, x.event, x.entity_id, x.subj, x.value, x.session_id, x.platform, x.os, x.ts,
         x.lt::date AS d, EXTRACT(HOUR FROM x.lt)::int AS hr, (EXTRACT(ISODOW FROM x.lt)::int - 1) AS wd,
         x.seed, x.cur, x.prev, x.q, x.results, x.mtype, x.merr
    FROM (SELECT coalesce(a.user_id::text, a.meta->>'sid') AS sk,
                 a.class_number AS cls, a.section_number AS sec,
                 a.event, a.entity_id, a.subject AS subj, a.value, a.session_id, a.platform,
                 a.meta->>'os' AS os, a.created_at AS ts,
                 (a.created_at AT TIME ZONE 'Europe/Podgorica') AS lt,
                 (a.meta->>'seed' = 'true') AS seed,
                 (a.created_at >= b.from_ts AND a.created_at < b.to_ts) AS cur,
                 (a.created_at >= b.prev_from AND a.created_at < b.prev_to) AS prev,
                 CASE WHEN a.event = 'lecture_search' THEN lower(trim(a.meta->>'q')) END AS q,
                 CASE WHEN a.event = 'lecture_search' AND a.meta->>'results' ~ '^\d+$' THEN (a.meta->>'results')::int END AS results,
                 CASE WHEN a.event IN ('push_received','push_opened') THEN a.meta->>'type' END AS mtype,
                 (a.event = 'ednevnik_sync' AND a.meta ? 'error') AS merr
            FROM public.app_events a
           WHERE a.created_at >= lo_ts AND a.created_at < b.to_ts
             AND a.event <> 'screen_view'   -- navigation noise: not used by any block
             AND (p_class IS NULL OR a.class_number = p_class)
             AND (p_section IS NULL OR a.section_number = p_section)) x;
  CREATE INDEX ON ev (event);
  CREATE INDEX ON ev (entity_id);
  ANALYZE ev;

  -- one row per student, all time, from session_start rows only (every session has one)
  CREATE TEMP TABLE firsts ON COMMIT DROP AS
  SELECT sk, min(d) AS fd, max(d) AS last_d, count(*) AS sessions, min(cls) AS cls, min(sec) AS sec
    FROM (SELECT coalesce(a.user_id::text, a.meta->>'sid') AS sk, public.ev_local_day(a.created_at) AS d,
                 a.class_number AS cls, a.section_number AS sec
            FROM public.app_events a
           WHERE a.event = 'session_start'
             AND (a.user_id IS NOT NULL OR a.meta ? 'sid')
             AND (p_class IS NULL OR a.class_number = p_class)
             AND (p_section IS NULL OR a.section_number = p_section)) t
   GROUP BY sk;

  CREATE TEMP TABLE dsk ON COMMIT DROP AS SELECT DISTINCT d, sk FROM ev WHERE sk IS NOT NULL;
  CREATE TEMP TABLE days30 ON COMMIT DROP AS SELECT (today - g)::date AS d FROM generate_series(29, 0, -1) g;
  -- consecutive-day runs per student (for streaks)
  CREATE TEMP TABLE runs ON COMMIT DROP AS
  SELECT sk, min(d) AS start_d, max(d) AS end_d, count(*) AS len
    FROM (SELECT sk, d, d - (row_number() OVER (PARTITION BY sk ORDER BY d))::int AS grp FROM dsk) t
   GROUP BY sk, grp;

  -- one-pass per-day aggregates (all events / lecture events with the subject filter)
  CREATE TEMP TABLE daily ON COMMIT DROP AS
  SELECT ds.d,
         (SELECT count(*) FROM dsk WHERE dsk.d = ds.d) AS dau,
         count(DISTINCT e.session_id) FILTER (WHERE e.event = 'session_start') AS sessions,
         coalesce(sum(e.value) FILTER (WHERE e.event = 'session_end'), 0) AS sess_sum,
         count(*) FILTER (WHERE e.event = 'session_end') AS sess_n,
         count(*) FILTER (WHERE e.event = 'installed') AS installs,
         count(DISTINCT e.sk) FILTER (WHERE e.event = 'news_view') AS news_viewers,
         count(*) FILTER (WHERE e.event IN ('news_like','photo_like')) AS likes,
         count(*) FILTER (WHERE e.event = 'event_view') AS event_views,
         count(*) FILTER (WHERE e.event = 'photo_upload') AS uploads,
         count(*) FILTER (WHERE e.event = 'game_start') AS games,
         count(*) FILTER (WHERE e.event = 'share') AS shares,
         count(*) FILTER (WHERE e.event = 'lecture_open') AS opens_all,
         count(*) FILTER (WHERE e.event = 'quiz_finish') AS quizzes_all,
         coalesce(sum(e.value) FILTER (WHERE e.event = 'quiz_finish'), 0) AS qsum_all
    FROM (SELECT (today - g)::date AS d FROM generate_series(0, 59) g) ds
    LEFT JOIN ev e ON e.d = ds.d
   GROUP BY ds.d;
  CREATE TEMP TABLE ldaily ON COMMIT DROP AS
  SELECT ds.d,
         count(*) FILTER (WHERE e.event = 'lecture_read') AS reads,
         count(*) FILTER (WHERE e.event = 'quiz_finish') AS quizzes,
         coalesce(sum(e.value) FILTER (WHERE e.event = 'quiz_finish'), 0) AS qsum,
         coalesce(sum(e.value) FILTER (WHERE e.event = 'lecture_time'), 0) AS lt_sum,
         count(*) FILTER (WHERE e.event = 'lecture_time') AS lt_n
    FROM (SELECT (today - g)::date AS d FROM generate_series(0, 59) g) ds
    LEFT JOIN ev e ON e.d = ds.d AND (p_subject IS NULL OR e.subj = p_subject)
   GROUP BY ds.d;
  CREATE TEMP TABLE dq ON COMMIT DROP AS
  SELECT DISTINCT d, sk FROM ev WHERE event = 'quiz_finish' AND sk IS NOT NULL AND (p_subject IS NULL OR subj = p_subject);

  SELECT count(*) INTO verified_total FROM public.verified_students v
   WHERE (p_class IS NULL OR v.class_number = p_class) AND (p_section IS NULL OR v.section_number = p_section);

  -- school health, last 30 days (same formula as v_school_health, computed from the temp tables)
  CREATE TEMP TABLE health ON COMMIT DROP AS
  WITH roll AS (
    SELECT d, sum(qsum_all) OVER w AS qsum7, sum(quizzes_all) OVER w AS qn7, sum(opens_all) OVER w AS opens7
      FROM daily WINDOW w AS (ORDER BY d ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
  ), lect AS (SELECT count(*) AS n FROM public.lectures),
  c AS (
    SELECT r.d,
           (SELECT count(*) FROM firsts f WHERE f.fd <= r.d) AS seen,
           (SELECT count(DISTINCT sk) FROM dsk WHERE dsk.d BETWEEN r.d - 6 AND r.d) AS wau,
           r.qsum7 / NULLIF(r.qn7, 0) AS avg_score,
           100.0 * r.qn7 / NULLIF(r.opens7, 0) AS funnel,
           (SELECT 100.0 * count(*) / NULLIF((SELECT n FROM lect), 0) FROM public.lectures l
             WHERE public.ev_local_day(coalesce(l.updated_at, l.created_at)) >= r.d - 89) AS freshness
      FROM roll r WHERE r.d > today - 30
  )
  SELECT c.d AS date,
         round(0.30 * coalesce(100.0 * c.seen / NULLIF(verified_total, 0), 0)
             + 0.25 * coalesce(100.0 * c.wau / NULLIF(c.seen, 0), 0)
             + 0.20 * coalesce(c.avg_score, 0)
             + 0.15 * LEAST(100, coalesce(c.funnel, 0))
             + 0.10 * coalesce(c.freshness, 0), 1) AS score,
         round(coalesce(100.0 * c.seen / NULLIF(verified_total, 0), 0), 1) AS coverage,
         round(coalesce(100.0 * c.wau / NULLIF(c.seen, 0), 0), 1) AS wau,
         round(coalesce(c.avg_score, 0)::numeric, 1) AS avg_score,
         round(LEAST(100, coalesce(c.funnel, 0))::numeric, 1) AS funnel,
         round(coalesce(c.freshness, 0)::numeric, 1) AS freshness
    FROM c;

  -- class/section stats (same definition as v_class_stats)
  CREATE TEMP TABLE cstats ON COMMIT DROP AS
  WITH vs AS (
    SELECT v.class_number, v.section_number, count(*) AS students_total FROM public.verified_students v
     WHERE (p_class IS NULL OR v.class_number = p_class) AND (p_section IS NULL OR v.section_number = p_section)
     GROUP BY 1, 2
  ), reg AS (SELECT cls, sec, count(*) AS registered FROM firsts WHERE cls IS NOT NULL AND sec IS NOT NULL GROUP BY 1, 2),
  g AS (
    SELECT cls, sec,
           count(DISTINCT sk) FILTER (WHERE d >= today - 6) AS active_7d,
           count(DISTINCT sk) FILTER (WHERE d >= today - 29) AS active_30d,
           count(*) FILTER (WHERE event = 'lecture_read' AND d >= today - 29) AS reads_30d,
           count(*) FILTER (WHERE event = 'quiz_finish' AND d >= today - 29) AS quizzes_30d,
           avg(value) FILTER (WHERE event = 'quiz_finish' AND d >= today - 29) AS avg_score,
           count(DISTINCT session_id) FILTER (WHERE event = 'session_start' AND d >= today - 6) AS sess_7,
           count(DISTINCT session_id) FILTER (WHERE event = 'session_start' AND d BETWEEN today - 13 AND today - 7) AS sess_prev7
      FROM ev WHERE cls IS NOT NULL AND sec IS NOT NULL AND sk IS NOT NULL GROUP BY cls, sec
  )
  SELECT vs.class_number, vs.section_number, vs.students_total,
         coalesce(reg.registered, 0) AS registered,
         CASE WHEN reg.registered >= public.k_anon_min() THEN g.active_7d END AS active_7d,
         CASE WHEN reg.registered >= public.k_anon_min() THEN g.active_30d END AS active_30d,
         CASE WHEN reg.registered >= public.k_anon_min() THEN round(g.reads_30d::numeric / NULLIF(g.active_30d, 0), 2) END AS lectures_read_per_student,
         CASE WHEN reg.registered >= public.k_anon_min() THEN round(g.quizzes_30d::numeric / NULLIF(g.active_30d, 0), 2) END AS quizzes_per_student,
         CASE WHEN reg.registered >= public.k_anon_min() THEN round(g.avg_score::numeric, 1) END AS avg_score,
         CASE WHEN reg.registered >= public.k_anon_min() THEN public.pct_delta(g.sess_7, g.sess_prev7) END AS trend_7d_pct,
         (coalesce(reg.registered, 0) < public.k_anon_min()) AS k_hidden
    FROM vs LEFT JOIN reg ON reg.cls = vs.class_number AND reg.sec = vs.section_number
            LEFT JOIN g ON g.cls = vs.class_number AND g.sec = vs.section_number;

  -- at-risk flags (same rules as v_at_risk_students; quiz windows come from ev)
  CREATE TEMP TABLE risk ON COMMIT DROP AS
  WITH per AS (
    SELECT f.sk, f.cls AS class_number, f.sec AS section_number, f.sessions, f.last_d,
           avg(e.value) FILTER (WHERE e.d >= today - 29) AS s30, count(e.value) FILTER (WHERE e.d >= today - 29) AS n30,
           avg(e.value) FILTER (WHERE e.d BETWEEN today - 59 AND today - 30) AS s60, count(e.value) FILTER (WHERE e.d BETWEEN today - 59 AND today - 30) AS n60
      FROM firsts f LEFT JOIN ev e ON e.sk = f.sk AND e.event = 'quiz_finish'
     GROUP BY f.sk, f.cls, f.sec, f.sessions, f.last_d
  ), last3 AS (
    SELECT sk, bool_and(event = 'quiz_abandon') AS all_abandon
      FROM (SELECT sk, event, row_number() OVER (PARTITION BY sk ORDER BY ts DESC) AS rn
              FROM ev WHERE event IN ('quiz_finish','quiz_abandon') AND sk IS NOT NULL) q
     WHERE rn <= 3 GROUP BY sk HAVING count(*) = 3
  ), rules AS (
    SELECT per.*, GREATEST(0, today - per.last_d) AS inactive_days,
           (per.sessions >= 5 AND today - per.last_d BETWEEN 14 AND 60) AS r_inactive,
           (per.n30 >= 3 AND per.n60 >= 3 AND per.s60 - per.s30 >= 20) AS r_drop,
           coalesce(l3.all_abandon, false) AS r_abandon,
           round(per.s60 - per.s30) AS drop_pp
      FROM per LEFT JOIN last3 l3 USING (sk)
  )
  SELECT sk AS student_key, class_number, section_number,
         ARRAY_REMOVE(ARRAY[
           CASE WHEN r_inactive THEN 'Neaktivan ' || inactive_days || ' dana' END,
           CASE WHEN r_drop THEN 'Rezultat −' || drop_pp || ' p.p.' END,
           CASE WHEN r_abandon THEN '3 napuštena kviza' END], NULL) AS reasons,
         LEAST(100, (CASE WHEN r_inactive THEN 40 ELSE 0 END) + (CASE WHEN r_drop THEN 35 ELSE 0 END) + (CASE WHEN r_abandon THEN 25 ELSE 0 END)) AS score,
         last_d AS last_active, inactive_days
    FROM rules WHERE r_inactive OR r_drop OR r_abandon;

  ANALYZE dsk; ANALYZE firsts; ANALYZE runs; ANALYZE daily; ANALYZE ldaily; ANALYZE dq; ANALYZE health; ANALYZE cstats; ANALYZE risk;

  SELECT round(100.0 * count(*) FILTER (WHERE seed) / NULLIF(count(*), 0), 1) INTO demo_share FROM ev WHERE cur;

  -- ---------- meta ----------
  j_meta := jsonb_build_object(
    'period', p_period, 'from', b.from_day, 'to', b.to_day, 'days', b.days,
    'prev_from', (b.from_day - b.days), 'prev_to', (b.from_day - 1),
    'class', p_class, 'section', p_section, 'subject', p_subject,
    'generated_at', now(), 'demo_share', coalesce(demo_share, 0),
    'collecting_since', (SELECT min(created_at) FROM public.app_events),
    'last_event_at', (SELECT max(created_at) FROM public.app_events WHERE created_at <= now()),
    'events_in_period', (SELECT count(*) FROM ev WHERE cur),
    'k_min', public.k_anon_min(), 'verified_total', verified_total
  );

  -- ---------- health (school-wide, v_school_health) ----------
  SELECT jsonb_build_object(
    'score', (SELECT score FROM health WHERE date = today),
    'prev_score', (SELECT score FROM health WHERE date = today - 7),
    'delta', (SELECT score FROM health WHERE date = today)
           - (SELECT score FROM health WHERE date = today - 7),
    'components', (SELECT jsonb_build_object(
        'coverage',  jsonb_build_object('value', h.coverage,  'weight', 30),
        'wau',       jsonb_build_object('value', h.wau,       'weight', 25),
        'avg_score', jsonb_build_object('value', h.avg_score, 'weight', 20),
        'funnel',    jsonb_build_object('value', h.funnel,    'weight', 15),
        'freshness', jsonb_build_object('value', h.freshness, 'weight', 10))
       FROM health h WHERE h.date = today),
    'series', (SELECT coalesce(jsonb_agg(score ORDER BY date), '[]') FROM health WHERE date > today - 30)
  ) INTO j_health;

  -- ---------- KPI row (fixed windows, 30-point daily sparklines) ----------
  SELECT jsonb_agg(x.dau ORDER BY x.d) AS dau, jsonb_agg(x.wau ORDER BY x.d) AS wau,
         jsonb_agg(x.mau ORDER BY x.d) AS mau, jsonb_agg(x.cov ORDER BY x.d) AS cov,
         jsonb_agg(x.avg_sess ORDER BY x.d) AS avg_sess, jsonb_agg(x.spw ORDER BY x.d) AS spw
    INTO ser
    FROM (
      SELECT ds.d,
        (SELECT count(*) FROM dsk WHERE dsk.d = ds.d) AS dau,
        (SELECT count(DISTINCT sk) FROM dsk WHERE dsk.d BETWEEN ds.d - 6 AND ds.d) AS wau,
        (SELECT count(DISTINCT sk) FROM dsk WHERE dsk.d BETWEEN ds.d - 29 AND ds.d) AS mau,
        round(100.0 * (SELECT count(*) FROM firsts WHERE fd <= ds.d) / NULLIF(verified_total, 0), 1) AS cov,
        (SELECT round(sess_sum / NULLIF(sess_n, 0)) FROM daily WHERE daily.d = ds.d) AS avg_sess,
        round((SELECT sum(sessions) FROM daily WHERE daily.d BETWEEN ds.d - 6 AND ds.d)::numeric
              / NULLIF((SELECT count(DISTINCT sk) FROM dsk WHERE dsk.d BETWEEN ds.d - 6 AND ds.d), 0), 2) AS spw
      FROM days30 ds) x;

  SELECT jsonb_build_object(
    'active_today', public.kpi_json(
        (SELECT count(*) FROM dsk WHERE d = today),
        (SELECT count(*) FROM dsk WHERE d = today - 1), ser.dau),
    'wau', public.kpi_json(
        (SELECT count(DISTINCT sk) FROM dsk WHERE d >= today - 6),
        (SELECT count(DISTINCT sk) FROM dsk WHERE d BETWEEN today - 13 AND today - 7), ser.wau),
    'mau', public.kpi_json(
        (SELECT count(DISTINCT sk) FROM dsk WHERE d >= today - 29),
        (SELECT count(DISTINCT sk) FROM dsk WHERE d BETWEEN today - 59 AND today - 30), ser.mau),
    'coverage_pct', public.kpi_json(
        round(100.0 * (SELECT count(*) FROM firsts WHERE fd <= today) / NULLIF(verified_total, 0), 1),
        round(100.0 * (SELECT count(*) FROM firsts WHERE fd <= today - b.days) / NULLIF(verified_total, 0), 1), ser.cov),
    'avg_session_s', public.kpi_json(
        (SELECT round(avg(value)) FROM ev WHERE event = 'session_end' AND cur),
        (SELECT round(avg(value)) FROM ev WHERE event = 'session_end' AND prev), ser.avg_sess),
    'sessions_per_student_week', public.kpi_json(
        round((SELECT count(*) FROM ev WHERE event = 'session_start' AND cur)::numeric
              / NULLIF((SELECT count(DISTINCT sk) FROM ev WHERE cur AND sk IS NOT NULL), 0) / (b.days / 7.0), 2),
        round((SELECT count(*) FROM ev WHERE event = 'session_start' AND prev)::numeric
              / NULLIF((SELECT count(DISTINCT sk) FROM ev WHERE prev AND sk IS NOT NULL), 0) / (b.days / 7.0), 2), ser.spw),
    'registered', (SELECT count(*) FROM firsts),
    'verified_total', verified_total
  ) INTO j_kpi;

  -- ---------- retention (cohort = ISO week of first session; class filter honoured) ----------
  WITH s AS (
    SELECT DISTINCT public.ev_student_key(a.user_id, a.meta) AS sk, public.ev_local_day(a.created_at) AS d
      FROM public.app_events a
     WHERE a.event = 'session_start' AND (a.user_id IS NOT NULL OR a.meta ? 'sid')
       AND (p_class IS NULL OR a.class_number = p_class)
       AND (p_section IS NULL OR a.section_number = p_section)
  ), f AS (SELECT sk, min(d) AS fd FROM s GROUP BY sk),
  j AS (SELECT f.sk, date_trunc('week', f.fd)::date AS cw, (s.d - f.fd) AS age FROM f JOIN s USING (sk)),
  c AS (
    SELECT cw AS cohort_week, count(DISTINCT sk) AS size,
           round(100.0 * count(DISTINCT sk) FILTER (WHERE age = 1) / count(DISTINCT sk), 1) AS d1,
           CASE WHEN cw + 20 <= today THEN round(100.0 * count(DISTINCT sk) FILTER (WHERE age BETWEEN 7 AND 13) / count(DISTINCT sk), 1) END AS d7,
           CASE WHEN cw + 43 <= today THEN round(100.0 * count(DISTINCT sk) FILTER (WHERE age BETWEEN 30 AND 36) / count(DISTINCT sk), 1) END AS d30
      FROM j GROUP BY cw
  )
  SELECT jsonb_build_object(
    'last_cohort', (SELECT to_jsonb(c) FROM c WHERE size >= public.k_anon_min() AND d7 IS NOT NULL ORDER BY cohort_week DESC LIMIT 1),
    'cohorts', (SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY cohort_week), '[]')
                  FROM (SELECT * FROM c WHERE size >= public.k_anon_min() ORDER BY cohort_week DESC LIMIT 16) c)
  ) INTO j_ret;

  -- ---------- activity (daily, period window >= 7 days, plus the preceding window) ----------
  WITH cal AS (SELECT (act_from + g)::date AS d, g AS idx FROM generate_series(0, act_len - 1) g),
  agg AS (
    SELECT d,
           count(DISTINCT sk) AS dau,
           count(DISTINCT session_id) FILTER (WHERE event = 'session_start') AS sessions,
           round(avg(value) FILTER (WHERE event = 'session_end')) AS avg_session_s,
           count(*) FILTER (WHERE event = 'installed') AS installs
      FROM ev WHERE d >= act_from - act_len GROUP BY d
  )
  SELECT jsonb_build_object(
    'from', act_from, 'to', today, 'days', act_len,
    'series', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'date', cal.d, 'dau', coalesce(agg.dau, 0), 'sessions', coalesce(agg.sessions, 0),
        'avg_session_s', agg.avg_session_s,
        'new_users', (SELECT count(*) FROM firsts WHERE fd = cal.d),
        'installs', coalesce(agg.installs, 0)) ORDER BY cal.d), '[]')
       FROM cal LEFT JOIN agg ON agg.d = cal.d),
    'prev_series', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'date', (cal.d - act_len), 'dau', coalesce(agg.dau, 0), 'sessions', coalesce(agg.sessions, 0)) ORDER BY cal.d), '[]')
       FROM cal LEFT JOIN agg ON agg.d = cal.d - act_len),
    'totals', (SELECT jsonb_build_object(
        'sessions', count(DISTINCT session_id) FILTER (WHERE event = 'session_start' AND cur),
        'prev_sessions', count(DISTINCT session_id) FILTER (WHERE event = 'session_start' AND prev),
        'installs', count(*) FILTER (WHERE event = 'installed' AND cur),
        'new_users', (SELECT count(*) FROM firsts WHERE fd BETWEEN b.from_day AND b.to_day)) FROM ev)
  ) INTO j_act;

  -- ---------- heatmap (7 x 24, local time, weekday 0 = Monday) ----------
  WITH grid AS (SELECT w, h FROM generate_series(0, 6) w, generate_series(0, 23) h),
  cnt AS (SELECT wd, hr, count(*) AS n FROM ev WHERE d >= act_from GROUP BY wd, hr),
  cells AS (SELECT g.w AS weekday, g.h AS hour, coalesce(c.n, 0) AS events FROM grid g LEFT JOIN cnt c ON c.wd = g.w AND c.hr = g.h),
  blocks AS (
    SELECT a.weekday, a.hour, a.events + coalesce(b2.events, 0) + coalesce(b3.events, 0) AS n
      FROM cells a LEFT JOIN cells b2 ON b2.weekday = a.weekday AND b2.hour = a.hour + 1
                   LEFT JOIN cells b3 ON b3.weekday = a.weekday AND b3.hour = a.hour + 2
     WHERE a.hour <= 21
  )
  SELECT jsonb_build_object(
    'cells', (SELECT jsonb_agg(jsonb_build_object('weekday', weekday, 'hour', hour, 'events', events) ORDER BY weekday, hour) FROM cells),
    'max', (SELECT max(events) FROM cells),
    'peak', (SELECT jsonb_build_object('weekday', weekday, 'hour_from', hour, 'hour_to', hour + 2, 'events', n)
               FROM blocks ORDER BY n DESC, weekday, hour LIMIT 1),
    'by_weekday', (SELECT jsonb_agg(s ORDER BY weekday) FROM (SELECT weekday, sum(events) AS s FROM cells GROUP BY weekday) t)
  ) INTO j_heat;

  -- ---------- devices ----------
  SELECT jsonb_build_object(
    'sessions', count(*) FILTER (WHERE event = 'session_start' AND cur),
    'pwa_share_pct', round(100.0 * count(*) FILTER (WHERE event = 'session_start' AND cur AND platform = 'pwa')
                           / NULLIF(count(*) FILTER (WHERE event = 'session_start' AND cur), 0), 1),
    'os', (SELECT coalesce(jsonb_agg(jsonb_build_object('os', os, 'sessions', n, 'share_pct', share) ORDER BY n DESC), '[]')
             FROM (SELECT os, n, round(100.0 * n / NULLIF(sum(n) OVER (), 0), 1) AS share
                     FROM (SELECT coalesce(os, 'other') AS os, count(*) AS n FROM ev WHERE event = 'session_start' AND cur GROUP BY 1) t0) t),
    'installs', count(*) FILTER (WHERE event = 'installed' AND cur),
    'install_prompts', count(*) FILTER (WHERE event = 'install_prompt' AND cur),
    'ednevnik_connected', count(DISTINCT sk) FILTER (WHERE event IN ('ednevnik_connect','ednevnik_sync')),
    'ednevnik_pct', round(100.0 * count(DISTINCT sk) FILTER (WHERE event IN ('ednevnik_connect','ednevnik_sync'))
                          / NULLIF(count(DISTINCT sk) FILTER (WHERE cur), 0), 1)
  ) INTO j_dev FROM ev;

  -- ---------- AI (latest finished report; adhoc quota) ----------
  SELECT id, kind, created_at, finished_at, model, output, scope INTO latest_ai
    FROM public.analysis_jobs WHERE status = 'done' AND kind <> 'question'
   ORDER BY coalesce(finished_at, created_at) DESC LIMIT 1;
  j_ai := jsonb_build_object(
    'latest', CASE WHEN latest_ai.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', latest_ai.id, 'kind', latest_ai.kind, 'created_at', latest_ai.created_at,
        'finished_at', latest_ai.finished_at, 'model', latest_ai.model, 'scope', latest_ai.scope,
        'output', latest_ai.output) END,
    'pending', (SELECT count(*) FROM public.analysis_jobs WHERE status IN ('pending','processing')),
    'adhoc_today', (SELECT count(*) FROM public.analysis_jobs WHERE kind IN ('adhoc','question') AND created_at >= public.local_day_start(today)),
    'adhoc_limit', 5
  );

  -- ---------- learning ----------
  WITH lv AS (SELECT * FROM ev WHERE (p_subject IS NULL OR subj = p_subject)),
  lser AS (
    SELECT jsonb_agg(x.reads ORDER BY x.d) AS reads, jsonb_agg(x.quizzes ORDER BY x.d) AS quizzes,
           jsonb_agg(x.avg_score ORDER BY x.d) AS avg_score, jsonb_agg(x.wq ORDER BY x.d) AS wq,
           jsonb_agg(x.lt ORDER BY x.d) AS lt, jsonb_agg(x.streaks ORDER BY x.d) AS streaks
      FROM (SELECT ds.d,
              ld.reads, ld.quizzes,
              round(ld.qsum / NULLIF(ld.quizzes, 0), 1) AS avg_score,
              round(100.0 * (SELECT count(DISTINCT sk) FROM dq WHERE dq.d BETWEEN ds.d - 6 AND ds.d)
                    / NULLIF((SELECT count(DISTINCT sk) FROM dsk WHERE dsk.d BETWEEN ds.d - 6 AND ds.d), 0), 1) AS wq,
              round(ld.lt_sum / NULLIF(ld.lt_n, 0)) AS lt,
              (SELECT count(*) FROM runs WHERE len >= 7 AND ds.d BETWEEN start_d AND end_d) AS streaks
            FROM days30 ds JOIN ldaily ld ON ld.d = ds.d) x
  ),
  subj AS (
    SELECT subj AS subject,
           count(DISTINCT sk) AS students,
           count(*) FILTER (WHERE event = 'lecture_open' AND cur) AS opens,
           count(*) FILTER (WHERE event = 'lecture_read' AND cur) AS reads,
           count(*) FILTER (WHERE event = 'quiz_start' AND cur) AS quiz_starts,
           count(*) FILTER (WHERE event = 'quiz_finish' AND cur) AS quiz_finishes,
           count(*) FILTER (WHERE event = 'quiz_abandon' AND cur) AS quiz_abandons,
           avg(value) FILTER (WHERE event = 'quiz_finish' AND cur) AS avg_score,
           avg(value) FILTER (WHERE event = 'quiz_finish' AND prev) AS prev_avg_score,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY value) FILTER (WHERE event = 'quiz_finish' AND cur) AS median_score,
           percentile_cont(0.25) WITHIN GROUP (ORDER BY value) FILTER (WHERE event = 'quiz_finish' AND cur) AS p25_score,
           avg(value) FILTER (WHERE event = 'lecture_time' AND cur) AS avg_time_s
      FROM ev WHERE subj IS NOT NULL AND (cur OR prev) GROUP BY subj
  ),
  lect AS (
    SELECT l.id, l.title, l.subject, l.class_number,
           count(*) FILTER (WHERE e.event = 'lecture_open' AND e.cur) AS opens,
           count(*) FILTER (WHERE e.event = 'lecture_read' AND e.cur) AS reads,
           count(*) FILTER (WHERE e.event = 'quiz_start' AND e.cur) AS attempts,
           count(*) FILTER (WHERE e.event = 'quiz_abandon' AND e.cur) AS abandons,
           avg(e.value) FILTER (WHERE e.event = 'quiz_finish' AND e.cur) AS avg_score,
           avg(e.value) FILTER (WHERE e.event = 'quiz_finish' AND e.prev) AS prev_avg
      FROM public.lectures l LEFT JOIN ev e ON e.entity_id = l.id AND (e.cur OR e.prev)
     WHERE (p_subject IS NULL OR l.subject = p_subject) AND (p_class IS NULL OR l.class_number = p_class)
     GROUP BY l.id
  )
  SELECT jsonb_build_object(
    'kpi', jsonb_build_object(
      'reads', public.kpi_json((SELECT count(*) FROM lv WHERE event = 'lecture_read' AND cur), (SELECT count(*) FROM lv WHERE event = 'lecture_read' AND prev), (SELECT reads FROM lser)),
      'quizzes', public.kpi_json((SELECT count(*) FROM lv WHERE event = 'quiz_finish' AND cur), (SELECT count(*) FROM lv WHERE event = 'quiz_finish' AND prev), (SELECT quizzes FROM lser)),
      'avg_score', public.kpi_json((SELECT round(avg(value), 1) FROM lv WHERE event = 'quiz_finish' AND cur), (SELECT round(avg(value), 1) FROM lv WHERE event = 'quiz_finish' AND prev), (SELECT avg_score FROM lser)),
      'weekly_quiz_pct', public.kpi_json(
          round(100.0 * (SELECT count(DISTINCT sk) FROM lv WHERE event = 'quiz_finish' AND cur) / NULLIF((SELECT count(DISTINCT sk) FROM ev WHERE cur AND sk IS NOT NULL), 0), 1),
          round(100.0 * (SELECT count(DISTINCT sk) FROM lv WHERE event = 'quiz_finish' AND prev) / NULLIF((SELECT count(DISTINCT sk) FROM ev WHERE prev AND sk IS NOT NULL), 0), 1),
          (SELECT wq FROM lser)),
      'avg_lecture_time_s', public.kpi_json((SELECT round(avg(value)) FROM lv WHERE event = 'lecture_time' AND cur), (SELECT round(avg(value)) FROM lv WHERE event = 'lecture_time' AND prev), (SELECT lt FROM lser)),
      'streaks_7', public.kpi_json((SELECT count(DISTINCT sk) FROM runs WHERE len >= 7 AND end_d >= b.from_day),
                                   (SELECT count(DISTINCT sk) FROM runs WHERE len >= 7 AND end_d >= b.from_day - b.days AND end_d < b.from_day),
                                   (SELECT streaks FROM lser))
    ),
    'funnel', (SELECT jsonb_build_object(
        'opened', count(*) FILTER (WHERE event = 'lecture_open'),
        'read', count(*) FILTER (WHERE event = 'lecture_read'),
        'quiz_started', count(*) FILTER (WHERE event = 'quiz_start'),
        'quiz_finished', count(*) FILTER (WHERE event = 'quiz_finish')) FROM lv WHERE cur),
    'subjects', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'subject', s.subject,
        'lectures_total', (SELECT count(*) FROM public.lectures l WHERE l.subject = s.subject AND (p_class IS NULL OR l.class_number = p_class)),
        'students', s.students, 'k_hidden', s.students < public.k_anon_min(),
        'opens', CASE WHEN s.students >= public.k_anon_min() THEN s.opens END,
        'reads', CASE WHEN s.students >= public.k_anon_min() THEN s.reads END,
        'quiz_starts', CASE WHEN s.students >= public.k_anon_min() THEN s.quiz_starts END,
        'quiz_finishes', CASE WHEN s.students >= public.k_anon_min() THEN s.quiz_finishes END,
        'avg_score', CASE WHEN s.students >= public.k_anon_min() THEN round(s.avg_score::numeric, 1) END,
        'prev_avg_score', CASE WHEN s.students >= public.k_anon_min() THEN round(s.prev_avg_score::numeric, 1) END,
        'delta_pp', CASE WHEN s.students >= public.k_anon_min() THEN round((s.avg_score - s.prev_avg_score)::numeric, 1) END,
        'median_score', CASE WHEN s.students >= public.k_anon_min() THEN round(s.median_score::numeric, 1) END,
        'p25_score', CASE WHEN s.students >= public.k_anon_min() THEN round(s.p25_score::numeric, 1) END,
        'abandon_rate', CASE WHEN s.students >= public.k_anon_min() THEN round(100.0 * s.quiz_abandons / NULLIF(s.quiz_starts, 0), 1) END,
        'avg_time_s', CASE WHEN s.students >= public.k_anon_min() THEN round(s.avg_time_s::numeric) END
      ) ORDER BY s.avg_score ASC NULLS LAST), '[]') FROM subj s),
    'score_hist', (SELECT jsonb_build_object(
        'bins', (SELECT jsonb_agg(coalesce(n, 0) ORDER BY bin) FROM generate_series(0, 9) bin
                   LEFT JOIN (SELECT LEAST(floor(value / 10), 9)::int AS bb, count(*) AS n FROM lv WHERE event = 'quiz_finish' AND cur GROUP BY 1) h ON h.bb = bin),
        'total', (SELECT count(*) FROM lv WHERE event = 'quiz_finish' AND cur),
        'below_50_pct', (SELECT round(100.0 * count(*) FILTER (WHERE value < 50) / NULLIF(count(*), 0), 1) FROM lv WHERE event = 'quiz_finish' AND cur))),
    'risk_topics', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'lecture_id', id, 'title', title, 'subject', subject, 'class_number', class_number,
        'avg_score', round(avg_score::numeric, 1), 'attempts', attempts,
        'abandon_rate', round(100.0 * abandons / NULLIF(attempts, 0), 1),
        'trend_pp', round((avg_score - prev_avg)::numeric, 1)) ORDER BY avg_score ASC NULLS LAST), '[]')
      FROM (SELECT * FROM lect WHERE attempts >= 10 AND (avg_score < 60 OR 100.0 * abandons / NULLIF(attempts, 0) > 40) ORDER BY avg_score ASC NULLS LAST LIMIT 15) t),
    'top_read', (SELECT coalesce(jsonb_agg(jsonb_build_object('lecture_id', id, 'title', title, 'subject', subject, 'class_number', class_number, 'reads', reads, 'opens', opens, 'avg_score', round(avg_score::numeric, 1)) ORDER BY reads DESC, opens DESC), '[]')
      FROM (SELECT * FROM lect ORDER BY reads DESC, opens DESC LIMIT 10) t),
    'least_read', (SELECT coalesce(jsonb_agg(jsonb_build_object('lecture_id', id, 'title', title, 'subject', subject, 'class_number', class_number, 'reads', reads, 'opens', opens) ORDER BY reads ASC, opens ASC), '[]')
      FROM (SELECT * FROM lect ORDER BY reads ASC, opens ASC LIMIT 10) t),
    'coverage', (SELECT coalesce(jsonb_agg(jsonb_build_object('subject', subject, 'class_number', class_number, 'lectures_total', total, 'lectures_read', readn,
                    'pct', round(100.0 * readn / NULLIF(total, 0), 1)) ORDER BY subject, class_number), '[]')
      FROM (SELECT subject, class_number, count(*) AS total, count(*) FILTER (WHERE reads > 0) AS readn FROM lect GROUP BY subject, class_number) t),
    'subjects_without_lectures', (SELECT coalesce(jsonb_agg(DISTINCT t.subject), '[]') FROM public.teachers t WHERE t.subject IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.lectures l WHERE l.subject = t.subject)),
    'gaps', (SELECT coalesce(jsonb_agg(jsonb_build_object('query', q, 'searches', n, 'zero_results', z) ORDER BY z DESC, n DESC), '[]')
      FROM (SELECT q, count(*) AS n, count(*) FILTER (WHERE coalesce(results, 0) = 0) AS z
              FROM ev WHERE event = 'lecture_search' AND cur AND coalesce(q, '') <> '' GROUP BY 1
            HAVING count(*) FILTER (WHERE coalesce(results, 0) = 0) > 0 ORDER BY z DESC LIMIT 10) t),
    'weekly', (SELECT coalesce(jsonb_agg(jsonb_build_object('week_start', w, 'reads', reads, 'quizzes', quizzes, 'avg_score', avg_score) ORDER BY w), '[]')
      FROM (SELECT date_trunc('week', public.ev_local_day(a.created_at))::date AS w,
                   count(*) FILTER (WHERE a.event = 'lecture_read') AS reads,
                   count(*) FILTER (WHERE a.event = 'quiz_finish') AS quizzes,
                   round(avg(a.value) FILTER (WHERE a.event = 'quiz_finish'), 1) AS avg_score
              FROM public.app_events a
             WHERE a.created_at >= public.local_day_start(date_trunc('week', today)::date - 77)
               AND a.event IN ('lecture_read','quiz_finish')
               AND (p_class IS NULL OR a.class_number = p_class) AND (p_section IS NULL OR a.section_number = p_section)
               AND (p_subject IS NULL OR a.subject = p_subject)
             GROUP BY 1) t),
    'flashcards', (SELECT jsonb_build_object(
        'starts', count(*) FILTER (WHERE event = 'flashcards_start'),
        'finishes', count(*) FILTER (WHERE event = 'flashcards_finish'),
        'share_pct', round(100.0 * count(*) FILTER (WHERE event = 'flashcards_start') / NULLIF(count(*) FILTER (WHERE event IN ('flashcards_start','quiz_start')), 0), 1),
        'quiz_avg_after_cards', (SELECT round(avg(q.value), 1) FROM lv q WHERE q.event = 'quiz_finish' AND q.cur AND q.sk IS NOT NULL
                                   AND EXISTS (SELECT 1 FROM ev f WHERE f.event = 'flashcards_finish' AND f.sk = q.sk AND f.entity_id = q.entity_id AND f.ts < q.ts)),
        'quiz_avg_without_cards', (SELECT round(avg(q.value), 1) FROM lv q WHERE q.event = 'quiz_finish' AND q.cur
                                   AND NOT EXISTS (SELECT 1 FROM ev f WHERE f.event = 'flashcards_finish' AND f.sk = q.sk AND f.entity_id = q.entity_id AND f.ts < q.ts)))
      FROM lv WHERE cur)
  ) INTO j_learn;

  SELECT count(*) INTO n_risk FROM risk;
  SELECT count(*) INTO n_churn FROM firsts WHERE sessions >= 5 AND today - last_d > 60;

  -- ---------- classes ----------
  WITH cs AS (SELECT * FROM cstats),
  prevw AS (
    SELECT cls, sec,
           count(DISTINCT sk) FILTER (WHERE d BETWEEN today - 13 AND today - 7) AS active_prev7,
           avg(value) FILTER (WHERE event = 'quiz_finish' AND d BETWEEN today - 59 AND today - 30) AS avg_prev,
           count(*) FILTER (WHERE event = 'lecture_read' AND d BETWEEN today - 59 AND today - 30) AS reads_prev,
           count(DISTINCT sk) FILTER (WHERE d BETWEEN today - 59 AND today - 30) AS active_prev30
      FROM ev WHERE cls IS NOT NULL AND sec IS NOT NULL GROUP BY cls, sec
  ),
  comp AS (
    SELECT cs.*,
           round(100.0 * cs.active_7d / NULLIF(cs.registered, 0), 1) AS activity_pct,
           round(0.4 * coalesce(100.0 * cs.active_7d / NULLIF(cs.registered, 0), 0)
               + 0.4 * coalesce(cs.avg_score, 0)
               + 0.2 * coalesce(100.0 * cs.lectures_read_per_student / NULLIF(max(cs.lectures_read_per_student) OVER (), 0), 0), 1) AS composite,
           round(0.4 * coalesce(100.0 * p.active_prev7 / NULLIF(cs.registered, 0), 0)
               + 0.4 * coalesce(p.avg_prev, 0)
               + 0.2 * coalesce(100.0 * (p.reads_prev::numeric / NULLIF(p.active_prev30, 0)) / NULLIF(max(p.reads_prev::numeric / NULLIF(p.active_prev30, 0)) OVER (), 0), 0), 1) AS prev_composite
      FROM cs LEFT JOIN prevw p ON p.cls = cs.class_number AND p.sec = cs.section_number
  ),
  ranked AS (
    SELECT comp.*,
           rank() OVER (ORDER BY CASE WHEN k_hidden THEN NULL ELSE composite END DESC NULLS LAST) AS rank,
           rank() OVER (ORDER BY CASE WHEN k_hidden THEN NULL ELSE prev_composite END DESC NULLS LAST) AS prev_rank
      FROM comp
  )
  SELECT jsonb_build_object(
    'matrix', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'class_number', class_number, 'section_number', section_number,
        'students_total', students_total, 'registered', registered, 'k_hidden', k_hidden,
        'active_7d', active_7d, 'active_30d', active_30d, 'active_7d_pct', activity_pct,
        'lectures_read_per_student', lectures_read_per_student, 'quizzes_per_student', quizzes_per_student,
        'avg_score', avg_score, 'trend_7d_pct', trend_7d_pct,
        'composite', CASE WHEN k_hidden THEN NULL ELSE composite END,
        'rank', CASE WHEN k_hidden THEN NULL ELSE rank END,
        'prev_rank', CASE WHEN k_hidden THEN NULL ELSE prev_rank END,
        'rank_delta', CASE WHEN k_hidden THEN NULL ELSE prev_rank - rank END
      ) ORDER BY class_number, section_number), '[]') FROM ranked),
    'by_class', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'class_number', class_number, 'students_total', st, 'registered', reg,
        'active_7d', a7, 'active_30d', a30,
        'active_7d_pct', round(100.0 * a7 / NULLIF(reg, 0), 1),
        'lectures_read_per_student', rps, 'quizzes_per_student', qps,
        'avg_score', avs, 'sections', ns) ORDER BY class_number), '[]')
      FROM (SELECT class_number, sum(students_total) AS st, sum(registered) AS reg, sum(active_7d) AS a7, sum(active_30d) AS a30,
                   round(avg(lectures_read_per_student), 2) AS rps, round(avg(quizzes_per_student), 2) AS qps,
                   round(avg(avg_score), 1) AS avs, count(*) AS ns
              FROM cs GROUP BY class_number) t),
    'at_risk', jsonb_build_object(
        'count', n_risk,
        'churned', n_churn,
        'by_section', (SELECT coalesce(jsonb_agg(jsonb_build_object('class_number', class_number, 'section_number', section_number, 'count', n) ORDER BY n DESC), '[]')
                         FROM (SELECT class_number, section_number, count(*) AS n FROM risk GROUP BY 1, 2) t),
        'items', (SELECT coalesce(jsonb_agg(jsonb_build_object('class_number', class_number, 'section_number', section_number, 'reasons', to_jsonb(reasons), 'score', score, 'inactive_days', inactive_days) ORDER BY score DESC), '[]')
                    FROM (SELECT * FROM risk ORDER BY score DESC LIMIT 200) t))
  ) INTO j_classes;


  -- ---------- class detail (only with class + section) ----------
  IF p_class IS NOT NULL AND p_section IS NOT NULL THEN
    WITH school AS (
      SELECT a.subject, avg(a.value) AS avg_score
        FROM public.app_events a WHERE a.event = 'quiz_finish' AND a.created_at >= b.from_ts AND a.created_at < b.to_ts GROUP BY a.subject
    ), secq AS (
      SELECT subj AS subject, avg(value) AS avg_score, count(*) AS n, count(DISTINCT sk) AS students
        FROM ev WHERE event = 'quiz_finish' AND cur GROUP BY subj
    ), sdays AS (
      SELECT public.ev_local_day(a.created_at) AS d, count(DISTINCT public.ev_student_key(a.user_id, a.meta)) AS dau
        FROM public.app_events a WHERE a.created_at >= public.local_day_start(today - 29) GROUP BY 1
    )
    SELECT jsonb_build_object(
      'kpi', (SELECT to_jsonb(c) FROM cstats c WHERE c.class_number = p_class AND c.section_number = p_section),
      'subjects', (SELECT coalesce(jsonb_agg(jsonb_build_object('subject', s.subject,
                     'avg_score', CASE WHEN secq.students >= public.k_anon_min() THEN round(secq.avg_score::numeric, 1) END,
                     'quiz_finishes', CASE WHEN secq.students >= public.k_anon_min() THEN secq.n END,
                     'school_avg_score', round(s.avg_score::numeric, 1)) ORDER BY s.subject), '[]')
                    FROM school s LEFT JOIN secq ON secq.subject = s.subject),
      'activity', (SELECT coalesce(jsonb_agg(jsonb_build_object('date', ds.d,
                     'section_dau', (SELECT count(*) FROM dsk WHERE dsk.d = ds.d),
                     'school_dau', coalesce(sd.dau, 0)) ORDER BY ds.d), '[]')
                    FROM days30 ds LEFT JOIN sdays sd ON sd.d = ds.d),
      'at_risk_count', n_risk
    ) INTO j_detail;
  END IF;

  -- ---------- teaching ----------
  WITH lstat AS (
    SELECT l.author_id, l.id, l.subject, l.created_at, coalesce(l.updated_at, l.created_at) AS updated_at,
           count(*) FILTER (WHERE e.event = 'lecture_open' AND e.cur) AS opens,
           count(*) FILTER (WHERE e.event = 'lecture_read' AND e.cur) AS reads,
           avg(e.value) FILTER (WHERE e.event = 'quiz_finish' AND e.cur) AS avg_score
      FROM public.lectures l LEFT JOIN ev e ON e.entity_id = l.id AND e.cur
     GROUP BY l.id
  ), teachers AS (
    SELECT ls.author_id,
           (SELECT p.first_name || ' ' || p.last_name FROM public.profiles p WHERE p.id = ls.author_id) AS name,
           mode() WITHIN GROUP (ORDER BY ls.subject) AS subject,
           count(*) AS lectures, sum(opens) AS opens, sum(reads) AS reads,
           round(avg(avg_score)::numeric, 1) AS avg_score,
           (today - public.ev_local_day(max(ls.created_at))) AS days_since_publish,
           max(ls.created_at) AS last_published
      FROM lstat ls GROUP BY ls.author_id
  )
  SELECT jsonb_build_object(
    'kpi', jsonb_build_object(
      'lectures_published', public.kpi_json(
        (SELECT count(*) FROM public.lectures l WHERE l.created_at >= b.from_ts AND l.created_at < b.to_ts),
        (SELECT count(*) FROM public.lectures l WHERE l.created_at >= b.prev_from AND l.created_at < b.prev_to),
        (SELECT jsonb_agg((SELECT count(*) FROM public.lectures l WHERE public.ev_local_day(l.created_at) = ds.d) ORDER BY ds.d) FROM days30 ds)),
      'active_teachers', public.kpi_json(
        (SELECT count(DISTINCT l.author_id) FROM public.lectures l WHERE l.created_at >= b.from_ts AND l.created_at < b.to_ts),
        (SELECT count(DISTINCT l.author_id) FROM public.lectures l WHERE l.created_at >= b.prev_from AND l.created_at < b.prev_to), NULL),
      'lectures_total', (SELECT count(*) FROM public.lectures),
      'teachers_total', (SELECT count(DISTINCT author_id) FROM public.lectures WHERE author_id IS NOT NULL),
      'avg_first_read_lag_h', (SELECT round(avg(first_read_lag_h), 1) FROM public.v_lecture_stats WHERE first_read_lag_h IS NOT NULL),
      'ai_drafts_pending', (SELECT count(*) FROM public.lecture_jobs WHERE status IN ('pending','processing')),
      'photos_pending', (SELECT count(*) FROM public.photos WHERE status = 'pending')
    ),
    'teachers', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'author_id', t.author_id, 'name', coalesce(t.name, 'Nepoznat autor'), 'subject', t.subject,
        'lectures', t.lectures, 'opens', t.opens, 'reads', t.reads, 'avg_score', t.avg_score,
        'days_since_publish', t.days_since_publish, 'last_published', t.last_published,
        'status', (SELECT ts.status FROM public.teacher_statuses ts JOIN public.teachers te ON te.id = ts.teacher_id
                    WHERE ts.date = today AND te.name = t.name LIMIT 1)) ORDER BY t.opens DESC), '[]') FROM teachers t),
    'freshness', (SELECT jsonb_build_object(
        'total', count(*), 'stale', count(*) FILTER (WHERE updated_at < now() - interval '90 days'),
        'stale_pct', round(100.0 * count(*) FILTER (WHERE updated_at < now() - interval '90 days') / NULLIF(count(*), 0), 1),
        'by_subject', (SELECT coalesce(jsonb_agg(jsonb_build_object('subject', subject, 'total', n, 'stale', s, 'stale_pct', round(100.0 * s / NULLIF(n, 0), 1)) ORDER BY subject), '[]')
                         FROM (SELECT subject, count(*) AS n, count(*) FILTER (WHERE updated_at < now() - interval '90 days') AS s FROM lstat GROUP BY subject) x))
      FROM lstat),
    'ai_drafts', (SELECT jsonb_build_object(
        'total', count(*),
        'by_status', (SELECT coalesce(jsonb_agg(jsonb_build_object('status', status, 'count', n) ORDER BY status), '[]') FROM (SELECT status, count(*) AS n FROM public.lecture_jobs GROUP BY status) x),
        'avg_generation_min', round(avg(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60.0) FILTER (WHERE status = 'done' AND lecture_id IS NOT NULL), 1),
        'edited_before_publish_pct', NULL) FROM public.lecture_jobs),
    'moderation', (SELECT jsonb_build_object(
        'pending', count(*) FILTER (WHERE status = 'pending'),
        'oldest_pending_h', round(EXTRACT(EPOCH FROM (now() - min(created_at) FILTER (WHERE status = 'pending'))) / 3600.0, 1),
        'median_h', NULL,
        'rejected_pct', round(100.0 * count(*) FILTER (WHERE status = 'rejected') / NULLIF(count(*) FILTER (WHERE status IN ('approved','rejected')), 0), 1),
        'approved', count(*) FILTER (WHERE status = 'approved'), 'rejected', count(*) FILTER (WHERE status = 'rejected'),
        'moderators', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', coalesce(p.first_name || ' ' || p.last_name, 'Nepoznat'), 'count', n) ORDER BY n DESC), '[]')
                         FROM (SELECT moderator_id, count(*) AS n FROM public.photos WHERE moderator_id IS NOT NULL GROUP BY moderator_id) m
                         LEFT JOIN public.profiles p ON p.id = m.moderator_id))
      FROM public.photos),
    'publish_effect', (SELECT coalesce(jsonb_agg(jsonb_build_object('lecture_id', l.id, 'title', l.title, 'subject', l.subject, 'class_number', l.class_number, 'created_at', l.created_at,
        'opens_24h', (SELECT count(DISTINCT public.ev_student_key(a.user_id, a.meta)) FROM public.app_events a WHERE a.entity_id = l.id AND a.event = 'lecture_open' AND a.created_at < l.created_at + interval '24 hours'),
        'opens_72h', (SELECT count(DISTINCT public.ev_student_key(a.user_id, a.meta)) FROM public.app_events a WHERE a.entity_id = l.id AND a.event = 'lecture_open' AND a.created_at < l.created_at + interval '72 hours')
      ) ORDER BY l.created_at DESC), '[]')
      FROM (SELECT * FROM public.lectures WHERE created_at >= now() - interval '90 days' ORDER BY created_at DESC LIMIT 10) l)
  ) INTO j_teach;

  -- ---------- community ----------
  WITH cser AS (
    SELECT jsonb_agg(x.reach ORDER BY x.d) AS reach, jsonb_agg(x.likes ORDER BY x.d) AS likes,
           jsonb_agg(x.evv ORDER BY x.d) AS evv, jsonb_agg(x.up ORDER BY x.d) AS up,
           jsonb_agg(x.game ORDER BY x.d) AS game, jsonb_agg(x.sh ORDER BY x.d) AS sh
      FROM (SELECT ds.d,
              round(100.0 * da.news_viewers / NULLIF(da.dau, 0), 1) AS reach,
              da.likes, da.event_views AS evv, da.uploads AS up, da.games AS game, da.shares AS sh
            FROM days30 ds JOIN daily da ON da.d = ds.d) x
  ), agg AS (
    SELECT
      round(100.0 * count(DISTINCT sk) FILTER (WHERE event = 'news_view' AND cur) / NULLIF(count(DISTINCT sk) FILTER (WHERE cur), 0), 1) AS reach,
      round(100.0 * count(DISTINCT sk) FILTER (WHERE event = 'news_view' AND prev) / NULLIF(count(DISTINCT sk) FILTER (WHERE prev), 0), 1) AS reach_p,
      count(*) FILTER (WHERE event IN ('news_like','photo_like') AND cur) AS likes,
      count(*) FILTER (WHERE event IN ('news_like','photo_like') AND prev) AS likes_p,
      count(*) FILTER (WHERE event = 'event_view' AND cur) AS evv,
      count(*) FILTER (WHERE event = 'event_view' AND prev) AS evv_p,
      count(*) FILTER (WHERE event = 'photo_upload' AND cur) AS up,
      count(*) FILTER (WHERE event = 'photo_upload' AND prev) AS up_p,
      count(DISTINCT session_id) FILTER (WHERE event = 'game_start' AND cur) AS game,
      count(DISTINCT session_id) FILTER (WHERE event = 'game_start' AND prev) AS game_p,
      count(*) FILTER (WHERE event = 'share' AND cur) AS sh,
      count(*) FILTER (WHERE event = 'share' AND prev) AS sh_p
    FROM ev
  ), players AS (SELECT DISTINCT sk FROM ev WHERE event = 'game_start' AND cur AND sk IS NOT NULL),
  readers AS (SELECT DISTINCT sk FROM ev WHERE event = 'lecture_read' AND cur AND sk IS NOT NULL),
  actives AS (SELECT DISTINCT sk FROM ev WHERE cur AND sk IS NOT NULL)
  SELECT jsonb_build_object(
    'kpi', (SELECT jsonb_build_object(
      'news_reach_pct', public.kpi_json(reach, reach_p, (SELECT reach FROM cser)),
      'likes', public.kpi_json(likes, likes_p, (SELECT likes FROM cser)),
      'event_views', public.kpi_json(evv, evv_p, (SELECT evv FROM cser)),
      'gallery_uploads', public.kpi_json(up, up_p, (SELECT up FROM cser)),
      'game_sessions', public.kpi_json(game, game_p, (SELECT game FROM cser)),
      'shares', public.kpi_json(sh, sh_p, (SELECT sh FROM cser))) FROM agg),
    'news', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', n.id, 'title', n.title, 'created_at', n.created_at,
        'views', s.views, 'viewers', s.viewers,
        'reach_pct', round(100.0 * s.viewers / NULLIF((SELECT count(*) FROM actives), 0), 1),
        'likes', s.likes, 'peak_day', s.peak_day,
        'days_to_peak', (s.peak_day - s.first_day)) ORDER BY s.views DESC NULLS LAST), '[]')
      FROM public.news n
      LEFT JOIN LATERAL (
        SELECT count(*) FILTER (WHERE event = 'news_view') AS views,
               count(DISTINCT sk) FILTER (WHERE event = 'news_view') AS viewers,
               count(*) FILTER (WHERE event = 'news_like') AS likes,
               min(d) FILTER (WHERE event = 'news_view') AS first_day,
               (SELECT d FROM ev x WHERE x.entity_id = n.id AND x.event = 'news_view' AND x.cur GROUP BY d ORDER BY count(*) DESC, d LIMIT 1) AS peak_day
          FROM ev WHERE entity_id = n.id AND cur) s ON true),
    'best_hours', (SELECT jsonb_agg(coalesce(c.n, 0) ORDER BY h) FROM generate_series(0, 23) h
                     LEFT JOIN (SELECT hr, count(*) AS n FROM ev WHERE event = 'news_view' AND cur GROUP BY hr) c ON c.hr = h),
    'events', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', e.id, 'title', e.title, 'event_date', e.event_date, 'event_type', e.event_type,
        'views', (SELECT count(*) FROM ev WHERE entity_id = e.id AND event = 'event_view' AND cur),
        'by_day', (SELECT coalesce(jsonb_agg(jsonb_build_object('date', d, 'views', n) ORDER BY d), '[]')
                     FROM (SELECT d, count(*) AS n FROM ev WHERE entity_id = e.id AND event = 'event_view' AND cur GROUP BY d) x)
      ) ORDER BY e.event_date DESC), '[]')
      FROM (SELECT * FROM public.events ORDER BY event_date DESC LIMIT 12) e),
    'gallery', jsonb_build_object(
      'weekly', (SELECT coalesce(jsonb_agg(jsonb_build_object('week_start', w, 'uploads', n, 'approved', a, 'rejected', r, 'pending', p) ORDER BY w), '[]')
                   FROM (SELECT date_trunc('week', public.ev_local_day(created_at))::date AS w, count(*) AS n,
                                count(*) FILTER (WHERE status = 'approved') AS a, count(*) FILTER (WHERE status = 'rejected') AS r,
                                count(*) FILTER (WHERE status = 'pending') AS p
                           FROM public.photos WHERE created_at >= public.local_day_start(date_trunc('week', today)::date - 49) GROUP BY 1) x),
      'top_classes', (SELECT coalesce(jsonb_agg(jsonb_build_object('class_number', cls, 'section_number', sec, 'uploads', n) ORDER BY n DESC), '[]')
                        FROM (SELECT e.cls, e.sec, count(*) AS n FROM ev e
                                JOIN cstats c ON c.class_number = e.cls AND c.section_number = e.sec AND NOT c.k_hidden
                               WHERE e.event = 'photo_upload' AND e.cur GROUP BY e.cls, e.sec ORDER BY n DESC LIMIT 5) x)),
    'game', jsonb_build_object(
      'sessions', (SELECT game FROM agg), 'players', (SELECT count(*) FROM players),
      'avg_score', (SELECT round(avg(value), 1) FROM ev WHERE event = 'game_over' AND cur),
      'median_duration_s', (SELECT round((percentile_cont(0.5) WITHIN GROUP (ORDER BY dur))::numeric)
                              FROM (SELECT EXTRACT(EPOCH FROM (o.ts - s.ts)) AS dur FROM ev s JOIN ev o ON o.session_id = s.session_id AND o.event = 'game_over' AND o.ts > s.ts AND o.ts < s.ts + interval '30 minutes'
                                     WHERE s.event = 'game_start' AND s.cur) x),
      'readers_among_players_pct', round(100.0 * (SELECT count(*) FROM players p JOIN readers r USING (sk)) / NULLIF((SELECT count(*) FROM players), 0), 1),
      'readers_among_nonplayers_pct', round(100.0 * (SELECT count(*) FROM actives a JOIN readers r USING (sk) WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.sk = a.sk))
                                            / NULLIF((SELECT count(*) FROM actives a WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.sk = a.sk)), 0), 1)),
    'push', (SELECT jsonb_build_object(
      'received', count(*) FILTER (WHERE event = 'push_received'), 'opened', count(*) FILTER (WHERE event = 'push_opened'),
      'open_rate', round(100.0 * count(*) FILTER (WHERE event = 'push_opened') / NULLIF(count(*) FILTER (WHERE event = 'push_received'), 0), 1),
      'by_type', (SELECT coalesce(jsonb_agg(jsonb_build_object('type', t, 'received', r, 'opened', o)), '[]')
                    FROM (SELECT coalesce(mtype, 'other') AS t, count(*) FILTER (WHERE event = 'push_received') AS r, count(*) FILTER (WHERE event = 'push_opened') AS o
                            FROM ev WHERE event IN ('push_received','push_opened') AND cur GROUP BY 1) x)) FROM ev WHERE cur),
    'ednevnik', (SELECT jsonb_build_object(
      'connected', count(DISTINCT sk) FILTER (WHERE event IN ('ednevnik_connect','ednevnik_sync')),
      'connected_pct', round(100.0 * count(DISTINCT sk) FILTER (WHERE event IN ('ednevnik_connect','ednevnik_sync')) / NULLIF((SELECT count(*) FROM actives), 0), 1),
      'syncs_per_day', round(count(*) FILTER (WHERE event = 'ednevnik_sync' AND cur)::numeric / b.days, 2),
      'sync_errors', count(*) FILTER (WHERE event = 'ednevnik_sync' AND cur AND merr)) FROM ev)
  ) INTO j_comm;

  -- ---------- signals (spec §5.1 rules, computed on the fly) ----------
  WITH secw AS (
    SELECT cls, sec,
           count(DISTINCT session_id) FILTER (WHERE event = 'session_start' AND d >= today - 6) AS s7,
           count(DISTINCT session_id) FILTER (WHERE event = 'session_start' AND d BETWEEN today - 13 AND today - 7) AS s7p,
           count(DISTINCT sk) AS registered
      FROM ev WHERE cls IS NOT NULL AND sec IS NOT NULL GROUP BY cls, sec
  ), sig AS (
    SELECT CASE WHEN public.pct_delta(s7, s7p) <= -50 THEN 'critical' ELSE 'warn' END AS severity, 'section_drop' AS kind,
           format('Odjeljenje %s-%s: aktivnost %s%% ove sedmice', cls, sec, public.pct_delta(s7, s7p)) AS msg,
           format('/direktor/razredi/%s-%s', cls, sec) AS link, public.pct_delta(s7, s7p) AS value
      FROM secw WHERE registered >= public.k_anon_min() AND s7p >= 10 AND public.pct_delta(s7, s7p) <= -30
    UNION ALL
    SELECT 'critical', 'section_silent', format('Odjeljenje %s-%s: bez aktivnosti 7 dana', cls, sec), format('/direktor/razredi/%s-%s', cls, sec), 0
      FROM secw WHERE registered >= public.k_anon_min() AND s7 = 0
    UNION ALL
    SELECT 'warn', 'subject_low', format('%s: prosjek kviza %s%%', subj, round(avg(value))), '/direktor/ucenje/' || subj, round(avg(value))
      FROM ev WHERE event = 'quiz_finish' AND cur AND subj IS NOT NULL GROUP BY subj HAVING count(*) >= 20 AND avg(value) < 50
    UNION ALL
    SELECT 'warn', 'lecture_abandon', format('„%s“: %s%% napuštenih kvizova', l.title, round(100.0 * count(*) FILTER (WHERE e.event = 'quiz_abandon') / NULLIF(count(*) FILTER (WHERE e.event = 'quiz_start'), 0))),
           '/direktor/ucenje/' || l.subject, round(100.0 * count(*) FILTER (WHERE e.event = 'quiz_abandon') / NULLIF(count(*) FILTER (WHERE e.event = 'quiz_start'), 0))
      FROM ev e JOIN public.lectures l ON l.id = e.entity_id
     WHERE e.event IN ('quiz_start','quiz_abandon') AND e.cur GROUP BY l.id
    HAVING count(*) FILTER (WHERE e.event = 'quiz_start') >= 10
       AND 100.0 * count(*) FILTER (WHERE e.event = 'quiz_abandon') / count(*) FILTER (WHERE e.event = 'quiz_start') > 50
    UNION ALL
    SELECT 'warn', 'moderation',
           format('%s fotografija čeka moderaciju %s+ dana', count(*), floor(EXTRACT(EPOCH FROM (now() - min(created_at))) / 86400)::int),
           '/direktor/nastava', count(*)
      FROM public.photos WHERE status = 'pending'
    HAVING count(*) > 10 OR min(created_at) < now() - interval '72 hours'
    UNION ALL
    SELECT CASE WHEN n_risk >= 5 THEN 'warn' ELSE 'info' END, 'at_risk', format('%s učenika u riziku', n_risk), '/direktor/razredi', n_risk
     WHERE n_risk > 0
    UNION ALL
    SELECT 'critical', 'ai_problem', 'AI analiza: verdikt „problem“', '/direktor/ai', NULL
     WHERE latest_ai.output->>'health_verdict' = 'problem'
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object('severity', severity, 'kind', kind, 'text', msg, 'link', link, 'value', value)
           ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'warn' THEN 1 ELSE 2 END, msg), '[]')
    INTO j_signals FROM sig;

  RETURN jsonb_build_object(
    'meta', j_meta, 'health', j_health, 'kpi', j_kpi, 'retention', j_ret, 'activity', j_act,
    'heatmap', j_heat, 'signals', j_signals, 'devices', j_dev, 'ai', j_ai,
    'learning', j_learn, 'classes', j_classes, 'class_detail', j_detail,
    'teaching', j_teach, 'community', j_comm
  );
END $fn$;

REVOKE ALL ON FUNCTION public.direktor_stats(TEXT, INT, INT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.direktor_stats(TEXT, INT, INT, TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION public.direktor_stats(TEXT, INT, INT, TEXT) IS
  'All Direktor panel blocks as one JSON. Roles: direktor/admin/creator/pedagog (or service key). Shape: src/lib/direktor-types.ts DirektorStats.';
