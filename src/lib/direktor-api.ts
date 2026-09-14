import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import type { CallerProfile } from '@/lib/api-auth'
import { DIREKTOR_PERIODS, type DirektorPeriod } from '@/lib/direktor-types'

/**
 * Server-only helpers shared by the /api/direktor/* and /api/nastavnik/*
 * route handlers. Never import from a 'use client' module.
 *
 * Roles are checked in the routes with src/lib/api-auth.ts; the SQL functions
 * are then called with the service key, so their own role guard sees
 * auth.role() = 'service_role' and lets the call through.
 */

export const periodSchema = z.enum(DIREKTOR_PERIODS as [DirektorPeriod, ...DirektorPeriod[]]).default('7d')

/** Optional class 1–4 / section 1–6 as sent in query strings ("" = not set). */
export const optionalClassSchema = z
  .union([z.literal(''), z.coerce.number().int().min(1).max(4)])
  .optional()
  .transform((v) => (v === '' || v === undefined ? null : v))

export const optionalSectionSchema = z
  .union([z.literal(''), z.coerce.number().int().min(1).max(6)])
  .optional()
  .transform((v) => (v === '' || v === undefined ? null : v))

export const optionalSubjectSchema = z
  .string()
  .trim()
  .max(60)
  .optional()
  .transform((v) => (v ? v : null))

export const StatsQuerySchema = z.object({
  period: periodSchema,
  class: optionalClassSchema,
  section: optionalSectionSchema,
  subject: optionalSubjectSchema,
})

export type StatsQuery = z.output<typeof StatsQuerySchema>

/** `Cache-Control` for the stats endpoints (spec §2.3). */
export const STATS_CACHE_CONTROL = 'private, max-age=300'

export function forbidden() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}

export function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 })
}

/**
 * Calls a JSON-returning SQL function with the service key.
 * Throws with the Postgres message on failure (the routes map that to 500).
 */
export async function rpcJson<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const admin = createServiceClient()
  const { data, error } = await admin.rpc(fn, args)
  if (error) throw new Error(`${fn}: ${error.message}`)
  return data as T
}

export async function fetchDirektorStats<T>(q: StatsQuery): Promise<T> {
  return rpcJson<T>('direktor_stats_cached', {
    period: q.period,
    class_number: q.class,
    section_number: q.section,
    subject: q.subject,
  })
}

/**
 * Appends one audit_log row (spec §1.4: every pupil list, export and AI
 * request is logged). Failures are logged, never thrown — an audit hiccup
 * must not break the panel, but it must be visible in the server logs.
 */
export async function writeAudit(
  caller: CallerProfile,
  action: string,
  tableName: string,
  recordId: string | null,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    const admin = createServiceClient()
    const { error } = await admin.from('audit_log').insert({
      user_id: caller.id,
      action,
      table_name: tableName,
      record_id: recordId,
      details: { ...details, role: caller.role },
    })
    if (error) console.error('audit_log insert failed', action, error.message)
  } catch (err) {
    console.error('audit_log unavailable', action, err)
  }
}

/** CSV cell: quotes when needed, never leaks a formula (leading = + - @). */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  let s = Array.isArray(v) ? v.join('; ') : typeof v === 'object' ? JSON.stringify(v) : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header.map(csvCell).join(',')]
  for (const r of rows) lines.push(r.map(csvCell).join(','))
  // BOM so Excel opens the Montenegrin diacritics correctly.
  return String.fromCharCode(0xfeff) + lines.join('\r\n') + '\r\n'
}
