import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Mail } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import BarrierGate from '../../components/common/BarrierGate'
import CitySkyline from '../../components/common/CitySkyline'
import { forgotPassword } from '../../api/auth.api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
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
          <Link
            to="/login"
            className="rounded-full bg-green-100 text-ink text-sm font-medium px-4 py-2 hover:bg-green-200 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-[1200px] bg-white rounded-xl shadow-lg border border-line overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left: form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            {sent ? (
              <>
                <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mb-4">
                  <Mail size={20} className="text-green" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Check your email</h1>
                <p className="mt-2 text-sm text-ink/50">
                  If an account exists for <span className="font-medium text-ink">{email}</span>, we've sent a link to reset your password. It expires in 30 minutes.
                </p>
                <Link to="/login" className="mt-6 inline-flex items-center justify-center rounded-lg bg-green text-white font-medium text-sm px-5 py-2.5 hover:bg-green-light transition-colors">
                  Back to Login
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Forgot your password?</h1>
                <p className="mt-2 text-sm text-ink/50">Enter your email and we'll send you a link to reset it.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
                    placeholder="name@example.com"
                    required
                  />

                  {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

                  <Button type="submit" loading={loading} className="w-full font-semibold">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-ink/50">
                  Remembered it?{' '}
                  <Link to="/login" className="font-medium text-green hover:text-green-light transition-colors">Log in</Link>
                </p>
              </>
            )}
          </div>

          {/* Right: image + barrier */}
          <div className="hidden md:flex relative bg-navy">
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-light" />
            <CitySkyline className="absolute bottom-0 left-0 w-full h-1/2 text-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="relative flex-1 flex flex-col justify-between p-8">
              <div className="flex justify-center pt-4">
                <BarrierGate open={sent} />
              </div>

              <div>
                <div className="w-10 h-10 rounded-lg bg-green flex items-center justify-center">
                  <span className="font-display font-bold text-white">P</span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-white leading-snug">
                  We've got you covered.
                </h2>
                <p className="mt-2 text-sm text-white/85 max-w-xs">
                  Account recovery takes less than a minute — you'll be back to finding parking in no time.
                </p>
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
