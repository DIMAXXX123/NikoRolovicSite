'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Clock, Edit3, Check, X } from 'lucide-react'
import { BetaDisclaimer } from '@/components/beta-disclaimer'
import {
  DAYS,
  DAY_SHORT,
  PERIODS,
  PERIOD_TIMES,
  DEFAULT_SCHEDULES,
  getStorageKey,
  getSubjectColor,
  type ScheduleData,
} from './schedule-data'

interface ScheduleViewProps {
  initialClassNum: number
  initialSectionNum: number
}

// §4.8 chip — selected = blue tint, otherwise white with a grey 3D edge.
const CHIP_BASE =
  'inline-flex h-10 items-center justify-center rounded-xl border-2 px-2 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-[transform,box-shadow,background-color,color,border-color] duration-[80ms] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const CHIP_IDLE = 'bg-background border-border text-muted-foreground shadow-[0_2px_0_var(--color-border)] hover:text-foreground'
const CHIP_ACTIVE =
  'bg-secondary-light border-secondary-light-border text-secondary shadow-[0_2px_0_var(--color-secondary-light-border)]'

export function ScheduleView({ initialClassNum, initialSectionNum }: ScheduleViewProps) {
  const [classNum, setClassNum] = useState(initialClassNum)
  const [sectionNum, setSectionNum] = useState(initialSectionNum)
  // Seeded with the built-in timetable so the server can render a filled grid;
  // a locally edited copy replaces it right after hydration.
  const [schedule, setSchedule] = useState<ScheduleData>(
    () => DEFAULT_SCHEDULES[getStorageKey(initialClassNum, initialSectionNum)] ?? {}
  )
  const [editing, setEditing] = useState(false)
  const [editCell, setEditCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [activeDay, setActiveDay] = useState(0)
  // Period that is running right now (1-based), for the green row tint. Only
  // known in the browser, for the same reason as `activeDay`.
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null)

  // The class/section come pre-resolved from the server; only "today" has to be
  // decided in the browser, since the server clock is not the reader's clock.
  useEffect(() => {
    const now = new Date()
    const today = now.getDay()
    setActiveDay(today >= 1 && today <= 5 ? today - 1 : 0)
    const minutes = now.getHours() * 60 + now.getMinutes()
    const idx = PERIOD_TIMES.findIndex((range) => {
      const [from, to] = range.split(' - ').map((t) => {
        const [h, m] = t.split(':').map(Number)
        return h * 60 + m
      })
      return minutes >= from && minutes <= to
    })
    setCurrentPeriod(idx >= 0 && today >= 1 && today <= 5 ? idx + 1 : null)
  }, [])

  const loadSchedule = useCallback(() => {
    const key = getStorageKey(classNum, sectionNum)
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setSchedule(JSON.parse(saved))
      } catch {
        setSchedule({})
      }
    } else if (DEFAULT_SCHEDULES[key]) {
      setSchedule(DEFAULT_SCHEDULES[key])
      localStorage.setItem(key, JSON.stringify(DEFAULT_SCHEDULES[key]))
    } else {
      setSchedule({})
    }
  }, [classNum, sectionNum])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  function saveSchedule(data: ScheduleData) {
    const key = getStorageKey(classNum, sectionNum)
    localStorage.setItem(key, JSON.stringify(data))
  }

  function cellKey(day: number, period: number) {
    return `${day}-${period}`
  }

  function startEdit(day: number, period: number) {
    if (!editing) return
    const key = cellKey(day, period)
    setEditCell(key)
    setEditValue(schedule[key] || '')
  }

  function confirmEdit() {
    if (!editCell) return
    const updated = { ...schedule }
    if (editValue.trim()) {
      updated[editCell] = editValue.trim()
    } else {
      delete updated[editCell]
    }
    setSchedule(updated)
    saveSchedule(updated)
    setEditCell(null)
    setEditValue('')
  }

  function cancelEdit() {
    setEditCell(null)
    setEditValue('')
  }

  // Count classes for today
  const todayClasses = PERIODS.filter(p => schedule[cellKey(activeDay, p)]).length

  // The day shown in the list is today only when it matches the real weekday.
  const todayIndex = new Date().getDay() - 1
  const isPeriodNow = (period: number) => currentPeriod === period && activeDay === todayIndex

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <BetaDisclaimer />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 pt-1" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '0ms', opacity: 0 }}>
        <div className="min-w-0">
          <h1 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading">Raspored</h1>
          <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground mt-1">
            {classNum}. razred, {sectionNum}. odjeljenje · {todayClasses} časova
          </p>
        </div>
        <Button
          variant={editing ? 'default' : 'outline'}
          onClick={() => { setEditing(!editing); cancelEdit() }}
          className="shrink-0"
        >
          <Edit3 strokeWidth={2.6} />
          {editing ? 'Gotovo' : 'Uredi'}
        </Button>
      </div>

      {/* Class/section selector */}
      <Card className="gap-4" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '60ms', opacity: 0 }}>
        <div className="space-y-4">
          <div>
            <label className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground mb-1.5 block">Razred</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setClassNum(n)}
                  className={`flex-1 min-w-0 ${CHIP_BASE} ${classNum === n ? CHIP_ACTIVE : CHIP_IDLE}`}
                >
                  {n}.
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground mb-1.5 block">Odjeljenje</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSectionNum(n)}
                  className={`flex-1 min-w-0 ${CHIP_BASE} ${sectionNum === n ? CHIP_ACTIVE : CHIP_IDLE}`}
                >
                  {n}.
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Day selector pills */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '120ms', opacity: 0 }}>
        {DAY_SHORT.map((day, i) => {
          const isToday = new Date().getDay() === i + 1
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(i)}
              className={`flex-1 min-w-0 relative ${CHIP_BASE} ${activeDay === i ? CHIP_ACTIVE : CHIP_IDLE}`}
            >
              {day}
              {isToday && activeDay !== i && (
                <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>

      {/* Weekly overview grid */}
      <Card className="gap-0 p-0" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '180ms', opacity: 0 }}>
        <div className="px-4 py-3 border-b-2 border-border">
          <h3 className="text-[17px] leading-[1.3] font-extrabold text-heading">Sedmični pregled</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] font-bold">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="px-1.5 py-2.5 text-left text-muted-foreground font-extrabold w-8">#</th>
                {DAY_SHORT.map((d, di) => (
                  <th
                    key={d}
                    onClick={() => setActiveDay(di)}
                    className={`px-1 py-2.5 text-center font-extrabold uppercase tracking-[0.04em] cursor-pointer transition-colors ${
                      activeDay === di ? 'text-secondary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr
                  key={period}
                  className={`border-b-2 border-border last:border-b-0 ${
                    currentPeriod === period ? 'bg-[#F4FFEA]' : ''
                  }`}
                >
                  <td className="p-1.5 text-muted-foreground font-extrabold text-[12px] tabular-nums">{period}</td>
                  {DAYS.map((_, di) => {
                    const subj = schedule[cellKey(di, period)] || ''
                    const color = getSubjectColor(subj)
                    return (
                      <td
                        key={di}
                        className={`p-1.5 cursor-pointer transition-colors ${activeDay === di ? 'bg-secondary-light/50' : ''}`}
                        onClick={() => { setActiveDay(di); if (editing) startEdit(di, period) }}
                      >
                        {subj ? (
                          <div className={`px-1 py-1.5 rounded-lg text-center truncate border-2 text-[11px] leading-[1.2] font-extrabold ${color}`}>
                            {subj.length > 5 ? subj.slice(0, 5) + '.' : subj}
                          </div>
                        ) : (
                          <div className="text-center text-disabled">·</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Schedule for active day */}
      <Card className="gap-0 p-0" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '240ms', opacity: 0 }}>
        <div className="px-4 py-3 border-b-2 border-border flex items-center justify-between">
          <h3 className="text-[20px] leading-[1.25] font-extrabold text-heading">{DAYS[activeDay]}</h3>
          <Badge variant="outline">
            {todayClasses} časova
          </Badge>
        </div>
        <div className="divide-y-2 divide-border animate-stagger">
          {PERIODS.map((period) => {
            const key = cellKey(activeDay, period)
            const subject = schedule[key] || ''
            const isEditing = editCell === key
            const colorClass = getSubjectColor(subject)

            return (
              <div
                key={period}
                onClick={() => startEdit(activeDay, period)}
                className={`flex items-center gap-3 min-h-16 px-4 py-3 transition-colors ${
                  isPeriodNow(period) ? 'bg-[#F4FFEA]' : ''
                } ${
                  editing ? 'cursor-pointer hover:bg-muted active:bg-muted' : ''
                }`}
              >
                {/* Leading circle (§4.10): period number on the subject tint */}
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-[17px] font-extrabold tabular-nums ${
                    subject ? colorClass : 'border-border bg-muted text-muted-foreground'
                  }`}
                >
                  {period}
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <Input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        placeholder="Naziv predmeta..."
                        className="flex-1 h-11"
                      />
                      <Button size="icon" variant="default" onClick={confirmEdit} aria-label="Sačuvaj">
                        <Check strokeWidth={2.6} />
                      </Button>
                      <Button size="icon" onClick={cancelEdit} aria-label="Otkaži">
                        <X className="text-muted-foreground" strokeWidth={2.6} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p
                        className={`truncate text-[17px] leading-[1.3] font-extrabold ${
                          subject ? 'text-heading' : editing ? 'text-disabled' : 'text-muted-foreground'
                        }`}
                      >
                        {subject || (editing ? 'Dodaj predmet...' : 'Slobodan čas')}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[13px] leading-[1.4] font-bold text-muted-foreground tabular-nums">
                        <Clock className="size-3.5" strokeWidth={2.4} />
                        {PERIOD_TIMES[period - 1]}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
