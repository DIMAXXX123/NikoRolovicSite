/** Shared configuration for the auth/profile QA run. */
import { devices } from 'playwright'

export const BASE_URL = process.env.QA_BASE_URL ?? 'https://niko-rolovic-site.vercel.app'

/** The two form factors pupils actually use: Safari/iPhone and Chrome/Android. */
export const TARGETS = [
  { id: 'iphone', label: 'iPhone 13 (Safari)', device: devices['iPhone 13'] },
  { id: 'android', label: 'Pixel 7 (Chrome)', device: devices['Pixel 7'] },
]

/**
 * Roster rows and the account the run works with. seed.mjs creates them and
 * cleanup.mjs removes them; both need SUPABASE_SERVICE_ROLE_KEY.
 *
 * Everything carries the [TEST] marker required for the shared production
 * database, and the ids are recorded in qa-auth.json.
 */
export const CLASS_NUMBER = 4
export const SECTION_NUMBER = 6

export const ROSTER = [
  // Đ on purpose: the roster holds the diacritics, the pupil may type either
  // "Djordje" or "Dorde".
  { key: 'diacritic', firstName: '[TEST] Đorđe', lastName: 'Šćepanović' },
  { key: 'plain', firstName: '[TEST] Njegoš', lastName: 'Vulićević' },
]

/** Someone deliberately absent from the roster. */
export const NOT_ON_ROSTER = { firstName: '[TEST] Niko', lastName: 'Nepostojeći' }

export const PASSWORD = process.env.QA_PASSWORD ?? 'QaAuth!2026'
export const NEW_PASSWORD = process.env.QA_NEW_PASSWORD ?? 'QaAuth!2026x'

export const qaEmail = (suffix) =>
  `qa-auth-${process.env.QA_RUN_ID ?? 'local'}-${suffix}@example.com`

export const STATE_FILE = new URL('../../qa-auth.json', import.meta.url)
