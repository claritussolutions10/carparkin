import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, ShieldCheck, ParkingSquare, CalendarDays, Car, HelpCircle, Download,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { getAdminDashboard, getBookingVolume, getAdminTransactions, type AdminStats, type BookingVolumePoint, type AdminTransaction } from '../../api/admin.api'
import StatCard from '../../components/common/StatCard'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Badge from '../../components/common/Badge'
import NotificationBell from '../../components/common/NotificationBell'
import { useThemeStore } from '../../store/themeStore'
import { chartTheme } from '../../lib/chartTheme'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
function fmtChartDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }

function Trend({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-ink/40 mt-1 block">New this month</span>
  const positive = pct >= 0
  return (
    <span className={`text-xs mt-1 block font-medium ${positive ? 'text-green-600' : 'text-danger'}`}>
      {positive ? '+' : ''}{pct}% <span className="text-ink/40 font-normal">vs last month</span>
    </span>
  )
}

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
]

function paymentLabel(status: string) {
  if (status === 'completed') return 'Paid'
  if (status === 'pending') return 'Pending'
  return 'Failed'
}

export default function AdminDashboard() {
  const { theme } = useThemeStore()
  const { grid, tick } = chartTheme(theme === 'dark')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [range, setRange] = useState('30')
  const [volume, setVolume] = useState<BookingVolumePoint[]>([])

  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [txLoading, setTxLoading] = useState(true)

  useEffect(() => {
    const load = () => getAdminDashboard().then(setStats).catch(() => {}).finally(() => setLoading(false))
    load()
    // No live-occupancy websocket exists yet — poll the snapshot every 30s instead.
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    getBookingVolume(Number(range)).then(setVolume).catch(() => {})
  }, [range])

  useEffect(() => {
    setTxLoading(true)
    getAdminTransactions({ limit: 10 }).then((d) => setTransactions(d.bookings)).catch(() => {}).finally(() => setTxLoading(false))
  }, [])

  const occupancyPct = stats && stats.totalSpaces > 0
    ? Math.round(((stats.totalSpaces - stats.availableSpaces) / stats.totalSpaces) * 100)
    : 0

  const downloadCsv = () => {
    const header = ['Transaction ID', 'User', 'Parking Location', 'Amount', 'Status', 'Date']
    const lines = transactions.map((t) => [
      t.id, t.user_name, t.listing_title, t.total_price, paymentLabel(t.payment_status), t.created_at,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Dashboard Overview</h1>
        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search users, bookings..." className="w-64 hidden sm:block" />
          <NotificationBell />
          <button
            title="Help"
            className="w-10 h-10 rounded-full bg-surface border border-line shadow-sm flex items-center justify-center text-ink/60 hover:text-green transition-colors"
            aria-label="Help"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-28 rounded-xl bg-line animate-pulse" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Users" value={stats.totalUsers.toLocaleString('en-IN')}
            icon={<Users size={16} />} iconClassName="bg-blue-100 text-blue-500"
            sub={<Trend pct={stats.trends.users} />} />
          <StatCard label="Total Owners" value={stats.totalOwners.toLocaleString('en-IN')}
            icon={<ShieldCheck size={16} />} iconClassName="bg-purple-100 text-purple-500"
            sub={<Trend pct={stats.trends.owners} />} />
          <StatCard label="Total Parkings" value={stats.totalListings.toLocaleString('en-IN')}
            icon={<ParkingSquare size={16} />} iconClassName="bg-green/10 text-green"
            sub={<Trend pct={stats.trends.listings} />} />
          <StatCard label="Total Bookings" value={stats.totalBookings.toLocaleString('en-IN')}
            icon={<CalendarDays size={16} />} iconClassName="bg-amber/10 text-amber-700"
            sub={<Trend pct={stats.trends.bookings} />} />
          <StatCard label="Total Cars" value={stats.totalVehicles.toLocaleString('en-IN')}
            icon={<Car size={16} />} iconClassName="bg-orange-100 text-orange-500"
            sub={<Trend pct={stats.trends.vehicles} />} />
        </div>
      )}

      {/* Chart row */}
      <div className="grid lg:grid-cols-[65fr_35fr] gap-6 mb-6">
        <div className="bg-surface rounded-xl border border-line p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-ink">Monthly Booking Volume</h2>
              <p className="text-xs text-ink/40 mt-0.5">Trend over the selected period</p>
            </div>
            <Select options={RANGE_OPTIONS} value={range} onChange={(e) => setRange(e.target.value)} />
          </div>
          {volume.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-ink/40">No booking data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={volume} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bookingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtChartDate} tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [`${v} Bookings`, '']} labelFormatter={fmtChartDate} />
                <Area type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} fill="url(#bookingFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-line p-5">
          <h2 className="font-display font-semibold text-ink">Live Activity</h2>
          <p className="text-xs text-ink/40 mt-0.5 mb-4">Current active parking spots</p>

          <div className="grid grid-cols-8 gap-1.5 mb-4">
            {Array.from({ length: 40 }, (_, i) => {
              const filled = i < Math.round((occupancyPct / 100) * 40)
              return (
                <div key={i} className={`aspect-square rounded ${filled ? 'bg-green' : 'bg-concrete border border-line'}`} />
              )
            })}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-ink/60">
              <span className="w-2 h-2 rounded-full bg-green inline-block" /> Occupied ({occupancyPct}%)
            </span>
            <span className="flex items-center gap-1.5 text-ink/60">
              <span className="w-2 h-2 rounded-full bg-concrete border border-line inline-block" /> Available ({100 - occupancyPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-surface rounded-xl border border-line p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-display font-semibold text-ink">Recent Transactions</h2>
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 bg-green text-white font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-green-light transition-colors shrink-0"
          >
            <Download size={16} /> Export Data
          </button>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink/40 uppercase tracking-wide border-b border-line">
                <th className="px-5 py-2.5 font-semibold">Transaction ID</th>
                <th className="px-5 py-2.5 font-semibold">User</th>
                <th className="px-5 py-2.5 font-semibold">Parking Location</th>
                <th className="px-5 py-2.5 font-semibold">Amount</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
                <th className="px-5 py-2.5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {txLoading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="h-5 bg-concrete rounded animate-pulse" /></td></tr>
                ))
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-ink/40">No transactions yet.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-concrete/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-green">
                      <Link to={`/admin/bookings`} className="hover:underline">{t.id.slice(0, 12)}…</Link>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-navy text-white text-xs flex items-center justify-center font-medium shrink-0">
                          {t.user_name?.[0] ?? '?'}
                        </div>
                        <span className="text-ink truncate">{t.user_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink/70 truncate max-w-[200px]">{t.listing_title}</td>
                    <td className="px-5 py-3 font-medium text-ink">{fmt(t.total_price)}</td>
                    <td className="px-5 py-3"><Badge status={t.payment_status} label={paymentLabel(t.payment_status)} /></td>
                    <td className="px-5 py-3 text-ink/50">{fmtDate(t.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
