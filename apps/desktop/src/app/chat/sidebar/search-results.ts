import type { SessionInfo, SessionSearchResult } from '@/hermes'
import { sessionMatchesSearch } from '@/lib/session-search'

// FTS snippets use literal markers around matching words. Sidebar previews
// are plain text, so remove the markers before displaying them.
export function stripFtsMarkers(snippet: string): string {
  return snippet.replaceAll('>>>', '').replaceAll('<<<', '')
}

export function searchResultToSession(result: SessionSearchResult): SessionInfo {
  const ts = result.session_started ?? Date.now() / 1000

  return {
    archived: result.archived ?? false,
    cwd: null,
    ended_at: null,
    id: result.session_id,
    _lineage_root_id: result.lineage_root ?? null,
    input_tokens: 0,
    is_active: false,
    last_active: result.last_active ?? ts,
    message_count: 0,
    model: result.model ?? null,
    output_tokens: 0,
    preview: stripFtsMarkers(result.snippet ?? '').trim() || null,
    profile: result.profile ?? 'default',
    source: result.source ?? null,
    started_at: ts,
    title: result.title?.trim() || null,
    tool_call_count: 0
  }
}

export function mergeSearchResults(
  sortedSessions: readonly SessionInfo[],
  query: string,
  serverMatches: readonly SessionSearchResult[],
  sessionByAnyId: ReadonlyMap<string, SessionInfo>,
  searchPending: boolean
): SessionInfo[] {
  if (!query) {
    return []
  }

  // Show loaded matches immediately while the request is pending. Once the
  // backend responds, its ranked matches come first, then client-only hits.
  const out = new Map<string, SessionInfo>()

  if (searchPending) {
    for (const s of sortedSessions) {
      if (sessionMatchesSearch(s, query)) {
        out.set(s.id, s)
      }
    }

    return [...out.values()]
  }

  for (const match of serverMatches) {
    if (out.has(match.session_id)) {
      continue
    }

    const loaded = sessionByAnyId.get(match.session_id)
    out.set(match.session_id, loaded ?? searchResultToSession(match))
  }

  for (const s of sortedSessions) {
    if (!out.has(s.id) && sessionMatchesSearch(s, query)) {
      out.set(s.id, s)
    }
  }

  return [...out.values()]
}
