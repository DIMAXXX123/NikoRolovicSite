import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCallerProfile } from '@/lib/api-auth'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { parseBody, uuidSchema } from '@/lib/api-validation'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
// Admin Telegram IDs who receive moderation notifications
const ADMIN_CHAT_IDS = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').filter(Boolean)

// Called right after a pupil uploads a photo, so it requires their session:
// without that anyone could push arbitrary text and image URLs into the
// moderators' Telegram chat.
const NotifySchema = z.object({
  photoId: uuidSchema,
  imageUrl: z.url().max(2048),
  userName: z.string().trim().min(1).max(100),
  caption: z.string().trim().max(500).optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const caller = await getCallerProfile()
    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rate = await checkRateLimit(`telegram-notify:${caller.id}:${clientIp(request)}`, 10, 60_000)
    if (rate.limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    }

    const parsed = await parseBody(request, NotifySchema)
    if (!parsed.ok) return parsed.response

    const { photoId, imageUrl, userName, caption } = parsed.data

    const text = `📸 Nova fotografija za moderaciju!\n\n👤 ${userName}\n${caption ? `💬 ${caption}\n` : ''}🆔 ${photoId}`

    for (const chatId of ADMIN_CHAT_IDS) {
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId.trim(),
            photo: imageUrl,
            caption: text,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ Da', callback_data: `approve_${photoId}` },
                  { text: '❌ Ne', callback_data: `reject_${photoId}` },
                ],
              ],
            },
          }),
        })
      } catch (e) {
        console.error(`Failed to notify ${chatId}:`, e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Notify error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
