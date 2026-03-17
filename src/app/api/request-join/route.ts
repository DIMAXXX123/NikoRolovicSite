import { NextResponse } from 'next/server'

// Rate limiting: In-memory rate limit (resets on deploy). Consider persistent rate limiting for production.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const ADMIN_CHAT_IDS = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').filter(Boolean)

// Simple in-memory rate limit (resets on deploy)
const requestCounts = new Map<string, number>()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, classNumber, sectionNumber, fingerprint } = body

    // Input validation
    if (!firstName || typeof firstName !== 'string' || firstName.length > 100) {
      return NextResponse.json({ error: 'Neispravno ime' }, { status: 400 })
    }
    if (!lastName || typeof lastName !== 'string' || lastName.length > 100) {
      return NextResponse.json({ error: 'Neispravno prezime' }, { status: 400 })
    }
    if (!classNumber || typeof classNumber !== 'number' || classNumber < 1 || classNumber > 4) {
      return NextResponse.json({ error: 'Neispravan razred' }, { status: 400 })
    }
    if (!sectionNumber || typeof sectionNumber !== 'number' || sectionNumber < 1 || sectionNumber > 10) {
      return NextResponse.json({ error: 'Neispravno odjeljenje' }, { status: 400 })
    }

    // Rate limit: max 2 requests per fingerprint
    const key = fingerprint || `${firstName}_${lastName}`.toLowerCase()
    const count = requestCounts.get(key) || 0
    if (count >= 2) {
      return NextResponse.json({ error: 'Već si poslao maksimalan broj zahtjeva (2)' }, { status: 429 })
    }
    requestCounts.set(key, count + 1)

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
