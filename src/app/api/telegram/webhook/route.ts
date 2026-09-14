import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { parseBody } from '@/lib/api-validation'

// SECURITY NOTES:
// - Callers must present the TELEGRAM_WEBHOOK_SECRET header that Telegram
//   sends for this webhook; requests without it are rejected.
// - The payload is validated with zod before anything is read out of it.
// - Rate limiting: Telegram itself rate-limits webhook calls.
// - The service role key bypasses RLS — only photo moderation and roster
//   inserts are performed, scoped to the ids carried in the callback data.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

// Only the fields this handler actually uses; unknown keys are ignored.
const UpdateSchema = z.object({
  callback_query: z
    .object({
      id: z.string().min(1),
      data: z.string().min(1).max(200),
      from: z.object({ first_name: z.string().max(200).optional() }).optional(),
      message: z.object({
        message_id: z.number().int(),
        chat: z.object({ id: z.union([z.number().int(), z.string()]) }),
        text: z.string().optional(),
        caption: z.string().optional(),
      }),
    })
    .optional(),
})

const AddStudentData = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  classNumber: z.coerce.number().int().min(1).max(4),
  sectionNumber: z.coerce.number().int().min(1).max(6),
})

const UUID = z.uuid()

async function telegram(method: string, payload: unknown) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function POST(request: Request) {
  try {
    // Verify Telegram webhook secret token (trim to avoid newline mismatches)
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
    if (webhookSecret) {
      const headerSecret = request.headers.get('x-telegram-bot-api-secret-token')?.trim()
      if (headerSecret !== webhookSecret) {
        console.warn('Webhook secret mismatch')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const parsed = await parseBody(request, UpdateSchema)
    if (!parsed.ok) return parsed.response

    const query = parsed.data.callback_query
    if (!query) return NextResponse.json({ ok: true })

    const data = query.data // e.g. "approve_<photoId>" / "addstudent_Ime_Prezime_1_2"
    const chatId = query.message.chat.id
    const messageId = query.message.message_id

    const parts = data.split('_')
    const action = parts[0]
    const supabase = createServiceClient()

    // Handle student add/reject requests
    if (action === 'addstudent') {
      const student = AddStudentData.safeParse({
        firstName: parts[1],
        lastName: parts[2],
        classNumber: parts[3],
        sectionNumber: parts[4],
      })

      if (!student.success) {
        await telegram('answerCallbackQuery', {
          callback_query_id: query.id,
          text: '⚠️ Neispravni podaci u zahtjevu.',
        })
        return NextResponse.json({ ok: true })
      }

      await supabase.from('verified_students').insert({
        first_name: student.data.firstName,
        last_name: student.data.lastName,
        class_number: student.data.classNumber,
        section_number: student.data.sectionNumber,
        email: `pending_${student.data.firstName.toLowerCase()}_${student.data.lastName.toLowerCase()}@temp.com`,
      })

      await telegram('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: (query.message.text ?? '') + `\n\n✅ DODAT u bazu!`,
      })

      await telegram('answerCallbackQuery', { callback_query_id: query.id, text: '✅ Učenik dodat!' })
      return NextResponse.json({ ok: true })
    }

    if (action === 'rejectstudent') {
      await telegram('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: (query.message.text ?? '') + `\n\n❌ ODBIJENO`,
      })

      await telegram('answerCallbackQuery', { callback_query_id: query.id, text: '❌ Zahtjev odbijen.' })
      return NextResponse.json({ ok: true })
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ ok: true })
    }

    const photoId = UUID.safeParse(parts[1])
    if (!photoId.success) {
      await telegram('answerCallbackQuery', {
        callback_query_id: query.id,
        text: '⚠️ Neispravan ID fotografije.',
      })
      return NextResponse.json({ ok: true })
    }

    // Check if already decided
    const { data: photo } = await supabase
      .from('photos')
      .select('status')
      .eq('id', photoId.data)
      .maybeSingle()

    if (photo && photo.status !== 'pending') {
      await telegram('answerCallbackQuery', {
        callback_query_id: query.id,
        text: `Već odlučeno: ${photo.status}`,
      })
      return NextResponse.json({ ok: true })
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    await supabase.from('photos').update({ status }).eq('id', photoId.data)

    const moderatorName = query.from?.first_name || 'Moderator'
    const decision = action === 'approve' ? '✅ ODOBRENO' : '❌ ODBIJENO'

    await telegram('editMessageCaption', {
      chat_id: chatId,
      message_id: messageId,
      caption: (query.message.caption ?? '') + `\n\n${decision} (${moderatorName})`,
    })

    await telegram('answerCallbackQuery', {
      callback_query_id: query.id,
      text: action === 'approve' ? '✅ Foto odobren!' : '❌ Foto odbijen.',
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}
