'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, MapPin, Clock } from 'lucide-react'
import type { Event } from '@/lib/types'

const dayColors = [
  'from-purple-500 to-violet-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-green-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
]

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

  function getDaysUntil(dateStr: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDate = new Date(dateStr + 'T00:00:00')
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Danas'
    if (diff === 1) return 'Sutra'
    return `Za ${diff} dana`
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
        events.map((event, index) => (
          <Card key={event.id} className="border-border/30 bg-card/50 backdrop-blur animate-slide-up card-hover overflow-hidden" style={{ animationDelay: `${index * 0.05}s` }}>
            <CardContent className="p-0">
              <div className="flex">
                {/* Big bold date box */}
                <div className={`flex-shrink-0 w-20 bg-gradient-to-br ${dayColors[index % dayColors.length]} flex flex-col items-center justify-center p-3`}>
                  <span className="text-2xl font-extrabold text-white leading-none">
                    {new Date(event.event_date + 'T00:00:00').getDate()}
                  </span>
                  <span className="text-xs font-semibold text-white/90 uppercase mt-0.5">
                    {new Date(event.event_date + 'T00:00:00').toLocaleDateString('sr-Latn', { month: 'short' })}
                  </span>
                  <span className="text-[9px] text-white/70 font-medium mt-1 bg-white/20 rounded-full px-1.5 py-0.5">
                    {getDaysUntil(event.event_date)}
                  </span>
                </div>
                <div className="flex-1 p-4 space-y-1">
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
            {monthEvents.map((event, index) => (
              <Card key={event.id} className="border-border/30 bg-card/50 backdrop-blur card-hover overflow-hidden">
                <CardContent className="p-0 flex items-stretch">
                  <div className={`w-14 bg-gradient-to-br ${dayColors[index % dayColors.length]} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg font-extrabold text-white">
                      {new Date(event.event_date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                  <div className="p-3">
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
