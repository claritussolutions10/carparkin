import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Map, CalendarDays, Settings, HelpCircle, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { to: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/find-parking', icon: Map, label: 'Find Parking' },
  { to: '/bookings', icon: CalendarDays, label: 'My Bookings' },
  { to: '/user/profile', icon: Settings, label: 'Profile & Settings' },
  { to: '/support', icon: HelpCircle, label: 'Support' },
]

export default function UserLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const Sidebar = () => (
    <aside className="w-[280px] bg-white border-r border-line flex flex-col h-full">
      <div className="px-6 py-5 border-b border-line flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-green flex items-center justify-center shrink-0">
          <span className="font-display font-bold text-white text-sm">P</span>
        </div>
        <div className="min-w-0">
          <span className="font-display text-base font-semibold text-navy block leading-tight">Carparkin.in</span>
          <p className="text-xs text-green font-medium leading-tight">User Portal</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-green text-white' : 'text-ink/60 hover:bg-concrete hover:text-ink'
              }`
            }>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-line">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center font-medium">
            {user?.full_name?.[0] ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{user?.full_name}</p>
            <p className="text-xs text-ink/40 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-ink/50 hover:text-danger hover:bg-danger/5 transition-colors">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-concrete overflow-hidden">
      <div className="hidden lg:flex flex-col">
        <Sidebar />
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex flex-col w-[280px]">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-line px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-concrete">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-display font-semibold text-navy">Carparkin.in</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
