import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import {
  classNumberSchema,
  parseBody,
  personNameSchema,
  sectionNumberSchema,
} from '@/lib/api-validation'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const ADMIN_CHAT_IDS = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').filter(Boolean)

// Open endpoint (a pupil missing from the roster cannot be signed in yet), so
// it leans on the shared rate limiter instead of an in-process Map.
const RequestJoinSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  classNumber: classNumberSchema,
  sectionNumber: sectionNumberSchema,
  fingerprint: z.string().trim().max(512).optional(),
})

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, RequestJoinSchema, 'Neispravni podaci')
    if (!parsed.ok) return parsed.response

    const { firstName, lastName, classNumber, sectionNumber, fingerprint } = parsed.data

    // Max 2 requests per identity and a wider cap per IP, shared across all
    // serverless instances.
    const identity = (fingerprint || `${firstName}_${lastName}`).toLowerCase()
    const perIdentity = await checkRateLimit(`request-join:id:${identity}`, 2, 24 * 60 * 60_000)
    if (perIdentity.limited) {
      return NextResponse.json({ error: 'Već si poslao maksimalan broj zahtjeva (2)' }, { status: 429 })
    }

    const perIp = await checkRateLimit(`request-join:ip:${clientIp(request)}`, 10, 60 * 60_000)
    if (perIp.limited) {
      return NextResponse.json(
        { error: 'Previše zahtjeva. Pokušaj ponovo kasnije.' },
        { status: 429, headers: { 'Retry-After': String(perIp.retryAfter) } }
      )
    }

    // Sanitize display text
    const safeName = `${firstName} ${lastName}`.slice(0, 100)
    const text = `📋 Zahtjev za dodavanje učenika!\n\n👤 ${safeName}\n🏫 Razred: ${classNumber}-${sectionNumber}`

    for (const chatId of ADMIN_CHAT_IDS) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Dodaj', callback_data: `addstudent_${firstName}_${lastName}_${classNumber}_${sectionNumber}` },
                { text: '❌ Odbij', callback_data: `rejectstudent_${firstName}_${lastName}` },
              ],
            ],
          },
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Greška' }, { status: 500 })
  }
}
