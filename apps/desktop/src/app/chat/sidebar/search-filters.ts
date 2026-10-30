import type { SessionInfo } from '@/hermes'
import { normalizeProfileKey } from '@/store/profile'

export type SearchAge = 'all' | 'week' | 'month'

/** Apply only presentation filters: the backend still searches every owner
 *  profile, so changing a filter never loses older server-only matches. */
export function filterSidebarSearchResults(
  results: readonly SessionInfo[],
  profile: string,
  age: SearchAge,
  nowSeconds = Date.now() / 1000
): SessionInfo[] {
  const days = age === 'week' ? 7 : age === 'month' ? 30 : null
  const cutoff = days == null ? null : nowSeconds - days * 86400

  return results.filter(session => {
    if (profile !== 'all' && normalizeProfileKey(session.profile) !== profile) {
      return false
    }

    return cutoff == null || (session.last_active || session.started_at) >= cutoff
  })
}
