import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { emailSchema, parseBody } from '@/lib/api-validation'

/**
 * Password sign-in goes through the server so it can be rate limited with the
 * shared counter — a browser calling supabase.auth.signInWithPassword()
 * directly cannot be throttled by us at all.
 *
 * The cookie-based server client writes the session cookies on success, so the
 * browser ends up signed in exactly as before.
 */

const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
})

export async function POST(request: Request) {
  const parsed = await parseBody(request, LoginSchema, 'Unesite email i lozinku')
  if (!parsed.ok) return parsed.response

  const { email, password } = parsed.data
  const ip = clientIp(request)

  // Two budgets: one against a single account, one against the whole IP.
  const perAccount = await checkRateLimit(`login:email:${email}`, 8, 5 * 60_000)
  const perIp = await checkRateLimit(`login:ip:${ip}`, 30, 5 * 60_000)
  const limited = perAccount.limited ? perAccount : perIp.limited ? perIp : null

  if (limited) {
    return NextResponse.json(
      { error: 'Previše pokušaja prijave. Pokušaj ponovo kasnije.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
