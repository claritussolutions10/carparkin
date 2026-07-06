import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, TrendingUp, Wallet, Download } from 'lucide-react'
import { getAdminRevenueReport, type RevenueReportRow, type RevenueSummary } from '../../api/admin.api'
import Select from '../../components/common/Select'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` }
function fmtMonth(m: string) {
  const [year, month] = m.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

const MONTHS_OPTIONS = [
  { value: '6', label: 'Last 6 Months' },
  { value: '12', label: 'Last 12 Months' },
  { value: '24', label: 'Last 24 Months' },
]

function downloadCsv(rows: RevenueReportRow[], filename: string) {
  const header = ['Month', 'Bookings', 'Gross Revenue', 'Commission Revenue', 'Owner Payouts']
  const lines = rows.map((r) => [fmtMonth(r.month), r.bookings, r.grossRevenue, r.commissionRevenue, r.ownerPayouts]
    .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminReports() {
  const [report, setReport] = useState<RevenueReportRow[]>([])
  const [summary, setSummary] = useState<RevenueSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState('12')

  useEffect(() => {
    setLoading(true)
    getAdminRevenueReport(Number(months))
      .then((d) => { setReport(d.report); setSummary(d.summary) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [months])

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <nav className="text-sm text-ink/40 flex items-center gap-1.5 mb-4">
        <Link to="/admin/dashboard" className="hover:text-green transition-colors">Dashboard</Link>
        <ChevronRight size={12} />
        <span className="text-ink font-medium">Reports</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Revenue & Commission Report</h1>
        <p className="text-sm text-ink/50 mt-1">Booking revenue and platform commission collected, by month.</p>
      </div>

      {summary && (
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/50">Lifetime Gross Booking Revenue</p>
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0"><TrendingUp size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-navy mt-1">{fmt(summary.lifetimeGross)}</p>
            <p className="text-xs text-ink/40 mt-1">{fmt(summary.monthGross)} this month</p>
          </div>
          <div className="bg-white rounded-xl border border-line p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink/50">Lifetime Commission Collected</p>
              <div className="w-9 h-9 rounded-lg bg-green/10 text-green flex items-center justify-center shrink-0"><Wallet size={16} /></div>
            </div>
            <p className="font-display text-2xl font-semibold text-navy mt-1">{fmt(summary.lifetimeCommission)}</p>
            <p className="text-xs text-ink/40 mt-1">{fmt(summary.monthCommission)} this month</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-line p-4 mb-6 flex flex-wrap items-center gap-3">
        <Select value={months} onChange={(e) => setMonths(e.target.value)} options={MONTHS_OPTIONS} />
        <button
          onClick={() => downloadCsv(report, `carparkin-revenue-report-${months}mo.csv`)}
          disabled={report.length === 0}
          className="ml-auto inline-flex items-center gap-2 border border-line text-ink/70 font-medium text-sm px-4 py-2 rounded-lg hover:bg-concrete transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-ink/40 uppercase tracking-wide border-b border-line bg-concrete">
                <th className="px-4 py-3 font-semibold">Month</th>
                <th className="px-4 py-3 font-semibold text-right">Bookings</th>
                <th className="px-4 py-3 font-semibold text-right">Gross Revenue</th>
                <th className="px-4 py-3 font-semibold text-right">Commission</th>
                <th className="px-4 py-3 font-semibold text-right">Owner Payouts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-8 bg-concrete rounded animate-pulse" /></td></tr>
                ))
              ) : report.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-ink/40">No confirmed bookings in this period.</td></tr>
              ) : (
                report.map((r) => (
                  <tr key={r.month} className="hover:bg-concrete/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink">{fmtMonth(r.month)}</td>
                    <td className="px-4 py-3 text-right text-ink/70">{r.bookings}</td>
                    <td className="px-4 py-3 text-right text-ink/70">{fmt(r.grossRevenue)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{fmt(r.commissionRevenue)}</td>
                    <td className="px-4 py-3 text-right text-ink/70">{fmt(r.ownerPayouts)}</td>
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
