import client from './client'

export interface SubscriptionPlan {
  id: number
  name: string
  description: string | null
  price: number
  currency: string
  max_listings: number | null
  billing_cycle: string
  features: Record<string, unknown>
  is_active: boolean
}

export const getSubscriptionPlans = () =>
  client.get<{ plans: SubscriptionPlan[] }>('/subscriptions/plans').then((r) => r.data.plans)
