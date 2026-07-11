interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
  className?: string
}

export default function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 bg-surface border border-line rounded-xl p-1 w-fit ${className}`}>
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
            active === t ? 'bg-green text-white' : 'text-ink/60 hover:text-ink'
          }`}>
          {t}
        </button>
      ))}
    </div>
  )
}
