import { useEffect, useState } from 'react'
import { getAdminConfig, updateAdminConfig, type PlatformConfig } from '../../../api/admin.api'
import Button from '../../../components/common/Button'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }

export default function CommissionTab() {
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [commissionRate, setCommissionRate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getAdminConfig().then((c) => { setConfig(c); setCommissionRate(String(c.commissionRate)) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateAdminConfig({ commissionRate: Number(commissionRate) })
      setConfig(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { /* keep value in the input on failure */ } finally { setSaving(false) }
  }

  if (loading || !config) return <div className="h-40 bg-white rounded-xl border border-line animate-pulse" />

  return (
    <div className="bg-white rounded-xl border border-line p-6">
      <h2 className="font-display font-semibold text-ink">Commission & Payouts</h2>
      <p className="text-xs text-ink/40 mt-1 mb-5">
        Single rate applied to every booking platform-wide — changes take effect on the next booking calculated, affecting Owner earnings and payouts immediately.
      </p>

      <form onSubmit={save} className="flex items-end gap-3 flex-wrap">
        <div className="w-40">
          <label className="block text-xs font-semibold uppercase tracking-wide text-green mb-1.5">Commission Rate (%)</label>
          <input
            type="number" min={0} max={100} step={0.5}
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
          />
        </div>
        <Button type="submit" loading={saving}>Save</Button>
        {saved && <p className="text-sm text-green-600">Saved — applies to all new bookings.</p>}
      </form>

      <p className="text-xs text-ink/40 mt-3">
        E.g. on a {fmt(3000)} monthly booking, the platform currently keeps {fmt(3000 * (Number(commissionRate) || 0) / 100)} and the owner receives {fmt(3000 - 3000 * (Number(commissionRate) || 0) / 100)}.
      </p>
    </div>
  )
}
