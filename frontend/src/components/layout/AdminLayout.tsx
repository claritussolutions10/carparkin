import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, CalendarDays, MapPin, CheckCircle, Inbox, SlidersHorizontal, LogOut, Menu, X,
  Wallet, Star, History, FileBarChart,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/owners', icon: Building2, label: 'Owners' },
  { to: '/admin/bookings', icon: CalendarDays, label: 'Bookings' },
  { to: '/admin/locations', icon: MapPin, label: 'Locations', end: true },
  { to: '/admin/locations/pending', icon: CheckCircle, label: 'Approvals' },
  { to: '/admin/payouts', icon: Wallet, label: 'Payouts' },
  { to: '/admin/reviews', icon: Star, label: 'Reviews' },
  { to: '/admin/support', icon: Inbox, label: 'Support' },
]

const ADMIN_PANEL_NAV = [
  { to: '/admin/configuration', icon: SlidersHorizontal, label: 'Configuration' },
  { to: '/admin/reports', icon: FileBarChart, label: 'Reports' },
  { to: '/admin/audit-log', icon: History, label: 'Audit Log' },
]

function NavGroup({ items, onNavigate }: { items: typeof NAV; onNavigate: () => void }) {
  return (
    <>
      {items.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-green text-white' : 'text-ink/60 hover:bg-concrete hover:text-ink'
            }`
          }>
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </>
  )
}

function Sidebar({ user, onNavigate, onLogout }: { user: { full_name?: string; email?: string } | null; onNavigate: () => void; onLogout: () => void }) {
  return (
    <aside className="w-64 bg-white border-r border-line flex flex-col h-full">
      <div className="px-6 py-5 border-b border-line">
        <span className="font-display text-lg font-semibold text-navy">Carparkin</span>
        <p className="text-xs text-ink/40 mt-0.5">Admin Console</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavGroup items={NAV} onNavigate={onNavigate} />

        <p className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink/30">Admin Panel</p>
        <NavGroup items={ADMIN_PANEL_NAV} onNavigate={onNavigate} />
      </nav>
      <div className="px-3 py-4 border-t border-line">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-green text-white text-xs flex items-center justify-center font-medium">
            {user?.full_name?.[0] ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{user?.full_name}</p>
            <p className="text-xs text-ink/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-danger hover:bg-danger/5 transition-colors">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-concrete overflow-hidden">
      <div className="hidden lg:flex flex-col">
        <Sidebar user={user} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex flex-col w-64">
            <Sidebar user={user} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-line px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-concrete">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-display font-semibold text-navy">Carparkin Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
