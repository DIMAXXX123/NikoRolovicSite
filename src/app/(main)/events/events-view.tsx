'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Plus, X, List, CalendarDays } from 'lucide-react'
import {
  DAY_NAMES,
  EVENTS_PAGE_SIZE,
  EVENT_TYPE_CONFIG,
  MONTH_NAMES,
  getDaysInMonth,
  getFirstDayOfWeek,
  monthRange,
  todayISO,
} from './event-config'
import type { Event, EventType, Profile } from '@/lib/types'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('sr-Latn', {
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

interface EventsViewProps {
  profile: Profile | null
  initialUpcoming: Event[]
  initialHasMore: boolean
  initialMonthEvents: Event[]
  initialMonth: number
  initialYear: number
}

export function EventsView({
  profile,
  initialUpcoming,
  initialHasMore,
  initialMonthEvents,
  initialMonth,
  initialYear,
}: EventsViewProps) {
  const [events, setEvents] = useState<Event[]>(initialUpcoming)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [monthEvents, setMonthEvents] = useState<Event[]>(initialMonthEvents)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(initialMonth)
  const [currentYear, setCurrentYear] = useState(initialYear)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_time: '',
    location: '',
    event_type: 'test' as EventType,
  })
  const [addingForDay, setAddingForDay] = useState<number | null>(null)
  const [eventToast, setEventToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const purgedRef = useRef(false)
  const supabase = createClient()

  const isAdmin =
    profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'creator'

  const loadMonthEvents = useCallback(
    async (year: number, month: number) => {
      const { start, end } = monthRange(year, month)
      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', start)
        .lte('event_date', end)
        .order('event_date', { ascending: true })
      if (data) setMonthEvents(data as Event[])
    },
    [supabase]
  )

  const loadUpcoming = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', todayISO())
      .order('event_date', { ascending: true })
      .range(0, EVENTS_PAGE_SIZE)
    const rows = (data ?? []) as Event[]
    setHasMore(rows.length > EVENTS_PAGE_SIZE)
    setEvents(rows.slice(0, EVENTS_PAGE_SIZE))
    setPage(0)
  }, [supabase])

  // Purge events that are already in the past. This is a write, so it can't
  // live in the server component — run it once after hydration.
  useEffect(() => {
    if (purgedRef.current) return
    purgedRef.current = true
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    supabase
      .from('events')
      .delete()
      .lt('event_date', yesterday.toISOString().split('T')[0])
      .then(() => undefined)
  }, [supabase])

  // The first month comes from the server; only refetch after navigation.
  const isInitialMonth = currentMonth === initialMonth && currentYear === initialYear
  useEffect(() => {
    if (isInitialMonth) return
    loadMonthEvents(currentYear, currentMonth)
  }, [isInitialMonth, currentYear, currentMonth, loadMonthEvents])

  async function loadMoreUpcoming() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    const from = nextPage * EVENTS_PAGE_SIZE
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', todayISO())
        .order('event_date', { ascending: true })
        .range(from, from + EVENTS_PAGE_SIZE)
      const rows = (data ?? []) as Event[]
      setHasMore(rows.length > EVENTS_PAGE_SIZE)
      setEvents((prev) => {
        const seen = new Set(prev.map((e) => e.id))
        return [...prev, ...rows.slice(0, EVENTS_PAGE_SIZE).filter((e) => !seen.has(e.id))]
      })
      setPage(nextPage)
    } finally {
      setLoadingMore(false)
    }
  }

  const eventsByDay = useMemo(() => {
    const map: Record<number, Event[]> = {}
    monthEvents.forEach((event) => {
      const day = new Date(event.event_date + 'T00:00:00').getDate()
      if (!map[day]) map[day] = []
      map[day].push(event)
    })
    return map
  }, [monthEvents])

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDay(null)
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDay(null)
  }

  function getEventDotColor(event: Event): string {
    const type = event.event_type || 'drugo'
    return EVENT_TYPE_CONFIG[type]?.dotColor || 'bg-[#58CC02]'
  }

  function showEventToast(message: string, type: 'success' | 'error' = 'success') {
    setEventToast({ message, type })
    setTimeout(() => setEventToast(null), 3000)
  }

  async function handleAddEvent() {
    if (!addingForDay || !newEvent.title.trim()) return
    const eventDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(addingForDay).padStart(2, '0')}`

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showEventToast('Niste prijavljeni', 'error')
      return
    }

    const { error } = await supabase
      .from('events')
      .insert({
        title: newEvent.title,
        description: newEvent.description || null,
        event_date: eventDate,
        event_time: newEvent.event_time || null,
        author_id: user.id,
        event_type: newEvent.event_type,
      })
      .select()

    if (error) {
      showEventToast(`Greška: ${error.message}`, 'error')
      return
    }

    showEventToast('Događaj dodat!')
    setShowAddEvent(false)
    setAddingForDay(null)
    setNewEvent({ title: '', description: '', event_time: '', location: '', event_type: 'test' })
    loadMonthEvents(currentYear, currentMonth)
    loadUpcoming()
  }

  const today = new Date()
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth)

  // ========== DAY DETAIL MODAL ==========
  const dayModal = selectedDay !== null && (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={() => {
        setSelectedDay(null)
        setShowAddEvent(false)
      }}
    >
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)]" />
      <div
        className="relative w-full max-w-lg bg-background border-2 border-border rounded-t-3xl p-6 pb-24 animate-slide-up max-h-[60vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">
            {selectedDay}. {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setSelectedDay(null)
              setShowAddEvent(false)
            }}
          >
            <X className="text-muted-foreground" strokeWidth={2.4} />
          </Button>
        </div>

        {/* Admin add event - top of modal */}
        {isAdmin && !showAddEvent && (
          <Button
            variant="outline"
            onClick={() => {
              setAddingForDay(selectedDay)
              setShowAddEvent(true)
            }}
            className="w-full mb-4"
          >
            <Plus strokeWidth={2.6} /> Dodaj događaj
          </Button>
        )}

        {showAddEvent && (
          <div className="mb-4 space-y-3 animate-fade-in">
            <Input
              type="text"
              placeholder="Naziv događaja"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Opis (opciono)"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="time"
                value={newEvent.event_time}
                onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
              />
              <Input
                type="text"
                placeholder="Lokacija"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
            </div>
            {/* Type selector */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewEvent({ ...newEvent, event_type: key as EventType })}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl border-2 px-3.5 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,color,border-color] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    newEvent.event_type === key
                      ? 'bg-secondary-light border-secondary-light-border text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]'
                      : 'bg-background border-border text-muted-foreground shadow-[0_2px_0_var(--color-border)]'
                  }`}
                >
                  <span className={`size-2 rounded-full ${config.dotColor}`} />
                  {config.label}
                </button>
              ))}
            </div>
            <Button onClick={handleAddEvent} disabled={!newEvent.title.trim()} className="w-full">
              Sačuvaj
            </Button>
          </div>
        )}

        {eventsByDay[selectedDay] && eventsByDay[selectedDay].length > 0 ? (
          <div className="space-y-2.5">
            {eventsByDay[selectedDay].map((event) => {
              const type = event.event_type || 'drugo'
              const config = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.drugo
              return (
                <Card key={event.id} className="gap-2 px-4 py-3">
                  <CardContent className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={config.color}>{config.label}</Badge>
                      <h3 className="text-[17px] leading-[1.3] font-extrabold text-heading">{event.title}</h3>
                    </div>
                    {event.description && (
                      <p className="text-[15px] leading-[1.5] font-bold text-foreground">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-[13px] font-bold text-muted-foreground">
                      {event.event_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" strokeWidth={2.4} /> {formatTime(event.event_time)}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" strokeWidth={2.4} /> {event.location}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <p className="text-[13px] font-bold text-muted-foreground text-center py-6">Nema događaja za ovaj dan</p>
        )}
      </div>
    </div>
  )

  return (
    <>
      {eventToast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl text-[13px] font-extrabold animate-slide-down ${
            eventToast.type === 'success'
              ? 'bg-[#F4FFEA] border-2 border-primary-light-border text-primary-text shadow-[0_2px_0_var(--color-primary-light-border)]'
              : 'bg-[#FFDFE0] border-2 border-[#FFB3B5] text-[#EA2B2B] shadow-[0_2px_0_#FFB3B5]'
          }`}
        >
          {eventToast.message}
        </div>
      )}
      <Tabs id="events-view" value={view} onValueChange={(value) => setView(value as 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarDays strokeWidth={2.4} /> Kalendar
          </TabsTrigger>
          <TabsTrigger value="list">
            <List strokeWidth={2.4} /> Lista
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'calendar' ? (
        <div className="space-y-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button size="icon" onClick={prevMonth}>
              <ChevronLeft strokeWidth={2.6} />
            </Button>
            <h2 key={`${currentMonth}-${currentYear}`} className="text-[20px] leading-[1.25] font-extrabold text-heading animate-fade-in">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <Button size="icon" onClick={nextMonth}>
              <ChevronRight strokeWidth={2.6} />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((day) => (
              <div key={day} className="text-center text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div key={`cal-${currentMonth}-${currentYear}`} className="grid grid-cols-7 gap-1 animate-fade-in">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayEvents = eventsByDay[day] || []
              const hasEvents = dayEvents.length > 0
              const isTodayCell = isToday(day)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className="group/day relative flex h-12 w-full flex-col items-center justify-start transition-transform active:scale-90"
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-full text-[15px] transition-colors ${
                      isTodayCell
                        ? 'bg-primary text-primary-foreground font-extrabold'
                        : selectedDay === day
                          ? 'border-2 border-secondary bg-secondary-light text-secondary font-extrabold'
                          : 'text-foreground font-bold group-hover/day:bg-muted'
                    }`}
                  >
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="flex gap-0.5 absolute bottom-0">
                      {dayEvents.slice(0, 3).map((event, ei) => (
                        <div key={ei} className={`size-1.5 rounded-full ${getEventDotColor(event)}`} />
                      ))}
                    </div>
                  )}
                  {isAdmin && !hasEvents && (
                    <div className="absolute bottom-0 flex items-center justify-center opacity-0 group-hover/day:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3 text-disabled" strokeWidth={2.6} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-2">
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground">
                <div className={`size-2 rounded-full ${config.dotColor}`} />
                {config.label}
              </div>
            ))}
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-3">
            <Calendar className="w-7 h-7 text-disabled" strokeWidth={2.4} />
          </div>
          <p className="text-[17px] font-extrabold text-foreground">Nema predstojećih događaja</p>
        </div>
      ) : (
        <div className="space-y-2.5 animate-stagger-scale">
          {events.map((event, index) => {
            const type = event.event_type || 'drugo'
            const config = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.drugo
            const eventDate = new Date(event.event_date + 'T00:00:00')
            return (
              <Card
                key={event.id}
                className="flex-row items-center gap-3 min-h-16 px-4 py-3 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-full border-2 ${config.color}`}
                >
                  <span className="text-[15px] font-black leading-none tabular-nums">
                    {eventDate.getDate()}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.04em] leading-none mt-0.5">
                    {eventDate.toLocaleDateString('sr-Latn', { month: 'short' })}
                  </span>
                </div>
                <CardContent className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={config.color}>{config.label}</Badge>
                    <Badge variant="outline">{getDaysUntil(event.event_date)}</Badge>
                  </div>
                  <h3 className="text-[17px] leading-[1.3] font-extrabold text-heading">{event.title}</h3>
                  {event.description && (
                    <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-[13px] font-bold text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={2.4} />
                      {formatDate(event.event_date)}
                    </span>
                    {event.event_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" strokeWidth={2.4} />
                        {formatTime(event.event_time)}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" strokeWidth={2.4} />
                        {event.location}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {hasMore && (
            <Button variant="outline" onClick={loadMoreUpcoming} disabled={loadingMore} className="w-full">
              {loadingMore ? 'Učitavanje…' : 'Učitaj još'}
            </Button>
          )}
        </div>
      )}

      {dayModal}
    </>
  )
}
