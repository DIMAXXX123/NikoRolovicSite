-- ============================================================
-- Direktor panel, phase B.1: analytics helpers + views (spec §2.1, §2.4)
-- ============================================================
-- Every view below is a plain (security_invoker = false) view owned by
-- postgres, so it can read app_events regardless of the caller's RLS. Access
-- is gated INSIDE each view by analytics_access(): a non-staff caller gets
-- zero rows, never an error. Group aggregates are nulled when the group has
-- fewer than K_ANON (5) distinct students - spec §2.4.
--
-- Student key: real users are keyed by user_id, seeded pupils without a
-- profile by meta.sid (verified_students.id). Guests (no key) count in
-- sessions but never in student counts. Days and hours are Europe/Podgorica.

-- ---------- helpers ----------
CREATE OR REPLACE FUNCTION public.analytics_access()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(auth.role() = 'service_role', false) OR public.is_school_staff();
$$;
REVOKE ALL ON FUNCTION public.analytics_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_access() TO authenticated, anon, service_role;

-- The caller's profiles.role, or 'service_role' for the service key.
CREATE OR REPLACE FUNCTION public.caller_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE WHEN auth.role() = 'service_role' THEN 'service_role'
              ELSE (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) END;
$$;
REVOKE ALL ON FUNCTION public.caller_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.caller_role() TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.ev_local_day(ts TIMESTAMPTZ)
RETURNS DATE LANGUAGE sql STABLE AS $$
  SELECT (ts AT TIME ZONE 'Europe/Podgorica')::date;
$$;

CREATE OR REPLACE FUNCTION public.local_day_start(d DATE)
RETURNS TIMESTAMPTZ LANGUAGE sql STABLE AS $$
  SELECT (d::timestamp AT TIME ZONE 'Europe/Podgorica');
$$;

CREATE OR REPLACE FUNCTION public.ev_student_key(p_user UUID, p_meta JSONB)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(p_user::text, p_meta->>'sid');
$$;

-- k-anonymity threshold (spec §2.4)
CREATE OR REPLACE FUNCTION public.k_anon_min()
RETURNS INT LANGUAGE sql IMMUTABLE AS $$ SELECT 5; $$;

-- Percent change, null when there is no baseline.
CREATE OR REPLACE FUNCTION public.pct_delta(cur NUMERIC, prev NUMERIC)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN prev IS NULL OR prev = 0 OR cur IS NULL THEN NULL
              ELSE round((cur - prev) / prev * 100, 1) END;
$$;

-- Period -> [from, to) plus the equally long preceding window, local days.
-- 'today' | '7d' | '30d' | 'semester' (182 days).
CREATE OR REPLACE FUNCTION public.direktor_period_bounds(p_period TEXT)
RETURNS TABLE(from_ts TIMESTAMPTZ, to_ts TIMESTAMPTZ, prev_from TIMESTAMPTZ, prev_to TIMESTAMPTZ,
              from_day DATE, to_day DATE, days INT)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  today DATE := public.ev_local_day(now());
  n INT;
BEGIN
  n := CASE p_period WHEN 'today' THEN 1 WHEN '7d' THEN 7 WHEN '30d' THEN 30 WHEN 'semester' THEN 182 END;
  IF n IS NULL THEN
    RAISE EXCEPTION 'unknown period %', p_period USING ERRCODE = '22023';
  END IF;
  from_day  := today - (n - 1);
  to_day    := today;
  from_ts   := public.local_day_start(from_day);
  to_ts     := public.local_day_start(today + 1);
  prev_from := public.local_day_start(from_day - n);
  prev_to   := from_ts;
  days      := n;
  RETURN NEXT;
END $$;

-- ---------- v_daily_activity ----------
CREATE OR REPLACE VIEW public.v_daily_activity AS
WITH e AS (
  SELECT public.ev_local_day(created_at) AS d,
         public.ev_student_key(user_id, meta) AS sk,
         event, session_id, value
    FROM public.app_events
), firsts AS (
  SELECT sk, min(d) AS fd FROM e WHERE sk IS NOT NULL GROUP BY sk
)
SELECT e.d AS date,
       count(DISTINCT e.sk) AS dau,
       count(DISTINCT e.session_id) FILTER (WHERE e.event = 'session_start') AS sessions,
       round(avg(e.value) FILTER (WHERE e.event = 'session_end'))::int AS avg_session_s,
       (SELECT count(*) FROM firsts f WHERE f.fd = e.d) AS new_users,
       count(*) FILTER (WHERE e.event = 'installed') AS installs
  FROM e
 WHERE public.analytics_access()
 GROUP BY e.d;

