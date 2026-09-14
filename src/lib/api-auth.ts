import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

import type { AppRole } from '@/lib/roles'

export type { AppRole }
export { STAFF_ROLES, ADMIN_ROLES, DIREKTOR_ROLES, STUDENT_LIST_ROLES, NASTAVNIK_ROLES, NASTAVNIK_PICKER_ROLES } from '@/lib/roles'

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


export function hasRole(profile: CallerProfile | null, roles: readonly AppRole[]): boolean {
  return !!profile && (roles as readonly string[]).includes(profile.role)
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value)
}
