import { createClient } from '@/lib/supabase/server'
import { ScheduleView } from './schedule-view'

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // The grid itself lives in localStorage, but which class to show comes from
  // the profile — resolve it on the server so the page never renders 1-1 first.
  let classNum = 1
  let sectionNum = 1
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('class_number, section_number')
      .eq('id', user.id)
      .single()
    if (profile) {
      classNum = profile.class_number ?? 1
      sectionNum = profile.section_number ?? 1
    }
  }

  return <ScheduleView initialClassNum={classNum} initialSectionNum={sectionNum} />
}
