import { useState, useRef, useEffect } from 'react'
import { MapPin, Loader2, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

interface CityResult {
  placeId: string
  city:    string
  state:   string
}

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

async function searchCities(query: string, token: string): Promise<CityResult[]> {
  if (!GOOGLE_API_KEY || query.length < 2) return []
  try {
    const res = await api.get(ENDPOINTS.PLACES_AUTOCOMPLETE, {
      params: { input: query, token },
    })
    const predictions = res.data?.predictions ?? []
    return predictions.map((p: any) => ({
      placeId: p.place_id,
      city:    p.structured_formatting?.main_text      ?? p.description.split(',')[0],
      state:   p.structured_formatting?.secondary_text ?? '',
    })).slice(0, 6)
  } catch (e) {
    console.error('City search error:', e)
    return []
  }
}

async function getCityCoords(placeId: string, token: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_API_KEY) return null
  try {
    const res = await api.get(ENDPOINTS.PLACES_DETAILS, {
      params: { placeId, token },
    })
    const loc = res.data?.result?.geometry?.location
    return loc ? { lat: loc.lat, lng: loc.lng } : null
  } catch {
    return null
  }
}

interface Props {
  value:        string
  onChange:     (city: string, lat?: number, lng?: number) => void
  error?:       string
  label?:       string
  placeholder?: string
}

export function CitySearch({
  value,
  onChange,
  error,
  label       = 'City',
  placeholder = 'Type city name...',
}: Props) {
  const [query,    setQuery]    = useState(value)
  const [results,  setResults]  = useState<CityResult[]>([])
  const [loading,  setLoading]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState(!!value)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef  = useRef<HTMLDivElement | null>(null)
  const tokenRef    = useRef(generateToken())

  useEffect(() => {
    setQuery(value)
    if (value) setSelected(true)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleInput = (q: string) => {
    setQuery(q)
    setSelected(false)
    setOpen(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (q.length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await searchCities(q, tokenRef.current)
        setResults(r)
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  const handleSelect = async (r: CityResult) => {
    setQuery(r.city)
    setSelected(true)
    setOpen(false)
    setResults([])
    tokenRef.current = generateToken()
    const coords = await getCityCoords(r.placeId, tokenRef.current)
    onChange(r.city, coords?.lat, coords?.lng)
  }

  const handleClear = () => {
    setQuery('')
    setSelected(false)
    setResults([])
    onChange('', undefined, undefined)
  }

  const isReady = !!GOOGLE_API_KEY

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-textPrimary mb-1">
          {label} <span className="text-danger">*</span>
        </label>
      )}

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary pointer-events-none" />
        <input
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => {
            if (!selected && query.length >= 2) setOpen(true)
          }}
          placeholder={isReady ? placeholder : 'Google Maps API key pending...'}
          autoComplete="off"
          className={cn(
            'w-full rounded-xl border px-3 py-2.5 pl-9 text-sm outline-none transition-colors',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            error    ? 'border-danger'                  : 'border-border',
            selected ? 'bg-primaryLight border-primary' : 'bg-surface',
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 text-textSecondary animate-spin" />
          ) : query ? (
            <button type="button" onClick={handleClear}>
              <X className="h-4 w-4 text-textSecondary hover:text-danger" />
            </button>
          ) : null}
        </div>
      </div>

      {!isReady && (
        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Autocomplete ready once Google Maps API key is added
        </p>
      )}

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-2xl shadow-cardHover overflow-hidden">
          {results.map((r, i) => (
            <button
              key={r.placeId || i}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-primaryLight transition-colors border-b border-border last:border-0"
            >
              <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-textPrimary">{r.city}</p>
                <p className="text-xs text-textSecondary truncate">{r.state}</p>
              </div>
            </button>
          ))}
          <div className="px-4 py-1.5 flex justify-end border-t border-border">
            <span className="text-[10px] text-textMuted">Powered by Google</span>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}