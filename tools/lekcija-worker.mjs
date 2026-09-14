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
 * Ako zadatak ima domaći (homework_photo_paths / homework_note), fotografije zadataka idu u
 * javni bucket `lecture-images/<lectureId>/domaci-N.jpg`, a u sadržaj lekcije se upisuje blok
 * HOMEWORK:{"text","tasks":[{"label","what","how"}],"images":[url],"due"}:HOMEWORK (poslije SUMMARY, prije QUIZ_DATA).
 *
 * Isti proces obrađuje i red `analysis_jobs` (AI analiza za panel direktora): kad nema lekcija
 * na čekanju, uzima analizu, dobija snimak agregata iz SQL funkcije build_analysis_snapshot(scope)
 * (samo agregati — bez imena, e-mail adresa i identifikatora; ugovor o privatnosti u
 * src/lib/analysis-snapshot.ts), traži od modela strogi JSON izvještaj na crnogorskom i upisuje
 * ga u `analysis_jobs.output`. Za vrstu 'question' model odgovara ISKLJUČIVO iz snimka.
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

/** Upload bytes to the PUBLIC bucket `lecture-images`; returns the public URL. */
async function uploadPublicImage(objectPath, bytes, type) {
  const res = await fetch(`${STORAGE}/object/lecture-images/${objectPath}`, {
    method: 'POST',
    headers: { apikey: HEADERS.apikey, Authorization: HEADERS.Authorization, 'Content-Type': type || 'image/jpeg', 'x-upsert': 'true' },
    body: bytes,
  })
  if (!res.ok) throw new Error(`Upload ${objectPath}: ${res.status} ${(await res.text()).slice(0, 200)}`)
  return `${CONFIG.SUPABASE_URL}/storage/v1/object/public/lecture-images/${objectPath}`
}

// ───── Prompt ────────────────────────────────────────────────────────────────
const LENGTH_HINT = {
  kratka: '2–3 sekcije, svaka 60–120 riječi',
  srednja: '3–5 sekcija, svaka 100–180 riječi',
  detaljna: '5–7 sekcija, svaka 150–250 riječi, sa primjerima',
}

function buildPrompt(job, photoCount, hwPhotoCount = 0) {
  const source = photoCount > 0
    ? `Izvor: ${photoCount} fotografija (stranice udžbenika ili tabla).${job.topic ? ` Tema: ${job.topic}.` : ''}`
    : `Izvor: samo ovaj zahtjev nastavnika (nema fotografija). Tema: ${job.topic}.`
  const hwNote = String(job.homework_note || '').trim()
  const hasHomework = hwPhotoCount > 0 || hwNote.length > 0
  const homeworkSection = hasHomework
    ? `DOMAĆI ZADATAK (obavezno popuni polje "homework")
- Materijal za domaći je ODVOJEN od gradiva lekcije: ${hwPhotoCount > 0 ? `${hwPhotoCount} fotografija zadataka za domaći (${hwPhotoCount === 1 ? 'slika označena kao "domaći"' : 'slike označene kao "domaći"'}) — te fotografije NE koristi kao izvor za tekst lekcije, samo za domaći.` : 'nema fotografija zadataka.'}${hwNote ? `\n- Uputstvo nastavnika za domaći: ${hwNote}` : ''}
- "homework.text": 1–3 obične rečenice — šta učenici treba da urade i kako (bez HTML-a).
- "homework.tasks": zadaci pročitani sa fotografija (i/ili iz uputstva), 0–8 stavki. "label" = oznaka kako je štampana (npr. "Zadatak 3" ili "Zadaci 1–4 (str. 57)"), "what" = zadatak u jednoj rečenici, "how" = kratak nagovještaj metode/postupka — NIKAD puno rješenje ni krajnji rezultat.
- "homework.due": rok u formatu "YYYY-MM-DD" ako je naveden u uputstvu (npr. "Rok: 2026-09-18"), inače null.
`
    : `DOMAĆI ZADATAK: nema materijala za domaći — vrati "homework": null.
`
  return `Ti si nastavnik u Gimnaziji "Niko Rolović" (Bar, Crna Gora). Napiši JEDNU lekciju za učenike ${job.class_number}. razreda gimnazije iz predmeta "${job.subject}".
${source}
${job.notes ? `Napomene nastavnika: ${job.notes}\n` : ''}Dužina: ${LENGTH_HINT[job.length] || LENGTH_HINT.srednja}.

${homeworkSection}
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
  "flashcards": [{"front": "pojam", "back": "objašnjenje"}],
  "homework": ${hasHomework ? '{"text": "šta uraditi i kako, 1–3 rečenice", "tasks": [{"label": "Zadatak 3", "what": "šta se traži", "how": "kratak nagovještaj metode"}], "due": "YYYY-MM-DD" ili null}' : 'null'}
}`
}

