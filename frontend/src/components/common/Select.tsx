import { useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import PopoverPortal from './PopoverPortal'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange: (e: { target: { value: string } }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

// Custom-rendered dropdown (not a native <select>) so the option list is
// themed like the rest of the app - a native select's popup is drawn by the
// OS/browser and can't pick up our surface/border/accent colors or dark mode.
// Keeps the same {options, value, onChange, placeholder, className} shape as
// the native version it replaces, with onChange still shaped like a change
// event, so none of its 19 call sites needed to change.
export default function Select({ options, value, onChange, placeholder, className = '', disabled }: SelectProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selected = options.find((o) => o.value === value)

  const handleSelect = (v: string) => {
    onChange({ target: { value: v } })
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={`flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        <span className={`truncate ${selected ? 'text-ink' : 'text-ink/40'}`}>{selected ? selected.label : placeholder ?? 'Select...'}</span>
        <ChevronDown size={14} className={`text-ink/40 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <PopoverPortal
        triggerRef={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        align="left"
        width={triggerRef.current?.getBoundingClientRect().width ?? 200}
      >
        <div className="-m-4 py-1.5" style={{ minWidth: triggerRef.current?.getBoundingClientRect().width }} role="listbox">
          {placeholder && (
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left transition-colors hover:bg-concrete ${!value ? 'text-green font-medium' : 'text-ink/60'}`}
            >
              {placeholder}
              {!value && <Check size={14} className="text-green shrink-0" />}
            </button>
          )}
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => handleSelect(o.value)}
              role="option"
              aria-selected={o.value === value}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm text-left transition-colors hover:bg-concrete ${o.value === value ? 'text-green font-medium' : 'text-ink'}`}
            >
              {o.label}
              {o.value === value && <Check size={14} className="text-green shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverPortal>
    </>
  )
}
