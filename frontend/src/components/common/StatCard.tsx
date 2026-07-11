interface StatCardProps {
  label: string
  value: string | number
  sub?: React.ReactNode
  accent?: boolean
  icon?: React.ReactNode
  iconClassName?: string
}

export default function StatCard({ label, value, sub, accent, icon, iconClassName }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? 'bg-green border-green' : 'bg-surface border-line'}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={`text-sm ${accent ? 'text-white/70' : 'text-ink/50'}`}>{label}</p>
          <p className={`font-display text-2xl font-semibold mt-1 ${accent ? 'text-white' : 'text-ink'}`}>{value}</p>
          {sub && <p className={`text-xs mt-1 ${accent ? 'text-white/50' : 'text-ink/40'}`}>{sub}</p>}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            iconClassName ?? (accent ? 'bg-white/20 text-white' : 'bg-green/10 text-green')
          }`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
