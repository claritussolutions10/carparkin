import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import {
  getAdminSubscriptionPlans, createAdminSubscriptionPlan, updateAdminSubscriptionPlan, type AdminSubscriptionPlan,
} from '../../../api/admin.api'
import Input from '../../../components/common/Input'
import Button from '../../../components/common/Button'
import Toggle from '../../../components/common/Toggle'
import Badge from '../../../components/common/Badge'
import Modal from '../../../components/common/Modal'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }

interface PlanFormState { name: string; price: string; maxListings: string; billingCycle: string; support: string; analytics: boolean }
const emptyPlanForm: PlanFormState = { name: '', price: '', maxListings: '', billingCycle: 'monthly', support: 'email', analytics: true }

export default function SubscriptionPlansTab() {
  const [plans, setPlans] = useState<AdminSubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminSubscriptionPlan | null>(null)
  const [form, setForm] = useState<PlanFormState>(emptyPlanForm)
  const [saving, setSaving] = useState(false)

  const load = () => { setLoading(true); getAdminSubscriptionPlans().then(setPlans).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const openAdd = () => { setForm(emptyPlanForm); setAddOpen(true) }
  const openEdit = (p: AdminSubscriptionPlan) => {
    setForm({
      name: p.name, price: String(p.price), maxListings: p.max_listings ? String(p.max_listings) : '',
      billingCycle: p.billing_cycle, support: (p.features?.support as string) ?? 'email', analytics: !!p.features?.analytics,
    })
    setEditTarget(p)
  }

  const toPayload = () => ({
    name: form.name,
    price: Number(form.price),
    maxListings: form.maxListings ? Number(form.maxListings) : undefined,
    billingCycle: form.billingCycle,
    features: { support: form.support, analytics: form.analytics, listings: form.maxListings ? Number(form.maxListings) : null },
  })

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await createAdminSubscriptionPlan(toPayload()); setAddOpen(false); load() } catch { /* keep modal open */ } finally { setSaving(false) }
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setSaving(true)
    try { await updateAdminSubscriptionPlan(editTarget.id, toPayload()); setEditTarget(null); load() } catch { /* keep modal open */ } finally { setSaving(false) }
  }

  const toggleActive = async (p: AdminSubscriptionPlan) => {
    setPlans((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)))
    try { await updateAdminSubscriptionPlan(p.id, { isActive: !p.is_active }) } catch { load() }
  }

  return (
    <div className="bg-white rounded-xl border border-line p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-display font-semibold text-ink">Subscription Plans</h2>
          <p className="text-xs text-ink/40 mt-1">
            The real source of truth for the Owner Portal's Subscription page — pricing/features changed here appear there immediately, no code deploy needed.
          </p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 text-sm font-medium text-green hover:text-green-light transition-colors shrink-0">
          <Plus size={14} /> Add
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-4 mt-5">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-40 bg-concrete rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4 mt-5">
          {plans.map((p) => (
            <div key={p.id} className={`rounded-xl border p-4 ${p.is_active ? 'border-line' : 'border-line opacity-50'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-display font-semibold text-ink">{p.name}</p>
                <button onClick={() => openEdit(p)} className="p-1 rounded text-ink/40 hover:text-green transition-colors" aria-label="Edit"><Pencil size={13} /></button>
              </div>
              <p className="font-display text-xl font-bold text-green mt-1">{fmt(p.price)}<span className="text-xs font-normal text-ink/40">/{p.billing_cycle}</span></p>
              <p className="text-xs text-ink/50 mt-1">{p.max_listings ? `${p.max_listings} listings` : 'Unlimited listings'}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                <Badge variant={p.is_active ? 'green' : 'gray'} label={p.is_active ? 'Active' : 'Hidden'} />
                <Toggle checked={p.is_active} onChange={() => toggleActive(p)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {[{ open: addOpen, close: () => setAddOpen(false), submit: submitAdd, title: 'Add Plan' },
        { open: !!editTarget, close: () => setEditTarget(null), submit: submitEdit, title: 'Edit Plan' }].map((m, i) => (
        <Modal key={i} open={m.open} onClose={m.close} title={m.title}>
          <form onSubmit={m.submit} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹/mo)" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
              <Input label="Max Listings (blank = unlimited)" type="number" value={form.maxListings} onChange={(e) => setForm((f) => ({ ...f, maxListings: e.target.value }))} />
            </div>
            <Input label="Support Tier" value={form.support} onChange={(e) => setForm((f) => ({ ...f, support: e.target.value }))} placeholder="email / priority / dedicated" />
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" checked={form.analytics} onChange={(e) => setForm((f) => ({ ...f, analytics: e.target.checked }))} className="h-4 w-4 rounded border-line text-green" />
              Includes analytics dashboard
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={m.close}>Cancel</Button>
              <Button type="submit" loading={saving}>Save</Button>
            </div>
          </form>
        </Modal>
      ))}
    </div>
  )
}
