import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Menu, X } from 'lucide-react'
import Button from '../common/Button'

const NAV_LINKS = [
  { label: 'Find Parking', to: '/search' },
  { label: 'My Bookings', to: '/bookings' },
  { label: 'For Owners', to: '/signup' },
]

export default function PublicHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <MapPin className="text-green" size={26} fill="currentColor" strokeWidth={1.5} />
          <span className="font-display text-lg font-semibold text-navy">Carparkin.in</span>
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
          <Link to="/login"><Button variant="secondary">Login</Button></Link>
          <Link to="/signup"><Button>Sign Up</Button></Link>
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
          <div className="flex gap-3 pt-2">
            <Link to="/login" className="flex-1" onClick={() => setMobileNavOpen(false)}>
              <Button variant="secondary" className="w-full">Login</Button>
            </Link>
            <Link to="/signup" className="flex-1" onClick={() => setMobileNavOpen(false)}>
              <Button className="w-full">Sign Up</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
