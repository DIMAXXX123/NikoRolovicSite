import { NextResponse } from 'next/server'
import { z } from 'zod'
import { DIREKTOR_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { parseBody, parseSearchParams, uuidSchema } from '@/lib/api-validation'
import { createServiceClient } from '@/lib/supabase/service'
import { buildAnalysisSnapshot } from '@/lib/analysis-snapshot'
import {
  forbidden,
  optionalClassSchema,
  optionalSectionSchema,
  optionalSubjectSchema,
  periodSchema,
  serverError,
  writeAudit,
} from '@/lib/direktor-api'
import type { AnalysisJob, AnalysisScope } from '@/lib/direktor-types'

/**
 * AI analysis jobs (spec §4). The model is never called from here: this route
 * only creates rows in analysis_jobs with an aggregates-only input_snapshot;
 * tools/lekcija-worker.mjs picks them up and writes `output`.
 *
 * GET  /api/direktor/analysis            → { jobs: AnalysisJob[] } (latest 20, newest first)
 * GET  /api/direktor/analysis?kind=question → only "Pitaj podatke" jobs
 * GET  /api/direktor/analysis?id=<uuid>  → { job: AnalysisJob } (with input_snapshot)
 * POST /api/direktor/analysis            → { job, cached }  (201 when a new job was queued)
 *      body { kind: 'adhoc' | 'question', question?, period, class?, section?, subject? }
 *
 * Limits: 5 adhoc/question jobs per local day for the whole school (429 when
 * exceeded). A question with the same text and scope that already finished
 * is returned from cache instead of queued again. Every POST is audited.
 */

const ADHOC_DAILY_LIMIT = 5
const LIST_LIMIT = 20

const JOB_COLUMNS = 'id, kind, scope, question, status, output, model, created_at, finished_at, error'

const ListQuerySchema = z.object({
  id: z.union([z.literal(''), uuidSchema]).optional().transform((v) => (v ? v : null)),
  kind: z.enum(['daily', 'weekly', 'adhoc', 'question']).optional(),
})

const CreateSchema = z
  .object({
    kind: z.enum(['adhoc', 'question']).default('adhoc'),
    question: z.string().trim().min(3).max(300).optional(),
    period: periodSchema,
    class: optionalClassSchema,
    section: optionalSectionSchema,
    subject: optionalSubjectSchema,
    compare: z.enum(['prev_week']).optional(),
  })
  .refine((b) => b.kind !== 'question' || !!b.question, { message: 'question is required', path: ['question'] })

type JobRow = Omit<AnalysisJob, 'actions_done'>

async function attachActions(admin: ReturnType<typeof createServiceClient>, jobs: JobRow[]): Promise<AnalysisJob[]> {
  if (jobs.length === 0) return []
  const { data } = await admin
    .from('analysis_actions')
    .select('job_id, index')
    .in(
      'job_id',
      jobs.map((j) => j.id)
    )
  const byJob = new Map<string, number[]>()
  for (const row of data ?? []) {
    const list = byJob.get(row.job_id as string) ?? []
    list.push(row.index as number)
    byJob.set(row.job_id as string, list)
  }
  return jobs.map((j) => ({ ...j, actions_done: (byJob.get(j.id) ?? []).sort((a, b) => a - b) }))
}

/** Start of today in Europe/Podgorica as an ISO instant, for the daily quota. */
function localDayStartIso(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Podgorica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZoneName: 'longOffset',
  })
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]))
  // "GMT+02:00" -> "+02:00"; plain "GMT" -> "+00:00"
  const offset = (parts.timeZoneName ?? 'GMT').replace('GMT', '') || '+00:00'
  return new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00${offset}`).toISOString()
}

export async function GET(request: Request) {
  const caller = await getCallerProfile()
  if (!caller || !hasRole(caller, DIREKTOR_ROLES)) return forbidden()

  const parsed = parseSearchParams(request, ListQuerySchema)
  if (!parsed.ok) return parsed.response
  const { id, kind } = parsed.data

  const admin = createServiceClient()

  if (id) {
    const { data, error } = await admin
      .from('analysis_jobs')
      .select(`${JOB_COLUMNS}, input_snapshot`)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      console.error('direktor/analysis get failed', error.message)
      return serverError('Failed')
    }
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const [job] = await attachActions(admin, [data as unknown as JobRow])
    return NextResponse.json({ job: { ...job, input_snapshot: (data as { input_snapshot: unknown }).input_snapshot } })
  }

  let query = admin.from('analysis_jobs').select(JOB_COLUMNS).order('created_at', { ascending: false }).limit(LIST_LIMIT)
  query = kind ? query.eq('kind', kind) : query.neq('kind', 'question')
  const { data, error } = await query
  if (error) {
    console.error('direktor/analysis list failed', error.message)
    return serverError('Failed')
  }
  const jobs = await attachActions(admin, (data ?? []) as unknown as JobRow[])
  return NextResponse.json({ jobs })
}

export async function POST(request: Request) {
  const caller = await getCallerProfile()
  if (!caller || !hasRole(caller, DIREKTOR_ROLES)) return forbidden()

  const parsed = await parseBody(request, CreateSchema)
  if (!parsed.ok) return parsed.response
  const body = parsed.data

  const scope: AnalysisScope = {
    period: body.period,
    class: body.class,
    section: body.section,
    subject: body.subject,
    ...(body.compare ? { compare: body.compare } : {}),
  }
  const question = body.kind === 'question' ? body.question!.replace(/\s+/g, ' ') : null

  const admin = createServiceClient()

  try {
    // Cache / dedupe: same kind + scope (+ question) that is finished or still queued.
    const scopeMatch = admin
      .from('analysis_jobs')
      .select(JOB_COLUMNS)
      .eq('kind', body.kind)
      .contains('scope', { period: scope.period, class: scope.class, section: scope.section, subject: scope.subject })
      .in('status', ['pending', 'processing', 'done'])
      .order('created_at', { ascending: false })
      .limit(5)
    const { data: candidates, error: candError } = question
      ? await scopeMatch.ilike('question', question.replace(/[\\%_]/g, '\\$&'))
      : await scopeMatch
    if (candError) throw new Error(candError.message)

    const reusable = (candidates ?? []).find((j) =>
      body.kind === 'question'
        ? true
        : j.status !== 'done' || Date.now() - Date.parse(j.created_at as string) < 60 * 60 * 1000
    )
    if (reusable) {
      const [job] = await attachActions(admin, [reusable as unknown as JobRow])
      return NextResponse.json({ job, cached: true })
    }

    const { count, error: countError } = await admin
      .from('analysis_jobs')
      .select('id', { count: 'exact', head: true })
      .in('kind', ['adhoc', 'question'])
      .gte('created_at', localDayStartIso())
    if (countError) throw new Error(countError.message)
    if ((count ?? 0) >= ADHOC_DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Dnevni limit AI analiza je iskorišćen', limit: ADHOC_DAILY_LIMIT, used: count },
        { status: 429 }
      )
    }

    const snapshot = await buildAnalysisSnapshot(scope)

    const { data: inserted, error: insertError } = await admin
      .from('analysis_jobs')
      .insert({
        kind: body.kind,
        scope,
        question,
        status: 'pending',
        input_snapshot: snapshot,
        created_by: caller.id,
      })
      .select(JOB_COLUMNS)
      .single()
    if (insertError) throw new Error(insertError.message)

    await writeAudit(caller, 'direktor.analysis', 'analysis_jobs', inserted.id as string, {
      kind: body.kind,
      scope,
      question,
    })

    const [job] = await attachActions(admin, [inserted as unknown as JobRow])
    return NextResponse.json({ job, cached: false }, { status: 201 })
  } catch (err) {
    console.error('direktor/analysis create failed', err)
    return serverError('Failed to queue analysis')
  }
}
