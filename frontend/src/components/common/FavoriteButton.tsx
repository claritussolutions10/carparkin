import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useFavoritesStore } from '../../store/favoritesStore'
import Modal from './Modal'
import Button from './Button'

interface FavoriteButtonProps {
  listingId: string
  className?: string
  size?: number
  showLabel?: boolean
}

export default function FavoriteButton({ listingId, className = '', size = 15, showLabel = false }: FavoriteButtonProps) {
  const user = useAuthStore((s) => s.user)
  const { isFavorited, toggle, ensureLoaded } = useFavoritesStore()
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const [promptOpen, setPromptOpen] = useState(false)

  useEffect(() => {
    if (user?.role === 'user') ensureLoaded()
  }, [user?.role, ensureLoaded])

  if (user && user.role !== 'user') return null

  const favorited = user ? isFavorited(listingId) : false

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      setPromptOpen(true)
      return
    }
    toggle(listingId)
  }

  const goToLogin = () => {
    setPromptOpen(false)
    navigate(`/login?returnTo=${encodeURIComponent(routerLocation.pathname + routerLocation.search)}`)
  }

  return (
    <>
      {showLabel ? (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink/70 hover:bg-surface transition-colors ${className}`}
        >
          <Heart size={size} className={favorited ? 'text-danger fill-danger' : ''} />
          {favorited ? 'Saved' : 'Save'}
        </button>
      ) : (
        <button
          onClick={handleClick}
          aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
          className={`w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-surface transition-colors ${className}`}
        >
          <Heart size={size} className={favorited ? 'text-danger fill-danger' : 'text-ink/60'} />
        </button>
      )}

      <Modal open={promptOpen} onClose={() => setPromptOpen(false)} title="Sign in to save favorites">
        <p className="text-sm text-ink/60">Log in to save parking spots to your account and find them later.</p>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={goToLogin}>Log In</Button>
          <button
            onClick={() => setPromptOpen(false)}
            className="text-sm font-medium text-ink/50 hover:text-ink/70 transition-colors"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </>
  )
}
