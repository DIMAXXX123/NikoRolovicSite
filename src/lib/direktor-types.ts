/**
 * Shapes of the JSON returned by the SQL functions behind the Direktor and
 * Nastavnik panels. Hand-written from the SQL — keep in sync with
 *   supabase/migrations/20260914000600_direktor_stats.sql        (direktor_stats)
 *   supabase/migrations/20260914000700_nastavnik_stats_snapshot.sql (nastavnik_stats,
 *                                                                 direktor_students,
 *                                                                 build_analysis_snapshot)
 *
 * Conventions:
 *  - `null` on a group aggregate means "Premalo podataka (zaštita privatnosti)"
 *    (k-anonymity, fewer than `meta.k_min` pupils); the row also carries
 *    `k_hidden: true` where that applies.
 *  - Percentages are 0–100 with one decimal; durations are seconds; dates are
 *    ISO `YYYY-MM-DD` (local Europe/Podgorica days); timestamps are ISO strings.
 *  - Sparkline series are 30 daily points ending today (oldest first). A point
 *    can be `null` when there was no data that day.
 */

export type DirektorPeriod = 'today' | '7d' | '30d' | 'semester'

export const DIREKTOR_PERIODS: readonly DirektorPeriod[] = ['today', '7d', '30d', 'semester']

export type Severity = 'info' | 'warn' | 'critical'

/** KPI tile: current value, previous-period value, % change, 30-point sparkline. */
export interface Kpi {
  value: number | null
  prev: number | null
  /** Percent change vs `prev`; null when there is no baseline. */
  delta_pct: number | null
  series: (number | null)[]
}

export interface Signal {
  severity: Severity
  kind:
    | 'section_drop'
    | 'section_silent'
    | 'subject_low'
    | 'lecture_abandon'
    | 'lecture_low'
    | 'moderation'
    | 'at_risk'
    | 'ai_problem'
    | 'stale'
    | 'homework_low'
    | (string & {})
  /** Montenegrin sentence ready for the UI. */
  text: string
  /** Panel route to open on tap. */
  link: string | null
  value: number | null
}

// ---------------------------------------------------------------------------
// direktor_stats(period, class, section, subject)
// ---------------------------------------------------------------------------

export interface DirektorMeta {
  period: DirektorPeriod
  from: string
  to: string
  days: number
  prev_from: string
  prev_to: string
  class: number | null
  section: number | null
  subject: string | null
  generated_at: string
  /** Share (0–100) of events in the period that come from the seed script — show "DEMO PODACI" when > 50. */
  demo_share: number
  /** First event ever — for "Nema podataka za ovaj period — prikupljamo od {datum}". */
  collecting_since: string | null
  last_event_at: string | null
  events_in_period: number
  /** k-anonymity threshold (5). */
  k_min: number
  verified_total: number
}

export interface HealthComponent {
  value: number
  weight: number
}

export interface SchoolHealth {
  /** Composite 0–100 for today; null before any data. */
  score: number | null
  prev_score: number | null
  /** Points vs 7 days ago. */
  delta: number | null
  components: {
    coverage: HealthComponent
    wau: HealthComponent
    avg_score: HealthComponent
    funnel: HealthComponent
    freshness: HealthComponent
  } | null
  /** Last 30 daily scores. */
  series: number[]
}

export interface OverviewKpi {
  active_today: Kpi
  wau: Kpi
  mau: Kpi
  /** registered / verified_students, % */
  coverage_pct: Kpi
  avg_session_s: Kpi
  sessions_per_student_week: Kpi
  registered: number
  verified_total: number
}

export interface RetentionCohort {
  /** Monday of the ISO week of the pupils' first session. */
  cohort_week: string
  size: number
  d1: number | null
  d7: number | null
  d30: number | null
}

export interface Retention {
  last_cohort: RetentionCohort | null
  /** Up to 16 most recent cohorts (≥ k_min pupils each), oldest first. */
  cohorts: RetentionCohort[]
}

export interface ActivityPoint {
  date: string
  dau: number
  sessions: number
  avg_session_s: number | null
  new_users: number
  installs: number
}

export interface Activity {
  from: string
  to: string
  days: number
  series: ActivityPoint[]
  /** Same length as `series`, the preceding window (for the overlay line). */
  prev_series: Pick<ActivityPoint, 'date' | 'dau' | 'sessions'>[]
  totals: {
    sessions: number
    prev_sessions: number
    installs: number
    new_users: number
  }
}

