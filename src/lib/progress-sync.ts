'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Fire-and-forget server copies of local learning data (spec §1.3).
 * Signed-in users only; guests keep everything in localStorage. Nothing here
 * awaits in the UI path and nothing throws.
 */

export interface QuizResultInput {
  lectureId: string
  subject: string
  classNumber: number
  score: number
  correct: number
  total: number
  durationS: number | null
  /** Per-question outcome, index-aligned with the quiz. */
  answers?: unknown
}

export function syncQuizResult(input: QuizResultInput) {
  void (async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('section_number')
        .eq('id', user.id)
        .maybeSingle()
      await supabase.from('quiz_results').insert({
        user_id: user.id,
        lecture_id: input.lectureId,
        subject: input.subject,
        class_number: input.classNumber,
        section_number: (profile?.section_number as number | null) ?? null,
        score: Math.max(0, Math.min(100, Math.round(input.score))),
        correct: input.correct,
        total: input.total,
        duration_s: input.durationS,
        answers: input.answers ?? null,
      })
    } catch {
      // offline / RLS / guest — localStorage remains the source of truth
    }
  })()
}

/** markRead → upsert; unmarkRead → delete. */
export function syncLectureRead(lectureId: string, read: boolean) {
  void (async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (read) {
        await supabase
          .from('lecture_progress_srv')
          .upsert({ user_id: user.id, lecture_id: lectureId, read_at: new Date().toISOString() }, { onConflict: 'user_id,lecture_id' })
      } else {
        await supabase.from('lecture_progress_srv').delete().eq('user_id', user.id).eq('lecture_id', lectureId)
      }
    } catch {
      // ignore
    }
  })()
}
