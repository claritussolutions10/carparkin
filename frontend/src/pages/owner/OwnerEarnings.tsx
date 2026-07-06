import { useEffect, useState } from 'react'
import { getOwnerEarnings, getMonthlyEarnings, getPayouts, type MonthlyEarning, type Payout } from '../../api/owner.api'
import StatCard from '../../components/common/StatCard'
import Badge from '../../components/common/Badge'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

export default function OwnerEarnings() {
  const [summary, setSummary] = useState<any>(null)
  const [monthly, setMonthly] = useState<MonthlyEarning[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getOwnerEarnings(), getMonthlyEarnings(12), getPayouts()])
      .then(([e, m, p]) => { setSummary(e); setMonthly(m); setPayouts(p.payouts) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const chartData = monthly.map((m) => ({
    month: fmtMonth(m.month),
    Gross: Number(m.gross_amount),
    Commission: Number(m.commission),
    Net: Number(m.net_amount),
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Earnings</h1>
        <p className="text-sm text-ink/50 mt-1">Revenue overview and payout history</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-line animate-pulse" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Earned" value={fmt(summary.summary?.totalEarned ?? 0)} />
          <StatCard label="Paid Out" value={fmt(summary.summary?.paidAmount ?? 0)} />
          <StatCard label="Pending" value={fmt(summary.summary?.pendingAmount ?? 0)} accent />
          <StatCard label="Transactions" value={summary.summary?.totalTransactions ?? 0} />
        </div>
      ) : null}

      {/* Monthly chart */}
      {monthly.length > 0 && (
        <div className="bg-white rounded-xl border border-line p-5 mb-6">
          <h2 className="font-display font-semibold text-ink mb-4">Monthly Breakdown</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D7DBE0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="Gross" stroke="#1B2A4A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Net" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Commission" stroke="#F5A623" strokeWidth={1} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Payout history */}
      <div className="bg-white rounded-xl border border-line overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-display font-semibold text-ink">Payout History</h2>
        </div>
        {payouts.length === 0 ? (
          <div className="py-12 text-center text-ink/40 text-sm">No payouts yet.</div>
        ) : (
          <div className="divide-y divide-line">
            {payouts.map((p) => (
              <div key={p.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{p.listing_title}</p>
                  <p className="text-xs text-ink/40 mt-0.5">User: {p.user_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium text-ink">{fmt(p.net_amount)}</p>
                  <p className="text-xs text-ink/40">Gross: {fmt(p.gross_amount)}</p>
                </div>
                <Badge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
