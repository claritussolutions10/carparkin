import { useEffect, useState } from 'react'
import { Car, Plus, Trash2, Star } from 'lucide-react'
import { getVehicles, addVehicle, removeVehicle, type Vehicle, type VehicleInput } from '../../api/user.api'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'

const VEHICLE_TYPES = ['car', 'bike', 'auto', 'suv', 'truck']

export default function UserVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<VehicleInput>({
    vehicle_type: 'car', registration_number: '', make: '', model: '', color: '', is_primary: false,
  })

  useEffect(() => {
    getVehicles().then(setVehicles).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const v = await addVehicle(form)
      setVehicles((prev) => [...prev, v])
      setShowAdd(false)
      setForm({ vehicle_type: 'car', registration_number: '', make: '', model: '', color: '', is_primary: false })
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await removeVehicle(deleteTarget.id)
      setVehicles((prev) => prev.filter((v) => v.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {} finally { setDeleting(false) }
  }

  const set = (key: keyof VehicleInput, val: any) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">My Vehicles</h1>
          <p className="text-sm text-ink/50 mt-1">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Vehicle
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }, (_, i) => <div key={i} className="h-24 bg-white rounded-xl border border-line animate-pulse" />)}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-xl border border-line p-12 text-center">
          <Car size={40} className="text-ink/20 mx-auto mb-3" />
          <p className="font-medium text-ink">No vehicles yet</p>
          <p className="text-sm text-ink/50 mt-1 mb-4">Add your vehicle to start booking parking spots.</p>
          <Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Vehicle</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${v.is_primary ? 'border-green' : 'border-line'}`}>
              <div className="w-12 h-12 rounded-xl bg-green/10 flex items-center justify-center">
                <Car size={20} className="text-green" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">{v.make} {v.model}</p>
                  {v.is_primary && (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber/10 px-2 py-0.5 rounded-full">
                      <Star size={10} fill="currentColor" /> Primary
                    </span>
                  )}
                </div>
                <p className="text-sm font-mono text-ink/60 mt-0.5">{v.registration_number}</p>
                <p className="text-xs text-ink/40 mt-0.5 capitalize">
                  {v.vehicle_type}{v.color ? ` · ${v.color}` : ''}{v.year_manufactured ? ` · ${v.year_manufactured}` : ''}
                </p>
              </div>
              <button onClick={() => setDeleteTarget(v)}
                className="p-2 text-ink/30 hover:text-danger hover:bg-danger/5 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Vehicle">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Vehicle Type</label>
            <Select value={form.vehicle_type} onChange={(e) => set('vehicle_type', e.target.value)}
              className="w-full"
              options={VEHICLE_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />
          </div>
          <Input label="Registration Number" placeholder="DL-01-AB-1234" value={form.registration_number}
            onChange={(e) => set('registration_number', e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Make" placeholder="Toyota" value={form.make} onChange={(e) => set('make', e.target.value)} required />
            <Input label="Model" placeholder="Camry" value={form.model} onChange={(e) => set('model', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Color (optional)" placeholder="Silver" value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} />
            <Input label="Year (optional)" placeholder="2022" type="number"
              value={form.year_manufactured ?? ''} onChange={(e) => set('year_manufactured', Number(e.target.value))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_primary} onChange={(e) => set('is_primary', e.target.checked)}
              className="rounded border-line" />
            <span className="text-sm text-ink">Set as primary vehicle</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Add Vehicle</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove vehicle"
        message={`Remove ${deleteTarget?.make} ${deleteTarget?.model} (${deleteTarget?.registration_number})?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
