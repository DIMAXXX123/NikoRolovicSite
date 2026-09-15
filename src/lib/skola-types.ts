/**
 * Shapes behind the Škola panel: skola_stats() (supabase/migrations/
 * 20260916000100_skola_data.sql) composed with the quiz part of
 * direktor_stats by GET /api/skola/stats.
 *
 * Grades are the Montenegrin 1–5 scale. `null` on a group aggregate means the
 * group is below k_min pupils (k-anonymity); such rows carry k_hidden: true.
 */

import type { Learning } from './direktor-types'

export type SkolaPeriod = '7d' | '30d' | 'semester' | 'year' | 'prev_year'
export const SKOLA_PERIODS: readonly SkolaPeriod[] = ['30d', 'semester', 'year', 'prev_year']

export interface SkolaMeta {
  period: SkolaPeriod
  from: string
  to: string
  prev_from: string
  prev_to: string
  class: number | null
  section: number | null
  subject: string | null
  generated_at: string
  k_min: number
  verified_total: number
  students_with_grades: number
  ednevnik_students: number
  manual_rows: number
  /** Share (0–100) of grade rows in the period that come from the demo seed. */
  seed_share: number
  last_sync_at: string | null
}

export interface SubjectGrades {
  subject: string
  n: number
  students: number
  k_hidden: boolean
  avg: number | null
  prev_avg: number | null
  low_share_pct: number | null
  /** Counts of grades 1..5. */
  dist: [number, number, number, number, number] | null
}

export interface SectionGrades {
  class_number: number
  section_number: number
  n: number
  students: number
  roster: number
  k_hidden: boolean
  coverage_pct: number | null
  avg: number | null
  prev_avg: number | null
  low_share_pct: number | null
}

export interface ClassGrades {
  class_number: number
  n: number
  students: number
  roster: number
  coverage_pct: number | null
  avg: number | null
  prev_avg: number | null
}

export interface Grades {
  avg: number | null
  prev_avg: number | null
  n: number
  students: number
  low_share_pct: number | null
  dist: [number, number, number, number, number]
  by_subject: SubjectGrades[]
  by_class: ClassGrades[]
  by_section: SectionGrades[]
  weekly: { week_start: string; avg: number; n: number }[]
  monthly: { month: string; avg: number; n: number }[]
}

export interface SectionAttendance {
  class_number: number
  section_number: number
  roster: number
  hours: number
  unjustified: number
  prev_hours: number
  per_student: number | null
  unjustified_pct: number | null
  students_absent: number
}

export interface Attendance {
  hours: number
  unjustified: number
  prev_hours: number
  per_student: number | null
  students_absent: number
  /** Pupils with 10+ unjustified hours in the period. */
  heavy_unjustified: number
  by_section: SectionAttendance[]
  by_class: { class_number: number; roster: number; hours: number; unjustified: number; prev_hours: number; per_student: number | null }[]
  weekly: { week_start: string; hours: number; unjustified: number }[]
}

export type NoteKind = 'pohvala' | 'opomena' | 'napomena'

export interface SchoolNote {
  id: string
  class_number: number
  section_number: number
  student_name: string | null
  kind: NoteKind
  text: string
  author_name: string | null
  created_at: string
}

export interface Notes {
  total: number
  by_kind: Partial<Record<NoteKind, number>>
  by_section: { class_number: number; section_number: number; pohvala: number; opomena: number; napomena: number }[]
  latest: SchoolNote[]
}

export interface SectionDetail {
  subjects: { subject: string; avg: number | null; n: number | null; students: number | null; k_hidden: boolean; low_share_pct: number | null; school_avg: number | null }[]
  absences_daily: { date: string; hours: number; unjustified: number }[]
}

/** One row of the section ranking (computed in the API). */
export interface SectionRank {
  class_number: number
  section_number: number
  rank: number
  /** 0–100: 50 % grades, 25 % attendance, 25 % quiz average. */
  score: number | null
  grade_avg: number | null
  prev_grade_avg: number | null
  unjustified_pct: number | null
  absences_per_student: number | null
  quiz_avg: number | null
  k_hidden: boolean
}

export interface SkolaStats {
  meta: SkolaMeta
  grades: Grades
  attendance: Attendance
  notes: Notes
  section_detail: SectionDetail | null
  quizzes: {
    by_subject: Learning['subjects']
    risk_topics: Learning['risk_topics']
    score_hist: Learning['score_hist']
    /** Period of the app stats used (today|7d|30d|semester). */
    period: string
  }
  ranking: SectionRank[]
}
