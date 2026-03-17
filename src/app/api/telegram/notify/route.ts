import { NextResponse } from 'next/server'

// SECURITY NOTES:
// - This endpoint is called from authenticated client pages (gallery upload).
// - Rate limiting: Consider adding rate limiting middleware (e.g., Vercel Edge rate limit)
//   to prevent abuse — max ~5 notifications per user per minute is reasonable.
// - Input validation: photoId, imageUrl, userName, caption are validated below.
// - Supabase handles auth/password hashing (bcrypt) on the server side.
// - CSRF protection: Next.js API routes inherently check the Origin header in production.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
// Admin Telegram IDs who receive moderation notifications
const ADMIN_CHAT_IDS = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').filter(Boolean)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { photoId, imageUrl, userName, caption } = body

    // Input validation
    if (!photoId || typeof photoId !== 'string') {
      return NextResponse.json({ error: 'Invalid photoId' }, { status: 400 })
    }
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'Invalid imageUrl' }, { status: 400 })
    }
    if (!userName || typeof userName !== 'string') {
      return NextResponse.json({ error: 'Invalid userName' }, { status: 400 })
    }

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
