import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell, Camera, Building2, Wallet, Crown, ShieldCheck, Lock, Mail, Moon, ArrowRight, Upload, MailWarning,
} from 'lucide-react'
import {
  getOwnerSettings, updateOwnerSettings, getPayouts, getOwnerSubscription,
  submitOwnerKyc, submitOwnerBankDetails,
  type OwnerSettings, type Payout, type Subscription, type VerificationStatus,
} from '../../api/owner.api'
import { resendVerification } from '../../api/auth.api'
import { uploadFile } from '../../components/common/ImageUploader'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Toggle from '../../components/common/Toggle'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import NotificationBell from '../../components/common/NotificationBell'
import { useAuthStore } from '../../store/authStore'

const STATUS_BADGE: Record<VerificationStatus, { label: string; className: string }> = {
  verified: { label: 'Verified', className: 'text-green-700 bg-green-100' },
  pending: { label: 'Pending Review', className: 'text-amber-700 bg-amber/10' },
  rejected: { label: 'Rejected', className: 'text-danger bg-danger/10' },
  unsubmitted: { label: 'Not Submitted', className: 'text-ink/50 bg-concrete' },
}

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'passport', label: 'Passport' },
]

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
function daysRemaining(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

interface ProfileFieldProps {
  label: string
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
  type?: string
}

function ProfileField({ label, value, onChange, disabled, type = 'text' }: ProfileFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-green mb-1.5">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full rounded-lg border border-line px-4 py-2.5 font-body text-ink placeholder:text-ink/40 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green disabled:bg-concrete disabled:text-ink/60"
      />
    </div>
  )
}

