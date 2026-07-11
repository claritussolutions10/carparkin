import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPin, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Button from '../../components/common/Button'
import authImage from '../../assets/auth-illustration.png'
import { verifyEmail } from '../../api/auth.api'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const requestedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('This verification link is missing its token.')
      return
    }
    // The token is single-use server-side, so a duplicate call (e.g. React
    // StrictMode's double-invoked effect in dev) would fail the second time
    // and flip a genuinely successful verification to an error state.
    if (requestedRef.current === token) return
    requestedRef.current = token

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setError(err?.response?.data?.error || 'This verification link is invalid or has expired.')
      })
  }, [token])

  return (
    <div className="min-h-screen bg-concrete flex flex-col">
      <header className="bg-surface border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <MapPin className="text-green" size={24} fill="currentColor" strokeWidth={1.5} />
            <span className="font-display text-lg font-semibold text-ink">Carparkin.in</span>
          </Link>
          <Link
            to="/login"
            className="rounded-full bg-green-100 text-green-700 text-sm font-medium px-4 py-2 hover:bg-green-200 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-[1200px] bg-surface rounded-xl shadow-lg border border-line overflow-hidden grid grid-cols-1 md:grid-cols-2">
          <div className="p-8 md:p-12 flex flex-col justify-center">
            {status === 'loading' && (
              <>
                <div className="w-12 h-12 rounded-full bg-concrete flex items-center justify-center mb-4">
                  <Loader2 size={20} className="text-ink/40 animate-spin" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Verifying your email...</h1>
                <p className="mt-2 text-sm text-ink/50">This will only take a moment.</p>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mb-4">
                  <CheckCircle2 size={20} className="text-green" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Email verified</h1>
                <p className="mt-2 text-sm text-ink/50">Your email address has been confirmed. You're all set.</p>
                <Link to="/login" className="mt-6 inline-flex items-center justify-center rounded-lg bg-green text-white font-medium text-sm px-5 py-2.5 hover:bg-green-light transition-colors w-fit">
                  Continue to Login
                </Link>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-4">
                  <XCircle size={20} className="text-danger" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Verification failed</h1>
                <p className="mt-2 text-sm text-ink/50">{error}</p>
                <p className="mt-4 text-sm text-ink/50">You can request a new verification email from Profile & Settings after logging in.</p>
                <Link to="/login">
                  <Button className="mt-4">Back to Login</Button>
                </Link>
              </>
            )}
          </div>

          <div className="hidden md:flex relative bg-navy">
            <img src={authImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="relative flex-1 flex flex-col justify-end p-8">
              <div>
                <div className="w-10 h-10 rounded-lg bg-green flex items-center justify-center">
                  <span className="font-display font-bold text-white">P</span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold text-white leading-snug">
                  One less thing to worry about.
                </h2>
                <p className="mt-2 text-sm text-white/85 max-w-xs">
                  A verified email keeps your account secure and your booking receipts reachable.
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
