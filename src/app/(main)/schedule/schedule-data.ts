// Static schedule data and subject styling, shared by the schedule view.
export const DAYS = ['Ponedeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak'] as const
export const DAY_SHORT = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet'] as const
export const PERIODS = [1, 2, 3, 4, 5, 6, 7] as const
export const PERIOD_TIMES = [
  '07:30 - 08:15',
  '08:20 - 09:05',
  '09:15 - 10:00',
  '10:05 - 10:50',
  '11:05 - 11:50',
  '11:55 - 12:40',
  '12:45 - 13:30',
]

export const SUBJECT_COLORS: Record<string, string> = {
  'Matematika': 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  'Srpski': 'bg-red-500/15 text-red-300 border-red-500/20',
  'Engleski': 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  'Fizika': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  'Hemija': 'bg-green-500/15 text-green-300 border-green-500/20',
  'Biologija': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  'Istorija': 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  'Geografija': 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  'Informatika': 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  'Filozofija': 'bg-pink-500/15 text-pink-300 border-pink-500/20',
  'Muzička': 'bg-rose-500/15 text-rose-300 border-rose-500/20',
  'Likovna': 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
  'Fizičko': 'bg-lime-500/15 text-lime-300 border-lime-500/20',
  'Latinski': 'bg-teal-500/15 text-teal-300 border-teal-500/20',
  'Sociologija': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  'Psihologija': 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20',
}

// Map subject to a left-border color for daily view
export const SUBJECT_BORDER_COLORS: Record<string, string> = {
  'Matematika': 'border-l-blue-400',
  'Srpski': 'border-l-red-400',
  'Engleski': 'border-l-purple-400',
  'Fizika': 'border-l-cyan-400',
  'Hemija': 'border-l-green-400',
  'Biologija': 'border-l-emerald-400',
  'Istorija': 'border-l-amber-400',
  'Geografija': 'border-l-orange-400',
  'Informatika': 'border-l-violet-400',
  'Filozofija': 'border-l-pink-400',
  'Muzička': 'border-l-rose-400',
  'Likovna': 'border-l-yellow-400',
  'Fizičko': 'border-l-lime-400',
  'Latinski': 'border-l-teal-400',
  'Sociologija': 'border-l-indigo-400',
  'Psihologija': 'border-l-fuchsia-400',
}

