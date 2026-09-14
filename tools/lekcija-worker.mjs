#!/usr/bin/env node
/**
 * NR Lekcija Worker — one file, no dependencies (Node 18+).
 *
 * Pokreni na bilo kom računaru:
 *   node lekcija-worker.mjs
 *
 * Šta radi: svakih par sekundi provjerava red `lecture_jobs` u Supabase bazi,
 * uzima zadatak (fotografije + predmet/razred/tema), generiše kompletnu lekciju
 * (sekcije, ključni pojmovi, sažetak, kviz, kartice) i upisuje je u tabelu
 * `lectures`. Sajt odmah prikazuje lekciju svima.
 *
 * Kako generiše — dva režima, bira se automatski:
 *   1) ANTHROPIC_API_KEY postavljen  → direktno Claude API (preporučeno; lekcija košta par centi).
 *   2) inače                         → `claude -p` (Claude Code CLI prijavljen tvojom pretplatom).
 *      Potrebno: instaliran Claude Code i `claude` u PATH-u (ili CLAUDE_BIN).
 *
 * Podešavanje (env ili ovdje ispod):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (obavezno — Supabase → Settings → API → service_role)
 *   ANTHROPIC_API_KEY                        (opciono, režim 1)
 *   CLAUDE_BIN, CLAUDE_MODEL                 (opciono, režim 2; podrazumijevano `claude`, `sonnet`)
 *   POLL_MS                                  (opciono, podrazumijevano 5000)
 */
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Zero-config: read .env.local / .env next to the project (or next to this file)
// so `node tools/lekcija-worker.mjs` works without setting variables by hand.
for (const dir of [process.cwd(), join(dirname(fileURLToPath(import.meta.url)), '..'), dirname(fileURLToPath(import.meta.url))]) {
  for (const name of ['.env.local', '.env']) {
    try {
      const text = await readFile(join(dir, name), 'utf8')
      for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    } catch { /* no such file */ }
  }
}

// ───── Config ────────────────────────────────────────────────────────────────
const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://ydcbxqrnmnbceyzqgbui.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
  CLAUDE_BIN: process.env.CLAUDE_BIN || (process.platform === 'win32' ? 'claude.exe' : 'claude'),
  CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'sonnet',
  POLL_MS: Number(process.env.POLL_MS || 5000),
  // Istraži crnogorski program (Zavod za školstvo, udžbenici, ispitni katalozi) prije pisanja. WEB_RESEARCH=0 isključuje.
  WEB_RESEARCH: process.env.WEB_RESEARCH !== '0',
  // Author used when a guest (no user id) queued the job.
  FALLBACK_AUTHOR_ID: '241c9077-b700-4400-8f96-20e3a650eef4',
}

if (!CONFIG.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('✖ Nedostaje SUPABASE_SERVICE_ROLE_KEY. Postavi env varijablu ili upiši ključ u CONFIG.')
  process.exit(1)
}

