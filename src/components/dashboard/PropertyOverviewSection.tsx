// src/components/dashboard/PropertyOverviewSection.tsx

import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { usePropertyOverview } from '@/hooks/usePropertyOverview'
import { PropertyCard } from './PropertyCard'

function CardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[88vw] max-w-sm bg-gray-100 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex flex-col gap-1.5">
        <div className="h-5 w-36 bg-gray-200 rounded" />
        <div className="h-3 w-48 bg-gray-200 rounded" />
      </div>
      <div className="bg-gray-200 rounded-xl px-4 py-3 flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-gray-300 rounded" />
          <div className="h-3 w-8 bg-gray-300 rounded" />
        </div>
        <div className="h-2 w-full bg-gray-300 rounded-full" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 h-3 bg-gray-200 rounded" />
          <div className="h-3 w-6 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

export function PropertyOverviewSection() {
  const { data, isLoading, isError } = usePropertyOverview()
  const overview = data?.data

  return (
    // White wrapper box — breaks out of dashboard px-4 with -mx-4
    <section className="-mx-4 bg-white px-4 py-4 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-textPrimary mb-3">Property Overview 🏡</h2>
        <Link
          to="/properties"
          className="flex items-center gap-1 text-sm text-textSecondary border border-gray-200 rounded-lg px-3 py-1.5"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Scrollable cards — break out of section px-4 then restore */}
      <div className="-mx-4 flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-1">
        {isLoading && (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        )}

        {isError && (
          <p className="text-sm text-textTertiary py-6">
            Failed to load properties.
          </p>
        )}

        {overview?.properties.map((property) => (
          <PropertyCard key={property.pgId} property={property} />
        ))}

        {!isLoading && !isError && overview?.properties.length === 0 && (
          <p className="text-sm text-textTertiary py-6">No properties yet.</p>
        )}
      </div>

    </section>
  )
}