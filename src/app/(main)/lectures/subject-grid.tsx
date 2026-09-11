'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { SubjectIcon } from './subject-icon'
import { DEFAULT_SUBJECTS, OPTIONAL_SUBJECTS } from './subjects'
import { useLocalJson, writeLocalJson } from '@/lib/local-json'

const EXTRA_SUBJECTS_KEY = 'extra_subjects'
const NO_EXTRA_SUBJECTS: string[] = []

function subjectHref(name: string) {
  return `/lectures/${encodeURIComponent(name)}`
}

/**
 * The subject tiles. Only the "extra subjects" picker needs the browser, so
 * the optional list starts empty and fills in after hydration.
 */
export function SubjectGrid() {
  const extraSubjects = useLocalJson(EXTRA_SUBJECTS_KEY, NO_EXTRA_SUBJECTS)
  const [showAddSubject, setShowAddSubject] = useState(false)

  function persist(updated: string[]) {
    writeLocalJson(EXTRA_SUBJECTS_KEY, updated)
  }

  const allSubjects = [
    ...DEFAULT_SUBJECTS,
    ...OPTIONAL_SUBJECTS.filter((s) => extraSubjects.includes(s.name)),
  ]
  const availableOptional = OPTIONAL_SUBJECTS.filter((s) => !extraSubjects.includes(s.name))

  return (
    <>
      <div className="grid grid-cols-2 gap-3 animate-stagger-scale">
        {allSubjects.map((subject) => (
          <Link
            key={subject.name}
            href={subjectHref(subject.name)}
            className="relative rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] cursor-pointer hover:bg-white/[0.05] hover:border-[#7c5cfc]/20 transition-all duration-300 active:scale-[0.96] overflow-hidden group p-5 flex flex-col items-center text-center gap-3 hover-float"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#7c5cfc]/[0.03] to-[#5b3fd9]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative transition-transform duration-300 group-hover:scale-110">
              <SubjectIcon name={subject.name} emoji={subject.emoji} size="lg" />
            </div>
            <h3 className="relative font-semibold text-sm">{subject.name}</h3>
          </Link>
        ))}
      </div>

      {availableOptional.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setShowAddSubject(!showAddSubject)
              if (!showAddSubject) {
                setTimeout(() => {
                  document
                    .getElementById('add-subject-list')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }
            }}
            className="w-full py-3.5 rounded-2xl border border-dashed border-white/[0.08] text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-[#7c5cfc]/30 hover:text-[#7c5cfc] transition-all active:scale-[0.98] animate-press"
          >
            <Plus className="w-4 h-4" />
            Dodaj predmet
          </button>

          {showAddSubject && (
            <div id="add-subject-list" className="space-y-2 animate-fade-in">
              {availableOptional.map((subject) => (
                <button
                  key={subject.name}
                  className="w-full rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] cursor-pointer hover:bg-white/[0.04] transition-all active:scale-[0.98] p-3.5 flex items-center gap-3"
                  onClick={() => {
                    persist([...extraSubjects, subject.name])
                    setShowAddSubject(false)
                  }}
                >
                  <SubjectIcon name={subject.name} emoji={subject.emoji} size="sm" />
                  <span className="text-sm font-semibold">{subject.name}</span>
                  <Plus className="w-4 h-4 text-[#7c5cfc] ml-auto" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {extraSubjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {extraSubjects.map((name) => (
            <button
              key={name}
              onClick={() => persist(extraSubjects.filter((s) => s !== name))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-muted-foreground hover:text-red-400 hover:border-red-500/20 transition-all"
            >
              {name}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </>
  )
}
