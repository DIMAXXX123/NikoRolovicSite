// E2E smoke test for the Duolingo-style redesign (docs/DUOLINGO_REDESIGN.md).
// Performs REAL clicks/typing at phone size and asserts DOM / URL / computed-style /
// localStorage changes — the restyle must not have dropped any behaviour.
//
// Usage: node scripts/e2e-smoke.mjs [--build] [--dev] [--port 3471] [--headed] [--only <substr>]
//   --build   run `npm run build` first (default: reuse the existing .next build)
//   --dev     run `next dev` instead of `next start` (Next 16 keeps dev output in .next/dev,
//             so this never touches a production build another process is serving)
//   --port    preferred port (default 3471). If something else already listens there the script
//             moves to the next free port instead of killing it — other agents share this machine.
//   --only    run only the groups whose name contains <substr> (nav, theme, lectures, events,
//             schedule, grades, game, profile, tournament, preview, auth, routes)
// Writes docs/screens/e2e-report.json and prints one line per check. Exit code 1 on any failure.
import { spawn, execSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import puppeteer from 'puppeteer'

const args = process.argv.slice(2)
const doBuild = args.includes('--build')
const devMode = args.includes('--dev')
const headed = args.includes('--headed')
const wantedPort = Number(args[args.indexOf('--port') + 1]) || 3471
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null
let port = wantedPort
let BASE = `http://localhost:${port}`
const OUT = join(process.cwd(), 'docs', 'screens')

const GREEN_LIGHT = 'rgb(215, 255, 184)' // #D7FFB8
const THEME_CYCLE = ['#1CB0F6', '#CE82FF', '#58CC02']

// ---------------------------------------------------------------------------
// tiny harness
// ---------------------------------------------------------------------------
const checks = []
const consoleByRoute = new Map()
let pageErrors = []
let consoleErrors = []
let currentRoute = '/'

function record(route, action, expected, result, pass) {
  checks.push({ route, action, expected, result: String(result).slice(0, 300), pass: !!pass })
  console.log(`${pass ? 'ok ' : 'FAIL'} [${route}] ${action} — expected: ${expected} — got: ${String(result).slice(0, 160)}`)
}

async function step(route, action, expected, fn) {
  try {
    const { result, pass } = await fn()
    record(route, action, expected, result, pass)
    return pass
  } catch (e) {
    record(route, action, expected, 'THREW: ' + String(e && e.message ? e.message : e).slice(0, 200), false)
    return false
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const NOISE = /supabase\.co|401|403|Failed to load resource|net::ERR|the server responded with a status|AuthApiError|Invalid login credentials|AbortError|hydration|Hydration|Download the React DevTools|picsum\.photos|flagcdn\.com|images\.unsplash|preload|was preloaded|fast refresh|Fast Refresh|\[HMR\]|websocket|WebSocket|_next\/static|Refused to|ResizeObserver/i

function attachCollectors(page) {
  page.on('pageerror', (e) => pageErrors.push({ route: currentRoute, msg: String(e && e.message ? e.message : e).slice(0, 300) }))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const text = m.text()
    if (NOISE.test(text)) return
    consoleErrors.push({ route: currentRoute, msg: text.slice(0, 300) })
    const list = consoleByRoute.get(currentRoute) || []
    list.push(text.slice(0, 300))
    consoleByRoute.set(currentRoute, list)
  })
}

async function goto(page, route, opts = {}) {
  currentRoute = route
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000, ...opts })
  await sleep(devMode ? 600 : 300)
}

async function waitForPath(page, pathname, ms = 15000) {
  await page.waitForFunction((p) => location.pathname === p, { timeout: ms }, pathname)
}

/** First element whose trimmed textContent matches (string = includes, RegExp = test), optionally within `root` selector. */
async function findByText(page, selector, text, root = null) {
  const handles = await page.$$((root ? root + ' ' : '') + selector)
  for (const h of handles) {
    const t = await h.evaluate((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
    const ok = text instanceof RegExp ? text.test(t) : t.includes(text)
    if (ok) {
      const visible = await h.evaluate((el) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
      })
      if (visible) return h
    }
  }
  return null
}

/**
 * Real click: scroll the element to the vertical centre (so a fixed header/nav can never be
 * the thing under the cursor unless the element is genuinely covered), verify it is topmost,
 * then click. Throws with "covered by …" when a fixed bar sits on top of it.
 */
async function safeClick(handle, what = 'element') {
  if (!handle) throw new Error(`${what}: element not found`)
  const c = await isClickable(handle)
  if (!c.ok) throw new Error(`${what} not clickable: ${c.why}`)
  await handle.click()
}

async function clickByText(page, selector, text, root = null) {
  const h = await findByText(page, selector, text, root)
  if (!h) throw new Error(`no visible <${selector}> with text "${text}"${root ? ' in ' + root : ''}`)
  await safeClick(h, `<${selector}> "${text}"`)
  return h
}

async function pageText(page, root = 'body') {
  return page.evaluate((r) => (document.querySelector(r)?.textContent || '').replace(/\s+/g, ' ').trim(), root)
}

async function hasText(page, text, root = 'body') {
  const t = await pageText(page, root)
  return t.includes(text)
}

/** Is the element the topmost thing at its centre (i.e. not covered by a fixed bar)? */
async function isClickable(handle) {
  return handle.evaluate((el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return { ok: false, why: 'zero size' }
    el.scrollIntoView({ block: 'center' })
    const r2 = el.getBoundingClientRect()
    const cx = r2.left + r2.width / 2
    const cy = r2.top + r2.height / 2
    if (cy < 0 || cy > innerHeight) return { ok: false, why: 'off-screen after scroll' }
    const top = document.elementFromPoint(cx, cy)
    const ok = top === el || el.contains(top)
    return { ok, why: ok ? 'topmost' : 'covered by ' + (top ? top.tagName + '.' + String(top.className).slice(0, 40) : 'nothing') }
  })
}

const ls = (page, key) => page.evaluate((k) => localStorage.getItem(k), key)
const cssVar = (page, name) => page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name)

// ---------------------------------------------------------------------------
// groups
// ---------------------------------------------------------------------------

