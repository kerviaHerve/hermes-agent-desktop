import { Children, createContext, isValidElement, type ReactElement, type ReactNode, useContext } from 'react'

import { Button } from '@/components/ui/button'
import { Codicon } from '@/components/ui/codicon'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { mergeVisibleReorder } from './order'
import { orderSidebarSections } from './section-order-sort'

interface SectionSlotProps {
  children: ReactNode
  id: string
}

interface SectionOrderCopy {
  moveDown: string
  moveUp: string
  reorder: (label: string) => string
}

interface SectionOrderContextValue {
  copy: SectionOrderCopy
  ids: string[]
  move: (id: string, direction: -1 | 1) => void
}

const SectionOrderContext = createContext<SectionOrderContextValue | null>(null)

// A slot introduces no DOM box: section height, scrolling and nested drag
// lists stay exactly as they were. Only the React child order changes.
export function SectionSlot({ children }: SectionSlotProps) {
  return <>{children}</>
}

export function OrderedSidebarSections({
  children,
  copy,
  onReorder,
  orderIds
}: {
  children: ReactNode
  copy: SectionOrderCopy
  onReorder: (ids: string[]) => void
  orderIds: string[]
}) {
  const sections = Children.toArray(children).filter(
    (child): child is ReactElement<SectionSlotProps> =>
      isValidElement<SectionSlotProps>(child) && child.type === SectionSlot
  )

  const ordered = orderSidebarSections(sections, section => section.props.id, orderIds)

  const ids = ordered.map(section => section.props.id)

  const move = (id: string, direction: -1 | 1) => {
    const index = ids.indexOf(id)
    const target = index + direction

    if (index < 0 || target < 0 || target >= ids.length) {
      return
    }

    const nextVisible = [...ids]
    nextVisible.splice(index, 1)
    nextVisible.splice(target, 0, id)
    // Keep the rank of a section that is temporarily hidden (no pins, an
    // offline messaging platform, or cron hidden in Simple mode).
    const allIds = [...new Set([...orderIds, ...ids])]
    onReorder(mergeVisibleReorder(allIds, nextVisible))
  }

  return <SectionOrderContext.Provider value={{ copy, ids, move }}>{ordered}</SectionOrderContext.Provider>
}

export function SectionOrderAction({ id, label }: { id: string; label: string }) {
  const order = useContext(SectionOrderContext)

  if (!order || order.ids.length < 2) {
    return null
  }

  const index = order.ids.indexOf(id)

  if (index < 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={order.copy.reorder(label)}
          className="text-(--ui-text-tertiary) opacity-40 transition-opacity hover:opacity-100 focus-visible:opacity-100 group-hover/section:opacity-100"
          size="icon-xs"
          variant="ghost"
        >
          <Codicon name="ellipsis" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={index === 0} onSelect={() => order.move(id, -1)}>
          {order.copy.moveUp}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index === order.ids.length - 1} onSelect={() => order.move(id, 1)}>
          {order.copy.moveDown}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
