import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Search, CalendarCheck, Wallet } from 'lucide-react'
import Button from '../../components/common/Button'
import PublicHeader from '../../components/layout/PublicHeader'
import PublicFooter from '../../components/layout/PublicFooter'
import { getSubscriptionPlans, type SubscriptionPlan } from '../../api/subscriptions.api'

function fmt(n: number) {
  return `₹${Number(n).toLocaleString('en-IN')}`
}

function planFeatures(plan: SubscriptionPlan): string[] {
  const lines = [plan.max_listings ? `${plan.max_listings} active listings` : 'Unlimited listings']
  const f = plan.features
  if (f?.analytics) lines.push('Analytics dashboard')
  if (typeof f?.support === 'string') lines.push(`${(f.support as string).charAt(0).toUpperCase()}${(f.support as string).slice(1)} support`)
  return lines
}

const DRIVER_STEPS = [
  { icon: Search, title: 'Search for free', text: 'Browse verified monthly parking spots near you at no cost — no account or subscription required.' },
  { icon: CalendarCheck, title: 'Book what you need', text: 'Reserve a spot for the duration you choose. You only ever pay for the parking you actually book.' },
  { icon: Wallet, title: 'No hidden fees', text: 'The price shown on a listing is the price you pay. No platform subscription for drivers, ever.' },
]

export default function Pricing() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSubscriptionPlans().then(setPlans).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const activePlans = plans.filter((p) => p.is_active)

  return (
    <div className="min-h-screen bg-surface">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mt-6 md:mt-8 rounded-xl bg-navy py-14 md:py-20 px-6 text-center">
          <span className="inline-flex items-center rounded-full bg-green px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            Pricing
          </span>
          <h1 className="mt-4 font-display font-bold text-white text-3xl md:text-5xl leading-tight max-w-2xl mx-auto">
            Simple, transparent pricing for everyone.
          </h1>
          <p className="mt-4 text-white/85 font-body text-sm md:text-base max-w-xl mx-auto">
            Free to search and book as a driver. Flexible plans for owners who want to list their space.
          </p>
        </section>

        {/* Drivers */}
        <section className="mt-16 md:mt-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">For Drivers — always free</h2>
            <p className="mt-3 text-sm md:text-base text-ink/60">
              There's no subscription or membership fee to find and book parking on Carparkin.in. You only pay for the spot you reserve.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {DRIVER_STEPS.map((step) => (
              <div key={step.title} className="bg-surface rounded-xl border border-line p-6">
                <div className="w-11 h-11 rounded-lg bg-green flex items-center justify-center">
                  <step.icon className="text-white" size={20} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-ink/60 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/search">
              <Button>Find Parking</Button>
            </Link>
          </div>
        </section>

        {/* Owners */}
        <section className="mt-24 md:mt-28 -mx-4 sm:-mx-6 lg:-mx-8 bg-concrete py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">For Owners — plans that grow with you</h2>
              <p className="mt-3 text-sm md:text-base text-ink/60">
                List your space and earn. Pick the plan that matches how many spots you manage.
              </p>
            </div>

            {loading ? (
              <div className="mt-10 grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-64 bg-surface rounded-xl border border-line animate-pulse" />)}
              </div>
            ) : activePlans.length === 0 ? (
              <p className="mt-10 text-center text-sm text-ink/50">Plans are being updated — check back shortly.</p>
            ) : (
              <div className="mt-10 grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">
                {activePlans.map((plan) => (
                  <div key={plan.id} className="bg-surface rounded-xl border border-line p-6 flex flex-col">
                    <h3 className="font-display text-lg font-semibold text-ink">{plan.name}</h3>
                    {plan.description && <p className="mt-1 text-xs text-ink/50">{plan.description}</p>}
                    <p className="font-display text-3xl font-bold text-green mt-3">
                      {fmt(plan.price)}
                      <span className="text-base font-normal text-ink/40">/{plan.billing_cycle === 'monthly' ? 'mo' : plan.billing_cycle}</span>
                    </p>
                    <ul className="space-y-2 mt-4 mb-6 flex-1">
                      {planFeatures(plan).map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-ink/70">
                          <Check size={14} className="text-green-500 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/signup">
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mt-24 md:mt-28 mb-16 rounded-xl bg-navy p-8 md:p-14 flex flex-col items-center text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white max-w-xl">
            Still deciding?
          </h2>
          <p className="mt-3 text-white/70 text-sm md:text-base max-w-xl">
            Search for a spot with no commitment, or list your space and start earning today.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link to="/search" className="w-full sm:w-auto">
              <Button className="w-full">Find a Spot</Button>
            </Link>
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full !border-white/30 !text-white hover:!border-white"
              >
                List Your Space
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
