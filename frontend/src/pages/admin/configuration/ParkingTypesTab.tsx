import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { getAdminParkingTypes, createAdminParkingType, updateAdminParkingType, type AdminParkingType } from '../../../api/admin.api'
import Input from '../../../components/common/Input'
import Button from '../../../components/common/Button'
import Toggle from '../../../components/common/Toggle'
import Modal from '../../../components/common/Modal'

export default function ParkingTypesTab() {
  const [types, setTypes] = useState<AdminParkingType[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminParkingType | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = () => { setLoading(true); getAdminParkingTypes().then(setTypes).catch(() => {}).finally(() => setLoading(false)) }
  useEffect(load, [])

  const openAdd = () => { setForm({ name: '', description: '' }); setAddOpen(true) }
  const openEdit = (t: AdminParkingType) => { setForm({ name: t.name, description: t.description ?? '' }); setEditTarget(t) }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await createAdminParkingType(form); setAddOpen(false); load() } catch { /* keep modal open */ } finally { setSaving(false) }
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setSaving(true)
    try { await updateAdminParkingType(editTarget.id, form); setEditTarget(null); load() } catch { /* keep modal open */ } finally { setSaving(false) }
  }

  const toggleActive = async (t: AdminParkingType) => {
    setTypes((prev) => prev.map((x) => (x.id === t.id ? { ...x, is_active: !x.is_active } : x)))
    try { await updateAdminParkingType(t.id, { isActive: !t.is_active }) } catch { load() }
  }

  return (
    <div className="bg-white rounded-xl border border-line p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-display font-semibold text-ink">Parking Types</h2>
          <p className="text-xs text-ink/40 mt-1">Populates the Owner Portal's "Add Location" parking-type dropdown.</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 text-sm font-medium text-green hover:text-green-light transition-colors shrink-0">
          <Plus size={14} /> Add
        </button>
      </div>

      {loading ? (
        <div className="h-20 bg-concrete rounded-lg animate-pulse mt-5" />
      ) : (
        <div className="divide-y divide-line mt-5">
          {types.map((t) => (
            <div key={t.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
              <div className={t.is_active ? '' : 'opacity-40'}>
                <p className="text-sm font-medium text-ink">{t.name}</p>
                {t.description && <p className="text-xs text-ink/40 mt-0.5">{t.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-ink/40 hover:text-green hover:bg-green/10 transition-colors" aria-label="Edit"><Pencil size={14} /></button>
                <Toggle checked={t.is_active} onChange={() => toggleActive(t)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Parking Type">
        <form onSubmit={submitAdd} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Parking Type">
        <form onSubmit={submitEdit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
