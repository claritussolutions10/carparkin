import client from './client'

export interface PublicConfig {
  commissionRate: number
  supportPhone: string
  supportEmail: string
  supportHours: string
}

export const getPublicConfig = () =>
  client.get<{ config: PublicConfig }>('/config/public').then((r) => r.data.config)
