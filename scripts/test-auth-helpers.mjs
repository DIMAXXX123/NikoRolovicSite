/**
 * Unit tests for the two pure helpers behind registration and rate limiting.
 *
 *   node --test scripts/test-auth-helpers.mjs
 *
 * Uses Node's built-in runner and type stripping, so it needs no dev deps.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { findVerifiedStudent, normalizeVariants } from '../src/lib/verified-students.ts'
import { formatRetryAfter, parseRetryAfter, rateLimitMessage } from '../src/lib/retry-after.ts'

const roster = [
  { id: '1', first_name: 'Đorđe', last_name: 'Šćepanović', used: false },
  { id: '2', first_name: 'Njegoš', last_name: 'Vulićević', used: false },
  { id: '3', first_name: 'Anđelka', last_name: 'Magovčević', used: false },
  { id: '4', first_name: 'Nađa', last_name: 'Kurpejović', used: false },
]

test('roster matches names typed with diacritics', () => {
  assert.equal(findVerifiedStudent(roster, 'Đorđe', 'Šćepanović')?.id, '1')
  assert.equal(findVerifiedStudent(roster, 'Njegoš', 'Vulićević')?.id, '2')
})

test('roster matches names typed with the dj transliteration', () => {
  assert.equal(findVerifiedStudent(roster, 'Djordje', 'Scepanovic')?.id, '1')
  assert.equal(findVerifiedStudent(roster, 'Andjelka', 'Magovcevic')?.id, '3')
  assert.equal(findVerifiedStudent(roster, 'Nadja', 'Kurpejovic')?.id, '4')
})

test('roster matches names typed with the bar simply dropped', () => {
  // The regression: a phone keyboard without the Montenegrin layout gives
  // "Dorde"/"Andelka"/"Nada", which used to be rejected as "not on the list".
  assert.equal(findVerifiedStudent(roster, 'Dorde', 'Scepanovic')?.id, '1')
  assert.equal(findVerifiedStudent(roster, 'Andelka', 'Magovcevic')?.id, '3')
  assert.equal(findVerifiedStudent(roster, 'Nada', 'Kurpejovic')?.id, '4')
})

test('matching ignores case and surrounding whitespace', () => {
  assert.equal(findVerifiedStudent(roster, '  DORDE ', 'šćepanović')?.id, '1')
})

test('someone not on the roster still gets no match', () => {
  assert.equal(findVerifiedStudent(roster, 'Marko', 'Petrović'), undefined)
  assert.equal(findVerifiedStudent(roster, 'Đorđe', 'Kurpejović'), undefined)
  assert.equal(findVerifiedStudent([], 'Đorđe', 'Šćepanović'), undefined)
  assert.equal(findVerifiedStudent(null, 'Đorđe', 'Šćepanović'), undefined)
})

test('normalizeVariants collapses to one form when there is no đ', () => {
  assert.deepEqual(normalizeVariants('Njegoš'), ['njegos'])
  assert.deepEqual(normalizeVariants('Đorđe'), ['djordje', 'dorde'])
})

const responseWith = (retryAfter) =>
  new Response(null, { status: 429, headers: retryAfter ? { 'Retry-After': retryAfter } : {} })

test('Retry-After is read off the response', () => {
  assert.equal(parseRetryAfter(responseWith('42')), 42)
  assert.equal(parseRetryAfter(responseWith()), null)
  assert.equal(parseRetryAfter(responseWith('nonsense')), null)
  assert.equal(parseRetryAfter(responseWith('-5')), null)
})

test('the wait is spelled out with Montenegrin plurals', () => {
  assert.equal(formatRetryAfter(1), '1 sekundu')
  assert.equal(formatRetryAfter(3), '3 sekunde')
  assert.equal(formatRetryAfter(45), '45 sekundi')
  assert.equal(formatRetryAfter(60), '1 minut')
  assert.equal(formatRetryAfter(150), '3 minuta')
  assert.equal(formatRetryAfter(300), '5 minuta')
})

test('the 429 message says how long to wait, or stays vague without the header', () => {
  assert.equal(
    rateLimitMessage(responseWith('120'), 'Previše pokušaja prijave.'),
    'Previše pokušaja prijave. Pokušaj ponovo za 2 minuta.'
  )
  assert.equal(
    rateLimitMessage(responseWith(), 'Previše zahtjeva.'),
    'Previše zahtjeva. Pokušaj ponovo kasnije.'
  )
})