// ───── Generation: Claude API (mode 1) ───────────────────────────────────────
const toImageBlock = (p) => ({ type: 'image', source: { type: 'base64', media_type: p.type, data: p.bytes.toString('base64') } })

/**
 * Both generators return { text, model, tokens_in, tokens_out }.
 * opts.research — allow web search (default CONFIG.WEB_RESEARCH); false = no tools at all.
 * opts.maxTurns — CLI turn budget when research is off (default 6).
 */
async function generateViaApi(prompt, photos, hwPhotos = [], opts = {}) {
  const research = opts.research ?? CONFIG.WEB_RESEARCH
  const content = [
    ...(photos.length ? [{ type: 'text', text: `Fotografije gradiva lekcije (${photos.length}):` }] : []),
    ...photos.map(toImageBlock),
    ...(hwPhotos.length ? [{ type: 'text', text: `Fotografije zadataka za domaći (${hwPhotos.length}) — NISU izvor lekcije:` }] : []),
    ...hwPhotos.map(toImageBlock),
    { type: 'text', text: prompt },
  ]
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': CONFIG.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.ANTHROPIC_MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content }],
      ...(research ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }] } : {}),
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${JSON.stringify(data).slice(0, 300)}`)
  const u = data.usage || {}
  return {
    text: (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n'),
    model: data.model || CONFIG.ANTHROPIC_MODEL,
    tokens_in: (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0),
    tokens_out: u.output_tokens || 0,
  }
}

// ───── Generation: Claude Code CLI (mode 2) ──────────────────────────────────
const imageExt = (type) => (type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg')

// Windows caps a process command line at ~32 K characters; longer prompts go through stdin.
const CLI_ARG_MAX = 16000

async function generateViaCli(prompt, photos, hwPhotos = [], opts = {}) {
  const research = opts.research ?? CONFIG.WEB_RESEARCH
  const dir = await mkdtemp(join(tmpdir(), 'nr-lekcija-'))
  try {
    const names = []
    for (let i = 0; i < photos.length; i++) {
      const name = `slika-${i + 1}.${imageExt(photos[i].type)}`
      await writeFile(join(dir, name), photos[i].bytes)
      names.push(name)
    }
    const hwNames = []
    for (let i = 0; i < hwPhotos.length; i++) {
      const name = `domaci-${i + 1}.${imageExt(hwPhotos[i].type)}`
      await writeFile(join(dir, name), hwPhotos[i].bytes)
      hwNames.push(name)
    }
    const readParts = [
      ...(names.length ? [`slike gradiva lekcije: ${names.join(', ')}`] : []),
      ...(hwNames.length ? [`fotografije zadataka za domaći (NISU izvor lekcije): ${hwNames.join(', ')}`] : []),
    ]
    const full = readParts.length
      ? `Prvo pročitaj (Read) ove slike iz tekućeg foldera, redom — ${readParts.join('; ')}. Ne pravi i ne mijenjaj nikakve fajlove.\n\n${prompt}`
      : `${prompt}\n\n${research ? 'Osim WebSearch/WebFetch ne koristi druge alate i ne pravi fajlove.' : 'Ne koristi alate i ne pravi fajlove — samo odgovori.'}`
    await writeFile(join(dir, 'prompt.txt'), full)
    const tools = [...(readParts.length ? ['Read'] : []), ...(research ? ['WebSearch', 'WebFetch'] : [])]
    const viaStdin = full.length > CLI_ARG_MAX
    const args = ['-p', ...(viaStdin ? [] : [full]), '--output-format', 'json', '--model', CONFIG.CLAUDE_MODEL, '--max-turns', research ? '16' : String(opts.maxTurns || 6)]
    if (tools.length) args.push('--allowedTools', tools.join(','))
    else args.push('--tools', '') // no built-in tools at all
    const out = await new Promise((resolve, reject) => {
      const child = spawn(CONFIG.CLAUDE_BIN, args, { cwd: dir, stdio: [viaStdin ? 'pipe' : 'ignore', 'pipe', 'pipe'] })
      let stdout = '', stderr = ''
      child.stdout.on('data', (d) => (stdout += d))
      child.stderr.on('data', (d) => (stderr += d))
      child.on('error', reject)
      child.on('close', (code) => resolve({ code, stdout, stderr }))
      if (viaStdin) child.stdin.end(full)
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
      const u = parsed.usage || {}
      const models = Object.keys(parsed.modelUsage || {})
      return {
        text: parsed.result,
        model: models[0] || CONFIG.CLAUDE_MODEL,
        tokens_in: (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0),
        tokens_out: u.output_tokens || 0,
      }
    }
    return { text: out.stdout, model: CONFIG.CLAUDE_MODEL, tokens_in: 0, tokens_out: 0 }
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

const safeText = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/</g, '‹').replace(/:SUMMARY|:KEY_TERMS|:QUIZ_DATA|:LECTURE_DATE|:HOMEWORK/g, (m) => m.replace(':', ': ')).trim()

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const dueFromNote = (note) => {
  const m = String(note || '').match(/Rok:\s*(\d{4}-\d{2}-\d{2})/i)
  return m ? m[1] : null
}

/**
 * Normalize the model's `homework` into the HOMEWORK marker contract:
 * {"text", "tasks":[{"label","what","how"}], "images":[url], "due"}. Returns null when there is nothing to publish.
 */
function normalizeHomework(raw, note, imageUrls) {
  const hw = raw && typeof raw === 'object' ? raw : {}
  const noteText = String(note || '').replace(/^\s*Rok:.*$/gim, '').trim()
  const text = safeText(hw.text) || safeText(noteText)
  const tasks = (Array.isArray(hw.tasks) ? hw.tasks : [])
    .filter((t) => t && typeof t === 'object')
    .map((t) => ({ label: safeText(t.label), what: safeText(t.what), how: safeText(t.how) }))
    .filter((t) => t.label || t.what)
    .slice(0, 8)
  const images = (imageUrls || []).map((u) => safeText(u)).filter(Boolean).slice(0, 4)
  const dueRaw = typeof hw.due === 'string' && ISO_DATE.test(hw.due.trim()) ? hw.due.trim() : null
  const due = dueRaw || dueFromNote(note)
  if (!text && !tasks.length && !images.length) return null
  return { text, tasks, images, due }
}

/** Stored lecture body. Order: LECTURE_DATE → sections → KEY_TERMS → SUMMARY → HOMEWORK → QUIZ_DATA (always last). */
function buildLectureContent(r, homework = null) {
  const today = new Date().toISOString().split('T')[0]
  let content = `LECTURE_DATE:${today}:LECTURE_DATE\n\n`
  for (const s of r.sections || []) content += `## ${safeText(s.heading)}\n\n${safeText(s.content)}\n\n`
  const keyTerms = (r.keyTerms || []).map((k) => ({ term: safeText(k.term), definition: safeText(k.definition) })).filter((k) => k.term)
  if (keyTerms.length) content += `KEY_TERMS:${JSON.stringify(keyTerms)}:KEY_TERMS\n\n`
  if (r.summary) content += `SUMMARY:${safeText(r.summary)}:SUMMARY\n\n`
  if (homework) {
    const hw = {
      text: safeText(homework.text),
      tasks: (homework.tasks || []).map((t) => ({ label: safeText(t.label), what: safeText(t.what), how: safeText(t.how) })),
      images: (homework.images || []).map(safeText),
      due: homework.due ? safeText(homework.due) : null,
    }
    content += `HOMEWORK:${JSON.stringify(hw)}:HOMEWORK\n\n`
  }
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
  // Homework photos are separate: never a lecture source, only material for the "homework" field.
  const hwPhotos = []
  for (const p of (job.homework_photo_paths || []).slice(0, 4)) hwPhotos.push(await downloadPhoto(p))
  const hwNote = String(job.homework_note || '').trim()
  const hasHomework = hwPhotos.length > 0 || hwNote.length > 0
  if (hasHomework) log(`  · domaći: ${hwPhotos.length} slika${hwNote ? ' · ' + hwNote.replace(/\s+/g, ' ').slice(0, 80) : ''}`)

  await setProgress(job.id, CONFIG.WEB_RESEARCH ? 'Istražujem program i pišem lekciju…' : 'Pišem lekciju…')
  const prompt = buildPrompt(job, photos.length, hwPhotos.length)
  const gen = CONFIG.ANTHROPIC_API_KEY ? await generateViaApi(prompt, photos, hwPhotos) : await generateViaCli(prompt, photos, hwPhotos)
  const result = extractJson(gen.text)
  if (!result.title || !Array.isArray(result.sections) || !result.sections.length) throw new Error('Nepotpun odgovor modela (nema naslova/sekcija)')

  await setProgress(job.id, 'Upisujem lekciju…')
  const lecture = await rest(
    'POST',
    'lectures',
    { title: safeText(result.title), subject: job.subject, class_number: job.class_number, content: buildLectureContent(result), author_id: job.user_id || CONFIG.FALLBACK_AUTHOR_ID },
    { Prefer: 'return=representation' }
  )
  const lectureId = lecture[0].id

  // Homework: publish photos to the public bucket, then patch the HOMEWORK block into the stored content.
  if (hasHomework) {
    await setProgress(job.id, 'Objavljujem domaći…')
    const imageUrls = []
    for (let i = 0; i < hwPhotos.length; i++) {
      imageUrls.push(await uploadPublicImage(`${lectureId}/domaci-${i + 1}.jpg`, hwPhotos[i].bytes, 'image/jpeg'))
    }
    const homework = normalizeHomework(result.homework, hwNote, imageUrls)
    if (homework) {
      await rest('PATCH', `lectures?id=eq.${lectureId}`, { content: buildLectureContent(result, homework) })
      log(`  · domaći objavljen: ${homework.tasks.length} zadataka, ${homework.images.length} slika${homework.due ? ', rok ' + homework.due : ''}${result.homework ? '' : ' (model nije vratio homework — tekst iz uputstva)'}`)
    } else {
      log('  · domaći preskočen: nema teksta, zadataka ni slika')
    }
  }

  await rest('PATCH', `lecture_jobs?id=eq.${job.id}`, { status: 'done', progress: 'Gotovo', lecture_id: lectureId, updated_at: new Date().toISOString() })
  log(`✔ Lekcija "${result.title}" → /lectures/${encodeURIComponent(job.subject)}/${lectureId}`)
}

