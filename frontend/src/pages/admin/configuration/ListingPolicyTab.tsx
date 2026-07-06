import { useEffect, useState } from 'react'
import { getAdminConfig, updateAdminConfig, type PlatformConfig } from '../../../api/admin.api'
import Toggle from '../../../components/common/Toggle'

export default function ListingPolicyTab() {
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [requireApproval, setRequireApproval] = useState(false)

  useEffect(() => {
    getAdminConfig().then((c) => { setConfig(c); setRequireApproval(c.requireListingApproval) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggle = async (checked: boolean) => {
    setRequireApproval(checked)
    try {
      const updated = await updateAdminConfig({ requireListingApproval: checked })
      setConfig(updated)
    } catch { setRequireApproval(!checked) }
  }

  if (loading || !config) return <div className="h-32 bg-white rounded-xl border border-line animate-pulse" />

  return (
    <div className="bg-white rounded-xl border border-line p-6">
      <h2 className="font-display font-semibold text-ink">Listing Approval Policy</h2>
      <p className="text-xs text-ink/40 mt-1 mb-5">
        Platform-wide default for new listings — an individual owner's own preference (set in their Profile) always takes precedence over this default.
      </p>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Require admin approval for new listings by default</p>
          <p className="text-xs text-ink/40 mt-0.5">
            {requireApproval
              ? 'New listings from owners with no personal preference set stay hidden until approved here.'
              : 'New listings from owners with no personal preference set go live immediately.'}
          </p>
        </div>
        <Toggle checked={requireApproval} onChange={toggle} />
      </div>
    </div>
  )
}
