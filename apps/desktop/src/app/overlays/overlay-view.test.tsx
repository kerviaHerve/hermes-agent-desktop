import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { openSessionFromPicker } from '@/app/open-session'
import { $selectedStoredSessionId } from '@/store/session'

import { OverlayView } from './overlay-view'

vi.mock('@/app/open-session', () => ({ openSessionFromPicker: vi.fn() }))

afterEach(() => {
  cleanup()
  $selectedStoredSessionId.set(null)
  vi.mocked(openSessionFromPicker).mockClear()
})

describe('overlay conversation return', () => {
  it('offers the focused conversation and uses the shared open path', () => {
    $selectedStoredSessionId.set('stored-chat')

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <OverlayView onClose={() => {}}>Settings</OverlayView>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Return to conversation' }))

    expect(openSessionFromPicker).toHaveBeenCalledWith('stored-chat', expect.any(Function), 'in-place')
  })

  it('does not suggest a conversation when none is selected', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <OverlayView onClose={() => {}}>Settings</OverlayView>
      </MemoryRouter>
    )

    expect(screen.queryByRole('button', { name: 'Return to conversation' })).toBeNull()
  })
})