const REST = `${CONFIG.SUPABASE_URL}/rest/v1`
const STORAGE = `${CONFIG.SUPABASE_URL}/storage/v1`
const HEADERS = {
  apikey: CONFIG.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${CONFIG.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

const log = (...a) => console.log(new Date().toLocaleTimeString('sr-Latn'), ...a)

// ───── Supabase helpers (plain REST, no SDK) ─────────────────────────────────
async function rest(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${REST}/${path}`, {
    method,
    headers: { ...HEADERS, ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : null
}

async function claimJob() {
  const rows = await rest('GET', 'lecture_jobs?status=eq.pending&order=created_at.asc&limit=1')
  const job = rows && rows[0]
  if (!job) return null
  // Optimistic claim: only wins if the row is still pending.
  const claimed = await rest(
    'PATCH',
    `lecture_jobs?id=eq.${job.id}&status=eq.pending`,
    { status: 'processing', progress: 'Čitam fotografije…', updated_at: new Date().toISOString() },
    { Prefer: 'return=representation' }
  )
  return claimed && claimed[0] ? claimed[0] : null
}

const setProgress = (id, progress) =>
  rest('PATCH', `lecture_jobs?id=eq.${id}`, { progress, updated_at: new Date().toISOString() }).catch(() => {})

async function downloadPhoto(path) {
  const res = await fetch(`${STORAGE}/object/${path}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`Slika ${path}: ${res.status}`)
  const type = res.headers.get('content-type') || 'image/jpeg'
  return { bytes: Buffer.from(await res.arrayBuffer()), type: type.split(';')[0] }
}

// ───── Prompt ────────────────────────────────────────────────────────────────
const LENGTH_HINT = {
  kratka: '2–3 sekcije, svaka 60–120 riječi',
  srednja: '3–5 sekcija, svaka 100–180 riječi',
  detaljna: '5–7 sekcija, svaka 150–250 riječi, sa primjerima',
}

function buildPrompt(job, photoCount) {
  const source = photoCount > 0
    ? `Izvor: ${photoCount} fotografija (stranice udžbenika ili tabla).${job.topic ? ` Tema: ${job.topic}.` : ''}`
    : `Izvor: samo ovaj zahtjev nastavnika (nema fotografija). Tema: ${job.topic}.`
  return `Ti si nastavnik u Gimnaziji "Niko Rolović" (Bar, Crna Gora). Napiši JEDNU lekciju za učenike ${job.class_number}. razreda gimnazije iz predmeta "${job.subject}".
${source}
${job.notes ? `Napomene nastavnika: ${job.notes}\n` : ''}Dužina: ${LENGTH_HINT[job.length] || LENGTH_HINT.srednja}.

${CONFIG.WEB_RESEARCH ? `ISTRAŽIVANJE PRIJE PISANJA (obavezno, 2–4 pretrage, ne više)
- Pretraži kako se ova tema obrađuje u crnogorskom gimnazijskom programu za ${job.class_number}. razred: predmetni program Zavoda za školstvo (zzs.gov.me), udžbenici Zavoda za udžbenike i nastavna sredstva (zuns.me), ispitni katalozi Ispitnog centra (iccg.co.me), portali gov.me / mps.gov.me. Korisni upiti: "${job.subject} ${job.class_number}. razred gimnazija program zzs.gov.me", "${job.topic || job.subject} udžbenik gimnazija Crna Gora".
- Uskladi obim, redosljed pojmova, terminologiju i oznake sa tim što nađeš (npr. termini kako ih koriste crnogorski udžbenici, a ne prevodi sa engleskog). Ako ništa relevantno ne nađeš, piši po standardnom gimnazijskom gradivu i ne izmišljaj izvore.
- Ne kopiraj tekst sa sajtova doslovno — piši svojim riječima. Ne navodi linkove u lekciji.

` : ''}STROGO
- Drži se ISKLJUČIVO zadate teme i onoga što je na fotografijama. Ne dodaj druge teme, uvode o školi ili predmetu, motivacione pasuse, savjete za učenje, „zanimljivosti“ ni zaključke van teme.
- Ako je tema uska, lekcija je kratka — ne razvlači. Ne ponavljaj isto u više sekcija.
- Jezik: crnogorski/srpski, ijekavica, latinica. Jasno, za srednjoškolce, bez fraza „u ovoj lekciji ćemo“.
- Ne izmišljaj brojke, imena, datume i formule kojih nema u izvoru ili u standardnom gradivu te teme.
- Formule i hemijske oznake pišu se Unicode znakovima (x², H₂O, →, ≤); NIKAD HTML, NIKAD znak "<" u tekstu.
- Tekst sekcija: obični pasusi razdvojeni praznim redom; nabrajanja kao redovi koji počinju sa "- ". Bez markdown zvjezdica i bez naslova unutar teksta.
- Kviz: ${job.want_quiz ? '5–8 pitanja SAMO iz ove lekcije' : '0 pitanja (prazan niz)'}, svako sa TAČNO 4 opcije i indeksom tačne (0–3), plus objašnjenje u jednoj rečenici.
- Kartice: ${job.want_flashcards ? '5–8 kartica SAMO iz ove lekcije (pojam → objašnjenje)' : '0 kartica (prazan niz)'}.
- Ključni pojmovi: 3–6, samo oni koji se pojavljuju u lekciji.
- Naslov: kratak, bez broja lekcije i bez naziva predmeta.

ODGOVORI ISKLJUČIVO JEDNIM JSON OBJEKTOM (bez teksta prije i poslije, bez markdown ograda):
{
  "title": "naslov lekcije",
  "sections": [{"heading": "naslov sekcije", "content": "tekst sekcije"}],
  "keyTerms": [{"term": "pojam", "definition": "objašnjenje"}],
  "summary": "sažetak u 2–3 rečenice",
  "quiz": [{"question": "pitanje", "options": ["A","B","C","D"], "correct": 0, "explanation": "zašto"}],
  "flashcards": [{"front": "pojam", "back": "objašnjenje"}]
}`
}

// ───── Generation: Claude API (mode 1) ───────────────────────────────────────
async function generateViaApi(prompt, photos) {
  const content = [
    ...photos.map((p) => ({ type: 'image', source: { type: 'base64', media_type: p.type, data: p.bytes.toString('base64') } })),
    { type: 'text', text: prompt },
  ]
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': CONFIG.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.ANTHROPIC_MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content }],
      ...(CONFIG.WEB_RESEARCH ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }] } : {}),
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${JSON.stringify(data).slice(0, 300)}`)
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n')
}

// ───── Generation: Claude Code CLI (mode 2) ──────────────────────────────────
async function generateViaCli(prompt, photos) {
  const dir = await mkdtemp(join(tmpdir(), 'nr-lekcija-'))
  try {
    const names = []
    for (let i = 0; i < photos.length; i++) {
      const ext = photos[i].type.includes('png') ? 'png' : photos[i].type.includes('webp') ? 'webp' : 'jpg'
      const name = `slika-${i + 1}.${ext}`
      await writeFile(join(dir, name), photos[i].bytes)
      names.push(name)
    }
    const full = names.length
      ? `Prvo pročitaj (Read) ove slike iz tekućeg foldera, redom: ${names.join(', ')}. Ne pravi i ne mijenjaj nikakve fajlove.\n\n${prompt}`
      : `${prompt}\n\n${CONFIG.WEB_RESEARCH ? 'Osim WebSearch/WebFetch ne koristi druge alate i ne pravi fajlove.' : 'Ne koristi alate i ne pravi fajlove — samo odgovori.'}`
    await writeFile(join(dir, 'prompt.txt'), full)
    const tools = [...(names.length ? ['Read'] : []), ...(CONFIG.WEB_RESEARCH ? ['WebSearch', 'WebFetch'] : [])]
    const args = ['-p', full, '--output-format', 'json', '--model', CONFIG.CLAUDE_MODEL, '--max-turns', CONFIG.WEB_RESEARCH ? '16' : '6']
    if (tools.length) args.push('--allowedTools', tools.join(','))
    const out = await new Promise((resolve, reject) => {
      const child = spawn(CONFIG.CLAUDE_BIN, args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] })
      let stdout = '', stderr = ''
      child.stdout.on('data', (d) => (stdout += d))
      child.stderr.on('data', (d) => (stderr += d))
      child.on('error', reject)
      child.on('close', (code) => resolve({ code, stdout, stderr }))
    })
    let parsed = null
    try { parsed = JSON.parse(out.stdout) } catch { /* not the json envelope */ }
    if (parsed && parsed.is_error) {
      const msg = String(parsed.result || '').slice(0, 300)
      throw new Error(/authenticate|OAuth|login/i.test(msg) ? `Claude Code nije prijavljen na ovom računaru — pokreni \`claude\` i uradi /login. (${msg})` : `Claude Code: ${msg}`)
    }
    if (out.code !== 0 && !parsed) throw new Error(`claude izašao sa kodom ${out.code}: ${(out.stderr || out.stdout).slice(0, 300)}`)
    if (parsed && typeof parsed.result === 'string') {
      if (parsed.num_turns) log(`  · Claude Code: ${parsed.num_turns} koraka${parsed.duration_ms ? ', ' + Math.round(parsed.duration_ms / 1000) + ' s' : ''}`)
      return parsed.result
    }
    return out.stdout
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

