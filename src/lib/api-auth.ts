import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type AppRole =
  | 'student'
  | 'teacher'
  | 'razredni'
  | 'pedagog'
  | 'direktor'
  | 'moderator'
  | 'admin'
  | 'creator'

export interface CallerProfile {
  id: string
  role: string
  email: string
  /** Homeroom teacher's own section (role 'razredni'); null otherwise. */
  homeroom_class: number | null
  homeroom_section: number | null
}

/**
 * Verifies the caller's auth session via cookies and returns their profile.
 * Returns null if unauthenticated or profile not found.
 *
 * The role is read with the service-role client on purpose: it must not be
 * possible for a client to influence the row that the check reads.
 */
export async function getCallerProfile(): Promise<CallerProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createServiceClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, email, homeroom_class, homeroom_section')
    .eq('id', user.id)
    .single()

  return (profile as CallerProfile | null) ?? null
}

/** Roles allowed into the admin area. */
export const STAFF_ROLES: AppRole[] = ['moderator', 'admin', 'creator']

/** Roles allowed to manage accounts, roles and the student roster. */
export const ADMIN_ROLES: AppRole[] = ['admin', 'creator']

/** Roles allowed into the Direktor panel (/direktor, /api/direktor/*). */
export const DIREKTOR_ROLES: AppRole[] = ['direktor', 'admin', 'creator', 'pedagog']

/** Roles allowed to see at-risk pupils WITH names (razredni: own homeroom only). */
export const STUDENT_LIST_ROLES: AppRole[] = ['direktor', 'admin', 'creator', 'pedagog', 'razredni']

/** Roles allowed into the Nastavnik panel (/nastavnik, /api/nastavnik/*). */
export const NASTAVNIK_ROLES: AppRole[] = ['teacher', 'razredni', 'pedagog', 'direktor', 'admin', 'creator']

/** Roles that may pick another teacher's author in the Nastavnik panel. */
export const NASTAVNIK_PICKER_ROLES: AppRole[] = ['pedagog', 'direktor', 'admin', 'creator']

export function hasRole(profile: CallerProfile | null, roles: readonly AppRole[]): boolean {
  return !!profile && (roles as readonly string[]).includes(profile.role)
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value)
}
