/**
 * Drives every auth/profile scenario on an iPhone and an Android viewport.
 *
 *   node scripts/qa-auth/seed.mjs        # roster rows + the QA account
 *   node scripts/qa-auth/run.mjs
 *   node scripts/qa-auth/cleanup.mjs     # removes everything seed.mjs made
 *
 * Screenshots land in scripts/qa-auth/artifacts/.
 */
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { BASE_URL, PASSWORD, STATE_FILE, TARGETS } from './config.mjs'
import { createRun, writeReport } from './harness.mjs'
import * as s from './scenarios.mjs'

const state = await readFile(STATE_FILE, 'utf8').then(JSON.parse).catch(() => null)
if (!state?.account?.email) {
  console.error('qa-auth.json has no account — run scripts/qa-auth/seed.mjs first.')
  process.exit(2)
}

console.log(`QA auth run against ${BASE_URL} as ${state.account.email}\n`)

const browser = await chromium.launch()
const runs = []

for (const target of TARGETS) {
  console.log(`── ${target.label} ──`)
  const run = createRun(target.id)
  runs.push(run)

  // Anonymous scenarios first — a signed-in session would mask the guards.
  const anon = await browser.newContext({ ...target.device })
  await s.guardsAnonymous(anon, run)
  await s.registration(anon, run)
  await s.completeProfile(anon, run)
  await s.rateLimiting(anon, run)
  await anon.close()

  await s.systemTheme(browser, target, run)

  // A second context signs in and keeps the session for the rest.
  const signedIn = await browser.newContext({ ...target.device })
  await s.login(signedIn, run, { email: state.account.email, password: PASSWORD })
  await s.guardsSignedIn(signedIn, run, { isStudent: state.account.role === 'student' })
  await s.profile(signedIn, run)
  await signedIn.close()

  // Reset needs a signed-out browser again.
  const reset = await browser.newContext({ ...target.device })
  await s.passwordReset(reset, run, { email: state.account.email })
  await reset.close()

  console.log('')
}

await browser.close()
process.exit((await writeReport(runs)) > 0 ? 1 : 0)
