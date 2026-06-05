import { useState, useRef, useEffect, useCallback } from 'react'
import {
   Navigation, Loader2, X,
  Building2, AlertCircle, Search,
  CheckCircle2, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/api/axios'

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

export interface LocationData {
  address?:  string
  lat?:      number
  lng?:      number
  city?:     string
  locality?: string
}

export interface LandmarkData {
  placeId:     string
  name:        string
  type:        string
  lat:         number
  lng:         number
  distanceKm:  number
  alreadySaved?: boolean
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

// ── Reverse geocode via backend ───────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<{
  address: string; city: string; locality: string
}> {
  try {
    const res  = await fetch(
      `${import.meta.env.VITE_API_URL ?? ''}/api/v1/public/places/reverse?lat=${lat}&lng=${lng}`
    )
    const data = await res.json()
    return {
      address:  data.address  ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city:     data.city     ?? '',
      locality: data.locality ?? '',
    }
  } catch {
    return {
      address:  `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city:     '',
      locality: '',
    }
  }
}

// ── Landmark type label ───────────────────────────────────────
function landmarkTypeLabel(type: string): string {
  const map: Record<string, string> = {
    university:      '🎓 College',
    school:          '🏫 School',
    hospital:        '🏥 Hospital',
    shopping_mall:   '🛍️ Mall',
    subway_station:  '🚇 Metro',
    train_station:   '🚆 Railway',
    bus_station:     '🚌 Bus Stand',
    airport:         '✈️ Airport',
    establishment:   '🏢 Office/IT Park',
    point_of_interest:'📍 Landmark',
  }
  return map[type] ?? '📍 Landmark'
}

// ── Interactive Google Map ────────────────────────────────────
function MapView({ lat, lng, onPinMove }: {
  lat: number
  lng: number
  onPinMove: (lat: number, lng: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<google.maps.Map | null>(null)
  const markerRef    = useRef<google.maps.Marker | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current || !GOOGLE_API_KEY) return
    loadGoogleMaps().then(() => {
      setLoading(false)
      const center = { lat, lng }
      mapRef.current = new window.google.maps.Map(containerRef.current!, {
        center,
        zoom:              17,
        mapTypeControl:    false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        gestureHandling: 'greedy',
      })

      markerRef.current = new window.google.maps.Marker({
        position:  center,
        map:       mapRef.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        title:     'Drag to set exact location',
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
              <ellipse cx="18" cy="46" rx="9" ry="3" fill="rgba(0,0,0,0.2)"/>
              <path d="M18 2C10.268 2 4 8.268 4 16c0 10 14 30 14 30S32 26 32 16C32 8.268 25.732 2 18 2z"
                fill="#1D9E75" stroke="white" stroke-width="2.5"/>
              <circle cx="18" cy="16" r="6" fill="white"/>
              <circle cx="18" cy="16" r="3" fill="#1D9E75"/>
            </svg>
          `),
          anchor: new window.google.maps.Point(18, 48),
        },
      })

      // Drag end
      markerRef.current.addListener('dragend', () => {
        const pos = markerRef.current?.getPosition()
        if (pos) onPinMove(pos.lat(), pos.lng())
      })

      // Click on map
      mapRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
        const clat = e.latLng?.lat()
        const clng = e.latLng?.lng()
        if (clat == null || clng == null) return
        markerRef.current?.setPosition({ lat: clat, lng: clng })
        onPinMove(clat, clng)
      })
    }).catch(() => setLoading(false))
  }, [])

  // Update marker on external change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    const pos = { lat, lng }
    markerRef.current.setPosition(pos)
    mapRef.current.panTo(pos)
  }, [lat, lng])

  if (!GOOGLE_API_KEY) return null

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height: 220 }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full whitespace-nowrap">
          Drag pin or tap map to adjust
        </div>
      </div>
    </div>
  )
}

