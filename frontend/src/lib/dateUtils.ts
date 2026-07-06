// Every date value in this app is stored/passed as a "yyyy-mm-dd" string (the
// same format native <input type="date"> used) so swapping in the themed
// picker components never requires touching surrounding state/business logic.
// Parsing/formatting is done from local date parts, not `new Date(iso)` or
// `.toISOString()` - both of those go through UTC and can silently shift the
// displayed day by one in negative-UTC-offset timezones.

export function parseISO(value: string | undefined | null): Date | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDisplay(value: string | undefined | null): string {
  const date = parseISO(value)
  if (!date) return ''
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function isBefore(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime()
}

export function isAfter(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() > startOfDay(b).getTime()
}

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export const MONTH_LABEL_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }

// Returns every cell (including muted lead/trail days from adjacent months)
// needed to render a complete calendar grid for the month containing `viewDate`.
export function getMonthGrid(viewDate: Date): { date: Date; inMonth: boolean }[] {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()
  const gridStart = addDays(firstOfMonth, -startOffset)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  return Array.from({ length: totalCells }, (_, i) => {
    const date = addDays(gridStart, i)
    return { date, inMonth: date.getMonth() === month }
  })
}
