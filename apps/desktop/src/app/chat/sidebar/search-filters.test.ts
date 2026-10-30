import { describe, expect, it } from 'vitest'

import { makeSessionInfo } from '@/test/session-info'

import { filterSidebarSearchResults } from './search-filters'

const now = 1_800_000_000
const sessions = [
  makeSessionInfo({ id: 'recent-forky', profile: 'forky', last_active: now - 3600 }),
  makeSessionInfo({ id: 'old-forky', profile: 'forky', last_active: now - 35 * 86400 }),
  makeSessionInfo({ id: 'recent-default', profile: 'default', last_active: now - 2 * 86400 })
]

describe('sidebar search filters', () => {
  it('limits results by agent and last activity without changing their order', () => {
    expect(filterSidebarSearchResults(sessions, 'forky', 'week', now).map(session => session.id)).toEqual([
      'recent-forky'
    ])
    expect(filterSidebarSearchResults(sessions, 'all', 'month', now).map(session => session.id)).toEqual([
      'recent-forky',
      'recent-default'
    ])
  })
})
