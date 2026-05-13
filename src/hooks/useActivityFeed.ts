import { useMemo } from 'react'
import { formatDistanceToNow, parseISO, isThisMonth } from 'date-fns'
import type { ActivityFeedItem, NotificationLog, PaymentItem, TenantListItem } from '@/api/types'

// ── Tenant → ActivityFeedItem ─────────────────────────────────
// Shows tenants whose moveInDate is this month
function tenantToActivity(t: TenantListItem): ActivityFeedItem | null {
  const moveIn = (t as any).moveInDate as string | undefined
  if (!moveIn) return null

  // Only show tenants added this month
  try {
    if (!isThisMonth(parseISO(moveIn))) return null
  } catch {
    return null
  }

  const timePart = formatDistanceToNow(parseISO(moveIn), { addSuffix: true })
  const roomPart = t.roomNumber ? `Room ${t.roomNumber}` : ''
  const bedPart  = t.bedLabel   ? `, Bed ${t.bedLabel}`  : ''
  const subtitle = [roomPart + bedPart, timePart].filter(Boolean).join(' · ')

  return {
    id:        `tenant-${t.id}`,
    type:      'TENANT_ADDED',
    title:     `New tenant ${t.name} added`,
    subtitle,
    timestamp: moveIn,
    dotColor:  'green',
    href:      `/tenants/${t.id}`,
  }
}

// ── Payment → ActivityFeedItem ─────────────────────────────────
function paymentToActivity(p: PaymentItem): ActivityFeedItem | null {
  if (p.status === 'PENDING') return null

  const fmtINR = (n: number) =>
    '₹' + Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)

  // paidAt = exact Instant datetime from backend (updatedAt when marked paid)
  // paidDate = date-only fallback
  const rawDate = p.paidAt ?? p.paidDate ?? null

  let timestamp: string
  if (!rawDate) {
    timestamp = p.dueDate ?? ''
  } else {
    const today = new Date().toISOString().slice(0, 10)
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    // If date-only and today → use now (best guess since we have no time)
    timestamp = isDateOnly && rawDate === today
      ? new Date().toISOString()
      : rawDate
  }

  if (!timestamp) return null

  const roomPart  = p.roomNumber ?? ''
  const roomLabel  = roomPart ? `Room ${roomPart}` : ''
  const timePart   = formatDistanceToNow(parseISO(timestamp), { addSuffix: true })
  const subtitle   = [roomLabel, timePart].filter(Boolean).join(' · ')

  if (p.status === 'PAID') {
    return {
      id:        `pay-${p.id}`,
      type:      'PAYMENT_RECEIVED',
      title:     `${p.tenantName} paid ${fmtINR(p.amountPaid ?? p.amountDue)}`,
      subtitle,
      timestamp,
      dotColor:  'green',
      href:      `/payments/${p.id}`,
    }
  }

  if (p.status === 'PARTIAL') {
    return {
      id:       `pay-${p.id}`,
      type:     'PAYMENT_PARTIAL',
      title:    `${p.tenantName} partial payment ${fmtINR(p.amountPaid ?? 0)}`,
      subtitle,
      timestamp,
      dotColor: 'amber',
      href:     `/payments/${p.id}`,
    }
  }

  if (p.status === 'WAIVED') {
    return {
      id:       `pay-${p.id}`,
      type:     'PAYMENT_WAIVED',
      title:    `${p.tenantName}'s payment waived`,
      subtitle,
      timestamp,
      dotColor: 'gray',
      href:     `/payments/${p.id}`,
    }
  }

  return null
}

