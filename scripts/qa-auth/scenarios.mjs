/**
 * The seven scenario groups from the QA brief. Each takes a fresh browser
 * context so one group's session never leaks into the next.
 */
import { BASE_URL, CLASS_NUMBER, NEW_PASSWORD, NOT_ON_ROSTER, PASSWORD, ROSTER, SECTION_NUMBER, qaEmail } from './config.mjs'
import { open, pathAfter } from './harness.mjs'

const AUTH_ENTRY = ['/login', '/register']

// ── 1. Registration ──────────────────────────────────────────────────────────

export async function registration(ctx, run) {
  const page = await ctx.newPage()

  const fill = async ({ firstName, lastName, email, password = PASSWORD }) => {
    await open(page, '/register')
    await page.fill('#firstName', firstName)
    await page.fill('#lastName', lastName)
    await page.selectOption('#class', String(CLASS_NUMBER))
    await page.selectOption('#section', String(SECTION_NUMBER))
    await page.fill('#email', email)
    await page.fill('#password', password)
    await page.fill('#confirmPassword', password)
  }

  const submit = async () => {
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/register'), { timeout: 20_000 }).catch(() => null),
      page.click('button[type="submit"]'),
    ])
    return res
  }

  const errorText = () => page.locator('p.text-destructive').first().textContent().catch(() => '')

  // Diacritics: the roster holds "Đorđe Šćepanović"; a phone keyboard without
  // the Montenegrin layout produces "Dorde Scepanovic". Both must be accepted.
  await fill({ ...ROSTER[0], firstName: 'Dorde', lastName: 'Scepanovic', email: qaEmail('nodiacritic') })
  const plainRes = await submit()
  run.check('registracija: ime bez dijakritike prolazi sverku', plainRes?.status() === 200,
    `HTTP ${plainRes?.status()} ${await errorText()}`)
  await run.shot(page, '01-register-no-diacritics')

  // …and so must the transliterated "Djordje".
  await fill({ firstName: 'Djordje', lastName: 'Scepanovic', email: qaEmail('translit') })
  const translitRes = await submit()
  run.check('registracija: dj transliteracija prolazi sverku',
    translitRes?.status() === 409 || translitRes?.status() === 200,
    `HTTP ${translitRes?.status()} (409 = roster već iskorišćen, sverka je prošla)`)

  // Not on the roster at all.
  await fill({ ...NOT_ON_ROSTER, email: qaEmail('notlisted') })
  const missingRes = await submit()
  run.check('registracija: odbija nekoga ko nije na spisku', missingRes?.status() === 404,
    `HTTP ${missingRes?.status()} — "${await errorText()}"`)
  await run.shot(page, '02-register-not-listed')

  // Same e-mail twice.
  await fill({ ...ROSTER[1], email: qaEmail('nodiacritic') })
  const dupRes = await submit()
  run.check('registracija: odbija ponovljeni email', dupRes?.status() === 409,
    `HTTP ${dupRes?.status()} — "${await errorText()}"`)

  // Short password — blocked by the browser before any request goes out.
  await fill({ ...ROSTER[1], email: qaEmail('short'), password: '123' })
  await page.click('button[type="submit"]')
  run.check('registracija: kratka lozinka ne šalje zahtjev',
    await page.locator('#password').evaluate((el) => !el.validity.valid))

  // Malformed address.
  await fill({ ...ROSTER[1], email: 'ovo-nije-email' })
  await page.click('button[type="submit"]')
  run.check('registracija: neispravan email ne šalje zahtjev',
    await page.locator('#email').evaluate((el) => !el.validity.valid))
  await run.shot(page, '03-register-invalid-email')

  // Empty form.
  await open(page, '/register')
  await page.click('button[type="submit"]')
  run.check('registracija: prazna polja ne šalju zahtjev',
    await page.locator('#firstName').evaluate((el) => !el.validity.valid))

  await page.close()
}

// ── 2. Profile completion through /api/complete-profile ──────────────────────

export async function completeProfile(ctx, run) {
  const page = await ctx.newPage()
  await open(page, '/complete-profile')

  // The roster lookup must happen server-side now: the browser must never read
  // verified_students directly.
  const rosterCalls = []
  page.on('request', (r) => {
    if (r.url().includes('verified_students')) rosterCalls.push(r.url())
  })

  await page.waitForTimeout(2000)
  run.check('dopuna profila: pregledač ne čita verified_students direktno',
    rosterCalls.length === 0, rosterCalls.join(', '))
  await run.shot(page, '04-complete-profile')
  await page.close()
}

// ── 3. Login ─────────────────────────────────────────────────────────────────

