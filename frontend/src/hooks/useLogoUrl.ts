import { useEffect, useState } from 'react'
import { getPublicConfig } from '../api/config.api'

// Shared by every header/sidebar that shows the brand mark - the site logo is
// admin-uploaded (Configuration > Branding & Site Media) and public/unauthenticated,
// so this is safe to call from both the public header and the authenticated portals.
// getPublicConfig() caches the underlying request, so calling this from four different
// layouts on the same page load only fires one network request.
export function useLogoUrl() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    getPublicConfig().then((c) => setLogoUrl(c.logoUrl)).catch(() => {})
  }, [])

  return logoUrl
}
