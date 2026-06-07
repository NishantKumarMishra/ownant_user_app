import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { usePropertyOverview } from '@/hooks/usePropertyOverview'
import { PropertyCard } from './PropertyCard'

// ── Skeleton card ─────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="flex-shrink-0 rounded-3xl overflow-hidden animate-pulse"
      style={{ width: '82vw', maxWidth: '320px', height: 380 }}>
      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100"/>
    </div>
  )
}

export function PropertyOverviewSection() {
  const { data, isLoading, isError } = usePropertyOverview()
  const overview   = data?.data
  const scrollRef  = useRef<HTMLDivElement>(null)

  // Snap-scroll one card at a time
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const cardW = el.firstElementChild?.clientWidth ?? 0
    const gap   = 12
    const unit  = cardW + gap
    const idx   = Math.round(el.scrollLeft / unit)
    el.scrollTo({ left: idx * unit, behavior: 'smooth' })
  }

  const properties = overview?.properties ?? []

  if (!isLoading && !isError && properties.length === 0) return null

  return (
    <section className="-mx-4 bg-white py-5 border-y border-gray-100">

      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h2 className="text-sm font-black text-gray-900">Property Overview 🏡</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {properties.length > 0
              ? `${properties.length} propert${properties.length > 1 ? 'ies' : 'y'}`
              : 'Loading...'}
          </p>
        </div>
        <Link to="/analytics"
          className="flex items-center gap-1 text-xs font-bold text-primary">
          Details <ChevronRight className="h-3.5 w-3.5"/>
        </Link>
      </div>

      {/* Scroll dots */}
      {properties.length > 1 && (
        <div className="flex justify-center gap-1.5 mb-3">
          {properties.map((_, i) => (
            <div key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === 0 ? '20px' : '6px',
                background: i === 0 ? '#1D9E75' : '#e5e7eb',
              }}
            />
          ))}
        </div>
      )}

      {/* Cards — snap scroll */}
      <div
        ref={scrollRef}
        onScrollEnd={handleScroll}
        className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-1"
        style={{
          scrollSnapType:      'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {isLoading && (
          <>
            <CardSkeleton/>
            <CardSkeleton/>
          </>
        )}

        {isError && (
          <p className="text-sm text-gray-400 py-6 px-4">
            Failed to load properties.
          </p>
        )}

        {properties.map((property, i) => (
          <div key={property.pgId}
            style={{ scrollSnapAlign: 'center', flexShrink: 0 }}>
            <PropertyCard property={property} index={i}/>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      {overview && properties.length > 1 && (
        <div className="grid grid-cols-3 gap-2 px-4 mt-4">
          {[
            {
              label: 'Total Beds',
              value: overview.totalBeds,
              color: '#6366f1',
            },
            {
              label: 'Tenants',
              value: overview.totalActiveTenants,
              color: '#0ea5e9',
            },
            {
              label: 'Pending',
              value: overview.totalPendingDues >= 1000
                ? `₹${(overview.totalPendingDues / 1000).toFixed(0)}K`
                : `₹${overview.totalPendingDues}`,
              color: '#ef4444',
            },
          ].map((s, i) => (
            <div key={i}
              className="rounded-2xl bg-gray-50 border border-gray-100 p-3 text-center"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p className="text-base font-black" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

    </section>
  )
}