export interface HeatmapCell {
  /** 0 = Monday … 6 = Sunday (local time). */
  weekday: number
  hour: number
  events: number
}

export interface Heatmap {
  /** 7 × 24 cells, ordered by weekday then hour. */
  cells: HeatmapCell[]
  max: number
  /** Best 3-hour block, e.g. "Vrhunac: utorak 19–21h". */
  peak: { weekday: number; hour_from: number; hour_to: number; events: number } | null
  /** Events per weekday, index 0 = Monday. */
  by_weekday: number[]
}

export interface Devices {
  sessions: number
  pwa_share_pct: number | null
  os: { os: string; sessions: number; share_pct: number }[]
  installs: number
  install_prompts: number
  ednevnik_connected: number
  ednevnik_pct: number | null
}

/** Strict output schema of the AI worker (spec §4.2). */
export interface AnalysisOutput {
  summary: string
  health_verdict: 'dobro' | 'pažnja' | 'problem'
  insights: { title: string; detail: string; metric: string; delta: string; severity: Severity; link: string }[]
  recommendations: { action: string; why: string; who: 'direktor' | 'razredni' | 'nastavnik' | 'pedagog'; effort: 'nisko' | 'srednje' | 'visoko' }[]
  anomalies: { what: string; when: string; possible_cause: string }[]
  risk_summary: { students_at_risk: number; classes_to_watch: string[]; subjects_to_watch: string[] }
  questions_for_staff: string[]
  confidence: 'niska' | 'srednja' | 'visoka'
  data_caveats: string[]
}

export type AnalysisKind = 'daily' | 'weekly' | 'adhoc' | 'question'
export type AnalysisStatus = 'pending' | 'processing' | 'done' | 'error'

export interface AnalysisScope {
  period: DirektorPeriod
  class: number | null
  section: number | null
  subject: string | null
  compare?: 'prev_week' | null
  seed?: boolean
}

export interface AiBlock {
  latest: {
    id: string
    kind: AnalysisKind
    created_at: string
    finished_at: string | null
    model: string | null
    scope: AnalysisScope
    output: AnalysisOutput
  } | null
  pending: number
  adhoc_today: number
  adhoc_limit: number
}

export interface SubjectStat {
  subject: string
  lectures_total: number
  students: number
  k_hidden: boolean
  opens: number | null
  reads: number | null
  quiz_starts: number | null
  quiz_finishes: number | null
  avg_score: number | null
  prev_avg_score: number | null
  /** Percentage points vs previous period. */
  delta_pp: number | null
  median_score: number | null
  p25_score: number | null
  abandon_rate: number | null
  avg_time_s: number | null
}

export interface LectureRef {
  lecture_id: string
  title: string
  subject: string
  class_number: number
}

export interface RiskTopic extends LectureRef {
  avg_score: number | null
  attempts: number
  abandon_rate: number | null
  trend_pp: number | null
}

export interface Learning {
  kpi: {
    reads: Kpi
    quizzes: Kpi
    avg_score: Kpi
    /** % of active pupils with ≥ 1 finished quiz in the window. */
    weekly_quiz_pct: Kpi
    avg_lecture_time_s: Kpi
    /** Pupils with a ≥ 7-day activity streak. */
    streaks_7: Kpi
  }
  funnel: { opened: number; read: number; quiz_started: number; quiz_finished: number }
  /** Sorted ascending by avg_score (problem subjects first). */
  subjects: SubjectStat[]
  score_hist: { bins: number[]; total: number; below_50_pct: number | null }
  risk_topics: RiskTopic[]
  top_read: (LectureRef & { reads: number; opens: number; avg_score: number | null })[]
  least_read: (LectureRef & { reads: number; opens: number })[]
  coverage: { subject: string; class_number: number; lectures_total: number; lectures_read: number; pct: number | null }[]
  subjects_without_lectures: string[]
  gaps: { query: string; searches: number; zero_results: number }[]
  /** Last 12 ISO weeks, oldest first. */
  weekly: { week_start: string; reads: number; quizzes: number; avg_score: number | null }[]
  flashcards: {
    starts: number
    finishes: number
    share_pct: number | null
    quiz_avg_after_cards: number | null
    quiz_avg_without_cards: number | null
  }
}

