'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, X, Calendar } from 'lucide-react'
import type { Event, EventType } from '@/lib/types'

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'test', label: 'Test' },
  { value: 'ispit', label: 'Ispit' },
  { value: 'dogadjaj', label: 'Događaj' },
  { value: 'drugo', label: 'Drugo' },
]

const EVENT_TYPE_COLORS: Record<string, string> = {
  test: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  ispit: 'bg-red-500/20 text-red-300 border-red-500/30',
  dogadjaj: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  drugo: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [location, setLocation] = useState('')
  const [eventType, setEventType] = useState<EventType>('dogadjaj')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
    if (data) setEvents(data)
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('events').insert({
      title, description: description || null,
      event_date: eventDate, event_time: eventTime || null,
      location: location || null, author_id: user.id,
      event_type: eventType,
    })

    setTitle(''); setDescription(''); setEventDate(''); setEventTime(''); setLocation(''); setEventType('dogadjaj')
    setShowForm(false); setLoading(false); loadEvents()
  }

  async function deleteEvent(id: string) {
    if (!confirm('Obriši ovaj događaj?')) return
    await supabase.from('events').delete().eq('id', id)
    loadEvents()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Kalendar</h1>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
        >
          {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Novi</>}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-[#1e293b] border border-blue-500/30 p-4 animate-slide-up">
          <form onSubmit={createEvent} className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-200">Naslov</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Tip događaja</Label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="flex h-11 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Opis</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex min-h-[80px] w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-200">Datum</Label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="rounded-xl bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Vrijeme</Label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="rounded-xl bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Lokacija</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                placeholder="npr. Sala 101"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl"
            >
              {loading ? 'Kreiranje...' : 'Kreiraj'}
            </Button>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nema događaja</p>
        </div>
      ) : (
        events.map((event) => (
          <div key={event.id} className="rounded-xl bg-[#1e293b] border border-slate-700/50 p-4 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-white">{event.title}</h3>
                {event.event_type && (
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.drugo}`}>
                    {EVENT_TYPE_OPTIONS.find(o => o.value === event.event_type)?.label || event.event_type}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{event.event_date} {event.event_time && `· ${event.event_time.slice(0,5)}`}</p>
              {event.location && <p className="text-xs text-slate-500">{event.location}</p>}
            </div>
            <button onClick={() => deleteEvent(event.id)} className="text-red-400 p-2 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  )
}