-- ---------- v_retention ----------
-- Cohort = ISO week of the student's first session. d1 = active the next day,
-- d7 = active on any of days 7-13, d30 = days 30-36. Null until the cohort is old enough.
CREATE OR REPLACE VIEW public.v_retention AS
WITH s AS (
  SELECT DISTINCT public.ev_student_key(user_id, meta) AS sk,
         public.ev_local_day(created_at) AS d
    FROM public.app_events
   WHERE event = 'session_start' AND (user_id IS NOT NULL OR meta ? 'sid')
), firsts AS (
  SELECT sk, min(d) AS fd FROM s GROUP BY sk
), j AS (
  SELECT f.sk, date_trunc('week', f.fd)::date AS cw, (s.d - f.fd) AS age
    FROM firsts f JOIN s USING (sk)
)
SELECT cw AS cohort_week,
       count(DISTINCT sk) AS size,
       round(100.0 * count(DISTINCT sk) FILTER (WHERE age = 1) / count(DISTINCT sk), 1) AS d1,
       CASE WHEN cw + 20 <= public.ev_local_day(now())
            THEN round(100.0 * count(DISTINCT sk) FILTER (WHERE age BETWEEN 7 AND 13) / count(DISTINCT sk), 1) END AS d7,
       CASE WHEN cw + 43 <= public.ev_local_day(now())
            THEN round(100.0 * count(DISTINCT sk) FILTER (WHERE age BETWEEN 30 AND 36) / count(DISTINCT sk), 1) END AS d30
  FROM j
 WHERE public.analytics_access()
 GROUP BY cw;

-- ---------- v_subject_stats ----------
CREATE OR REPLACE VIEW public.v_subject_stats AS
WITH p AS (
  SELECT x.period, b.* FROM (VALUES ('today'),('7d'),('30d'),('semester')) AS x(period)
  CROSS JOIN LATERAL public.direktor_period_bounds(x.period) b
), e AS (
  SELECT p.period, ev.subject, ev.class_number, ev.event, ev.value,
         public.ev_student_key(ev.user_id, ev.meta) AS sk
    FROM p JOIN public.app_events ev
      ON ev.created_at >= p.from_ts AND ev.created_at < p.to_ts
   WHERE ev.subject IS NOT NULL
), g AS (
  SELECT period, subject, class_number,
         count(DISTINCT sk) AS students,
         count(*) FILTER (WHERE event = 'lecture_open') AS opens,
         count(*) FILTER (WHERE event = 'lecture_read') AS reads,
         count(*) FILTER (WHERE event = 'quiz_start') AS quiz_starts,
         count(*) FILTER (WHERE event = 'quiz_finish') AS quiz_finishes,
         count(*) FILTER (WHERE event = 'quiz_abandon') AS quiz_abandons,
         avg(value) FILTER (WHERE event = 'quiz_finish') AS avg_score,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY value) FILTER (WHERE event = 'quiz_finish') AS median_score,
         percentile_cont(0.25) WITHIN GROUP (ORDER BY value) FILTER (WHERE event = 'quiz_finish') AS p25_score,
         avg(value) FILTER (WHERE event = 'lecture_time') AS avg_time_s
    FROM e GROUP BY period, subject, class_number
)
SELECT g.period, g.subject, g.class_number,
       (SELECT count(*) FROM public.lectures l WHERE l.subject = g.subject AND l.class_number = g.class_number) AS lectures_total,
       CASE WHEN students >= public.k_anon_min() THEN opens END AS opens,
       CASE WHEN students >= public.k_anon_min() THEN reads END AS reads,
       CASE WHEN students >= public.k_anon_min() THEN quiz_starts END AS quiz_starts,
       CASE WHEN students >= public.k_anon_min() THEN quiz_finishes END AS quiz_finishes,
       CASE WHEN students >= public.k_anon_min() THEN round(avg_score::numeric, 1) END AS avg_score,
       CASE WHEN students >= public.k_anon_min() THEN round(median_score::numeric, 1) END AS median_score,
       CASE WHEN students >= public.k_anon_min() THEN round(p25_score::numeric, 1) END AS p25_score,
       CASE WHEN students >= public.k_anon_min() THEN round(100.0 * quiz_abandons / NULLIF(quiz_starts, 0), 1) END AS abandon_rate,
       CASE WHEN students >= public.k_anon_min() THEN round(avg_time_s::numeric) END AS avg_time_s,
       students,
       (students < public.k_anon_min()) AS k_hidden
  FROM g
 WHERE public.analytics_access();

