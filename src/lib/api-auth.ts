import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Verifies the caller's auth session via cookies and returns their profile.
 * Returns null if unauthenticated or profile not found.
 */
export async function getCallerProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, email')
    .eq('id', user.id)
    .single()

  return profile
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value)
}
