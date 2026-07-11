import { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { getAdminConfig, updateAdminConfig, type PlatformConfig } from '../../../api/admin.api'
import { uploadFile } from '../../../components/common/ImageUploader'

interface ImageFieldProps {
  label: string
  hint: string
  aspect: string
  value: string | null
  onUploaded: (url: string) => void
}

function ImageField({ label, hint, aspect, value, onUploaded }: ImageFieldProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setError('')
    setUploading(true)
    try {
      const uploaded = await uploadFile(file)
      onUploaded(uploaded.url)
    } catch {
      setError('Could not upload image. Please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const src = preview ?? value

  return (
    <div>
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-ink/40 mt-0.5 mb-3">{hint}</p>
      <div className="flex items-center gap-4">
        <div className={`${aspect} w-40 rounded-lg border border-line bg-concrete overflow-hidden flex items-center justify-center shrink-0`}>
          {src ? (
            <img src={src} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-ink/30">No image set</span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink/70 hover:bg-concrete transition-colors disabled:opacity-60"
          >
            <Upload size={14} />
            {uploading ? 'Uploading...' : value ? 'Replace image' : 'Upload image'}
          </button>
          {error && <p className="text-xs text-danger mt-2">{error}</p>}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
        </div>
      </div>
    </div>
  )
}

export default function BrandingTab() {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    getAdminConfig().then(setConfig).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async (field: 'logoUrl' | 'heroImageUrl', url: string) => {
    const updated = await updateAdminConfig(field === 'logoUrl' ? { logoUrl: url } : { heroImageUrl: url })
    setConfig(updated)
    setSaved(field)
    setTimeout(() => setSaved(null), 2500)
  }

  if (loading) return <div className="h-56 bg-surface rounded-xl border border-line animate-pulse" />

  return (
    <div className="bg-surface rounded-xl border border-line p-6 space-y-8">
      <div>
        <h2 className="font-display font-semibold text-ink">Branding & Site Media</h2>
        <p className="text-xs text-ink/40 mt-1">
          Shown across the public site — the header logo and homepage hero image. Until you
          upload one, the site uses its default icon/illustration.
        </p>
      </div>

      <ImageField
        label="Site Logo"
        hint="Used in the header and portal sidebars. A square or wide transparent PNG/SVG works best."
        aspect="h-16"
        value={config?.logoUrl ?? null}
        onUploaded={(url) => save('logoUrl', url)}
      />
      {saved === 'logoUrl' && <p className="text-sm text-green-600 -mt-6">Logo updated.</p>}

      <ImageField
        label="Homepage Hero Image"
        hint="Background photo behind the homepage headline. Landscape, at least 1600px wide, works best."
        aspect="h-24"
        value={config?.heroImageUrl ?? null}
        onUploaded={(url) => save('heroImageUrl', url)}
      />
      {saved === 'heroImageUrl' && <p className="text-sm text-green-600 -mt-6">Hero image updated.</p>}
    </div>
  )
}
