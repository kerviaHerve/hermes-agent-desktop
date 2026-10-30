// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'

import { SidebarProvider } from '@/components/ui/sidebar'
import { $connectionsRegistry } from '@/store/connection-registry-state'
import { $sidebarOrdering, setSidebarGrouping } from '@/store/layout'
import { $profiles } from '@/store/profile'
import { $sessions } from '@/store/session'
import { $sidebarGroupSessionOrders, clearSidebarGroupSessionOrders } from '@/store/sidebar-group-session-order'
import { makeSessionInfo } from '@/test/session-info'

import { $gatewayGroupOrder } from './gateway-group-preferences'

import { ChatSidebar } from './index'

// Gateway/profile groups reorder by drag as well as by the ⋯ menu's Move
// up/down. The grab handle only reveals itself on hover, so the visible
// affordance is the header itself: a POINTER press on the label must arm the
// dnd sortable (the lead handle already did). Only the pointer activator lives
// on the header; the keyboard activator stays on the grabber (#83617).

const noop = () => {}

const noopAsync = async () => {}

const mount = () =>
  render(
    <MemoryRouter>
      <SidebarProvider>
        <ChatSidebar
          currentView="chat"
          onArchiveSession={noop}
          onBranchSession={noop}
          onDeleteSession={noop}
          onLoadMoreSessions={noop}
          onManageCronJob={noop}
          onNavigate={noop}
          onNewSessionInWorkspace={noop}
          onNewSessionSplit={noop}
          onResumeSession={vi.fn()}
          onRetrySessions={noopAsync}
          onTriggerCronJob={async () => {}}
        />
      </SidebarProvider>
    </MemoryRouter>
  )

afterEach(() => {
  cleanup()
  $gatewayGroupOrder.set([])
  clearSidebarGroupSessionOrders()
})

const arrange = () => {
  mount()
  act(() => {
    $connectionsRegistry.set({
      version: 2,
      primary: 'local',
      secureTokenStorage: true,
      connections: [
        { id: 'local', label: 'This device', kind: 'local', tokenSet: false, tokenPreview: null },
        { id: 'remote-1', label: 'Homelab', kind: 'remote', tokenSet: false, tokenPreview: null }
      ]
    })
    $profiles.set([{ name: 'default', is_default: true }] as typeof $profiles.value)
    setSidebarGrouping('profile')
    $sessions.set(
      ['local', 'remote-1'].map(connection_id =>
        makeSessionInfo({ id: connection_id, connection_id, profile: 'default', last_active: Date.now() / 1000 })
      )
    )
  })

  const sectionIds = () =>
    [...globalThis.document.querySelectorAll('[data-gateway-section]')].map(node => node.getAttribute('data-gateway-section'))

  const device = screen
    .getAllByText('This device')
    .map(label => label.closest('[data-gateway-section]'))
    .find((section): section is HTMLElement => section instanceof HTMLElement)!

  expect(sectionIds()).toEqual([JSON.stringify(['gateway', 'remote-1']), JSON.stringify(['gateway', 'local'])])

  return { device, sectionIds }
}

it('arms the reorder from a pointer press on the header label', async () => {
  const { device } = arrange()
  // Pointer path: a press on the fold label plus a move past the 6px
  // activation distance arms the sortable (jsdom has no layout, so the drop
  // itself cannot resolve a target here — arming is the assertion).
  const label = within(device).getByRole('button', { expanded: true, name: 'This device' })
  await act(async () => {
    fireEvent.pointerDown(label, { button: 0, clientX: 10, clientY: 10, isPrimary: true, pointerId: 1 })
    fireEvent.pointerMove(globalThis.document, { clientX: 10, clientY: 30, pointerId: 1 })
    await Promise.resolve()
  })
  expect(device.querySelector('[data-glass-opaque]')).not.toBeNull()
  await act(async () => {
    fireEvent.pointerUp(globalThis.document, { clientX: 10, clientY: 30, pointerId: 1 })
    await Promise.resolve()
  })
  expect(device.querySelector('[data-glass-opaque]')).toBeNull()
})

it('reorders gateway sections from the grabber by keyboard', async () => {
  const { device, sectionIds } = arrange()
  // Keyboard path: Space on the focused grabber arms the drag, ArrowUp moves it
  // over the previous item, Space drops. Drives the same listeners without
  // needing layout in jsdom.
  const grabber = device.querySelector<HTMLElement>('[data-reorder-handle]')!
  grabber.focus()
  await act(async () => {
    fireEvent.keyDown(grabber, { code: 'Space', key: ' ' })
    await Promise.resolve()
  })
  await act(async () => {
    fireEvent.keyDown(grabber, { code: 'ArrowUp', key: 'ArrowUp' })
    await Promise.resolve()
  })
  await act(async () => {
    fireEvent.keyDown(grabber, { code: 'Space', key: ' ' })
    await Promise.resolve()
  })

  expect($gatewayGroupOrder.get()[0]).toBe(JSON.stringify(['gateway', 'local']))
  expect(sectionIds()[0]).toBe(JSON.stringify(['gateway', 'local']))
})

it('reorders conversations inside one agent without moving them to another agent', async () => {
  arrange()
  act(() => {
    $sessions.set([
      makeSessionInfo({
        id: 'first',
        connection_id: 'local',
        profile: 'default',
        title: 'First chat',
        last_active: 200
      }),
      makeSessionInfo({
        id: 'second',
        connection_id: 'local',
        profile: 'default',
        title: 'Second chat',
        last_active: 100
      }),
      makeSessionInfo({
        id: 'other',
        connection_id: 'remote-1',
        profile: 'default',
        title: 'Other chat',
        last_active: 50
      })
    ])
  })

  const group = screen.getByText('First chat').closest('[data-gateway-group]') as HTMLElement
  const handles = group.querySelectorAll<HTMLElement>('[data-sidebar-session-row] [data-reorder-handle]')
  expect(handles).toHaveLength(2)
  handles[1].focus()
  await act(async () => {
    fireEvent.keyDown(handles[1], { code: 'Space', key: ' ' })
    await Promise.resolve()
  })
  expect(group.querySelector('[data-sidebar-session-row][data-glass-opaque]')).not.toBeNull()
  await act(async () => {
    fireEvent.keyDown(handles[1], { code: 'ArrowUp', key: 'ArrowUp' })
    await Promise.resolve()
  })
  await act(async () => {
    fireEvent.keyDown(handles[1], { code: 'Space', key: ' ' })
    await Promise.resolve()
  })

  const groupId = group.getAttribute('data-gateway-group')!
  expect($sidebarGroupSessionOrders.get()[groupId]).toEqual(['second', 'first'])
  expect($sidebarOrdering.get()).toBe('manual')
  await waitFor(() => {
    const updatedGroup = screen.getByText('First chat').closest('[data-gateway-group]') as HTMLElement
    expect([...updatedGroup.querySelectorAll('[data-sidebar-session-row]')].map(row => row.textContent)).toEqual([
      expect.stringContaining('Second chat'),
      expect.stringContaining('First chat')
    ])
  })
  expect(screen.getByText('Other chat').closest('[data-gateway-group]')).not.toBe(group)
})
