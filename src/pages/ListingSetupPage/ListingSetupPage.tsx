import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Check,
  Camera, X, Star, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useListing, useUpdateListing, useUploadPhoto, useDeletePhoto } from '@/hooks/useListing'
import { LocationPicker, type LocationData } from '@/components/location/LocationPicker'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import api from '@/api/axios'

// ── ImageKit config ───────────────────────────────────────────
const IK_PUBLIC_KEY  = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string
//const IK_URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL as string
const IK_UPLOAD_URL  = 'https://upload.imagekit.io/api/v1/files/upload'

async function uploadToImageKit(file: File): Promise<{ url: string; fileId: string }> {
  // Step 1 — get auth signature from our backend
  // WHY: Private key stays on server, browser only gets short-lived signature
  const authRes = await api.get('/listing/me/photos/auth')
  const auth    = authRes.data.data

  // Step 2 — upload directly to ImageKit
  const formData = new FormData()
  formData.append('file',            file)
  formData.append('publicKey',       IK_PUBLIC_KEY)
  formData.append('fileName',        `pg-${Date.now()}-${file.name.replace(/\s+/g, '-')}`)
  formData.append('folder',          '/ownant/pgs')
  formData.append('useUniqueFileName', 'true')
  formData.append('signature',  auth.signature)
  formData.append('expire',     String(auth.expire))      // ImageKit field name
  formData.append('token',      auth.token)

  const res  = await fetch(IK_UPLOAD_URL, { method: 'POST', body: formData })
  const data = await res.json()

  if (!res.ok) throw new Error(data.message ?? 'Upload failed')
  return { url: data.url, fileId: data.fileId }
}

// ── Amenity options ───────────────────────────────────────────
const AMENITY_OPTIONS = [
  { label: 'WiFi',                   icon: '📶' },
  { label: 'Meals',                  icon: '🍱' },
  { label: 'Laundry',                icon: '👕' },
  { label: 'Parking',                icon: '🚗' },
  { label: 'Security',               icon: '🔒' },
  { label: 'AC',                     icon: '❄️' },
  { label: 'Gym',                    icon: '💪' },
  { label: 'TV',                     icon: '📺' },
  { label: 'Geyser',                 icon: '🚿' },
  { label: 'Power Backup',           icon: '⚡' },
  { label: 'CCTV',                   icon: '📹' },
  { label: 'Kitchen',                icon: '🍳' },
  { label: 'North Indian Food',      icon: '🍛' },
  { label: 'South Indian Food',      icon: '🍚' },
  { label: 'Veg Only',               icon: '🥗' },
  { label: 'Non-Veg',                icon: '🍗' },
  { label: 'Working Professionals',  icon: '💼' },
  { label: 'Students',               icon: '📚' },
]

const HOUSE_RULES = [
  'No smoking', 'No alcohol', 'No guests after 10pm',
  'No loud music', 'No pets', 'Visitors allowed till 9pm',
  'Gate closes at 11pm', 'No cooking in rooms',
]

const STEPS = ['Basic info', 'Amenities', 'House rules', 'Contact', 'Photos']

// ── Step bar ──────────────────────────────────────────────────
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-all',
            i < current  ? 'bg-primary'
            : i === current ? 'bg-primary/40'
            : 'bg-border',
          )}
        />
      ))}
    </div>
  )
}

// ── Toggle pill ───────────────────────────────────────────────
function TogglePill({ label, icon, selected, onClick }: {
  label: string; icon?: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-sm font-medium transition-all',
        selected
          ? 'bg-primary text-white border-primary'
          : 'bg-surface border-border text-textSecondary hover:border-primary/30',
      )}
    >
      {icon && <span>{icon}</span>}
      {label}
      {selected && <Check className="h-3 w-3 ml-0.5" />}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────
