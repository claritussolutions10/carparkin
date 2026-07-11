import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { roleHome } from '../../lib/roleHome'
import Button from '../common/Button'
import ThemeToggle from '../common/ThemeToggle'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  return (
    <nav className="bg-surface border-b border-line px-6 py-4 flex items-center justify-between">
      <Link to="/" className="font-display text-xl font-semibold text-ink">Carparkin</Link>

      <div className="flex items-center gap-4">
        <Link to="/search" className="text-sm font-medium text-ink/70 hover:text-ink transition-colors">Find Parking</Link>
        <ThemeToggle />

        {user ? (
          <>
            <Link to={roleHome(user.role)} className="text-sm font-medium text-ink/70 hover:text-ink transition-colors">
              Dashboard
            </Link>
            <span className="text-sm font-medium text-ink/70">Hi, {user.full_name.split(' ')[0]}</span>
            <Button variant="secondary" onClick={() => { logout(); navigate('/login') }}>Log out</Button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium text-ink/70 hover:text-ink transition-colors">Login</Link>
            <Link to="/signup"><Button>Sign up</Button></Link>
          </>
        )}
      </div>
    </nav>
  )
}
