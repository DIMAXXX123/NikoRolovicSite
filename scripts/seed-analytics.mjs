#!/usr/bin/env node
/**
 * Demo telemetry for the Direktor / Nastavnik panels (docs/DIRECTOR_DASHBOARD.md §1.5).
 *
 *   node scripts/seed-analytics.mjs           # generate 90 days of app_events / quiz_results / lecture_progress_srv
 *   node scripts/seed-analytics.mjs --reset   # delete everything this script created (meta.seed = true), then exit
 *   node scripts/seed-analytics.mjs --reset --seed   # wipe and regenerate
 *   node scripts/seed-analytics.mjs --dry     # generate in memory and print counts only
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local (or the environment).
 * Writes through PostgREST with the service key in batches of 1000 rows.
 *
 * Model (deterministic: seeded PRNG, same output on every run):
 *  - every row of verified_students is a pupil; when a profile with the same
 *    name + class + section exists, user_id = profile.id, otherwise NULL.
 *    Every seeded row carries meta.sid = verified_students.id (the stable
 *    student key for retention / at-risk) and meta.seed = true.
 *  - cohorts: 55 % weekly-active, 25 % ~monthly, 20 % installed and left;
 *  - weekday factor Mon–Fri 1.0, Sat–Sun 0.2; session hours peak 07:15–07:45 and 19:00–22:00;
 *  - one section (FALLING_CLASS) loses ~70 % of its activity across the window;
 *  - per-subject quiz averages (Matematika 61 … Engleski 80) with two "problem" lectures avg < 50 %;
 *  - at-risk pupils: silent for the last 14+ days, falling scores, or serial quiz abandons;
 *  - one viral news item (3-day spike) and one flop; search queries with zero results (content gaps);
 *  - a handful of guest sessions per day (user_id NULL, no sid).
 *
 * Timestamps are stored in UTC; local (Europe/Podgorica, UTC+2 in the window)
 * hours are what the heatmap expects — convert with AT TIME ZONE in the views.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DAYS = 90
const SEED = 20260914
const BATCH = 1000
const TZ_OFFSET_H = 2 // Europe/Podgorica (CEST) during the seeded window
const FALLING_CLASS = { class: 3, section: 4 }
const SUBJECT_AVG = {
  Matematika: 61,
  Fizika: 58,
  Hemija: 64,
  Biologija: 72,
  Istorija: 78,
  Geografija: 74,
  'Engleski jezik': 80,
  CSBH: 70,
}
const SUBJECT_WEIGHT = {
  Matematika: 1.5,
  Fizika: 1.0,
  Hemija: 0.9,
  Biologija: 1.1,
  Istorija: 1.2,
  Geografija: 0.8,
  'Engleski jezik': 1.3,
  CSBH: 1.0,
}
const SEARCH_QUERIES = [
  // [query, results]
  ['pitagorina teorema', 3],
  ['fotosinteza', 2],
  ['logaritmi', 4],
  ['drugi svjetski rat', 5],
  ['kvadratna jednačina', 6],
  ['ćelija', 3],
  ['present perfect', 2],
  ['balkanski ratovi', 2],
  ['trigonometrija', 0],
  ['integrali', 0],
  ['ćelijsko disanje', 0],
  ['prvi svjetski rat', 0],
  ['njutnovi zakoni', 1],
  ['periodni sistem', 2],
  ['genetika', 0],
  ['padeži', 0],
]
const SCREENS = ['/news', '/lectures', '/events', '/gallery', '/profile', '/schedule', '/grades', '/game', '/teachers', '/ednevnik', '/tournament']

// ---------------------------------------------------------------------------
// Env + PostgREST
// ---------------------------------------------------------------------------

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const value = m[2].replace(/^["']|["']$/g, '')
      if (!process.env[m[1]]) process.env[m[1]] = value
    }
  } catch {
    // no .env.local — rely on the environment
  }
}
loadEnv()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY
const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry')

if (!URL || !SK) {
  console.error('seed-analytics: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (.env.local)')
  process.exit(1)
}

const headers = {
  apikey: SK,
  Authorization: `Bearer ${SK}`,
  'Content-Type': 'application/json',
}

async function rest(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers, ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 400)}`)
  return text ? JSON.parse(text) : null
}

async function fetchAll(path) {
  const out = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const rows = await rest('GET', path, undefined, { Range: `${from}-${from + PAGE - 1}`, 'Range-Unit': 'items' })
    out.push(...rows)
    if (rows.length < PAGE) break
  }
  return out
}

async function insertBatches(table, rows, label, prefer = 'return=minimal') {
  let done = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    await rest('POST', table, chunk, { Prefer: prefer })
    done += chunk.length
    process.stdout.write(`\r  ${label}: ${done}/${rows.length}`)
  }
  process.stdout.write('\n')
}

async function countSeeded(table, col = 'meta') {
  const res = await fetch(`${URL}/rest/v1/${table}?select=id&${col}->>seed=eq.true&limit=1`, {
    headers: { ...headers, Prefer: 'count=exact' },
  })
  const range = res.headers.get('content-range') || '0/0'
  return Number(range.split('/')[1] || 0)
}

async function reset() {
  console.log('Reset: deleting seeded rows…')
  // lecture_progress_srv has no id column; PostgREST DELETE needs a filter only.
  await rest('DELETE', 'lecture_progress_srv?meta->>seed=eq.true', undefined, { Prefer: 'return=minimal' })
  await rest('DELETE', 'quiz_results?meta->>seed=eq.true', undefined, { Prefer: 'return=minimal' })
  // app_events can be large — delete in id ranges to keep each statement short.
  for (;;) {
    const rows = await rest('GET', 'app_events?select=id&meta->>seed=eq.true&order=id.asc&limit=5000')
    if (!rows.length) break
    const maxId = rows[rows.length - 1].id
    await rest('DELETE', `app_events?meta->>seed=eq.true&id=lte.${maxId}`, undefined, { Prefer: 'return=minimal' })
    process.stdout.write(`\r  app_events: deleted up to id ${maxId}`)
  }
  process.stdout.write('\n')
  // analysis_actions rows cascade with their job.
  await rest('DELETE', 'analysis_jobs?scope->>seed=eq.true', undefined, { Prefer: 'return=minimal' })
  console.log('Reset done.')
}

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) + helpers
// ---------------------------------------------------------------------------

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(SEED)
const chance = (p) => rnd() < p
const between = (a, b) => a + rnd() * (b - a)
const int = (a, b) => Math.floor(between(a, b + 1))
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
function gauss(mean = 0, sd = 1) {
  const u = 1 - rnd()
  const v = rnd()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
function weightedPick(items, weightOf) {
  let total = 0
  for (const it of items) total += weightOf(it)
  let r = rnd() * total
  for (const it of items) {
    r -= weightOf(it)
    if (r <= 0) return it
  }
  return items[items.length - 1]
}
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))
const norm = (s) => (s || '').toString().trim().toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')

/** Session start hour (local): peaks 07:15–07:45 and 19:00–22:00. */
function sessionMinuteOfDay() {
  const r = rnd()
  if (r < 0.22) return 7 * 60 + int(15, 45)
  if (r < 0.62) return 19 * 60 + int(0, 179)
  if (r < 0.85) return int(12 * 60, 17 * 60)
  if (r < 0.95) return int(8 * 60, 12 * 60)
  return int(22 * 60, 23 * 60 + 59)
}

