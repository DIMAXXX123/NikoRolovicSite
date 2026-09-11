/** Tiny check/report harness — keeps run.mjs free of bookkeeping noise. */
import { mkdir, writeFile } from 'node:fs/promises'
import { BASE_URL } from './config.mjs'

const SHOTS = new URL('./artifacts/', import.meta.url)

export function createRun(targetId) {
  const results = []

  return {
    targetId,
    results,

    /** Records one assertion. `detail` shows up in the report either way. */
    check(name, passed, detail = '') {
      results.push({ name, passed: !!passed, detail })
      const mark = passed ? 'PASS' : 'FAIL'
      console.log(`  [${mark}] ${targetId} — ${name}${detail ? ` — ${detail}` : ''}`)
      return !!passed
    },

    /** Records a scenario that could not run (missing seed, blocked host…). */
    skip(name, why) {
      results.push({ name, passed: null, detail: why })
      console.log(`  [SKIP] ${targetId} — ${name} — ${why}`)
    },

    async shot(page, name) {
      await mkdir(SHOTS, { recursive: true })
      const file = new URL(`${targetId}-${name}.png`, SHOTS)
      await page.screenshot({ path: file, fullPage: false })
      return file
    },
  }
}

export async function writeReport(runs) {
  const all = runs.flatMap((r) => r.results.map((x) => ({ target: r.targetId, ...x })))
  const failed = all.filter((r) => r.passed === false)
  const skipped = all.filter((r) => r.passed === null)
  const passed = all.filter((r) => r.passed === true)

  console.log(
    `\n${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped — ${BASE_URL}`
  )
  for (const f of failed) console.log(`  FAIL ${f.target} — ${f.name} — ${f.detail}`)

  await writeFile(
    new URL('./artifacts/results.json', import.meta.url),
    JSON.stringify({ baseUrl: BASE_URL, ranAt: new Date().toISOString(), results: all }, null, 2)
  )

  return failed.length
}

/** Follows a navigation and reports the path it settled on. */
export async function pathAfter(page, url) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  return new URL(page.url()).pathname
}

/**
 * Opens a page and waits until React has hydrated.
 *
 * Without this the click lands on a form whose onSubmit is not attached yet,
 * the browser does a plain GET submit, and the assertion fails for reasons
 * that have nothing to do with the portal.
 */
export async function open(page, url) {
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page
    .waitForFunction(
      () => {
        const form = document.querySelector('form')
        return !!form && Object.keys(form).some((key) => key.startsWith('__react'))
      },
      { timeout: 15_000 }
    )
    .catch(() => {})
  await page.waitForTimeout(250)
}
