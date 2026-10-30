import path from 'node:path'

import { expect, test } from '@playwright/test'

import { waitForChatReady } from '../../../../tests-js/scripts/desktop-chat-smoke'
import { MOCK_REPLY, startMockServer } from '../../../../tests-js/scripts/mock-server'

import { appLogTail, coreAppEnv, createCoreSandbox, launchCoreApp, writeProviderHome } from './harness'

test('local profiles keep one conversation group each and fully collapse', async () => {
  const mock = await startMockServer()
  const sandbox = createCoreSandbox('sidebar-design')
  writeProviderHome(sandbox.hermesHome, mock.url)
  writeProviderHome(path.join(sandbox.hermesHome, 'profiles', 'forky'), mock.url)
  const env = coreAppEnv(sandbox, { HERMES_DESKTOP_ISOLATED_BACKEND: '1' })
  let app: Awaited<ReturnType<typeof launchCoreApp>>['app'] | null = null

  try {
    const launched = await launchCoreApp(env)
    app = launched.app
    const page = launched.page

    try {
      await waitForChatReady(page, 90_000)
    } catch (error) {
      throw new Error(`${String(error)}\n${appLogTail(app)}`)
    }

    const composer = page.locator('[data-slot="composer-rich-input"]')
    await composer.fill('Vérification visuelle de la liste')
    await composer.press('Enter')
    await page.getByText(MOCK_REPLY).waitFor({ state: 'visible', timeout: 45_000 })
    await page.locator('[data-sidebar-session-row]').first().waitFor({ state: 'visible' })

    const agentMenu = page.locator('[data-sidebar-context] button').first()
    await agentMenu.click()
    await page.getByRole('menuitemradio', { name: /forky/i }).click()
    await waitForChatReady(page, 90_000)
    await page.getByRole('button', { name: /nouvelle session/i }).first().click()
    await composer.fill('Deuxième conversation de test')
    await composer.press('Enter')
    await page.getByText(MOCK_REPLY).waitFor({ state: 'visible', timeout: 45_000 })

    await agentMenu.click()
    await page.getByRole('menuitemradio', { name: /tous les profils/i }).click()
    await page.locator('[data-agent-session-rail] [data-sidebar-session-row]').first().waitFor({ state: 'visible' })

    const groups = page.locator('[data-gateway-group]')
    await expect(groups).toHaveCount(2)
    await expect(page.locator('[data-gateway-section]')).toHaveCount(0)
    expect(await groups.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-gateway-group')))).toEqual([
      JSON.stringify([null, 'default']),
      JSON.stringify([null, 'forky'])
    ])

    const forkyGroup = groups.nth(1)
    await expect(forkyGroup.locator('[data-sidebar-session-row]')).toHaveCount(1)
    await expect(forkyGroup.locator('[data-sidebar-session-row][data-selected="true"]')).toHaveCount(1)
    await forkyGroup.locator('[aria-expanded]').first().click()
    await expect(forkyGroup.locator('[data-sidebar-session-row]')).toHaveCount(0)
    await expect(groups.first().locator('[data-sidebar-session-row]')).toHaveCount(1)
  } finally {
    await app?.close().catch(() => undefined)
    await mock.close()
    sandbox.cleanup()
  }
})
