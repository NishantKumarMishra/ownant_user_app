import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plus, Edit3, Trash2, Globe, ChevronRight, X, Loader2 } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import * as Dialog from '@radix-ui/react-dialog'
import { usePgsList, useSwitchPg } from "@/hooks/usePgs"
import { useQueryClient } from "@tanstack/react-query"
import { usePgStore } from '@/store/pgStore'
import api from '@/api/axios'
import { ENDPOINTS } from '@/api/endpoints'
import toast from 'react-hot-toast'

interface PgSwitcherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Helper — read beds from pg (handles nested stats) ─────────
function getBeds(pg: any) {
  const total    = pg.stats?.totalBeds    ?? pg.totalBeds    ?? 0
  const occupied = pg.stats?.occupiedBeds ?? pg.occupiedBeds ?? 0
  const occ      = total > 0 ? Math.round((occupied / total) * 100) : 0
  return { total, occupied, occ }
}

// ── Property Icon ─────────────────────────────────────────────
function PropertyIcon({ type }: { type?: string }) {
  const isHotel = type === 'HOTEL'
  const isFlat  = type === 'FLAT'
  const c1 = isHotel ? '#FCD34D' : isFlat ? '#60A5FA' : '#34D399'
  const c2 = isHotel ? '#D97706' : isFlat ? '#2563EB' : '#059669'
  const id = `pg-${type ?? 'PG'}`

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1}/>
          <stop offset="100%" stopColor={c2}/>
        </linearGradient>
        <filter id={`s-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={c2} floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect width="44" height="44" rx="14" fill={`url(#${id})`} filter={`url(#s-${id})`}/>
      <rect width="44" height="22" rx="14" fill="rgba(255,255,255,0.12)"/>
      {isFlat ? (
        <>
          <rect x="11" y="16" width="22" height="17" rx="2" fill="white" fillOpacity="0.9"/>
          <rect x="14" y="19" width="5" height="4" rx="1" fill={c2} fillOpacity="0.6"/>
          <rect x="22" y="19" width="5" height="4" rx="1" fill={c2} fillOpacity="0.6"/>
          <rect x="14" y="26" width="5" height="4" rx="1" fill={c2} fillOpacity="0.6"/>
          <rect x="22" y="26" width="5" height="4" rx="1" fill={c2} fillOpacity="0.6"/>
        </>
      ) : isHotel ? (
        <>
          <rect x="11" y="20" width="22" height="14" rx="2" fill="white" fillOpacity="0.9"/>
          <polygon points="22,9 11,20 33,20" fill="white" fillOpacity="0.8"/>
          <rect x="15" y="23" width="4" height="4" rx="1" fill={c2} fillOpacity="0.6"/>
          <rect x="22" y="23" width="4" height="4" rx="1" fill={c2} fillOpacity="0.6"/>
          <rect x="18" y="27" width="8" height="7" rx="1" fill={c2} fillOpacity="0.5"/>
        </>
      ) : (
        <>
          <path d="M22 10L11 19v15h7v-8h8v8h7V19L22 10z" fill="white" fillOpacity="0.9"/>
          <rect x="19" y="26" width="6" height="8" rx="1" fill={c2} fillOpacity="0.5"/>
          <rect x="13" y="21" width="4" height="4" rx="1" fill={c2} fillOpacity="0.5"/>
          <rect x="27" y="21" width="4" height="4" rx="1" fill={c2} fillOpacity="0.5"/>
        </>
      )}
    </svg>
  )
}

