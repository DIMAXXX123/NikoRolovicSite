import { NextResponse } from 'next/server'
import { DIREKTOR_ROLES, getCallerProfile, hasRole } from '@/lib/api-auth'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { fetchDirektorStats, forbidden, serverError, writeAudit } from '@/lib/direktor-api'
import type { DirektorStats } from '@/lib/direktor-types'

/**
 * POST /api/direktor/digest
 *
 * "Pošalji sažetak": composes the 5-line weekly digest (spec §5.3 — WAU and
 * its delta, school health, best / worst subject, risks, one AI
 * recommendation) from direktor_stats('7d') and sends it to the director's
 * Telegram chats (TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_IDS, the same channel
 * the photo moderation uses). Without Telegram configuration it only returns
 * the text. No cron — the button triggers it. Roles: direktor / admin /
 * creator / pedagog. Audited.
 *
 * Response: { text, sent: boolean, recipients: number }
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ''

function fmtDelta(delta: number | null, unit = '%'): string {
  if (delta === null || delta === undefined) return ''
  const sign = delta > 0 ? '+' : ''
  return ` (${sign}${delta}${unit})`
}

function composeDigest(s: DirektorStats): string {
  const subjects = s.learning.subjects.filter((x) => x.avg_score !== null)
  const worst = subjects[0]
  const best = subjects[subjects.length - 1]
  const topSignal = s.signals[0]
  const rec = s.ai.latest?.output?.recommendations?.[0]

  const lines = [
    `📊 Sedmični sažetak — Gimnazija „Niko Rolović“ (${s.meta.from} – ${s.meta.to})`,
    `1. Aktivni učenici (7 dana): ${s.kpi.wau.value ?? '—'}${fmtDelta(s.kpi.wau.delta_pct)} · pokrivenost ${s.kpi.coverage_pct.value ?? '—'}%`,
    `2. Zdravlje škole: ${s.health.score ?? '—'}/100${fmtDelta(s.health.delta, ' p.')}`,
    `3. Predmeti: najbolji ${best ? `${best.subject} ${best.avg_score}%` : '—'} · najslabiji ${worst ? `${worst.subject} ${worst.avg_score}%` : '—'}`,
    `4. Rizici: ${s.classes.at_risk.count} učenika u riziku${topSignal ? ` · ${topSignal.text}` : ''}`,
    `5. Preporuka AI: ${rec ? rec.action : 'AI analiza još nije generisana'}`,
  ]
  if (s.meta.demo_share > 50) lines.push('⚠️ DEMO PODACI')
  if (APP_URL) lines.push(`${APP_URL.replace(/\/$/, '')}/direktor`)
  return lines.join('\n')
}

async function sendTelegram(text: string): Promise<number> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatIds = (process.env.TELEGRAM_ADMIN_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!token || chatIds.length === 0) return 0

  let sent = 0
  for (const chatId of chatIds) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      })
      if (res.ok) sent += 1
      else console.error('digest: telegram sendMessage failed', chatId, res.status)
    } catch (err) {
      console.error('digest: telegram unreachable', chatId, err)
    }
  }
  return sent
}

export async function POST(request: Request) {
  const caller = await getCallerProfile()
  if (!caller || !hasRole(caller, DIREKTOR_ROLES)) return forbidden()

  const rate = await checkRateLimit(`direktor-digest:${caller.id}:${clientIp(request)}`, 5, 60_000)
  if (rate.limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    )
  }

  try {
    const stats = await fetchDirektorStats<DirektorStats>({ period: '7d', class: null, section: null, subject: null })
    const text = composeDigest(stats)
    const recipients = await sendTelegram(text)
    await writeAudit(caller, 'direktor.digest', 'app_events', null, { recipients })
    return NextResponse.json({ text, sent: recipients > 0, recipients })
  } catch (err) {
    console.error('direktor/digest failed', err)
    return serverError('Failed to compose digest')
  }
}
