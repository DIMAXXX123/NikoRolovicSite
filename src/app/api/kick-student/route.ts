import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ADMIN_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import {
  classNumberSchema,
  parseBody,
  personNameSchema,
  sectionNumberSchema,
  uuidSchema,
} from '@/lib/api-validation'

const KickStudentSchema = z
  .object({
    profileId: uuidSchema.optional(),
    firstName: personNameSchema.optional(),
    lastName: personNameSchema.optional(),
    classNumber: classNumberSchema.optional(),
    sectionNumber: sectionNumberSchema.optional(),
  })
  .refine((v) => !!v.profileId || (!!v.firstName && !!v.lastName), {
    message: 'Must provide profileId or first and last name',
  })

export async function POST(request: Request) {
  try {
    const caller = await getCallerProfile()
    if (!hasRole(caller, ADMIN_ROLES)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const rate = await checkRateLimit(`kick-student:${clientIp(request)}`, 10, 60_000)
    if (rate.limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const parsed = await parseBody(request, KickStudentSchema)
    if (!parsed.ok) return parsed.response

    const { profileId, firstName, lastName, classNumber, sectionNumber } = parsed.data
    const supabase = createServiceClient()

    // If we have a profileId, delete profile + auth user
    if (profileId) {
      await supabase.from('profiles').delete().eq('id', profileId)
      await supabase.auth.admin.deleteUser(profileId)
    }

    // Also delete from verified_students by name+class match
    if (firstName && lastName) {
      let query = supabase
        .from('verified_students')
        .delete()
        .eq('first_name', firstName)
        .eq('last_name', lastName)

      if (classNumber) query = query.eq('class_number', classNumber)
      if (sectionNumber) query = query.eq('section_number', sectionNumber)

      await query
    }

    // If no profileId but we have name, find profile by name and delete
    if (!profileId && firstName && lastName) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName)

      if (profiles) {
        for (const p of profiles) {
          await supabase.from('profiles').delete().eq('id', p.id)
          await supabase.auth.admin.deleteUser(p.id)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
