import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Button from '../../components/common/Button'

export default function Home() {
  const navigate = useNavigate()
  const [city, setCity] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = city.trim() ? `?city=${encodeURIComponent(city.trim())}` : ''
    navigate(`/search${params}`)
  }

  return (
    <div className="min-h-screen bg-concrete">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(40,64,107,1)_0%,_transparent_60%)]" />

        <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
            Find your parking spot
          </h1>
          <p className="mt-4 text-white/60 text-lg max-w-md mx-auto">
            Verified monthly parking across India. Search, book, and park — in minutes.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex gap-3 max-w-md mx-auto">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city — e.g. Bangalore"
              className="flex-1 rounded-lg border border-line bg-white px-4 py-3 font-body text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-amber"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {[
            { title: 'Search', desc: 'Find verified parking near your home or office.' },
            { title: 'Book', desc: 'Reserve your monthly spot in a few clicks.' },
            { title: 'Park', desc: 'Show up and park. No daily hassle.' },
          ].map((step, i) => (
            <div key={step.title}>
              <div className="w-10 h-10 rounded-full bg-navy text-white font-display font-semibold text-sm flex items-center justify-center mx-auto">
                {i + 1}
              </div>
              <h3 className="font-display font-semibold text-ink mt-3">{step.title}</h3>
              <p className="text-sm text-ink/50 mt-1">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
