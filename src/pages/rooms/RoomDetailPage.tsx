import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { useRoom, useDeleteRoom } from '@/hooks/useRooms'
import { formatCurrency } from '@/lib/format'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { handleApiError } from '@/lib/apiError'

export function RoomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: room, isLoading } = useRoom(id)
  const del = useDeleteRoom()
  const [confirmDel, setConfirmDel] = useState(false)

  const allVacant = room?.beds?.every((b) => b.status === 'VACANT') ?? false

  const onDelete = async () => {
    if (!id) return
    try {
      await del.mutateAsync(id)
      toast.success('Room deleted')
      navigate('/rooms')
    } catch (e) {
      handleApiError(e)
    }
  }

  if (isLoading || !room) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary">Room {room.roomNumber}</h1>
        <p className="text-sm text-textSecondary">
          {room.floor ? `Floor ${room.floor} · ` : ''}
          {formatCurrency(room.rentPerBed)}/bed
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{room.sharingType}-sharing</Badge>
          {room.isAc ? <Badge>AC</Badge> : <Badge variant="outline">Non-AC</Badge>}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" type="button" disabled>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        {allVacant ? (
          <Button variant="danger" size="sm" type="button" onClick={() => setConfirmDel(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        {(room.beds ?? []).map((bed) => (
          <Card key={bed.id} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-textPrimary">Bed {bed.label}</span>
              {bed.status === 'VACANT' ? (
                <Badge variant="success">Vacant</Badge>
              ) : (
                <Badge>Occupied</Badge>
              )}
            </div>
            {bed.status === 'OCCUPIED' ? (
              <div className="mt-2 space-y-2 text-sm">
                <p className="text-textPrimary">{bed.tenantName}</p>
                <span className="inline-block rounded-full bg-background px-2 py-0.5 text-xs">
                  {bed.tenantPhone}
                </span>
                {bed.tenantId ? (
                  <div>
                    <Button variant="secondary" size="sm" asChild>
                      <Link to={`/tenants/${bed.tenantId}`}>View Tenant</Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Button className="mt-3 w-full sm:w-auto" asChild>
                <Link to={`/tenants/add?bedId=${encodeURIComponent(bed.id)}`}>Assign Tenant →</Link>
              </Button>
            )}
          </Card>
        ))}
      </div>

      <Modal open={confirmDel} onOpenChange={setConfirmDel} title="Delete room?" description="This cannot be undone.">
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" type="button" onClick={() => setConfirmDel(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" type="button" disabled={del.isPending} onClick={() => void onDelete()}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
