import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
// Admin Telegram IDs who receive moderation notifications
const ADMIN_CHAT_IDS = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').filter(Boolean)

export async function POST(request: Request) {
  try {
    const { photoId, imageUrl, userName, caption } = await request.json()

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