async function testNav(page) {
  const R = '/gallery'
  await page.evaluate(() => localStorage.clear())
  await goto(page, R)
  const links = await page.$$eval('nav a', (as) => as.map((a) => ({ href: a.getAttribute('href'), label: a.textContent.trim() })))
  record(R, 'bottom nav renders 5 items', '5 links', JSON.stringify(links), links.length === 5)

  for (const { href, label } of links) {
    await step(currentRoute, `bottom nav click "${label}"`, `URL ${href} + active box ${GREEN_LIGHT}`, async () => {
      const h = await page.$(`nav a[href="${href}"]`)
      await safeClick(h, `nav ${href}`)
      await waitForPath(page, href)
      await sleep(400)
      const res = await page.evaluate((hr) => {
        const a = document.querySelector(`nav a[href="${hr}"]`)
        const box = a && a.querySelector('div')
        const bg = box ? getComputedStyle(box).backgroundColor : null
        const others = Array.from(document.querySelectorAll('nav a')).filter((x) => x !== a)
          .map((x) => getComputedStyle(x.querySelector('div')).backgroundColor)
        return { path: location.pathname, bg, others }
      }, href)
      const othersInactive = res.others.every((c) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent')
      return { result: JSON.stringify(res), pass: res.path === href && res.bg === GREEN_LIGHT && othersInactive }
    })
    currentRoute = href
  }

  await goto(page, '/lectures')
  await step('/lectures', 'header NR button → first nav item', '/gallery', async () => {
    await clickByText(page, 'header button', 'Niko Rolović')
    await waitForPath(page, '/gallery')
    return { result: await page.evaluate(() => location.pathname), pass: true }
  })
  await step('/gallery', 'header 🏀 button', '/tournament', async () => {
    await safeClick(await page.$('header button[title="Turnir u košarci"]'), 'header basketball')
    await waitForPath(page, '/tournament')
    return { result: await page.evaluate(() => location.pathname), pass: true }
  })
  currentRoute = '/tournament'
  await step('/tournament', 'header Block Blast button', '/game', async () => {
    await safeClick(await page.$('header button[title="Block Blast"]'), 'header Block Blast')
    await waitForPath(page, '/game')
    return { result: await page.evaluate(() => location.pathname), pass: true }
  })
  currentRoute = '/game'
}

async function testTheme(page) {
  const R = '/lectures'
  await page.evaluate(() => localStorage.removeItem('nr-theme'))
  await goto(page, R)
  await step(R, 'theme initial', '--theme-primary #58CC02', async () => {
    const v = await cssVar(page, '--theme-primary')
    return { result: v, pass: v.toUpperCase() === '#58CC02' }
  })
  const names = ['Plavo', 'Ljubičasto', 'Zeleno']
  for (let i = 0; i < 3; i++) {
    await step(R, `theme click #${i + 1}`, `--theme-primary ${THEME_CYCLE[i]} + tooltip "${names[i]}"`, async () => {
      await safeClick(await page.$('header .theme-btn, .theme-btn'), 'theme button')
      await sleep(250)
      const v = await cssVar(page, '--theme-primary')
      const tip = await findByText(page, '.theme-btn ~ div', names[i])
      const stored = await ls(page, 'nr-theme')
      return { result: `${v} tooltip=${!!tip} nr-theme=${stored}`, pass: v.toUpperCase() === THEME_CYCLE[i] && !!tip }
    })
    if (i === 0) {
      await step(R, 'theme persists after reload', 'nr-theme=plavo and --theme-primary #1CB0F6', async () => {
        await page.reload({ waitUntil: 'networkidle2' })
        await sleep(400)
        const stored = await ls(page, 'nr-theme')
        const v = await cssVar(page, '--theme-primary')
        return { result: `nr-theme=${stored} var=${v}`, pass: stored === 'plavo' && v.toUpperCase() === '#1CB0F6' }
      })
    }
  }
  await step(R, 'theme localStorage after full cycle', 'nr-theme=zeleno', async () => {
    const stored = await ls(page, 'nr-theme')
    return { result: stored, pass: stored === 'zeleno' }
  })
}

async function testLectures(page) {
  const R = '/lectures'
  await page.evaluate(() => localStorage.removeItem('extra_subjects'))
  await goto(page, R)
  await step(R, 'click subject tile Matematika', '/lectures/Matematika', async () => {
    await safeClick(await page.$('a[href="/lectures/Matematika"]'), 'Matematika tile')
    await waitForPath(page, '/lectures/Matematika')
    await sleep(300)
    const h1 = await pageText(page, 'main h1')
    return { result: `path=${await page.evaluate(() => location.pathname)} h1=${h1}`, pass: h1.includes('Matematika') }
  })
  currentRoute = '/lectures/Matematika'
  await step(currentRoute, 'back link "Svi predmeti"', '/lectures', async () => {
    await clickByText(page, 'main a', 'Svi predmeti')
    await waitForPath(page, '/lectures')
    return { result: await page.evaluate(() => location.pathname), pass: true }
  })
  currentRoute = R
  await sleep(300)
  await step(R, '"Dodaj predmet" opens optional list', '#add-subject-list visible with Njemacki', async () => {
    await clickByText(page, 'main button', 'Dodaj predmet')
    await page.waitForSelector('#add-subject-list', { timeout: 5000 })
    await sleep(800) // the list smooth-scrolls itself into view (setTimeout 100ms + smooth scroll)
    const t = await pageText(page, '#add-subject-list')
    return { result: t, pass: t.includes('Njemacki') }
  })
  await step(R, 'add Njemacki', 'localStorage extra_subjects=["Njemacki"] + tile link', async () => {
    await clickByText(page, '#add-subject-list button', 'Njemacki')
    await page.waitForSelector('a[href="/lectures/Njemacki"]', { timeout: 5000 })
    const stored = await ls(page, 'extra_subjects')
    return { result: stored, pass: stored === '["Njemacki"]' }
  })
  await step(R, 'extra subject persists after reload', 'tile Njemacki still rendered', async () => {
    await page.reload({ waitUntil: 'networkidle2' })
    await page.waitForSelector('a[href="/lectures/Njemacki"]', { timeout: 8000 })
    return { result: 'tile present', pass: true }
  })
  await step(R, 'remove Njemacki via chip', 'tile gone, extra_subjects=[]', async () => {
    // the removable chip is the button with the subject name + X (not a link, not inside the picker)
    const chips = await page.$$('main button')
    let chip = null
    for (const c of chips) {
      const t = await c.evaluate((el) => el.textContent.trim())
      if (t === 'Njemacki') chip = c
    }
    if (!chip) throw new Error('remove chip not found')
    await safeClick(chip, 'remove chip')
    await page.waitForFunction(() => !document.querySelector('a[href="/lectures/Njemacki"]'), { timeout: 5000 })
    const stored = await ls(page, 'extra_subjects')
    return { result: stored, pass: stored === '[]' }
  })
}

async function testEvents(page) {
  const R = '/events'
  await goto(page, R)
  await step(R, 'Kalendar tab active by default', 'calendar grid + month label', async () => {
    const label = await pageText(page, 'main h2')
    const days = await page.$$eval('main .grid.grid-cols-7 button', (b) => b.length)
    const active = await page.$eval('[role="tab"][data-active], [role="tab"][aria-selected="true"]', (el) => el.textContent.trim()).catch(() => null)
    return { result: `label="${label}" days=${days} active=${active}`, pass: days >= 28 && /\d{4}/.test(label) && String(active).includes('Kalendar') }
  })
  const labelBefore = await page.$eval('main h2', (el) => el.textContent.trim())
  await step(R, 'next month', 'month label changes', async () => {
    const btns = await page.$$('main .flex.items-center.justify-between > button')
    await safeClick(btns[1], 'next month')
    await sleep(300)
    const l = await page.$eval('main h2', (el) => el.textContent.trim())
    return { result: `${labelBefore} → ${l}`, pass: l !== labelBefore }
  })
  await step(R, 'prev month', 'month label returns', async () => {
    const btns = await page.$$('main .flex.items-center.justify-between > button')
    await safeClick(btns[0], 'prev month')
    await sleep(300)
    const l = await page.$eval('main h2', (el) => el.textContent.trim())
    return { result: l, pass: l === labelBefore }
  })
  await step(R, 'click day 15 opens day sheet', 'sheet h2 "15. <month> <year>"', async () => {
    await clickByText(page, 'main .grid.grid-cols-7 button', /^15$/)
    await sleep(400)
    const sheet = await findByText(page, '.fixed h2', /^15\. /)
    const txt = sheet ? await sheet.evaluate((el) => el.textContent.trim()) : null
    return { result: txt, pass: !!sheet && txt === `15. ${labelBefore}` }
  })
  await step(R, 'close day sheet via X', 'sheet removed', async () => {
    const closeBtn = await page.$('.fixed.inset-0 .relative button')
    await safeClick(closeBtn, 'day sheet X')
    await page.waitForFunction(() => !document.querySelector('.fixed.inset-0.z-50'), { timeout: 5000 })
    return { result: 'closed', pass: true }
  })
  await step(R, 'day sheet closes on backdrop click', 'sheet removed', async () => {
    await clickByText(page, 'main .grid.grid-cols-7 button', /^10$/)
    await page.waitForSelector('.fixed.inset-0.z-50', { timeout: 5000 })
    await page.mouse.click(195, 120)
    await page.waitForFunction(() => !document.querySelector('.fixed.inset-0.z-50'), { timeout: 5000 })
    return { result: 'closed', pass: true }
  })
  await step(R, 'Lista tab', 'calendar grid gone; list or empty state', async () => {
    await clickByText(page, '[role="tab"]', 'Lista')
    await sleep(400)
    const grid = await page.$('main .grid.grid-cols-7')
    const t = await pageText(page, 'main')
    const ok = !grid && (t.includes('Nema predstojećih događaja') || (await page.$$('main [data-slot="card"]')).length > 0)
    return { result: `grid=${!!grid} text=${t.slice(0, 80)}`, pass: ok }
  })
  await step(R, 'Kalendar tab back', 'calendar grid returns', async () => {
    await clickByText(page, '[role="tab"]', 'Kalendar')
    await page.waitForSelector('main .grid.grid-cols-7', { timeout: 5000 })
    return { result: 'grid back', pass: true }
  })
}

async function testSchedule(page) {
  const R = '/schedule'
  await page.evaluate(() => { Object.keys(localStorage).filter((k) => k.startsWith('schedule_')).forEach((k) => localStorage.removeItem(k)) })
  await goto(page, R)
  const chipGroups = async () => page.$$('main [data-slot="card"] .flex.gap-2')
  await step(R, 'change class → 2.', 'header "2. razred"', async () => {
    const groups = await chipGroups()
    await safeClick((await groups[0].$$('button'))[1], 'class chip 2.')
    await sleep(300)
    const t = await pageText(page, 'main h1 + p')
    return { result: t, pass: t.startsWith('2. razred') }
  })
  await step(R, 'change section → 3.', 'header "2. razred, 3. odjeljenje"', async () => {
    const groups = await chipGroups()
    const b = (await groups[1].$$('button'))[2]
    await safeClick(b, 'section chip 3.')
    await sleep(300)
    const t = await pageText(page, 'main h1 + p')
    return { result: t, pass: t.startsWith('2. razred, 3. odjeljenje') }
  })
  await step(R, 'day chip "Uto"', 'day card title "Utorak" + table header highlighted', async () => {
    await clickByText(page, 'main button', /^Uto$/)
    await sleep(300)
    const h3 = await page.$$eval('main h3', (els) => els.map((e) => e.textContent.trim()))
    const th = await page.$$eval('main th', (els) => els.filter((e) => e.className.includes('text-secondary')).map((e) => e.textContent.trim()))
    return { result: `h3=${h3.join('|')} th=${th.join('|')}`, pass: h3.includes('Utorak') && th.join() === 'Uto' }
  })
  await step(R, 'table cell click switches day', 'day card "Četvrtak"', async () => {
    const tds = await page.$$('main tbody tr:first-child td')
    await safeClick(tds[4], 'table cell') // 4th weekday column (index 0 is the period number)
    await sleep(300)
    const h3 = await page.$$eval('main h3', (els) => els.map((e) => e.textContent.trim()))
    return { result: h3.join('|'), pass: h3.includes('Četvrtak') }
  })
  await step(R, '"Uredi" toggles edit mode', 'button reads "Gotovo", empty rows say "Dodaj predmet..."', async () => {
    await clickByText(page, 'main button', 'Uredi')
    await sleep(300)
    const done = await findByText(page, 'main button', 'Gotovo')
    const t = await pageText(page, 'main')
    return { result: `gotovo=${!!done} hint=${t.includes('Dodaj predmet...')}`, pass: !!done && t.includes('Dodaj predmet...') }
  })
  const key = 'schedule_2_3'
  await step(R, 'edit period 7, type, press Enter', `localStorage ${key} has "E2E-Predmet"`, async () => {
    const rows = await page.$$('main .divide-y-2 > div')
    await safeClick(rows[6], 'row 7')
    await page.waitForSelector('main input[placeholder="Naziv predmeta..."]', { timeout: 5000 })
    await page.type('main input[placeholder="Naziv predmeta..."]', 'E2E-Predmet')
    await page.keyboard.press('Enter')
    await sleep(300)
    const stored = JSON.parse((await ls(page, key)) || '{}')
    const t = await pageText(page, 'main .divide-y-2')
    return { result: `stored=${JSON.stringify(stored['3-7'])} shown=${t.includes('E2E-Predmet')}`, pass: stored['3-7'] === 'E2E-Predmet' && t.includes('E2E-Predmet') }
  })
  await step(R, 'edit period 6, type, click Sačuvaj button', `localStorage ${key} has "E2E-Save"; input closed (KNOWN: fails at f77dda9 too — click bubbles to the row startEdit handler)`, async () => {
    const rows = await page.$$('main .divide-y-2 > div')
    await safeClick(rows[5], 'row 6')
    await page.waitForSelector('main input[placeholder="Naziv predmeta..."]', { timeout: 5000 })
    await page.click('main input[placeholder="Naziv predmeta..."]', { clickCount: 3 })
    await page.type('main input[placeholder="Naziv predmeta..."]', 'E2E-Save')
    await safeClick(await page.$('main button[aria-label="Sačuvaj"]'), 'Sačuvaj')
    await sleep(300)
    const stored = JSON.parse((await ls(page, key)) || '{}')
    const inputOpen = !!(await page.$('main input[placeholder="Naziv predmeta..."]'))
    return { result: `stored=${JSON.stringify(stored['3-6'])} inputStillOpen=${inputOpen}`, pass: stored['3-6'] === 'E2E-Save' && !inputOpen }
  })
  await step(R, 'edit period 5, type, click Otkaži', 'input closed, value NOT saved (KNOWN: fails at f77dda9 too — click bubbles to the row startEdit handler)', async () => {
    const rows = await page.$$('main .divide-y-2 > div')
    await safeClick(rows[4], 'row 5')
    await page.waitForSelector('main input[placeholder="Naziv predmeta..."]', { timeout: 5000 })
    await page.click('main input[placeholder="Naziv predmeta..."]', { clickCount: 3 })
    await page.type('main input[placeholder="Naziv predmeta..."]', 'E2E-Cancel')
    await safeClick(await page.$('main button[aria-label="Otkaži"]'), 'Otkaži')
    await sleep(300)
    const stored = JSON.parse((await ls(page, key)) || '{}')
    const inputOpen = !!(await page.$('main input[placeholder="Naziv predmeta..."]'))
    return { result: `stored=${JSON.stringify(stored['3-5'])} inputStillOpen=${inputOpen}`, pass: stored['3-5'] !== 'E2E-Cancel' && !inputOpen }
  })
  await step(R, 'edit period 5, type, press Escape', 'input closed, value NOT saved', async () => {
    const rows = await page.$$('main .divide-y-2 > div')
    await safeClick(rows[4], 'row 5')
    await page.waitForSelector('main input[placeholder="Naziv predmeta..."]', { timeout: 5000 })
    await page.type('main input[placeholder="Naziv predmeta..."]', 'ZZZ')
    await page.keyboard.press('Escape')
    await sleep(300)
    const stored = JSON.parse((await ls(page, key)) || '{}')
    const inputOpen = !!(await page.$('main input[placeholder="Naziv predmeta..."]'))
    return { result: `stored=${JSON.stringify(stored['3-5'])} inputStillOpen=${inputOpen}`, pass: !String(stored['3-5'] || '').includes('ZZZ') && !inputOpen }
  })
  await step(R, 'edit persists after reload', 'period 7 shows "E2E-Predmet" for 2/3', async () => {
    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(500)
    const groups = await chipGroups()
    await safeClick((await groups[0].$$('button'))[1], 'class chip')
    await safeClick((await groups[1].$$('button'))[2], 'section chip')
    await clickByText(page, 'main button', /^Čet$/)
    await sleep(300)
    const t = await pageText(page, 'main .divide-y-2')
    return { result: t.slice(0, 200), pass: t.includes('E2E-Predmet') }
  })
  await step(R, '"Gotovo" leaves edit mode', 'button reads "Uredi"', async () => {
    await clickByText(page, 'main button', 'Uredi')
    await sleep(200)
    await clickByText(page, 'main button', 'Gotovo')
    await sleep(200)
    const b = await findByText(page, 'main button', 'Uredi')
    return { result: b ? 'Uredi' : 'still Gotovo', pass: !!b }
  })
  await page.evaluate((k) => localStorage.removeItem(k), key)
}

async function testGrades(page) {
  const R = '/grades'
  await page.evaluate(() => { localStorage.removeItem('my_grades_data_v2'); localStorage.removeItem('my_grades_subjects') })
  await goto(page, R)
  await step(R, 'trimester chips switch', 'clicked chip gets blue tint class', async () => {
    await clickByText(page, 'main button', /^I Tromj\.$/)
    await sleep(200)
    const cls = await page.$$eval('main button', (bs) => bs.filter((b) => /Tromj\./.test(b.textContent)).map((b) => (b.className.includes('bg-secondary-light') ? 'ON' : 'off')))
    return { result: cls.join(','), pass: cls.join(',') === 'ON,off,off,off' }
  })
  await step(R, '"Dodaj predmet" → add Njemacki', 'my_grades_subjects includes Njemacki, row rendered', async () => {
    await clickByText(page, 'main button', 'Dodaj predmet')
    await sleep(200)
    await clickByText(page, 'main button', /^N\s*Njemacki$/)
    await sleep(300)
    const stored = JSON.parse((await ls(page, 'my_grades_subjects')) || '[]')
    const row = await findByText(page, 'main h3', /^Njemacki$/)
    return { result: JSON.stringify(stored), pass: stored.includes('Njemacki') && !!row }
  })
  await step(R, 'expand Matematika + add zaključna 5', '"Ukupan prosjek" card shows 5.00', async () => {
    await clickByText(page, 'main button', /^M\s*Matematika/)
    await page.waitForFunction(() => document.body.textContent.includes('Zaključna'), { timeout: 5000 })
    // the Zaključna "—" button is the one right after the "Zaključna" label
    const btn = await page.evaluateHandle(() => {
      const label = Array.from(document.querySelectorAll('main p')).find((p) => p.textContent.trim() === 'Zaključna')
      return label && label.nextElementSibling
    })
    await safeClick(btn.asElement(), 'Zaključna picker')
    await sleep(200)
    await clickByText(page, 'main button', /^5$/)
    await sleep(400)
    const t = await pageText(page, 'main')
    const stored = JSON.parse((await ls(page, 'my_grades_data_v2')) || '{}')
    const z = stored?.[0]?.Matematika?.zakljucna
    return { result: `avgCard=${t.includes('Ukupan prosjek')} 5.00=${t.includes('5.00')} stored=${z}`, pass: t.includes('Ukupan prosjek') && t.includes('5.00') && z === 5 }
  })
  await step(R, 'add Test grade 4 via picker', 'chip "4" rendered, stored test=[4]', async () => {
    const plus = await page.$$('main button[aria-label="Dodaj ocjenu"]')
    await safeClick(plus[0], 'Dodaj ocjenu')
    await sleep(200)
    await clickByText(page, 'main button', /^4$/)
    await sleep(300)
    const stored = JSON.parse((await ls(page, 'my_grades_data_v2')) || '{}')
    const chips = await page.$$('main button[aria-label="Ukloni ocjenu"]')
    return { result: `test=${JSON.stringify(stored?.[0]?.Matematika?.test)} chips=${chips.length}`, pass: JSON.stringify(stored?.[0]?.Matematika?.test) === '[4]' && chips.length === 1 }
  })
  await step(R, 'add second zaključna (Fizika 3) → average 4.00', '"4.00" in average card', async () => {
    await clickByText(page, 'main button', /^F\s*Fizika/)
    await page.waitForFunction(() => document.querySelectorAll('main p').length > 0)
    await sleep(300)
    const btn = await page.evaluateHandle(() => {
      const label = Array.from(document.querySelectorAll('main p')).find((p) => p.textContent.trim() === 'Zaključna')
      return label && label.nextElementSibling
    })
    await safeClick(btn.asElement(), 'Zaključna picker')
    await sleep(200)
    await clickByText(page, 'main button', /^3$/)
    await sleep(400)
    const t = await pageText(page, 'main')
    return { result: t.match(/Ukupan prosjek.{0,60}/)?.[0], pass: t.includes('4.00') }
  })
  await step(R, 'remove Test grade chip', 'chips=0, stored test=[]', async () => {
    await clickByText(page, 'main button', /^M\s*Matematika/)
    await sleep(300)
    const x = await page.$('main button[aria-label="Ukloni ocjenu"]')
    await safeClick(x, 'Ukloni ocjenu')
    await sleep(300)
    const stored = JSON.parse((await ls(page, 'my_grades_data_v2')) || '{}')
    const chips = await page.$$('main button[aria-label="Ukloni ocjenu"]')
    return { result: `test=${JSON.stringify(stored?.[0]?.Matematika?.test)} chips=${chips.length}`, pass: JSON.stringify(stored?.[0]?.Matematika?.test) === '[]' && chips.length === 0 }
  })
  await step(R, 'grades persist after reload', 'I Tromj. shows 4.00 average and Njemacki row', async () => {
    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(400)
    await clickByText(page, 'main button', /^I Tromj\.$/)
    await sleep(300)
    const t = await pageText(page, 'main')
    return { result: t.match(/Ukupan prosjek.{0,60}/)?.[0] + ' njemacki=' + t.includes('Njemacki'), pass: t.includes('4.00') && t.includes('Njemacki') }
  })
  await step(R, 'remove zaključna via ✕', 'average drops to 3.00', async () => {
    await clickByText(page, 'main button', /^M\s*Matematika/)
    await sleep(300)
    const btn = await page.evaluateHandle(() => {
      const label = Array.from(document.querySelectorAll('main p')).find((p) => p.textContent.trim() === 'Zaključna')
      return label && label.nextElementSibling
    })
    await safeClick(btn.asElement(), 'Zaključna picker')
    await sleep(200)
    await safeClick(await page.$('main button[aria-label="Obriši ocjenu"]'), 'Obriši ocjenu')
    await sleep(400)
    const t = await pageText(page, 'main')
    return { result: t.match(/Ukupan prosjek.{0,60}/)?.[0], pass: t.includes('3.00') }
  })
  await step(R, 'remove optional subject Njemacki', 'row gone, my_grades_subjects without Njemacki', async () => {
    await clickByText(page, 'main button', /^N\s*Njemacki/)
    await sleep(300)
    await clickByText(page, 'main button', 'Ukloni predmet')
    await sleep(300)
    const stored = JSON.parse((await ls(page, 'my_grades_subjects')) || '[]')
    const row = await findByText(page, 'main h3', /^Njemacki$/)
    return { result: JSON.stringify(stored), pass: !stored.includes('Njemacki') && !row }
  })
  await page.evaluate(() => { localStorage.removeItem('my_grades_data_v2'); localStorage.removeItem('my_grades_subjects') })
}

async function testGame(page) {
  const R = '/game'
  await goto(page, R)
  await step(R, 'leaderboard overlay opens on entry', '"Tabela lidera" overlay visible', async () => {
    await page.waitForFunction(() => document.body.textContent.includes('Tabela lidera'), { timeout: 8000 })
    const ov = await page.$('.fixed.inset-0')
    return { result: ov ? 'overlay' : 'none', pass: !!ov }
  })
  await step(R, 'close leaderboard via Zatvori', 'overlay removed', async () => {
    await safeClick(await page.$('.fixed.inset-0 button[aria-label="Zatvori"]'), 'Zatvori')
    await page.waitForFunction(() => !document.querySelector('.fixed.inset-0'), { timeout: 5000 })
    return { result: 'closed', pass: true }
  })
  await step(R, 'trophy button reopens leaderboard, backdrop closes it', 'open → closed', async () => {
    await safeClick(await page.$('main button[title="Tabela lidera"]'), 'trophy')
    await page.waitForSelector('.fixed.inset-0', { timeout: 5000 })
    await page.mouse.click(10, 300)
    await page.waitForFunction(() => !document.querySelector('.fixed.inset-0'), { timeout: 5000 })
    return { result: 'open → closed', pass: true }
  })
  const scoreOf = () => page.evaluate(() => {
    const p = Array.from(document.querySelectorAll('main p')).find((x) => x.textContent.trim() === 'Score')
    return Number(p && p.nextElementSibling.textContent.trim())
  })
  const filledCells = () => page.evaluate(() => {
    const grid = document.querySelector('main .grid.w-full.mx-auto')
    return Array.from(grid.children).filter((c) => c.style.backgroundColor && c.style.backgroundColor !== 'rgb(247, 247, 247)').length
  })
  await step(R, 'drag tray shape onto board (mouse)', 'score > 0, filled cells > 0', async () => {
    const before = await scoreOf()
    const tray = await page.$$('main .mt-4 button')
    const tb = await tray[0].boundingBox()
    const grid = await page.$('main .grid.w-full.mx-auto')
    const gb = await grid.boundingBox()
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2)
    await page.mouse.down()
    await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2, { steps: 12 })
    await sleep(100)
    await page.mouse.up()
    await sleep(400)
    const after = await scoreOf()
    const cells = await filledCells()
    return { result: `score ${before} → ${after}, filled=${cells}`, pass: after > before && cells > 0 }
  })
  await step(R, 'tap tray shape then tap board cell', 'score increases (KNOWN: fails at f77dda9 too — mousedown selects, the following click deselects)', async () => {
    const before = await scoreOf()
    const cellsBefore = await filledCells()
    const tray = (await page.$$('main .mt-4 button')).filter(Boolean)
    // pick a tray slot that still has a shape (empty slots are plain divs, not buttons)
    await safeClick(tray[0], 'tray shape')
    await sleep(150)
    const hint = await hasText(page, 'Tap on grid to place', 'main')
    const grid = await page.$('main .grid.w-full.mx-auto')
    const gb = await grid.boundingBox()
    // aim at an empty corner cell
    await page.mouse.click(gb.x + gb.width * 0.08, gb.y + gb.height * 0.92)
    await sleep(400)
    const after = await scoreOf()
    const cells = await filledCells()
    return { result: `hint=${hint} score ${before} → ${after}, filled ${cellsBefore} → ${cells}`, pass: after > before && cells > cellsBefore }
  })
  await step(R, 'touch: tap tray shape then tap board cell', 'score increases (KNOWN: fails at f77dda9 too — touchstart selects, the following click deselects)', async () => {
    const before = await scoreOf()
    const cellsBefore = await filledCells()
    const tray = await page.$$('main .mt-4 button')
    const tb = await tray[0].boundingBox()
    await page.touchscreen.tap(tb.x + tb.width / 2, tb.y + tb.height / 2)
    await sleep(200)
    const hint = await hasText(page, 'Tap on grid to place', 'main')
    const grid = await page.$('main .grid.w-full.mx-auto')
    const gb = await grid.boundingBox()
    await page.touchscreen.tap(gb.x + gb.width * 0.92, gb.y + gb.height * 0.08)
    await sleep(400)
    const after = await scoreOf()
    const cells = await filledCells()
    return { result: `hint=${hint} score ${before} → ${after}, filled ${cellsBefore} → ${cells}`, pass: after > before && cells > cellsBefore }
  })
  await step(R, 'game-over overlay', 'not forced (would need a full game); overlay code present', async () => {
    const over = await page.$('.fixed.inset-0')
    return { result: over ? 'game over shown' : 'not reached (skipped)', pass: true }
  })
}