// ═════ AI analiza za panel direktora (analysis_jobs) ═════════════════════════
//
// PRIVACY CONTRACT (spec §4.1; mirror of src/lib/analysis-snapshot.ts and of the
// SQL comment on public.build_analysis_snapshot()):
//   * The model receives ONLY the object returned by build_analysis_snapshot(scope):
//     aggregates from direktor_stats(), no user_id, e-mail, pupil/teacher/moderator
//     name, session id or device identifier.
//   * At-risk pupils arrive as {class_number, section_number, reasons, score}.
//   * Groups under k_min (5) pupils are already NULL ("premalo podataka").
//   * There is NO natural-language-to-SQL: 'question' jobs are answered from the
//     same snapshot; if the answer is not there the model must say
//     "Nemam te podatke u pregledu".
//   * The snapshot is stored verbatim in analysis_jobs.input_snapshot so the
//     Direktor panel can show exactly "what the AI saw".
//   * assertSnapshotIsAnonymous() below refuses a snapshot with an identifier-shaped
//     key anywhere in the tree (defence in depth, same list as the TS mirror).

const SNAPSHOT_MAX_BYTES = 32 * 1024
const FORBIDDEN_SNAPSHOT_KEYS = new Set(['user_id', 'email', 'name', 'session_id', 'sid', 'author_id', 'moderator_id', 'first_name', 'last_name'])