-- ---------- v_lecture_stats (all time) ----------
CREATE OR REPLACE VIEW public.v_lecture_stats AS
WITH e AS (
  SELECT entity_id, event, value, created_at
    FROM public.app_events
   WHERE entity_id IS NOT NULL
     AND event IN ('lecture_open','lecture_read','lecture_time','quiz_start','quiz_finish','quiz_abandon')
), g AS (
  SELECT entity_id,
         count(*) FILTER (WHERE event = 'lecture_open') AS opens,
         count(*) FILTER (WHERE event = 'lecture_read') AS reads,
         count(*) FILTER (WHERE event = 'quiz_start') AS quiz_starts,
         count(*) FILTER (WHERE event = 'quiz_finish') AS quiz_finishes,
         count(*) FILTER (WHERE event = 'quiz_abandon') AS quiz_abandons,
         avg(value) FILTER (WHERE event = 'quiz_finish') AS avg_score,
         avg(value) FILTER (WHERE event = 'lecture_time') AS avg_time_s,
         min(created_at) FILTER (WHERE event = 'lecture_read') AS first_read,
         max(created_at) AS last_activity
    FROM e GROUP BY entity_id
)
SELECT l.id AS lecture_id, l.title, l.subject, l.class_number, l.author_id,
       coalesce(g.opens, 0) AS opens,
       coalesce(g.reads, 0) AS reads,
       coalesce(g.quiz_finishes, 0) AS quiz_finishes,
       round(g.avg_score::numeric, 1) AS avg_score,
       round(100.0 * g.quiz_abandons / NULLIF(g.quiz_starts, 0), 1) AS abandon_rate,
       round(g.avg_time_s::numeric) AS avg_time_s,
       round(EXTRACT(EPOCH FROM (g.first_read - l.created_at)) / 3600.0, 1) AS first_read_lag_h,
       g.last_activity
  FROM public.lectures l LEFT JOIN g ON g.entity_id = l.id
 WHERE public.analytics_access();

-- ---------- v_class_stats ----------
-- Fixed windows as the column names say (7d / 30d, trend = sessions last 7 days
-- vs the 7 before). registered = distinct student keys ever seen for the group.
CREATE OR REPLACE VIEW public.v_class_stats AS
WITH today AS (SELECT public.ev_local_day(now()) AS d),
vs AS (
  SELECT class_number, section_number, count(*) AS students_total
    FROM public.verified_students GROUP BY 1, 2
), e AS (
  SELECT class_number, section_number, event, value, session_id,
         public.ev_student_key(user_id, meta) AS sk,
         public.ev_local_day(created_at) AS d
    FROM public.app_events
   WHERE class_number IS NOT NULL AND section_number IS NOT NULL
), g AS (
  SELECT e.class_number, e.section_number,
         count(DISTINCT sk) AS registered,
         count(DISTINCT sk) FILTER (WHERE e.d >= t.d - 6) AS active_7d,
         count(DISTINCT sk) FILTER (WHERE e.d >= t.d - 29) AS active_30d,
         count(*) FILTER (WHERE event = 'lecture_read' AND e.d >= t.d - 29) AS reads_30d,
         count(*) FILTER (WHERE event = 'quiz_finish' AND e.d >= t.d - 29) AS quizzes_30d,
         avg(value) FILTER (WHERE event = 'quiz_finish' AND e.d >= t.d - 29) AS avg_score,
         count(DISTINCT session_id) FILTER (WHERE event = 'session_start' AND e.d >= t.d - 6) AS sess_7,
         count(DISTINCT session_id) FILTER (WHERE event = 'session_start' AND e.d >= t.d - 13 AND e.d < t.d - 6) AS sess_prev7
    FROM e CROSS JOIN today t
   GROUP BY e.class_number, e.section_number
)
SELECT vs.class_number, vs.section_number,
       vs.students_total,
       coalesce(g.registered, 0) AS registered,
       CASE WHEN g.registered >= public.k_anon_min() THEN g.active_7d END AS active_7d,
       CASE WHEN g.registered >= public.k_anon_min() THEN g.active_30d END AS active_30d,
       CASE WHEN g.registered >= public.k_anon_min() THEN round(g.reads_30d::numeric / NULLIF(g.active_30d, 0), 2) END AS lectures_read_per_student,
       CASE WHEN g.registered >= public.k_anon_min() THEN round(g.quizzes_30d::numeric / NULLIF(g.active_30d, 0), 2) END AS quizzes_per_student,
       CASE WHEN g.registered >= public.k_anon_min() THEN round(g.avg_score::numeric, 1) END AS avg_score,
       CASE WHEN g.registered >= public.k_anon_min() THEN public.pct_delta(g.sess_7, g.sess_prev7) END AS trend_7d_pct,
       (coalesce(g.registered, 0) < public.k_anon_min()) AS k_hidden
  FROM vs LEFT JOIN g USING (class_number, section_number)
 WHERE public.analytics_access();

