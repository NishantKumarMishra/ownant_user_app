import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { usePayment } from '@/hooks/usePayments'
import { formatCurrency, formatDate } from '@/lib/format'

export function PaymentDetailPage() {
  const { id } = useParams()
  const { data: p, isLoading, isError } = usePayment(id)

  if (isLoading) return <Skeleton className="h-40 w-full" />
  if (isError || !p)
    return (
      <p className="text-sm text-danger">
        Payment not found. <Link to="/payments" className="underline">Back to list</Link>
      </p>
    )

  return (
    <div className="space-y-3">
      <Link to="/payments" className="text-sm text-primary">
        ← Payments
      </Link>
      <h1 className="text-xl font-bold text-textPrimary">{p.tenantName}</h1>
      <Badge>{p.status}</Badge>
      <p className="text-sm text-textSecondary">Month: {p.monthYear}</p>
      <p className="text-sm">Due: {p.dueDate ? formatDate(p.dueDate) : '—'}</p>
      <p className="text-lg font-semibold">{formatCurrency(p.amountDue)}</p>
      {p.amountPaid != null ? <p>Paid: {formatCurrency(p.amountPaid)}</p> : null}
    </div>
  )
}
