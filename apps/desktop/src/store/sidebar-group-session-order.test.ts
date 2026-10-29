// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'

import { rescopeConnectionScopedStores } from '@/lib/connection-scoped'

import {
  $sidebarGroupSessionOrders,
  clearSidebarGroupSessionOrders,
  setSidebarGroupSessionOrder
} from './sidebar-group-session-order'

afterEach(() => {
  clearSidebarGroupSessionOrders()
  rescopeConnectionScopedStores({ mode: 'local' })
  clearSidebarGroupSessionOrders()
})

it('keeps each agent order on its selected Hermes connection', () => {
  const agent = JSON.stringify([null, 'forky'])

  rescopeConnectionScopedStores({ mode: 'local' })
  clearSidebarGroupSessionOrders()
  setSidebarGroupSessionOrder(agent, ['second', 'first'])
  expect($sidebarGroupSessionOrders.get()[agent]).toEqual(['second', 'first'])

  rescopeConnectionScopedStores({ baseUrl: 'https://test.invalid', mode: 'remote', profile: 'forky' })
  clearSidebarGroupSessionOrders()
  expect($sidebarGroupSessionOrders.get()[agent]).toBeUndefined()
  setSidebarGroupSessionOrder(agent, ['remote-only'])

  rescopeConnectionScopedStores({ mode: 'local' })
  expect($sidebarGroupSessionOrders.get()[agent]).toEqual(['second', 'first'])
})
