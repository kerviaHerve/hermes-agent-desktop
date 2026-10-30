import { describe, expect, it } from 'vitest'

import type { SessionSearchResult } from '@/hermes'

import { mergePaletteSessionSearch, type SessionEntry, sessionKeywords } from './session-search'

const loaded: SessionEntry = {
  archived: false,
  id: 'recent',
  lastActive: 100,
  preview: 'A recent conversation',
  profile: 'forky',
  project: 'Atelier Nord',
  title: 'Présentation client'
}

const oldHit: SessionSearchResult = {
  archived: true,
  last_active: 50,
  model: null,
  profile: 'research',
  role: 'user',
  session_id: 'old-chat',
  session_started: 25,
  snippet: 'A >>>contract<<< discussed last year',
  source: 'desktop',
  title: 'Ancien contrat'
}

describe('command palette conversation search', () => {
  it('offers a full-text hit outside the loaded window with its owner and archived state', () => {
    const results = mergePaletteSessionSearch([loaded], [oldHit], [])

    expect(results[0]).toMatchObject({
      archived: true,
      id: 'old-chat',
      matchedText: 'A contract discussed last year',
      profile: 'research',
      title: 'Ancien contrat'
    })
    expect(sessionKeywords(results[0])).toContain('A contract discussed last year')
    expect(results[1]).toEqual(loaded)
  })

  it('keeps a loaded conversation title and project while adding its matched message', () => {
    const results = mergePaletteSessionSearch(
      [loaded],
      [{ ...oldHit, archived: false, session_id: 'recent', snippet: '>>>budget<<< approved' }],
      []
    )

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      matchedText: 'budget approved',
      profile: 'forky',
      project: 'Atelier Nord',
      title: 'Présentation client'
    })
  })
})
