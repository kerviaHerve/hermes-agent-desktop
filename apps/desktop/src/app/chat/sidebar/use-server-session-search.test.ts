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

    const { result } = renderHook(() => useServerSessionSearch('plan', 'default', ['default']))

    await waitFor(() => expect(result.current.serverMatches.map(hit => hit.session_id)).toEqual(['local-session']))

    act(() => connectionId.set('remote'))

    expect(result.current.serverMatches).toEqual([])
    await waitFor(() => expect(search).toHaveBeenCalledTimes(2))
  })

  it('finds conversations owned by every agent on the selected Hermes', async () => {
    search.mockImplementation(async (_query, profile) => ({
      results: [
        {
          session_id: `${profile}-session`,
          model: null,
          role: null,
          session_started: null,
          snippet: 'plan',
          source: null
        }
      ]
    }))

    const { result } = renderHook(() => useServerSessionSearch('plan', '__all__', ['default', 'forky']))

    await waitFor(() => expect(result.current.serverMatches).toHaveLength(2))
    expect(search).toHaveBeenCalledWith('plan', 'default', { excludeSources: ['subagent'] })
    expect(search).toHaveBeenCalledWith('plan', 'forky', { excludeSources: ['subagent'] })
    expect(result.current.serverMatches.map(hit => hit.profile)).toEqual(['default', 'forky'])
  })

  it('still searches the default agent while the profile list is loading', async () => {
    search.mockResolvedValue({ results: [] })

    renderHook(() => useServerSessionSearch('plan', '__all__', []))

    await waitFor(() => expect(search).toHaveBeenCalledWith('plan', 'default', { excludeSources: ['subagent'] }))
  })

  it('keeps internal tool output and delegated sessions out of conversation results', async () => {
    search.mockResolvedValue({
      results: [
        { session_id: 'chat', model: null, role: 'user', session_started: null, snippet: 'plan', source: 'desktop' },
        { session_id: 'tool', model: null, role: 'tool', session_started: null, snippet: 'plan', source: 'desktop' },
        { session_id: 'child', model: null, role: 'assistant', session_started: null, snippet: 'plan', source: 'subagent' }
      ]
    })

    const { result } = renderHook(() => useServerSessionSearch('plan', 'default', ['default']))

    await waitFor(() => expect(result.current.serverMatches.map(hit => hit.session_id)).toEqual(['chat']))
  })

  it('can include technical matches when the user enables that filter', async () => {
    search.mockResolvedValue({
      results: [
        { session_id: 'tool', model: null, role: 'tool', session_started: null, snippet: 'plan', source: 'desktop' },
        { session_id: 'child', model: null, role: 'assistant', session_started: null, snippet: 'plan', source: 'subagent' }
      ]
    })

    const { result } = renderHook(() => useServerSessionSearch('plan', 'default', ['default'], true))

    await waitFor(() => expect(result.current.serverMatches.map(hit => hit.session_id)).toEqual(['tool', 'child']))
    expect(search).toHaveBeenCalledWith('plan', 'default', undefined)
  })
})
