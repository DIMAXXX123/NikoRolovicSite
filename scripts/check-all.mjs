// Feature checklist against the live site (or --base http://localhost:3480).
// Real clicks at phone size, one demo role per browser context. Prints one line
// per check and a summary; writes docs/screens/check-all.json.
//   node scripts/check-all.mjs [--base URL] [--only <substr>]
import { writeFile } from 'node:fs/promises'
import puppeteer from 'puppeteer'

const args = process.argv.slice(2)
const BASE = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'https://niko-rolovic-site.vercel.app'
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
function rec(group, name, pass, info = '') {
  results.push({ group, name, pass: !!pass, info: String(info).slice(0, 200) })
  console.log(`${pass ? 'ok  ' : 'FAIL'} [${group}] ${name}${info ? ' — ' + String(info).slice(0, 140) : ''}`)
}
async function check(group, name, fn) {
  if (only && !group.includes(only) && !name.includes(only)) return
  try {
    const r = await fn()
    if (Array.isArray(r)) rec(group, name, r[0], r[1])
    else rec(group, name, r, '')
  } catch (e) {
    rec(group, name, false, 'THREW: ' + (e && e.message ? e.message : e))
  }
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })

async function session(role) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  const errors = []
  const api = []
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)))
  page.on('response', (r) => { const u = r.url(); if (u.includes('/api/')) api.push({ url: u.replace(BASE, ''), status: r.status() }) })
  page.on('dialog', async (d) => { await d.accept() })
  await page.goto(BASE + '/about', { waitUntil: 'domcontentloaded' })
  await page.evaluate((r) => { localStorage.clear(); localStorage.setItem('demo_role', r) }, role)
  await page.goto(BASE + '/profile', { waitUntil: 'networkidle0' })
  await sleep(4000) // AutoLogin signs in and reloads
  await page.goto(BASE + '/profile', { waitUntil: 'networkidle0' })
  let text = ''
  for (let i = 0; i < 12; i++) { await sleep(800); text = await page.evaluate(() => document.body.innerText); if (/ULOGA|Uloga/.test(text)) break }
  return { ctx, page, errors, api, roleText: text, close: () => ctx.close() }
}
const go = async (page, path, ms = 1500) => { await page.goto(BASE + path, { waitUntil: 'networkidle0' }); await sleep(ms); return page.evaluate(() => document.body.innerText) }
const clickText = async (page, sel, re) => { for (const el of await page.$$(sel)) { const t = await page.evaluate((e) => (e.getAttribute('aria-label') || '') + ' ' + e.innerText, el); if (re.test(t)) { await el.click(); return true } } return false }
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
const noErrors = (s) => s.errors.filter((e) => !/Failed to fetch|AbortError|Load failed/i.test(e))