export function ListingSetupPage() {
  const navigate = useNavigate()
  const { data: listing, isLoading } = useListing()
  const update      = useUpdateListing()
  const uploadPhoto = useUploadPhoto()
  const deletePhoto = useDeletePhoto()

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const [step,            setStep]            = useState(0)
  const [locality,        setLocality]        = useState('')
  const [gender,          setGender]          = useState<'MALE' | 'FEMALE' | 'MIXED' | ''>('')
  const [desc,            setDesc]            = useState('')
  const [amenities,       setAmenities]       = useState<string[]>([])
  const [rules,           setRules]           = useState<string[]>([])
  const [customRule,      setCustomRule]      = useState('')
  const [contactPhone,    setContactPhone]    = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('')
  const [location, setLocation] = useState<LocationData>({})

  // Pre-fill from existing listing
  useEffect(() => {
    if (!listing) return
    if (listing.locality)          setLocality(listing.locality)
    if (listing.gender)            setGender(listing.gender)
    if (listing.description)       setDesc(listing.description)
    if (listing.amenities?.length) setAmenities(listing.amenities)
    if (listing.houseRules?.length) setRules(listing.houseRules)
    if (listing.contactPhone)      setContactPhone(listing.contactPhone)
    if (listing.contactWhatsapp)   setContactWhatsapp(listing.contactWhatsapp)
    // Pre-fill location
    setLocation({
      address:      listing.locality ?? undefined,
      lat:          listing.latitude  ?? undefined,
      lng:          listing.longitude ?? undefined,
      landmark:     (listing as any).landmark ?? undefined,
    })
  }, [listing])

  const toggleAmenity = (a: string) =>
    setAmenities(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a])

  const toggleRule = (r: string) =>
    setRules(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])

  const addCustomRule = () => {
    if (customRule.trim() && !rules.includes(customRule.trim())) {
      setRules(p => [...p, customRule.trim()])
      setCustomRule('')
    }
  }

  // ── Photo upload ──────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const existing = listing?.photos?.length ?? 0
    if (existing + files.length > 10) {
      toast.error('Maximum 10 photos allowed')
      return
    }

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} too large (max 10MB)`)
          continue
        }
        const { url, fileId } = await uploadToImageKit(file)
        const isFirst = existing === 0 && i === 0
        await uploadPhoto.mutateAsync({ url, publicId: fileId, isPrimary: isFirst })
      }
      toast.success('Photos uploaded!')
    } catch {
      toast.error('Upload failed. Try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto.mutateAsync(photoId)
      toast.success('Photo removed')
    } catch {
      toast.error('Failed to remove photo')
    }
  }

  // ── Save & next ───────────────────────────────────────────
  const saveAndNext = async () => {
    // Photos step — no save needed, photos already uploaded individually
    if (step === 4) {
      toast.success('Profile saved! 🎉')
      navigate('/profile')
      return
    }

    try {
      await update.mutateAsync({
        locality:        location.address   || locality || undefined,
        gender:          gender             || undefined,
        description:     desc               || undefined,
        amenities:       amenities.length   ? amenities : undefined,
        houseRules:      rules.length       ? rules     : undefined,
        contactPhone:    contactPhone        || undefined,
        contactWhatsapp: contactWhatsapp     || undefined,
        latitude:        location.lat,
        longitude:       location.lng,
      })
      setStep(s => s + 1)
    } catch {
      toast.error('Failed to save. Try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="h-8 bg-surface rounded-full animate-pulse w-1/2" />
        <div className="h-40 bg-surface rounded-2xl animate-pulse" />
      </div>
    )
  }

  const photos     = listing?.photos ?? []
  const photoCount = photos.length

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-32">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/profile')}
          className="p-2 hover:bg-surface rounded-xl transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-textSecondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-textPrimary">{STEPS[step]}</h1>
          <p className="text-xs text-textSecondary">Step {step + 1} of {STEPS.length}</p>
        </div>
        <div className={cn(
          'text-xs font-bold px-2.5 py-1 rounded-full',
          (listing?.completionPercent ?? 0) >= 60
            ? 'bg-success/10 text-success'
            : 'bg-amber-50 text-amber-600',
        )}>
          {listing?.completionPercent ?? 0}%
        </div>
      </div>

      <StepBar current={step} total={STEPS.length} />

      {/* ── Step content ───────────────────────────────────── */}
      <div className="mt-6 space-y-5">

        {/* Step 0 — Basic info */}
        {step === 0 && (
          <>
            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                Locality / Area *
              </label>
              <Input
                value={locality}
                onChange={e => setLocality(e.target.value)}
                placeholder="e.g. Koramangala, HSR Layout, Baner"
              />
              <p className="text-xs text-textSecondary mt-1">
                Tenants search by area — be specific
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                Who can stay? *
              </label>
              <div className="flex gap-2">
                {[
                  { label: '👨 Boys only', value: 'MALE'   },
                  { label: '👩 Girls only', value: 'FEMALE' },
                  { label: '🏠 Both',       value: 'MIXED'  },
                ].map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value as any)}
                    className={cn(
                      'flex-1 py-2.5 rounded-2xl border text-xs font-semibold transition-all',
                      gender === g.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface border-border text-textSecondary hover:border-primary/30',
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                About your PG
              </label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Homely atmosphere, 3 meals/day, near metro station, 24/7 security..."
                rows={4}
                maxLength={500}
                className="w-full bg-surface rounded-2xl border border-border px-4 py-3 text-sm text-textPrimary placeholder:text-textMuted outline-none focus:border-primary resize-none"
              />
              <p className="text-xs text-textSecondary mt-1 text-right">{desc.length}/500</p>
            </div>

            {/* Location picker */}
            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                PG Location
              </label>
              <LocationPicker
                value={location}
                onChange={setLocation}
              />
            </div>
          </>
        )}

        {/* Step 1 — Amenities */}
        {step === 1 && (
          <div>
            <p className="text-xs text-textSecondary mb-4">
              Select everything your PG offers. Tenants filter by these.
            </p>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(a => (
                <TogglePill
                  key={a.label}
                  label={a.label}
                  icon={a.icon}
                  selected={amenities.includes(a.label)}
                  onClick={() => toggleAmenity(a.label)}
                />
              ))}
            </div>
            {amenities.length > 0 && (
              <p className="text-xs text-primary font-medium mt-3">
                {amenities.length} selected
              </p>
            )}
          </div>
        )}

        {/* Step 2 — House rules */}
        {step === 2 && (
          <div>
            <p className="text-xs text-textSecondary mb-4">
              Set clear expectations for tenants.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {HOUSE_RULES.map(r => (
                <TogglePill
                  key={r}
                  label={r}
                  selected={rules.includes(r)}
                  onClick={() => toggleRule(r)}
                />
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Input
                value={customRule}
                onChange={e => setCustomRule(e.target.value)}
                placeholder="Add your own rule..."
                onKeyDown={e => e.key === 'Enter' && addCustomRule()}
                className="flex-1"
              />
              <Button type="button" onClick={addCustomRule} variant="secondary">Add</Button>
            </div>
            {rules.filter(r => !HOUSE_RULES.includes(r)).map(r => (
              <div key={r} className="flex items-center justify-between mt-2 bg-surface border border-border rounded-xl px-3 py-2">
                <p className="text-sm text-textPrimary">{r}</p>
                <button onClick={() => toggleRule(r)} className="text-xs text-danger hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}

        {/* Step 3 — Contact */}
        {step === 3 && (
          <>
            <div className="bg-primaryLight border border-primary/20 rounded-2xl p-4 text-xs text-primary">
              <p className="font-semibold mb-1">💡 Tip</p>
              <p>Add a WhatsApp number tenants can reach you on. This appears on your public profile.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                WhatsApp for enquiries *
              </label>
              <Input
                value={contactWhatsapp}
                onChange={e => setContactWhatsapp(e.target.value)}
                placeholder="10-digit number"
                type="tel"
                maxLength={10}
              />
              <p className="text-xs text-textSecondary mt-1">
                Tenants will WhatsApp this number directly
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2 block">
                Phone for calls (optional)
              </label>
              <Input
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="10-digit number"
                type="tel"
                maxLength={10}
              />
            </div>
          </>
        )}

        {/* Step 4 — Photos */}
        {step === 4 && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
              <p className="font-semibold mb-1">📸 Photos matter most</p>
              <p>PGs with 3+ photos get 3x more enquiries. Add your best photo first — it's the cover image.</p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || photoCount >= 10}
              className={cn(
                'w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-colors',
                uploading
                  ? 'border-primary/30 bg-primaryLight cursor-wait'
                  : photoCount >= 10
                    ? 'border-border bg-bg cursor-not-allowed opacity-60'
                    : 'border-border hover:border-primary/40 hover:bg-primaryLight cursor-pointer',
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm font-medium text-primary">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-2xl bg-primaryLight flex items-center justify-center">
                    <Camera className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-textPrimary">
                      {photoCount >= 10 ? 'Maximum 10 photos reached' : 'Tap to upload photos'}
                    </p>
                    <p className="text-xs text-textSecondary mt-0.5">
                      JPG, PNG, WebP · Max 10MB each · Up to 10 photos
                    </p>
                  </div>
                </>
              )}
            </button>

            {/* Photo grid */}
            {photoCount > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-textSecondary uppercase tracking-wide">
                    Uploaded ({photoCount}/10)
                  </p>
                  <p className="text-xs text-textMuted">⭐ = cover image</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[...photos]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((photo, i) => (
                      <div key={photo.id} className="relative group aspect-square">
                        <img
                          src={photo.url}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                        {/* Cover badge */}
                        {photo.isPrimary && (
                          <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5" />
                            Cover
                          </div>
                        )}
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          disabled={deletePhoto.isPending}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {photoCount === 0 && !uploading && (
              <p className="text-center text-xs text-textMuted">
                No photos yet — add at least 1 to publish your listing
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Fixed bottom buttons ───────────────────────────── */}
      <div className="fixed bottom-20 left-0 right-0 bg-surface border-t border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">
              Back
            </Button>
          )}
          <Button
            onClick={saveAndNext}
            disabled={update.isPending || uploading}
            className="flex-1"
          >
            {update.isPending
              ? 'Saving…'
              : step === STEPS.length - 1
                ? '✓ Done'
                : 'Save & continue'}
            {!update.isPending && step < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}