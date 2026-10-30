import { describe, expect, it } from 'vitest'

import { pinnedPreview } from './pinned-preview'

const pins = Array.from({ length: 17 }, (_, index) => ({ id: `pin-${index + 1}` }))

describe('pinnedPreview', () => {
  it('keeps the focused pin visible even when it is beyond the first four', () => {
    expect(pinnedPreview(pins, 'pin-17', false).map(session => session.id)).toEqual([
      'pin-1',
      'pin-2',
      'pin-3',
      'pin-4',
      'pin-17'
    ])
    expect(pinnedPreview(pins, 'pin-17', true)).toHaveLength(17)
  })

  it('recognizes the focused live tip through its pinned lineage root', () => {
    const withLineage = [...pins.slice(0, 16), { id: 'live-tip', _lineage_root_id: 'pin-17' }]

    expect(pinnedPreview(withLineage, 'pin-17', false).at(-1)?.id).toBe('live-tip')
  })
})
