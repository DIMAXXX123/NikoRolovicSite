import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { parseBody, uuidSchema } from '@/lib/api-validation'
import { APP_EVENTS, MAX_BATCH } from '@/lib/analytics'

/**
 * POST /api/track — receives a batch of client events (src/lib/analytics.ts)
 * and appends them to app_events.
 *
 * Identity is taken from the session cookie only: whatever the client claims,
 * rows are written with the caller's own user_id (or NULL for guests) and the
 * role / class / section are copied from their profile at insert time.
 */

const MAX_META_BYTES = 2048
const MAX_SUBJECT = 60
const MAX_SESSION = 80
/** Client timestamps older than this (or in the future) are replaced by now(). */
const MAX_SKEW_MS = 6 * 60 * 60 * 1000

const EventSchema = z.object({
  event: z.enum(APP_EVENTS),
  entity_id: uuidSchema.nullable().optional(),
  subject: z.string().trim().max(MAX_SUBJECT).nullable().optional(),
  value: z.number().finite().nullable().optional(),
  meta: z.record(z.string().max(40), z.unknown()).optional(),
  ts: z.number().finite().optional(),
})

const BatchSchema = z.object({
  session_id: z.string().trim().max(MAX_SESSION).optional(),
  platform: z.enum(['pwa', 'browser']).optional(),
  os: z.string().trim().max(20).optional(),
  events: z.array(EventSchema).min(1).max(MAX_BATCH),
})

function boundedMeta(meta: Record<string, unknown> | undefined, os: string | undefined) {
  const base: Record<string, unknown> = {}
  if (meta) {
    const json = JSON.stringify(meta)
    if (json.length <= MAX_META_BYTES) Object.assign(base, meta)
    else base.truncated = true
  }
  // Never trust a client-set seed flag — seeded rows come only from the script.
  delete base.seed
  delete base.sid
  if (os) base.os = os
  return base
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const rate = await checkRateLimit(`track:${ip}`, 60, 60_000)
  if (rate.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    )
  }

  const parsed = await parseBody(req, BatchSchema)
  if (!parsed.ok) return parsed.response
  const { session_id, platform, os, events } = parsed.data

  let userId: string | null = null
  let role: string | null = null
  let classNumber: number | null = null
  let sectionNumber: number | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      const admin = createServiceClient()
      const { data: profile } = await admin
        .from('profiles')
        .select('role, class_number, section_number')
        .eq('id', user.id)
        .maybeSingle()
      if (profile) {
        role = (profile.role as string | null) ?? null
        classNumber = (profile.class_number as number | null) ?? null
        sectionNumber = (profile.section_number as number | null) ?? null
      }
    }
  } catch {
    // Anonymous row — a broken cookie must not lose the batch.
  }

  const now = Date.now()
  const rows = events.map((e) => {
    const ts = typeof e.ts === 'number' && now - e.ts >= 0 && now - e.ts < MAX_SKEW_MS ? e.ts : now
    return {
      user_id: userId,
      role,
      class_number: classNumber,
      section_number: sectionNumber,
      event: e.event,
      entity_id: e.entity_id ?? null,
      subject: e.subject ?? null,
      value: e.value ?? null,
      meta: boundedMeta(e.meta, os),
      session_id: session_id ?? null,
      platform: platform ?? null,
      created_at: new Date(ts).toISOString(),
    }
  })

  try {
    const admin = createServiceClient()
    const { error } = await admin.from('app_events').insert(rows)
    if (error) {
      console.error('track: insert failed', error.message)
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }
  } catch (err) {
    console.error('track: service client unavailable', err)
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }

  return new NextResponse(null, { status: 204 })
}
