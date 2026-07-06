import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  WEEKDAY_LABELS, MONTH_LABEL_FORMAT, getMonthGrid, isSameDay, isBefore, isAfter, startOfDay,
} from '../../lib/dateUtils'

interface CalendarProps {
  initialMonth: Date
  today?: Date
  min?: Date | null
  max?: Date | null
  /** Single selected day (single-date mode). */
  selected?: Date | null
  /** Range bounds (range mode) - either may be null while a selection is in progress. */
  rangeStart?: Date | null
  rangeEnd?: Date | null
  /** Live preview of where the range would end, following pointer hover, while only rangeStart is set. */
  hoverDate?: Date | null
  onHoverDate?: (date: Date | null) => void
  onSelectDay: (date: Date) => void
}

export default function Calendar({
  initialMonth, today = new Date(), min, max, selected, rangeStart, rangeEnd, hoverDate, onHoverDate, onSelectDay,
}: CalendarProps) {
  const [viewMonth, setViewMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1))

  const cells = getMonthGrid(viewMonth)
  const previewEnd = rangeStart && !rangeEnd ? hoverDate : null

  const isDisabled = (date: Date) => {
    if (min && isBefore(date, min)) return true
    if (max && isAfter(date, max)) return true
    return false
  }

  const dayState = (date: Date) => {
    if (selected && isSameDay(date, selected)) return 'selected'
    if (rangeStart && isSameDay(date, rangeStart)) return 'range-start'
    if (rangeEnd && isSameDay(date, rangeEnd)) return 'range-end'
    if (previewEnd && isSameDay(date, previewEnd)) return 'range-end-preview'
    const rangeTail = rangeEnd || previewEnd
    if (rangeStart && rangeTail && isAfter(date, rangeStart) && isBefore(date, rangeTail)) return 'in-range'
    return 'none'
  }

  return (
    <div className="w-72 select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink/50 hover:bg-concrete hover:text-ink transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="font-display text-sm font-semibold text-ink">
          {viewMonth.toLocaleDateString('en-IN', MONTH_LABEL_FORMAT)}
        </p>
        <button
          type="button"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink/50 hover:bg-concrete hover:text-ink transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-ink/40">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map(({ date, inMonth }) => {
          const disabled = isDisabled(date)
          const state = dayState(date)
          const isToday = isSameDay(date, startOfDay(today))

          return (
            <button
              type="button"
              key={date.toISOString()}
              disabled={disabled}
              onClick={() => onSelectDay(date)}
              onMouseEnter={() => onHoverDate?.(date)}
              onMouseLeave={() => onHoverDate?.(null)}
              className={[
                'h-9 flex items-center justify-center text-sm transition-colors relative',
                !inMonth ? 'text-ink/25' : 'text-ink',
                disabled ? 'text-ink/20 cursor-not-allowed' : 'cursor-pointer',
                state === 'in-range' ? 'bg-green/10' : '',
                state === 'range-start' || state === 'selected' ? 'rounded-l-full' : '',
                state === 'range-end' || state === 'range-end-preview' ? 'rounded-r-full' : '',
                (state === 'range-start' && rangeEnd) ? 'bg-green/10' : '',
              ].join(' ')}
            >
              <span
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                  state === 'selected' || state === 'range-start' || state === 'range-end'
                    ? 'bg-green text-white font-medium'
                    : state === 'range-end-preview'
                    ? 'border-2 border-green text-ink font-medium'
                    : !disabled && inMonth
                    ? 'hover:bg-concrete'
                    : '',
                  isToday && state === 'none' ? 'font-semibold text-green' : '',
                ].join(' ')}
              >
                {date.getDate()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
