import { rpcJson } from '@/lib/direktor-api'
import type { AnalysisOutput, AnalysisScope } from '@/lib/direktor-types'

/**
 * PRIVACY CONTRACT for the AI analysis (spec §4.1) — the code-level statement
 * that the Ministry's IT department can audit. Mirrors the SQL comment on
 * public.build_analysis_snapshot() in
 * supabase/migrations/20260914000700_nastavnik_stats_snapshot.sql and the
 * worker-side copy in tools/lekcija-worker.mjs (section "AI analiza").
 *
 *  1. The model only ever receives the object returned by
 *     `buildAnalysisSnapshot()`; nothing else from the database is sent.
 *  2. That object is built exclusively from aggregates (direktor_stats()):
 *     NO user_id, NO e-mail, NO pupil name, NO teacher or moderator name,
 *     NO session id, NO device identifier.
 *  3. Pupils at risk are passed only as {class_number, section_number,
 *     reasons, score} — never an identifier.
 *  4. Teachers are passed as anonymous rows {subject, lectures, opens, reads,
 *     avg_score, days_since_publish}.
 *  5. Any group under `meta.k_min` (5) pupils is already NULL in the input.
 *  6. Lecture / news / event titles are public school content and are kept.
 *  7. There is NO natural-language-to-SQL: "Pitaj podatke" answers from this
 *     same snapshot. If the answer is not in it, the model must say
 *     "Nemam te podatke u pregledu".
 *  8. The snapshot is stored verbatim in analysis_jobs.input_snapshot so every
 *     report can be reproduced and inspected ("what the AI sees" in the panel).
 *  9. The model is never called from Next.js: tools/lekcija-worker.mjs claims
 *     pending analysis_jobs, reuses the stored snapshot (or builds one with the
 *     same SQL function when a scheduled/seeded job has none), and writes
 *     `output` only after it passes the schema check mirrored below.
 */

export const SNAPSHOT_MAX_BYTES = 32 * 1024

export type AnalysisSnapshot = Record<string, unknown> & {
  _privacy: string
  scope: AnalysisScope
}

/** Server-only. Builds the aggregates-only snapshot for one analysis scope. */
export async function buildAnalysisSnapshot(scope: Partial<AnalysisScope>): Promise<AnalysisSnapshot> {
  const snapshot = await rpcJson<AnalysisSnapshot>('build_analysis_snapshot', { scope })
  assertSnapshotIsAnonymous(snapshot)
  return snapshot
}

const FORBIDDEN_KEYS = new Set(['user_id', 'email', 'name', 'session_id', 'sid', 'author_id', 'moderator_id', 'first_name', 'last_name'])

/**
 * Defence in depth: refuses to hand over a snapshot that carries an
 * identifier-shaped key anywhere in the tree. The SQL side already strips
 * them; this makes a regression loud instead of silent.
 */
export function assertSnapshotIsAnonymous(value: unknown, path = ''): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertSnapshotIsAnonymous(v, `${path}[${i}]`))
    return
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(k)) {
        throw new Error(`analysis snapshot contains a forbidden key "${k}" at ${path || '$'}`)
      }
      assertSnapshotIsAnonymous(v, path ? `${path}.${k}` : k)
    }
  }
}

// ---------------------------------------------------------------------------
// Output contract (spec §4.2) — same checks as validateAnalysisOutput() in the
// worker, so the panel can trust `analysis_jobs.output` before rendering it.
// ---------------------------------------------------------------------------

export const ANALYSIS_VERDICTS = ['dobro', 'pažnja', 'problem'] as const
export const ANALYSIS_SEVERITIES = ['info', 'warn', 'critical'] as const
export const ANALYSIS_WHO = ['direktor', 'razredni', 'nastavnik', 'pedagog'] as const
export const ANALYSIS_EFFORTS = ['nisko', 'srednje', 'visoko'] as const
export const ANALYSIS_CONFIDENCES = ['niska', 'srednja', 'visoka'] as const

/** Literal shown by the model when the answer is not in the snapshot (spec §4.4). */
export const NO_DATA_ANSWER = 'Nemam te podatke u pregledu'

const isStr = (v: unknown): v is string => typeof v === 'string'
const isIn = <T extends readonly string[]>(list: T, v: unknown): v is T[number] => isStr(v) && (list as readonly string[]).includes(v)
const isStrList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr)
const isRec = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Type guard for a stored worker report; rejects anything outside the schema. */
export function isAnalysisOutput(v: unknown): v is AnalysisOutput {
  if (!isRec(v)) return false
  if (!isStr(v.summary) || !isIn(ANALYSIS_VERDICTS, v.health_verdict) || !isIn(ANALYSIS_CONFIDENCES, v.confidence)) return false
  if (!Array.isArray(v.insights) || !v.insights.every((i) => isRec(i) && isStr(i.title) && isStr(i.detail) && isStr(i.metric) && isStr(i.delta) && isIn(ANALYSIS_SEVERITIES, i.severity) && isStr(i.link))) return false
  if (!Array.isArray(v.recommendations) || !v.recommendations.every((r) => isRec(r) && isStr(r.action) && isStr(r.why) && isIn(ANALYSIS_WHO, r.who) && isIn(ANALYSIS_EFFORTS, r.effort))) return false
  if (!Array.isArray(v.anomalies) || !v.anomalies.every((a) => isRec(a) && isStr(a.what) && isStr(a.when) && isStr(a.possible_cause))) return false
  const risk = v.risk_summary
  if (!isRec(risk) || typeof risk.students_at_risk !== 'number' || !isStrList(risk.classes_to_watch) || !isStrList(risk.subjects_to_watch)) return false
  return isStrList(v.questions_for_staff) && isStrList(v.data_caveats)
}
