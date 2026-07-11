import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { roleHome } from '../../lib/roleHome'
import { isTokenExpired } from '../../lib/jwt'

interface ProtectedRouteProps {
  role?: 'user' | 'owner' | 'admin'
}

export default function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, token } = useAuthStore()
  const location = useLocation()

  if (!user || !token || isTokenExpired(token)) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  if (role && user.role !== role) {
    return <Navigate to={roleHome(user.role)} replace />
  }
  return <Outlet />
}
