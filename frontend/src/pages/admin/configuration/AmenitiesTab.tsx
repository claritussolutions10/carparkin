import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { getAdminAmenities, createAdminAmenity, updateAdminAmenity, type AdminAmenity } from '../../../api/admin.api'
import Input from '../../../components/common/Input'
import Button from '../../../components/common/Button'
import Toggle from '../../../components/common/Toggle'
import Modal from '../../../components/common/Modal'

export default function AmenitiesTab() {
  const [amenities, setAmenities] = useState<AdminAmenity[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminAmenity | null>(null)
  const [form, setForm] = useState({ name: '', description: '', icon: '' })
  const [saving, setSaving] = useState(false)

  const load = () => { setLoading(true); getAdminAmenities().then(setAmenities).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const openAdd = () => { setForm({ name: '', description: '', icon: '' }); setAddOpen(true) }
  const openEdit = (a: AdminAmenity) => { setForm({ name: a.name, description: a.description ?? '', icon: a.icon ?? '' }); setEditTarget(a) }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await createAdminAmenity(form); setAddOpen(false); load() } catch { /* keep modal open */ } finally { setSaving(false) }
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setSaving(true)
    try { await updateAdminAmenity(editTarget.id, form); setEditTarget(null); load() } catch { /* keep modal open */ } finally { setSaving(false) }
  }

  const toggleActive = async (a: AdminAmenity) => {
    setAmenities((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: !x.is_active } : x)))
    try { await updateAdminAmenity(a.id, { isActive: !a.is_active }) } catch { load() }
  }

  return (
    <div className="bg-white rounded-xl border border-line p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-display font-semibold text-ink">Amenities</h2>
          <p className="text-xs text-ink/40 mt-1">
            Feeds both the Owner Portal's listing-creation amenity picker and the User Portal's search filters directly — no other code change needed.
          </p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 text-sm font-medium text-green hover:text-green-light transition-colors shrink-0">
          <Plus size={14} /> Add
        </button>
      </div>

      {loading ? (
        <div className="h-24 bg-concrete rounded-lg animate-pulse mt-5" />
      ) : (
        <div className="flex flex-wrap gap-2 mt-5">
          {amenities.map((a) => (
            <div key={a.id} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${a.is_active ? 'border-line text-ink' : 'border-line text-ink/30 bg-concrete'}`}>
              {a.icon && <span>{a.icon}</span>}
              <span>{a.name}</span>
              <button onClick={() => openEdit(a)} className="text-ink/40 hover:text-green transition-colors" aria-label="Edit"><Pencil size={11} /></button>
              <Toggle checked={a.is_active} onChange={() => toggleActive(a)} />
            </div>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Amenity">
        <form onSubmit={submitAdd} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Icon (emoji)" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="🅿️" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Amenity">
        <form onSubmit={submitEdit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Input label="Icon (emoji)" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