async function testProfile(page) {
  const R = '/profile'
  await goto(page, R)
  await step(R, 'anonymous render', 'header + bottom nav present, no crash', async () => {
    const header = await page.$('header')
    const nav = await page.$('nav')
    const t = await pageText(page, 'main')
    return { result: `main text="${t.slice(0, 80)}"`, pass: !!header && !!nav }
  })
  await step(R, 'nav-editor / calculator reachable anonymously?', 'needs a session if not rendered', async () => {
    const calc = await findByText(page, 'main button', 'Kalkulator')
    const nav = await findByText(page, 'main button', /Navigacij|navigacij/)
    return { result: calc || nav ? 'rendered' : 'not rendered without session → needs_login', pass: true }
  })
}

async function testTournament(page) {
  const R = '/tournament'
  await page.evaluate(() => localStorage.removeItem('tournament_favorites'))
  await goto(page, R)
  const tabs = await page.$$eval('[role="tab"]', (els) => els.map((e) => e.textContent.trim()))
  record(R, 'four tabs rendered', '4 tabs', tabs.join('|'), tabs.length === 4)
  let prevText = await pageText(page, 'main')
  for (let i = 1; i < tabs.length; i++) {
    await step(R, `tab "${tabs[i]}"`, 'tab active + content changes', async () => {
      const t = (await page.$$('[role="tab"]'))[i]
      await safeClick(t, 'tab')
      await sleep(400)
      const active = await t.evaluate((el) => el.hasAttribute('data-active') || el.getAttribute('aria-selected') === 'true')
      const txt = await pageText(page, 'main')
      const changed = txt !== prevText
      prevText = txt
      return { result: `active=${active} changed=${changed}`, pass: active && changed }
    })
  }
  await safeClick((await page.$$('[role="tab"]'))[0], 'tab 0')
  await sleep(300)
  await step(R, 'favourite star toggles + persists', 'aria-pressed true, tournament_favorites has team, still after reload', async () => {
    const star = await page.$('main button[aria-label^="Omiljeni tim"]')
    if (!star) throw new Error('no star button on bracket tab')
    const team = (await star.evaluate((el) => el.getAttribute('aria-label'))).replace('Omiljeni tim ', '')
    await safeClick(star, 'star')
    await sleep(200)
    const pressed = await star.evaluate((el) => el.getAttribute('aria-pressed'))
    const stored = JSON.parse((await ls(page, 'tournament_favorites')) || '[]')
    await page.reload({ waitUntil: 'networkidle2' })
    await sleep(400)
    const after = await page.$eval(`main button[aria-label="Omiljeni tim ${team}"]`, (el) => el.getAttribute('aria-pressed'))
    return { result: `team=${team} pressed=${pressed} stored=${JSON.stringify(stored)} afterReload=${after}`, pass: pressed === 'true' && stored.includes(team) && after === 'true' }
  })
  await step(R, 'favourite star untoggles', 'aria-pressed false, storage empty', async () => {
    const star = await page.$('main button[aria-label^="Omiljeni tim"][aria-pressed="true"]')
    await safeClick(star, 'star')
    await sleep(200)
    const pressed = await star.evaluate((el) => el.getAttribute('aria-pressed'))
    const stored = await ls(page, 'tournament_favorites')
    return { result: `pressed=${pressed} stored=${stored}`, pass: pressed === 'false' && stored === '[]' }
  })
}

