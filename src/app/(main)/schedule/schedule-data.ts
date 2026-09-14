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

// Subject tints from the §2 palette (bg / text / border), used for timetable chips.
export const SUBJECT_COLORS: Record<string, string> = {
  'Matematika': 'bg-[#D7FFB8] text-[#58A700] border-[#B5EE8A]',
  'Srpski': 'bg-[#FFDFE0] text-[#EA2B2B] border-[#FFB3B5]',
  'CSBH': 'bg-[#FFDFE0] text-[#EA2B2B] border-[#FFB3B5]',
  'Italijanski': 'bg-[#D7FFB8] text-[#58A700] border-[#B5EE8A]',
  'Engleski': 'bg-[#DDF4FF] text-[#1CB0F6] border-[#84D8FF]',
  'Fizika': 'bg-[#DDF4FF] text-[#1CB0F6] border-[#84D8FF]',
  'Hemija': 'bg-[#F3E3FF] text-[#A560E8] border-[#E1BDFF]',
  'Biologija': 'bg-[#D7FFB8] text-[#58A700] border-[#B5EE8A]',
  'Istorija': 'bg-[#FFF4C4] text-[#C79000] border-[#FFE28A]',
  'Geografija': 'bg-[#DDF4FF] text-[#1CB0F6] border-[#84D8FF]',
  'Informatika': 'bg-[#F3E3FF] text-[#A560E8] border-[#E1BDFF]',
  'Filozofija': 'bg-[#FFE4F4] text-[#D6479F] border-[#FFB8E3]',
  'Muzička': 'bg-[#FFE4F4] text-[#D6479F] border-[#FFB8E3]',
  'Likovna': 'bg-[#FFE4F4] text-[#D6479F] border-[#FFB8E3]',
  'Likovno': 'bg-[#FFE4F4] text-[#D6479F] border-[#FFB8E3]',
  'Muzičko': 'bg-[#FFE4F4] text-[#D6479F] border-[#FFB8E3]',
  'Fizičko': 'bg-[#FFF0DB] text-[#D97B00] border-[#FFD199]',
  'Latinski': 'bg-[#FFF0DB] text-[#D97B00] border-[#FFD199]',
  'Sociologija': 'bg-[#DDF4FF] text-[#1CB0F6] border-[#84D8FF]',
  'Psihologija': 'bg-[#F3E3FF] text-[#A560E8] border-[#E1BDFF]',
}

// Map subject to a left-border color for daily view
export const SUBJECT_BORDER_COLORS: Record<string, string> = {
  'Matematika': 'border-l-[#58CC02]',
  'Srpski': 'border-l-[#FF4B4B]',
  'CSBH': 'border-l-[#FF4B4B]',
  'Italijanski': 'border-l-[#58CC02]',
  'Engleski': 'border-l-[#1CB0F6]',
  'Fizika': 'border-l-[#1CB0F6]',
  'Hemija': 'border-l-[#CE82FF]',
  'Biologija': 'border-l-[#58CC02]',
  'Istorija': 'border-l-[#FFC800]',
  'Geografija': 'border-l-[#1CB0F6]',
  'Informatika': 'border-l-[#CE82FF]',
  'Filozofija': 'border-l-[#FF86D0]',
  'Muzička': 'border-l-[#FF86D0]',
  'Likovna': 'border-l-[#FF86D0]',
  'Likovno': 'border-l-[#FF86D0]',
  'Muzičko': 'border-l-[#FF86D0]',
  'Fizičko': 'border-l-[#FF9600]',
  'Latinski': 'border-l-[#FF9600]',
  'Sociologija': 'border-l-[#1CB0F6]',
  'Psihologija': 'border-l-[#CE82FF]',
}

export function getSubjectColor(subject: string): string {
  if (!subject) return ''
  for (const [key, val] of Object.entries(SUBJECT_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return val
  }
  return 'bg-primary-light text-primary-text border-primary-light-border'
}

export function getSubjectBorderColor(subject: string): string {
  if (!subject) return 'border-l-transparent'
  for (const [key, val] of Object.entries(SUBJECT_BORDER_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return val
  }
  return 'border-l-primary'
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