export async function login(ctx, run, { email, password = PASSWORD }) {
  const page = await ctx.newPage()
  const errorText = () => page.locator('p.text-destructive').first().textContent().catch(() => '')

  const attempt = async (mail, pass) => {
    await open(page, '/login')
    await page.fill('#email', mail)
    await page.fill('#password', pass)
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login'), { timeout: 20_000 }).catch(() => null),
      page.click('button[type="submit"]'),
    ])
    return res
  }

  const wrong = await attempt(email, 'pogresna-lozinka')
  run.check('prijava: pogrešna lozinka je odbijena', wrong?.status() === 400,
    `HTTP ${wrong?.status()} — "${await errorText()}"`)
  await run.shot(page, '05-login-wrong-password')

  const unknown = await attempt(qaEmail('nepostojeci'), PASSWORD)
  run.check('prijava: nepostojeći email je odbijen', unknown?.status() === 400,
    `HTTP ${unknown?.status()}`)

  // The Google button must hand off to Google and nothing more.
  await open(page, '/login')
  const googleTarget = await Promise.race([
    page.waitForRequest((r) => r.url().includes('accounts.google.com'), { timeout: 15_000 })
      .then((r) => r.url()).catch(() => ''),
    page.click('button:has-text("Prijavi se sa Google")').then(() => ''),
  ])
  run.check('prijava: Google dugme vodi na accounts.google.com',
    googleTarget.includes('accounts.google.com'), googleTarget.slice(0, 80))

  const ok = await attempt(email, password)
  run.check('prijava: tačna lozinka pušta unutra', ok?.status() === 200, `HTTP ${ok?.status()}`)
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 }).catch(() => {})
  await run.shot(page, '06-login-success')

  await page.close()
}

// ── 4. Password reset ────────────────────────────────────────────────────────

export async function passwordReset(ctx, run, { email }) {
  const page = await ctx.newPage()
  await open(page, '/reset-password')
  await page.fill('input[type="email"]', email)

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/reset-password'), { timeout: 20_000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ])

  run.check('reset lozinke: zahtjev za kod je prihvaćen', res?.status() === 200, `HTTP ${res?.status()}`)
  run.check('reset lozinke: otvara se ekran za unos koda',
    await page.locator('input').first().isVisible())
  await run.shot(page, '07-reset-password-code')

  // Reading the mailbox is out of scope for the browser run: supply the code
  // through QA_RECOVERY_CODE to carry on to the new-password step.
  const code = process.env.QA_RECOVERY_CODE
  if (!code) {
    run.skip('reset lozinke: nova lozinka i prijava njome',
      'treba QA_RECOVERY_CODE iz e-pošte')
    await page.close()
    return
  }

  const boxes = page.locator('input[inputmode="numeric"], input[maxlength="1"]')
  for (const [i, digit] of [...code].entries()) await boxes.nth(i).fill(digit)
  await page.waitForTimeout(1500)
  await page.fill('input[type="password"]', NEW_PASSWORD)
  await page.locator('input[type="password"]').nth(1).fill(NEW_PASSWORD)
  await page.click('button[type="submit"]')
  run.check('reset lozinke: nova lozinka je sačuvana',
    await page.locator('text=/promijenjena|Uspješno/i').first().isVisible({ timeout: 15_000 }).catch(() => false))
  await page.close()
}

// ── 5. Shared rate limiting ──────────────────────────────────────────────────

export async function rateLimiting(ctx, run) {
  const page = await ctx.newPage()
  await open(page, '/login')

  // 8 attempts per e-mail per 5 minutes, so the 9th must be refused.
  const hammer = (path, body, times) =>
    page.evaluate(async ({ path, body, times }) => {
      const seen = []
      for (let i = 0; i < times; i++) {
        const res = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        seen.push({ status: res.status, retryAfter: res.headers.get('Retry-After') })
      }
      return seen
    }, { path, body, times })

  const target = `qa-auth-rl-${Date.now()}@example.com`
  const logins = await hammer('/api/auth/login', { email: target, password: 'x'.repeat(10) }, 10)
  const blocked = logins.find((r) => r.status === 429)

  run.check('ograničenje: prijava se odbija poslije nekoliko pokušaja', !!blocked,
    `statusi: ${logins.map((r) => r.status).join(',')}`)
  run.check('ograničenje: odgovor kaže koliko treba čekati (Retry-After)',
    !!blocked?.retryAfter && Number(blocked.retryAfter) > 0, `Retry-After: ${blocked?.retryAfter}`)

  // The UI has to repeat that number back to the pupil.
  await page.fill('#email', target)
  await page.fill('#password', 'x'.repeat(10))
  await page.click('button[type="submit"]')
  const shown = await page.locator('p.text-destructive').first().textContent().catch(() => '')
  run.check('ograničenje: poruka na ekranu sadrži vrijeme čekanja',
    /\d+\s*(sekund|minut)/i.test(shown ?? ''), `"${shown}"`)
  await run.shot(page, '08-rate-limited-login')

  // 5 registrations per IP per minute.
  const regs = await hammer('/api/register', {
    firstName: 'QA', lastName: 'Rate', classNumber: CLASS_NUMBER,
    sectionNumber: SECTION_NUMBER, email: target, password: PASSWORD,
  }, 7)
  run.check('ograničenje: registracija se odbija poslije nekoliko pokušaja',
    regs.some((r) => r.status === 429), `statusi: ${regs.map((r) => r.status).join(',')}`)

  // Registration uses a one-minute window, so the release is observable.
  const waitFor = Number(regs.find((r) => r.status === 429)?.retryAfter ?? 60)
  if (process.env.QA_SKIP_WAIT) {
    run.skip('ograničenje: poslije isteka prozora ponovo prolazi', 'QA_SKIP_WAIT je postavljen')
  } else {
    await page.waitForTimeout((waitFor + 3) * 1000)
    const after = await hammer('/api/register', {
      firstName: 'QA', lastName: 'Rate', classNumber: CLASS_NUMBER,
      sectionNumber: SECTION_NUMBER, email: target, password: PASSWORD,
    }, 1)
    run.check('ograničenje: poslije isteka prozora ponovo prolazi',
      after[0].status !== 429, `HTTP ${after[0].status} poslije ${waitFor}s`)
  }

  await page.close()
}

