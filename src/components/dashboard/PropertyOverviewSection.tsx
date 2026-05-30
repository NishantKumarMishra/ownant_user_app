// src/components/dashboard/PropertyOverviewSection.tsx

import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { usePropertyOverview } from '@/hooks/usePropertyOverview'
import { PropertyCard } from './PropertyCard'

// ── Skeleton ─────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[85vw] max-w-sm bg-surface rounded-2xl border border-border p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex flex-col gap-1.5">
        <div className="h-5 w-36 bg-gray-200 rounded" />
        <div className="h-3 w-48 bg-gray-100 rounded" />
      </div>
      <div className="bg-background rounded-xl px-4 py-3 flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-8 bg-gray-200 rounded" />
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 h-3 bg-gray-100 rounded" />
          <div className="h-3 w-6 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────
export function PropertyOverviewSection() {
  const { data, isLoading, isError } = usePropertyOverview()
  const overview = data?.data

  return (
    <section className="flex flex-col gap-3 w-full">

      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="text-xl font-bold text-textPrimary">Property Overview</h2>
        <Link
          to="/properties"
          className="flex items-center gap-1 text-sm text-textSecondary border border-border rounded-lg px-3 py-1.5"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Scrollable cards */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
        {isLoading && (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        )}

        {isError && (
          <p className="text-sm text-textTertiary py-6 px-2">
            Failed to load properties.
          </p>
        )}

        {overview?.properties.map((property) => (
          <PropertyCard key={property.pgId} property={property} />
        ))}

        {!isLoading && !isError && overview?.properties.length === 0 && (
          <p className="text-sm text-textTertiary py-6 px-2">No properties yet.</p>
        )}
      </div>

    </section>
  )
}