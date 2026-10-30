// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { registry } from '@/contrib/registry'

import { APPEARANCE_AREAS } from './appearance-contrib'
import { AppearanceSettings } from './appearance-settings'

const disposers: Array<() => void> = []

afterEach(() => {
  cleanup()
  disposers.splice(0).forEach(dispose => dispose())
})

function renderPage(subpage?: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AppearanceSettings subpage={subpage} />
    </QueryClientProvider>
  )
}

describe('AppearanceSettings extra slot', () => {
  it('mounts plugin extras on the top-level page only, not on deep-link subpages', () => {
    act(() => {
      disposers.push(
        registry.register({
          area: APPEARANCE_AREAS.extra,
          id: 'extra-controls',
          render: () => <span>Extra controls</span>,
          source: 'disk'
        })
      )
    })

    const { unmount } = renderPage('pet')

    expect(screen.queryByText('Extra controls')).toBeNull()
    unmount()

    renderPage()

    expect(screen.getByText('Extra controls')).toBeTruthy()
  })
})

describe('HeroUI theme picker', () => {
  it('filters installed themes and restores the list with the clear control', () => {
    renderPage('theme')

    const search = screen.getByRole('textbox', { name: /Search your themes or the VS Code Marketplace/i })
    expect(search.className).toContain('input')

    fireEvent.change(search, { target: { value: 'catppuccin' } })
    expect(screen.getByRole('button', { name: /Catppuccin/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Nous Alt/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Clear search/i }))
    expect((search as HTMLInputElement).value).toBe('')
    expect(screen.getByRole('button', { name: /Nous Alt/i })).toBeTruthy()
  })
})
