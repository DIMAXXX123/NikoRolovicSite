import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SKOLA_WRITE_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { parseBody } from '@/lib/api-validation'
import { forbidden, rpcJson, serverError } from '@/lib/direktor-api'

/**
 * POST /api/skola/import  { kind: 'grades' | 'absences', text }
 *
 * Paste-import for staff until the school has MEIS access. One row per line,
 * fields separated by ; , or TAB. Header line optional.
 *
 *   grades:    razred;odjeljenje;predmet;ocjena;datum[;tip][;ucenik]
 *              2;3;Matematika;4;2026-09-12;pismeni;Marko P.
 *   absences:  razred;odjeljenje;datum;sati;opravdano[;ucenik]
 *              2;3;2026-09-12;3;ne;Marko P.
 *
 * `ucenik` (name or any id) groups rows into one pupil for the k-anonymity
 * counts; without it every row counts as a separate pupil.
 * Returns { inserted, skipped, errors: [{line, reason}] } — at most 2000 lines.
 */

const BodySchema = z.object({
  kind: z.enum(['grades', 'absences']),
  text: z.string().min(1).max(200_000),
})

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const DATE_EU_RE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/

function parseDate(s: string): string | null {
  const t = s.trim()
  let m = DATE_RE.exec(t)
  if (m) return t
  m = DATE_EU_RE.exec(t)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function splitLine(line: string): string[] {
  const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ','
  return line.split(sep).map((c) => c.trim())
}

export async function POST(request: Request) {
  const caller = await getCallerProfile()
  if (!caller || !hasRole(caller, SKOLA_WRITE_ROLES)) return forbidden()

  const parsed = await parseBody(request, BodySchema)
  if (!parsed.ok) return parsed.response
  const { kind, text } = parsed.data

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 2000)
  const errors: { line: number; reason: string }[] = []
  const grades: Record<string, unknown>[] = []
  const absences: Record<string, unknown>[] = []

  lines.forEach((line, i) => {
    const cols = splitLine(line)
    if (i === 0 && /razred|odjeljenje|predmet|datum/i.test(line)) return // header
    const cls = Number(cols[0])
    const sec = Number(cols[1])
    if (!(cls >= 1 && cls <= 4) || !(sec >= 1 && sec <= 6)) return void errors.push({ line: i + 1, reason: 'razred/odjeljenje' })
    if (caller.role === 'razredni' && (caller.homeroom_class !== cls || caller.homeroom_section !== sec)) {
      return void errors.push({ line: i + 1, reason: 'nije tvoje odjeljenje' })
    }
    if (kind === 'grades') {
      const subject = cols[2] ?? ''
      const grade = Number(cols[3])
      const date = parseDate(cols[4] ?? '')
      const type = cols[5] ? cols[5].slice(0, 30) : null
      const pupil = cols[6] ? slug(cols[6]) : `r${i + 1}`
      if (!subject || subject.length > 60) return void errors.push({ line: i + 1, reason: 'predmet' })
      if (!(grade >= 1 && grade <= 5) || !Number.isInteger(grade)) return void errors.push({ line: i + 1, reason: 'ocjena 1–5' })
      if (!date) return void errors.push({ line: i + 1, reason: 'datum (GGGG-MM-DD ili DD.MM.GGGG)' })
      grades.push({
        student_key: `manual:${cls}-${sec}:${pupil}`,
        class_number: cls,
        section_number: sec,
        subject,
        grade,
        grade_type: type,
        graded_on: date,
        source: 'manual',
        created_by: caller.id,
      })
    } else {
      const date = parseDate(cols[2] ?? '')
      const hours = Number(cols[3] ?? '1')
      const just = (cols[4] ?? '').toLowerCase()
      const pupil = cols[5] ? slug(cols[5]) : `r${i + 1}`
      if (!date) return void errors.push({ line: i + 1, reason: 'datum' })
      if (!(hours >= 1 && hours <= 8) || !Number.isInteger(hours)) return void errors.push({ line: i + 1, reason: 'sati 1–8' })
      const justified = /^(da|yes|1|true|opravdan)/.test(just) ? true : /^(ne|no|0|false|neopravdan)/.test(just) ? false : null
      absences.push({
        student_key: `manual:${cls}-${sec}:${pupil}`,
        class_number: cls,
        section_number: sec,
        absent_on: date,
        hours,
        justified,
        source: 'manual',
        created_by: caller.id,
      })
    }
  })

  const rows = kind === 'grades' ? grades : absences
  if (rows.length === 0) return NextResponse.json({ inserted: 0, skipped: 0, errors })

  try {
    const inserted = await rpcJson<number>('school_import', { p_kind: kind, p_rows: rows })
    return NextResponse.json({ inserted, skipped: rows.length - inserted, errors })
  } catch (err) {
    console.error('skola/import failed', err)
    return serverError('Uvoz nije uspio')
  }
}
