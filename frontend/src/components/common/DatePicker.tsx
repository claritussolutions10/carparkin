import { useRef, useState, type ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'
import Calendar from './Calendar'
import PopoverPortal from './PopoverPortal'
import { parseISO, toISO, formatDisplay } from '../../lib/dateUtils'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  min?: string
  max?: string
  /** 'bordered' matches Input.tsx's box; 'bare' fits inside an existing pill/search-bar container. */
  variant?: 'bordered' | 'bare'
  icon?: ReactNode
  className?: string
  align?: 'left' | 'right'
}

export default function DatePicker({
  value, onChange, label, placeholder = 'Select date', min, max, variant = 'bordered', icon, className = '', align = 'left',
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selected = parseISO(value)

  const handleSelect = (date: Date) => {
    onChange(toISO(date))
    setOpen(false)
  }

  const triggerClasses = variant === 'bordered'
    ? `w-full flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-left transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green/30 border-line hover:border-green/40 ${open ? 'ring-2 ring-green/30 border-green' : ''} ${className}`
    : `w-full flex items-center gap-2.5 text-left focus:outline-none ${className}`

  return (
    <div>
      {label && <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>}

      <button ref={triggerRef} type="button" onClick={() => setOpen((v) => !v)} className={triggerClasses}>
        {icon ?? <CalendarDays size={16} className="text-ink/40 shrink-0" />}
        <span className={`font-body text-sm truncate ${selected ? 'text-ink' : 'text-ink/40'}`}>
          {selected ? formatDisplay(value) : placeholder}
        </span>
      </button>

      <PopoverPortal triggerRef={triggerRef} open={open} onClose={() => setOpen(false)} align={align}>
        <Calendar
          initialMonth={selected ?? new Date()}
          selected={selected}
          min={parseISO(min)}
          max={parseISO(max)}
          onSelectDay={handleSelect}
        />
      </PopoverPortal>
    </div>
  )
}