export function getSubjectColor(subject: string): string {
  if (!subject) return ''
  for (const [key, val] of Object.entries(SUBJECT_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return val
  }
  return 'bg-primary/10 text-primary border-primary/20'
}

export function getSubjectBorderColor(subject: string): string {
  if (!subject) return 'border-l-transparent'
  for (const [key, val] of Object.entries(SUBJECT_BORDER_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return val
  }
  return 'border-l-purple-400'
}

export type ScheduleData = Record<string, string>

export const DEFAULT_SCHEDULES: Record<string, ScheduleData> = {
  // I razred
  'schedule_1_1': {
    '0-1': 'Matematika', '0-2': 'CSBH', '0-3': 'Engleski', '0-4': 'Biologija', '0-5': 'Fizičko', '0-6': 'Geografija',
    '1-1': 'Fizika', '1-2': 'Matematika', '1-3': 'Hemija', '1-4': 'Istorija', '1-5': 'CSBH', '1-6': 'Likovno',
    '2-1': 'Engleski', '2-2': 'Biologija', '2-3': 'Matematika', '2-4': 'Fizika', '2-5': 'Geografija', '2-6': 'Muzičko',
    '3-1': 'CSBH', '3-2': 'Hemija', '3-3': 'Istorija', '3-4': 'Engleski', '3-5': 'Matematika',
    '4-1': 'Informatika', '4-2': 'Fizičko', '4-3': 'Biologija', '4-4': 'Hemija', '4-5': 'Italijanski',
  },
  'schedule_1_2': {
    '0-1': 'Engleski', '0-2': 'Matematika', '0-3': 'Fizika', '0-4': 'CSBH', '0-5': 'Biologija', '0-6': 'Istorija',
    '1-1': 'Hemija', '1-2': 'Geografija', '1-3': 'Matematika', '1-4': 'Engleski', '1-5': 'Fizičko', '1-6': 'Likovno',
    '2-1': 'Matematika', '2-2': 'CSBH', '2-3': 'Engleski', '2-4': 'Hemija', '2-5': 'Fizika', '2-6': 'Biologija',
    '3-1': 'Istorija', '3-2': 'Fizičko', '3-3': 'Geografija', '3-4': 'Matematika', '3-5': 'CSBH',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Muzičko', '4-4': 'Engleski', '4-5': 'Biologija',
  },
  'schedule_1_3': {
    '0-1': 'CSBH', '0-2': 'Fizika', '0-3': 'Matematika', '0-4': 'Engleski', '0-5': 'Hemija', '0-6': 'Fizičko',
    '1-1': 'Biologija', '1-2': 'Matematika', '1-3': 'Istorija', '1-4': 'Geografija', '1-5': 'Engleski', '1-6': 'Italijanski',
    '2-1': 'Fizika', '2-2': 'CSBH', '2-3': 'Hemija', '2-4': 'Matematika', '2-5': 'Likovno', '2-6': 'Biologija',
    '3-1': 'Engleski', '3-2': 'Informatika', '3-3': 'CSBH', '3-4': 'Fizičko', '3-5': 'Matematika',
    '4-1': 'Geografija', '4-2': 'Istorija', '4-3': 'Fizika', '4-4': 'Muzičko', '4-5': 'Hemija',
  },
  // II razred
  'schedule_2_1': {
    '0-1': 'Matematika', '0-2': 'Engleski', '0-3': 'Likovno', '0-4': 'Geografija', '0-5': 'Italijanski', '0-6': 'Psihologija',
    '1-1': 'Hemija', '1-2': 'Geografija', '1-3': 'Engleski', '1-4': 'Istorija', '1-5': 'Fizičko', '1-6': 'Italijanski',
    '2-1': 'Fizika', '2-2': 'Hemija', '2-3': 'Istorija', '2-4': 'Biologija', '2-5': 'CSBH', '2-6': 'CSBH', '2-7': 'ČOZ',
    '3-1': 'Fizičko', '3-2': 'Matematika', '3-3': 'Matematika', '3-4': 'Psihologija', '3-5': 'CSBH', '3-6': 'Izborni', '3-7': 'Fizika',
    '4-1': 'Izborni', '4-2': 'Izborni', '4-3': 'Engleski', '4-4': 'Matematika', '4-5': 'Biologija', '4-6': 'CSBH',
  },
  'schedule_2_2': {
    '0-1': 'Engleski', '0-2': 'Fizika', '0-3': 'CSBH', '0-4': 'Matematika', '0-5': 'Hemija', '0-6': 'Biologija',
    '1-1': 'Matematika', '1-2': 'Geografija', '1-3': 'Engleski', '1-4': 'Fizičko', '1-5': 'Istorija', '1-6': 'Hemija',
    '2-1': 'Biologija', '2-2': 'Matematika', '2-3': 'Fizika', '2-4': 'CSBH', '2-5': 'Engleski', '2-6': 'Likovno',
    '3-1': 'Hemija', '3-2': 'CSBH', '3-3': 'Matematika', '3-4': 'Geografija', '3-5': 'Fizičko',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Istorija', '4-4': 'Engleski', '4-5': 'Fizika',
  },
  'schedule_2_3': {
    '0-1': 'Hemija', '0-2': 'Matematika', '0-3': 'Engleski', '0-4': 'Biologija', '0-5': 'CSBH', '0-6': 'Fizičko',
    '1-1': 'Istorija', '1-2': 'Fizika', '1-3': 'CSBH', '1-4': 'Matematika', '1-5': 'Engleski', '1-6': 'Geografija',
    '2-1': 'Matematika', '2-2': 'Hemija', '2-3': 'Italijanski', '2-4': 'Fizika', '2-5': 'Biologija', '2-6': 'CSBH',
    '3-1': 'Engleski', '3-2': 'Matematika', '3-3': 'Likovno', '3-4': 'Istorija', '3-5': 'Fizičko',
    '4-1': 'Informatika', '4-2': 'Geografija', '4-3': 'Hemija', '4-4': 'Biologija', '4-5': 'Fizika',
  },
  // III razred
  'schedule_3_1': {
    '0-1': 'Matematika', '0-2': 'Fizika', '0-3': 'Engleski', '0-4': 'Hemija', '0-5': 'CSBH', '0-6': 'Biologija',
    '1-1': 'Istorija', '1-2': 'Matematika', '1-3': 'Geografija', '1-4': 'Fizičko', '1-5': 'Engleski',
    '2-1': 'CSBH', '2-2': 'Hemija', '2-3': 'Matematika', '2-4': 'Fizika', '2-5': 'Biologija', '2-6': 'Filozofija',
    '3-1': 'Engleski', '3-2': 'Sociologija', '3-3': 'Matematika', '3-4': 'CSBH', '3-5': 'Fizičko',
    '4-1': 'Informatika', '4-2': 'Italijanski', '4-3': 'Fizika', '4-4': 'Istorija', '4-5': 'Hemija',
  },
  'schedule_3_2': {
    '0-1': 'Fizika', '0-2': 'Engleski', '0-3': 'Matematika', '0-4': 'CSBH', '0-5': 'Biologija', '0-6': 'Hemija',
    '1-1': 'Matematika', '1-2': 'Istorija', '1-3': 'Fizičko', '1-4': 'Engleski', '1-5': 'Geografija',
    '2-1': 'Filozofija', '2-2': 'Matematika', '2-3': 'Fizika', '2-4': 'Hemija', '2-5': 'CSBH', '2-6': 'Biologija',
    '3-1': 'CSBH', '3-2': 'Engleski', '3-3': 'Sociologija', '3-4': 'Matematika', '3-5': 'Fizičko',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Istorija', '4-4': 'Fizika', '4-5': 'Geografija',
  },
  // IV razred
  'schedule_4_1': {
    '0-1': 'Matematika', '0-2': 'CSBH', '0-3': 'Engleski', '0-4': 'Fizika', '0-5': 'Hemija',
    '1-1': 'Biologija', '1-2': 'Matematika', '1-3': 'Istorija', '1-4': 'Fizičko', '1-5': 'Engleski',
    '2-1': 'Filozofija', '2-2': 'Fizika', '2-3': 'Matematika', '2-4': 'CSBH', '2-5': 'Sociologija',
    '3-1': 'Engleski', '3-2': 'Hemija', '3-3': 'Biologija', '3-4': 'Matematika', '3-5': 'Fizičko',
    '4-1': 'Italijanski', '4-2': 'Geografija', '4-3': 'Informatika', '4-4': 'Istorija',
  },
  'schedule_4_2': {
    '0-1': 'Engleski', '0-2': 'Fizika', '0-3': 'CSBH', '0-4': 'Matematika', '0-5': 'Biologija',
    '1-1': 'Hemija', '1-2': 'Engleski', '1-3': 'Matematika', '1-4': 'Istorija', '1-5': 'Geografija',
    '2-1': 'Matematika', '2-2': 'Fizičko', '2-3': 'Filozofija', '2-4': 'Fizika', '2-5': 'CSBH',
    '3-1': 'Sociologija', '3-2': 'Biologija', '3-3': 'Engleski', '3-4': 'Hemija', '3-5': 'Matematika',
    '4-1': 'Informatika', '4-2': 'Italijanski', '4-3': 'Fizičko', '4-4': 'Istorija',
  },
  // Remaining sections
  'schedule_1_4': {
    '0-1': 'Biologija', '0-2': 'Engleski', '0-3': 'Matematika', '0-4': 'CSBH', '0-5': 'Hemija', '0-6': 'Fizičko',
    '1-1': 'Geografija', '1-2': 'Fizika', '1-3': 'Engleski', '1-4': 'Matematika', '1-5': 'Istorija', '1-6': 'Likovno',
    '2-1': 'Matematika', '2-2': 'CSBH', '2-3': 'Biologija', '2-4': 'Hemija', '2-5': 'Fizika', '2-6': 'Engleski',
    '3-1': 'Italijanski', '3-2': 'Matematika', '3-3': 'Geografija', '3-4': 'Fizičko', '3-5': 'CSBH',
    '4-1': 'Informatika', '4-2': 'Istorija', '4-3': 'Hemija', '4-4': 'Muzičko', '4-5': 'Biologija',
  },
  'schedule_1_5': {
    '0-1': 'CSBH', '0-2': 'Matematika', '0-3': 'Fizika', '0-4': 'Engleski', '0-5': 'Biologija', '0-6': 'Hemija',
    '1-1': 'Engleski', '1-2': 'Istorija', '1-3': 'Matematika', '1-4': 'Geografija', '1-5': 'Fizičko', '1-6': 'CSBH',
    '2-1': 'Hemija', '2-2': 'Biologija', '2-3': 'Engleski', '2-4': 'Fizika', '2-5': 'Matematika', '2-6': 'Likovno',
    '3-1': 'Matematika', '3-2': 'CSBH', '3-3': 'Hemija', '3-4': 'Istorija', '3-5': 'Italijanski',
    '4-1': 'Fizičko', '4-2': 'Geografija', '4-3': 'Informatika', '4-4': 'Biologija', '4-5': 'Muzičko',
  },
  'schedule_1_6': {
    '0-1': 'Fizika', '0-2': 'CSBH', '0-3': 'Engleski', '0-4': 'Matematika', '0-5': 'Geografija', '0-6': 'Biologija',
    '1-1': 'Matematika', '1-2': 'Hemija', '1-3': 'Fizičko', '1-4': 'Engleski', '1-5': 'Likovno', '1-6': 'Istorija',
    '2-1': 'CSBH', '2-2': 'Fizika', '2-3': 'Matematika', '2-4': 'Biologija', '2-5': 'Hemija', '2-6': 'Engleski',
    '3-1': 'Geografija', '3-2': 'Matematika', '3-3': 'Italijanski', '3-4': 'CSBH', '3-5': 'Fizičko',
    '4-1': 'Muzičko', '4-2': 'Informatika', '4-3': 'Istorija', '4-4': 'Fizika', '4-5': 'Hemija',
  },
  'schedule_2_4': {
    '0-1': 'Fizika', '0-2': 'Matematika', '0-3': 'CSBH', '0-4': 'Engleski', '0-5': 'Biologija', '0-6': 'Hemija',
    '1-1': 'Istorija', '1-2': 'Engleski', '1-3': 'Fizičko', '1-4': 'Matematika', '1-5': 'Geografija', '1-6': 'CSBH',
    '2-1': 'Matematika', '2-2': 'Hemija', '2-3': 'Biologija', '2-4': 'Fizika', '2-5': 'Engleski', '2-6': 'Likovno',
    '3-1': 'CSBH', '3-2': 'Matematika', '3-3': 'Italijanski', '3-4': 'Istorija', '3-5': 'Fizičko',
    '4-1': 'Informatika', '4-2': 'Geografija', '4-3': 'Hemija', '4-4': 'Biologija', '4-5': 'Fizika',
  },
  'schedule_2_5': {
    '0-1': 'Engleski', '0-2': 'Hemija', '0-3': 'Matematika', '0-4': 'Fizika', '0-5': 'CSBH', '0-6': 'Biologija',
    '1-1': 'Matematika', '1-2': 'CSBH', '1-3': 'Geografija', '1-4': 'Engleski', '1-5': 'Hemija', '1-6': 'Fizičko',
    '2-1': 'Biologija', '2-2': 'Fizika', '2-3': 'Matematika', '2-4': 'Istorija', '2-5': 'CSBH', '2-6': 'Engleski',
    '3-1': 'Likovno', '3-2': 'Matematika', '3-3': 'Hemija', '3-4': 'Fizičko', '3-5': 'Geografija',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Fizika', '4-4': 'Biologija', '4-5': 'Istorija',
  },
  'schedule_2_6': {
    '0-1': 'Matematika', '0-2': 'Biologija', '0-3': 'Engleski', '0-4': 'Hemija', '0-5': 'Fizičko', '0-6': 'CSBH',
    '1-1': 'Fizika', '1-2': 'Matematika', '1-3': 'Istorija', '1-4': 'CSBH', '1-5': 'Engleski', '1-6': 'Geografija',
    '2-1': 'Engleski', '2-2': 'Hemija', '2-3': 'Biologija', '2-4': 'Matematika', '2-5': 'Fizika', '2-6': 'Likovno',
    '3-1': 'CSBH', '3-2': 'Fizičko', '3-3': 'Matematika', '3-4': 'Hemija', '3-5': 'Italijanski',
    '4-1': 'Istorija', '4-2': 'Informatika', '4-3': 'Geografija', '4-4': 'Biologija', '4-5': 'Engleski',
  },
  'schedule_3_3': {
    '0-1': 'Hemija', '0-2': 'Matematika', '0-3': 'CSBH', '0-4': 'Engleski', '0-5': 'Fizika', '0-6': 'Biologija',
    '1-1': 'Geografija', '1-2': 'Fizičko', '1-3': 'Matematika', '1-4': 'Istorija', '1-5': 'Engleski',
    '2-1': 'Matematika', '2-2': 'Biologija', '2-3': 'Filozofija', '2-4': 'Hemija', '2-5': 'CSBH', '2-6': 'Fizika',
    '3-1': 'Engleski', '3-2': 'Sociologija', '3-3': 'Fizičko', '3-4': 'Matematika', '3-5': 'CSBH',
    '4-1': 'Informatika', '4-2': 'Italijanski', '4-3': 'Fizika', '4-4': 'Istorija', '4-5': 'Hemija',
  },
  'schedule_3_4': {
    '0-1': 'Engleski', '0-2': 'Fizika', '0-3': 'Matematika', '0-4': 'Biologija', '0-5': 'CSBH',
    '1-1': 'Hemija', '1-2': 'Matematika', '1-3': 'Istorija', '1-4': 'Engleski', '1-5': 'Fizičko',
    '2-1': 'CSBH', '2-2': 'Filozofija', '2-3': 'Matematika', '2-4': 'Fizika', '2-5': 'Geografija', '2-6': 'Hemija',
    '3-1': 'Matematika', '3-2': 'Biologija', '3-3': 'Engleski', '3-4': 'Sociologija', '3-5': 'CSBH',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Istorija', '4-4': 'Fizičko', '4-5': 'Fizika',
  },
  'schedule_3_5': {
    '0-1': 'Matematika', '0-2': 'CSBH', '0-3': 'Fizika', '0-4': 'Engleski', '0-5': 'Hemija',
    '1-1': 'Biologija', '1-2': 'Engleski', '1-3': 'Matematika', '1-4': 'Fizičko', '1-5': 'Geografija',
    '2-1': 'Filozofija', '2-2': 'Hemija', '2-3': 'CSBH', '2-4': 'Matematika', '2-5': 'Fizika', '2-6': 'Biologija',
    '3-1': 'Istorija', '3-2': 'Matematika', '3-3': 'Sociologija', '3-4': 'Engleski', '3-5': 'Fizičko',
    '4-1': 'Informatika', '4-2': 'Italijanski', '4-3': 'Hemija', '4-4': 'Geografija', '4-5': 'CSBH',
  },
  'schedule_3_6': {
    '0-1': 'CSBH', '0-2': 'Engleski', '0-3': 'Hemija', '0-4': 'Matematika', '0-5': 'Fizika',
    '1-1': 'Matematika', '1-2': 'Biologija', '1-3': 'Geografija', '1-4': 'CSBH', '1-5': 'Engleski',
    '2-1': 'Fizičko', '2-2': 'Matematika', '2-3': 'Fizika', '2-4': 'Filozofija', '2-5': 'Hemija', '2-6': 'Istorija',
    '3-1': 'Engleski', '3-2': 'CSBH', '3-3': 'Matematika', '3-4': 'Biologija', '3-5': 'Sociologija',
    '4-1': 'Italijanski', '4-2': 'Fizičko', '4-3': 'Informatika', '4-4': 'Fizika', '4-5': 'Geografija',
  },
  'schedule_4_3': {
    '0-1': 'Fizika', '0-2': 'Matematika', '0-3': 'Engleski', '0-4': 'CSBH', '0-5': 'Hemija',
    '1-1': 'Biologija', '1-2': 'Istorija', '1-3': 'Matematika', '1-4': 'Fizičko', '1-5': 'Engleski',
    '2-1': 'Filozofija', '2-2': 'CSBH', '2-3': 'Fizika', '2-4': 'Matematika', '2-5': 'Geografija',
    '3-1': 'Hemija', '3-2': 'Engleski', '3-3': 'Sociologija', '3-4': 'Biologija', '3-5': 'Matematika',
    '4-1': 'Informatika', '4-2': 'Italijanski', '4-3': 'Istorija', '4-4': 'Fizičko',
  },
  'schedule_4_4': {
    '0-1': 'CSBH', '0-2': 'Fizika', '0-3': 'Matematika', '0-4': 'Engleski', '0-5': 'Biologija',
    '1-1': 'Matematika', '1-2': 'Hemija', '1-3': 'Fizičko', '1-4': 'Istorija', '1-5': 'CSBH',
    '2-1': 'Engleski', '2-2': 'Matematika', '2-3': 'Filozofija', '2-4': 'Fizika', '2-5': 'Hemija',
    '3-1': 'Biologija', '3-2': 'Geografija', '3-3': 'Matematika', '3-4': 'Sociologija', '3-5': 'Engleski',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Fizičko', '4-4': 'Istorija',
  },
  'schedule_4_5': {
    '0-1': 'Matematika', '0-2': 'Engleski', '0-3': 'Hemija', '0-4': 'Fizika', '0-5': 'CSBH',
    '1-1': 'Biologija', '1-2': 'Matematika', '1-3': 'Engleski', '1-4': 'Geografija', '1-5': 'Fizičko',
    '2-1': 'Istorija', '2-2': 'Fizika', '2-3': 'Matematika', '2-4': 'CSBH', '2-5': 'Filozofija',
    '3-1': 'Engleski', '3-2': 'Hemija', '3-3': 'Biologija', '3-4': 'Matematika', '3-5': 'Sociologija',
    '4-1': 'Informatika', '4-2': 'Fizičko', '4-3': 'Italijanski', '4-4': 'Istorija',
  },
  'schedule_4_6': {
    '0-1': 'Engleski', '0-2': 'CSBH', '0-3': 'Fizika', '0-4': 'Matematika', '0-5': 'Biologija',
    '1-1': 'Hemija', '1-2': 'Engleski', '1-3': 'Fizičko', '1-4': 'Matematika', '1-5': 'Istorija',
    '2-1': 'Matematika', '2-2': 'Geografija', '2-3': 'CSBH', '2-4': 'Filozofija', '2-5': 'Fizika',
    '3-1': 'Sociologija', '3-2': 'Biologija', '3-3': 'Matematika', '3-4': 'Engleski', '3-5': 'Hemija',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Istorija', '4-4': 'Fizičko',
  },
}

export function getStorageKey(classNum: number, sectionNum: number) {
  return `schedule_${classNum}_${sectionNum}`
}