-- ---------- v_teacher_stats (all time) ----------
CREATE OR REPLACE VIEW public.v_teacher_stats AS
SELECT l.author_id,
       count(*) AS lectures,
       sum(ls.opens) AS opens,
       sum(ls.reads) AS reads,
       round(avg(ls.avg_score), 1) AS avg_score,
       round(avg(ls.first_read_lag_h), 1) AS avg_first_read_lag_h,
       max(l.created_at) AS last_published
  FROM public.lectures l
  JOIN public.v_lecture_stats ls ON ls.lecture_id = l.id
 WHERE public.analytics_access()
 GROUP BY l.author_id;

-- ---------- v_content_gaps ----------
CREATE OR REPLACE VIEW public.v_content_gaps AS
SELECT lower(trim(meta->>'q')) AS query,
       count(*) AS searches,
       count(*) FILTER (WHERE coalesce((meta->>'results')::int, 0) = 0) AS zero_results,
       max(created_at) AS last_searched
  FROM public.app_events
 WHERE event = 'lecture_search' AND coalesce(trim(meta->>'q'), '') <> ''
   AND public.analytics_access()
 GROUP BY 1
HAVING count(*) FILTER (WHERE coalesce((meta->>'results')::int, 0) = 0) > 0;

-- ---------- v_community_stats ----------
CREATE OR REPLACE VIEW public.v_community_stats AS
WITH p AS (
  SELECT x.period, b.* FROM (VALUES ('today'),('7d'),('30d'),('semester')) AS x(period)
  CROSS JOIN LATERAL public.direktor_period_bounds(x.period) b
), e AS (
  SELECT p.period, p.from_ts, p.to_ts, ev.event, ev.session_id,
         public.ev_student_key(ev.user_id, ev.meta) AS sk
    FROM p JOIN public.app_events ev ON ev.created_at >= p.from_ts AND ev.created_at < p.to_ts
)
SELECT period,
       count(*) FILTER (WHERE event = 'news_view') AS news_views,
       round(100.0 * count(DISTINCT sk) FILTER (WHERE event = 'news_view') / NULLIF(count(DISTINCT sk), 0), 1) AS news_reach_pct,
       count(*) FILTER (WHERE event IN ('news_like','photo_like')) AS likes,
       count(*) FILTER (WHERE event = 'event_view') AS events_views,
       (SELECT count(*) FROM public.photos ph WHERE ph.status = 'pending') AS photos_pending,
       (SELECT count(*) FROM public.photos ph WHERE ph.status = 'approved' AND ph.created_at >= e.from_ts AND ph.created_at < e.to_ts) AS photos_approved,
       NULL::numeric AS moderation_median_h,  -- photos has no moderated_at column
       count(DISTINCT session_id) FILTER (WHERE event = 'game_start') AS game_sessions,
       count(*) FILTER (WHERE event = 'share') AS shares,
       round(100.0 * count(*) FILTER (WHERE event = 'push_opened') / NULLIF(count(*) FILTER (WHERE event = 'push_received'), 0), 1) AS push_open_rate
  FROM e
 WHERE public.analytics_access()
 GROUP BY period, from_ts, to_ts;

-- ---------- v_hour_heatmap (last 30 days, local time; weekday 0 = Monday) ----------
CREATE OR REPLACE VIEW public.v_hour_heatmap AS
SELECT (EXTRACT(ISODOW FROM (created_at AT TIME ZONE 'Europe/Podgorica'))::int - 1) AS weekday,
       EXTRACT(HOUR FROM (created_at AT TIME ZONE 'Europe/Podgorica'))::int AS hour,
       count(*) AS events
  FROM public.app_events
 WHERE created_at >= public.local_day_start(public.ev_local_day(now()) - 29)
   AND public.analytics_access()
 GROUP BY 1, 2;