function assertSnapshotIsAnonymous(value, path = '$') {
  if (Array.isArray(value)) { value.forEach((v, i) => assertSnapshotIsAnonymous(v, `${path}[${i}]`)); return }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_SNAPSHOT_KEYS.has(k)) throw new Error(`Snimak sadrži zabranjeni ključ "${k}" na ${path} — analiza odbijena`)
      assertSnapshotIsAnonymous(v, `${path}.${k}`)
    }
  }
}

async function claimAnalysisJob() {
  const rows = await rest('GET', 'analysis_jobs?status=eq.pending&order=created_at.asc&limit=1')
  const job = rows && rows[0]
  if (!job) return null
  const claimed = await rest(
    'PATCH',
    `analysis_jobs?id=eq.${job.id}&status=eq.pending`,
    { status: 'processing', updated_at: new Date().toISOString() },
    { Prefer: 'return=representation' }
  )
  return claimed && claimed[0] ? claimed[0] : null
}

/** Aggregates-only snapshot from the SQL function (PostgREST RPC). */
async function buildAnalysisSnapshot(scope) {
  const snapshot = await rest('POST', 'rpc/build_analysis_snapshot', { scope: scope || {} })
  if (!snapshot || typeof snapshot !== 'object') throw new Error('build_analysis_snapshot nije vratio objekat')
  assertSnapshotIsAnonymous(snapshot)
  const bytes = Buffer.byteLength(JSON.stringify(snapshot))
  if (bytes > SNAPSHOT_MAX_BYTES) log(`  · upozorenje: snimak ima ${Math.round(bytes / 1024)} KB (> ${SNAPSHOT_MAX_BYTES / 1024} KB)`)
  return snapshot
}