// ── Address search with Google Autocomplete ───────────────────
function AddressSearch({ onSelect }: {
  onSelect: (lat: number, lng: number, address: string, city: string, locality: string) => void
}) {
  const inputRef     = useRef<HTMLInputElement>(null)
  const [query,      setQuery]   = useState('')
  const [gmLoaded,   setLoaded]  = useState(false)
  const acRef        = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (!GOOGLE_API_KEY) return
    loadGoogleMaps().then(() => {
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!gmLoaded || !inputRef.current) return

    acRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['geometry', 'address_components', 'name', 'formatted_address'],
      types: ['geocode', 'establishment'],
    })

    acRef.current.addListener('place_changed', () => {
      const place = acRef.current?.getPlace()
      if (!place?.geometry?.location) return

      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()

      let city     = ''
      let locality = ''

      place.address_components?.forEach(c => {
        if (c.types.includes('locality'))
          city = c.long_name
        if (c.types.includes('sublocality_level_1') || c.types.includes('sublocality'))
          locality = c.long_name
        if (c.types.includes('administrative_area_level_2') && !city)
          city = c.long_name
      })

      const address = place.formatted_address ?? place.name ?? ''
      setQuery(place.name ?? address)
      onSelect(lat, lng, address, city, locality)
    })

    return () => {
      if (acRef.current)
        window.google.maps.event.clearInstanceListeners(acRef.current)
    }
  }, [gmLoaded, onSelect])

  return (
    <div className="relative flex items-center gap-2 bg-surface border border-border rounded-2xl px-4 py-3 focus-within:border-primary transition-colors">
      <Search className="h-4 w-4 text-primary flex-shrink-0" />
      <input
        ref={inputRef}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={gmLoaded ? 'Search city, area, locality...' : 'Loading...'}
        disabled={!gmLoaded}
        autoComplete="off"
        className="flex-1 bg-transparent text-sm text-textPrimary outline-none placeholder:text-textMuted"
      />
      {query && (
        <button onClick={() => setQuery('')} className="text-textMuted hover:text-textSecondary">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ── Nearby landmark card ──────────────────────────────────────
function LandmarkCard({
  landmark, selected, saved, onToggle,
}: {
  landmark:  LandmarkData
  selected:  boolean
  saved:     boolean
  onToggle:  () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={saved}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-2xl border transition-all text-left',
        saved
          ? 'bg-success/5 border-success/30 cursor-default'
          : selected
            ? 'bg-primaryLt border-primary/40'
            : 'bg-surface border-border hover:border-primary/30',
      )}
    >
      <div className={cn(
        'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg',
        saved     ? 'bg-success/10'
        : selected ? 'bg-primary/10'
        : 'bg-bg',
      )}>
        {landmarkTypeLabel(landmark.type).split(' ')[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-textPrimary truncate">
          {landmark.name}
        </p>
        <p className="text-xs text-textSecondary">
          {landmarkTypeLabel(landmark.type).split(' ').slice(1).join(' ')}
          {' · '}{landmark.distanceKm.toFixed(1)} km away
        </p>
      </div>
      <div className="flex-shrink-0">
        {saved ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : selected ? (
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-border" />
        )}
      </div>
    </button>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
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
  const [locating,        setLocating]        = useState(false)
  const [showMap,         setShowMap]         = useState(!!value.lat)
  const [fetchingAddress, setFetchingAddress] = useState(false)

  // Landmarks
  const [nearbyLandmarks,   setNearbyLandmarks]   = useState<LandmarkData[]>([])
  const [selectedLandmarks, setSelectedLandmarks] = useState<Set<string>>(new Set())
  const [savedLandmarks,    setSavedLandmarks]     = useState<LandmarkData[]>([])
  const [loadingLandmarks,  setLoadingLandmarks]   = useState(false)
  const [savingLandmarks,   setSavingLandmarks]    = useState(false)

  // Load saved landmarks on mount
  useEffect(() => {
    api.get('/listing/me/landmarks')
      .then(res => {
        const data = res.data?.data ?? []
        setSavedLandmarks(data)
      })
      .catch(() => {})
  }, [])

  // Fetch nearby landmarks from backend
  const fetchNearbyLandmarks = useCallback(async (lat: number, lng: number) => {
    setLoadingLandmarks(true)
    try {
      const res = await api.get('/listing/me/landmarks/nearby', {
        params: { lat, lng, radiusMeters: 2000 }
      })
      const landmarks: LandmarkData[] = res.data?.data ?? []
      setNearbyLandmarks(landmarks)
    } catch {
      setNearbyLandmarks([])
    } finally {
      setLoadingLandmarks(false)
    }
  }, [])

  // GPS location
  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert('Location not supported on this device')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          setFetchingAddress(true)
          const geo = await reverseGeocode(lat, lng)
          onChange({ lat, lng, address: geo.address, city: geo.city, locality: geo.locality })
          setShowMap(true)
          fetchNearbyLandmarks(lat, lng)
        } finally {
          setLocating(false)
          setFetchingAddress(false)
        }
      },
      () => {
        setLocating(false)
        alert('Could not get location. Please allow location access or search manually.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Address selected from autocomplete
  const handleAddressSelect = useCallback((
    lat: number, lng: number,
    address: string, city: string, locality: string
  ) => {
    onChange({ lat, lng, address, city, locality })
    setShowMap(true)
    fetchNearbyLandmarks(lat, lng)
  }, [onChange, fetchNearbyLandmarks])

  // Pin moved on map
  const handlePinMove = useCallback(async (lat: number, lng: number) => {
    setFetchingAddress(true)
    const geo = await reverseGeocode(lat, lng)
    onChange({ lat, lng, address: geo.address, city: geo.city, locality: geo.locality })
    setFetchingAddress(false)
    fetchNearbyLandmarks(lat, lng)
  }, [onChange, fetchNearbyLandmarks])

  // Toggle landmark selection
  const toggleLandmark = (placeId: string) => {
    setSelectedLandmarks(prev => {
      const next = new Set(prev)
      next.has(placeId) ? next.delete(placeId) : next.add(placeId)
      return next
    })
  }

  // Save selected landmarks
  const handleSaveLandmarks = async () => {
    if (selectedLandmarks.size === 0) return
    setSavingLandmarks(true)
    try {
      const toSave = nearbyLandmarks
        .filter(l => selectedLandmarks.has(l.placeId))
        .map(l => ({
          name:        l.name,
          placeId:     l.placeId,
          type:        l.type,
          lat:         l.lat,
          lng:         l.lng,
          distanceKm:  l.distanceKm,
        }))

      const res = await api.post('/listing/me/landmarks', { landmarks: toSave })
      const saved: LandmarkData[] = res.data?.data ?? []
      setSavedLandmarks(prev => [...prev, ...saved])
      setSelectedLandmarks(new Set())

      // Mark as saved in nearby list
      setNearbyLandmarks(prev =>
        prev.map(l => selectedLandmarks.has(l.placeId)
          ? { ...l, alreadySaved: true }
          : l
        )
      )
    } catch {
      alert('Failed to save landmarks. Try again.')
    } finally {
      setSavingLandmarks(false)
    }
  }

  // Delete saved landmark
  const handleDeleteLandmark = async (id: string) => {
    try {
      await api.delete(`/listing/me/landmarks/${id}`)
      setSavedLandmarks(prev => prev.filter((l: any) => l.id !== id))
    } catch {
      alert('Failed to delete landmark.')
    }
  }

  const hasLocation = !!value.lat && !!value.lng

  return (
    <div className="space-y-4">

      {/* ── Search address ───────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest mb-2">
          Search your PG location
        </p>
        <AddressSearch onSelect={handleAddressSelect} />
        <p className="text-xs text-textSecondary mt-1.5">
          Type city, area, locality or any landmark
        </p>
      </div>

      {/* ── OR divider ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-textMuted font-medium">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* ── GPS button ───────────────────────────────────── */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={locating}
        className={cn(
          'w-full flex items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed py-3.5 transition-all',
          hasLocation
            ? 'border-success/40 bg-success/5 text-success'
            : 'border-primary/30 bg-primaryLt text-primary hover:border-primary',
          locating && 'opacity-70 cursor-wait',
        )}
      >
        {locating
          ? <Loader2 className="h-5 w-5 animate-spin" />
          : <Navigation className={cn('h-5 w-5', hasLocation && 'text-success')} />}
        <span className="text-sm font-semibold">
          {locating
            ? 'Getting location...'
            : hasLocation
              ? '✓ Location set — drag pin to adjust'
              : 'Use my current location'}
        </span>
      </button>

      {/* ── Map ──────────────────────────────────────────── */}
      {showMap && value.lat && value.lng && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest">
              Pin your PG on map
            </p>
            {fetchingAddress && (
              <div className="flex items-center gap-1 text-xs text-textSecondary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating address...
              </div>
            )}
          </div>
          <MapView
            lat={value.lat}
            lng={value.lng}
            onPinMove={handlePinMove}
          />
        </div>
      )}

      {/* ── Location confirmed ───────────────────────────── */}
      {hasLocation && (
        <div className="flex items-start gap-3 bg-success/5 border border-success/20 rounded-2xl px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-success flex-shrink-0 mt-1.5 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-success mb-0.5">Location confirmed</p>
            <p className="text-xs text-textSecondary leading-relaxed">
              {value.address}
              {value.city && ` · ${value.city}`}
            </p>
            {value.locality && (
              <p className="text-xs text-textMuted mt-0.5">
                Area: {value.locality}
              </p>
            )}
          </div>
          <a
            href={`https://www.google.com/maps?q=${value.lat},${value.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-semibold hover:underline flex-shrink-0"
          >
            View →
          </a>
        </div>
      )}

      {/* ── Nearby landmarks ─────────────────────────────── */}
      {hasLocation && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest">
                Nearby landmarks
              </p>
              <p className="text-xs text-textSecondary mt-0.5">
                Select landmarks to boost SEO & search visibility
              </p>
            </div>
            {loadingLandmarks && (
              <Loader2 className="h-4 w-4 text-textSecondary animate-spin" />
            )}
          </div>

          {/* Nearby list */}
          {!loadingLandmarks && nearbyLandmarks.length > 0 && (
            <div className="space-y-2">
              {nearbyLandmarks.map(l => (
                <LandmarkCard
                  key={l.placeId}
                  landmark={l}
                  selected={selectedLandmarks.has(l.placeId)}
                  saved={!!l.alreadySaved}
                  onToggle={() => !l.alreadySaved && toggleLandmark(l.placeId)}
                />
              ))}

              {/* Save button */}
              {selectedLandmarks.size > 0 && (
                <button
                  type="button"
                  onClick={handleSaveLandmarks}
                  disabled={savingLandmarks}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primaryDk transition-colors"
                >
                  {savingLandmarks
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                    : <>
                        <Building2 className="h-4 w-4" />
                        Save {selectedLandmarks.size} landmark{selectedLandmarks.size > 1 ? 's' : ''}
                      </>
                  }
                </button>
              )}
            </div>
          )}

          {!loadingLandmarks && nearbyLandmarks.length === 0 && hasLocation && (
            <p className="text-xs text-textMuted text-center py-3">
              No landmarks found nearby. Try adjusting pin position.
            </p>
          )}
        </div>
      )}

      {/* ── Saved landmarks ──────────────────────────────── */}
      {savedLandmarks.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-textSecondary uppercase tracking-widest">
            Saved landmarks ({savedLandmarks.length})
          </p>
          <div className="space-y-2">
            {savedLandmarks.map((l: any) => (
              <div
                key={l.id}
                className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-3 py-3"
              >
                <div className="h-9 w-9 rounded-xl bg-primaryLt flex items-center justify-center text-lg flex-shrink-0">
                  {landmarkTypeLabel(l.type ?? '').split(' ')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-textPrimary truncate">
                    {l.name}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    /pg-near/{l.slug}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteLandmark(l.id)}
                  className="p-1.5 hover:bg-danger/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-primaryLt border border-primary/20 rounded-2xl px-4 py-3">
            <p className="text-xs text-primary font-semibold mb-1">
              🔍 SEO URLs generated:
            </p>
            <div className="space-y-1">
              {savedLandmarks.slice(0, 3).map((l: any) => (
                <p key={l.id} className="text-xs text-textSecondary font-mono">
                  findpg.ownant.com/pg-near/{l.slug}
                </p>
              ))}
              {savedLandmarks.length > 3 && (
                <p className="text-xs text-textMuted">
                  +{savedLandmarks.length - 3} more URLs
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── No API key warning ───────────────────────────── */}
      {!GOOGLE_API_KEY && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Add <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> to .env to enable map features
          </p>
        </div>
      )}

    </div>
  )
}