-- ---------- v_at_risk_students ----------
-- Flags only (spec §2.1 rules), never a ranking. Identifiers stay in this view;
-- direktor_stats() exposes only class/section/reasons/score, names come solely
-- through direktor_students() for authorised roles.
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
         (t.d - per.last_d) AS inactive_days,
         (per.sessions >= 5 AND t.d - per.last_d >= 14) AS r_inactive,
         (per.n30 >= 2 AND per.n60 >= 2 AND per.s60 - per.s30 >= 20) AS r_drop,
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

-- ---------- v_school_health (last 90 days) ----------
-- score = 30% coverage + 25% WAU + 20% avg quiz score + 15% completion funnel
--         + 10% content freshness, each component 0-100.
--   coverage  = students seen at least once up to that day / verified_students
--   wau       = students active in the trailing 7 days / students seen so far
--   avg_score = mean quiz_finish score in the trailing 7 days
--   funnel    = quiz_finish / lecture_open in the trailing 7 days (capped 100)
--   freshness = share of lectures updated within the trailing 90 days
CREATE OR REPLACE VIEW public.v_school_health AS
WITH today AS (SELECT public.ev_local_day(now()) AS d),
days AS (SELECT (t.d - g)::date AS d FROM today t, generate_series(0, 89) g),
e AS (
  SELECT public.ev_student_key(user_id, meta) AS sk, event, value, public.ev_local_day(created_at) AS d
    FROM public.app_events
   WHERE created_at >= public.local_day_start(public.ev_local_day(now()) - 96)
), dsk AS (SELECT DISTINCT sk, d FROM e WHERE sk IS NOT NULL),
firsts AS (
  SELECT public.ev_student_key(user_id, meta) AS sk, min(public.ev_local_day(created_at)) AS fd
    FROM public.app_events WHERE user_id IS NOT NULL OR meta ? 'sid' GROUP BY 1
), total AS (SELECT count(*) AS n FROM public.verified_students),
lect AS (SELECT count(*) AS n FROM public.lectures),
c AS (
  SELECT days.d,
         (SELECT count(*) FROM firsts f WHERE f.fd <= days.d) AS seen,
         (SELECT count(DISTINCT sk) FROM dsk WHERE dsk.d BETWEEN days.d - 6 AND days.d) AS wau,
         (SELECT avg(value) FROM e WHERE e.event = 'quiz_finish' AND e.d BETWEEN days.d - 6 AND days.d) AS avg_score,
         (SELECT 100.0 * count(*) FILTER (WHERE event = 'quiz_finish') / NULLIF(count(*) FILTER (WHERE event = 'lecture_open'), 0)
            FROM e WHERE e.d BETWEEN days.d - 6 AND days.d) AS funnel,
         (SELECT 100.0 * count(*) / NULLIF((SELECT n FROM lect), 0) FROM public.lectures l
           WHERE public.ev_local_day(coalesce(l.updated_at, l.created_at)) >= days.d - 89) AS freshness
    FROM days
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

-- ---------- grants ----------
GRANT SELECT ON public.v_daily_activity, public.v_retention, public.v_subject_stats,
                public.v_lecture_stats, public.v_class_stats, public.v_teacher_stats,
                public.v_content_gaps, public.v_community_stats, public.v_hour_heatmap,
                public.v_at_risk_students, public.v_school_health
  TO authenticated, service_role;
REVOKE ALL ON public.v_daily_activity, public.v_retention, public.v_subject_stats,
               public.v_lecture_stats, public.v_class_stats, public.v_teacher_stats,
               public.v_content_gaps, public.v_community_stats, public.v_hour_heatmap,
               public.v_at_risk_students, public.v_school_health
  FROM anon;

COMMENT ON VIEW public.v_at_risk_students IS
  'Early-warning flags per student key (user_id or seeded meta.sid). Not a ranking. Rules: inactive >=14 days after >=5 sessions (40), quiz avg drop >=20 pp 30d vs previous 30d (35), last 3 quizzes abandoned (25).';
COMMENT ON VIEW public.v_school_health IS
  'Composite 0-100 per day: 30% coverage, 25% WAU, 20% avg quiz score, 15% completion funnel, 10% content freshness.';
