export const PINNED_PREVIEW_LIMIT = 4

/** Keep a long pinned list compact without hiding the conversation in focus. */
export function pinnedPreview<T extends { id: string; _lineage_root_id?: null | string }>(
  sessions: readonly T[],
  focusedId: null | string,
  expanded: boolean
): T[] {
  if (expanded || sessions.length <= PINNED_PREVIEW_LIMIT) {
    return [...sessions]
  }

  const preview = sessions.slice(0, PINNED_PREVIEW_LIMIT)
  const focused = sessions.find(session => session.id === focusedId || session._lineage_root_id === focusedId)

  if (focused && !preview.includes(focused)) {
    preview.push(focused)
  }

  return preview
}
