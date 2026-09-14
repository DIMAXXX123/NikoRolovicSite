-- ============================================================
-- Direktor panel, phase B.3: direktor_students(), nastavnik_stats(),
-- build_analysis_snapshot() + jsonb helpers
-- ============================================================
COMMENT ON VIEW public.v_at_risk_students IS
  'Early-warning flags per student key (user_id or seeded meta.sid). Not a ranking. Rules: inactive 14-60 days after >=5 sessions (40; >60 days = churned, reported separately), quiz avg drop >=20 pp 30d vs previous 30d with >=3 quizzes in each window (35), last 3 quizzes abandoned (25).';

-- ============================================================
-- helpers for the functions below
-- ============================================================
-- text -> jsonb, NULL instead of an error on malformed input
CREATE OR REPLACE FUNCTION public.safe_jsonb(t TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN t::jsonb;
EXCEPTION WHEN others THEN
  RETURN NULL;
END $$;

-- Recursively removes every key named k from a jsonb document.
CREATE OR REPLACE FUNCTION public.jsonb_strip_key(j JSONB, k TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN CASE jsonb_typeof(j)
    WHEN 'object' THEN coalesce((SELECT jsonb_object_agg(key, public.jsonb_strip_key(value, k)) FROM jsonb_each(j) WHERE key <> k), '{}'::jsonb)
    WHEN 'array'  THEN coalesce((SELECT jsonb_agg(public.jsonb_strip_key(e, k)) FROM jsonb_array_elements(j) e), '[]'::jsonb)
    ELSE j END;
END $$;

-- ============================================================
-- direktor_students: the ONLY place that joins at-risk flags to names.
-- ============================================================
-- Roles: direktor / admin / creator / pedagog see any section; razredni only
-- their homeroom (profiles.homeroom_class / homeroom_section). Never a list of
-- all pupils, never e-mails - flags only (spec §2.4). The API writes audit_log.
CREATE OR REPLACE FUNCTION public.direktor_students(class_number INT, section_number INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
#variable_conflict use_column
DECLARE
  p_class INT := class_number;
  p_section INT := section_number;
  role_ TEXT := public.caller_role();
  hr RECORD;
BEGIN
  IF role_ IS NULL OR role_ NOT IN ('direktor','admin','creator','pedagog','razredni','service_role') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF role_ = 'razredni' THEN
    SELECT homeroom_class, homeroom_section INTO hr FROM public.profiles WHERE id = auth.uid();
    IF hr.homeroom_class IS DISTINCT FROM p_class OR hr.homeroom_section IS DISTINCT FROM p_section THEN
      RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'class_number', p_class, 'section_number', p_section,
    'students_total', (SELECT count(*) FROM public.verified_students v WHERE v.class_number = p_class AND v.section_number = p_section),
    'registered', (SELECT count(DISTINCT public.ev_student_key(a.user_id, a.meta)) FROM public.app_events a
                    WHERE a.event = 'session_start' AND a.class_number = p_class AND a.section_number = p_section
                      AND (a.user_id IS NOT NULL OR a.meta ? 'sid')),
    'generated_at', now(),
    'at_risk', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'name', coalesce(
                  (SELECT p.first_name || ' ' || p.last_name FROM public.profiles p WHERE p.id = r.user_id),
                  (SELECT v.first_name || ' ' || v.last_name FROM public.verified_students v WHERE v.id = r.sid),
                  'Nepoznat učenik'),
        'source', CASE WHEN r.user_id IS NOT NULL THEN 'profile' ELSE 'roster' END,
        'class_number', r.class_number, 'section_number', r.section_number,
        'reasons', to_jsonb(r.reasons), 'score', r.score,
        'last_active', r.last_active, 'inactive_days', r.inactive_days
      ) ORDER BY r.score DESC, r.inactive_days DESC), '[]')
      FROM public.v_at_risk_students r WHERE r.class_number = p_class AND r.section_number = p_section)
  );
