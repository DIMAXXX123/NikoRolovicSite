import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const ADMIN_CHAT_IDS = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').filter(Boolean)

// Simple in-memory rate limit (resets on deploy)
const requestCounts = new Map<string, number>()

export async function POST(request: Request) {
  try {
    const { firstName, lastName, classNumber, sectionNumber, fingerprint } = await request.json()

    if (!firstName || !lastName || !classNumber || !sectionNumber) {
      return NextResponse.json({ error: 'Sva polja su obavezna' }, { status: 400 })
    }

    // Rate limit: max 2 requests per fingerprint
    const key = fingerprint || `${firstName}_${lastName}`.toLowerCase()
    const count = requestCounts.get(key) || 0
    if (count >= 2) {
      return NextResponse.json({ error: 'Već si poslao maksimalan broj zahtjeva (2)' }, { status: 429 })
    }
    requestCounts.set(key, count + 1)

    const text = `📋 Zahtjev za dodavanje učenika!\n\n👤 ${firstName} ${lastName}\n🏫 Razred: ${classNumber}-${sectionNumber}`

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
  } catch (error) {
    return NextResponse.json({ error: 'Greška' }, { status: 500 })
  }
}
