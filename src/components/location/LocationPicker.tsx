import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Navigation, Loader2, X, Building2, AlertCircle, Map } from 'lucide-react'
import { cn } from '@/lib/utils'

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

// ── Load Google Maps script once ─────────────────────────────
let scriptPromise: Promise<void> | null = null

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const cb = `__gmInit_${Date.now()}`
    ;(window as any)[cb] = () => resolve()

    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&callback=${cb}`
    s.async = true
    s.defer = true
    s.onerror = reject
    document.head.appendChild(s)
  })

  return scriptPromise
}

// ── API helpers (proxy through backend) ──────────────────────
async function getPlacePredictions(query: string, token: string): Promise<PlacePrediction[]> {
  if (!GOOGLE_API_KEY || query.length < 3) return []
  try {
    const res  = await fetch(`/api/v1/public/places/autocomplete?input=${encodeURIComponent(query)}&token=${token}`)
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
    const res  = await fetch(`/api/v1/public/places/details?placeId=${placeId}&token=${token}`)
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

// ── Interactive Map with draggable pin ───────────────────────
function InteractiveMap({ lat, lng, onPinMove }: {
  lat: number
  lng: number
  onPinMove: (lat: number, lng: number, address: string) => void
}) {
  const mapRef     = useRef<HTMLDivElement>(null)
  const mapObj     = useRef<google.maps.Map | null>(null)
  const markerObj  = useRef<google.maps.Marker | null>(null)
  const [loading,  setLoading] = useState(true)

  useEffect(() => {
    if (!mapRef.current || !GOOGLE_API_KEY) return

    loadGoogleMaps().then(() => {
      setLoading(false)

      const center = { lat, lng }

      // Init map
      mapObj.current = new window.google.maps.Map(mapRef.current!, {
        center,
        zoom: 16,
        mapTypeControl:    false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl:       true,
        gestureHandling:   'greedy',
        styles: [
          { featureType: 'poi.business', stylers: [{ visibility: 'simplified' }] },
        ],
      })

      // Draggable marker
      markerObj.current = new window.google.maps.Marker({
        position:  center,
        map:       mapObj.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title:     'Drag to adjust your PG location',
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
              <ellipse cx="16" cy="40" rx="8" ry="3" fill="rgba(0,0,0,0.15)"/>
              <path d="M16 2C9.373 2 4 7.373 4 14c0 9 12 26 12 26S28 23 28 14C28 7.373 22.627 2 16 2z"
                fill="#1D9E75" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="14" r="5" fill="white"/>
            </svg>
          `),
          anchor: new window.google.maps.Point(16, 42),
        },
      })

      // Drag end → reverse geocode
      markerObj.current.addListener('dragend', async () => {
        const pos = markerObj.current?.getPosition()
        if (!pos) return
        const newLat = pos.lat()
        const newLng = pos.lng()
        const address = await reverseGeocode(newLat, newLng)
        onPinMove(newLat, newLng, address)
      })

      // Click on map → move pin
      mapObj.current.addListener('click', async (e: google.maps.MapMouseEvent) => {
        const clickLat = e.latLng?.lat()
        const clickLng = e.latLng?.lng()
        if (clickLat == null || clickLng == null) return
        markerObj.current?.setPosition({ lat: clickLat, lng: clickLng })
        const address = await reverseGeocode(clickLat, clickLng)
        onPinMove(clickLat, clickLng, address)
      })
    }).catch(() => setLoading(false))
  }, [])  // Init once

  // Update marker when lat/lng changes externally
  useEffect(() => {
    if (!mapObj.current || !markerObj.current) return
    const pos = { lat, lng }
    markerObj.current.setPosition(pos)
    mapObj.current.panTo(pos)
  }, [lat, lng])

  if (!GOOGLE_API_KEY) return null

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height: 240 }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
      {/* Hint overlay */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-3 py-1 rounded-full pointer-events-none">
        Drag pin or tap map to adjust location
      </div>
    </div>
  )
}

