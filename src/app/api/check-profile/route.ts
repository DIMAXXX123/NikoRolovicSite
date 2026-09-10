import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCallerProfile } from '@/lib/api-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { parseBody, uuidSchema } from '@/lib/api-validation'

const CheckProfileSchema = z.object({ userId: uuidSchema })

export async function POST(request: Request) {
  try {
    const caller = await getCallerProfile()
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = await parseBody(request, CheckProfileSchema)
    if (!parsed.ok) return NextResponse.json({ exists: false })

    const supabase = createServiceClient()
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', parsed.data.userId)
      .maybeSingle()

    return NextResponse.json({ exists: !!data })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
