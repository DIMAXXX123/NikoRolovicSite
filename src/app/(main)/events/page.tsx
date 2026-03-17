'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, MapPin, Clock } from 'lucide-react'
import type { Event } from '@/lib/types'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const supabase = createClient()

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })

    if (data) setEvents(data)
    setLoading(false)
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('sr-Latn', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  function formatTime(timeStr: string | null) {
    if (!timeStr) return null
    return timeStr.slice(0, 5)
  }

  // Group events by month for calendar view
  const groupedByMonth = events.reduce((acc, event) => {
    const month = new Date(event.event_date + 'T00:00:00').toLocaleDateString('sr-Latn', {
      month: 'long',
      year: 'numeric',
    })
    if (!acc[month]) acc[month] = []
    acc[month].push(event)
    return acc
  }, {} as Record<string, Event[]>)

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold gradient-text">Događaji</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text">Događaji</h1>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${
              view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-3 py-1 text-xs rounded-md transition-all ${
              view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            Kalendar
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nema predstojećih događaja</p>
        </div>
      ) : view === 'list' ? (
        events.map((event) => (
          <Card key={event.id} className="border-border/30 bg-card/50 backdrop-blur animate-slide-up">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-700/20 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {new Date(event.event_date + 'T00:00:00').getDate()}
                  </span>
                  <span className="text-[10px] text-primary uppercase">
                    {new Date(event.event_date + 'T00:00:00').toLocaleDateString('sr-Latn', { month: 'short' })}
                  </span>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(event.event_date)}
                    </span>
                    {event.event_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.event_time)}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        Object.entries(groupedByMonth).map(([month, monthEvents]) => (
          <div key={month} className="space-y-3">
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">{month}</h2>
            {monthEvents.map((event) => (
              <Card key={event.id} className="border-border/30 bg-card/50 backdrop-blur">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {new Date(event.event_date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.event_time && `${formatTime(event.event_time)} · `}
                      {event.location || ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
