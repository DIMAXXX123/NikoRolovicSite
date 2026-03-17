'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, X } from 'lucide-react'
import type { Event } from '@/lib/types'

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [location, setLocation] = useState('')
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
    })

    setTitle(''); setDescription(''); setEventDate(''); setEventTime(''); setLocation('')
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
        <h1 className="text-2xl font-bold gradient-text">Događaji</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-xl">
          {showForm ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Novi</>}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 bg-card/50 animate-slide-up">
          <CardContent className="p-4">
            <form onSubmit={createEvent} className="space-y-3">
              <div className="space-y-2">
                <Label>Naslov</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Opis</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-background/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Vreme</Label>
                  <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="bg-background/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Lokacija</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="bg-background/50" placeholder="npr. Sala 101" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-violet-700">
                {loading ? 'Kreiranje...' : 'Kreiraj'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {events.map((event) => (
        <Card key={event.id} className="border-border/30 bg-card/50">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <h3 className="font-medium">{event.title}</h3>
              <p className="text-xs text-muted-foreground">{event.event_date} {event.event_time && `· ${event.event_time.slice(0,5)}`}</p>
            </div>
            <button onClick={() => deleteEvent(event.id)} className="text-destructive p-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
