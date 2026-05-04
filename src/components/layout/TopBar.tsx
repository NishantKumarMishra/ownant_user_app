import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { PgSwitcher } from '@/components/layout/PgSwitcher'
import { useAuthStore } from '@/store/authStore'
import { usePgStore } from '@/store/pgStore'
import { cn } from '@/lib/utils'


function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface TopBarProps {
  greeting?: string
}

export function TopBar({ greeting }: TopBarProps) {
  const owner = useAuthStore((s) => s.owner)
  const { activePgName } = usePgStore()
  
 
  
  const [sheetOpen, setSheetOpen] = useState(false)
  const displayGreeting =
    greeting ??
    (() => {
      const h = new Date().getHours()
      const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
      return `${part}, ${owner?.name?.split(' ')[0] ?? 'there'}`
    })()

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 md:gap-4">
          <p className="hidden min-w-0 flex-1 truncate text-sm font-medium text-textPrimary sm:block md:text-base">
            {displayGreeting}
          </p>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mx-auto flex max-w-[55%] items-center gap-1 rounded-full border border-border bg-primaryLight px-3 py-1.5 text-sm font-semibold text-primary md:mx-0"
          >
            <span className="truncate">{activePgName ?? 'Select PG'}</span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </button>
          <Link
            to="/profile"
            className={cn(
              'ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white',
            )}
            aria-label="Profile"
          >
            {owner?.name ? initials(owner.name) : '?'}
            
          </Link>
          
        </div>
      </header>
      <PgSwitcher open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