// ── Swipeable PG Card ─────────────────────────────────────────
function PgCard({ pg, active, onSelect, onEdit, onDelete, onToggleListed, toggling }: {
  pg: any; active: boolean; toggling: boolean
  onSelect: () => void; onEdit: () => void
  onDelete: () => void; onToggleListed: () => void
}) {
  const [offset,   setOffset]   = useState(0)
  const [revealed, setRevealed] = useState(false)
  const startX  = useRef(0)
  const dragging = useRef(false)
  const ACTION_W = 156

  const { total, occupied, occ } = getBeds(pg)

  const barColor = occ >= 80
    ? 'linear-gradient(90deg,#10b981,#34d399)'
    : occ >= 50
      ? 'linear-gradient(90deg,#f59e0b,#fcd34d)'
      : occ > 0
        ? 'linear-gradient(90deg,#ef4444,#f87171)'
        : '#e5e7eb'

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current  = e.touches[0].clientX
    dragging.current = true
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return
    const dx  = e.touches[0].clientX - startX.current
    const raw = revealed ? dx - ACTION_W : dx
    setOffset(Math.max(-ACTION_W, Math.min(0, raw)))
  }
  const onTouchEnd = () => {
    dragging.current = false
    if (offset < -ACTION_W * 0.35) { setOffset(-ACTION_W); setRevealed(true) }
    else { setOffset(0); setRevealed(false) }
  }
  const close = () => { setOffset(0); setRevealed(false) }

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

      {/* Action buttons */}
      <div className="absolute right-0 top-0 bottom-0 flex" style={{ width: ACTION_W }}>
        <button onClick={() => { close(); onEdit() }}
          className="flex-1 flex flex-col items-center justify-center gap-1"
          style={{ background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' }}>
          <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Edit3 className="h-4 w-4 text-white"/>
          </div>
          <span className="text-[10px] font-bold text-white">Edit</span>
        </button>

        <button onClick={() => { close(); onToggleListed() }}
          disabled={toggling}
          className="flex-1 flex flex-col items-center justify-center gap-1"
          style={{
            background: pg.isListed
              ? 'linear-gradient(135deg,#F59E0B,#B45309)'
              : 'linear-gradient(135deg,#10B981,#047857)',
          }}>
          {toggling
            ? <Loader2 className="h-5 w-5 text-white animate-spin"/>
            : <>
                <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-white"/>
                </div>
                <span className="text-[10px] font-bold text-white">
                  {pg.isListed ? 'Unlist' : 'Go Live'}
                </span>
              </>
          }
        </button>

        <button onClick={() => { close(); onDelete() }}
          className="flex-1 flex flex-col items-center justify-center gap-1"
          style={{ background: 'linear-gradient(135deg,#EF4444,#B91C1C)' }}>
          <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Trash2 className="h-4 w-4 text-white"/>
          </div>
          <span className="text-[10px] font-bold text-white">Delete</span>
        </button>
      </div>

      {/* Main card */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={revealed ? close : onSelect}
        style={{
          transform:  `translateX(${offset}px)`,
          transition: dragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
          background: active ? 'linear-gradient(135deg,#f0fdf8,#ecfdf5)' : 'white',
          border:     active ? '1.5px solid #10b981' : '1.5px solid #f3f4f6',
          borderRadius: '16px',
          position: 'relative', zIndex: 1, cursor: 'pointer',
        }}
      >
        {active && (
          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
            style={{ background: 'linear-gradient(180deg,#10b981,#059669)' }}/>
        )}

        <div className="flex items-center gap-3 p-3.5">
          <PropertyIcon type={pg.propertyType}/>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-extrabold text-gray-900 truncate">{pg.name}</p>
              {pg.isListed && (
                <span className="flex-shrink-0 text-[9px] font-bold text-emerald-700
                  bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate mb-2">
              {pg.city ?? '—'}
              {total > 0 ? ` · ${occupied}/${total} beds` : ''}
            </p>

            {/* Occupancy bar */}
            {total > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${occ}%`, background: barColor }}/>
                </div>
                <span className="text-[10px] font-bold text-gray-400 flex-shrink-0">
                  {occ}%
                </span>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            {active
              ? <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center"
                  style={{ boxShadow: '0 2px 8px rgba(16,185,129,0.4)' }}>
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3}/>
                </div>
              : <ChevronRight className="h-4 w-4 text-gray-300"/>
            }
            {!revealed && (
              <span className="text-[9px] text-gray-300 font-medium">← swipe</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main PgSwitcher ───────────────────────────────────────────
export function PgSwitcher({ open, onOpenChange }: PgSwitcherProps) {
  const navigate                    = useNavigate()
  const { activePgId, setActivePg } = usePgStore()
  const { data: pgs, isLoading }    = usePgsList(open)
  const switchPg                    = useSwitchPg()
  const queryClient = useQueryClient()
  const [togglingId,   setTogglingId]   = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)

  const handleSelect = async (id: string, name: string) => {
    if (id === activePgId) { onOpenChange(false); return }
    try {
      const data = await switchPg.mutateAsync(id)
      setActivePg(id, data?.pg?.name ?? name)
      onOpenChange(false)
      navigate('/dashboard')
    } catch {}
  }

  const handleEdit = (pg: any) => {
    if (pg.id !== activePgId) {
      switchPg.mutateAsync(pg.id).then(data => {
        setActivePg(pg.id, data?.pg?.name ?? pg.name)
        onOpenChange(false)
        navigate('/listing/setup')
      }).catch(() => {})
    } else {
      onOpenChange(false)
      navigate('/listing/setup')
    }
  }

  const handleToggleListed = async (pg: any) => {
    if (pg.id !== activePgId) {
      try {
        const data = await switchPg.mutateAsync(pg.id)
        setActivePg(pg.id, data?.pg?.name ?? pg.name)
      } catch { return }
    }
    setTogglingId(pg.id)
    try {
      if (pg.isListed) {
        await api.post('/listing/me/unpublish')
        toast.success('Listing hidden from search')
      } else {
        await api.post('/listing/me/publish')
        toast.success('🎉 Your PG is now live on findpg!')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Complete your listing first')
    } finally {
      setTogglingId(null)
    }
  }

  const confirmDeletePg = async () => {
    if (!confirmDelete) return
    try {
      // If deleting active PG, switch to another first
      const otherPg = pgList.find((p: any) => p.id !== confirmDelete.id)

      await api.delete(ENDPOINTS.PG_BY_ID(confirmDelete.id))
      toast.success(`${confirmDelete.name} deleted`)

      if (otherPg) {
        // Switch to another PG so activePgId stays valid
        const data = await switchPg.mutateAsync(otherPg.id)
        setActivePg(otherPg.id, data?.pg?.name ?? otherPg.name)
        void queryClient.invalidateQueries({ queryKey: ["pgs"] })
        setConfirmDelete(null)
        onOpenChange(false)
        navigate("/dashboard")
      } else {
        // No other PG exists — go to onboarding
        void queryClient.invalidateQueries({ queryKey: ["pgs"] })
        setConfirmDelete(null)
        onOpenChange(false)
        navigate("/onboarding/pg")
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Delete failed")
      setConfirmDelete(null)
    }
  }

  const pgList      = pgs ?? []
  const totalBeds   = pgList.reduce((s, p: any) => s + (p.stats?.totalBeds    ?? p.totalBeds    ?? 0), 0)
  const totalOcc    = pgList.reduce((s, p: any) => s + (p.stats?.occupiedBeds ?? p.occupiedBeds ?? 0), 0)
  const listedCount = pgList.filter((p: any) => p.isListed).length

  return (
    <>
      <BottomSheet open={open} onOpenChange={onOpenChange} title="">
        <div className="pb-2">

          {/* Header */}
          <div className="flex items-end justify-between mb-4 px-1">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">My Properties</h2>
              <p className="text-xs text-gray-400 mt-0.5">Tap to switch · Swipe left for actions</p>
            </div>
            <button onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="h-4 w-4 text-gray-500"/>
            </button>
          </div>

          {/* Portfolio stats */}
          {pgList.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-5 px-1">
              {[
                { label: 'Properties', value: pgList.length,              color: '#6366f1' },
                { label: 'Beds',       value: `${totalOcc}/${totalBeds}`, color: '#0ea5e9' },
                { label: 'Live',       value: listedCount,                color: '#10b981' },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl bg-gray-50 border border-gray-100 p-3 text-center"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* PG List */}
          <div className="space-y-2.5 px-1">
            {isLoading
              ? [1,2,3].map(i => (
                  <div key={i} className="h-20 rounded-2xl bg-gray-50 animate-pulse border border-gray-100"/>
                ))
              : pgList.map((pg: any) => (
                  <PgCard
                    key={pg.id}
                    pg={pg}
                    active={pg.id === activePgId}
                    toggling={togglingId === pg.id}
                    onSelect={() => void handleSelect(pg.id, pg.name)}
                    onEdit={() => handleEdit(pg)}
                    onDelete={() => setConfirmDelete(pg)}
                    onToggleListed={() => void handleToggleListed(pg)}
                  />
                ))
            }
          </div>

          {/* Add PG */}
          <div className="px-1 pt-4">
            <button type="button"
              onClick={() => { onOpenChange(false); navigate('/onboarding/pg') }}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/40 hover:bg-primaryLt transition-all group">
              <div className="h-8 w-8 rounded-xl bg-gray-100 group-hover:bg-primary flex items-center justify-center transition-all">
                <Plus className="h-4 w-4 text-gray-400 group-hover:text-white"/>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-600 group-hover:text-primary transition-colors">
                  Add New Property
                </p>
                <p className="text-[11px] text-gray-400">PG · Hostel · Hotel · Flat</p>
              </div>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Delete confirm — Radix Dialog so focus trap works correctly */}
      <Dialog.Root open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
          <Dialog.Content
            className="fixed inset-x-4 bottom-8 z-[70] max-w-sm mx-auto bg-white rounded-3xl p-6 focus:outline-none"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            aria-describedby="delete-desc"
          >
            <Dialog.Title className="sr-only">Delete PG</Dialog.Title>
            <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500"/>
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center mb-1">
              Delete {confirmDelete?.name}?
            </h3>
            <p id="delete-desc" className="text-xs text-gray-400 text-center mb-6">
              All rooms, tenants and payment data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePg}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)' }}
              >
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}