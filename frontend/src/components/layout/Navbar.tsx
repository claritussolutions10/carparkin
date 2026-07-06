import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Button from '../common/Button'

function dashboardPath(role?: string) {
  if (role === 'owner') return '/owner/dashboard'
  if (role === 'user') return '/user/dashboard'
  if (role === 'admin') return '/admin/dashboard'
  return '/'
}

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  return (
    <nav className="bg-white border-b border-line px-6 py-4 flex items-center justify-between">
      <Link to="/" className="font-display text-xl font-semibold text-navy">Carparkin</Link>

      <div className="flex items-center gap-4">
        <Link to="/search" className="text-sm font-medium text-ink/70 hover:text-navy transition-colors">Find Parking</Link>

        {user ? (
          <>
            <Link to={dashboardPath(user.role)} className="text-sm font-medium text-ink/70 hover:text-navy transition-colors">
              Dashboard
            </Link>
            <span className="text-sm font-medium text-ink/70">Hi, {user.full_name.split(' ')[0]}</span>
            <Button variant="secondary" onClick={() => { logout(); navigate('/login') }}>Log out</Button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium text-ink/70 hover:text-navy transition-colors">Login</Link>
            <Link to="/signup"><Button>Sign up</Button></Link>
          </>
        )}
      </div>
    </nav>
  )
}
