import client from './client'

export interface PublicConfig {
  commissionRate: number
  supportPhone: string
  supportEmail: string
  supportHours: string
  logoUrl: string | null
  heroImageUrl: string | null
}

// Rarely changes and is fetched from several unrelated places (header, sidebars,
// homepage hero) - cache the in-flight/resolved promise so we don't fire off a
// request per consumer on every page load.
let cachedPublicConfig: Promise<PublicConfig> | null = null

export const getPublicConfig = () => {
  if (!cachedPublicConfig) {
    cachedPublicConfig = client.get<{ config: PublicConfig }>('/config/public').then((r) => r.data.config)
    cachedPublicConfig.catch(() => { cachedPublicConfig = null })
  }
  return cachedPublicConfig
}
