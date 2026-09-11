export const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  test: { label: 'Test', color: 'bg-blue-500/20 text-blue-400', dotColor: 'bg-blue-500' },
  ispit: { label: 'Ispit', color: 'bg-orange-500/20 text-orange-400', dotColor: 'bg-orange-500' },
  dogadjaj: { label: 'Događaj', color: 'bg-purple-500/20 text-purple-400', dotColor: 'bg-purple-500' },
  domaci: { label: 'Domaći zadatak', color: 'bg-green-500/20 text-green-400', dotColor: 'bg-green-500' },
  pismeni: { label: 'Pismeni rad', color: 'bg-red-500/20 text-red-400', dotColor: 'bg-red-500' },
  drugo: { label: 'Drugo', color: 'bg-slate-500/20 text-slate-400', dotColor: 'bg-slate-500' },
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
