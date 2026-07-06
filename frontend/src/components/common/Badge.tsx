type BadgeVariant = 'green' | 'blue' | 'amber' | 'red' | 'gray'

const MAP: Record<string, BadgeVariant> = {
  active: 'green', confirmed: 'blue', approved: 'green', completed: 'green',
  pending: 'amber', paid: 'green',
  cancelled: 'red', rejected: 'red', inactive: 'gray', failed: 'red',
}

const STYLES: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber/20 text-amber-700',
  red: 'bg-danger/10 text-danger',
  gray: 'bg-line text-ink/50',
}

interface BadgeProps {
  status?: string
  variant?: BadgeVariant
  label?: string
}

export default function Badge({ status, variant, label }: BadgeProps) {
  const v = variant ?? (status ? (MAP[status.toLowerCase()] ?? 'gray') : 'gray')
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[v]}`}>
      {label ?? status}
    </span>
  )
}
