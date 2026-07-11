import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { getOwnerSubscription, type Subscription } from '../../api/owner.api'
import { getSubscriptionPlans, type SubscriptionPlan } from '../../api/subscriptions.api'
import client from '../../api/client'
import Button from '../../components/common/Button'

function daysRemaining(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function planFeatures(plan: SubscriptionPlan): string[] {
  const lines = [plan.max_listings ? `${plan.max_listings} listings` : 'Unlimited listings']
  const f = plan.features
  if (f?.analytics) lines.push('Analytics dashboard')
  if (typeof f?.support === 'string') lines.push(`${(f.support as string).charAt(0).toUpperCase()}${(f.support as string).slice(1)} support`)
  return lines
}

export default function OwnerSubscription() {
  const [sub, setSub] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([getOwnerSubscription(), getSubscriptionPlans()])
      .then(([s, p]) => { setSub(s); setPlans(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activate = async (planId: number) => {
    setActivating(planId)
    try {
      const res = await client.post('/subscriptions/activate', { planId }).then((r) => r.data.subscription)
      setSub(res)
    } catch {} finally { setActivating(null) }
  }

  const currentPlanName = sub?.plan_name

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Subscription</h1>
        <p className="text-sm text-ink/50 mt-1">Manage your plan and billing</p>
      </div>

      {/* Current plan */}
      {!loading && sub && (
        <div className="bg-green text-white rounded-xl p-6 mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-white/60 text-sm">Current Plan</p>
            <h2 className="font-display text-2xl font-semibold mt-1">{sub.plan_name}</h2>
            <p className="text-white/60 text-sm mt-1">
              ₹{Number(sub.price).toLocaleString('en-IN')}/{sub.billing_cycle} · {sub.max_listings ? sub.max_listings : 'Unlimited'} listings · {daysRemaining(sub.end_date)} days remaining
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-white" /> Active
            </span>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = currentPlanName === plan.name
          return (
            <div key={plan.id}
              className={`bg-surface rounded-xl border-2 p-6 transition-all ${
                isCurrent ? 'border-green shadow-lg' : 'border-line hover:border-green/30'
              }`}>
              {isCurrent && (
                <span className="inline-block bg-green text-white text-xs font-medium px-2 py-0.5 rounded-full mb-3">
                  Current Plan
                </span>
              )}
              <h3 className="font-display text-lg font-semibold text-ink">{plan.name}</h3>
              <p className="font-display text-3xl font-bold text-green mt-1">
                ₹{Number(plan.price).toLocaleString('en-IN')}<span className="text-base font-normal text-ink/40">/{plan.billing_cycle === 'monthly' ? 'mo' : plan.billing_cycle}</span>
              </p>
              <ul className="space-y-2 mt-4 mb-6">
                {planFeatures(plan).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink/70">
                    <Check size={14} className="text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={isCurrent ? 'secondary' : 'primary'}
                disabled={isCurrent}
                loading={activating === plan.id}
                onClick={() => !isCurrent && activate(plan.id)}>
                {isCurrent ? 'Current Plan' : `Switch to ${plan.name}`}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
