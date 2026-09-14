'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, UserCheck, UserX, AlertTriangle, HelpCircle, RefreshCw, Plus, Trash2, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Status tints from the §4.3 palette: green / red / orange / blue / purple.
const STATUS_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  present: { label: 'Prisutan/na', icon: UserCheck, color: 'text-primary-text', bg: 'bg-primary-light border-primary-light-border' },
  absent: { label: 'Odsutan/na', icon: UserX, color: 'text-[#EA2B2B]', bg: 'bg-[#FFDFE0] border-[#FFB3B5]' },
  sick: { label: 'Boluje', icon: AlertTriangle, color: 'text-[color-mix(in_srgb,#FF9600_80%,black)]', bg: 'bg-[color-mix(in_srgb,#FF9600_18%,white)] border-[color-mix(in_srgb,#FF9600_45%,white)]' },
  asking: { label: 'Ispituje', icon: HelpCircle, color: 'text-secondary', bg: 'bg-secondary-light border-secondary-light-border' },
  zamjena: { label: 'Zamjena', icon: RefreshCw, color: 'text-accent-dark', bg: 'bg-[#F3E3FF] border-[#E1BDFF]' },
}

const STATUS_KEYS = Object.keys(STATUS_CONFIG)

// §4.8 chip
const CHIP_BASE = 'inline-flex h-11 items-center justify-center rounded-xl border-2 px-3.5 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,color,border-color] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60'
const CHIP_IDLE = 'border-border bg-background text-muted-foreground shadow-[0_2px_0_var(--color-border)]'

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

  useEffect(() => {
    async function init() {
      await Promise.all([loadProfile(), loadTeachers()])
    }
    init()
  }, [])

  async function loadStatuses() {
    const { data } = await supabase
      .from('teacher_statuses')
      .select('teacher_id, status')
      .eq('date', selectedDate)
    const map: Record<string, string> = {}
    if (data) data.forEach((s: { teacher_id: string; status: string }) => { map[s.teacher_id] = s.status })
    setStatuses(map)
  }

  useEffect(() => {
    if (teachers.length === 0) return
    async function init() { await loadStatuses() }
    init()
  }, [selectedDate, teachers])

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
    if (target.getTime() === yesterday.getTime()) return 'Juče'
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (target.getTime() === tomorrow.getTime()) return 'Sutra'
    return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short', weekday: 'short' })
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-fade-in">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl skeleton" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.01em] text-heading">Status profesora</h1>
        <p className="text-[13px] font-bold text-muted-foreground">Dnevni pregled prisutnosti</p>
      </div>

      {/* Date picker */}
      <div className="flex items-center justify-between gap-2">
        <Button size="icon" onClick={() => changeDate(-1)} aria-label="Prethodni dan">
          <ChevronLeft strokeWidth={2.6} />
        </Button>
        <span className="text-[17px] font-extrabold text-heading">{formatDate(selectedDate)}</span>
        <Button size="icon" onClick={() => changeDate(1)} aria-label="Sljedeći dan">
          <ChevronRight strokeWidth={2.6} />
        </Button>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-2">
        {STATUS_KEYS.map(key => {
          const cfg = STATUS_CONFIG[key]
          return (
            <Badge key={key} className={`${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </Badge>
          )
        })}
      </div>

      {/* Teachers list */}
      {teachers.length === 0 ? (
        <div className="flex h-[40vh] flex-col items-center justify-center animate-fade-in">
          <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-muted">
            <UserCheck className="size-8 text-disabled" strokeWidth={2.4} />
          </div>
          <p className="text-[17px] font-extrabold text-foreground">Nema profesora</p>
        </div>
      ) : (
        <div className="space-y-2.5 animate-stagger">
          {teachers.map(teacher => {
            const currentStatus = statuses[teacher.id] || 'present'
            const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.present
            const Icon = cfg.icon

            return (
              <Card key={teacher.id} className="gap-0 p-0">
                <CardContent className="px-4 py-3">
                  <div className="flex min-h-10 items-center gap-3">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 ${cfg.bg}`}>
                      <Icon className={`size-5 ${cfg.color}`} strokeWidth={2.4} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-extrabold leading-[1.3] text-heading">{teacher.name}</p>
                      {teacher.subject && (
                        <p className="text-[13px] font-bold text-muted-foreground">{teacher.subject}</p>
                      )}
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTeacher(teacher.id)}
                        className="text-disabled hover:text-destructive"
                        aria-label="Obriši profesora"
                      >
                        <Trash2 strokeWidth={2.4} />
                      </Button>
                    )}
                  </div>

                  {/* Status buttons (for mods/admins) */}
                  {canEdit && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {STATUS_KEYS.map(key => {
                        const s = STATUS_CONFIG[key]
                        const active = currentStatus === key
                        return (
                          <button
                            key={key}
                            onClick={() => setStatus(teacher.id, key)}
                            disabled={updating === teacher.id}
                            className={`${CHIP_BASE} ${
                              active ? `${s.bg} ${s.color} shadow-[0_2px_0_var(--color-border)]` : CHIP_IDLE
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
                    <div className="mt-3">
                      <Badge className={`${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
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
            <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full">
              <Plus strokeWidth={2.6} /> Dodaj profesora
            </Button>
          ) : (
            <Card className="gap-0 p-0">
              <CardContent className="space-y-3 p-4">
                <Input
                  placeholder="Ime i prezime"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
                <Input
                  placeholder="Predmet (opciono)"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">Otkaži</Button>
                  <Button onClick={addTeacher} disabled={!newName.trim()} className="flex-1">Dodaj</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
