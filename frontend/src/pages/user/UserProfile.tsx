import { useEffect, useRef, useState } from 'react'
import {
  Bell, Camera, Pencil, Trash2, Plus, Car, CreditCard,
  Lock, Mail, Moon, MailWarning,
} from 'lucide-react'
import {
  getUserProfile, updateUserProfile, getUserBookings,
  getVehicles, addVehicle, updateVehicle, removeVehicle,
  type UserBooking, type Vehicle, type VehicleInput,
} from '../../api/user.api'
import { resendVerification } from '../../api/auth.api'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Toggle from '../../components/common/Toggle'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import NotificationBell from '../../components/common/NotificationBell'
import { useAuthStore } from '../../store/authStore'

const VEHICLE_TYPES = ['car', 'bike', 'auto', 'suv', 'truck']

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }

interface ProfileFieldProps {
  label: string
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
  type?: string
  placeholder?: string
}

function ProfileField({ label, value, onChange, disabled, type = 'text', placeholder }: ProfileFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-green mb-1.5">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full rounded-lg border border-line px-4 py-2.5 font-body text-ink placeholder:text-ink/40 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green disabled:bg-concrete disabled:text-ink/60"
      />
    </div>
  )
}

export default function UserProfile() {
  const { user } = useAuthStore()

  // Personal information
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  // No location column exists on the users table yet — kept local-only
  // (doesn't persist across reloads) rather than fabricating a save.
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [resendingVerification, setResendingVerification] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  // Avatar — no avatar_url field on the backend either, so this is a
  // client-side-only preview (object URL), not an uploaded/persisted photo.
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [savingVehicle, setSavingVehicle] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState(false)
  const [vehicleForm, setVehicleForm] = useState<VehicleInput>({
    vehicle_type: 'car', registration_number: '', make: '', model: '', color: '', is_primary: false,
  })

  // Payment history
  const [payments, setPayments] = useState<UserBooking[]>([])
  const [paymentsTotal, setPaymentsTotal] = useState(0)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const paymentsLimit = 5

  // Security — no backend support for password-change history or 2FA yet;
  // kept as local UI state rather than pretending to call a real endpoint.
  const [twoFactor, setTwoFactor] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  // Preferences — local-only, no user-settings table exists to persist these.
  const [pushNotifs, setPushNotifs] = useState(true)
  const [emailNewsletter, setEmailNewsletter] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Danger zone — no delete-account endpoint exists; confirmation gate is
  // real, but the outcome is an honest message rather than a fake deletion.
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deleteRequested, setDeleteRequested] = useState(false)

  useEffect(() => {
    getUserProfile().then((p) => {
      setProfile(p)
      setFullName(p.full_name ?? '')
      setPhoneNumber(p.phone_number ?? '')
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    getVehicles().then(setVehicles).catch(() => {}).finally(() => setVehiclesLoading(false))
  }, [])

  useEffect(() => {
    setPaymentsLoading(true)
    getUserBookings({ page: paymentsPage, limit: paymentsLimit })
      .then((d) => { setPayments(d.bookings); setPaymentsTotal(d.total) })
      .catch(() => {})
      .finally(() => setPaymentsLoading(false))
  }, [paymentsPage])

  const paymentsTotalPages = Math.ceil(paymentsTotal / paymentsLimit)

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAvatarPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleCancel = () => {
    setFullName(profile?.full_name ?? '')
    setPhoneNumber(profile?.phone_number ?? '')
    setEditing(false)
  }

  const handleResendVerification = async () => {
    setResendingVerification(true)
    try {
      await resendVerification()
      setVerificationSent(true)
    } catch { /* keep banner visible on failure */ } finally {
      setResendingVerification(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateUserProfile({ fullName, phoneNumber })
      setProfile(updated)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {} finally { setSaving(false) }
  }

  const setVehicleField = (key: keyof VehicleInput, val: any) => setVehicleForm((f) => ({ ...f, [key]: val }))

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingVehicle(true)
    try {
      const v = await addVehicle(vehicleForm)
      setVehicles((prev) => [...prev, v])
      setShowAddVehicle(false)
      setVehicleForm({ vehicle_type: 'car', registration_number: '', make: '', model: '', color: '', is_primary: false })
    } catch {} finally { setSavingVehicle(false) }
  }

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editVehicle) return
    setSavingVehicle(true)
    try {
      const updated = await updateVehicle(editVehicle.id, { color: editVehicle.color ?? undefined, is_primary: editVehicle.is_primary })
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : (updated.is_primary ? { ...v, is_primary: false } : v))))
      setEditVehicle(null)
    } catch {} finally { setSavingVehicle(false) }
  }

  const handleDeleteVehicle = async () => {
    if (!deleteVehicle) return
    setDeletingVehicle(true)
    try {
      await removeVehicle(deleteVehicle.id)
      setVehicles((prev) => prev.filter((v) => v.id !== deleteVehicle.id))
      setDeleteVehicle(null)
    } catch {} finally { setDeletingVehicle(false) }
  }

  if (loading) return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-[65fr_35fr] gap-6">
        <div className="h-96 bg-white rounded-xl border border-line animate-pulse" />
        <div className="h-96 bg-white rounded-xl border border-line animate-pulse" />
      </div>
    </div>
  )

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Profile & Settings</h1>
          <p className="text-sm text-ink/50 mt-1">Manage your personal information and preferences.</p>
        </div>
        <div className="shrink-0">
          <NotificationBell />
        </div>
      </div>

      {profile && !profile.is_email_verified && (
        <div className="mb-6 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <MailWarning size={16} className="text-amber-700 shrink-0" />
            <p className="text-sm text-amber-700">
              {verificationSent ? 'Verification email sent — check your inbox.' : 'Please verify your email address.'}
            </p>
          </div>
          {!verificationSent && (
            <button
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="text-sm font-medium text-amber-700 underline hover:text-green transition-colors disabled:opacity-60"
            >
              {resendingVerification ? 'Sending...' : 'Resend email'}
            </button>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-[65fr_35fr] gap-6">
        {/* Left column */}
        <div className="space-y-6 min-w-0">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-line p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-ink">Personal Information</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className="text-sm font-medium text-green hover:text-green-light transition-colors">
                  Edit
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-navy text-white flex items-center justify-center font-display text-xl font-semibold overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user?.full_name ?? profile?.full_name ?? 'U')[0]
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green border-2 border-white flex items-center justify-center text-white"
                  aria-label="Change photo"
                >
                  <Camera size={11} />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              </div>
              <div className="min-w-0">
                <p className="font-display font-semibold text-ink truncate">{profile?.full_name}</p>
                <p className="text-sm text-ink/50 truncate">{profile?.email}</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid sm:grid-cols-2 gap-4">
                <ProfileField label="Full Name" value={fullName} onChange={setFullName} disabled={!editing} />
                <ProfileField label="Email Address" value={profile?.email ?? ''} disabled type="email" />
                <ProfileField label="Phone Number" value={phoneNumber} onChange={setPhoneNumber} disabled={!editing} />
                <ProfileField label="Location" value={location} onChange={setLocation} disabled={!editing} placeholder="City, Country" />
              </div>

              {saved && <p className="text-sm text-green-600 mt-4">Profile updated.</p>}

              {editing && (
                <div className="mt-6 pt-4 border-t border-line flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>Cancel</Button>
                  <Button type="submit" loading={saving}>Save Changes</Button>
                </div>
              )}
            </form>
          </div>

          {/* My Vehicles */}
          <div className="bg-white rounded-xl border border-line p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-ink">My Vehicles</h2>
              <Button onClick={() => setShowAddVehicle(true)}>
                <Plus size={16} /> Add New Car
              </Button>
            </div>

            {vehiclesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }, (_, i) => <div key={i} className="h-16 bg-concrete rounded-xl animate-pulse" />)}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="py-10 text-center text-sm text-ink/40">No vehicles added yet.</div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                      v.is_primary ? 'bg-green-50 border-green/30' : 'bg-white border-line'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        v.is_primary ? 'bg-green/15 text-green-700' : 'bg-concrete text-ink/40'
                      }`}>
                        <Car size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-ink truncate">{v.make} {v.model}</p>
                          {v.is_primary && (
                            <span className="inline-flex items-center rounded-full bg-green px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-mono mt-0.5 ${v.is_primary ? 'text-green-700' : 'text-ink/40'}`}>
                          {v.registration_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditVehicle(v)} className="p-1.5 rounded-lg text-ink/40 hover:text-green hover:bg-white/60 transition-colors" aria-label="Edit vehicle">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteVehicle(v)} className="p-1.5 rounded-lg text-ink/40 hover:text-danger hover:bg-white/60 transition-colors" aria-label="Delete vehicle">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment history */}
          <div className="bg-white rounded-xl border border-line p-6">
            <h2 className="font-display font-semibold text-ink mb-5">Payment History</h2>

            {paymentsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-16 bg-concrete rounded-xl animate-pulse" />)}
              </div>
            ) : payments.length === 0 ? (
              <div className="py-10 text-center">
                <CreditCard size={32} className="text-ink/20 mx-auto mb-3" />
                <p className="text-sm text-ink/40">No payments yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {payments.map((b) => (
                  <div key={b.id} className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
                    <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center shrink-0">
                      <CreditCard size={16} className="text-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{b.listing_title ?? 'Parking booking'}</p>
                      <p className="text-xs text-ink/50 mt-0.5">{fmtDate(b.booking_start_date)} → {fmtDate(b.booking_end_date)}</p>
                    </div>
                    <Badge status={b.payment_status} />
                    <p className="font-mono text-sm font-medium text-ink w-24 text-right shrink-0">{fmt(b.total_price)}</p>
                  </div>
                ))}
              </div>
            )}

            <Pagination page={paymentsPage} totalPages={paymentsTotalPages} onChange={setPaymentsPage} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 min-w-0">
          {/* Security */}
          <div className="bg-white rounded-xl border border-line p-6">
            <h2 className="font-display font-semibold text-ink mb-4">Security</h2>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Password</p>
                <p className="text-xs text-ink/40 mt-0.5">Keep your account secure</p>
              </div>
              <button onClick={() => setPasswordModalOpen(true)} className="text-sm font-medium text-green hover:text-green-light transition-colors shrink-0">
                Update
              </button>
            </div>
            <div className="my-4 border-t border-line" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">2-Factor Auth</p>
                <p className="text-xs text-ink/40 mt-0.5">Currently {twoFactor ? 'enabled' : 'disabled'}</p>
              </div>
              <Toggle checked={twoFactor} onChange={setTwoFactor} />
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-xl border border-line p-6">
            <h2 className="font-display font-semibold text-ink mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                    <Bell size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Push Notifications</p>
                    <p className="text-xs text-ink/40">Booking updates & offers</p>
                  </div>
                </div>
                <Toggle checked={pushNotifs} onChange={setPushNotifs} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-500 flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Email Newsletter</p>
                    <p className="text-xs text-ink/40">Weekly digest</p>
                  </div>
                </div>
                <Toggle checked={emailNewsletter} onChange={setEmailNewsletter} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                    <Moon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Dark Mode</p>
                    <p className="text-xs text-ink/40">Adjust appearance</p>
                  </div>
                </div>
                <Toggle checked={darkMode} onChange={setDarkMode} />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-100 rounded-xl p-6">
            <p className="font-display font-semibold text-danger">Danger Zone</p>
            <p className="text-xs text-danger/80 mt-1.5">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            {deleteRequested ? (
              <p className="text-xs text-danger/80 mt-4">
                Account deletion isn't available yet — please contact support to close your account.
              </p>
            ) : (
              <button
                onClick={() => setDeleteAccountOpen(true)}
                className="mt-4 bg-white border border-danger text-danger rounded-lg px-4 py-2 text-sm font-medium hover:bg-danger/5 transition-colors"
              >
                Delete Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add vehicle modal */}
      <Modal open={showAddVehicle} onClose={() => setShowAddVehicle(false)} title="Add Vehicle">
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <Select
            options={VEHICLE_TYPES.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))}
            value={vehicleForm.vehicle_type}
            onChange={(e) => setVehicleField('vehicle_type', e.target.value)}
            className="w-full"
          />
          <Input label="Make" value={vehicleForm.make} onChange={(e) => setVehicleField('make', e.target.value)} required />
          <Input label="Model" value={vehicleForm.model} onChange={(e) => setVehicleField('model', e.target.value)} required />
          <Input label="Registration Number" value={vehicleForm.registration_number} onChange={(e) => setVehicleField('registration_number', e.target.value)} required />
          <Input label="Color" value={vehicleForm.color} onChange={(e) => setVehicleField('color', e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddVehicle(false)}>Cancel</Button>
            <Button type="submit" loading={savingVehicle}>Add Vehicle</Button>
          </div>
        </form>
      </Modal>

      {/* Edit vehicle modal — backend only supports updating color / primary status */}
      <Modal open={!!editVehicle} onClose={() => setEditVehicle(null)} title="Edit Vehicle">
        {editVehicle && (
          <form onSubmit={handleUpdateVehicle} className="space-y-4">
            <Input
              label="Color"
              value={editVehicle.color ?? ''}
              onChange={(e) => setEditVehicle({ ...editVehicle, color: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={editVehicle.is_primary}
                onChange={(e) => setEditVehicle({ ...editVehicle, is_primary: e.target.checked })}
              />
              Set as primary vehicle
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditVehicle(null)}>Cancel</Button>
              <Button type="submit" loading={savingVehicle}>Save</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteVehicle}
        title="Remove vehicle"
        message={`Remove ${deleteVehicle?.make} ${deleteVehicle?.model} from your account?`}
        confirmLabel="Remove"
        onConfirm={handleDeleteVehicle}
        onCancel={() => setDeleteVehicle(null)}
        loading={deletingVehicle}
      />

      <Modal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Update Password">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-concrete text-ink/40 flex items-center justify-center shrink-0">
            <Lock size={16} />
          </div>
          <p className="text-sm text-ink/60">
            Password changes aren't available yet. Please contact support to reset your password.
          </p>
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={() => setPasswordModalOpen(false)}>Got it</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteAccountOpen}
        title="Delete Account"
        message="This will permanently delete your account and all associated data. This cannot be undone."
        confirmLabel="Delete Account"
        onConfirm={() => { setDeleteAccountOpen(false); setDeleteRequested(true) }}
        onCancel={() => setDeleteAccountOpen(false)}
      />
    </div>
  )
}
