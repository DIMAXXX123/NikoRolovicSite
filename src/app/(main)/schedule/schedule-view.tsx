'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
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
  getSubjectBorderColor,
  type ScheduleData,
} from './schedule-data'

interface ScheduleViewProps {
  initialClassNum: number
  initialSectionNum: number
}

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

  // The class/section come pre-resolved from the server; only "today" has to be
  // decided in the browser, since the server clock is not the reader's clock.
  useEffect(() => {
    const today = new Date().getDay()
    setActiveDay(today >= 1 && today <= 5 ? today - 1 : 0)
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

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <BetaDisclaimer />

      {/* Header */}
      <div className="flex items-center justify-between pt-1" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '0ms', opacity: 0 }}>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Raspored</h1>
          <p className="text-xs text-[#6b6b80] mt-1">
            {classNum}. razred, {sectionNum}. odjeljenje · {todayClasses} časova
          </p>
        </div>
        <Button
          variant={editing ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setEditing(!editing); cancelEdit() }}
          className={`gap-1.5 rounded-xl ${editing ? 'bg-[#7c5cfc] hover:bg-[#6b4fe0] text-white border-0' : 'bg-white/[0.04] border-[#1a1a2e] hover:bg-white/[0.08]'}`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          {editing ? 'Gotovo' : 'Uredi'}
        </Button>
      </div>

      {/* Class/section selector */}
      <div className="rounded-2xl bg-[#0c0c14] border border-[#1a1a2e] p-4 space-y-3" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '60ms', opacity: 0 }}>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-[10px] text-[#6b6b80] font-medium uppercase tracking-wider mb-2 block">Razred</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setClassNum(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    classNum === n
                      ? 'bg-[#7c5cfc] text-white shadow-[0_0_16px_rgba(124,92,252,0.3)]'
                      : 'bg-white/[0.04] text-[#6b6b80] hover:bg-white/[0.08] hover:text-[#e8e8f0]'
                  }`}
                >
                  {n}.
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-[#6b6b80] font-medium uppercase tracking-wider mb-2 block">Odjeljenje</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setSectionNum(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    sectionNum === n
                      ? 'bg-[#7c5cfc] text-white shadow-[0_0_16px_rgba(124,92,252,0.3)]'
                      : 'bg-white/[0.04] text-[#6b6b80] hover:bg-white/[0.08] hover:text-[#e8e8f0]'
                  }`}
                >
                  {n}.
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Day selector pills */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '120ms', opacity: 0 }}>
        {DAY_SHORT.map((day, i) => {
          const isToday = new Date().getDay() === i + 1
          return (
            <button
              key={day}
              onClick={() => setActiveDay(i)}
              className={`flex-1 min-w-0 py-1.5 px-1.5 rounded-xl text-xs font-semibold transition-all duration-200 relative animate-press ${
                activeDay === i
                  ? 'bg-[#7c5cfc] text-white shadow-[0_0_16px_rgba(124,92,252,0.3)]'
                  : 'bg-white/[0.04] text-[#6b6b80] hover:bg-white/[0.08] hover:text-[#e8e8f0]'
              }`}
            >
              {day}
              {isToday && activeDay !== i && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7c5cfc]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Weekly overview grid */}
      <div className="rounded-2xl bg-[#0c0c14] border border-[#1a1a2e] overflow-hidden" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '180ms', opacity: 0 }}>
        <div className="px-4 py-3 border-b border-[#1a1a2e]">
          <h3 className="text-sm font-semibold text-[#e8e8f0]">Sedmični pregled</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a1a2e]">
                <th className="p-1.5 text-left text-[#6b6b80] font-medium w-8">#</th>
                {DAY_SHORT.map((d, di) => (
                  <th
                    key={d}
                    onClick={() => setActiveDay(di)}
                    className={`p-1.5 text-center font-medium cursor-pointer transition-colors ${
                      activeDay === di ? 'text-[#7c5cfc]' : 'text-[#6b6b80] hover:text-[#e8e8f0]'
                    }`}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period} className="border-b border-[#1a1a2e]/50">
                  <td className="p-1 text-[#6b6b80] font-medium text-[11px]">{period}</td>
                  {DAYS.map((_, di) => {
                    const subj = schedule[cellKey(di, period)] || ''
                    const color = getSubjectColor(subj)
                    return (
                      <td
                        key={di}
                        className={`p-1 cursor-pointer transition-colors ${activeDay === di ? 'bg-[#7c5cfc]/5' : ''}`}
                        onClick={() => { setActiveDay(di); if (editing) startEdit(di, period) }}
                      >
                        {subj ? (
                          <div className={`px-1.5 py-0.5 rounded-lg text-center truncate border text-[10px] ${color}`}>
                            {subj.length > 5 ? subj.slice(0, 5) + '.' : subj}
                          </div>
                        ) : (
                          <div className="text-center text-[#3d3d50]">·</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule for active day */}
      <div className="rounded-2xl bg-[#0c0c14] border border-[#1a1a2e] overflow-hidden" style={{ animation: 'fadeInUp 0.4s ease-out forwards', animationDelay: '240ms', opacity: 0 }}>
        <div className="px-5 py-4 border-b border-[#1a1a2e] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#e8e8f0]">{DAYS[activeDay]}</h3>
          <span className="text-xs text-[#6b6b80] px-2.5 py-1 rounded-lg bg-white/[0.04]">
            {todayClasses} časova
          </span>
        </div>
        <div className="divide-y divide-[#1a1a2e]/50 animate-stagger">
          {PERIODS.map((period) => {
            const key = cellKey(activeDay, period)
            const subject = schedule[key] || ''
            const isEditing = editCell === key
            const colorClass = getSubjectColor(subject)
            const borderColor = getSubjectBorderColor(subject)

            return (
              <div
                key={period}
                onClick={() => startEdit(activeDay, period)}
                className={`flex items-center gap-4 px-5 py-3.5 transition-all border-l-[3px] hover:bg-white/[0.02] ${
                  subject ? borderColor : 'border-l-transparent'
                } ${
                  editing ? 'cursor-pointer active:bg-white/[0.04]' : ''
                }`}
              >
                {/* Period number & time */}
                <div className="flex-shrink-0 w-14 text-center">
                  <div className="text-base font-bold text-[#e8e8f0]/90">{period}.</div>
                  <div className="flex items-center justify-center gap-0.5 text-[10px] text-[#3d3d50]">
                    <Clock className="w-2.5 h-2.5" />
                    {PERIOD_TIMES[period - 1].split(' - ')[0]}
                  </div>
                </div>

                {/* Divider line */}
                <div className="w-px h-10 bg-white/[0.06] flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        placeholder="Naziv predmeta..."
                        className="flex-1 bg-white/[0.04] rounded-xl px-3.5 py-2 text-sm outline-none border border-[#1a1a2e] focus:border-[#7c5cfc]/40 transition-colors"
                      />
                      <button onClick={confirmEdit} className="p-2 rounded-xl bg-[#7c5cfc]/15 text-[#7c5cfc] hover:bg-[#7c5cfc]/25 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors">
                        <X className="w-4 h-4 text-[#6b6b80]" />
                      </button>
                    </div>
                  ) : subject ? (
                    <div className={`inline-block px-4 py-1.5 rounded-xl text-sm font-medium border backdrop-blur-sm ${colorClass}`}>
                      {subject}
                    </div>
                  ) : (
                    <div className="text-sm text-[#3d3d50] italic flex items-center gap-2 animate-fade-in">
                      {editing ? (
                        'Dodaj predmet...'
                      ) : (
                        <>
                          <div className="w-6 h-[2px] rounded-full bg-[#1a1a2e]" />
                          <span className="text-[#3d3d50]">Slobodan čas</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