// ── Places autocomplete input ─────────────────────────────────
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
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef   = useRef<HTMLDivElement | null>(null)
  const tokenRef     = useRef(generateSessionToken())

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
          placeholder={isReady ? placeholder : 'Add VITE_GOOGLE_MAPS_API_KEY to .env...'}
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
          {loading
            ? <Loader2 className="h-4 w-4 text-textSecondary animate-spin" />
            : query
              ? <button type="button" onClick={() => { setQuery(''); setPredictions([]); onClear() }}>
                  <X className="h-4 w-4 text-textSecondary hover:text-danger" />
                </button>
              : null}
        </div>
      </div>
      {hint && <p className="text-xs text-textSecondary mt-1">{hint}</p>}
      {!isReady && (
        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Add VITE_GOOGLE_MAPS_API_KEY to .env to enable
        </p>
      )}
      {open && predictions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-2xl shadow-cardHover overflow-hidden">
          {predictions.map((p, i) => (
            <button
              key={p.placeId || i}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-primaryLight transition-colors border-b border-border last:border-0"
            >
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
export function LocationPicker({
  value,
  onChange,
}: {
  value:    LocationData
  onChange: (d: LocationData) => void
}) {
  const [locating,  setLocating]  = useState(false)
  const [located,   setLocated]   = useState(!!value.lat)
  const [showMap,   setShowMap]   = useState(!!value.lat)

  const handleGPS = () => {
    if (!navigator.geolocation) { alert('Location not supported'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const address = await reverseGeocode(lat, lng)
          setLocated(true)
          setShowMap(true)
          onChange({ ...value, address, lat, lng })
        } finally { setLocating(false) }
      },
      () => { setLocating(false); alert('Could not get location. Please allow access.') },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleAddressSelect = async (p: PlacePrediction) => {
    const coords = await getPlaceLatLng(p.placeId, generateSessionToken())
    setShowMap(!!coords)
    if (coords) setLocated(true)
    onChange({ ...value, address: p.mainText, lat: coords?.lat, lng: coords?.lng })
  }

  const handleLandmarkSelect = async (p: PlacePrediction) => {
    const coords = await getPlaceLatLng(p.placeId, generateSessionToken())
    onChange({ ...value, landmark: p.mainText, landmarkLat: coords?.lat, landmarkLng: coords?.lng })
  }

  const handlePinMove = useCallback((lat: number, lng: number, address: string) => {
    onChange({ ...value, lat, lng, address })
  }, [value, onChange])

  return (
    <div className="space-y-4">

      {/* GPS button */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={locating}
        className={cn(
          'w-full flex items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed py-4 transition-all',
          located
            ? 'border-success bg-success/5 text-success'
            : 'border-primary/30 bg-primaryLight text-primary hover:border-primary',
          locating && 'opacity-70 cursor-wait',
        )}
      >
        {locating
          ? <Loader2 className="h-5 w-5 animate-spin" />
          : <Navigation className={cn('h-5 w-5', located && 'text-success')} />}
        <span className="text-sm font-semibold">
          {locating        ? 'Getting your location...'
            : located      ? '✓ Location captured — drag pin to adjust'
            : 'Use my current location'}
        </span>
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-textMuted font-medium">OR search address</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Address autocomplete */}
      <PlacesInput
        icon={<MapPin className="h-4 w-4" />}
        label="Exact address / locality"
        placeholder="e.g. Koramangala 5th Block, Bangalore"
        value={value.address ?? ''}
        hint="Tenants will see this on the map"
        onSelect={handleAddressSelect}
        onClear={() => {
          setShowMap(false)
          setLocated(false)
          onChange({ ...value, address: undefined, lat: undefined, lng: undefined })
        }}
      />

      {/* Interactive map with draggable pin */}
      {showMap && value.lat && value.lng && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-textSecondary uppercase tracking-wide flex items-center gap-1.5">
              <Map className="h-3.5 w-3.5" />
              Pin your exact location
            </label>
            <span className="text-[10px] text-textMuted">Drag pin or tap map to adjust</span>
          </div>
          <InteractiveMap
            lat={value.lat}
            lng={value.lng}
            onPinMove={handlePinMove}
          />
        </div>
      )}

      {/* Landmark autocomplete */}
      <PlacesInput
        icon={<Building2 className="h-4 w-4" />}
        label="Nearby landmark (optional)"
        placeholder="e.g. SRM College, Infosys Campus, Forum Mall"
        value={value.landmark ?? ''}
        hint="Helps tenants search 'PG near SRM College'"
        onSelect={handleLandmarkSelect}
        onClear={() => onChange({
          ...value,
          landmark:    undefined,
          landmarkLat: undefined,
          landmarkLng: undefined,
        })}
      />

      {/* Confirmation bar */}
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
          <a
            href={`https://www.google.com/maps?q=${value.lat},${value.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-medium hover:underline flex-shrink-0"
          >
            View map →
          </a>
        </div>
      )}
    </div>
  )
}