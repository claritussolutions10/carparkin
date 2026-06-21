import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { login } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gateOpen, setGateOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await login({ email, password })
      setAuth(user, token)
      setGateOpen(true)
      setTimeout(() => navigate('/'), 600)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Park smarter, every day."
      subtitle="Find verified monthly parking near you and book in minutes."
      gateOpen={gateOpen}
    >
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink/60">Log in to manage your bookings.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />

        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        <Button type="submit" loading={loading} className="w-full mt-2">
          {loading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        New to Carparkin?{' '}
        <Link to="/signup" className="font-medium text-navy hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  )
}
