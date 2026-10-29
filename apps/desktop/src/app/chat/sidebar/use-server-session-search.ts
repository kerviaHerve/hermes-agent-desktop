import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'

import { searchSessions, type SessionSearchResult } from '@/hermes'
import { $activeConnectionId } from '@/store/connections'
import { ALL_PROFILES, normalizeProfileKey } from '@/store/profile'

const SEARCH_DEBOUNCE_MS = 200

export interface ServerSessionSearch {
  serverMatches: SessionSearchResult[]
  searchPending: boolean
}

/**
 * Debounced full-text search across *all* sessions (not just the loaded page)
 * so old sessions stay findable. Hits come from the profile the sidebar shows:
 * an unscoped request searches the primary backend's launch profile, whatever
 * profile is on screen. "All profiles" asks the primary as before.
 */
export function useServerSessionSearch(query: string, profileScope: string): ServerSessionSearch {
  const connectionId = useStore($activeConnectionId)
  const [result, setResult] = useState<{ key: string; matches: SessionSearchResult[] } | null>(null)
  const [searchPending, setSearchPending] = useState(false)
  const profile = profileScope === ALL_PROFILES ? null : normalizeProfileKey(profileScope)
  const key = JSON.stringify([connectionId, profile, query])

  useEffect(() => {
    if (!query) {
      setResult(null)
      setSearchPending(false)

      return
    }

    let cancelled = false

    setSearchPending(true)

    const id = window.setTimeout(() => {
      void searchSessions(query, profile)
        .then(res => {
          if (!cancelled) {
            setResult({ key, matches: res.results })
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) {
            setSearchPending(false)
          }
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [connectionId, key, profile, query])

  // The previous connection's results must disappear on the first render of a
  // switch, before the effect above has a chance to start a new request.
  return { searchPending, serverMatches: result?.key === key ? result.matches : [] }
}
