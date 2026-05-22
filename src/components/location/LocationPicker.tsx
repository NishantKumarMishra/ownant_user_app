import { useState, useRef, useEffect } from 'react'
import { MapPin, Navigation, Loader2, X, Building2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── TODO: Add Google Maps API key to .env when received ───────
// VITE_GOOGLE_MAPS_KEY=AIzaSy...
// Get from: console.cloud.google.com → Enable Places API + Geocoding API
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

export interface LocationData {
  address?:     string
  lat?:         number
  lng?:         number
  landmark?:    string
  landmarkLat?: number
  landmarkLng?: number
}

interface PlacePrediction {
  placeId:       string
  mainText:      string
  secondaryText: string
}

function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// ── Google Places API calls ───────────────────────────────────
// WHY proxy through backend: Google Places API blocks direct
// browser requests when using server-side restricted keys.
// Once you have the API key, add it to .env and enable
// the proxy endpoint in PlacesController.java

async function getPlacePredictions(query: string, token: string): Promise<PlacePrediction[]> {
  if (!GOOGLE_API_KEY || query.length < 3) return []
  try {
    // Calls backend proxy → backend calls Google
    const res  = await fetch(
      `/api/v1/public/places/autocomplete?input=${encodeURIComponent(query)}&token=${token}`
    )
    const data = await res.json()
    return (data.predictions ?? []).map((p: any) => ({
      placeId:       p.place_id,
      mainText:      p.structured_formatting?.main_text      ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? '',
    }))
  } catch { return [] }
}

async function getPlaceLatLng(placeId: string, token: string) {
  if (!GOOGLE_API_KEY) return null
  try {
    const res  = await fetch(
      `/api/v1/public/places/details?placeId=${placeId}&token=${token}`
    )
    const data = await res.json()
    const loc  = data.result?.geometry?.location
    if (!loc) return null
    return { lat: loc.lat as number, lng: loc.lng as number }
  } catch { return null }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!GOOGLE_API_KEY) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  try {
    const res  = await fetch(`/api/v1/public/places/reverse?lat=${lat}&lng=${lng}`)
    const data = await res.json()
    return data.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

// ── Autocomplete input ────────────────────────────────────────
function PlacesInput({ icon, label, placeholder, value, hint, onSelect, onClear }: {
  icon:        React.ReactNode
  label:       string
  placeholder: string
  value:       string
  hint?:       string
  onSelect:    (p: PlacePrediction) => void
  onClear:     () => void
}) {
  const [query,       setQuery]       = useState(value)
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [loading,     setLoading]     = useState(false)
  const [open,        setOpen]        = useState(false)
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef    = useRef<HTMLDivElement | null>(null)
  const tokenRef      = useRef(generateSessionToken())

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleInput = (q: string) => {
    setQuery(q); setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 3) { setPredictions([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try { setPredictions(await getPlacePredictions(q, tokenRef.current)) }
      finally { setLoading(false) }
    }, 350)
  }

  const handleSelect = (p: PlacePrediction) => {
    setQuery(p.mainText); setOpen(false); setPredictions([])
    tokenRef.current = generateSessionToken()
    onSelect(p)
  }

  const isReady = !!GOOGLE_API_KEY

  return (
    <div ref={wrapperRef} className="relative">
      <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none">
          {icon}
        </span>
        <input
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder={isReady ? placeholder : 'Google Maps API key pending...'}
          disabled={!isReady}
          autoComplete="off"
          className={cn(
            'w-full rounded-2xl border px-4 py-3 pl-10 text-sm outline-none transition-colors',
            'placeholder:text-textMuted',
            isReady
              ? 'bg-surface border-border text-textPrimary focus:border-primary focus:ring-2 focus:ring-primary/20'
              : 'bg-bg border-border text-textMuted cursor-not-allowed',
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? <Loader2 className="h-4 w-4 text-textSecondary animate-spin" />
            : query ? <button type="button" onClick={() => { setQuery(''); setPredictions([]); onClear() }}>
                <X className="h-4 w-4 text-textSecondary hover:text-danger" />
              </button>
            : null}
        </div>
      </div>
      {hint && <p className="text-xs text-textSecondary mt-1">{hint}</p>}
      {!isReady && (
        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Will be enabled once Google Maps API key is added
        </p>
      )}
      {open && predictions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-2xl shadow-cardHover overflow-hidden">
          {predictions.map((p, i) => (
            <button key={p.placeId || i} type="button" onClick={() => handleSelect(p)}
              className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-primaryLight transition-colors border-b border-border last:border-0">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-textPrimary truncate">{p.mainText}</p>
                <p className="text-xs text-textSecondary truncate">{p.secondaryText}</p>
              </div>
            </button>
          ))}
          <div className="px-4 py-1.5 flex justify-end border-t border-border">
            <span className="text-[10px] text-textMuted">Powered by Google</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main LocationPicker ───────────────────────────────────────
export function LocationPicker({ value, onChange }: { value: LocationData; onChange: (d: LocationData) => void }) {
  const [locating, setLocating] = useState(false)
  const [located,  setLocated]  = useState(!!value.lat)

  const handleGPS = () => {
    if (!navigator.geolocation) { alert('Location not supported'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          // Works even without API key — stores coordinates
          // With API key — also reverse geocodes to readable address
          const address = await reverseGeocode(lat, lng)
          setLocated(true)
          onChange({ ...value, address, lat, lng })
        } finally { setLocating(false) }
      },
      () => { setLocating(false); alert('Could not get location. Please allow access.') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleAddressSelect = async (p: PlacePrediction) => {
    const coords = await getPlaceLatLng(p.placeId, generateSessionToken())
    onChange({ ...value, address: p.mainText, lat: coords?.lat, lng: coords?.lng })
  }

  const handleLandmarkSelect = async (p: PlacePrediction) => {
    const coords = await getPlaceLatLng(p.placeId, generateSessionToken())
    onChange({ ...value, landmark: p.mainText, landmarkLat: coords?.lat, landmarkLng: coords?.lng })
  }

  return (
    <div className="space-y-4">

      {/* GPS button — works NOW without API key */}
      <button type="button" onClick={handleGPS} disabled={locating}
        className={cn(
          'w-full flex items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed py-4 transition-all',
          located ? 'border-success bg-success/5 text-success'
            : 'border-primary/30 bg-primaryLight text-primary hover:border-primary',
          locating && 'opacity-70 cursor-wait',
        )}
      >
        {locating ? <Loader2 className="h-5 w-5 animate-spin" />
          : <Navigation className={cn('h-5 w-5', located && 'text-success')} />}
        <span className="text-sm font-semibold">
          {locating ? 'Getting your location...'
            : located ? '✓ Location captured!'
            : 'Use my current location'}
        </span>
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-textMuted font-medium">OR type manually</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Address search */}
      <PlacesInput
        icon={<MapPin className="h-4 w-4" />}
        label="Exact address / locality"
        placeholder="e.g. Koramangala 5th Block, Bangalore"
        value={value.address ?? ''}
        hint="Tenants will see this location on the map"
        onSelect={handleAddressSelect}
        onClear={() => onChange({ ...value, address: undefined, lat: undefined, lng: undefined })}
      />

      {/* Landmark search */}
      <PlacesInput
        icon={<Building2 className="h-4 w-4" />}
        label="Nearby landmark (optional)"
        placeholder="e.g. SRM College, Infosys Campus, Forum Mall"
        value={value.landmark ?? ''}
        hint="Helps tenants search 'PG near SRM College'"
        onSelect={handleLandmarkSelect}
        onClear={() => onChange({ ...value, landmark: undefined, landmarkLat: undefined, landmarkLng: undefined })}
      />

      {/* Confirmation */}
      {value.lat && value.lng && (
        <div className="flex items-center gap-2 bg-success/5 border border-success/20 rounded-2xl px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-success flex-shrink-0 animate-pulse" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-success">Location saved</p>
            <p className="text-xs text-textSecondary truncate">
              {value.address ?? `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`}
              {value.landmark ? ` · Near ${value.landmark}` : ''}
            </p>
          </div>
          <a href={`https://www.google.com/maps?q=${value.lat},${value.lng}`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-primary font-medium hover:underline flex-shrink-0">
            View →
          </a>
        </div>
      )}
    </div>
  )
}