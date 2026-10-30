import type { ProjectInfo, SessionInfo, SessionSearchResult } from '@/hermes'
import { sessionTitle } from '@/lib/chat-runtime'
import { sessionProjectLabel } from '@/lib/session-project-label'

import { searchResultToSession, stripFtsMarkers } from '../chat/sidebar/search-results'

export interface SessionEntry {
  archived: boolean
  git_branch?: null | string
  id: string
  lastActive: number | null
  matchedText?: string
  preview?: string
  profile: string
  project: string | null
  title: string
}

export function toSessionEntry(session: SessionInfo, projects: ProjectInfo[]): SessionEntry {
  return {
    archived: Boolean(session.archived),
    git_branch: session.git_branch ?? null,
    id: session.id,
    lastActive: session.last_active || session.started_at || null,
    preview: session.preview ?? undefined,
    profile: session.profile || 'default',
    project: sessionProjectLabel(session, projects),
    title: sessionTitle(session)
  }
}

/** Keep backend-ranked, full-text hits first, then the cached window as a
 * fallback while a search is pending or when an older gateway lacks FTS. */
export function mergePaletteSessionSearch(
  loaded: readonly SessionEntry[],
  serverMatches: readonly SessionSearchResult[],
  projects: ProjectInfo[]
): SessionEntry[] {
  const byId = new Map(loaded.map(session => [session.id, session] as const))
  const result = new Map<string, SessionEntry>()

  for (const hit of serverMatches) {
    const entry = byId.get(hit.session_id) ?? toSessionEntry(searchResultToSession(hit), projects)

    result.set(entry.id, { ...entry, matchedText: stripFtsMarkers(hit.snippet) })
  }

  for (const entry of loaded) {
    if (!result.has(entry.id)) {
      result.set(entry.id, entry)
    }
  }

  return [...result.values()]
}

// Search terms beyond the title: the matched message, preview, branch, agent
// and project name are all valid ways to find a conversation.
export function sessionKeywords(session: SessionEntry, ...tags: string[]): string[] {
  return [
    ...tags,
    'chat',
    'session',
    session.preview,
    session.matchedText,
    session.git_branch,
    session.profile,
    session.project
  ].filter((word): word is string => !!word)
}
