import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Check,
  Camera, X, Star, Loader2, MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  useListing, useUpdateListing,
  useUploadPhoto, useDeletePhoto,
} from '@/hooks/useListing'
import { LocationPicker, type LocationData } from '@/components/location/LocationPicker'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import api from '@/api/axios'

// ── ImageKit ─────────────────────────────────────────────────
const IK_PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string
const IK_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

async function uploadToImageKit(file: File) {
  const authRes = await api.get('/listing/me/photos/auth')
  const auth    = authRes.data.data
  const form    = new FormData()
  form.append('file',             file)
  form.append('publicKey',        IK_PUBLIC_KEY)
  form.append('fileName',         `pg-${Date.now()}-${file.name.replace(/\s+/g, '-')}`)
  form.append('folder',           '/ownant/pgs')
  form.append('useUniqueFileName','true')
  form.append('signature',        auth.signature)
  form.append('expire',           String(auth.expire))
  form.append('token',            auth.token)
  const res  = await fetch(IK_UPLOAD_URL, { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Upload failed')
  return { url: data.url as string, fileId: data.fileId as string }
}

// ── Data ─────────────────────────────────────────────────────
const AMENITIES = [
  { label: 'WiFi',                  icon: '📶' },
  { label: 'Meals',                 icon: '🍱' },
  { label: 'Laundry',               icon: '👕' },
  { label: 'Parking',               icon: '🚗' },
  { label: 'Security',              icon: '🔒' },
  { label: 'AC',                    icon: '❄️' },
  { label: 'Gym',                   icon: '💪' },
  { label: 'TV',                    icon: '📺' },
  { label: 'Geyser',                icon: '🚿' },
  { label: 'Power Backup',          icon: '⚡' },
  { label: 'CCTV',                  icon: '📹' },
  { label: 'Kitchen',               icon: '🍳' },
  { label: 'North Indian Food',     icon: '🍛' },
  { label: 'South Indian Food',     icon: '🍚' },
  { label: 'Veg Only',              icon: '🥗' },
  { label: 'Non-Veg',               icon: '🍗' },
  { label: 'Working Professionals', icon: '💼' },
  { label: 'Students',              icon: '📚' },
]

const HOUSE_RULES = [
  'No smoking', 'No alcohol', 'No guests after 10pm',
  'No loud music', 'No pets', 'Visitors allowed till 9pm',
  'Gate closes at 11pm', 'No cooking in rooms',
]

const STEPS = [
  { title: 'Basic info',    icon: '📋' },
  { title: 'Amenities',     icon: '✨' },
  { title: 'House rules',   icon: '📜' },
  { title: 'Contact',       icon: '📞' },
  { title: 'Photos',        icon: '📸' },
]

const GENDER_OPTIONS = [
  { label: '👨 Boys only', value: 'MALE'   },
  { label: '👩 Girls only', value: 'FEMALE' },
  { label: '🏠 Both',       value: 'MIXED'  },
]

// ── Step progress bar ─────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex gap-1.5 px-4 py-3">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-all duration-300',
            i < current  ? 'bg-primary'
            : i === current ? 'bg-primary/40'
            : 'bg-border',
          )}
        />
      ))}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest mb-2">
      {children}
    </p>
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
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-surface border-border text-textSecondary hover:border-primary/40 hover:text-textPrimary',
      )}
    >
      {icon && <span className="text-base leading-none">{icon}</span>}
      {label}
      {selected && <Check className="h-3 w-3 ml-0.5 flex-shrink-0" />}
    </button>
  )
}

