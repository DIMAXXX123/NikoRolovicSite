import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { emailSchema, parseBody } from '@/lib/api-validation'

/**
 * Password reset mails are requested through the server so the shared rate
 * limiter can cap them — otherwise anyone can have Supabase mail-bomb a pupil.
 *
 * The response never says whether the address exists.
 */

const ResetSchema = z.object({ email: emailSchema })

export async function POST(request: Request) {
  const parsed = await parseBody(request, ResetSchema, 'Unesite email')
  if (!parsed.ok) return parsed.response

  const { email } = parsed.data
  const ip = clientIp(request)

  const perAccount = await checkRateLimit(`reset-pw:email:${email}`, 3, 15 * 60_000)
  const perIp = await checkRateLimit(`reset-pw:ip:${ip}`, 10, 15 * 60_000)
  const limited = perAccount.limited ? perAccount : perIp.limited ? perIp : null

  if (limited) {
    return NextResponse.json(
      { error: 'Previše zahtjeva. Pokušaj ponovo kasnije.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
    )
  }

  // No redirectTo on purpose: the reset page verifies the 6-digit code from
  // the mail with verifyOtp(), exactly as before this route existed.
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    console.error('reset-password request failed', error.message)
  }

  // Same answer either way, so the endpoint cannot be used to probe accounts.
  return NextResponse.json({ ok: true })
}
