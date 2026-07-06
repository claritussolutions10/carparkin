import { useAuthStore } from '../../../store/authStore'

export default function ProfileTab() {
  const { user } = useAuthStore()

  return (
    <div className="bg-white rounded-xl border border-line overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-6 border-b border-line bg-green/5">
        <div className="w-14 h-14 rounded-full bg-green flex items-center justify-center text-white font-display font-semibold text-xl">
          {user?.full_name?.[0] ?? 'A'}
        </div>
        <div>
          <p className="font-display font-semibold text-ink">{user?.full_name}</p>
          <p className="text-ink/50 text-sm">{user?.email}</p>
          <span className="inline-block mt-1 text-xs font-medium text-green bg-green/10 px-2 py-0.5 rounded-full">
            Administrator
          </span>
        </div>
      </div>

      <div className="divide-y divide-line">
        {[
          { label: 'Full Name', value: user?.full_name },
          { label: 'Email', value: user?.email },
          { label: 'Role', value: 'Admin' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-center px-6 py-4">
            <span className="text-ink/50 text-sm">{row.label}</span>
            <span className="text-ink text-sm font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-line bg-concrete/50">
        <p className="text-ink/50 text-sm">
          To update admin credentials, use the backend API or database directly.
          Contact your system administrator for account changes.
        </p>
      </div>
    </div>
  )
}
