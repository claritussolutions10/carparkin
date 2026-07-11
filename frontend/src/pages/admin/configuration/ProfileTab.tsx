import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { uploadFile } from '../../../components/common/ImageUploader'
import { updateAdminProfile } from '../../../api/admin.api'

export default function ProfileTab() {
  const { user, updateUser } = useAuthStore()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarError('')
    setAvatarUploading(true)
    try {
      const uploaded = await uploadFile(file)
      await updateAdminProfile({ profilePicture: uploaded.url })
      updateUser({ profile_picture: uploaded.url })
    } catch {
      setAvatarError('Could not upload photo. Please try again.')
      setAvatarPreview(null)
    } finally {
      setAvatarUploading(false)
    }
  }

  const avatarSrc = avatarPreview ?? user?.profile_picture ?? undefined

  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-6 border-b border-line bg-green/5">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full bg-green flex items-center justify-center text-white font-display font-semibold text-xl overflow-hidden">
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.[0] ?? 'A'
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green border-2 border-white flex items-center justify-center text-white disabled:opacity-60"
            aria-label="Change photo"
          >
            <Camera size={11} />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
        </div>
        <div>
          <p className="font-display font-semibold text-ink">{user?.full_name}</p>
          <p className="text-ink/50 text-sm">{user?.email}</p>
          <span className="inline-block mt-1 text-xs font-medium text-green bg-green/10 px-2 py-0.5 rounded-full">
            Administrator
          </span>
          {avatarUploading && <p className="text-xs text-ink/40 mt-1">Uploading photo...</p>}
          {avatarError && <p className="text-xs text-danger mt-1">{avatarError}</p>}
        </div>
      </div>

      <div className="divide-y divide-line">
        {[
          { label: 'Full Name', value: user?.full_name },
          { label: 'Email', value: user?.email },
          { label: 'Role', value: 'Admin' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-center px-6 py-4">
            <span className="text-ink/50 text-sm">{row.label}</span>
            <span className="text-ink text-sm font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-line bg-concrete/50">
        <p className="text-ink/50 text-sm">
          Your profile photo can be updated above. To change your name, email, or role,
          use the backend API or database directly — contact your system administrator.
        </p>
      </div>
    </div>
  )
}