// ───── Parse + build stored content (same as admin buildLectureContent) ─────
function extractJson(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < 0) throw new Error('AI nije mogao napisati lekciju iz ovog materijala: ' + String(text).replace(/\s+/g, ' ').slice(0, 220))
  return JSON.parse(text.slice(start, end + 1))
}

const safeText = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/</g, '‹').replace(/:SUMMARY|:KEY_TERMS|:QUIZ_DATA|:LECTURE_DATE/g, (m) => m.replace(':', ': ')).trim()

function buildLectureContent(r) {
  const today = new Date().toISOString().split('T')[0]
  let content = `LECTURE_DATE:${today}:LECTURE_DATE\n\n`
  for (const s of r.sections || []) content += `## ${safeText(s.heading)}\n\n${safeText(s.content)}\n\n`
  const keyTerms = (r.keyTerms || []).map((k) => ({ term: safeText(k.term), definition: safeText(k.definition) })).filter((k) => k.term)
  if (keyTerms.length) content += `KEY_TERMS:${JSON.stringify(keyTerms)}:KEY_TERMS\n\n`
  if (r.summary) content += `SUMMARY:${safeText(r.summary)}:SUMMARY\n\n`
  const questions = (r.quiz || [])
    .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length >= 2)
    .map((q) => ({
      question: safeText(q.question),
      options: q.options.slice(0, 4).map(safeText),
      correct: Math.min(Math.max(Number(q.correct) || 0, 0), Math.min(q.options.length, 4) - 1),
      ...(q.explanation ? { explanation: safeText(q.explanation) } : {}),
    }))
  const flashcards = (r.flashcards || []).filter((f) => f && f.front && f.back).map((f) => ({ question: safeText(f.front), answer: safeText(f.back) }))
  content += `QUIZ_DATA:${JSON.stringify({ questions, flashcards })}:QUIZ_DATA`
  return content
}