export default function OwnerSettingsPage() {
  const { user } = useAuthStore()

  // Personal information
  const [settings, setSettings] = useState<OwnerSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Avatar — no avatar_url field on the backend either, so this is a
  // client-side-only preview (object URL), not an uploaded/persisted photo.
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Listing approval preference — the one real, persisted owner-specific setting.
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [savingApproval, setSavingApproval] = useState(false)

  // KYC submission
  const [kycModalOpen, setKycModalOpen] = useState(false)
  const [kycDocType, setKycDocType] = useState('aadhaar')
  const [kycFile, setKycFile] = useState<File | null>(null)
  const [kycUploading, setKycUploading] = useState(false)
  const [kycError, setKycError] = useState('')

  // Bank details submission
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankIfsc, setBankIfsc] = useState('')
  const [bankHolderName, setBankHolderName] = useState('')
  const [bankSaving, setBankSaving] = useState(false)
  const [bankError, setBankError] = useState('')

  const [resendingVerification, setResendingVerification] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  // Payout history
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [payoutsTotal, setPayoutsTotal] = useState(0)
  const [payoutsPage, setPayoutsPage] = useState(1)
  const [payoutsLoading, setPayoutsLoading] = useState(true)
  const payoutsLimit = 5

  // Subscription summary
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  // Security — no backend support for password-change history or 2FA yet;
  // kept as local UI state rather than pretending to call a real endpoint.
  const [twoFactor, setTwoFactor] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  // Preferences — local-only, no owner-settings-preferences table exists to persist these.
  const [pushNotifs, setPushNotifs] = useState(true)
  const [emailNewsletter, setEmailNewsletter] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    getOwnerSettings().then((s) => {
      setSettings(s)
      setFullName(s.full_name)
      setPhoneNumber(s.phone_number)
      setRequiresApproval(s.requires_listing_approval)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setPayoutsLoading(true)
    getPayouts({ page: payoutsPage, limit: payoutsLimit })
      .then((d) => { setPayouts(d.payouts); setPayoutsTotal(d.total) })
      .catch(() => {})
      .finally(() => setPayoutsLoading(false))
  }, [payoutsPage])

  useEffect(() => {
    getOwnerSubscription().then(setSubscription).catch(() => {})
  }, [])

  const payoutsTotalPages = Math.ceil(payoutsTotal / payoutsLimit)

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAvatarPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleCancel = () => {
    setFullName(settings?.full_name ?? '')
    setPhoneNumber(settings?.phone_number ?? '')
    setEditing(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateOwnerSettings({ fullName, phoneNumber })
      setSettings(updated)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { /* keep form open on failure */ } finally { setSaving(false) }
  }

  const toggleApproval = async (checked: boolean) => {
    setRequiresApproval(checked)
    setSavingApproval(true)
    try {
      const updated = await updateOwnerSettings({ requiresListingApproval: checked })
      setSettings(updated)
    } catch {
      setRequiresApproval(!checked) // revert on failure
    } finally { setSavingApproval(false) }
  }

  const openKycModal = () => {
    setKycDocType(settings?.kyc_document_type ?? 'aadhaar')
    setKycFile(null)
    setKycError('')
    setKycModalOpen(true)
  }

  const submitKyc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kycFile) { setKycError('Please choose a document to upload.'); return }
    setKycUploading(true)
    setKycError('')
    try {
      const uploaded = await uploadFile(kycFile)
      const updated = await submitOwnerKyc({ documentUrl: uploaded.url, documentType: kycDocType })
      setSettings(updated)
      setKycModalOpen(false)
    } catch (err: any) {
      setKycError(err?.response?.data?.error || err?.message || 'Could not submit document. Please try again.')
    } finally {
      setKycUploading(false)
    }
  }

  const openBankModal = () => {
    setBankAccountNumber('')
    setBankIfsc('')
    setBankHolderName(settings?.bank_account_holder_name ?? settings?.full_name ?? '')
    setBankError('')
    setBankModalOpen(true)
  }

  const submitBank = async (e: React.FormEvent) => {
    e.preventDefault()
    setBankSaving(true)
    setBankError('')
    try {
      const updated = await submitOwnerBankDetails({
        accountNumber: bankAccountNumber.trim(),
        ifsc: bankIfsc.trim(),
        accountHolderName: bankHolderName.trim(),
      })
      setSettings(updated)
      setBankModalOpen(false)
    } catch (err: any) {
      setBankError(err?.response?.data?.error || 'Could not submit bank details. Please try again.')
    } finally {
      setBankSaving(false)
    }
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
          <p className="text-sm text-ink/50 mt-1">Manage your business information and preferences.</p>
        </div>
        <div className="shrink-0">
          <NotificationBell />
        </div>
      </div>

      {settings && !settings.is_email_verified && (
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
                    (user?.full_name ?? settings?.full_name ?? 'O')[0]
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
                <p className="font-display font-semibold text-ink truncate">{settings?.full_name}</p>
                <p className="text-sm text-ink/50 truncate">{settings?.email}</p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid sm:grid-cols-2 gap-4">
                <ProfileField label="Full Name" value={fullName} onChange={setFullName} disabled={!editing} />
                <ProfileField label="Email Address" value={settings?.email ?? ''} disabled type="email" />
                <ProfileField label="Phone Number" value={phoneNumber} onChange={setPhoneNumber} disabled={!editing} />
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

          {/* Business Verification */}
          <div className="bg-white rounded-xl border border-line p-6">
            <h2 className="font-display font-semibold text-ink mb-5">Business Verification</h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-line px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${settings?.kyc_verified ? 'bg-green/15 text-green-700' : 'bg-concrete text-ink/40'}`}>
                      <ShieldCheck size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">KYC Verification</p>
                      <p className="text-xs text-ink/40 mt-0.5">Identity verification for owners</p>
                    </div>
                  </div>
                  {settings && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[settings.kyc_status].className}`}>
                      {STATUS_BADGE[settings.kyc_status].label}
                    </span>
                  )}
                </div>
                {settings?.kyc_status === 'rejected' && settings.kyc_rejected_reason && (
                  <p className="text-xs text-danger mt-2">{settings.kyc_rejected_reason}</p>
                )}
                {(settings?.kyc_status === 'unsubmitted' || settings?.kyc_status === 'rejected') && (
                  <button onClick={openKycModal} className="text-xs font-medium text-green hover:text-green-light transition-colors mt-2">
                    {settings.kyc_status === 'rejected' ? 'Resubmit document' : 'Submit document'}
                  </button>
                )}
                {settings?.kyc_status === 'pending' && (
                  <p className="text-xs text-ink/40 mt-2">Submitted {settings.kyc_submitted_at ? fmtDate(settings.kyc_submitted_at) : ''} — awaiting admin review.</p>
                )}
              </div>

              <div className="rounded-lg border border-line px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${settings?.bank_account_verified ? 'bg-green/15 text-green-700' : 'bg-concrete text-ink/40'}`}>
                      <Building2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">Bank Account</p>
                      <p className="text-xs text-ink/40 mt-0.5">Required to receive payouts</p>
                    </div>
                  </div>
                  {settings && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[settings.bank_status].className}`}>
                      {STATUS_BADGE[settings.bank_status].label}
                    </span>
                  )}
                </div>
                {settings?.bank_account_number && (
                  <p className="text-xs text-ink/50 mt-2">{settings.bank_account_holder_name} · {settings.bank_account_number} · {settings.bank_ifsc}</p>
                )}
                {settings?.bank_status === 'rejected' && settings.bank_rejected_reason && (
                  <p className="text-xs text-danger mt-2">{settings.bank_rejected_reason}</p>
                )}
                {(settings?.bank_status === 'unsubmitted' || settings?.bank_status === 'rejected') && (
                  <button onClick={openBankModal} className="text-xs font-medium text-green hover:text-green-light transition-colors mt-2">
                    {settings.bank_status === 'rejected' ? 'Resubmit bank details' : 'Submit bank details'}
                  </button>
                )}
                {settings?.bank_status === 'pending' && (
                  <p className="text-xs text-ink/40 mt-2">Submitted {settings.bank_submitted_at ? fmtDate(settings.bank_submitted_at) : ''} — awaiting admin review.</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-line flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Require approval for new listings</p>
                <p className="text-xs text-ink/40 mt-0.5">Review each listing yourself before it goes live</p>
              </div>
              <Toggle checked={requiresApproval} onChange={toggleApproval} disabled={savingApproval} />
            </div>
          </div>

          {/* Payout history */}
          <div className="bg-white rounded-xl border border-line p-6">
            <h2 className="font-display font-semibold text-ink mb-5">Payout History</h2>

            {payoutsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-16 bg-concrete rounded-xl animate-pulse" />)}
              </div>
            ) : payouts.length === 0 ? (
              <div className="py-10 text-center">
                <Wallet size={32} className="text-ink/20 mx-auto mb-3" />
                <p className="text-sm text-ink/40">No payouts yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {payouts.map((p) => (
                  <div key={p.id} className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
                    <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center shrink-0">
                      <Wallet size={16} className="text-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{p.listing_title}</p>
                      <p className="text-xs text-ink/50 mt-0.5">{p.user_name} · {fmtDate(p.created_at)}</p>
                    </div>
                    <Badge status={p.status} />
                    <p className="font-mono text-sm font-medium text-ink w-24 text-right shrink-0">{fmt(p.net_amount)}</p>
                  </div>
                ))}
              </div>
            )}

            <Pagination page={payoutsPage} totalPages={payoutsTotalPages} onChange={setPayoutsPage} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 min-w-0">
          {/* Subscription summary */}
          <div className="bg-white rounded-xl border border-line p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={16} className="text-green" />
              <h2 className="font-display font-semibold text-ink">Subscription</h2>
            </div>
            {subscription ? (
              <>
                <p className="font-display text-lg font-semibold text-ink">{subscription.plan_name}</p>
                <p className="text-xs text-ink/40 mt-1">
                  {fmt(subscription.price)}/{subscription.billing_cycle} · {daysRemaining(subscription.end_date)} days remaining
                </p>
              </>
            ) : (
              <p className="text-sm text-ink/40">No active subscription.</p>
            )}
            <Link
              to="/owner/subscription"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-green hover:text-green-light transition-colors"
            >
              Manage Subscription <ArrowRight size={13} />
            </Link>
          </div>

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
                    <p className="text-xs text-ink/40">New bookings & payouts</p>
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
        </div>
      </div>

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

      <Modal open={kycModalOpen} onClose={() => setKycModalOpen(false)} title="Submit KYC Document">
        <form onSubmit={submitKyc} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Document Type</label>
            <Select value={kycDocType} onChange={(e) => setKycDocType(e.target.value)} options={DOCUMENT_TYPE_OPTIONS} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Upload Document</label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line hover:border-green/40 px-6 py-8 cursor-pointer transition-colors">
              <Upload size={22} className="text-ink/30" />
              <span className="text-sm text-ink/50">{kycFile ? kycFile.name : 'Click to choose an image or PDF'}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setKycFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {kycError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{kycError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setKycModalOpen(false)} disabled={kycUploading}>Cancel</Button>
            <Button type="submit" loading={kycUploading}>Submit for Review</Button>
          </div>
        </form>
      </Modal>

      <Modal open={bankModalOpen} onClose={() => setBankModalOpen(false)} title="Submit Bank Details">
        <form onSubmit={submitBank} className="space-y-4">
          <Input label="Account Holder Name" value={bankHolderName} onChange={(e) => setBankHolderName(e.target.value)} required />
          <Input label="Account Number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value.replace(/\s/g, ''))} required />
          <Input label="IFSC Code" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} maxLength={11} required />
          {bankError && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{bankError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setBankModalOpen(false)} disabled={bankSaving}>Cancel</Button>
            <Button type="submit" loading={bankSaving}>Submit for Review</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
