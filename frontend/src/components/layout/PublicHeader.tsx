import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import Button from '../common/Button'
import PopoverPortal from '../common/PopoverPortal'
import ThemeToggle from '../common/ThemeToggle'
import { useLogoUrl } from '../../hooks/useLogoUrl'
import { useAuthStore } from '../../store/authStore'
import { roleHome } from '../../lib/roleHome'

const NAV_LINKS = [
  { label: 'Find Parking', to: '/search' },
  { label: 'My Bookings', to: '/bookings' },
  { label: 'For Owners', to: '/signup' },
]

export default function PublicHeader() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileTriggerRef = useRef<HTMLButtonElement>(null)
  const logoUrl = useLogoUrl()

  const handleLogout = () => {
    setProfileOpen(false)
    setMobileNavOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Carparkin.in" className="h-8 w-auto object-contain" />
          ) : (
            <>
              <MapPin className="text-green" size={26} fill="currentColor" strokeWidth={1.5} />
              <span className="font-display text-lg font-semibold text-ink">Carparkin.in</span>
            </>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm font-medium text-ink/60 hover:text-green transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <button
              ref={profileTriggerRef}
              onClick={() => setProfileOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center font-medium text-sm overflow-hidden shrink-0"
              aria-label="Account menu"
            >
              {user.profile_picture ? (
                <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
              ) : (
                user.full_name?.[0] ?? 'U'
              )}
            </button>
          ) : (
            <>
              <Link to="/login"><Button variant="secondary">Login</Button></Link>
              <Link to="/signup"><Button>Sign Up</Button></Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2 rounded-lg text-ink/70 hover:bg-concrete"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden border-t border-line px-4 sm:px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink/70">Theme</span>
            <ThemeToggle />
          </div>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-ink/70 hover:text-green transition-colors py-1"
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="pt-2 border-t border-line">
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center font-medium overflow-hidden shrink-0">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.[0] ?? 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{user.full_name}</p>
                  <p className="text-xs text-ink/40 truncate">{user.email}</p>
                </div>
              </div>
              <Link
                to={roleHome(user.role)}
                onClick={() => setMobileNavOpen(false)}
                className="block text-sm font-medium text-ink/70 hover:text-green transition-colors py-1.5"
              >
                Dashboard
              </Link>
              <button onClick={handleLogout} className="block text-sm font-medium text-danger py-1.5">
                Log out
              </button>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1" onClick={() => setMobileNavOpen(false)}>
                <Button variant="secondary" className="w-full">Login</Button>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setMobileNavOpen(false)}>
                <Button className="w-full">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      <PopoverPortal
        triggerRef={profileTriggerRef}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        align="right"
        width={220}
      >
        {user && (
          <div>
            <p className="text-sm font-medium text-ink truncate">{user.full_name}</p>
            <p className="text-xs text-ink/40 truncate">{user.email}</p>
            <div className="mt-3 pt-3 border-t border-line space-y-1">
              <Link
                to={roleHome(user.role)}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-ink/70 hover:bg-concrete transition-colors"
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-ink/70 hover:bg-danger/5 hover:text-danger transition-colors"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          </div>
        )}
      </PopoverPortal>
    </header>
  )
}
