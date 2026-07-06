import { useEffect, useState, type FormEvent, type SVGProps } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Star, User, MapPin } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import BarrierGate from '../../components/common/BarrierGate'
import CitySkyline from '../../components/common/CitySkyline'
import { login } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

function roleHome(role: string) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'owner') return '/owner/dashboard'
  return '/user/dashboard'
}

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c11.045 0 20-8.955 20-20 0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gateOpen, setGateOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await login({ email, password })
      setAuth(user, token)
      setGateOpen(true)
      const returnTo = searchParams.get('returnTo')
      const isSafeReturnTo = !!returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
      const dest = isSafeReturnTo ? returnTo : roleHome(user.role)
      setTimeout(() => navigate(dest), 600)
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Invalid email or password')
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    // Google OAuth is not yet wired up in the auth service — stub for now.
  }

  return (
    <div className="min-h-screen bg-concrete flex flex-col">
      <header className="bg-white border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <MapPin className="text-green" size={24} fill="currentColor" strokeWidth={1.5} />
            <span className="font-display text-lg font-semibold text-navy">Carparkin.in</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-ink/50">New to Carparkin?</span>
            <Link
              to="/signup"
              className="rounded-full bg-green-100 text-ink text-sm font-medium px-4 py-2 hover:bg-green-200 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-[1200px] bg-white rounded-xl shadow-lg border border-line overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left: form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Welcome back</h1>
            <p className="mt-2 text-sm text-ink/50">Please enter your details to sign in.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
                placeholder="name@example.com"
                error={error ? ' ' : undefined}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
                  placeholder="Enter your password"
                  className="pr-10"
                  error={error || undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[38px] text-ink/40 hover:text-ink/70 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex justify-end -mt-1">
                <Link to="/forgot-password" className="text-sm font-medium text-green hover:text-green-light transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" loading={loading} className="w-full font-semibold">
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-ink/40 shrink-0">Or continue with</span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-line bg-white py-2.5 text-sm font-medium text-ink hover:bg-concrete transition-colors"
            >
              <GoogleIcon width={16} height={16} />
              Google
            </button>

            <p className="mt-6 text-center text-sm text-ink/50">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-green hover:text-green-light transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Right: image + barrier */}
          <div className="hidden md:flex relative bg-navy">
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-light" />
            <CitySkyline className="absolute bottom-0 left-0 w-full h-1/2 text-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="relative flex-1 flex flex-col justify-between p-8">
              <div className="flex justify-center pt-4">
                <BarrierGate open={!mounted || gateOpen} />
              </div>

              <div>
                <div className="w-10 h-10 rounded-lg bg-green flex items-center justify-center">
                  <span className="font-display font-bold text-white">P</span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-white leading-snug">
                  Secure spots, seamless parking.
                </h2>
                <p className="mt-2 text-sm text-white/85 max-w-xs">
                  Join thousands of drivers finding the perfect monthly spot without the hassle.
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['bg-green', 'bg-amber', 'bg-navy-light'].map((bg, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full ring-2 ring-navy flex items-center justify-center ${bg}`}>
                        <User size={14} className="text-white" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} className="text-green fill-green" />
                    ))}
                  </div>
                  <span className="text-xs text-white/80">Trusted by 10k+ users</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6">
        <p className="text-center text-xs text-ink/40">© 2026 Carparkin.in. All rights reserved.</p>
      </footer>
    </div>
  )
}
