import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { I18nProvider } from '@/i18n'
import { $threadLayout } from '@/store/thread-layout'
import { $threadWidth } from '@/store/thread-width'

import { ComposerDisplayControls } from './chrome'

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.releasePointerCapture ??= () => undefined
  Element.prototype.scrollIntoView ??= () => undefined
})

afterEach(() => {
  cleanup()
  $threadLayout.set('editorial')
  $threadWidth.set('balanced')
})

describe('conversation width control', () => {
  it('offers four widths and updates the shared reading preference', () => {
    render(
      <I18nProvider configClient={null} initialLocale="fr">
        <ComposerDisplayControls
          activity={false}
          collapsed={true}
          controls="composer-status"
          desktopLayout={true}
          onToggleActivity={() => {}}
        />
      </I18nProvider>
    )

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Largeur du fil: Équilibrée' }), {
      button: 0,
      pointerType: 'mouse'
    })

    expect(screen.getAllByRole('menuitemradio')).toHaveLength(4)
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Pleine largeur' }))

    expect($threadWidth.get()).toBe('full')
    expect(screen.getByRole('button', { name: 'Largeur du fil: Pleine largeur' })).toBeTruthy()
  })
})

describe('conversation layout control', () => {
  it('switches between the two reading layouts without replacing the composer', () => {
    $threadLayout.set('editorial')

    render(
      <I18nProvider configClient={null} initialLocale="fr">
        <ComposerDisplayControls
          activity={false}
          collapsed={true}
          controls="composer-status"
          desktopLayout={true}
          onToggleActivity={() => {}}
        />
      </I18nProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /Présentation du fil : Éditorial aligné/ }))

    expect($threadLayout.get()).toBe('dialogue')
    expect(screen.getByRole('button', { name: /Présentation du fil : Dialogue contenu/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Présentation du fil : Dialogue contenu/ }))

    expect($threadLayout.get()).toBe('editorial')
  })
})