END $fn$;
REVOKE ALL ON FUNCTION public.direktor_students(INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.direktor_students(INT, INT) TO authenticated, service_role;
COMMENT ON FUNCTION public.direktor_students(INT, INT) IS
  'At-risk pupils of one section WITH names. direktor/admin/creator/pedagog, razredni for their homeroom only. Every call is audited by the API.';

-- ============================================================
-- nastavnik_stats: the teacher panel (plan §C) as one JSON
-- ============================================================
CREATE OR REPLACE FUNCTION public.nastavnik_stats(author UUID, period TEXT DEFAULT '7d')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
#variable_conflict use_column
DECLARE
  p_author UUID := author;
  p_period TEXT := period;
  role_ TEXT := public.caller_role();
  b RECORD;
  today DATE := public.ev_local_day(now());
  demo_share NUMERIC;
  j_meta JSONB; j_kpi JSONB; j_lect JSONB; j_classes JSONB; j_hw JSONB; j_mod JSONB; j_authors JSONB; j_signals JSONB;
BEGIN
  IF role_ IS NULL OR role_ NOT IN ('teacher','razredni','pedagog','direktor','admin','creator','service_role') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  -- a teacher / homeroom teacher sees only their own lectures
  IF role_ IN ('teacher','razredni') AND p_author IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO b FROM public.direktor_period_bounds(p_period);

  DROP TABLE IF EXISTS pg_temp.tl, pg_temp.tev, pg_temp.creg, pg_temp.hwstate, pg_temp.lstat, pg_temp.days30n;

  CREATE TEMP TABLE days30n ON COMMIT DROP AS SELECT (today - g)::date AS d FROM generate_series(29, 0, -1) g;

  CREATE TEMP TABLE tl ON COMMIT DROP AS
  SELECT l.id, l.title, l.subject, l.class_number, l.created_at, coalesce(l.updated_at, l.created_at) AS updated_at,
         (l.content ~ 'HOMEWORK:.*:HOMEWORK') AS has_homework,
         public.safe_jsonb(substring(l.content from 'HOMEWORK:(.*?):HOMEWORK')) AS hw
    FROM public.lectures l WHERE l.author_id = p_author;

  -- every event that touched one of the author's lectures (all time)
  CREATE TEMP TABLE tev ON COMMIT DROP AS
  SELECT coalesce(a.user_id::text, a.meta->>'sid') AS sk, a.class_number AS cls,
         a.event, a.entity_id, a.value, a.created_at AS ts, public.ev_local_day(a.created_at) AS d,
         (a.created_at >= b.from_ts AND a.created_at < b.to_ts) AS cur,
         (a.created_at >= b.prev_from AND a.created_at < b.prev_to) AS prev,
         (a.meta->>'seed' = 'true') AS seed
    FROM public.app_events a JOIN tl ON tl.id = a.entity_id
   WHERE a.event IN ('lecture_open','lecture_read','lecture_time','quiz_start','quiz_finish','quiz_abandon',
                     'flashcards_start','flashcards_finish','homework_done');
  CREATE INDEX ON tev (entity_id);
  ANALYZE tev;

  -- registered pupils per class (student keys ever seen), for k-anonymity and rates
  CREATE TEMP TABLE creg ON COMMIT DROP AS
  SELECT a.class_number AS cls, count(DISTINCT public.ev_student_key(a.user_id, a.meta)) AS registered,
         count(DISTINCT public.ev_student_key(a.user_id, a.meta)) FILTER (WHERE a.created_at >= public.local_day_start(today - 6)) AS active_7d
    FROM public.app_events a
   WHERE a.event = 'session_start' AND a.class_number IS NOT NULL AND (a.user_id IS NOT NULL OR a.meta ? 'sid')
   GROUP BY a.class_number;

  -- latest homework state per (lecture, pupil): value 1 = done, 0 = undone
  CREATE TEMP TABLE hwstate ON COMMIT DROP AS
  SELECT entity_id, sk, value, ts FROM (
    SELECT entity_id, sk, value, ts, row_number() OVER (PARTITION BY entity_id, sk ORDER BY ts DESC) AS rn
      FROM tev WHERE event = 'homework_done' AND sk IS NOT NULL) x WHERE rn = 1;

  CREATE TEMP TABLE lstat ON COMMIT DROP AS
  SELECT tl.*,
         count(*) FILTER (WHERE e.event = 'lecture_open' AND e.cur) AS opens,
         count(*) FILTER (WHERE e.event = 'lecture_read' AND e.cur) AS reads,
         count(*) FILTER (WHERE e.event = 'quiz_start' AND e.cur) AS quiz_starts,
         count(*) FILTER (WHERE e.event = 'quiz_finish' AND e.cur) AS quiz_finishes,
         count(*) FILTER (WHERE e.event = 'quiz_abandon' AND e.cur) AS quiz_abandons,
         round(avg(e.value) FILTER (WHERE e.event = 'quiz_finish' AND e.cur), 1) AS avg_score,
         round(avg(e.value) FILTER (WHERE e.event = 'quiz_finish' AND e.prev), 1) AS prev_avg_score,
         round(avg(e.value) FILTER (WHERE e.event = 'lecture_time' AND e.cur)) AS avg_time_s,
         count(*) FILTER (WHERE e.event = 'lecture_open') AS opens_all,
         count(*) FILTER (WHERE e.event = 'lecture_read') AS reads_all,
         count(*) FILTER (WHERE e.event = 'quiz_start') AS quiz_starts_all,
         count(*) FILTER (WHERE e.event = 'quiz_finish') AS quiz_finishes_all,
         count(*) FILTER (WHERE e.event = 'quiz_abandon') AS quiz_abandons_all,
         round(avg(e.value) FILTER (WHERE e.event = 'quiz_finish'), 1) AS avg_score_all,
         count(DISTINCT e.sk) FILTER (WHERE e.cur) AS students,
         round(EXTRACT(EPOCH FROM (min(e.ts) FILTER (WHERE e.event = 'lecture_read') - tl.created_at)) / 3600.0, 1) AS first_read_lag_h,
         max(e.ts) AS last_activity,
         (SELECT count(*) FROM hwstate h WHERE h.entity_id = tl.id AND h.value = 1) AS hw_done,
         (SELECT count(*) FROM hwstate h WHERE h.entity_id = tl.id AND h.value = 0) AS hw_undone,
         (SELECT max(h.ts) FROM hwstate h WHERE h.entity_id = tl.id) AS hw_last_at
    FROM tl LEFT JOIN tev e ON e.entity_id = tl.id
   GROUP BY tl.id, tl.title, tl.subject, tl.class_number, tl.created_at, tl.updated_at, tl.has_homework, tl.hw;
  ANALYZE lstat;

  SELECT round(100.0 * count(*) FILTER (WHERE seed) / NULLIF(count(*), 0), 1) INTO demo_share FROM tev WHERE cur;

  j_meta := jsonb_build_object(
    'author', (SELECT jsonb_build_object('id', p.id, 'name', p.first_name || ' ' || p.last_name, 'role', p.role,
                 'subject', (SELECT mode() WITHIN GROUP (ORDER BY subject) FROM tl))
                 FROM public.profiles p WHERE p.id = p_author),
    'period', p_period, 'from', b.from_day, 'to', b.to_day, 'days', b.days,
    'prev_from', (b.from_day - b.days), 'prev_to', (b.from_day - 1),
    'generated_at', now(), 'demo_share', coalesce(demo_share, 0),
    'events_in_period', (SELECT count(*) FROM tev WHERE cur),
    'k_min', public.k_anon_min()
  );

  -- ---------- KPI ----------
  WITH ser AS (
    SELECT jsonb_agg(x.pub ORDER BY x.d) AS pub, jsonb_agg(x.opens ORDER BY x.d) AS opens,
           jsonb_agg(x.reads ORDER BY x.d) AS reads, jsonb_agg(x.quizzes ORDER BY x.d) AS quizzes,
           jsonb_agg(x.avg_score ORDER BY x.d) AS avg_score, jsonb_agg(x.students ORDER BY x.d) AS students
      FROM (SELECT ds.d,
                   (SELECT count(*) FROM tl WHERE public.ev_local_day(tl.created_at) = ds.d) AS pub,
                   count(*) FILTER (WHERE e.event = 'lecture_open') AS opens,
                   count(*) FILTER (WHERE e.event = 'lecture_read') AS reads,
                   count(*) FILTER (WHERE e.event = 'quiz_finish') AS quizzes,
                   round(avg(e.value) FILTER (WHERE e.event = 'quiz_finish'), 1) AS avg_score,
                   count(DISTINCT e.sk) AS students
              FROM days30n ds LEFT JOIN tev e ON e.d = ds.d GROUP BY ds.d) x
  )
  SELECT jsonb_build_object(
    'lectures_total', (SELECT count(*) FROM tl),
    'lectures_published', public.kpi_json(
        (SELECT count(*) FROM tl WHERE created_at >= b.from_ts AND created_at < b.to_ts),
        (SELECT count(*) FROM tl WHERE created_at >= b.prev_from AND created_at < b.prev_to), (SELECT pub FROM ser)),
    'opens', public.kpi_json((SELECT count(*) FROM tev WHERE event = 'lecture_open' AND cur), (SELECT count(*) FROM tev WHERE event = 'lecture_open' AND prev), (SELECT opens FROM ser)),
    'reads', public.kpi_json((SELECT count(*) FROM tev WHERE event = 'lecture_read' AND cur), (SELECT count(*) FROM tev WHERE event = 'lecture_read' AND prev), (SELECT reads FROM ser)),
    'quizzes', public.kpi_json((SELECT count(*) FROM tev WHERE event = 'quiz_finish' AND cur), (SELECT count(*) FROM tev WHERE event = 'quiz_finish' AND prev), (SELECT quizzes FROM ser)),
    'avg_score', public.kpi_json((SELECT round(avg(value), 1) FROM tev WHERE event = 'quiz_finish' AND cur), (SELECT round(avg(value), 1) FROM tev WHERE event = 'quiz_finish' AND prev), (SELECT avg_score FROM ser)),
    'students_reached', public.kpi_json((SELECT count(DISTINCT sk) FROM tev WHERE cur AND sk IS NOT NULL), (SELECT count(DISTINCT sk) FROM tev WHERE prev AND sk IS NOT NULL), (SELECT students FROM ser)),
    'first_read_lag_h', public.kpi_json(
        (SELECT round(avg(first_read_lag_h), 1) FROM lstat WHERE created_at >= b.from_ts AND created_at < b.to_ts AND first_read_lag_h IS NOT NULL),
        (SELECT round(avg(first_read_lag_h), 1) FROM lstat WHERE created_at >= b.prev_from AND created_at < b.prev_to AND first_read_lag_h IS NOT NULL), NULL),
    'first_read_lag_h_all', (SELECT round(avg(first_read_lag_h), 1) FROM lstat WHERE first_read_lag_h IS NOT NULL),
    'homework_done_pct', (SELECT round(100.0 * sum(hw_done) / NULLIF(sum(hw_done + hw_undone), 0), 1) FROM lstat),
    'abandon_rate', (SELECT round(100.0 * count(*) FILTER (WHERE event = 'quiz_abandon') / NULLIF(count(*) FILTER (WHERE event = 'quiz_start'), 0), 1) FROM tev WHERE cur),
    'stale_lectures', (SELECT count(*) FROM tl WHERE updated_at < now() - interval '90 days')
  ) INTO j_kpi;

  -- ---------- lectures (newest first; compact - homework details live in `homework`) ----------
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'lecture_id', id, 'title', title, 'subject', subject, 'class_number', class_number,
      'created_at', created_at,
      'opens', opens, 'reads', reads, 'quiz_finishes', quiz_finishes, 'avg_score', avg_score,
      'abandon_rate', round(100.0 * quiz_abandons / NULLIF(quiz_starts, 0), 1),
      'avg_time_s', avg_time_s, 'students', students,
      'opens_all', opens_all, 'reads_all', reads_all, 'quiz_finishes_all', quiz_finishes_all, 'avg_score_all', avg_score_all,
      'first_read_lag_h', first_read_lag_h, 'last_activity', last_activity,
      'has_homework', has_homework,
      'stale', (updated_at < now() - interval '90 days')
    ) ORDER BY created_at DESC), '[]') INTO j_lect FROM lstat;

  -- ---------- classes the author teaches (from lectures.class_number) ----------
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'class_number', c.class_number,
      'lectures', c.lectures,
      'students_total', (SELECT count(*) FROM public.verified_students v WHERE v.class_number = c.class_number),
      'registered', coalesce(r.registered, 0),
      'k_hidden', coalesce(r.registered, 0) < public.k_anon_min(),
      'active_7d', CASE WHEN r.registered >= public.k_anon_min() THEN r.active_7d END,
      'active_7d_pct', CASE WHEN r.registered >= public.k_anon_min() THEN round(100.0 * r.active_7d / NULLIF(r.registered, 0), 1) END,
      'opens', CASE WHEN r.registered >= public.k_anon_min() THEN c.opens END,
      'reads', CASE WHEN r.registered >= public.k_anon_min() THEN c.reads END,
      'quiz_finishes', CASE WHEN r.registered >= public.k_anon_min() THEN c.quiz_finishes END,
      'avg_score', CASE WHEN r.registered >= public.k_anon_min() THEN c.avg_score END,
      'prev_avg_score', CASE WHEN r.registered >= public.k_anon_min() THEN c.prev_avg_score END,
      'weak_topics', CASE WHEN r.registered >= public.k_anon_min() THEN (SELECT coalesce(jsonb_agg(jsonb_build_object(
          'lecture_id', w.id, 'title', w.title, 'subject', w.subject, 'avg_score', w.avg_score_all,
          'attempts', w.quiz_finishes_all, 'abandon_rate', round(100.0 * w.quiz_abandons_all / NULLIF(w.quiz_starts_all, 0), 1)) ORDER BY w.avg_score_all ASC NULLS LAST), '[]')
        FROM (SELECT * FROM lstat w WHERE w.class_number = c.class_number AND w.quiz_finishes_all >= 5
                 AND (w.avg_score_all < 60 OR 100.0 * w.quiz_abandons_all / NULLIF(w.quiz_starts_all, 0) > 40)
               ORDER BY w.avg_score_all ASC NULLS LAST LIMIT 5) w) ELSE '[]'::jsonb END
    ) ORDER BY c.class_number), '[]') INTO j_classes
    FROM (SELECT class_number, count(*) AS lectures, sum(opens) AS opens, sum(reads) AS reads, sum(quiz_finishes) AS quiz_finishes,
                 round(avg(avg_score), 1) AS avg_score, round(avg(prev_avg_score), 1) AS prev_avg_score
            FROM lstat GROUP BY class_number) c
    LEFT JOIN creg r ON r.cls = c.class_number;

  -- ---------- homework (lectures with a HOMEWORK block, or with >=3 pupils who marked it) ----------
  SELECT coalesce(jsonb_agg(jsonb_build_object(
      'lecture_id', s.id, 'title', s.title, 'subject', s.subject, 'class_number', s.class_number,
      'created_at', s.created_at, 'has_homework', s.has_homework,
      'due', s.hw->>'due', 'tasks', jsonb_array_length(coalesce(s.hw->'tasks', '[]'::jsonb)),
      'overdue', (s.hw->>'due') ~ '^\d{4}-\d{2}-\d{2}' AND left(s.hw->>'due', 10)::date < today,
      'done', s.hw_done, 'undone', s.hw_undone,
      'registered', coalesce(r.registered, 0),
      'done_pct', CASE WHEN coalesce(r.registered, 0) >= public.k_anon_min() THEN round(100.0 * s.hw_done / NULLIF(r.registered, 0), 1) END,
      'k_hidden', coalesce(r.registered, 0) < public.k_anon_min(),
      'last_done_at', s.hw_last_at
    ) ORDER BY (s.hw->>'due') ASC NULLS LAST, s.created_at DESC), '[]') INTO j_hw
    FROM lstat s LEFT JOIN creg r ON r.cls = s.class_number
   WHERE s.has_homework OR s.hw_done + s.hw_undone >= 3;

  -- ---------- moderation + AI drafts ----------
  SELECT jsonb_build_object(
    'photos_pending', (SELECT count(*) FROM public.photos WHERE status = 'pending'),
    'oldest_pending_h', (SELECT round(EXTRACT(EPOCH FROM (now() - min(created_at))) / 3600.0, 1) FROM public.photos WHERE status = 'pending'),
    'photos_moderated_by_me', (SELECT count(*) FROM public.photos WHERE moderator_id = p_author),
    'ai_drafts', (SELECT jsonb_build_object(
        'pending', count(*) FILTER (WHERE status IN ('pending','processing')),
        'done', count(*) FILTER (WHERE status = 'done'),
        'error', count(*) FILTER (WHERE status = 'error'),
        'total', count(*)) FROM public.lecture_jobs WHERE user_id = p_author)
  ) INTO j_mod;

  -- ---------- authors (teacher picker for admin / direktor) ----------
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', x.author_id, 'name', coalesce(p.first_name || ' ' || p.last_name, 'Nepoznat autor'),
           'role', p.role, 'lectures', x.n, 'last_published', x.last_pub) ORDER BY x.n DESC), '[]') INTO j_authors
    FROM (SELECT author_id, count(*) AS n, max(created_at) AS last_pub FROM public.lectures WHERE author_id IS NOT NULL GROUP BY author_id) x
    LEFT JOIN public.profiles p ON p.id = x.author_id;

  -- ---------- signals ----------
  WITH sig AS (
    SELECT 'warn' AS severity, 'lecture_abandon' AS kind,
           format('„%s“: %s%% napuštenih kvizova', title, round(100.0 * quiz_abandons / NULLIF(quiz_starts, 0))) AS msg,
           '/nastavnik/lekcije?lecture=' || id AS link, round(100.0 * quiz_abandons / NULLIF(quiz_starts, 0)) AS value
      FROM lstat WHERE quiz_starts >= 10 AND 100.0 * quiz_abandons / quiz_starts > 50
    UNION ALL
    SELECT 'warn', 'lecture_low', format('„%s“: prosjek kviza %s%%', title, round(avg_score)), '/nastavnik/lekcije?lecture=' || id, round(avg_score)
      FROM lstat WHERE quiz_finishes >= 10 AND avg_score < 50
    UNION ALL
    SELECT 'info', 'stale', format('%s lekcija bez izmjena više od 90 dana', count(*)), '/nastavnik/lekcije', count(*)
      FROM lstat WHERE updated_at < now() - interval '90 days' HAVING count(*) > 0
    UNION ALL
    SELECT 'warn', 'homework_low', format('Domaći „%s“: urađeno %s%%', s.title, round(100.0 * s.hw_done / NULLIF(r.registered, 0))),
           '/nastavnik/domaci', round(100.0 * s.hw_done / NULLIF(r.registered, 0))
      FROM lstat s JOIN creg r ON r.cls = s.class_number
     WHERE s.has_homework AND r.registered >= public.k_anon_min()
       AND (s.hw->>'due') ~ '^\d{4}-\d{2}-\d{2}' AND left(s.hw->>'due', 10)::date < today
       AND 100.0 * s.hw_done / r.registered < 30
    UNION ALL
    SELECT 'info', 'moderation', format('%s fotografija čeka moderaciju', count(*)), '/admin/gallery', count(*)
      FROM public.photos WHERE status = 'pending' HAVING count(*) > 0
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object('severity', severity, 'kind', kind, 'text', msg, 'link', link, 'value', value)
           ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'warn' THEN 1 ELSE 2 END, msg), '[]')
    INTO j_signals FROM sig;

  RETURN jsonb_build_object(
    'meta', j_meta, 'kpi', j_kpi, 'lectures', j_lect, 'classes', j_classes,
    'homework', j_hw, 'moderation', j_mod, 'authors', j_authors, 'signals', j_signals
  );
