import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// SECURITY NOTES:
// - This webhook is called by Telegram servers. For additional security,
//   consider verifying the request comes from Telegram using a secret token
//   in the webhook URL (e.g., /api/telegram/webhook?token=SECRET).
// - Rate limiting: Telegram itself rate-limits webhook calls, but consider
//   adding server-side rate limiting for extra protection.
// - The service role key bypasses RLS — use with caution. Only approve/reject
//   actions are performed, scoped to a specific photo ID.
// - Supabase handles all password hashing (bcrypt) server-side.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

export async function POST(request: Request) {
  try {
    // Verify Telegram webhook secret token
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (webhookSecret) {
      const headerSecret = request.headers.get('x-telegram-bot-api-secret-token')
      if (headerSecret !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      console.warn('TELEGRAM_WEBHOOK_SECRET not set — skipping webhook secret verification')
    }

    const body = await request.json()

    // Handle callback queries (button presses)
    if (body.callback_query) {
      const query = body.callback_query
      const data = query.data // format: "approve_PHOTOID" or "reject_PHOTOID"
      const chatId = query.message.chat.id
      const messageId = query.message.message_id

      const parts = data.split('_')
      const action = parts[0]
      const supabase = getSupabaseAdmin()

      // Handle student add/reject requests
      if (action === 'addstudent') {
        const [, firstName, lastName, classNum, sectionNum] = parts
        await supabase.from('verified_students').insert({
          first_name: firstName,
          last_name: lastName,
          class_number: parseInt(classNum),
          section_number: parseInt(sectionNum),
          email: `pending_${firstName.toLowerCase()}_${lastName.toLowerCase()}@temp.com`,
        })

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: query.message.text + `\n\n✅ DODAT u bazu!`,
          }),
        })

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: query.id, text: '✅ Učenik dodat!' }),
        })
        return NextResponse.json({ ok: true })
      }

      if (action === 'rejectstudent') {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: query.message.text + `\n\n❌ ODBIJENO`,
          }),
        })

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: query.id, text: '❌ Zahtjev odbijen.' }),
        })
        return NextResponse.json({ ok: true })
      }

      const photoId = parts[1]

      if (action === 'approve') {
        await supabase
          .from('photos')
          .update({ status: 'approved' })
          .eq('id', photoId)

        // Edit the message to show approved
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageCaption`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            caption: query.message.caption + '\n\n✅ ODOBRENO',
          }),
        })

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: query.id,
            text: '✅ Foto odobren!',
          }),
        })
      } else if (action === 'reject') {
        await supabase
          .from('photos')
          .update({ status: 'rejected' })
          .eq('id', photoId)

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageCaption`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            caption: query.message.caption + '\n\n❌ ODBIJENO',
          }),
        })

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: query.id,
            text: '❌ Foto odbijen.',
          }),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}