// ───── One job ───────────────────────────────────────────────────────────────
async function processJob(job) {
  log(`▶ Zadatak ${job.id.slice(0, 8)} · ${job.subject} · ${job.class_number}. razred · ${(job.photo_paths || []).length} slika${job.topic ? ' · ' + job.topic : ''}`)
  const photos = []
  for (const p of job.photo_paths || []) photos.push(await downloadPhoto(p))
  if (!photos.length && !(job.topic && job.topic.trim())) throw new Error('Zadatak nema ni temu ni fotografije')

  await setProgress(job.id, CONFIG.WEB_RESEARCH ? 'Istražujem program i pišem lekciju…' : 'Pišem lekciju…')
  const prompt = buildPrompt(job, photos.length)
  const raw = CONFIG.ANTHROPIC_API_KEY ? await generateViaApi(prompt, photos) : await generateViaCli(prompt, photos)
  const result = extractJson(raw)
  if (!result.title || !Array.isArray(result.sections) || !result.sections.length) throw new Error('Nepotpun odgovor modela (nema naslova/sekcija)')

  await setProgress(job.id, 'Upisujem lekciju…')
  const lecture = await rest(
    'POST',
    'lectures',
    { title: safeText(result.title), subject: job.subject, class_number: job.class_number, content: buildLectureContent(result), author_id: job.user_id || CONFIG.FALLBACK_AUTHOR_ID },
    { Prefer: 'return=representation' }
  )
  const lectureId = lecture[0].id
  await rest('PATCH', `lecture_jobs?id=eq.${job.id}`, { status: 'done', progress: 'Gotovo', lecture_id: lectureId, updated_at: new Date().toISOString() })
  log(`✔ Lekcija "${result.title}" → /lectures/${encodeURIComponent(job.subject)}/${lectureId}`)
}

// ───── Loop ──────────────────────────────────────────────────────────────────
let stopping = false
process.on('SIGINT', () => { stopping = true; log('Zaustavljam…') })

log(`NR Lekcija Worker · režim: ${CONFIG.ANTHROPIC_API_KEY ? 'Claude API (' + CONFIG.ANTHROPIC_MODEL + ')' : 'Claude Code CLI (' + CONFIG.CLAUDE_BIN + ' --model ' + CONFIG.CLAUDE_MODEL + ')'} · web istraživanje: ${CONFIG.WEB_RESEARCH ? 'uključeno' : 'isključeno'} · čekam zadatke…`)
while (!stopping) {
  try {
    const job = await claimJob()
    if (job) {
      try {
        await processJob(job)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log(`✖ Greška: ${message}`)
        await rest('PATCH', `lecture_jobs?id=eq.${job.id}`, { status: 'error', error: message.slice(0, 500), progress: null, updated_at: new Date().toISOString() }).catch(() => {})
      }
      continue
    }
  } catch (err) {
    log(`✖ ${err instanceof Error ? err.message : err}`)
  }
  await new Promise((r) => setTimeout(r, CONFIG.POLL_MS))
}
