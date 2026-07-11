import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { Plus, IndianRupee, Car, MapPin, ArrowUp, ArrowDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { getOwnerDashboard, getMonthlyEarnings, type OwnerDashboard, type MonthlyEarning } from '../../api/owner.api'
import { getOwnerParkings, type OwnerParking } from '../../api/parkings.api'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import { chartTheme } from '../../lib/chartTheme'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
function fmtMonth(d: string) { return new Date(d).toLocaleDateString('en-IN', { month: 'short' }) }

const RANGE_OPTIONS = [
  { value: '6', label: 'Last 6 Months' },
  { value: '12', label: 'Last 12 Months' },
]

function occupancyTone(pct: number) {
  if (pct >= 80) return { text: 'text-green-700', bar: 'bg-green' }
  if (pct >= 50) return { text: 'text-amber-700', bar: 'bg-amber' }
  return { text: 'text-danger', bar: 'bg-danger' }
}

function TrendRow({ pct, caption }: { pct: number | null; caption: string }) {
  if (pct === null) {
    return <p className="text-xs text-ink/40 mt-1">{caption}</p>
  }
  const up = pct >= 0
  return (
    <p className="text-xs mt-1 flex items-center gap-1">
      <span className={`flex items-center gap-0.5 font-medium ${up ? 'text-green' : 'text-danger'}`}>
        {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
        {Math.abs(Math.round(pct))}%
      </span>
      <span className="text-ink/40">{caption}</span>
    </p>
  )
}

export default function OwnerDashboardPage() {
  const { user } = useAuthStore()
  const { theme } = useThemeStore()
  const { grid, tick } = chartTheme(theme === 'dark')
  const navigate = useNavigate()

  const [data, setData] = useState<OwnerDashboard | null>(null)
  const [monthly, setMonthly] = useState<MonthlyEarning[]>([])
  const [locations, setLocations] = useState<OwnerParking[]>([])
  const [range, setRange] = useState('6')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getOwnerDashboard(), getMonthlyEarnings(Number(range)), getOwnerParkings()])
      .then(([dash, months, parkings]) => { setData(dash); setMonthly(months); setLocations(parkings) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [range])

  const revenueTrendPct = useMemo(() => {
    const sorted = [...monthly].sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
    const [current, previous] = sorted
    if (!current || !previous || Number(previous.net_amount) === 0) return null
    return ((Number(current.net_amount) - Number(previous.net_amount)) / Number(previous.net_amount)) * 100
  }, [monthly])

  const chartData = useMemo(() => (
    [...monthly]
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .map((m) => ({ month: fmtMonth(m.month), revenue: Number(m.net_amount) }))
  ), [monthly])

  const locationRows = useMemo(() => locations.map((l) => {
    const filled = l.total_spaces - l.available_spaces
    const pct = l.total_spaces > 0 ? Math.round((filled / l.total_spaces) * 100) : 0
    return { id: l.id, name: l.title, filled, total: l.total_spaces, pct }
  }), [locations])

  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  const filledSpaces = data ? data.listings.totalSpaces - data.listings.availableSpaces : 0
  const occupancyPct = data && data.listings.totalSpaces > 0
    ? Math.round((filledSpaces / data.listings.totalSpaces) * 100)
    : 0

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Welcome back, {firstName}</h1>
          <p className="text-sm text-ink/50 mt-1">Here's what's happening with your parking locations today.</p>
        </div>
        <Link to="/owner/locations">
          <button className="inline-flex items-center gap-2 bg-green text-white font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-green-light transition-colors shrink-0">
            <Plus size={16} /> Add New Location
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-28 bg-surface rounded-xl border border-line animate-pulse" />)}
        </div>
      ) : data ? (
        <>
          {/* Stat cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <StatCard
              label="Total Revenue (Monthly)"
              value={fmt(data.earnings.thisMonth)}
              icon={<IndianRupee size={16} />}
              iconClassName="bg-green-100 text-green-700"
              sub={<TrendRow pct={revenueTrendPct} caption="vs last month" />}
            />
            <StatCard
              label="Active Bookings"
              value={<>{filledSpaces} <span className="text-base font-normal text-ink/40">/ {data.listings.totalSpaces}</span></>}
              icon={<Car size={16} />}
              iconClassName="bg-blue-100 text-blue-500"
              sub={<p className="text-xs text-ink/40 mt-1">{occupancyPct}% occupancy rate</p>}
            />
            <StatCard
              label="Total Locations"
              value={data.listings.total}
              icon={<MapPin size={16} />}
              iconClassName="bg-orange-100 text-orange-500"
              sub={<p className="text-xs text-ink/40 mt-1">— 0% new locations</p>}
            />
          </div>

          {/* Revenue Overview + Location Status */}
          <div className="grid lg:grid-cols-[65fr_35fr] gap-6 mb-6">
            <div className="bg-surface rounded-xl border border-line p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-ink">Revenue Overview</h2>
                <Select
                  options={RANGE_OPTIONS}
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                />
              </div>
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-ink/40">No revenue data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: tick }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-surface rounded-xl border border-line p-5">
              <h2 className="font-display font-semibold text-ink mb-4">Location Status</h2>
              {locationRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-ink/40">No locations yet.</div>
              ) : (
                <div className="space-y-5">
                  {locationRows.map((l) => {
                    const tone = occupancyTone(l.pct)
                    return (
                      <Link key={l.id} to={`/owner/locations/${l.id}/members`} className="block group">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink truncate group-hover:text-green transition-colors">{l.name}</p>
                          <span className={`text-sm font-semibold shrink-0 ${tone.text}`}>{l.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-line overflow-hidden mt-2">
                          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${l.pct}%` }} />
                        </div>
                        <p className="text-xs text-ink/40 mt-1">{l.filled}/{l.total} spots taken</p>
                      </Link>
                    )
                  })}
                </div>
              )}
              <Link to="/owner/locations" className="block text-center text-sm font-medium text-green hover:text-green-light transition-colors mt-5">
                View All Locations
              </Link>
            </div>
          </div>

          {/* Recent Bookings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-ink">Recent Bookings</h2>
              <button onClick={() => navigate('/owner/bookings')} className="text-sm font-medium text-green hover:text-green-light transition-colors">
                View All
              </button>
            </div>

            <div className="bg-surface rounded-xl border border-line overflow-hidden">
              {data.recentBookings.length === 0 ? (
                <div className="py-14 text-center text-sm text-ink/40">No bookings yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Driver</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Car Details</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Location</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Date</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40 text-right">Amount</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink/40 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {data.recentBookings.slice(0, 5).map((b) => (
                        <tr key={b.id}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-medium flex items-center justify-center shrink-0">
                                {b.user_name?.[0] ?? '?'}
                              </div>
                              <span className="font-medium text-ink whitespace-nowrap">{b.user_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {b.make ? (
                              <>
                                <p className="font-medium text-ink">{b.make} {b.model}</p>
                                <p className="text-xs font-mono text-ink/40 mt-0.5">{b.registration_number}</p>
                              </>
                            ) : <span className="text-ink/30">—</span>}
                          </td>
                          <td className="px-5 py-4 text-ink/70 whitespace-nowrap">{b.listing_title}</td>
                          <td className="px-5 py-4 text-ink/70 whitespace-nowrap">{fmtDate(b.booking_start_date)}</td>
                          <td className="px-5 py-4 text-right font-semibold text-ink whitespace-nowrap">{fmt(b.total_price)}</td>
                          <td className="px-5 py-4 text-right"><Badge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {data.listings.total === 0 && (
            <div className="mt-6 bg-amber/10 border border-amber/20 rounded-xl px-5 py-4 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-ink">You haven't added any parking locations yet.</p>
              <Link to="/owner/locations" className="text-sm font-medium text-ink hover:underline">
                Add your first location →
              </Link>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
