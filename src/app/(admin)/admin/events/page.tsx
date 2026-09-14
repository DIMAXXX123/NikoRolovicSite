'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  test: 'bg-[#FFF4C4] text-[#C79000] border-[#FFE28A]',
  ispit: 'bg-[#FFDFE0] text-[#EA2B2B] border-[#FFB3B5]',
  dogadjaj: 'bg-[#F3E3FF] text-accent-dark border-[#E1BDFF]',
  domaci: 'bg-primary-light text-primary-text border-primary-light-border',
  pismeni: 'bg-[#FFDFE0] text-[#EA2B2B] border-[#FFB3B5]',
  drugo: 'bg-background text-muted-foreground border-border',
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

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
    if (data) setEvents(data)
  }

  useEffect(() => {
    async function init() { await loadEvents() }
    init()
  }, [])

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
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-2xl text-[13px] font-extrabold bg-card border-2 animate-slide-down ${
          toast.type === 'success'
            ? 'text-primary-text border-primary-light-border shadow-[0_2px_0_var(--color-primary-light-border)]'
            : 'text-[#EA2B2B] border-[#FFB3B5] shadow-[0_2px_0_#FFB3B5]'
        }`}>
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] leading-[1.2] tracking-[-0.01em] font-extrabold text-heading">Kalendar</h1>
        <Button
          size="sm"
          variant={showForm ? 'outline' : 'default'}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X strokeWidth={2.6} /> : <><Plus strokeWidth={2.6} />Novi</>}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] p-4 animate-slide-up">
          <form onSubmit={createEvent} className="space-y-4">
            <div>
              <Label>Naslov</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Tip događaja</Label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                className="flex h-[50px] w-full rounded-2xl border-2 border-border bg-muted px-4 text-[15px] font-bold text-foreground focus:border-secondary focus:bg-background focus:outline-none transition-colors"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Opis</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Vrijeme (opciono)</Label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Kreiranje...' : 'Kreiraj'}
            </Button>
          </form>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-8 h-8 text-disabled" strokeWidth={2.4} />
          </div>
          <p className="text-[17px] font-extrabold text-foreground">Nema događaja</p>
        </div>
      ) : (
        events.map((event, index) => (
          <div
            key={event.id}
            className="animate-stagger-item rounded-2xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] p-4 flex items-start justify-between gap-3"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[17px] leading-[1.3] font-extrabold text-heading">{event.title}</h3>
                {event.event_type && (
                  <span className={`inline-flex items-center h-6 text-[11px] leading-none font-extrabold uppercase tracking-[0.06em] px-2.5 rounded-full border-2 ${EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.drugo}`}>
                    {EVENT_TYPE_OPTIONS.find(o => o.value === event.event_type)?.label || event.event_type}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-bold text-muted-foreground">{event.event_date} {event.event_time && `· ${event.event_time.slice(0,5)}`}</p>
              {event.location && <p className="text-[13px] font-bold text-muted-foreground">{event.location}</p>}
            </div>
            <button onClick={() => deleteEvent(event.id)} className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-destructive hover:bg-[#FFDFE0] transition-colors">
              <Trash2 className="w-5 h-5" strokeWidth={2.4} />
            </button>
          </div>
        ))
      )}
    </div>
  )
}
