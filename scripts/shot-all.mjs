// Screenshot every route at phone size for the redesign QA (docs/DUOLINGO_REDESIGN.md §9).
// Usage: node scripts/shot-all.mjs [--no-build] [--port 3457]
// Writes docs/screens/<route>.png (full page) and docs/screens/<route>.fold.png (first viewport).
import { spawn, execSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import puppeteer from 'puppeteer'

const args = process.argv.slice(2)
const noBuild = args.includes('--no-build')
const port = Number(args[args.indexOf('--port') + 1]) || 3457
const width = Number(args[args.indexOf('--width') + 1]) || 390
const extra = args.includes('--routes') ? args[args.indexOf('--routes') + 1].split(',') : []
const suffix = width === 390 ? '' : `.w${width}`
const BASE = `http://localhost:${port}`
const OUT = join(process.cwd(), 'docs', 'screens')

const ROUTES = [
  '/gallery', '/news', '/events', '/lectures', '/lectures/Matematika', '/schedule', '/grades',
  '/ednevnik', '/teachers', '/tournament', '/game', '/profile', '/about', '/privacy', '/terms',
  '/content-policy', '/login', '/register', '/reset-password', '/update-password', '/verify',
  '/complete-profile', '/admin', '/admin/lectures', '/admin/news', '/admin/events', '/admin/photos',
  '/admin/students', '/admin/roles',
]

for (const r of extra) if (!ROUTES.includes(r)) ROUTES.push(r)
const slug = (r) => (r === '/' ? 'root' : r.replace(/^\//, '').replace(/\//g, '__'))

async function waitFor(url, ms = 60000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(url); if (r.ok || r.status === 404) return } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('server did not start')
}

async function main() {
  await mkdir(OUT, { recursive: true })
  if (!noBuild) execSync('npm run build', { stdio: 'inherit' })
  const server = spawn('npx', ['next', 'start', '-p', String(port)], { shell: true, stdio: 'ignore', detached: true })
  try {
    await waitFor(BASE + '/lectures')
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.setViewport({ width, height: 844, deviceScaleFactor: 2 })
    const report = []
    for (const route of ROUTES) {
      const errors = []
      page.removeAllListeners('console'); page.removeAllListeners('pageerror')
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
      page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)) })
      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle0', timeout: 45000 })
        await new Promise((r) => setTimeout(r, 800))
        // find first lecture link on the subject page and add it once
        if (route === '/lectures/Matematika') {
          const href = await page.evaluate(() => {
            const a = Array.from(document.querySelectorAll('a[href^="/lectures/Matematika/"]'))[0]
            return a ? a.getAttribute('href') : null
          })
          if (href && !ROUTES.includes(href)) ROUTES.push(href)
        }
        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          height: document.documentElement.scrollHeight,
          smallTargets: Array.from(document.querySelectorAll('a,button,[role=button]'))
            .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 40 })
            .slice(0, 12)
            .map((el) => (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30) + ` (${Math.round(el.getBoundingClientRect().height)}px)`),
        }))
        await page.screenshot({ path: join(OUT, slug(route) + suffix + '.fold.png') })
        await page.screenshot({ path: join(OUT, slug(route) + suffix + '.png'), fullPage: true })
        report.push({ route, ok: true, overflowX: metrics.scrollWidth > metrics.clientWidth, height: metrics.height, smallTargets: metrics.smallTargets, errors })
      } catch (e) {
        report.push({ route, ok: false, error: String(e).slice(0, 200), errors })
      }
    }
    await browser.close()
    await writeFile(join(OUT, 'report' + suffix + '.json'), JSON.stringify(report, null, 2))
    for (const r of report) console.log((r.ok ? 'ok ' : 'ERR') + ' ' + r.route + (r.overflowX ? '  OVERFLOW-X' : '') + (r.smallTargets && r.smallTargets.length ? `  small:${r.smallTargets.length}` : '') + (r.errors.length ? `  errors:${r.errors.length}` : '') + (r.error ? '  ' + r.error : ''))
  } finally {
    try { process.kill(-server.pid) } catch {}
    try { execSync(`taskkill /F /T /PID ${server.pid}`, { stdio: 'ignore' }) } catch {}
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
