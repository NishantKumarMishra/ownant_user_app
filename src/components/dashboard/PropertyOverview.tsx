// src/components/dashboard/PropertyOverview.tsx
import { Link } from 'react-router-dom';
import { ChevronRight, Users, BedDouble, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/hooks/useAnalytics';
import { usePgsList } from '@/hooks/usePgs';
import { usePgStore } from '@/store/pgStore';

function fmt(n: number) {
  return '₹' + Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function PgCard({
  pgName,
  city,
  isActive,
  occupiedBeds,
  totalBeds,
  occupancyPct,
  activeTenants,
  noticeTenants,
  overdueCount,
  monthLabel,
  collected,
}: {
  pgName:        string;
  city?:         string;
  isActive:      boolean;
  occupiedBeds:  number;
  totalBeds:     number;
  occupancyPct:  number;
  activeTenants: number;
  noticeTenants: number;
  overdueCount:  number;
  collectionRate: number;
  monthLabel:    string;
  collected:     number;
}) {
  const barColor = occupancyPct >= 80
    ? 'bg-success'
    : occupancyPct >= 50
    ? 'bg-amber-400'
    : 'bg-danger';

  const stats = [
    {
      icon:  <Users className="h-4 w-4" />,
      bg:    'bg-primary/10',
      color: 'text-primary',
      label: 'Active Tenants',
      value: activeTenants,
      valueClass: 'text-textPrimary',
    },
    {
      icon:  <Clock className="h-4 w-4" />,
      bg:    'bg-amber-50',
      color: 'text-amber-500',
      label: 'Under Notice',
      value: noticeTenants,
      valueClass: noticeTenants > 0 ? 'text-amber-600' : 'text-textPrimary',
    },
    {
      icon:  <AlertCircle className="h-4 w-4" />,
      bg:    overdueCount > 0 ? 'bg-danger/10' : 'bg-success/10',
      color: overdueCount > 0 ? 'text-danger' : 'text-success',
      label: 'Pending Dues',
      value: overdueCount > 0 ? `${overdueCount} overdue` : '₹0',
      valueClass: overdueCount > 0 ? 'text-danger' : 'text-success',
    },
    {
      icon:  <TrendingUp className="h-4 w-4" />,
      bg:    'bg-success/10',
      color: 'text-success',
      label: `${monthLabel} Collection`,
      value: fmt(collected),
      valueClass: 'text-textPrimary',
    },
  ];

  return (
    // यहाँ w-[82vw] या max-w-[300px] सेट किया है ताकि कार्ड मोबाइल स्क्रीन से बाहर न निकले
    <div className={cn(
      'w-[82vw] max-w-[300px] rounded-2xl border bg-surface p-4 space-y-3 transition-all select-none',
      isActive ? 'border-primary/40 shadow-sm' : 'border-border'
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-textPrimary truncate">{pgName}</p>
          {city && <p className="text-xs text-textSecondary mt-0.5">{city}</p>}
        </div>
        <span className={cn(
          'ml-2 flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full',
          occupancyPct >= 80 ? 'bg-success/10 text-success' : occupancyPct >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-danger/10 text-danger'
        )}>
          {occupancyPct}%
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-textSecondary flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> Occupied Beds
          </p>
          <p className="text-xs font-bold text-textPrimary">
            {occupiedBeds}/{totalBeds}
          </p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${Math.min(occupancyPct, 100)}%` }}
          />
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-2.5">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0', s.bg, s.color)}>
              {s.icon}
            </div>
            <p className="flex-1 text-xs text-textSecondary">{s.label}</p>
            <p className={cn('text-xs font-bold', s.valueClass)}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PropertyOverview() {
  const { data: dashboard, isLoading } = useDashboard();
  const { data: pgs }                  = usePgsList();
  const { activePgId }                 = usePgStore();

  if (isLoading) {
    return (
      <div className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-5 w-40 rounded-full bg-surface animate-pulse" />
          <div className="h-4 w-16 rounded-full bg-surface animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2].map(i => (
            <div key={i} className="h-64 w-[82vw] max-w-[300px] flex-shrink-0 rounded-2xl bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard || !pgs?.length) return null;

  const { occupancy, collection, tenants } = dashboard;
  const occupancyPct  = Math.round(occupancy.occupancyRate ?? 0);
  const collectionPct = Math.round(collection.collectionRate ?? 0);
  const monthLabel    = collection.monthYear ? collection.monthYear.split('-').reverse().join(' ') : "This Month";

  return (
    <div className="mb-5 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-textPrimary">Property Overview</h2>
        <Link to="/rooms" className="flex items-center gap-0.5 text-xs font-semibold text-primary">
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Scroll Container ────────────────────────────────── */}
      {/* यहाँ pure CSS से स्क्रॉलबार गायब किया है ताकि tailwind plugin पर निर्भरता न रहे */}
      <div
        className="flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory px-1"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* प्योर CSS इंजेक्ट ताकि स्क्रॉलबार एकदम न दिखे */}
        <style>{`
          div::-webkit-scrollbar {
            display: none !important;
          }
        `}</style>

        {pgs.map(pg => (
          <div key={pg.id} className="snap-start flex-shrink-0">
            <PgCard
              pgName={pg.name}
              city={pg.city}
              isActive={pg.id === activePgId}
              occupiedBeds={pg.id === activePgId ? occupancy.occupiedBeds : pg.occupiedBeds ?? 0}
              totalBeds={pg.id === activePgId ? occupancy.totalBeds : pg.totalBeds ?? 0}
              occupancyPct={pg.id === activePgId ? occupancyPct : Math.round(pg.occupancyPercent ?? 0)}
              activeTenants={pg.id === activePgId ? tenants.activeTenants : 0}
              noticeTenants={pg.id === activePgId ? tenants.noticeTenants : 0}
              overdueCount={pg.id === activePgId ? collection.overdueCount : 0}
              collectionRate={pg.id === activePgId ? collectionPct : 0}
              monthLabel={monthLabel}
              collected={pg.id === activePgId ? collection.totalCollected : 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}