const PERIOD_LABEL = { today: 'danas', '7d': 'posljednjih 7 dana', '30d': 'posljednjih 30 dana', semester: 'ovo polugodište' }
const KIND_LABEL = {
  daily: 'dnevni izvještaj (juče u kontekstu posljednjih 7 dana)',
  weekly: 'sedmični izvještaj (ova sedmica u poređenju sa prethodnom)',
  adhoc: 'izvještaj na zahtjev direktora („Osvježi analizu“)',
  question: 'odgovor na pitanje direktora („Pitaj podatke“)',
}

const ANALYSIS_JSON_SCHEMA = `{
  "summary": "3 rečenice na crnogorskom",
  "health_verdict": "dobro|pažnja|problem",
  "insights": [{"title": "", "detail": "", "metric": "", "delta": "", "severity": "info|warn|critical", "link": "/direktor/..."}],
  "recommendations": [{"action": "", "why": "", "who": "direktor|razredni|nastavnik|pedagog", "effort": "nisko|srednje|visoko"}],
  "anomalies": [{"what": "", "when": "", "possible_cause": ""}],
  "risk_summary": {"students_at_risk": 0, "classes_to_watch": ["2-3"], "subjects_to_watch": ["Matematika"]},
  "questions_for_staff": ["..."],
  "confidence": "niska|srednja|visoka",
  "data_caveats": ["..."]
}`