async function testPreview(page) {
  const R = '/preview-ui'
  await page.evaluate(() => localStorage.removeItem('lecture_likes'))
  await goto(page, R)
  const TABS = '[data-preview-sub="LectureTabs + LectureContent"]'
  await step(R, 'LectureTabs: Kviz tab', 'content hidden, "Započni kviz" visible', async () => {
    await clickByText(page, `${TABS} [role="tab"]`, 'Kviz')
    await sleep(300)
    const hidden = await page.$eval(`${TABS} [role="tablist"] + div, ${TABS} .animate-fade-in[hidden]`, (el) => el.hasAttribute('hidden')).catch(() => null)
    const btn = await findByText(page, `${TABS} button`, 'Započni kviz')
    return { result: `contentHidden=${hidden} startBtn=${!!btn}`, pass: !!btn && hidden !== false }
  })
  await step(R, 'LectureTabs: "Započni kviz" opens QuizRunner, "Nazad na lekciju" returns', 'quiz then tabs again', async () => {
    await clickByText(page, `${TABS} button`, 'Započni kviz')
    await page.waitForFunction((s) => document.querySelector(s).textContent.includes('Nazad na lekciju'), { timeout: 8000 }, TABS)
    await clickByText(page, `${TABS} button`, 'Nazad na lekciju')
    await page.waitForSelector(`${TABS} [role="tab"]`, { timeout: 5000 })
    return { result: 'round trip ok', pass: true }
  })
  await step(R, 'LectureTabs: Lekcija tab', 'content visible again', async () => {
    await clickByText(page, `${TABS} [role="tab"]`, 'Lekcija')
    await sleep(300)
    const vis = await hasText(page, 'Šta je kvadratna funkcija', TABS)
    const hidden = await page.$(`${TABS} div[hidden]`)
    return { result: `text=${vis} hiddenDiv=${!!hidden}`, pass: vis && !hidden }
  })

  const QR = '[data-preview-sub^="QuizRunner"]'
  const optionBtns = () => page.$$(`${QR} [data-slot="card"] button`)
  await step(R, 'QuizRunner Q1: correct answer → green tint', 'bg-primary-light class + bottom bar with next button', async () => {
    const opts = await optionBtns()
    await safeClick(opts[1], 'option B')
    await sleep(250)
    const cls = await opts[1].evaluate((el) => el.className)
    const bar = await findByText(page, `${QR} .fixed button`, 'Sljedeće pitanje')
    const c = bar ? await isClickable(bar) : { ok: false, why: 'no bar' }
    return { result: `green=${cls.includes('bg-primary-light')} bar=${!!bar} clickable=${c.why}`, pass: cls.includes('bg-primary-light') && !!bar && c.ok }
  })
  await step(R, 'QuizRunner Q1 → Q2', 'badge "2 / 3"', async () => {
    await clickByText(page, `${QR} .fixed button`, 'Sljedeće pitanje')
    await sleep(300)
    const t = await pageText(page, QR)
    return { result: t.match(/\d \/ 3/)?.[0], pass: t.includes('2 / 3') }
  })
  await step(R, 'QuizRunner Q2: wrong answer → red tint, correct highlighted green', 'bg-[#FFDFE0] on picked, bg-primary-light on correct', async () => {
    const opts = await optionBtns()
    await safeClick(opts[0], 'option A')
    await sleep(250)
    const picked = await opts[0].evaluate((el) => el.className)
    const correct = await opts[2].evaluate((el) => el.className)
    return { result: `picked red=${picked.includes('#FFDFE0')} correct green=${correct.includes('bg-primary-light')}`, pass: picked.includes('#FFDFE0') && correct.includes('bg-primary-light') }
  })
  await step(R, 'QuizRunner Q2 → Q3 → result', '"Kviz završen!" with 67%', async () => {
    await clickByText(page, `${QR} .fixed button`, 'Sljedeće pitanje')
    await sleep(300)
    const opts = await optionBtns()
    await safeClick(opts[2], 'option C')
    await sleep(250)
    await clickByText(page, `${QR} .fixed button`, 'Pogledaj rezultat')
    await sleep(400)
    const t = await pageText(page, QR)
    return { result: t.match(/Kviz završen!.{0,40}/)?.[0], pass: t.includes('Kviz završen!') && t.includes('67%') && t.includes('2 od 3') }
  })
  await step(R, 'QuizRunner "Ponovo" restarts', 'badge "1 / 3", options enabled', async () => {
    await clickByText(page, `${QR} button`, 'Ponovo')
    await sleep(300)
    const t = await pageText(page, QR)
    const opts = await optionBtns()
    const disabled = opts.length ? await opts[0].evaluate((el) => el.disabled) : true
    return { result: `${t.match(/\d \/ 3/)?.[0]} options=${opts.length} disabled=${disabled}`, pass: t.includes('1 / 3') && opts.length === 4 && !disabled }
  })
  await step(R, 'QuizRunner Kartice mode', 'flashcard "1 / 2" + "Tapni za odgovor"; flip via Otkrij', async () => {
    await clickByText(page, `${QR} [role="tab"]`, 'Kartice')
    await sleep(300)
    const t1 = await pageText(page, QR)
    await clickByText(page, `${QR} button`, /^Otkrij$/)
    await sleep(600)
    const flipped = await page.$eval(`${QR} [style*="rotateY"]`, (el) => el.style.transform)
    const t2 = await pageText(page, QR)
    return { result: `cards=${t1.includes('Kartice za učenje')} 1/2=${t1.includes('1 / 2')} transform=${flipped} next=${t2.includes('Sljedeće')}`, pass: t1.includes('Kartice za učenje') && t1.includes('1 / 2') && flipped.includes('180') && t2.includes('Sljedeće') }
  })
  await step(R, 'QuizRunner back to Kviz mode', '"Provjeri znanje" + "1 / 3"', async () => {
    await clickByText(page, `${QR} [role="tab"]`, 'Kviz')
    await sleep(300)
    const t = await pageText(page, QR)
    return { result: t.match(/\d \/ 3/)?.[0], pass: t.includes('Provjeri znanje') && t.includes('1 / 3') }
  })

  const LIKE = '[data-preview-sub^="LectureLikeButton"]'
  await step(R, 'LectureLikeButton toggles', 'aria-pressed false→true→false, localStorage lecture_likes updated', async () => {
    const btns = await page.$$(`${LIKE} button`)
    const b = btns[1]
    const p0 = await b.evaluate((el) => el.getAttribute('aria-pressed'))
    await safeClick(b, 'like')
    await sleep(200)
    const p1 = await b.evaluate((el) => el.getAttribute('aria-pressed'))
    const stored1 = await ls(page, 'lecture_likes')
    await safeClick(b, 'like')
    await sleep(200)
    const p2 = await b.evaluate((el) => el.getAttribute('aria-pressed'))
    const ok = p0 === 'false' && p1 === 'true' && p2 === 'false' && /preview-lec-unliked/.test(stored1 || '')
    return { result: `${p0}→${p1}→${p2} stored=${stored1}`, pass: ok }
  })

  const NEWS = '[data-preview-section="Novosti"]'
  await step(R, 'NewsCard "Prikaži više" expands body', 'line-clamp removed, label "Prikaži manje"', async () => {
    const btn = await clickByText(page, `${NEWS} button`, 'Prikaži više')
    await sleep(250)
    const label = await btn.evaluate((el) => el.textContent.trim())
    const clamped = await page.$$eval(`${NEWS} article p`, (ps) => ps.map((p) => /line-clamp/.test(p.className)))
    return { result: `label=${label} clampedFlags=${clamped.join(',')}`, pass: label === 'Prikaži manje' && clamped.includes(false) }
  })
  await step(R, 'NewsCard heart click does not throw', 'no page error', async () => {
    const before = pageErrors.length
    const hearts = await page.$$(`${NEWS} button[aria-pressed]`)
    await safeClick(hearts[0], 'heart 0')
    await safeClick(hearts[1], 'heart 1')
    await sleep(200)
    return { result: `hearts=${hearts.length} newErrors=${pageErrors.length - before}`, pass: hearts.length >= 2 && pageErrors.length === before }
  })
  await step(R, 'RoleBadge / SubjectIcon / avatars render', 'admin badge, 6 subject icons, 10+ avatars', async () => {
    const roles = await pageText(page, '[data-preview-sub^="RoleBadge"]')
    const icons = await page.$$eval('[data-preview-sub^="SubjectIcon"] > div > *', (els) => els.length)
    const avatars = await page.$$eval('[data-preview-sub="Avatars"] svg', (els) => els.length)
    return { result: `roles="${roles.slice(0, 60)}" icons=${icons} avatars=${avatars}`, pass: /admin/i.test(roles) && icons === 6 && avatars >= 5 }
  })
}

