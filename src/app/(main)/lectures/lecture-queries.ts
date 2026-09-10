import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lecture } from '@/lib/types'

export const LECTURES_PAGE_SIZE = 15

/** Lectures are always scoped to the reader's class and one subject. */
export async function fetchLecturesPage(
  supabase: SupabaseClient,
  classNumber: number,
  subject: string,
  page: number,
  pageSize: number = LECTURES_PAGE_SIZE
): Promise<{ items: Lecture[]; hasMore: boolean }> {
  const from = page * pageSize
  const { data } = await supabase
    .from('lectures')
    .select('*')
    .eq('class_number', classNumber)
    .eq('subject', subject)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize)

  const rows = (data ?? []) as Lecture[]
  const hasMore = rows.length > pageSize
  return { items: hasMore ? rows.slice(0, pageSize) : rows, hasMore }
}

/**
 * Ids of every lecture in a subject, in list order. Used by the detail page for
 * the "lecture N of M" progress bar and the prev/next links — only the id
 * column travels, so it stays cheap even for a long subject.
 */
export async function fetchLectureOrder(
  supabase: SupabaseClient,
  classNumber: number,
  subject: string
): Promise<string[]> {
  const { data } = await supabase
    .from('lectures')
    .select('id')
    .eq('class_number', classNumber)
    .eq('subject', subject)
    .order('created_at', { ascending: false })
  return ((data ?? []) as { id: string }[]).map((row) => row.id)
}