function buildAnalysisPrompt(job, snapshot) {
  const meta = snapshot.meta || {}
  const scope = snapshot.scope || job.scope || {}
  const period = PERIOD_LABEL[scope.period] || scope.period || 'posljednjih 7 dana'
  const range = meta.from && meta.to ? ` (${meta.from} – ${meta.to}${meta.prev_from ? `, prethodni period ${meta.prev_from} – ${meta.prev_to}` : ''})` : ''
  const filters = [
    scope.class ? `${scope.class}. razred` : null,
    scope.section ? `odjeljenje ${scope.class || '?'}-${scope.section}` : null,
    scope.subject ? `predmet ${scope.subject}` : null,
  ].filter(Boolean)
  const question = String(job.question || '').trim()
  const questionBlock = job.kind === 'question' && question
    ? `PITANJE DIREKTORA: „${question}“
- Odgovori na pitanje u polju "summary" (2–4 rečenice), ISKLJUČIVO na osnovu brojeva iz snimka ispod.
- Ako snimak ne sadrži podatke potrebne za odgovor, "summary" MORA početi sa „Nemam te podatke u pregledu“ i u nastavku predložiti koji filter (period, razred, odjeljenje, predmet) direktor treba da izabere da bi te podatke vidio. Ne nagađaj.
- Ostala polja popuni samo onim što je relevantno za pitanje (mogu biti prazni nizovi).
`
    : ''
  return `Ti si analitičar podataka za direktora Gimnazije „Niko Rolović“ (Bar, Crna Gora). Dobijaš snimak AGREGIRANIH podataka iz školske aplikacije (bez imena i identifikatora učenika) i pišeš ${KIND_LABEL[job.kind] || 'izvještaj'}.
Period: ${period}${range}.${filters.length ? ` Filteri: ${filters.join(', ')}.` : ' Filteri: cijela škola.'}
${questionBlock}
PRAVILA (obavezna)
- Ne izmišljaj brojke. Navodi ISKLJUČIVO vrijednosti koje postoje u snimku; svaki uvid mora imati metriku iz snimka ("metric") i promjenu ako postoji ("delta", inače prazan string).
- U "summary" imenuj period koji analiziraš.
- Gdje je agregat null (k-anonimnost: grupa < ${meta.k_min || 5} učenika) ili ga nema, napiši „premalo podataka“ — ne procjenjuj i ne popunjavaj.
- Zaključke formuliši kao hipoteze i uz svaku navedi čime se provjerava (razgovor sa razrednim, uvid u e-dnevnik, uporediti sa prethodnom sedmicom…).
- Preporuke: konkretne, izvodljive za jednu sedmicu, sa jasnim nosiocem (direktor|razredni|nastavnik|pedagog) i procjenom napora. Bez opštih fraza tipa „poboljšati komunikaciju“.
- "insights": 3–6 stavki, po važnosti; "link" je putanja u panelu koja počinje sa "/direktor" (npr. /direktor/ucenje, /direktor/razredi/2-3, /direktor/nastava, /direktor/zajednica).
- "risk_summary.students_at_risk" prepiši iz snimka (classes.at_risk.count), odjeljenja pod nadzorom u obliku "razred-odjeljenje" (npr. "2-3"), predmete po nazivu iz snimka.
- Ako meta.demo_share > 50, u "data_caveats" navedi da je većina podataka demo (seed) podaci.
- "confidence": niska ako je malo događaja ili mnogo null vrijednosti, visoka samo uz stabilne brojke kroz cijeli period.
- Jezik: crnogorski, ijekavica, latinica, jasno i kratko. Bez markdowna u vrijednostima.

ODGOVORI ISKLJUČIVO JEDNIM JSON OBJEKTOM ovog oblika (bez teksta prije i poslije, bez markdown ograda, sva polja obavezna):
${ANALYSIS_JSON_SCHEMA}

SNIMAK PODATAKA (JSON):
${JSON.stringify(snapshot)}`
}

// ───── Manual schema validation (spec §4.2; mirrors AnalysisOutput in src/lib/direktor-types.ts) ─────
const VERDICTS = ['dobro', 'pažnja', 'problem']
const SEVERITIES = ['info', 'warn', 'critical']
const WHOS = ['direktor', 'razredni', 'nastavnik', 'pedagog']
const EFFORTS = ['nisko', 'srednje', 'visoko']
const CONFIDENCES = ['niska', 'srednja', 'visoka']
const OUTPUT_KEYS = ['summary', 'health_verdict', 'insights', 'recommendations', 'anomalies', 'risk_summary', 'questions_for_staff', 'confidence', 'data_caveats']

