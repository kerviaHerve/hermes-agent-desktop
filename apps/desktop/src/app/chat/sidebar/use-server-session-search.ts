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
 * so old sessions stay findable. In All profiles, search each profile on the
 * selected connection; an unscoped backend search only covers its launch
 * profile, silently missing older conversations owned by other agents.
 */
export function useServerSessionSearch(
  query: string,
  profileScope: string,
  profiles: readonly string[],
  includeTechnical = false
): ServerSessionSearch {
  const connectionId = useStore($activeConnectionId)
  const [result, setResult] = useState<{ key: string; matches: SessionSearchResult[] } | null>(null)
  const [searchPending, setSearchPending] = useState(false)

  const profileKeys =
    profileScope === ALL_PROFILES
      ? (profiles.length ? profiles : ['default']).map(normalizeProfileKey)
      : [normalizeProfileKey(profileScope)]

  const key = JSON.stringify([connectionId, profileKeys, query, includeTechnical])

  useEffect(() => {
    if (!query) {
      setResult(null)
      setSearchPending(false)

      return
    }

    let cancelled = false
    const [, profilesToSearch, , searchTechnical] = JSON.parse(key) as [string | null, string[], string, boolean]

    setSearchPending(true)

    const id = window.setTimeout(() => {
      void Promise.allSettled(
        profilesToSearch.map(profile =>
          searchSessions(query, profile, searchTechnical ? undefined : { excludeSources: ['subagent'] }).then(res =>
            res.results
              .filter(hit => searchTechnical || (hit.role !== 'tool' && hit.source !== 'subagent'))
              .map(hit => ({ ...hit, profile: hit.profile ?? profile }))
          )
        )
      )
        .then(responses => {
          if (!cancelled) {
            setResult({
              key,
              matches: responses.flatMap(response => (response.status === 'fulfilled' ? response.value : []))
            })
          }
        })
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
  }, [key, query])

  // The previous connection's results must disappear on the first render of a
  // switch, before the effect above has a chance to start a new request.
  return { searchPending, serverMatches: result?.key === key ? result.matches : [] }
}