END $fn$;
REVOKE ALL ON FUNCTION public.nastavnik_stats(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nastavnik_stats(UUID, TEXT) TO authenticated, service_role;
COMMENT ON FUNCTION public.nastavnik_stats(UUID, TEXT) IS
  'Teacher panel blocks as one JSON. teacher/razredni: own lectures only; pedagog/direktor/admin/creator: any author. Shape: src/lib/direktor-types.ts NastavnikStats.';

-- ============================================================
-- build_analysis_snapshot: the ONLY input the AI worker ever sees
-- ============================================================
-- PRIVACY CONTRACT (spec §4.1) - mirrored in src/lib/analysis-snapshot.ts:
--   * The snapshot is built exclusively from aggregates (direktor_stats()).
--   * It contains NO user_id, NO e-mail, NO pupil name, NO teacher name, NO
--     moderator name, NO session id, NO device identifier.
--   * At-risk pupils are passed only as {class_number, section_number,
--     reasons, score} - never an identifier.
--   * Teachers are passed as anonymous rows {subject, lectures, opens, reads,
--     avg_score, days_since_publish}.
--   * Groups under k_min (5) pupils are already NULL in direktor_stats().
--   * Lecture / news / event titles are public school content and are kept.
--   * Sparkline series are stripped; the result stays under ~30 KB.
-- scope: {period: 'today'|'7d'|'30d'|'semester', class, section, subject, [compare], [seed]}
CREATE OR REPLACE FUNCTION public.build_analysis_snapshot(scope JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  p_period TEXT := coalesce(scope->>'period', '7d');
  p_class INT := CASE WHEN scope->>'class' ~ '^\d+$' THEN (scope->>'class')::int END;
  p_section INT := CASE WHEN scope->>'section' ~ '^\d+$' THEN (scope->>'section')::int END;
  p_subject TEXT := NULLIF(scope->>'subject', '');
  s JSONB;
  learn JSONB; teach JSONB; comm JSONB; cls JSONB;
BEGIN
  -- the role check happens inside direktor_stats()
  s := public.direktor_stats(p_period, p_class, p_section, p_subject);
  s := public.jsonb_strip_key(s, 'series');
  s := public.jsonb_strip_key(s, 'prev_series');

  learn := s->'learning';
  learn := learn || jsonb_build_object(
    'top_read', (SELECT coalesce(jsonb_agg(e - 'lecture_id'), '[]') FROM (SELECT e FROM jsonb_array_elements(learn->'top_read') e LIMIT 5) x),
    'least_read', (SELECT coalesce(jsonb_agg(e - 'lecture_id'), '[]') FROM (SELECT e FROM jsonb_array_elements(learn->'least_read') e LIMIT 5) x),
    'risk_topics', (SELECT coalesce(jsonb_agg(e - 'lecture_id'), '[]') FROM (SELECT e FROM jsonb_array_elements(learn->'risk_topics') e LIMIT 10) x),
    'coverage', (SELECT coalesce(jsonb_agg(e), '[]') FROM (SELECT e FROM jsonb_array_elements(learn->'coverage') e WHERE (e->>'lectures_total')::int > 0 LIMIT 24) x)
  );

  teach := s->'teaching';
  teach := teach || jsonb_build_object(
    'teachers', (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'subject', e->'subject', 'lectures', e->'lectures', 'opens', e->'opens', 'reads', e->'reads',
        'avg_score', e->'avg_score', 'days_since_publish', e->'days_since_publish')), '[]')
       FROM jsonb_array_elements(teach->'teachers') e),
    'moderation', (teach->'moderation') - 'moderators',
    'publish_effect', (SELECT coalesce(jsonb_agg(e - 'lecture_id'), '[]') FROM (SELECT e FROM jsonb_array_elements(teach->'publish_effect') e LIMIT 5) x)
  );

  comm := s->'community';
  comm := comm || jsonb_build_object(
    'news', (SELECT coalesce(jsonb_agg(e - 'id'), '[]') FROM (SELECT e FROM jsonb_array_elements(comm->'news') e LIMIT 8) x),
    'events', (SELECT coalesce(jsonb_agg((e - 'id') - 'by_day'), '[]') FROM (SELECT e FROM jsonb_array_elements(comm->'events') e LIMIT 6) x)
  );

  cls := s->'classes';
  cls := cls || jsonb_build_object(
    'at_risk', jsonb_build_object(
      'count', cls->'at_risk'->'count', 'churned', cls->'at_risk'->'churned',
      'by_section', cls->'at_risk'->'by_section',
      'items', (SELECT coalesce(jsonb_agg(jsonb_build_object('class_number', e->'class_number', 'section_number', e->'section_number',
                    'reasons', e->'reasons', 'score', e->'score')), '[]')
                  FROM (SELECT e FROM jsonb_array_elements(cls->'at_risk'->'items') e LIMIT 30) x)));

  RETURN jsonb_build_object(
    '_privacy', 'Samo agregati: bez imena, e-mail adresa, identifikatora korisnika i sesija. Grupe < 5 učenika su null (k-anonimnost). Učenici u riziku samo kao {razred, odjeljenje, razlozi, skor}.',
    'scope', jsonb_build_object('period', p_period, 'class', p_class, 'section', p_section, 'subject', p_subject, 'compare', scope->>'compare'),
    'meta', ((s->'meta') - 'collecting_since') - 'last_event_at',
    'health', s->'health',
    'kpi', s->'kpi',
    'retention', s->'retention',
    'activity', jsonb_build_object('from', s->'activity'->'from', 'to', s->'activity'->'to', 'totals', s->'activity'->'totals'),
    'heatmap', jsonb_build_object('peak', s->'heatmap'->'peak', 'by_weekday', s->'heatmap'->'by_weekday'),
    'signals', s->'signals',
    'devices', s->'devices',
    'learning', learn,
    'classes', cls,
    'class_detail', CASE WHEN s->'class_detail' IS NULL OR s->'class_detail' = 'null'::jsonb THEN NULL
                         ELSE (s->'class_detail') - 'activity' END,
    'teaching', teach,
    'community', comm
  );
END $fn$;
REVOKE ALL ON FUNCTION public.build_analysis_snapshot(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.build_analysis_snapshot(JSONB) TO authenticated, service_role;
COMMENT ON FUNCTION public.build_analysis_snapshot(JSONB) IS
  'AI input: aggregates only (no names, e-mails, ids). Privacy contract: comment above in supabase/migrations/20260914000700_nastavnik_stats_snapshot.sql and src/lib/analysis-snapshot.ts.';
