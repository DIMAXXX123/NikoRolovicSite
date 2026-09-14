// Event-type colours from the §2 palette: `color` is a badge tint (bg / border / text),
// `dotColor` is the solid 6px calendar dot.
export const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  test: { label: 'Test', color: 'bg-[#DDF4FF] border-[#84D8FF] text-[#1CB0F6]', dotColor: 'bg-[#1CB0F6]' },
  ispit: { label: 'Ispit', color: 'bg-[#FFF0DB] border-[#FFD199] text-[#D97B00]', dotColor: 'bg-[#FF9600]' },
  dogadjaj: { label: 'Događaj', color: 'bg-[#F3E3FF] border-[#E1BDFF] text-[#A560E8]', dotColor: 'bg-[#CE82FF]' },
  domaci: { label: 'Domaći zadatak', color: 'bg-[#D7FFB8] border-[#B5EE8A] text-[#58A700]', dotColor: 'bg-[#58CC02]' },
  pismeni: { label: 'Pismeni rad', color: 'bg-[#FFDFE0] border-[#FFB3B5] text-[#EA2B2B]', dotColor: 'bg-[#FF4B4B]' },
  drugo: { label: 'Drugo', color: 'bg-[#F7F7F7] border-[#E5E5E5] text-[#777777]', dotColor: 'bg-[#AFAFAF]' },
}

export const DAY_NAMES = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned']

export const MONTH_NAMES = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar',
]

export const EVENTS_PAGE_SIZE = 10

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

/** First/last calendar day of a month as `YYYY-MM-DD`. */
export function monthRange(year: number, month: number) {
  const mm = String(month + 1).padStart(2, '0')
  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`,
  }
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}
