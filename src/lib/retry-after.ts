/**
 * Turning a 429 into a sentence that says how long to wait.
 *
 * The rate limited routes all send Retry-After, but the pages used to show a
 * bare "pokušaj kasnije", which leaves a pupil refreshing blindly. These
 * helpers read the header and render the delay in Montenegrin.
 */

/** Retry-After in whole seconds, or null when the header is missing/odd. */
export function parseRetryAfter(response: Response): number | null {
  const raw = response.headers.get('Retry-After')
  if (!raw) return null

  const seconds = Number(raw)
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null
}

/** Montenegrin plural: 1 sekundu / 2-4 sekunde / 5+ sekundi. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/** "45 sekundi", "1 minut", "3 minuta". */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} ${plural(seconds, 'sekundu', 'sekunde', 'sekundi')}`
  }

  const minutes = Math.ceil(seconds / 60)
  return `${minutes} ${plural(minutes, 'minut', 'minuta', 'minuta')}`
}

/**
 * Full message for a 429 response: `${prefix} Pokušaj ponovo za 2 minuta.`
 * Falls back to the vague wording when the server sent no usable header.
 */
export function rateLimitMessage(response: Response, prefix: string): string {
  const seconds = parseRetryAfter(response)

  return seconds === null
    ? `${prefix} Pokušaj ponovo kasnije.`
    : `${prefix} Pokušaj ponovo za ${formatRetryAfter(seconds)}.`
}
