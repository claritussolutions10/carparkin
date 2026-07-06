import { useRef, useState } from 'react'
import { CalendarDays, ArrowRight } from 'lucide-react'
import Calendar from './Calendar'
import PopoverPortal from './PopoverPortal'
import { parseISO, toISO, formatDisplay, isBefore } from '../../lib/dateUtils'

interface DateRangePickerProps {
  startValue: string
  endValue: string
  onChangeStart: (value: string) => void
  onChangeEnd: (value: string) => void
  startPlaceholder?: string
  endPlaceholder?: string
  min?: string
  max?: string
  className?: string
}

export default function DateRangePicker({
  startValue, endValue, onChangeStart, onChangeEnd,
  startPlaceholder = 'Start date', endPlaceholder = 'End date', min, max, className = '',
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const start = parseISO(startValue)
  const end = parseISO(endValue)

  const handleSelectDay = (date: Date) => {
    if (!start || end) {
      // Nothing selected yet, or a complete range already exists - start fresh.
      onChangeStart(toISO(date))
      onChangeEnd('')
      return
    }
    if (isBefore(date, start)) {
      // Picked an earlier date while waiting for an end date - treat it as the new start.
      onChangeStart(toISO(date))
      return
    }
    onChangeEnd(toISO(date))
    setOpen(false)
  }

  const helperText = !start ? 'Select start date' : !end ? 'Select end date' : null

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-left transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green/30 border-line hover:border-green/40 ${open ? 'ring-2 ring-green/30 border-green' : ''} ${className}`}
      >
        <CalendarDays size={16} className="text-ink/40 shrink-0" />
        <span className={`font-body text-sm truncate ${start ? 'text-ink' : 'text-ink/40'}`}>
          {start ? formatDisplay(startValue) : startPlaceholder}
        </span>
        <ArrowRight size={13} className="text-ink/30 shrink-0" />
        <span className={`font-body text-sm truncate ${end ? 'text-ink' : 'text-ink/40'}`}>
          {end ? formatDisplay(endValue) : endPlaceholder}
        </span>
      </button>

      <PopoverPortal triggerRef={triggerRef} open={open} onClose={() => setOpen(false)}>
        {helperText && <p className="text-xs font-medium text-ink/50 mb-2 text-center">{helperText}</p>}
        <Calendar
          initialMonth={start ?? new Date()}
          rangeStart={start}
          rangeEnd={end}
          hoverDate={hoverDate}
          onHoverDate={setHoverDate}
          min={parseISO(min)}
          max={parseISO(max)}
          onSelectDay={handleSelectDay}
        />
      </PopoverPortal>
    </div>
  )
}
