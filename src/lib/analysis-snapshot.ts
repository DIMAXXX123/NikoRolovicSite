import { rpcJson } from '@/lib/direktor-api'
import type { AnalysisScope } from '@/lib/direktor-types'

/**
 * PRIVACY CONTRACT for the AI analysis (spec §4.1) — the code-level statement
 * that the Ministry's IT department can audit. Mirrors the SQL comment on
 * public.build_analysis_snapshot() in
 * supabase/migrations/20260914000700_nastavnik_stats_snapshot.sql.
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
 *     report can be reproduced and inspected.
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
