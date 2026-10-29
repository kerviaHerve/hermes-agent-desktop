import { act, renderHook, waitFor } from '@testing-library/react'
import type { WritableAtom } from 'nanostores'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/hermes', () => ({ searchSessions: vi.fn() }))
vi.mock('@/store/profile', () => ({ ALL_PROFILES: '__all__', normalizeProfileKey: (value: string) => value }))
vi.mock('@/store/connections', async () => {
  const { atom } = await import('nanostores')

  return { $activeConnectionId: atom<string | null>('local') }
})

import { searchSessions } from '@/hermes'
import { $activeConnectionId } from '@/store/connections'

import { useServerSessionSearch } from './use-server-session-search'

const search = vi.mocked(searchSessions)
const connectionId = $activeConnectionId as WritableAtom<string | null>

describe('server session search connection scope', () => {
  beforeEach(() => {
    connectionId.set('local')
    search.mockReset()
  })

  it('removes local results immediately after switching Hermes', async () => {
    search.mockResolvedValueOnce({
      results: [
        {
          session_id: 'local-session',
          model: null,
          role: null,
          session_started: null,
          snippet: 'local',
          source: null
        }
      ]
    })
    search.mockResolvedValueOnce({ results: [] })

    const { result } = renderHook(() => useServerSessionSearch('plan', 'default'))

    await waitFor(() => expect(result.current.serverMatches.map(hit => hit.session_id)).toEqual(['local-session']))

    act(() => connectionId.set('remote'))

    expect(result.current.serverMatches).toEqual([])
    await waitFor(() => expect(search).toHaveBeenCalledTimes(2))
  })
})
