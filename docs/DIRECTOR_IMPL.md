# Direktor + Nastavnik panels — implementation plan (derived from docs/DIRECTOR_DASHBOARD.md)

Owner's instructions on top of the spec: build the FUNCTIONS; ignore every visual instruction in
the spec and use the app exactly as it looks now (docs/DUOLINGO_REDESIGN.md §2–§4 components,
Nunito, light theme, 44px targets, Montenegrin strings). Two separate panels — `/direktor` and
`/nastavnik` — filled with data from day one (seeded demo telemetry), reachable from a prominent
button on the Još screen. Everything must work for the shared demo admin account
(profiles.role = 'admin') and for real `direktor` / `teacher` roles.

Work happens in the git worktree `/tmp/nr-merge` (branch tip of claude/duolingo-redesign merged with
main). Supabase project `ydcbxqrnmnbceyzqgbui`; `.env.local` there has `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Apply DDL through the Supabase MCP
`apply_migration` tool (load via ToolSearch `select:mcp__3968e3a3-331c-4c62-8865-a4b4ba6b2a1a__apply_migration,mcp__3968e3a3-331c-4c62-8865-a4b4ba6b2a1a__execute_sql`)
AND save the same SQL under `supabase/migrations/<timestamp>_<name>.sql`.

## Scope (what ships)

### A. Data (spec §1, trimmed)
- `profiles.role` CHECK extended: student | teacher | razredni | pedagog | direktor | moderator | admin | creator.
  `profiles.homeroom_class int`, `homeroom_section int` (nullable).
- `app_events` exactly as spec §1.2 (+ RLS: insert anon/authenticated with `user_id is null or user_id = auth.uid()`; select only via `is_school_staff()` = role in (direktor, admin, pedagog, razredni, teacher)).
- `quiz_results`, `lecture_progress_srv` as spec §1.3 (RLS: own rows insert/select; staff select).
- `audit_log` exists already (`audit_log` table) — reuse: (actor_id, action, target, meta).
- `analysis_jobs` as spec §4.1 + `analysis_actions (job_id, index, done_by, done_at)`.
- Client `src/lib/analytics.ts`: `track(event, payload?)` with in-memory buffer, flush every 5 s / on `visibilitychange`+`pagehide` via `navigator.sendBeacon` to `POST /api/track` (zod, ≤50 events, rate limit via src/lib/rate-limit.ts). Session id in sessionStorage. Platform = 'pwa' when `display-mode: standalone`, else 'browser' + OS family from UA (no full UA). Hook `track()` as the FIRST line into existing handlers only (no restructuring): app_open/session_start (root layout client component), screen_view (pathname effect), lecture_open, lecture_read/unread (progress lib), quiz_start/quiz_finish/quiz_abandon (quiz-runner), flashcards_start/finish, lecture_search, news_view (IntersectionObserver on cards, once per session), news_like, event_view, schedule_view, grades_open, ednevnik_connect, gallery_view, photo_upload, photo_like, game_start/game_over, tournament_view, share (if exists), nav_customized, font_size_changed, theme_changed. quiz_finish also inserts `quiz_results` (signed-in only); markRead/unmarkRead sync `lecture_progress_srv` (signed-in only).
- Seed `scripts/seed-analytics.mjs` per spec §1.5 (90 days, weekly seasonality, hour peaks, 55/25/20 cohorts, per-subject averages with two weak topics avg < 50 %, one class with falling activity, one viral and one flop news, `meta.seed=true`, `--reset`). Students: rows of `verified_students` joined to existing `profiles` where possible; for students without a profile create NOTHING in auth — instead seed events with `user_id = null` but class/section/role denormalised (the views group by class/section, not by user, except retention/at-risk which use a synthetic `meta.sid` student key). Keep it deterministic (seeded PRNG) so re-runs match.

### B. Aggregates + API (spec §2, trimmed)
- SQL function `is_school_staff()` (security definer, reads profiles.role of auth.uid()).
- Views (security_invoker=false, granted to authenticated, guarded inside by `is_school_staff()` returning no rows otherwise): `v_daily_activity`, `v_retention`, `v_subject_stats`, `v_lecture_stats`, `v_class_stats`, `v_teacher_stats`, `v_content_gaps`, `v_community_stats`, `v_hour_heatmap`, `v_at_risk_students`, `v_school_health` — definitions per spec §2.1; at-risk uses `meta.sid` for seeded students and `user_id` for real ones; k-anonymity: any group aggregate with < 5 students → nulls (spec §2.4).
- No pg_cron. Instead one SQL function `direktor_stats(period text, class int, section int, subject text) returns jsonb` that assembles every block the UI needs (calls the views), plus `nastavnik_stats(author uuid, period text)` for the teacher panel. Both security definer + staff check.
- API: `GET /api/direktor/stats`, `GET /api/direktor/students?class&section` (direktor/admin/pedagog/razredni; writes audit), `GET /api/direktor/export?format=csv&screen=` (writes audit), `GET /api/nastavnik/stats`, `POST /api/direktor/analysis` (creates adhoc analysis_jobs, 5/day), `POST /api/direktor/actions` (mark recommendation done). Auth via src/lib/api-auth.ts (server-side role check). `Cache-Control: private, max-age=300` on stats.

### C. UI (spec §3, visuals = current app)
- Route group `(admin)`: `src/app/(admin)/direktor/{layout.tsx,page.tsx,ucenje/page.tsx,ucenje/[subject]/page.tsx,razredi/page.tsx,razredi/[cls]/page.tsx,nastava/page.tsx,zajednica/page.tsx,ai/page.tsx,izvjestaj/page.tsx}` with its OWN bottom nav (Pregled · Učenje · Razredi · Nastava · Zajednica — same nav component style as the app's, 84px, lucide icons) and a header with back-to-app, period chips (Danas · 7 dana · 30 dana · Polugodište), "AI" button. Widgets per spec §3.1–§3.5, built from the app's Card/Badge/Button/Tabs; charts with `recharts` (add dependency) using token colours only, ≤220px tall, one column on phones; heatmap as CSS grid; skeletons while loading; empty states §4.11; "DEMO PODACI" badge when seed share > 50 %; "ⓘ" definitions; "Izvještaj za Ministarstvo" → `/direktor/izvjestaj` (print-ready page with `window.print()` and `@media print` styles; sections per spec §5.2 without names).
- `/nastavnik` (teacher panel, same shell, 4 tabs: Pregled · Moje lekcije · Razredi · Domaći): KPIs for the teacher's lectures (opens, reads, quiz avg, first-read lag), list of their lectures with metrics and "Uredi"/"Nova lekcija" actions, classes they teach (from lectures.class_number) with activity and weak topics, homework status per lecture (has homework / done-rate from `lecture_progress_srv`-like `homework_done` events), photos awaiting moderation, quick actions (Nova lekcija sa AI, Moderacija). For `admin`/`direktor` viewing `/nastavnik`, show a teacher picker (profiles with role teacher/admin/creator who authored lectures) defaulting to the viewer.
- Još (`src/app/(main)/profile/page.tsx`, both guest and signed-in branches): a PROMINENT card at the top of the settings area — two big rows "Panel direktora" (icon LayoutDashboard, gold tint) and "Panel nastavnika" (icon Presentation, blue tint), visible when role ∈ {admin, direktor, creator, teacher, razredni, pedagog} (admin/direktor/creator see both; teacher/razredni/pedagog see nastavnik only). Keep the other session's edits in that file intact (edit surgically).
- Access rules server-side: `/direktor` → direktor/admin/creator/pedagog; `/nastavnik` → teacher/razredni/pedagog/direktor/admin/creator; others → redirect to /profile with a toast-less notice card.

### D. AI analysis (spec §4)
- `tools/lekcija-worker.mjs` gains `analysis_jobs` polling (same loop): builds `input_snapshot` via SQL function `build_analysis_snapshot(scope jsonb) returns jsonb` (aggregates only — put the privacy contract comment there and in `src/lib/analysis-snapshot.ts` mirror), prompt in Montenegrin per spec §4.2, strict JSON schema, zod-like validation in the worker (manual checks), one retry, then status error. Also generate ONE `daily` and ONE `weekly` job during seeding so the cards are populated; "Osvježi analizu" creates adhoc jobs.
- `/direktor/ai`: full report + history + "Pitaj podatke" (question → adhoc job with `question`, same snapshot, cached by (question, period, filters) in analysis_jobs).

### E. Signals + export + digest (spec §5, trimmed)
- "Signali" computed inside `direktor_stats` (rules from §5.1) — no cron, no alerts table.
- CSV export per screen (client-side from the JSON already loaded; API export route writes audit).
- Digest: skip cron; provide `POST /api/direktor/digest` that composes the 5-line text and sends it via the existing Telegram route if present, else returns the text (button "Pošalji sažetak" on Pregled).

## Verification
`npx tsc --noEmit`, `npm run build`, `node scripts/e2e-smoke.mjs --build` (+ new checks: /direktor renders all tabs with seed data at 360px without horizontal scroll; /nastavnik renders; Još shows the two buttons for the demo admin; k-anonymity null for a group < 5; track() posts a batch), puppeteer screenshots of every panel screen at 360px into docs/screens/.