// ── Info card ─────────────────────────────────────────────────
function InfoCard({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-primaryLt border border-primary/20 rounded-2xl px-4 py-3">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <p className="text-xs text-primary leading-relaxed">{text}</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export function ListingSetupPage() {
  const navigate    = useNavigate()
  const { data: listing, isLoading } = useListing()
  const update      = useUpdateListing()
  const uploadPhoto = useUploadPhoto()
  const deletePhoto = useDeletePhoto()

  const fileRef   = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [step,      setStep]      = useState(0)

  // Form state
  const [locality,        setLocality]        = useState('')
  const [gender,          setGender]          = useState<'MALE' | 'FEMALE' | 'MIXED' | ''>('')
  const [desc,            setDesc]            = useState('')
  const [amenities,       setAmenities]       = useState<string[]>([])
  const [rules,           setRules]           = useState<string[]>([])
  const [customRule,      setCustomRule]      = useState('')
  const [contactPhone,    setContactPhone]    = useState('')
  const [contactWhatsapp, setContactWhatsapp] = useState('')
  const [location,        setLocation]        = useState<LocationData>({})

  // Pre-fill
  useEffect(() => {
    if (!listing) return
    if (listing.locality)           setLocality(listing.locality)
    if (listing.gender)             setGender(listing.gender)
    if (listing.description)        setDesc(listing.description)
    if (listing.amenities?.length)  setAmenities(listing.amenities)
    if (listing.houseRules?.length) setRules(listing.houseRules)
    if (listing.contactPhone)       setContactPhone(listing.contactPhone)
    if (listing.contactWhatsapp)    setContactWhatsapp(listing.contactWhatsapp)
    setLocation({
      address:  listing.locality   ?? undefined,
      lat:      listing.latitude   ?? undefined,
      lng:      listing.longitude  ?? undefined,
      landmark: (listing as any).landmark ?? undefined,
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

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const existing = listing?.photos?.length ?? 0
    if (existing + files.length > 10) { toast.error('Max 10 photos'); return }
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} too large`); continue }
        const { url, fileId } = await uploadToImageKit(file)
        await uploadPhoto.mutateAsync({
          url, publicId: fileId, isPrimary: existing === 0 && i === 0,
        })
      }
      toast.success('Photos uploaded!')
    } catch { toast.error('Upload failed. Try again.') }
    finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try { await deletePhoto.mutateAsync(photoId); toast.success('Photo removed') }
    catch { toast.error('Failed to remove') }
  }

  const saveAndNext = async () => {
    if (step === 4) {
      toast.success('Listing saved! 🎉')
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
        contactPhone:    contactPhone       || undefined,
        contactWhatsapp: contactWhatsapp    || undefined,
        latitude:        location.lat,
        longitude:       location.lng,
      })
      setStep(s => s + 1)
    } catch { toast.error('Failed to save. Try again.') }
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-16 bg-surface rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  const photos     = listing?.photos ?? []
  const photoCount = photos.length
  const pct        = listing?.completionPercent ?? 0

  return (
    <div className="max-w-lg mx-auto pb-36">

      {/* ── Sticky header ──────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-surface border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/profile')}
            className="p-2 hover:bg-bg rounded-xl transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-textSecondary" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base">{STEPS[step].icon}</span>
              <h1 className="text-sm font-bold text-textPrimary truncate">
                {STEPS[step].title}
              </h1>
            </div>
            <p className="text-xs text-textSecondary">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
          <div className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0',
            pct >= 80 ? 'bg-success/10 text-success'
            : pct >= 50 ? 'bg-amber-50 text-amber-600'
            : 'bg-surface border border-border text-textSecondary',
          )}>
            {pct}% done
          </div>
        </div>
        <StepBar current={step} />
      </div>

      {/* ── Step content ───────────────────────────────────── */}
      <div className="px-4 pt-5 space-y-5">

        {/* ── Step 0: Basic info ───────────────────────────── */}
        {step === 0 && (
          <>
            <InfoCard
              icon="💡"
              text="Add your PG's location and basic details. Tenants search by area — be specific!"
            />

            {/* Gender */}
            <div>
              <SectionTitle>Who can stay?</SectionTitle>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value as any)}
                    className={cn(
                      'flex-1 py-3 rounded-2xl border text-xs font-semibold transition-all',
                      gender === g.value
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface border-border text-textSecondary hover:border-primary/40',
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* About */}
            <div>
              <SectionTitle>About your PG</SectionTitle>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Homely atmosphere, 3 meals/day, near metro, 24/7 security, working professionals preferred..."
                rows={4}
                maxLength={500}
                className="w-full bg-surface rounded-2xl border border-border px-4 py-3 text-sm text-textPrimary placeholder:text-textMuted outline-none focus:border-primary resize-none transition-colors"
              />
              <p className="text-xs text-textSecondary mt-1 text-right">{desc.length}/500</p>
            </div>

            {/* Location */}
            <div>
              <SectionTitle>PG location on map</SectionTitle>
              <LocationPicker value={location} onChange={setLocation} />
            </div>
          </>
        )}

        {/* ── Step 1: Amenities ────────────────────────────── */}
        {step === 1 && (
          <>
            <InfoCard
              icon="✨"
              text="Select everything your PG offers. Tenants filter by amenities — more = better visibility!"
            />
            <div>
              <SectionTitle>
                Select amenities
                {amenities.length > 0 && (
                  <span className="ml-2 text-primary normal-case font-bold">
                    {amenities.length} selected
                  </span>
                )}
              </SectionTitle>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(a => (
                  <TogglePill
                    key={a.label}
                    label={a.label}
                    icon={a.icon}
                    selected={amenities.includes(a.label)}
                    onClick={() => toggleAmenity(a.label)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: House rules ──────────────────────────── */}
        {step === 2 && (
          <>
            <InfoCard
              icon="📜"
              text="Clear house rules reduce conflicts. Tenants know what to expect before moving in."
            />
            <div>
              <SectionTitle>Common rules</SectionTitle>
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
            </div>

            {/* Custom rule */}
            <div>
              <SectionTitle>Add custom rule</SectionTitle>
              <div className="flex gap-2">
                <Input
                  value={customRule}
                  onChange={e => setCustomRule(e.target.value)}
                  placeholder="Type your own rule..."
                  onKeyDown={e => e.key === 'Enter' && addCustomRule()}
                  className="flex-1"
                />
                <Button type="button" onClick={addCustomRule} variant="secondary">
                  Add
                </Button>
              </div>
            </div>

            {/* Custom rules list */}
            {rules.filter(r => !HOUSE_RULES.includes(r)).length > 0 && (
              <div className="space-y-2">
                <SectionTitle>Your custom rules</SectionTitle>
                {rules.filter(r => !HOUSE_RULES.includes(r)).map(r => (
                  <div
                    key={r}
                    className="flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3"
                  >
                    <p className="text-sm text-textPrimary">{r}</p>
                    <button
                      onClick={() => toggleRule(r)}
                      className="text-xs text-danger hover:underline ml-3 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Step 3: Contact ──────────────────────────────── */}
        {step === 3 && (
          <>
            <InfoCard
              icon="📞"
              text="Tenants will contact you directly on WhatsApp. Make sure this number is active!"
            />

            <div>
              <SectionTitle>WhatsApp number *</SectionTitle>
              <Input
                value={contactWhatsapp}
                onChange={e => setContactWhatsapp(e.target.value)}
                placeholder="10-digit WhatsApp number"
                type="tel"
                maxLength={10}
              />
              <p className="text-xs text-textSecondary mt-1.5">
                Tenants will WhatsApp this number directly from findpg
              </p>
            </div>

            <div>
              <SectionTitle>Call number (optional)</SectionTitle>
              <Input
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="10-digit phone number"
                type="tel"
                maxLength={10}
              />
            </div>

            {/* Preview */}
            {(contactWhatsapp || contactPhone) && (
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-textSecondary mb-3">
                  Preview — how tenants will see it
                </p>
                <div className="flex gap-2">
                  {contactWhatsapp && (
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold">
                      💬 WhatsApp
                    </div>
                  )}
                  {contactPhone && (
                    <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                      📞 Call
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 4: Photos ───────────────────────────────── */}
        {step === 4 && (
          <>
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <span className="text-base flex-shrink-0 mt-0.5">📸</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                PGs with 3+ photos get <strong>3x more enquiries</strong>. 
                Add your best photo first — it becomes the cover image.
              </p>
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

            {/* Upload area */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || photoCount >= 10}
              className={cn(
                'w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-all',
                uploading
                  ? 'border-primary/30 bg-primaryLt cursor-wait'
                  : photoCount >= 10
                    ? 'border-border bg-bg cursor-not-allowed opacity-50'
                    : 'border-border hover:border-primary/40 hover:bg-primaryLt cursor-pointer',
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm font-semibold text-primary">Uploading...</p>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-2xl bg-primaryLt flex items-center justify-center">
                    <Camera className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-textPrimary">
                      {photoCount >= 10 ? 'Max 10 photos reached' : 'Tap to upload photos'}
                    </p>
                    <p className="text-xs text-textSecondary mt-0.5">
                      JPG, PNG, WebP · Max 10MB · Up to 10 photos
                    </p>
                  </div>
                </>
              )}
            </button>

            {/* Photo counter */}
            {photoCount > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-textSecondary uppercase tracking-wide">
                  Photos ({photoCount}/10)
                </p>
                <p className="text-xs text-textMuted flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" /> = cover
                </p>
              </div>
            )}

            {/* Photo grid */}
            {photoCount > 0 && (
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
                      {photo.isPrimary && (
                        <div className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5" /> Cover
                        </div>
                      )}
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
            )}

            {photoCount === 0 && !uploading && (
              <p className="text-center text-xs text-textMuted py-2">
                No photos yet — add at least 1 to publish
              </p>
            )}
          </>
        )}

      </div>

      {/* ── Fixed bottom bar ───────────────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 z-20 bg-surface border-t border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <Button
              variant="secondary"
              onClick={() => setStep(s => s - 1)}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <Button
            onClick={saveAndNext}
            disabled={update.isPending || uploading}
            className="flex-1"
          >
            {update.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : step === STEPS.length - 1 ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Done
              </>
            ) : (
              <>
                Save & continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>

    </div>
  )
}