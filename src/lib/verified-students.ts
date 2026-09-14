/**
 * Name matching against the verified_students roster.
 *
 * The roster is written by hand, so pupils type their name with or without
 * Montenegrin/Serbian diacritics (Ćoso / Coso, Šćekić / Scekic, Đuro / Djuro).
 * Matching strips diacritics both ways before comparing.
 */

export interface RosterRow {
  id: string
  first_name: string | null
  last_name: string | null
  used: boolean | null
}

/** č/ć→c, š→s, ž→z, đ→dj, plus generic combining-mark removal. */
export function normalizeCG(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/đ/g, 'dj')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
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
  const wantedFirst = normalizeCG(firstName)
  const wantedLast = normalizeCG(lastName)

  return (candidates ?? []).find(
    (row) =>
      normalizeCG(row.first_name ?? '') === wantedFirst &&
      normalizeCG(row.last_name ?? '') === wantedLast
  )
}