// ─────────────────────────── UČENIK ───────────────────────────
{
  const s = await session('ucenik')
  await check('ucenik', 'auto-login as demo student', () => [/UČENIK|Učenik/.test(s.roleText) && /Dmitrij/.test(s.roleText), s.roleText.slice(0, 80)])

  let t = await go(s.page, '/news', 2500)
  const newsCards = await s.page.$$('article, [data-news-card]')
  await check('ucenik', '/news shows news', () => [/Novosti|Vijesti|NOVOSTI/i.test(t) && t.length > 400, `${newsCards.length} article`])
  await check('ucenik', '/news like toggles', async () => {
    const before = await s.page.evaluate(() => { const b = document.querySelector('button[aria-label*="Sviđa"], button[aria-label*="svi"], button[aria-pressed]'); return b ? b.innerText.trim() : null })
    const ok = await clickText(s.page, 'button', /sviđa|lajk|like/i)
    await sleep(1200)
    const after = await s.page.evaluate(() => { const b = document.querySelector('button[aria-label*="Sviđa"], button[aria-label*="svi"], button[aria-pressed]'); return b ? b.innerText.trim() : null })
    await clickText(s.page, 'button', /sviđa|lajk|like/i) // unlike
    return [ok && before !== null && after !== null && before !== after, `${before} → ${after}`]
  })

  t = await go(s.page, '/gallery', 3000)
  await check('ucenik', '/gallery photos + Tijana first', async () => {
    const imgs = await s.page.$$eval('img', (els) => els.filter((i) => /supabase|storage|photos/.test(i.src)).length)
    return [imgs >= 5 && /Tijana/i.test(t.slice(0, 1500)), `${imgs} photos, first block: ${t.slice(0, 120).replace(/\n/g, ' ')}`]
  })
  await check('ucenik', '/gallery like toggles', async () => {
    const before = await s.page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /sviđa|lajk/i.test(x.getAttribute('aria-label') || '')); return b ? b.innerText.trim() : null })
    await clickText(s.page, 'button', /sviđa|lajk/i)
    await sleep(1200)
    const after = await s.page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /sviđa|lajk/i.test(x.getAttribute('aria-label') || '')); return b ? b.innerText.trim() : null })
    await clickText(s.page, 'button', /sviđa|lajk/i)
    return [before !== null && after !== null && before !== after, `${before} → ${after}`]
  })

  t = await go(s.page, '/events', 2000)
  await check('ucenik', '/events calendar + list of events', async () => { const cal = /Septembar 2026|PON UTO SRI/i.test(t); await clickText(s.page, 'button,[role=tab]', /^\s*lista\s*$/i); await sleep(800); const tt = await s.page.evaluate(() => document.body.innerText); const n = (tt.match(/\b\d{1,2}\.\s?(sep|okt|nov|dec|jan|feb|mar|apr|maj|jun|jul|avg)/gi) || []).length; return [cal && n >= 3, `${n} dated rows`] })

  t = await go(s.page, '/lectures', 2000)
  await check('ucenik', '/lectures: subjects + Domaći banner + AI banner', () => [/Domaći zadatak/i.test(t) && /Matematika/.test(t) && /Nova lekcija|AI/i.test(t), t.slice(0, 200).replace(/\n/g, ' ')])
  await check('ucenik', '/lectures no horizontal overflow', async () => [!(await overflow(s.page)), ''])

  t = await go(s.page, '/lectures/Fizika/6e8717d6-f75e-46ff-8652-36b5ced9eeb0', 2500)
  await check('ucenik', 'lecture: sections, exercises, key terms, summary', () => [/Zakon održanja energije/.test(t) && /Zadaci za vježbu/.test(t) && /Sažetak/.test(t), ''])
  await check('ucenik', 'lecture: exercise solution reveals', async () => { const ok = await clickText(s.page, 'button', /^\s*rješenje\s*$/i); await sleep(500); const tt = await s.page.evaluate(() => document.body.innerText); return [ok && /Sakrij rješenje/i.test(tt), ''] })
  await check('ucenik', 'lecture: video tab embeds YouTube', async () => { await clickText(s.page, '[role=tab]', /video/i); await sleep(2000); const src = await s.page.evaluate(() => document.querySelector('iframe')?.src || null); return [!!src && /youtube-nocookie\.com\/embed\//.test(src), src] })
  await check('ucenik', 'lecture: quiz starts and answers', async () => {
    await clickText(s.page, '[role=tab]', /kviz/i); await sleep(800)
    await clickText(s.page, 'button', /počni|start|kviz|započni/i); await sleep(800)
    const before = await s.page.evaluate(() => document.body.innerText)
    const opts = await s.page.$$('button')
    let clicked = false
    for (const o of opts) { const tt = await s.page.evaluate((e) => e.innerText, o); if (/^[A-D]\b|^\d\./.test(tt.trim()) || (tt.trim().length > 8 && !/kviz|nazad|dalje|provjeri/i.test(tt))) { await o.click(); clicked = true; break } }
    await sleep(800)
    const after = await s.page.evaluate(() => document.body.innerText)
    return [/pitanje|\d\s*\/\s*\d|\d\s*od\s*\d/i.test(before) && clicked && before !== after, before.slice(0, 100).replace(/\n/g, ' ')]
  })
  await check('ucenik', 'lecture: like button', async () => { const ok = await clickText(s.page, 'button', /sviđa|lajk/i); return [ok, ''] })

  t = await go(s.page, '/domaci', 2000)
  await check('ucenik', '/domaci lists homework', () => [/Domaći/i.test(t) && /zadat/i.test(t), t.slice(0, 160).replace(/\n/g, ' ')])
  await check('ucenik', '/domaci check marks done', async () => {
    const before = await s.page.evaluate(() => document.body.innerText)
    const ok = await clickText(s.page, 'button', /označi|urađeno|gotovo/i)
    await sleep(700)
    const after = await s.page.evaluate(() => document.body.innerText)
    const key = await s.page.evaluate(() => Object.keys(localStorage).find((k) => /homework|domaci/i.test(k)))
    if (ok) await clickText(s.page, 'button', /označi|urađeno|gotovo|vrati/i)
    return [ok && (before !== after || !!key), `storage key: ${key}`]
  })
  await check('ucenik', '/domaci/[id] opens', async () => { const href = await s.page.evaluate(() => document.querySelector('a[href^="/domaci/"]')?.getAttribute('href')); if (!href) return [false, 'no link']; const tt = await go(s.page, href, 1500); return [/Otvori lekciju|Domaći/i.test(tt), href] })

  t = await go(s.page, '/lectures/nova', 2000)
  await check('ucenik', '/lectures/nova form present', () => [/tema|Tema|lekcij/i.test(t) && /Napravi|Kreiraj|Pošalji|Generiši/i.test(t), t.slice(0, 120).replace(/\n/g, ' ')])

  t = await go(s.page, '/ednevnik', 2000)
  await check('ucenik', '/ednevnik demo connect + goal + absences', async () => {
    await clickText(s.page, 'button', /poveži ednevnik/i); await sleep(1500)
    const tt = await s.page.evaluate(() => document.body.innerText)
    return [/Opšti uspjeh/i.test(tt) && /Moj cilj/i.test(tt) && /Izostanci/i.test(tt) && /Demo/.test(tt), tt.slice(0, 120).replace(/\n/g, ' ')]
  })
  await check('ucenik', '/ednevnik subject expands + plan', async () => { const btns = await s.page.$$('section button'); for (const b of btns) { const tt = await s.page.evaluate((e) => e.innerText, b); if (/Ø/.test(tt)) { await b.click(); break } } await sleep(500); const tt = await s.page.evaluate(() => document.body.innerText); return [/Ocjene po redu/i.test(tt), ''] })
  await check('ucenik', '/ednevnik logout returns to setup', async () => { const b = await s.page.$('button[aria-label="Odjavi eDnevnik"]'); if (!b) return [false, 'no logout button']; await b.click(); await sleep(1500); const tt = await s.page.evaluate(() => document.body.innerText); return [/Tvoje ocjene, na jednom mjestu/.test(tt), ''] })

  t = await go(s.page, '/profile', 2000)
  await check('ucenik', '/profile: role switcher + rows', () => [/Isprobaj kao|ISPROBAJ KAO/i.test(t) && /Učenik/.test(t) && /Profesor/.test(t) && /Direktor/.test(t) && /Kalkulator/.test(t) && !/Podešavanja|Registrovanih|Napravio/.test(t), ''])
  await check('ucenik', '/profile: no panel rows for a pupil', () => [!/Panel profesora|Aplikacija\n/.test(t), ''])
  await check('ucenik', '/profile: calculator opens', async () => { await clickText(s.page, 'button', /kalkulator/i); await sleep(600); const tt = await s.page.evaluate(() => document.body.innerText); return [/prosjek|Prosjek|Kalkulator/i.test(tt) && tt !== t, ''] })
  await check('ucenik', 'notification bell opens', async () => { await go(s.page, '/news', 1500); const ok = await clickText(s.page, 'button', /obavje|notif|zvono/i); await sleep(600); const tt = await s.page.evaluate(() => document.body.innerText); return [ok && /Obavještenja|obavještenj/i.test(tt), ''] })

  for (const [path, re] of [['/grades', /ocjen/i], ['/schedule', /Raspored|Ponedjeljak|čas/i], ['/teachers', /Profesor|Status/i], ['/about', /Niko Rolović|škol/i], ['/game', /SCORE|BEST|Block/i], ['/tournament', /Turnir|košarc/i]]) {
    const tt = await go(s.page, path, 1500)
    await check('ucenik', `${path} renders`, async () => [re.test(tt) && !(await overflow(s.page)), tt.slice(0, 80).replace(/\n/g, ' ')])
  }
  await check('ucenik', '/tournament bracket fits', async () => { await clickText(s.page, 'button', /setka/i); await sleep(600); return [!(await overflow(s.page)), ''] })
  await check('ucenik', '/api/track accepted', () => { const tr = s.api.filter((a) => a.url.startsWith('/api/track')); return [tr.length > 0 && tr.every((a) => a.status === 204 || a.status === 200), `${tr.length} calls, statuses ${[...new Set(tr.map((a) => a.status))]}`] })
  await check('ucenik', 'no JS page errors', () => [noErrors(s).length === 0, noErrors(s).slice(0, 3).join(' | ')])
  await s.close()
}

// ─────────────────────────── PROFESOR ───────────────────────────
{
  const s = await session('nastavnik')
  await check('profesor', 'auto-login as demo teacher', () => [/Profesor/.test(s.roleText), ''])
  await check('profesor', '/profile shows Panel profesora row', () => [/Panel profesora/.test(s.roleText) && !/Panel direktora|Aplikacija\n/.test(s.roleText), ''])
  for (const [path, re] of [['/nastavnik', /Objavljene lekcije|Otvaranja/i], ['/nastavnik/lekcije', /lekcij/i], ['/nastavnik/razredi', /razred/i], ['/nastavnik/domaci', /Domaći/i]]) {
    const tt = await go(s.page, path, 3500)
    await check('profesor', `${path} loads with numbers`, async () => [re.test(tt) && /\d/.test(tt) && !/nije dostupan|Ova stranica se nije učitala/i.test(tt) && !(await overflow(s.page)), tt.slice(0, 100).replace(/\n/g, ' ')])
  }
  await check('profesor', '/admin/photos moderation opens', async () => { const tt = await go(s.page, '/admin/photos', 3000); return [/Moderacija fotografija/.test(tt), tt.slice(0, 80).replace(/\n/g, ' ')] })
  await check('profesor', '/skola denied to plain teacher', async () => { const tt = await go(s.page, '/skola', 3000); return [/nije dostupan/i.test(tt), tt.slice(0, 80).replace(/\n/g, ' ')] })
  await check('profesor', 'stats API all 2xx', () => { const bad = s.api.filter((a) => a.status >= 400 && !/track/.test(a.url)); return [bad.length === 0, bad.map((a) => `${a.status} ${a.url}`).join(', ')] })
  await check('profesor', 'no JS page errors', () => [noErrors(s).length === 0, noErrors(s).slice(0, 3).join(' | ')])
  await s.close()
}

// ─────────────────────────── DIREKTOR ───────────────────────────
{
  const s = await session('direktor')
  await check('direktor', 'auto-login as demo director', () => [/Direktor/.test(s.roleText), ''])
  await check('direktor', '/profile shows Škola + Aplikacija + Profesor rows', () => [/Škola\n/.test(s.roleText) && /Aplikacija\n/.test(s.roleText) && /Panel profesora/.test(s.roleText), ''])
  for (const [path, re] of [['/skola', /Prosjek škole/], ['/skola/ucenje', /Kvizovi/], ['/skola/odjeljenja', /Rang odjeljenja/], ['/skola/odjeljenja/3-4', /Odjeljenje 3-4/], ['/skola/ponasanje', /Zabilješke|zabilje/i], ['/skola/unos', /Odakle dolaze ocjene/], ['/aplikacija', /Aktivni danas/], ['/aplikacija/sadrzaj', /Vijesti/], ['/aplikacija/uredjaji', /Uređaji/]]) {
    const tt = await go(s.page, path, 3500)
    await check('direktor', `${path} loads with numbers`, async () => [re.test(tt) && /\d/.test(tt) && !/Ova stranica se nije učitala|Failed/i.test(tt) && !(await overflow(s.page)), tt.slice(0, 100).replace(/\n/g, ' ')])
  }
  await check('direktor', '/skola period switch reloads numbers', async () => { await go(s.page, '/skola', 3000); const a = await s.page.evaluate(() => document.body.innerText); await clickText(s.page, '[role=tab]', /prošla godina/i); await sleep(3500); const b = await s.page.evaluate(() => document.body.innerText); return [a !== b && /Prosjek škole/.test(b), ''] })
  await check('direktor', '/skola/ponasanje add + delete note', async () => {
    await go(s.page, '/skola/ponasanje', 3000)
    await clickText(s.page, 'button', /nova zabilješka/i); await sleep(400)
    await s.page.type('textarea', 'E2E test zabilješka — obriši me')
    await clickText(s.page, 'button', /sačuvaj/i); await sleep(3500)
    let tt = await s.page.evaluate(() => document.body.innerText)
    const added = /E2E test zabilješka/.test(tt)
    // delete it (trash button on the first card)
    const del = await s.page.$('button[aria-label="Obriši"]'); if (del) { await del.click(); await sleep(3000) }
    tt = await s.page.evaluate(() => document.body.innerText)
    return [added && !/E2E test zabilješka/.test(tt), added ? 'added' : 'not added']
  })
  await check('direktor', '/skola/unos import 2 rows', async () => {
    await go(s.page, '/skola/unos', 3000)
    await s.page.type('textarea', '1;1;E2E Predmet;4;14.09.2026;pismeni;E2E Uc\n1;1;E2E Predmet;5;14.09.2026;usmeni;E2E Uc')
    await clickText(s.page, 'button', /uvezi/i); await sleep(3500)
    const tt = await s.page.evaluate(() => document.body.innerText)
    return [/Uvezeno 2/.test(tt), (tt.match(/Uvezeno[^\n]*/) || [''])[0]]
  })
  await check('direktor', '/api/direktor/export CSV', async () => { const r = await s.page.evaluate(async () => { const x = await fetch('/api/direktor/export?format=csv&screen=pregled&period=7d', { credentials: 'same-origin' }); return { s: x.status, ct: x.headers.get('content-type'), len: (await x.text()).length } }); return [r.s === 200 && /csv/.test(r.ct || '') && r.len > 50, JSON.stringify(r)] })
  for (const [path, re] of [['/admin', /Admin|admin/i], ['/admin/news', /Novosti|Vijesti|novost/i], ['/admin/events', /Događaj|događaj|event/i], ['/admin/lectures', /Lekcij|lekcij/i], ['/admin/students', /Učenici|učenik/i]]) {
    const tt = await go(s.page, path, 3000)
    await check('direktor', `${path} opens`, () => [re.test(tt) && !/Stranica ne postoji/.test(tt), tt.slice(0, 80).replace(/\n/g, ' ')])
  }
  await check('direktor', 'role switch → Učenik lands on /lectures as a pupil', async () => { await go(s.page, '/profile', 2500); await clickText(s.page, 'button', /^\s*učenik\s*$/i); await sleep(7000); const url = s.page.url(); const tt = await go(s.page, '/profile', 3000); return [/\/lectures/.test(url) && /Uloga\s*\n?\s*Učenik|ULOGA/.test(tt) && !/Direktor\s*\n\s*ULOGA/.test(tt), `${url}`] })
  await check('direktor', 'stats API all 2xx', () => { const bad = s.api.filter((a) => a.status >= 400 && !/track/.test(a.url)); return [bad.length === 0, bad.map((a) => `${a.status} ${a.url}`).join(', ')] })
  await check('direktor', 'no JS page errors', () => [noErrors(s).length === 0, noErrors(s).slice(0, 3).join(' | ')])
  await s.close()
}

// ─────────────────────────── STUDENT API ───────────────────────────
{
  const s = await session('ucenik')
  await check('api', '/api/skola/sync stores pupil grades', async () => { const r = await s.page.evaluate(async () => { const x = await fetch('/api/skola/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ subjects: [{ name: 'E2E Sync', grades: [{ grade: 4, type: 'usmeni', date: '2026-09-14' }] }], absences: [{ date: '2026-09-14', hours: 2, justified: false }] }) }); return { s: x.status, j: await x.json().catch(() => null) } }); return [r.s === 200 && r.j && (r.j.grades >= 0), JSON.stringify(r)] })
  await check('api', '/api/skola/stats forbidden for pupil', async () => { const st = await s.page.evaluate(async () => (await fetch('/api/skola/stats?period=year', { credentials: 'same-origin' })).status); return [st === 403, String(st)] })
  await check('api', '/api/direktor/stats forbidden for pupil', async () => { const st = await s.page.evaluate(async () => (await fetch('/api/direktor/stats?period=7d', { credentials: 'same-origin' })).status); return [st === 403, String(st)] })
  await s.close()
}

await browser.close()
const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? ' — FAILED: ' + failed.map((f) => `[${f.group}] ${f.name}`).join('; ') : ''}`)
await writeFile('docs/screens/check-all.json', JSON.stringify(results, null, 2))
process.exit(failed.length ? 1 : 0)