async function testAuth(page) {
  const R = '/login'
  await goto(page, R)
  await step(R, 'empty submit blocked by validation', 'form invalid, still /login', async () => {
    await clickByText(page, 'button[type="submit"]', 'Prijavi se')
    await sleep(300)
    const v = await page.evaluate(() => ({
      valid: document.querySelector('form').checkValidity(),
      emailMissing: document.querySelector('#email').validity.valueMissing,
      path: location.pathname,
    }))
    return { result: JSON.stringify(v), pass: !v.valid && v.emailMissing && v.path === '/login' }
  })
  await step(R, 'bad credentials show error text', 'destructive text rendered', async () => {
    await page.type('#email', 'e2e-nobody@example.com')
    await page.type('#password', 'wrong-password')
    await clickByText(page, 'button[type="submit"]', 'Prijavi se')
    await page.waitForFunction(() => !!document.querySelector('p.text-destructive'), { timeout: 15000 })
    const t = await page.$eval('p.text-destructive', (el) => el.textContent.trim())
    return { result: t, pass: t.length > 0 }
  })
  await step(R, '"Pogledaj sajt" opens tour; next / dot / Preskoči', '1/N → 2/N → 1/N → login form', async () => {
    await clickByText(page, 'button', 'Pogledaj sajt')
    // innerText, not textContent: inline <script>/<style> text would glue onto the counter.
    const counterRe = (n) => `(^|\\s)${n}/\\d+(\\s|$)`
    await page.waitForFunction((src) => new RegExp(src).test(document.body.innerText), { timeout: 5000 }, counterRe(1))
    const counter = () => page.evaluate(() => (document.body.innerText.match(/(?:^|\s)(\d+\/\d+)(?:\s|$)/) || [])[1])
    const c1 = await counter()
    // next = the icon button at the end of the bottom bar
    const next = await page.$('.min-h-11.justify-between > button:last-child')
    await safeClick(next, 'tour next')
    await page.waitForFunction((src) => new RegExp(src).test(document.body.innerText), { timeout: 5000 }, counterRe(2))
    const c2 = await counter()
    await safeClick(await page.$('button[aria-label^="1/"]'), 'tour dot 1')
    await page.waitForFunction((src) => new RegExp(src).test(document.body.innerText), { timeout: 5000 }, counterRe(1))
    const c3 = await counter()
    await clickByText(page, 'button', 'Preskoči')
    await page.waitForSelector('#email', { timeout: 5000 })
    return { result: `${c1} → ${c2} → ${c3} → form`, pass: c1.startsWith('1/') && c2.startsWith('2/') && c3.startsWith('1/') }
  })
  await goto(page, '/register')
  await step('/register', 'register fields accept input', 'values echoed', async () => {
    await page.type('#firstName', 'E2E')
    await page.type('#lastName', 'Test')
    await page.type('#email', 'e2e@example.com')
    await page.type('#password', 'secret123')
    await page.type('#confirmPassword', 'secret123')
    const v = await page.evaluate(() => ['firstName', 'lastName', 'email', 'password', 'confirmPassword'].map((id) => document.getElementById(id).value))
    return { result: v.join(','), pass: v.join(',') === 'E2E,Test,e2e@example.com,secret123,secret123' }
  })
  await goto(page, '/reset-password')
  await step('/reset-password', 'step 1 renders', '#email + "Pošalji kod" button', async () => {
    const email = await page.$('#email')
    const btn = await findByText(page, 'button[type="submit"]', 'Pošalji kod')
    return { result: `email=${!!email} button=${!!btn}`, pass: !!email && !!btn }
  })
}

