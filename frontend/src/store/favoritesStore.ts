import { create } from 'zustand'
import { getFavorites, addFavorite, removeFavorite } from '../api/user.api'

interface FavoritesState {
  ids: Set<string>
  loaded: boolean
  ensureLoaded: () => Promise<void>
  toggle: (listingId: string) => Promise<void>
  isFavorited: (listingId: string) => boolean
  reset: () => void
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set(),
  loaded: false,

  ensureLoaded: async () => {
    if (get().loaded) return
    try {
      const favorites = await getFavorites()
      set({ ids: new Set(favorites.map((f) => f.id)), loaded: true })
    } catch {
      // Leave unloaded so a later mount can retry.
    }
  },

  toggle: async (listingId) => {
    const wasFavorited = get().ids.has(listingId)
    const next = new Set(get().ids)
    if (wasFavorited) next.delete(listingId)
    else next.add(listingId)
    set({ ids: next })

    try {
      if (wasFavorited) await removeFavorite(listingId)
      else await addFavorite(listingId)
    } catch {
      const reverted = new Set(get().ids)
      if (wasFavorited) reverted.add(listingId)
      else reverted.delete(listingId)
      set({ ids: reverted })
    }
  },

  isFavorited: (listingId) => get().ids.has(listingId),

  reset: () => set({ ids: new Set(), loaded: false }),
}))
