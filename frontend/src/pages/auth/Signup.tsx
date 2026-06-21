import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { signup } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

export default function Signup() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gateOpen, setGateOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await signup({ name, email, password, phone: phone || undefined })
      setAuth(user, token)
      setGateOpen(true)
      setTimeout(() => navigate('/'), 600)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not create account')
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Your spot, reserved."
      subtitle="List your space or book one in minutes — Carparkin handles the rest."
      gateOpen={gateOpen}
    >
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-ink/60">Start booking or listing parking in minutes.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Arun Kumar" required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <Input label="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />

        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        <Button type="submit" loading={loading} className="w-full mt-2">
          {loading ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-navy hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  )
}