const str = (v, what, required = false) => {
  if (v === undefined || v === null) { if (required) throw new Error(`${what}: nedostaje`); return '' }
  if (typeof v !== 'string') throw new Error(`${what}: očekivan string`)
  const t = v.trim()
  if (required && !t) throw new Error(`${what}: prazno`)
  return t
}
const oneOf = (v, allowed, what) => {
  const t = str(v, what, true).toLowerCase().replace(/^paznja$/, 'pažnja')
  if (!allowed.includes(t)) throw new Error(`${what}: "${v}" nije u [${allowed.join('|')}]`)
  return t
}
const arr = (v, what, max) => {
  if (v === undefined || v === null) return []
  if (!Array.isArray(v)) throw new Error(`${what}: očekivan niz`)
  return v.slice(0, max)
}
const strList = (v, what, max) => arr(v, what, max).map((s, i) => str(s, `${what}[${i}]`)).filter(Boolean)
const obj = (v, what) => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error(`${what}: očekivan objekat`); return v }

function validateAnalysisOutput(raw) {
  const o = obj(raw, 'odgovor')
  for (const k of OUTPUT_KEYS) if (!(k in o)) throw new Error(`nedostaje polje "${k}"`)
  const risk = obj(o.risk_summary, 'risk_summary')
  const studentsAtRisk = Number(risk.students_at_risk)
  if (!Number.isFinite(studentsAtRisk) || studentsAtRisk < 0) throw new Error('risk_summary.students_at_risk: očekivan broj ≥ 0')
  return {
    summary: str(o.summary, 'summary', true).slice(0, 1200),
    health_verdict: oneOf(o.health_verdict, VERDICTS, 'health_verdict'),
    insights: arr(o.insights, 'insights', 8).map((it, i) => {
      const x = obj(it, `insights[${i}]`)
      const link = str(x.link, `insights[${i}].link`)
      return {
        title: str(x.title, `insights[${i}].title`, true),
        detail: str(x.detail, `insights[${i}].detail`),
        metric: str(x.metric, `insights[${i}].metric`),
        delta: str(x.delta, `insights[${i}].delta`),
        severity: oneOf(x.severity, SEVERITIES, `insights[${i}].severity`),
        link: /^\/direktor(\/|$)/.test(link) ? link : '/direktor',
      }
    }),
    recommendations: arr(o.recommendations, 'recommendations', 8).map((it, i) => {
      const x = obj(it, `recommendations[${i}]`)
      return {
        action: str(x.action, `recommendations[${i}].action`, true),
        why: str(x.why, `recommendations[${i}].why`),
        who: oneOf(x.who, WHOS, `recommendations[${i}].who`),
        effort: oneOf(x.effort, EFFORTS, `recommendations[${i}].effort`),
      }
    }),
    anomalies: arr(o.anomalies, 'anomalies', 8).map((it, i) => {
      const x = obj(it, `anomalies[${i}]`)
      return { what: str(x.what, `anomalies[${i}].what`, true), when: str(x.when, `anomalies[${i}].when`), possible_cause: str(x.possible_cause, `anomalies[${i}].possible_cause`) }
    }),
    risk_summary: {
      students_at_risk: Math.round(studentsAtRisk),
      classes_to_watch: strList(risk.classes_to_watch, 'risk_summary.classes_to_watch', 12),
      subjects_to_watch: strList(risk.subjects_to_watch, 'risk_summary.subjects_to_watch', 12),
    },
    questions_for_staff: strList(o.questions_for_staff, 'questions_for_staff', 8),
    confidence: oneOf(o.confidence, CONFIDENCES, 'confidence'),
    data_caveats: strList(o.data_caveats, 'data_caveats', 8),
  }
}