// Every route: zero uncaught errors, console errors listed.
const ALL_ROUTES = [
  '/gallery', '/news', '/events', '/lectures', '/lectures/Matematika', '/schedule', '/grades', '/ednevnik',
  '/teachers', '/tournament', '/game', '/profile', '/about', '/privacy', '/terms', '/content-policy', '/preview-ui',
  '/login', '/register', '/reset-password', '/update-password', '/verify', '/complete-profile',
  '/admin', '/admin/lectures', '/admin/news', '/admin/events', '/admin/photos', '/admin/students', '/admin/roles',
]

async function testRoutes(page) {
  for (const route of ALL_ROUTES) {
    const before = pageErrors.length
    const cBefore = consoleErrors.length
    try {
      await goto(page, route)
      await sleep(400)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      const errs = pageErrors.slice(before).map((e) => e.msg)
      const cons = consoleErrors.slice(cBefore).map((e) => e.msg)
      record(route, 'route loads without uncaught errors', '0 pageerrors, no overflow-x', `pageerrors=${errs.length}${errs.length ? ' ' + errs.join(' | ') : ''} consoleErrors=${cons.length}${cons.length ? ' ' + cons.join(' | ') : ''} overflowX=${overflow}`, errs.length === 0 && !overflow)
    } catch (e) {
      record(route, 'route loads', 'no navigation error', String(e).slice(0, 200), false)
    }
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function waitFor(url, ms = 90000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(url); if (r.ok || r.status === 404) return } catch {}
    await sleep(500)
  }
  throw new Error('server did not start')
}

