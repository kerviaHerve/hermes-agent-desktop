import { connectionScopedAtom } from '@/lib/connection-scoped'
import { Codecs } from '@/lib/persisted'

type GroupOrders = Record<string, string[]>

function readGroupOrders(value: unknown): GroupOrders {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([groupId, ids]) =>
      Array.isArray(ids)
        ? [[groupId, [...new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0))]]]
        : []
    )
  )
}

// One order per agent. The storage scope follows the selected gateway, so
// two Hermes connections with an identically named agent cannot share it.
export const $sidebarGroupSessionOrders = connectionScopedAtom<GroupOrders>(
  'hermes.desktop.sidebar.groupSessionOrders.v1',
  {},
  Codecs.json(readGroupOrders),
  { includeProfile: false }
)

export function setSidebarGroupSessionOrder(groupId: string, ids: string[]) {
  const current = $sidebarGroupSessionOrders.get()
  const previous = current[groupId] ?? []

  if (previous.length === ids.length && previous.every((id, index) => id === ids[index])) {
    return
  }

  $sidebarGroupSessionOrders.set({ ...current, [groupId]: ids })
}

export function clearSidebarGroupSessionOrders() {
  if (Object.keys($sidebarGroupSessionOrders.get()).length) {
    $sidebarGroupSessionOrders.set({})
  }
}