async function processAnalysisJob(job) {
  const scope = job.scope && typeof job.scope === 'object' ? job.scope : {}
  log(`▶ Analiza ${job.id.slice(0, 8)} · ${job.kind} · ${scope.period || '7d'}${scope.class ? ' · ' + scope.class + '. razred' : ''}${scope.section ? '-' + scope.section : ''}${scope.subject ? ' · ' + scope.subject : ''}${job.question ? ' · „' + String(job.question).slice(0, 60) + '“' : ''}`)
  // The API stores the snapshot when it queues the job (so the panel shows what the model saw);
  // seeded/scheduled jobs arrive without one and get it here from the same SQL function.
  let snapshot = job.input_snapshot && typeof job.input_snapshot === 'object' ? job.input_snapshot : null
  if (snapshot) assertSnapshotIsAnonymous(snapshot)
  else {
    snapshot = await buildAnalysisSnapshot(scope)
    await rest('PATCH', `analysis_jobs?id=eq.${job.id}`, { input_snapshot: snapshot, updated_at: new Date().toISOString() })
  }
  const basePrompt = buildAnalysisPrompt(job, snapshot)
  const genOpts = { research: false, maxTurns: 4 }

  let output = null, gen = null, lastError = null
  for (let attempt = 1; attempt <= 2 && !output; attempt++) {
    const prompt = attempt === 1
      ? basePrompt
      : `${basePrompt}\n\nPRETHODNI ODGOVOR NIJE PROŠAO PROVJERU (${lastError}). Vrati ISKLJUČIVO validan JSON po zadatoj šemi, sa svim poljima i dozvoljenim vrijednostima.`
    try {
      gen = CONFIG.ANTHROPIC_API_KEY ? await generateViaApi(prompt, [], [], genOpts) : await generateViaCli(prompt, [], [], genOpts)
      output = validateAnalysisOutput(extractJson(gen.text))
    } catch (err) {
      lastError = (err instanceof Error ? err.message : String(err)).replace(/\s+/g, ' ').slice(0, 200)
      log(`  · pokušaj ${attempt}/2 neuspješan: ${lastError}`)
    }
  }
  if (!output) throw new Error(`Model nije vratio validan izvještaj: ${lastError}`)

  const now = new Date().toISOString()
  await rest('PATCH', `analysis_jobs?id=eq.${job.id}`, {
    status: 'done', output, model: gen.model, tokens_in: gen.tokens_in, tokens_out: gen.tokens_out,
    error: null, finished_at: now, updated_at: now,
  })
  log(`✔ Analiza ${job.kind} gotova · ${output.health_verdict} · ${output.insights.length} uvida, ${output.recommendations.length} preporuka · ${gen.model} (${gen.tokens_in}/${gen.tokens_out} tokena)`)
}

// ───── Loop ──────────────────────────────────────────────────────────────────
let stopping = false
process.on('SIGINT', () => { stopping = true; log('Zaustavljam…') })

// ═════ Keš statistike za panel direktora ══════════════════════════════════
// direktor_stats() traje više sekundi; panel čita direktor_stats_cached(), a
// keš se ovdje osvježava svakih STATS_REFRESH_MIN minuta (podrazumijevano 30).
const STATS_REFRESH_MS = Number(process.env.STATS_REFRESH_MIN || 30) * 60 * 1000
let lastStatsRefresh = 0
async function refreshStatsCache() {
  if (Date.now() - lastStatsRefresh < STATS_REFRESH_MS) return
  lastStatsRefresh = Date.now()
  const t0 = Date.now()
  try {
    await rest('POST', 'rpc/refresh_direktor_stats', {})
    log(`↻ Keš statistike osvježen (${Math.round((Date.now() - t0) / 1000)} s)`)
  } catch (err) {
    log(`✖ Keš statistike: ${err instanceof Error ? err.message : err}`)
  }
}

log(`NR Lekcija Worker · režim: ${CONFIG.ANTHROPIC_API_KEY ? 'Claude API (' + CONFIG.ANTHROPIC_MODEL + ')' : 'Claude Code CLI (' + CONFIG.CLAUDE_BIN + ' --model ' + CONFIG.CLAUDE_MODEL + ')'} · web istraživanje: ${CONFIG.WEB_RESEARCH ? 'uključeno' : 'isključeno'} · redovi: lecture_jobs + analysis_jobs · čekam zadatke…`)
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
    // Lectures first; when none are waiting, one AI analysis for the Direktor panel.
    const analysis = await claimAnalysisJob()
    if (analysis) {
      try {
        await processAnalysisJob(analysis)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        log(`✖ Greška analize: ${message}`)
        const now = new Date().toISOString()
        await rest('PATCH', `analysis_jobs?id=eq.${analysis.id}`, { status: 'error', error: message.slice(0, 500), finished_at: now, updated_at: now }).catch(() => {})
      }
      continue
    }
    await refreshStatsCache()
  } catch (err) {
    log(`✖ ${err instanceof Error ? err.message : err}`)
  }
  await new Promise((r) => setTimeout(r, CONFIG.POLL_MS))
}
