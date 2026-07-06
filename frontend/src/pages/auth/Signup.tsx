import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Star, User, MapPin, IndianRupee, ShieldCheck } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import BarrierGate from '../../components/common/BarrierGate'
import CitySkyline from '../../components/common/CitySkyline'
import { signup } from '../../api/auth.api'
import { useAuthStore } from '../../store/authStore'

type Role = 'user' | 'owner'

function passwordStrength(pw: string) {
  if (!pw) return { label: '', pct: 0, color: 'bg-line' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak', pct: 33, color: 'bg-danger' }
  if (score <= 2) return { label: 'Fair', pct: 66, color: 'bg-amber' }
  return { label: 'Strong', pct: 100, color: 'bg-green' }
}

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [role, setRole] = useState<Role>(searchParams.get('role') === 'owner' ? 'owner' : 'user')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gateOpen, setGateOpen] = useState(false)

  const strength = useMemo(() => passwordStrength(password), [password])
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password

  const isOwner = role === 'owner'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy')
      return
    }
    setLoading(true)
    try {
      const { token, user } = await signup({
        full_name: fullName,
        email,
        password,
        phone_number: phoneNumber,
        role,
      })
      setAuth(user, token)
      setGateOpen(true)
      const dest = role === 'owner' ? '/owner/dashboard' : '/user/dashboard'
      setTimeout(() => navigate(dest), 600)
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Could not create account')
      setLoading(false)
    }
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
            <span className="hidden sm:inline text-sm text-ink/50">Already a member?</span>
            <Link
              to="/login"
              className="rounded-full bg-green-100 text-ink text-sm font-medium px-4 py-2 hover:bg-green-200 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-[1200px] bg-white rounded-xl shadow-lg border border-line overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left: form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-2 mb-6 rounded-lg bg-concrete p-1">
              {(['user', 'owner'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 rounded-md text-sm font-medium transition-all ${
                    role === r ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink/70'
                  }`}
                >
                  {r === 'user' ? "I'm a Driver" : "I'm an Owner"}
                </button>
              ))}
            </div>

            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
              {isOwner ? 'Create Partner Account' : 'Create your account'}
            </h1>
            <p className="mt-2 text-sm text-green-700">
              {isOwner
                ? 'Start listing your parking spots in minutes and earn passive income.'
                : 'Find and book your perfect monthly parking spot in minutes.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); if (error) setError('') }}
                placeholder="Arun Kumar"
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
                placeholder="name@company.com"
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value); if (error) setError('') }}
                placeholder="+91 98765 43210"
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError('') }}
                  placeholder="Minimum 8 characters"
                  className="pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[38px] text-ink/40 hover:text-ink/70 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-line overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink/40 shrink-0">{strength.label}</span>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError('') }}
                placeholder="Re-enter your password"
                error={confirmMismatch ? 'Passwords do not match' : undefined}
                required
              />

              <label className="flex items-start gap-2.5 text-sm text-ink/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => { setAgreed(e.target.checked); if (error) setError('') }}
                  className="mt-0.5 h-4 w-4 rounded border-line text-green focus:ring-green/30"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-green font-medium hover:text-green-light transition-colors">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-green font-medium hover:text-green-light transition-colors">Privacy Policy</Link>.
                </span>
              </label>

              {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

              <Button type="submit" loading={loading} className="w-full font-semibold">
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink/50">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-green hover:text-green-light transition-colors">
                Log in here
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
                <BarrierGate open={gateOpen} />
              </div>

              {isOwner ? (
                <div>
                  <h2 className="font-display text-2xl font-bold text-white leading-snug">
                    Turn your empty space into guaranteed income.
                  </h2>

                  <div className="mt-5 space-y-3">
                    <div className="bg-white/95 rounded-lg p-3.5 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <IndianRupee size={16} className="text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">Guaranteed Payments</p>
                        <p className="text-xs text-ink/60 mt-0.5">
                          Receive secure monthly payments directly to your bank account on the 1st of every month.
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/95 rounded-lg p-3.5 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <ShieldCheck size={16} className="text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">Verified Drivers</p>
                        <p className="text-xs text-ink/60 mt-0.5">
                          All drivers are ID-verified before they can book your spot. Safety first.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {['bg-green', 'bg-amber', 'bg-navy-light'].map((bg, i) => (
                        <div key={i} className={`w-8 h-8 rounded-full ring-2 ring-navy flex items-center justify-center ${bg}`}>
                          <User size={14} className="text-white" />
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-white/80">Join 2,000+ owners earning today.</span>
                  </div>
                </div>
              ) : (
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
              )}
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