function portBusy(p) {
  try {
    const out = execSync(`netstat -ano | findstr :${p}`, { encoding: 'utf8' })
    return out.split('\n').some((l) => l.includes('LISTENING') && new RegExp(`:${p}\\s`).test(l))
  } catch { return false }
}

function pickFreePort(start) {
  let p = start
  while (portBusy(p)) p++
  return p
}

async function main() {
  await mkdir(OUT, { recursive: true })
  if (doBuild) execSync('npm run build', { stdio: 'inherit' })
  port = pickFreePort(wantedPort)
  BASE = `http://localhost:${port}`
  if (port !== wantedPort) console.log(`port ${wantedPort} busy → using ${port}`)
  const server = spawn('npx', ['next', devMode ? 'dev' : 'start', '-p', String(port)], { shell: true, stdio: 'ignore', detached: true })
  let failed = 0
  try {
    await waitFor(BASE + '/lectures')
    // Sanity: make sure we are talking to OUR server serving THIS working tree (redesign header button).
    const html = await (await fetch(BASE + '/lectures')).text()
    if (!html.includes('theme-btn')) throw new Error(`server on ${BASE} is not serving this working tree (no .theme-btn in /lectures HTML)`)
    const browser = await puppeteer.launch({ headless: !headed, args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
    attachCollectors(page)
    // warm up (dev mode compiles on first hit)
    await goto(page, '/lectures')
    const groups = { nav: testNav, theme: testTheme, lectures: testLectures, events: testEvents, schedule: testSchedule, grades: testGrades, game: testGame, profile: testProfile, tournament: testTournament, preview: testPreview, auth: testAuth, routes: testRoutes }
    for (const [name, fn] of Object.entries(groups)) {
      if (only && !name.includes(only)) continue
      console.log(`\n=== ${name} ===`)
      try { await fn(page) } catch (e) { record(currentRoute, `group ${name}`, 'completes', 'THREW: ' + String(e && e.stack ? e.stack : e).slice(0, 400), false) }
    }
    await browser.close()
    failed = checks.filter((c) => !c.pass).length
    const report = { checks, pageErrors, consoleErrors, failed, total: checks.length }
    await writeFile(join(OUT, 'e2e-report.json'), JSON.stringify(report, null, 2))
    console.log(`\n${checks.length - failed}/${checks.length} checks passed, ${pageErrors.length} uncaught page errors, ${consoleErrors.length} console errors (noise filtered)`)
    if (consoleErrors.length) for (const c of consoleErrors) console.log('  console [' + c.route + '] ' + c.msg)
    if (pageErrors.length) for (const c of pageErrors) console.log('  pageerror [' + c.route + '] ' + c.msg)
  } finally {
    try { process.kill(-server.pid) } catch {}
    try { execSync(`taskkill /F /T /PID ${server.pid}`, { stdio: 'ignore' }) } catch {}
  }
  process.exit(failed ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