export interface ClassCell {
  class_number: number
  section_number: number
  students_total: number
  registered: number
  k_hidden: boolean
  active_7d: number | null
  active_30d: number | null
  active_7d_pct: number | null
  lectures_read_per_student: number | null
  quizzes_per_student: number | null
  avg_score: number | null
  trend_7d_pct: number | null
  /** 40 % activity + 40 % avg score + 20 % reads per pupil. */
  composite: number | null
  rank: number | null
  prev_rank: number | null
  rank_delta: number | null
}

export interface AtRiskItem {
  class_number: number | null
  section_number: number | null
  /** Montenegrin chips: "Neaktivan 16 dana", "Rezultat −24 p.p.", "3 napuštena kviza". */
  reasons: string[]
  score: number
  inactive_days: number
}

export interface Classes {
  matrix: ClassCell[]
  by_class: {
    class_number: number
    students_total: number
    registered: number
    active_7d: number | null
    active_30d: number | null
    active_7d_pct: number | null
    lectures_read_per_student: number | null
    quizzes_per_student: number | null
    avg_score: number | null
    sections: number
  }[]
  at_risk: {
    count: number
    /** Pupils silent for more than 60 days — not counted as at-risk. */
    churned: number
    by_section: { class_number: number | null; section_number: number | null; count: number }[]
    /** Anonymous flags (no identifiers); names only via /api/direktor/students. */
    items: AtRiskItem[]
  }
}

/** Only when both class and section filters are set. */
export interface ClassDetail {
  kpi: Omit<ClassCell, 'composite' | 'rank' | 'prev_rank' | 'rank_delta'> | null
  subjects: { subject: string; avg_score: number | null; quiz_finishes: number | null; school_avg_score: number | null }[]
  activity: { date: string; section_dau: number; school_dau: number }[]
  at_risk_count: number
}

export interface TeacherRow {
  author_id: string
  name: string
  subject: string | null
  lectures: number
  opens: number
  reads: number
  avg_score: number | null
  days_since_publish: number | null
  last_published: string | null
  /** From teacher_statuses for today, if the teacher exists in `teachers`. */
  status: string | null
}

export interface Teaching {
  kpi: {
    lectures_published: Kpi
    active_teachers: Kpi
    lectures_total: number
    teachers_total: number
    avg_first_read_lag_h: number | null
    ai_drafts_pending: number
    photos_pending: number
  }
  teachers: TeacherRow[]
  freshness: {
    total: number
    stale: number
    stale_pct: number | null
    by_subject: { subject: string; total: number; stale: number; stale_pct: number | null }[]
  }
  ai_drafts: {
    total: number
    by_status: { status: string; count: number }[]
    avg_generation_min: number | null
    edited_before_publish_pct: number | null
  }
  moderation: {
    pending: number
    oldest_pending_h: number | null
    median_h: number | null
    rejected_pct: number | null
    approved: number
    rejected: number
    moderators: { name: string; count: number }[]
  }
  publish_effect: (LectureRef & { created_at: string; opens_24h: number; opens_72h: number })[]
}

export interface NewsRow {
  id: string
  title: string
  created_at: string
  views: number
  viewers: number
  reach_pct: number | null
  likes: number
  peak_day: string | null
  days_to_peak: number | null
}

export interface Community {
  kpi: {
    news_reach_pct: Kpi
    likes: Kpi
    event_views: Kpi
    gallery_uploads: Kpi
    game_sessions: Kpi
    shares: Kpi
  }
  /** Sorted by views desc. */
  news: NewsRow[]
  /** news_view events per hour of day (24 values, index 0 = 00:00 local). */
  best_hours: number[]
  events: {
    id: string
    title: string
    event_date: string
    event_type: string | null
    views: number
    by_day: { date: string; views: number }[]
  }[]
  gallery: {
    weekly: { week_start: string; uploads: number; approved: number; rejected: number; pending: number }[]
    top_classes: { class_number: number; section_number: number; uploads: number }[]
  }
  game: {
    sessions: number
    players: number
    avg_score: number | null
    median_duration_s: number | null
    readers_among_players_pct: number | null
    readers_among_nonplayers_pct: number | null
  }
  push: {
    received: number
    opened: number
    open_rate: number | null
    by_type: { type: string; received: number; opened: number }[]
  }
  ednevnik: {
    connected: number
    connected_pct: number | null
    syncs_per_day: number
    sync_errors: number
  }
}

