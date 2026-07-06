interface PageHeaderProps {
  title: string
  sub?: string
  action?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, sub, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy">{title}</h1>
        {sub && <p className="text-sm text-ink/50 mt-1">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
