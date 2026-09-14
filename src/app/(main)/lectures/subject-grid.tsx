'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
            className="rounded-2xl border-2 border-border bg-card p-4 shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none flex flex-col items-center text-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <SubjectIcon name={subject.name} emoji={subject.emoji} size="lg" />
            <h3 className="text-[15px] font-extrabold leading-[1.3] text-heading">{subject.name}</h3>
          </Link>
        ))}
      </div>

      {availableOptional.length > 0 && (
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
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
          >
            <Plus strokeWidth={2.6} />
            Dodaj predmet
          </Button>

          {showAddSubject && (
            <div id="add-subject-list" className="space-y-2.5 animate-fade-in">
              {availableOptional.map((subject) => (
                <button
                  key={subject.name}
                  className="w-full min-h-16 px-4 py-3 rounded-2xl border-2 border-border bg-card shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] active:translate-y-[2px] active:shadow-none flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  onClick={() => {
                    persist([...extraSubjects, subject.name])
                    setShowAddSubject(false)
                  }}
                >
                  <SubjectIcon name={subject.name} emoji={subject.emoji} size="sm" />
                  <span className="text-[17px] font-extrabold leading-[1.3] text-heading">
                    {subject.name}
                  </span>
                  <Plus className="w-5 h-5 text-secondary ml-auto shrink-0" strokeWidth={2.6} />
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
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border-2 border-border bg-background text-[12px] font-extrabold uppercase tracking-[0.04em] text-muted-foreground shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow,color,border-color] duration-[80ms] hover:text-destructive hover:border-[#FFB3B5] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {name}
              <X className="w-3.5 h-3.5" strokeWidth={2.6} />
            </button>
          ))}
        </div>
      )}
    </>
  )
}
