import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { OrderedSidebarSections, SectionOrderAction, SectionSlot } from './section-order'

afterEach(cleanup)

const copy = { moveDown: 'Move down', moveUp: 'Move up', reorder: (label: string) => `Reorder ${label}` }

function sections(orderIds: string[], onReorder: (ids: string[]) => void, showPinned = true) {
  return (
    <OrderedSidebarSections copy={copy} onReorder={onReorder} orderIds={orderIds}>
      {showPinned && (
        <SectionSlot id="pinned">
          <div data-testid="section">
            Pinned <SectionOrderAction id="pinned" label="Pinned" />
          </div>
        </SectionSlot>
      )}
      <SectionSlot id="agents">
        <div data-testid="section">
          Agents <SectionOrderAction id="agents" label="Agents" />
        </div>
      </SectionSlot>
      <SectionSlot id="cron">
        <div data-testid="section">
          Scheduled jobs <SectionOrderAction id="cron" label="Scheduled jobs" />
        </div>
      </SectionSlot>
    </OrderedSidebarSections>
  )
}

it('changes the visible section order through its header menu', () => {
  const onReorder = vi.fn()
  const view = render(sections([], onReorder))

  fireEvent.pointerDown(screen.getByRole('button', { name: 'Reorder Agents' }), { button: 0 })
  fireEvent.click(within(screen.getByRole('menu')).getByText('Move up'))

  expect(onReorder).toHaveBeenCalledWith(['agents', 'pinned', 'cron'])
  view.rerender(sections(onReorder.mock.lastCall![0], onReorder))
  expect(screen.getAllByTestId('section').map(node => node.textContent?.trim().split(' ')[0])).toEqual([
    'Agents',
    'Pinned',
    'Scheduled'
  ])
})

it('keeps a temporarily hidden section in its saved position', () => {
  const onReorder = vi.fn()
  const view = render(sections(['pinned', 'agents', 'cron'], onReorder, false))

  fireEvent.pointerDown(screen.getByRole('button', { name: 'Reorder Scheduled jobs' }), { button: 0 })
  fireEvent.click(within(screen.getByRole('menu')).getByText('Move up'))

  expect(onReorder).toHaveBeenCalledWith(['pinned', 'cron', 'agents'])
  view.rerender(sections(onReorder.mock.lastCall![0], onReorder))
  expect(screen.getAllByTestId('section').map(node => node.textContent?.trim().split(' ')[0])).toEqual([
    'Pinned',
    'Scheduled',
    'Agents'
  ])
})