// ── 6. Route guards ──────────────────────────────────────────────────────────

export async function guardsAnonymous(ctx, run) {
  const page = await ctx.newPage()

  for (const path of ['/news', '/profile', '/admin', '/grades']) {
    const landed = await pathAfter(page, path)
    run.check(`garda: anoniman ${path} → prijava/registracija`,
      AUTH_ENTRY.includes(landed), `sletio na ${landed}`)
  }
  await run.shot(page, '09-guard-anonymous')
  await page.close()
}

export async function guardsSignedIn(ctx, run, { isStudent }) {
  const page = await ctx.newPage()

  const landed = await pathAfter(page, '/login')
  run.check('garda: prijavljen korisnik na /login se vraća unutra',
    !landed.startsWith('/login'), `sletio na ${landed}`)

  if (!isStudent) {
    run.skip('garda: učenik na /admin ne prolazi', 'nalog nije učenik')
    await page.close()
    return
  }

  // The admin shell must never reach the browser — the redirect happens on the
  // server, so there is nothing to flash.
  const markup = []
  page.on('response', async (res) => {
    if (res.url().includes('/admin') && res.headers()['content-type']?.includes('text/html')) {
      markup.push(await res.text().catch(() => ''))
    }
  })

  const adminLanded = await pathAfter(page, '/admin')
  run.check('garda: učenik na /admin ne prolazi', adminLanded !== '/admin', `sletio na ${adminLanded}`)
  run.check('garda: admin ekran ne bljesne prije redirekcije',
    !markup.some((html) => html.includes('admin-content')))
  await run.shot(page, '10-guard-student-admin')
  await page.close()
}

// ── 7. Profile ───────────────────────────────────────────────────────────────

export async function profile(ctx, run) {
  const page = await ctx.newPage()
  await open(page, '/profile')
  run.check('profil: stranica se otvara', new URL(page.url()).pathname === '/profile')
  await run.shot(page, '11-profile')

  // Palette and light/dark are two separate axes; both are remembered.
  const themeButtons = page.locator('button.theme-btn')
  if (await themeButtons.count()) {
    const before = await page.evaluate(() => document.documentElement.dataset.colorScheme)
    await themeButtons.first().click()
    await page.waitForTimeout(400)
    const after = await page.evaluate(() => document.documentElement.dataset.colorScheme)
    run.check('profil: prebacivanje teme mijenja šemu boja', before !== after, `${before} → ${after}`)
    await run.shot(page, '12-profile-theme')
  } else {
    run.skip('profil: prebacivanje teme', 'nema dugmeta za temu na ovoj stranici')
  }

  const logout = page.locator('button:has-text("Odjavi"), button:has-text("Odjava")').first()
  if (await logout.count()) {
    await logout.click()
    await page.waitForURL((u) => AUTH_ENTRY.includes(u.pathname), { timeout: 20_000 }).catch(() => {})
    run.check('profil: odjava vodi na prijavu', AUTH_ENTRY.includes(new URL(page.url()).pathname),
      new URL(page.url()).pathname)
    await run.shot(page, '13-after-logout')
  } else {
    run.skip('profil: odjava', 'dugme za odjavu nije nađeno')
  }

  await page.close()
}

/** First visit with no stored preference must follow the phone's setting. */
export async function systemTheme(browser, target, run) {
  for (const scheme of ['dark', 'light']) {
    const ctx = await browser.newContext({ ...target.device, colorScheme: scheme })
    const page = await ctx.newPage()
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
    const resolved = await page.evaluate(() => document.documentElement.dataset.colorScheme)
    run.check(`tema: prvi dolazak poštuje sistemsku temu (${scheme})`, resolved === scheme,
      `dobijeno ${resolved}`)
    await run.shot(page, `14-system-theme-${scheme}`)
    await ctx.close()
  }
}
