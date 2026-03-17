import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isValidUUID } from '@/lib/api-auth'

// Rate limiting: Consider adding middleware-level rate limiting (e.g., 20 req/min per IP)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      return NextResponse.json({ exists: false })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ exists: false })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    return NextResponse.json({ exists: !!data })
  } catch {
    return NextResponse.json({ exists: false })
  }
}
