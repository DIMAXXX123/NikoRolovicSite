import { createClient } from '@/lib/supabase/server'
import { BetaDisclaimer } from '@/components/beta-disclaimer'
import { EVENTS_PAGE_SIZE, monthRange, todayISO } from './event-config'
import { EventsView } from './events-view'
import type { Event, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = (data as Profile | null) ?? null
  }

  const now = new Date()
  const { start, end } = monthRange(now.getFullYear(), now.getMonth())

  // Upcoming list (first page) and the current month grid, in parallel.
  const [upcomingRes, monthRes] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .gte('event_date', todayISO())
      .order('event_date', { ascending: true })
      .range(0, EVENTS_PAGE_SIZE),
    supabase
      .from('events')
      .select('*')
      .gte('event_date', start)
      .lte('event_date', end)
      .order('event_date', { ascending: true }),
  ])

  const upcomingRows = (upcomingRes.data ?? []) as Event[]
  const hasMore = upcomingRows.length > EVENTS_PAGE_SIZE

  return (
    <div className="space-y-4 animate-fade-in">
      <BetaDisclaimer />
      <EventsView
        profile={profile}
        initialUpcoming={hasMore ? upcomingRows.slice(0, EVENTS_PAGE_SIZE) : upcomingRows}
        initialHasMore={hasMore}
        initialMonthEvents={(monthRes.data ?? []) as Event[]}
        initialMonth={now.getMonth()}
        initialYear={now.getFullYear()}
      />
    </div>
  )
}