/** Return shape of `direktor_stats()` = body of GET /api/direktor/stats. */
export interface DirektorStats {
  meta: DirektorMeta
  health: SchoolHealth
  kpi: OverviewKpi
  retention: Retention
  activity: Activity
  heatmap: Heatmap
  signals: Signal[]
  devices: Devices
  ai: AiBlock
  learning: Learning
  classes: Classes
  class_detail: ClassDetail | null
  teaching: Teaching
  community: Community
}

// ---------------------------------------------------------------------------
// nastavnik_stats(author, period)
// ---------------------------------------------------------------------------

export interface NastavnikMeta {
  author: { id: string; name: string; role: string; subject: string | null } | null
  period: DirektorPeriod
  from: string
  to: string
  days: number
  prev_from: string
  prev_to: string
  generated_at: string
  demo_share: number
  events_in_period: number
  k_min: number
  /** Set by the API when the demo teacher (no lectures) is shown another author's data. */
  fallback_author?: boolean
}

export interface NastavnikLecture extends LectureRef {
  created_at: string
  /** Period-scoped counts. */
  opens: number
  reads: number
  quiz_finishes: number
  avg_score: number | null
  abandon_rate: number | null
  avg_time_s: number | null
  students: number
  /** All-time counts. */
  opens_all: number
  reads_all: number
  quiz_finishes_all: number
  avg_score_all: number | null
  first_read_lag_h: number | null
  last_activity: string | null
  has_homework: boolean
  /** No update in 90+ days. */
  stale: boolean
}

export interface NastavnikClass {
  class_number: number
  lectures: number
  students_total: number
  registered: number
  k_hidden: boolean
  active_7d: number | null
  active_7d_pct: number | null
  opens: number | null
  reads: number | null
  quiz_finishes: number | null
  avg_score: number | null
  prev_avg_score: number | null
  weak_topics: { lecture_id: string; title: string; subject: string; avg_score: number | null; attempts: number; abandon_rate: number | null }[]
}

export interface NastavnikHomework extends LectureRef {
  created_at: string
  has_homework: boolean
  /** ISO date from the HOMEWORK block, if any. */
  due: string | null
  tasks: number
  overdue: boolean
  done: number
  undone: number
  registered: number
  done_pct: number | null
  k_hidden: boolean
  last_done_at: string | null
}

export interface NastavnikAuthor {
  id: string
  name: string
  role: string | null
  lectures: number
  last_published: string | null
}

/** Return shape of `nastavnik_stats()` = body of GET /api/nastavnik/stats. */
export interface NastavnikStats {
  meta: NastavnikMeta
  kpi: {
    lectures_total: number
    lectures_published: Kpi
    opens: Kpi
    reads: Kpi
    quizzes: Kpi
    avg_score: Kpi
    students_reached: Kpi
    first_read_lag_h: Kpi
    first_read_lag_h_all: number | null
    homework_done_pct: number | null
    abandon_rate: number | null
    stale_lectures: number
  }
  /** Newest first. */
  lectures: NastavnikLecture[]
  classes: NastavnikClass[]
  homework: NastavnikHomework[]
  moderation: {
    photos_pending: number
    oldest_pending_h: number | null
    photos_moderated_by_me: number
    ai_drafts: { pending: number; done: number; error: number; total: number }
  }
  /** Everyone who authored lectures — the teacher picker for admin/direktor. */
  authors: NastavnikAuthor[]
  signals: Signal[]
}

// ---------------------------------------------------------------------------
// direktor_students(class, section) = GET /api/direktor/students
// ---------------------------------------------------------------------------

export interface AtRiskStudent {
  name: string
  /** 'profile' = registered account, 'roster' = matched only in verified_students (seed). */
  source: 'profile' | 'roster'
  class_number: number | null
  section_number: number | null
  reasons: string[]
  score: number
  last_active: string | null
  inactive_days: number
}

export interface DirektorStudents {
  class_number: number
  section_number: number
  students_total: number
  registered: number
  generated_at: string
  at_risk: AtRiskStudent[]
}

// ---------------------------------------------------------------------------
// analysis_jobs rows as served by /api/direktor/analysis
// ---------------------------------------------------------------------------

export interface AnalysisJob {
  id: string
  kind: AnalysisKind
  scope: AnalysisScope
  question: string | null
  status: AnalysisStatus
  output: AnalysisOutput | null
  model: string | null
  created_at: string
  finished_at: string | null
  error: string | null
  /** Indexes of recommendations marked done (analysis_actions). */
  actions_done: number[]
}