// ── NotificationLog → ActivityFeedItem ────────────────────────
// This is extensible — add new type mappings as features grow.
function notifToActivity(n: NotificationLog): ActivityFeedItem | null {
  if (!n.sentAt) return null

  const timePart = formatDistanceToNow(parseISO(n.sentAt), { addSuffix: true })
  const channelPart = n.channel ?? 'WhatsApp'

  // Map notification type → activity
  switch (n.type) {
    case 'RENT_REMINDER': {
      const name = n.tenantName ? `to ${n.tenantName}` : ''
      return {
        id:        `notif-${n.id}`,
        type:      'REMINDER_SENT',
        title:     `Reminder sent ${name}`.trim(),
        subtitle:  `${channelPart} · ${timePart}`,
        timestamp: n.sentAt,
        dotColor:  n.status === 'FAILED' ? 'red' : 'amber',
        href:      n.tenantId ? `/tenants/${n.tenantId}` : undefined,
      }
    }

    case 'RENT_DUE': {
      return {
        id:        `notif-${n.id}`,
        type:      'REMINDER_SENT',
        title:     `Due alert sent${n.tenantName ? ` to ${n.tenantName}` : ''}`,
        subtitle:  `${channelPart} · ${timePart}`,
        timestamp: n.sentAt,
        dotColor:  n.status === 'FAILED' ? 'red' : 'amber',
        href:      n.tenantId ? `/tenants/${n.tenantId}` : undefined,
      }
    }

    case 'PAYMENT_CONFIRM': {
      return {
        id:        `notif-${n.id}`,
        type:      'REMINDER_SENT',
        title:     `Payment confirmation sent${n.tenantName ? ` to ${n.tenantName}` : ''}`,
        subtitle:  `${channelPart} · ${timePart}`,
        timestamp: n.sentAt,
        dotColor:  'green',
        href:      n.tenantId ? `/tenants/${n.tenantId}` : undefined,
      }
    }

    case 'CUSTOM':
    default: {
      // Future-proof: any new notification type gets a generic entry
      const label = n.type
        ? n.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
        : 'Notification'
      return {
        id:        `notif-${n.id}`,
        type:      'CUSTOM',
        title:     `${label}${n.tenantName ? ` — ${n.tenantName}` : ''}`,
        subtitle:  `${channelPart} · ${timePart}`,
        timestamp: n.sentAt,
        dotColor:  n.status === 'FAILED' ? 'red' : 'blue',
        href:      n.tenantId ? `/tenants/${n.tenantId}` : undefined,
      }
    }
  }
}

// ── Main hook ─────────────────────────────────────────────────
export function useActivityFeed(
  payments: PaymentItem[],
  notifications: NotificationLog[],
  tenants: TenantListItem[] = [],
  limit = 10,
): ActivityFeedItem[] {
  return useMemo(() => {
    const paymentItems = payments
      .map(paymentToActivity)
      .filter((x): x is ActivityFeedItem => x !== null)

    const notifItems = notifications
      .map(notifToActivity)
      .filter((x): x is ActivityFeedItem => x !== null)

    const tenantItems = tenants
      .map(tenantToActivity)
      .filter((x): x is ActivityFeedItem => x !== null)

    const allItems = [...paymentItems, ...notifItems, ...tenantItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // ── Group notifications sent within the same minute ────────
    // e.g. "Reminder sent to 5 tenants · WhatsApp · 2 hours ago"
    const grouped: ActivityFeedItem[] = []
    const usedIds = new Set<string>()

    for (const item of allItems) {
      if (usedIds.has(item.id)) continue

      // Only group reminder/notification types — not payments
      if (
        item.type === 'REMINDER_SENT' ||
        item.type === 'BULK_REMINDER_SENT' ||
        item.type === 'CUSTOM'
      ) {
        // Find all items of the same type sent within the same minute
        const itemMinute = new Date(item.timestamp)
        itemMinute.setSeconds(0, 0)

        const sameGroup = allItems.filter(other => {
          if (usedIds.has(other.id)) return false
          if (other.type !== item.type) return false
          const otherMinute = new Date(other.timestamp)
          otherMinute.setSeconds(0, 0)
          return Math.abs(itemMinute.getTime() - otherMinute.getTime()) < 60_000
        })

        if (sameGroup.length > 1) {
          // Mark all as used
          sameGroup.forEach(x => usedIds.add(x.id))

          const timePart = formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })
          const channelPart = item.subtitle.split(' · ')[0] ?? 'WhatsApp'

          grouped.push({
            id:        `group-${item.id}`,
            type:      item.type,
            title:     `Reminder sent to ${sameGroup.length} tenants`,
            subtitle:  `${channelPart} · ${timePart}`,
            timestamp: item.timestamp,
            dotColor:  item.dotColor,
            href:      undefined, // no single tenant link for bulk
          })
        } else {
          usedIds.add(item.id)
          grouped.push(item)
        }
      } else {
        usedIds.add(item.id)
        grouped.push(item)
      }
    }

    return grouped.slice(0, limit)
  }, [payments, notifications, tenants, limit])
}