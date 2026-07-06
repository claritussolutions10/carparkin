import { useEffect, useState } from 'react'
import { getAdminConfig, updateAdminConfig, type PlatformConfig } from '../../../api/admin.api'
import Input from '../../../components/common/Input'
import Button from '../../../components/common/Button'

export default function SupportTab() {
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [hours, setHours] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getAdminConfig().then((c: PlatformConfig) => {
      setPhone(c.supportPhone ?? '')
      setEmail(c.supportEmail ?? '')
      setHours(c.supportHours ?? '')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateAdminConfig({ supportPhone: phone, supportEmail: email, supportHours: hours })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { /* keep values in the form on failure */ } finally { setSaving(false) }
  }

  if (loading) return <div className="h-56 bg-white rounded-xl border border-line animate-pulse" />

  return (
    <div className="bg-white rounded-xl border border-line p-6">
      <h2 className="font-display font-semibold text-ink">Support & Contact</h2>
      <p className="text-xs text-ink/40 mt-1 mb-5">
        Shown on the User Portal's Help & Support page — one place to update it everywhere.
      </p>

      <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
        <Input label="Support Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 1800-123-4567" />
        <Input label="Support Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@carparkin.in" />
        <div className="sm:col-span-2">
          <Input label="Support Hours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="9:00 AM - 9:00 PM IST, all days" />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <Button type="submit" loading={saving}>Save</Button>
          {saved && <p className="text-sm text-green-600">Saved.</p>}
        </div>
      </form>
    </div>
  )
}
