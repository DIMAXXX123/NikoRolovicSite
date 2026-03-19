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
  { value: 'domaci', label: 'Domaći zadatak' },
  { value: 'pismeni', label: 'Pismeni rad' },
  { value: 'drugo', label: 'Drugo' },
]

const EVENT_TYPE_COLORS: Record<string, string> = {
  test: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  ispit: 'bg-red-500/20 text-red-300 border-red-500/30',
  dogadjaj: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  domaci: 'bg-green-500/20 text-green-300 border-green-500/30',
  pismeni: 'bg-red-500/20 text-red-300 border-red-500/30',
  drugo: 'bg-white/10 text-white/50 border-white/[0.08]',
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventType, setEventType] = useState<EventType>('dogadjaj')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const supabase = createClient()

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
    if (data) setEvents(data)
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase.from('events').insert({
      title, description: description || null,
      event_date: eventDate, event_time: eventTime || null,
      author_id: user.id,
      event_type: eventType,
    }).select()

    if (error) {
      console.error('Create event error:', error)
      showToast(`Greška pri kreiranju: ${error.message}`, 'error')
      setLoading(false)
      return
    }

    showToast('Događaj kreiran!')
    setTitle(''); setDescription(''); setEventDate(''); setEventTime(''); setEventType('dogadjaj')
    setShowForm(false); setLoading(false); loadEvents()
  }

  // NOTE: Delete requires RLS policy "Admins delete events" (role = 'admin').
  // If moderators/creators also need delete access, add them to the RLS policy.
  async function deleteEvent(id: string) {
    if (!confirm('Obriši ovaj događaj?')) return
    const { data, error } = await supabase.from('events').delete().eq('id', id).select()
    if (error) {
      console.error('Delete event error:', error)
      showToast(`Greška pri brisanju: ${error.message}`, 'error')
      return
    }
    if (!data || data.length === 0) {
      console.error('Delete event: no rows deleted, check RLS policies')
      showToast('Greška: nema dozvole za brisanje (RLS)', 'error')
      return
    }
    showToast('Obrisano!')
    loadEvents()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-lg backdrop-blur-sm animate-slide-down border ${
          toast.type === 'success'
            ? 'bg-green-500/90 text-white border-green-400/30'
            : 'bg-red-500/90 text-white border-red-400/30'
        }`}>
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Kalendar</h1>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Novi</>}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-purple-500/20 p-5 animate-slide-up">
          <form onSubmit={createEvent} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Naslov</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Tip događaja</Label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="flex h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-colors"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1a1f35] text-white">{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Opis</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex min-h-[80px] w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Datum</Label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="rounded-xl bg-white/[0.04] border-white/[0.08] text-white focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70 text-sm">Vrijeme (opciono)</Label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="rounded-xl bg-white/[0.04] border-white/[0.08] text-white focus:border-purple-500 focus:ring-purple-500/20"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl shadow-lg shadow-purple-500/20"
            >
              {loading ? 'Kreiranje...' : 'Kreiraj'}
            </Button>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nema događaja</p>
        </div>
      ) : (
        events.map((event, index) => (
          <div
            key={event.id}
            className="animate-stagger-item rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] p-4 flex items-start justify-between hover:-translate-y-[2px] hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/20 transition-all duration-300 group"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors">{event.title}</h3>
                {event.event_type && (
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.drugo}`}>
                    {EVENT_TYPE_OPTIONS.find(o => o.value === event.event_type)?.label || event.event_type}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40">{event.event_date} {event.event_time && `· ${event.event_time.slice(0,5)}`}</p>
              {event.location && <p className="text-xs text-white/25">{event.location}</p>}
            </div>
            <button onClick={() => deleteEvent(event.id)} className="text-red-400/60 p-2 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  )
}
