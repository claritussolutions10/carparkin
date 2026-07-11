import { Link, useNavigate } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import Button from '../components/common/Button'
import PublicHeader from '../components/layout/PublicHeader'
import PublicFooter from '../components/layout/PublicFooter'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <PublicHeader />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="w-16 h-16 rounded-full bg-concrete flex items-center justify-center mb-6">
          <MapPinOff size={28} className="text-ink/30" />
        </div>
        <p className="font-display text-6xl font-bold text-ink">404</p>
        <h1 className="mt-3 font-display text-xl md:text-2xl font-semibold text-ink">This spot doesn't exist.</h1>
        <p className="mt-2 text-sm text-ink/50 max-w-sm">
          The page you're looking for may have been moved, renamed, or never existed.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
          <Link to="/"><Button>Back to Home</Button></Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
