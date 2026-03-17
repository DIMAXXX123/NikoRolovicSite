'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, Plus, X, List, CalendarDays } from 'lucide-react'
import type { Event, EventType, Profile } from '@/lib/types'

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  test: { label: 'Test', color: 'bg-blue-500/20 text-blue-400', dotColor: 'bg-blue-500' },
  ispit: { label: 'Ispit', color: 'bg-orange-500/20 text-orange-400', dotColor: 'bg-orange-500' },
  dogadjaj: { label: 'Događaj', color: 'bg-purple-500/20 text-purple-400', dotColor: 'bg-purple-500' },
  drugo: { label: 'Drugo', color: 'bg-green-500/20 text-green-400', dotColor: 'bg-green-500' },
}

const DAY_NAMES = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']
const MONTH_NAMES = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', description: '', event_time: '', location: '', event_type: 'test' as EventType })
  const [addingForDay, setAddingForDay] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadMonthEvents()
  }, [currentMonth, currentYear])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profileData) setProfile(profileData)
    }

    // Load upcoming for list view
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
    if (data) setEvents(data)
    setLoading(false)
  }

  async function loadMonthEvents() {
    const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
    const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${getDaysInMonth(currentYear, currentMonth)}`
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true })
    if (data) setAllEvents(data)
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'creator'

  const eventsByDay = useMemo(() => {
    const map: Record<number, Event[]> = {}
    allEvents.forEach(event => {
      const day = new Date(event.event_date + 'T00:00:00').getDate()
      if (!map[day]) map[day] = []
      map[day].push(event)
    })
    return map
  }, [allEvents])

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

  function getEventDotColor(event: Event): string {
    const type = event.event_type || 'drugo'
    return EVENT_TYPE_CONFIG[type]?.dotColor || 'bg-green-500'
  }

  async function handleAddEvent() {
    if (!addingForDay || !newEvent.title.trim()) return
    const eventDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(addingForDay).padStart(2, '0')}`

    const insertData: Record<string, unknown> = {
      title: newEvent.title,
      description: newEvent.description || null,
      event_date: eventDate,
      event_time: newEvent.event_time || null,
      location: newEvent.location || null,
    }

    // Try adding event_type - gracefully handle if column doesn't exist
    try {
      const { error } = await supabase
        .from('events')
        .insert({ ...insertData, event_type: newEvent.event_type })
      if (error && error.message?.includes('event_type')) {
        // Column doesn't exist, insert without it
        await supabase.from('events').insert(insertData)
      }
    } catch {
      await supabase.from('events').insert(insertData)
    }

    setShowAddEvent(false)
    setAddingForDay(null)
    setNewEvent({ title: '', description: '', event_time: '', location: '', event_type: 'test' })
    loadMonthEvents()
    loadData()
  }

  const today = new Date()
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth)

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold gradient-text tracking-tight">Kalendar</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  // ========== DAY DETAIL MODAL ==========
  const dayModal = selectedDay !== null && (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setSelectedDay(null); setShowAddEvent(false) }}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-background border-t border-border/50 rounded-t-3xl p-5 pb-24 animate-slide-up max-h-[60vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {selectedDay}. {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
          <button onClick={() => { setSelectedDay(null); setShowAddEvent(false) }} className="p-1">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Admin add event - top of modal */}
        {isAdmin && !showAddEvent && (
          <button
            onClick={() => { setAddingForDay(selectedDay); setShowAddEvent(true) }}
            className="w-full mb-4 py-3 rounded-2xl border border-dashed border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Dodaj događaj
          </button>
        )}

        {showAddEvent && (
          <div className="mb-4 space-y-3 animate-fade-in">
            <input
              type="text"
              placeholder="Naziv događaja"
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="text"
              placeholder="Opis (opciono)"
              value={newEvent.description}
              onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                value={newEvent.event_time}
                onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })}
                className="px-4 py-3 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Lokacija"
                value={newEvent.location}
                onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                className="px-4 py-3 rounded-xl bg-muted border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            {/* Type selector */}
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(EVENT_TYPE_CONFIG) as [string, { label: string; color: string }][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setNewEvent({ ...newEvent, event_type: key as EventType })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    newEvent.event_type === key
                      ? config.color + ' ring-2 ring-primary/50'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddEvent}
              disabled={!newEvent.title.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-40"
            >
              Sačuvaj
            </button>
          </div>
        )}

        {eventsByDay[selectedDay] && eventsByDay[selectedDay].length > 0 ? (
          <div className="space-y-3">
            {eventsByDay[selectedDay].map((event) => {
              const type = event.event_type || 'drugo'
              const config = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.drugo
              return (
                <Card key={event.id} className="border-border/30 bg-card/50 backdrop-blur">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${config.color} border-0`}>{config.label}</Badge>
                      <h3 className="font-semibold text-sm">{event.title}</h3>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {event.event_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTime(event.event_time)}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Nema događaja za ovaj dan</p>
        )}

      </div>
    </div>
  )

  const dayColors = [
    'from-purple-500 to-violet-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-green-600',
    'from-orange-500 to-amber-600',
    'from-pink-500 to-rose-600',
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text tracking-tight">Kalendar</h1>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setView('calendar')}
            className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 ${
              view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            <CalendarDays className="w-3 h-3" /> Kalendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 ${
              view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            <List className="w-3 h-3" /> Lista
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="space-y-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted transition-all active:scale-95">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted transition-all active:scale-95">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayEvents = eventsByDay[day] || []
              const hasEvents = dayEvents.length > 0
              const isTodayCell = isToday(day)

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm transition-all active:scale-90 relative ${
                    isTodayCell
                      ? 'bg-primary text-primary-foreground font-bold'
                      : selectedDay === day
                        ? 'bg-muted ring-2 ring-primary/50'
                        : 'hover:bg-muted/50'
                  }`}
                >
                  <span className={isTodayCell ? 'font-bold' : ''}>{day}</span>
                  {hasEvents && (
                    <div className="flex gap-0.5 absolute bottom-1">
                      {dayEvents.slice(0, 3).map((event, ei) => (
                        <div
                          key={ei}
                          className={`w-1.5 h-1.5 rounded-full ${getEventDotColor(event)}`}
                        />
                      ))}
                    </div>
                  )}
                  {/* Admin add button on hover */}
                  {isAdmin && !hasEvents && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-2">
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                {config.label}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        events.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nema predstojećih događaja</p>
          </div>
        ) : (
          <div className="space-y-3 animate-stagger">
            {events.map((event, index) => {
              const type = event.event_type || 'drugo'
              const config = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.drugo
              return (
                <Card key={event.id} className="border-border/30 bg-card/50 backdrop-blur animate-slide-up card-hover overflow-hidden gradient-overlay glow-hover" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardContent className="p-0">
                    <div className="flex">
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
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] ${config.color} border-0`}>{config.label}</Badge>
                        </div>
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
              )
            })}
          </div>
        )
      )}

      {dayModal}
    </div>
  )
}
