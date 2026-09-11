/**
 * Name matching against the verified_students roster.
 *
 * The roster is written by hand with real diacritics, so pupils type their
 * name with or without them (Ćoso / Coso, Šćekić / Scekic, Đuro / Djuro).
 * Matching compares diacritic-free spellings both ways.
 */

export interface RosterRow {
  id: string
  first_name: string | null
  last_name: string | null
  used: boolean | null
}

/** Drops combining marks: č/ć→c, š→s, ž→z. */
function stripMarks(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * č/ć→c, š→s, ž→z, đ→dj, plus generic combining-mark removal.
 *
 * Kept as the canonical single-string form; use normalizeVariants() when
 * comparing a typed name against the roster.
 */
export function normalizeCG(value: string): string {
  return stripMarks(value.toLowerCase().trim().replace(/đ/g, 'dj'))
}

/**
 * Every normalised spelling a pupil may reasonably type for one name.
 *
 * Đ/đ is the awkward one: it carries a stroke rather than a combining mark, so
 * NFKD leaves it alone and it needs an explicit rule. Both ASCII spellings are
 * in real use — the transliteration "Djordje" and the bare letter left after
 * dropping the stroke, "Dorde" — and phone keyboards without the Montenegrin
 * layout produce the second one. Comparing a single normalised form only ever
 * accepted "Djordje", so pupils like Anđelka, Nađa or Đulamerović were told
 * they are not on the roster when they typed their own name as "Andelka",
 * "Nada" or "Dulamerovic".
 */
export function normalizeVariants(value: string): string[] {
  const base = value.toLowerCase().trim()
  const withDj = stripMarks(base.replace(/đ/g, 'dj'))
  const withD = stripMarks(base.replace(/đ/g, 'd'))

  return withDj === withD ? [withDj] : [withDj, withD]
}

function overlaps(a: readonly string[], b: readonly string[]): boolean {
  return a.some((value) => b.includes(value))
}

/**
 * Finds the roster row for a pupil among candidates already filtered by
 * class + section. Returns undefined when there is no match.
 */
export function findVerifiedStudent<T extends RosterRow>(
  candidates: T[] | null | undefined,
  firstName: string,
  lastName: string
): T | undefined {
  const wantedFirst = normalizeVariants(firstName)
  const wantedLast = normalizeVariants(lastName)

  return (candidates ?? []).find(
    (row) =>
      overlaps(normalizeVariants(row.first_name ?? ''), wantedFirst) &&
      overlaps(normalizeVariants(row.last_name ?? ''), wantedLast)
  )
}