// ---------------------------------------------------------------------------
// Load reference data
// ---------------------------------------------------------------------------

async function loadRefs() {
  const [students, profiles, lecturesRaw, news, events, photos] = await Promise.all([
    fetchAll('verified_students?select=id,first_name,last_name,class_number,section_number&order=id.asc'),
    fetchAll('profiles?select=id,first_name,last_name,class_number,section_number,role&order=id.asc'),
    fetchAll('lectures?select=id,subject,class_number,author_id,created_at,content&order=id.asc'),
    fetchAll('news?select=id,created_at&order=created_at.asc'),
    fetchAll('events?select=id,event_date&order=event_date.asc'),
    fetchAll('photos?select=id,created_at,status&order=created_at.asc'),
  ])

  const profileByKey = new Map()
  for (const p of profiles) {
    if (p.role !== 'student') continue
    profileByKey.set(`${norm(p.first_name)}|${norm(p.last_name)}|${p.class_number}|${p.section_number}`, p.id)
  }

  const lectures = lecturesRaw.map((l) => {
    let questions = 0
    let flashcards = 0
    const m = (l.content || '').match(/(?:<!--\s*)?QUIZ_DATA:([\s\S]*?):QUIZ_DATA(?:\s*-->)?/)
    if (m) {
      try {
        const parsed = JSON.parse(m[1])
        if (Array.isArray(parsed)) questions = parsed.length
        else if (parsed && typeof parsed === 'object') {
          questions = Array.isArray(parsed.questions) ? parsed.questions.length : 0
          flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards.length : 0
        }
      } catch {
        // no quiz
      }
    }
    return { id: l.id, subject: l.subject, class_number: l.class_number, author_id: l.author_id, questions, flashcards }
  })

  return { students, profileByKey, lectures, news, events, photos }
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

function buildPupils(students, profileByKey) {
  return students.map((s, i) => {
    const r = rnd()
    const cohort = r < 0.55 ? 'weekly' : r < 0.8 ? 'monthly' : 'churned'
    const sid = s.id
    const key = `${norm(s.first_name)}|${norm(s.last_name)}|${s.class_number}|${s.section_number}`
    const userId = profileByKey.get(key) ?? null
    // At-risk archetypes (weekly cohort only, ~9 %): 'silent' stops mid-window,
    // 'falling' loses ~25 points over the window, 'abandoner' quits quizzes.
    let risk = null
    if (cohort === 'weekly') {
      const q = rnd()
      if (q < 0.035) risk = 'silent'
      else if (q < 0.065) risk = 'falling'
      else if (q < 0.09) risk = 'abandoner'
    }
    const platform = chance(0.45) ? 'pwa' : 'browser'
    const osR = rnd()
    const os = osR < 0.6 ? 'android' : osR < 0.9 ? 'ios' : 'windows'
    return {
      idx: i,
      sid,
      userId,
      class: s.class_number,
      section: s.section_number,
      cohort,
      risk,
      skill: gauss(0, 9),
      activity: clamp(gauss(1, 0.35), 0.3, 2.2),
      platform,
      os,
      silentFrom: risk === 'silent' ? int(55, 72) : null,
      // subject preference: a couple of favourites
      favSubjects: new Set([pick(Object.keys(SUBJECT_AVG)), pick(Object.keys(SUBJECT_AVG))]),
    }
  })
}

function sessionProbability(p, d) {
  const date = dayDate(d)
  const dow = date.getUTCDay() // 0 = Sun
  const dowFactor = dow === 0 || dow === 6 ? 0.2 : 1.0
  let base
  if (p.cohort === 'weekly') base = 0.42
  else if (p.cohort === 'monthly') base = 0.05
  else base = d < 10 ? 0.5 : 0.006
  let prob = base * dowFactor * p.activity
  if (p.class === FALLING_CLASS.class && p.section === FALLING_CLASS.section) prob *= 1 - 0.7 * (d / (DAYS - 1))
  if (p.silentFrom !== null && d >= p.silentFrom) prob = 0
  return clamp(prob, 0, 0.95)
}

function dayDate(d) {
  // day 0 = 90 days before the window end, day 89 = the last day
  const t = Date.UTC(2026, 8, 14) - (DAYS - 1 - d) * 86400000
  return new Date(t)
}

function generate(refs) {
  const { students, profileByKey, lectures, news, events, photos } = refs
  const pupils = buildPupils(students, profileByKey)
  const lecturesByClass = new Map()
  for (const l of lectures) {
    if (!lecturesByClass.has(l.class_number)) lecturesByClass.set(l.class_number, [])
    lecturesByClass.get(l.class_number).push(l)
  }
  // Two problem topics: one Matematika, one Fizika (class 2 when possible).
  const problemLectures = new Set()
  const pickProblem = (subject) => {
    const cands = lectures.filter((l) => l.subject === subject && l.questions > 0)
    const sorted = [...cands].sort((a, b) => (a.class_number === 2 ? -1 : 1) - (b.class_number === 2 ? -1 : 1))
    if (sorted.length) problemLectures.add(sorted[Math.floor(rnd() * Math.min(5, sorted.length))].id)
  }
  pickProblem('Matematika')
  pickProblem('Fizika')

  const viralNews = news.length ? news[news.length - 1] : null
  const flopNews = news.length > 1 ? news[Math.max(0, news.length - 3)] : null
  const viralDays = new Set([61, 62, 63])
  const approvedPhotos = photos.filter((p) => p.status === 'approved')

  const appEvents = []
  const quizResults = []
  const progress = new Map() // `${userId}|${lectureId}` → first read ISO

  const stats = { sessions: 0, guestSessions: 0 }

  const push = (p, when, event, extra = {}) => {
    const meta = { seed: true, ...(p ? { sid: p.sid } : {}), ...(extra.meta || {}) }
    if (p) meta.os = p.os
    appEvents.push({
      user_id: p ? p.userId : null,
      role: p ? 'student' : null,
      class_number: p ? p.class : null,
      section_number: p ? p.section : null,
      event,
      entity_id: extra.entity_id ?? null,
      subject: extra.subject ?? null,
      value: extra.value ?? null,
      meta,
      session_id: extra.session_id ?? null,
      platform: p ? p.platform : 'browser',
      created_at: new Date(when).toISOString(),
    })
  }

  for (const p of pupils) {
    const classLectures = lecturesByClass.get(p.class) || lectures
    for (let d = 0; d < DAYS; d++) {
      if (!chance(sessionProbability(p, d))) continue
      const sessionsToday = chance(0.25) ? 2 : 1
      for (let k = 0; k < sessionsToday; k++) {
        stats.sessions++
        const sessionId = `seed-${p.sid.slice(0, 8)}-${d}-${k}`
        const localMin = sessionMinuteOfDay()
        let t = dayDate(d).getTime() + (localMin - TZ_OFFSET_H * 60) * 60000 + int(0, 59) * 1000
        const t0 = t
        const S = { session_id: sessionId }
        const step = (lo = 5, hi = 40) => (t += int(lo, hi) * 1000)

        push(p, t, 'app_open', S)
        push(p, t, 'session_start', S)
        const screens = int(2, 6)
        for (let s = 0; s < screens; s++) {
          step(2, 20)
          push(p, t, 'screen_view', { ...S, meta: { path: pick(SCREENS) } })
        }

        // --- learning
        if (chance(0.6)) {
          const opens = chance(0.3) ? 2 : 1
          for (let o = 0; o < opens; o++) {
            const subject = weightedPick(Object.keys(SUBJECT_AVG), (s) => SUBJECT_WEIGHT[s] * (p.favSubjects.has(s) ? 2 : 1))
            const pool = classLectures.filter((l) => l.subject === subject)
            const lecture = pool.length ? pick(pool) : pick(classLectures)
            if (!lecture) break
            step(3, 15)
            push(p, t, 'lecture_open', { ...S, entity_id: lecture.id, subject: lecture.subject })
            const readSeconds = int(60, 900)
            t += readSeconds * 1000
            push(p, t, 'lecture_time', { ...S, entity_id: lecture.id, subject: lecture.subject, value: readSeconds })
            if (chance(0.65)) {
              push(p, t, 'lecture_read', { ...S, entity_id: lecture.id, subject: lecture.subject })
              if (p.userId) {
                const key = `${p.userId}|${lecture.id}`
                if (!progress.has(key)) progress.set(key, new Date(t).toISOString())
              }
              if (chance(0.12)) {
                step(5, 60)
                push(p, t, 'homework_done', { ...S, entity_id: lecture.id, subject: lecture.subject, value: 1 })
              }
            }
            if (lecture.questions > 0 && chance(0.5)) {
              step(3, 20)
              push(p, t, 'quiz_start', { ...S, entity_id: lecture.id, subject: lecture.subject })
              const abandonP = p.risk === 'abandoner' ? 0.85 : 0.2
              const duration = int(40, 15 * lecture.questions)
              t += duration * 1000
              if (chance(abandonP)) {
                push(p, t, 'quiz_abandon', {
                  ...S,
                  entity_id: lecture.id,
                  subject: lecture.subject,
                  meta: { answered: int(0, lecture.questions - 1), total: lecture.questions },
                })
              } else {
                let mean = SUBJECT_AVG[lecture.subject] ?? 68
                mean += p.skill
                if (problemLectures.has(lecture.id)) mean -= 26
                if (p.risk === 'falling') mean -= 28 * (d / (DAYS - 1))
                const pctRaw = clamp(gauss(mean, 15), 0, 100)
                const correct = clamp(Math.round((pctRaw / 100) * lecture.questions), 0, lecture.questions)
                const pct = Math.round((correct / lecture.questions) * 100)
                push(p, t, 'quiz_finish', {
                  ...S,
                  entity_id: lecture.id,
                  subject: lecture.subject,
                  value: pct,
                  meta: { correct, total: lecture.questions, duration_s: duration },
                })
                quizResults.push({
                  user_id: p.userId,
                  lecture_id: lecture.id,
                  subject: lecture.subject,
                  class_number: p.class,
                  section_number: p.section,
                  score: pct,
                  correct,
                  total: lecture.questions,
                  duration_s: duration,
                  answers: null,
                  meta: { seed: true, sid: p.sid },
                  created_at: new Date(t).toISOString(),
                })
              }
            }
            if (lecture.flashcards > 0 && chance(0.2)) {
              step(3, 20)
              push(p, t, 'flashcards_start', { ...S, entity_id: lecture.id, subject: lecture.subject, meta: { cards: lecture.flashcards } })
              t += int(30, 240) * 1000
              if (chance(0.7)) {
                const known = int(0, lecture.flashcards)
                push(p, t, 'flashcards_finish', {
                  ...S,
                  entity_id: lecture.id,
                  subject: lecture.subject,
                  value: lecture.flashcards,
                  meta: { known, unknown: lecture.flashcards - known },
                })
              }
            }
          }
        }
        if (chance(0.08)) {
          step()
          const [q, results] = pick(SEARCH_QUERIES)
          push(p, t, 'lecture_search', { ...S, meta: { q, results } })
        }

        // --- community
        if (news.length && chance(0.7)) {
          const views = int(1, 3)
          const seen = new Set()
          for (let v = 0; v < views; v++) {
            const item = weightedPick(news, (n) => {
              if (viralNews && n.id === viralNews.id) return viralDays.has(d) ? 12 : 1.2
              if (flopNews && n.id === flopNews.id) return 0.06
              return 1
            })
            if (seen.has(item.id)) continue
            seen.add(item.id)
            step(2, 30)
            push(p, t, 'news_view', { ...S, entity_id: item.id })
            const likeP = viralNews && item.id === viralNews.id && viralDays.has(d) ? 0.35 : 0.12
            if (chance(likeP)) push(p, t + 2000, 'news_like', { ...S, entity_id: item.id })
          }
        }
        if (events.length && chance(0.25)) {
          step()
          push(p, t, 'event_view', { ...S, entity_id: pick(events).id })
        }
        if (chance(0.4)) {
          step()
          push(p, t, 'schedule_view', { ...S, meta: { day: dayDate(d).getUTCDay() } })
        }
        if (chance(0.15)) {
          step()
          push(p, t, 'grades_open', S)
        }
        if (chance(0.35)) {
          step()
          push(p, t, 'gallery_view', S)
          if (approvedPhotos.length && chance(0.3)) {
            step(2, 20)
            push(p, t, 'photo_like', { ...S, entity_id: pick(approvedPhotos).id })
          }
          if (chance(0.004)) {
            step(10, 60)
            push(p, t, 'photo_upload', { ...S, value: int(200_000, 4_000_000) })
          }
        }
        if (chance(0.15)) {
          step()
          push(p, t, 'game_start', S)
          const played = int(40, 400)
          t += played * 1000
          push(p, t, 'game_over', { ...S, value: int(200, 6000) })
        }
        if (chance(0.05)) {
          step()
          push(p, t, 'tournament_view', S)
        }
        if (chance(0.02)) {
          step()
          push(p, t, 'share', { ...S, meta: { what: pick(['lecture', 'news', 'app']) } })
        }
        if (chance(0.01)) {
          step()
          push(p, t, 'theme_changed', { ...S, meta: { theme: pick(['zeleno', 'plavo', 'ljubicasto']) } })
        }
        if (chance(0.01)) {
          step()
          push(p, t, 'nav_customized', { ...S, value: 5 })
        }
        if (chance(0.005)) {
          step()
          push(p, t, 'font_size_changed', { ...S, meta: { size: pick(['small', 'normal', 'large']) } })
        }
        if (chance(0.012)) {
          step()
          push(p, t, d < 20 ? 'ednevnik_connect' : 'ednevnik_sync', S)
        }
        if (d < 12 && p.platform === 'pwa' && chance(0.3)) {
          push(p, t0 + 1000, 'install_prompt', S)
          if (chance(0.6)) push(p, t0 + 5000, 'installed', S)
        }

        step(5, 60)
        push(p, t, 'session_end', { ...S, value: Math.round((t - t0) / 1000) })
      }
    }
  }

  // Guest sessions: a few per day, browser only, no sid.
  for (let d = 0; d < DAYS; d++) {
    const n = int(1, 4)
    for (let g = 0; g < n; g++) {
      stats.guestSessions++
      const sessionId = `seed-guest-${d}-${g}`
      const S = { session_id: sessionId, meta: { os: pick(['android', 'ios', 'windows', 'macos']) } }
      let t = dayDate(d).getTime() + (sessionMinuteOfDay() - TZ_OFFSET_H * 60) * 60000
      const t0 = t
      push(null, t, 'app_open', S)
      push(null, t, 'session_start', S)
      for (let s = 0; s < int(1, 3); s++) {
        t += int(3, 30) * 1000
        push(null, t, 'screen_view', { ...S, meta: { ...S.meta, path: pick(['/news', '/lectures', '/events']) } })
      }
      if (news.length && chance(0.6)) {
        t += int(3, 30) * 1000
        push(null, t, 'news_view', { ...S, entity_id: pick(news).id })
      }
      t += int(5, 40) * 1000
      push(null, t, 'session_end', { ...S, value: Math.round((t - t0) / 1000) })
    }
  }

  // Sort by time so ids follow the timeline (nicer for range deletes and reading).
  appEvents.sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0))
  quizResults.sort((a, b) => (a.created_at < b.created_at ? -1 : 1))

  const progressRows = [...progress.entries()].map(([key, readAt]) => {
    const [user_id, lecture_id] = key.split('|')
    return { user_id, lecture_id, read_at: readAt, meta: { seed: true } }
  })

  return { appEvents, quizResults, progressRows, stats, problemLectures, viralNews, flopNews, pupils }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const doReset = args.has('--reset')
  const doSeed = !doReset || args.has('--seed')

  if (doReset && !DRY) await reset()
  if (!doSeed) return

  console.log('Loading reference data…')
  const refs = await loadRefs()
  const matched = refs.students.filter((s) => refs.profileByKey.has(`${norm(s.first_name)}|${norm(s.last_name)}|${s.class_number}|${s.section_number}`)).length
  console.log(`  pupils: ${refs.students.length} (with profile: ${matched}), lectures: ${refs.lectures.length}, news: ${refs.news.length}, events: ${refs.events.length}, photos: ${refs.photos.length}`)

  console.log('Generating…')
  const gen = generate(refs)
  const counts = {}
  for (const e of gen.appEvents) counts[e.event] = (counts[e.event] || 0) + 1
  console.log(`  sessions: ${gen.stats.sessions} pupil + ${gen.stats.guestSessions} guest`)
  console.log(`  app_events: ${gen.appEvents.length}, quiz_results: ${gen.quizResults.length}, lecture_progress_srv: ${gen.progressRows.length}`)
  console.log(`  range: ${gen.appEvents[0]?.created_at} → ${gen.appEvents[gen.appEvents.length - 1]?.created_at}`)
  console.log(`  problem lectures: ${[...gen.problemLectures].join(', ')}`)
  console.log(`  viral news: ${gen.viralNews?.id ?? '-'}, flop news: ${gen.flopNews?.id ?? '-'}`)
  console.log('  events by type:', Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' '))

  if (DRY) return

  const already = await countSeeded('app_events')
  if (already > 0 && !doReset) {
    console.error(`app_events already holds ${already} seeded rows — run with --reset --seed to regenerate.`)
    process.exit(2)
  }

  console.log('Writing…')
  await insertBatches('app_events', gen.appEvents, 'app_events')
  await insertBatches('quiz_results', gen.quizResults, 'quiz_results')
  await insertBatches('lecture_progress_srv', gen.progressRows, 'lecture_progress_srv', 'return=minimal,resolution=merge-duplicates')

  // Two pending analysis jobs for the worker phase (daily + weekly).
  await rest(
    'POST',
    'analysis_jobs',
    [
      { kind: 'daily', status: 'pending', scope: { period: '7d', class: null, section: null, subject: null, seed: true } },
      { kind: 'weekly', status: 'pending', scope: { period: '7d', compare: 'prev_week', class: null, section: null, subject: null, seed: true } },
    ],
    { Prefer: 'return=minimal' }
  )

  console.log('Done.')
  console.log(`  app_events seeded: ${await countSeeded('app_events')}`)
  console.log(`  quiz_results seeded: ${await countSeeded('quiz_results')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
