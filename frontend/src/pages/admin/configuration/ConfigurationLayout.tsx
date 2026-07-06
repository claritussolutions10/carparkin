import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  ChevronRight, User, Percent, ShieldCheck, Phone, Tag, ParkingSquare, CreditCard,
} from 'lucide-react'

const TABS = [
  { to: 'profile', icon: User, label: 'Profile' },
  { to: 'commission', icon: Percent, label: 'Commission & Payouts' },
  { to: 'listing-policy', icon: ShieldCheck, label: 'Listing Policy' },
  { to: 'support', icon: Phone, label: 'Support & Contact' },
  { to: 'amenities', icon: Tag, label: 'Amenities' },
  { to: 'parking-types', icon: ParkingSquare, label: 'Parking Types' },
  { to: 'subscription-plans', icon: CreditCard, label: 'Subscription Plans' },
]

export default function ConfigurationLayout() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Configuration</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Configuration</h1>
        <p className="text-sm text-ink/50 mt-1">
          Platform-wide rules and your admin profile. Changes apply immediately across the Owner and User portals — no code changes needed.
        </p>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6 items-start">
        <nav className="bg-white rounded-xl border border-line p-2 space-y-0.5 md:sticky md:top-6">
          {TABS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-green text-white' : 'text-ink/60 hover:bg-concrete hover:text-ink'
                }`
              }
            >
              <Icon size={15} className="shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
