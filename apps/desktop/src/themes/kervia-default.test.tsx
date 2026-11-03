import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('starts a fresh Kervia edition in citron instead of the upstream blue theme', async () => {
  window.localStorage.clear()
  vi.stubEnv('VITE_KERVIA_DESKTOP_EDITION', '1')
  vi.resetModules()

  const { ThemeProvider } = await import('./context')

  render(<ThemeProvider><div /></ThemeProvider>)

  expect(window.document.documentElement.dataset.hermesTheme).toBe('citron')
})

it('keeps an existing user theme selection in the Kervia edition', async () => {
  window.localStorage.clear()
  window.localStorage.setItem('hermes-desktop-theme-v2', 'midnight')
  vi.stubEnv('VITE_KERVIA_DESKTOP_EDITION', '1')
  vi.resetModules()

  const { ThemeProvider } = await import('./context')

  render(<ThemeProvider><div /></ThemeProvider>)

  expect(window.document.documentElement.dataset.hermesTheme).toBe('midnight')
})
