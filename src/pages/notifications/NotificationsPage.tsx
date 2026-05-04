import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTenantSearch } from '@/hooks/useTenants'
import { useTriggerReminders, useSendReminder } from '@/hooks/useNotifications'
import toast from 'react-hot-toast'
import { handleApiError } from '@/lib/apiError'

export function NotificationsPage() {
  const trigger = useTriggerReminders()
  const sendOne = useSendReminder()
  const [q, setQ] = useState('')
  const search = useTenantSearch(q, q.trim().length > 1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <Button
        type="button"
        variant="whatsapp"
        className="w-full"
        disabled={trigger.isPending}
        onClick={async () => {
          try {
            const r = await trigger.mutateAsync()
            toast.success(`Sent ${r.sent}, skipped ${r.skipped}, failed ${r.failed}`)
          } catch (e) {
            handleApiError(e)
          }
        }}
      >
        Send Reminders (all)
      </Button>

      <div>
        <h2 className="text-sm font-semibold text-textPrimary">Search tenant</h2>
        <Input
          className="mt-2"
          placeholder="Name or phone"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setSelectedId(null)
          }}
        />
        <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-surface">
          {(search.data ?? []).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-primaryLight ${
                  selectedId === t.id ? 'bg-primaryLight font-semibold' : ''
                }`}
                onClick={() => setSelectedId(t.id)}
              >
                {t.name} · {t.phone}
              </button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          className="mt-3 w-full"
          variant="secondary"
          disabled={!selectedId || sendOne.isPending}
          onClick={async () => {
            if (!selectedId) return
            try {
              await sendOne.mutateAsync(selectedId)
              toast.success('Reminder sent')
            } catch (e) {
              handleApiError(e)
            }
          }}
        >
          Send Reminder
        </Button>
      </div>
    </div>
  )
}
