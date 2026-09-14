import { NextResponse } from 'next/server'
import { z } from 'zod'
import { DIREKTOR_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { parseBody, uuidSchema } from '@/lib/api-validation'
import { createServiceClient } from '@/lib/supabase/service'
import { forbidden, serverError } from '@/lib/direktor-api'

/**
 * POST /api/direktor/actions  { job_id, index, done }
 *
 * "Označi urađeno" on one AI recommendation (analysis_actions). `index` is
 * the position in `output.recommendations` of the given analysis job;
 * `done: false` clears the mark. Roles: direktor / admin / creator / pedagog.
 * Responds with the full list of done indexes for that job.
 */
const BodySchema = z.object({
  job_id: uuidSchema,
  index: z.number().int().min(0).max(99),
  done: z.boolean().default(true),
})

export async function POST(request: Request) {
  const caller = await getCallerProfile()
  if (!caller || !hasRole(caller, DIREKTOR_ROLES)) return forbidden()

  const parsed = await parseBody(request, BodySchema)
  if (!parsed.ok) return parsed.response
  const { job_id, index, done } = parsed.data

  const admin = createServiceClient()
  const { data: job, error: jobError } = await admin
    .from('analysis_jobs')
    .select('id, output')
    .eq('id', job_id)
    .maybeSingle()
  if (jobError) {
    console.error('direktor/actions job lookup failed', jobError.message)
    return serverError('Failed')
  }
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const recommendations = (job.output as { recommendations?: unknown[] } | null)?.recommendations
  if (!Array.isArray(recommendations) || index >= recommendations.length) {
    return NextResponse.json({ error: 'No such recommendation' }, { status: 400 })
  }

  const { error } = done
    ? await admin
        .from('analysis_actions')
        .upsert({ job_id, index, done_by: caller.id, done_at: new Date().toISOString() }, { onConflict: 'job_id,index' })
    : await admin.from('analysis_actions').delete().eq('job_id', job_id).eq('index', index)

  if (error) {
    console.error('direktor/actions write failed', error.message)
    return serverError('Failed')
  }

  const { data: rows } = await admin.from('analysis_actions').select('index').eq('job_id', job_id)
  const actions_done = (rows ?? []).map((r) => r.index as number).sort((a, b) => a - b)
  return NextResponse.json({ ok: true, job_id, actions_done })
}
