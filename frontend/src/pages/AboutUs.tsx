import { Link } from 'react-router-dom'
import { Target, Eye, ShieldCheck, Zap, Users, Leaf, Quote } from 'lucide-react'
import Button from '../components/common/Button'
import PublicHeader from '../components/layout/PublicHeader'
import PublicFooter from '../components/layout/PublicFooter'
import CitySkyline from '../components/common/CitySkyline'

const PILLARS = [
  {
    icon: Target,
    title: 'Our Mission',
    body: 'To eliminate the anxiety of urban parking by providing a trusted, transparent, and technology-driven marketplace that connects drivers with the perfect spot, every time.',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    body: 'To build smarter, less congested cities where space is utilized efficiently, traffic from circling vehicles is reduced, and parking is seamlessly integrated into the urban lifestyle.',
  },
]

const TIMELINE = [
  { year: '2021', text: 'The idea sparks in a crowded downtown coffee shop after 40 minutes looking for parking.' },
  { year: '2022', text: 'Carparkin launches beta in 3 neighborhoods with 50 parking spots.' },
  { year: 'Today', text: 'Over 5,000 monthly active users and expanding to major metros nationwide.' },
]

const VALUES = [
  { icon: ShieldCheck, title: 'Trust First', text: 'We verify every location and owner. Safety and reliability are non-negotiable.' },
  { icon: Zap, title: 'Simplicity', text: 'Complex problems need simple solutions. We design for ease of use always.' },
  { icon: Users, title: 'Community', text: 'We support local neighborhoods by helping residents earn from their assets.' },
  { icon: Leaf, title: 'Sustainability', text: 'Reducing cruising time means reducing emissions. We care about our footprint.' },
]

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative mt-6 md:mt-8 rounded-xl overflow-hidden bg-navy min-h-[320px] md:h-[380px] flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy to-navy-light" />
          <CitySkyline className="absolute bottom-0 left-0 w-full h-2/3 text-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="relative px-6 py-10 md:px-10 flex flex-col items-center">
            <span className="inline-flex items-center rounded-full bg-green px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              About Us
            </span>
            <h1 className="mt-4 font-display font-bold text-white text-3xl md:text-5xl leading-tight max-w-2xl">
              Reimagining urban parking for a smarter future.
            </h1>
            <p className="mt-4 text-white/85 font-body text-sm md:text-base max-w-[600px]">
              We are on a mission to simplify city living by connecting drivers with secure, affordable, and convenient monthly parking spaces.
            </p>
          </div>
        </section>

        {/* More than just a parking platform */}
        <section className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">More than just a parking platform.</h2>
            <p className="mt-4 text-sm md:text-base text-ink/60 leading-relaxed">
              Carparkin was born from a simple observation: finding reliable monthly parking in growing cities is harder than it should be. Drivers circle blocks endlessly while private spaces sit empty. We realized there was a disconnect in the urban grid.
            </p>
            <p className="mt-4 text-sm md:text-base text-ink/60 leading-relaxed">
              We created a digital marketplace that bridges this gap. By empowering property owners to monetize their unused space and giving drivers a transparent, seamless booking experience, we're optimizing how cities utilize space.
            </p>
            <p className="mt-4 text-sm md:text-base text-ink/60 leading-relaxed">
              Today, we support thousands of monthly commuters, residents, and fleet owners, transforming the stressful daily hunt for parking into a guaranteed peace of mind.
            </p>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-navy to-navy-light overflow-hidden flex items-center justify-center">
              <CitySkyline className="w-full h-2/3 text-white/15 self-end" />
            </div>
            <div className="hidden sm:block absolute -bottom-6 -right-4 md:-right-8 max-w-[280px] bg-white rounded-lg shadow-lg border border-line p-5">
              <Quote className="text-green" size={20} />
              <p className="mt-2 font-body italic text-sm text-ink/70 leading-relaxed">
                We believe parking shouldn't be a daily struggle. It should be the easiest part of your journey.
              </p>
            </div>
          </div>
        </section>

        {/* Driven by purpose */}
        <section className="mt-24 md:mt-28 -mx-4 sm:-mx-6 lg:-mx-8 bg-concrete py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">Driven by Purpose</h2>
              <p className="mt-3 text-sm md:text-base text-ink/60">
                Our goals go beyond booking spots. We are shaping the infrastructure of modern mobility.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="bg-white rounded-xl border border-line p-6 md:p-8">
                  <div className="w-11 h-11 rounded-lg bg-green flex items-center justify-center">
                    <pillar.icon className="text-white" size={20} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">{pillar.title}</h3>
                  <p className="mt-2 text-sm text-ink/60 leading-relaxed">{pillar.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story + Core Values */}
        <section className="mt-24 md:mt-28 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Our Story</h2>
            <div className="mt-6 relative pl-6">
              <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-line" />
              <div className="space-y-8">
                {TIMELINE.map((item) => (
                  <div key={item.year} className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-green" />
                    <p className="font-display font-semibold text-sm text-green">{item.year}</p>
                    <p className="mt-1 text-sm text-ink/60 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Core Values</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {VALUES.map((value) => (
                <div key={value.title}>
                  <div className="w-9 h-9 rounded-lg bg-green flex items-center justify-center">
                    <value.icon className="text-white" size={16} />
                  </div>
                  <h3 className="mt-3 font-display font-semibold text-sm text-ink">{value.title}</h3>
                  <p className="mt-1 text-sm text-ink/60 leading-relaxed">{value.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mt-24 md:mt-28 mb-16 rounded-xl bg-navy p-8 md:p-14 flex flex-col items-center text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white max-w-xl">
            Be part of the solution.
          </h2>
          <p className="mt-3 text-white/70 text-sm md:text-base max-w-xl">
            Whether you are looking for a spot, have a spot to list, or want to join our team, we'd love to have you onboard.
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
