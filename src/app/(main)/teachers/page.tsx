'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, UserCheck, UserX, AlertTriangle, HelpCircle, Coffee, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  present: { label: 'Prisutan/na', icon: UserCheck, color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
  absent: { label: 'Odsutan/na', icon: UserX, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  sick: { label: 'Boluje', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  asking: { label: 'Ispituje', icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
  zamjena: { label: 'Zamjena', icon: Coffee, color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30' },
}

const STATUS_KEYS = Object.keys(STATUS_CONFIG)

type Teacher = { id: string; name: string; subject: string | null }
type TeacherStatus = { id: string; teacher_id: string; date: string; status: string }
type Profile = { id: string; role: string }

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  const canEdit = profile && ['admin', 'creator', 'moderator'].includes(profile.role)

  useEffect(() => {
    loadProfile()
    loadTeachers()
  }, [])

  useEffect(() => {
    if (teachers.length > 0) loadStatuses()
  }, [selectedDate, teachers])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
      if (data) setProfile(data)
    }
  }

  async function loadTeachers() {
    const { data } = await supabase.from('teachers').select('*').order('name')
    if (data) setTeachers(data)
    setLoading(false)
  }

  async function loadStatuses() {
    const { data } = await supabase
      .from('teacher_statuses')
      .select('teacher_id, status')
      .eq('date', selectedDate)
    const map: Record<string, string> = {}
    if (data) data.forEach((s: any) => { map[s.teacher_id] = s.status })
    setStatuses(map)
  }

  async function setStatus(teacherId: string, status: string) {
    if (!canEdit) return
    setUpdating(teacherId)

    // Optimistic
    setStatuses(prev => ({ ...prev, [teacherId]: status }))

    const { error } = await supabase
      .from('teacher_statuses')
      .upsert(
        { teacher_id: teacherId, date: selectedDate, status, updated_by: profile!.id },
        { onConflict: 'teacher_id,date' }
      )

    if (error) {
      // Revert
      loadStatuses()
    }
    setUpdating(null)
  }

  async function addTeacher() {
    if (!newName.trim()) return
    const { error } = await supabase.from('teachers').insert({
      name: newName.trim(),
      subject: newSubject.trim() || null,
    })
    if (!error) {
      setNewName('')
      setNewSubject('')
      setShowAdd(false)
      loadTeachers()
    }
  }

  async function deleteTeacher(id: string) {
    await supabase.from('teachers').delete().eq('id', id)
    loadTeachers()
  }

  function changeDate(days: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr + 'T00:00:00')
    if (target.getTime() === today.getTime()) return 'Danas'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (target.getTime() === yesterday.getTime()) return 'Ju─ìe'
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (target.getTime() === tomorrow.getTime()) return 'Sutra'
    return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short', weekday: 'short' })
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-muted/30 animate-shimmer" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold gradient-text">Status profesora</h1>
        <p className="text-xs text-muted-foreground">Dnevni pregled prisutnosti</p>
      </div>

      {/* Date picker */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-xl hover:bg-muted transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold">{formatDate(selectedDate)}</span>
        <button onClick={() => changeDate(1)} className="p-2 rounded-xl hover:bg-muted transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-2">
        {STATUS_KEYS.map(key => {
          const cfg = STATUS_CONFIG[key]
          return (
            <span key={key} className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
          )
        })}
      </div>

      {/* Teachers list */}
      {teachers.length === 0 ? (
        <div className="h-[40vh] flex flex-col items-center justify-center text-muted-foreground">
          <UserCheck className="w-12 h-12 mb-3 opacity-30" />
          <p>Nema profesora</p>
        </div>
      ) : (
        <div className="space-y-2">
          {teachers.map(teacher => {
            const currentStatus = statuses[teacher.id] || 'present'
            const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.present
            const Icon = cfg.icon

            return (
              <Card key={teacher.id} className={`border ${cfg.bg} transition-all`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg}`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{teacher.name}</p>
                      {teacher.subject && (
                        <p className="text-xs text-muted-foreground">{teacher.subject}</p>
                      )}
                    </div>
                    {canEdit && (
                      <button onClick={() => deleteTeacher(teacher.id)} className="p-1 text-muted-foreground/30 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status buttons (for mods/admins) */}
                  {canEdit && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {STATUS_KEYS.map(key => {
                        const s = STATUS_CONFIG[key]
                        const active = currentStatus === key
                        return (
                          <button
                            key={key}
                            onClick={() => setStatus(teacher.id, key)}
                            disabled={updating === teacher.id}
                            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                              active ? `${s.bg} ${s.color} font-semibold` : 'border-border/30 text-muted-foreground hover:border-border'
                            }`}
                          >
                            {s.label}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Status display (for students) */}
                  {!canEdit && (
                    <div className="mt-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add teacher (admin only) */}
      {canEdit && (
        <div className="space-y-2">
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-3 rounded-2xl border border-dashed border-border/50 text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary transition-all"
            >
              <Plus className="w-4 h-4" /> Dodaj profesora
            </button>
          ) : (
            <Card className="border-border/30 bg-card/50 backdrop-blur">
              <CardContent className="p-4 space-y-3">
                <Input
                  placeholder="Ime i prezime"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="bg-background/50 rounded-xl"
                />
                <Input
                  placeholder="Predmet (opciono)"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="bg-background/50 rounded-xl"
                />
                <div className="flex gap-2">
                  <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1 rounded-xl">Otka┼╛i</Button>
                  <Button onClick={addTeacher} disabled={!newName.trim()} className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700">Dodaj</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
