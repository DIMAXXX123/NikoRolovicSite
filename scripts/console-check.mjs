// Console / hydration regression check: visit every route and record console errors, warnings
// and uncaught page errors per route.
// Usage: node scripts/console-check.mjs [--no-build] [--dev] [--port 3457] [--out docs/screens/console-head.json] [--cwd <dir>]
//   --dev   run `next dev` instead of `next start` — React only reports hydration mismatches in development
//   --cwd   run `next start` in another checkout (e.g. a git worktree of the base commit)
//   --only  comma-separated subset of routes to visit
//   --out   output path, relative to the *current* directory (defaults to docs/screens/console-<port>.json)
import { spawn, execSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve, dirname } from 'node:path'
import puppeteer from 'puppeteer'

const args = process.argv.slice(2)
const flag = (name, dflt) => (args.includes(name) ? args[args.indexOf(name) + 1] : dflt)
const noBuild = args.includes('--no-build')
const dev = args.includes('--dev')
const port = Number(flag('--port', 3457))
const cwd = resolve(flag('--cwd', process.cwd()))
const out = resolve(flag('--out', join('docs', 'screens', `console-${port}.json`)))
const width = Number(flag('--width', 390))
const BASE = `http://localhost:${port}`

// Same list as scripts/shot-all.mjs, plus /preview-ui (mock-data component playground).
const ROUTES = [
  '/gallery', '/news', '/events', '/lectures', '/lectures/Matematika', '/schedule', '/grades',
  '/ednevnik', '/teachers', '/tournament', '/game', '/profile', '/about', '/privacy', '/terms',
  '/content-policy', '/login', '/register', '/reset-password', '/update-password', '/verify',
  '/complete-profile', '/admin', '/admin/lectures', '/admin/news', '/admin/events', '/admin/photos',
  '/admin/students', '/admin/roles', '/preview-ui',
]

const only = flag('--only', '').split(',').filter(Boolean)
if (only.length) ROUTES.splice(0, ROUTES.length, ...only)

async function waitFor(url, ms = 60000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(url); if (r.ok || r.status === 404) return } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('server did not start')
}

// Strip volatile bits so HEAD/base messages can be diffed textually.
function normalize(text) {
  return text
    .replace(/https?:\/\/localhost:\d+/g, '<origin>')
    .replace(/\/_next\/static\/[^\s)'"]+/g, '/_next/static/<chunk>')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<uuid>')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  await mkdir(dirname(out), { recursive: true })
  if (!noBuild && !dev) execSync('npm run build', { stdio: 'inherit', cwd })
  const server = spawn('npx', ['next', dev ? 'dev' : 'start', '-p', String(port)], { shell: true, stdio: 'ignore', detached: true, cwd })
  try {
    await waitFor(BASE + '/lectures', dev ? 180000 : 60000)
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.setViewport({ width, height: 844, deviceScaleFactor: 2 })
    const report = []
    for (const route of ROUTES) {
      const messages = []
      page.removeAllListeners('console'); page.removeAllListeners('pageerror')
      page.on('pageerror', (e) => messages.push({ type: 'pageerror', text: normalize(e.message).slice(0, 4000) }))
      page.on('console', (m) => {
        const t = m.type()
        if (t !== 'error' && t !== 'warning' && t !== 'warn') return
        messages.push({ type: t === 'warn' ? 'warning' : t, text: normalize(m.text()).slice(0, 4000) })
      })
      let status = null
      let error = null
      try {
        const res = await page.goto(BASE + route, { waitUntil: 'networkidle0', timeout: dev ? 150000 : 45000 })
        status = res ? res.status() : null
        await new Promise((r) => setTimeout(r, 1200))
        if (route === '/lectures/Matematika') {
          const href = await page.evaluate(() => {
            const a = Array.from(document.querySelectorAll('a[href^="/lectures/Matematika/"]'))[0]
            return a ? a.getAttribute('href') : null
          })
          if (href && !ROUTES.includes(href)) ROUTES.push(href)
        }
      } catch (e) {
        error = String(e).slice(0, 300)
      }
      report.push({ route, status, error, messages })
      console.log(`${error ? 'ERR' : 'ok '} ${route}  ${status ?? '-'}  msgs:${messages.length}`)
      for (const m of messages) console.log(`     [${m.type}] ${m.text.slice(0, 160)}`)
    }
    await browser.close()
    await writeFile(out, JSON.stringify(report, null, 2))
    console.log('wrote', out)
  } finally {
    try { process.kill(-server.pid) } catch {}
    try { execSync(`taskkill /F /T /PID ${server.pid}`, { stdio: 'ignore' }) } catch {}
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
