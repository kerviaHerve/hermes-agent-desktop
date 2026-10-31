// @vitest-environment node
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { compile } from '@tailwindcss/node'
import postcss, { type Node } from 'postcss'
import { describe, expect, it } from 'vitest'

const SRC = dirname(fileURLToPath(import.meta.url))

const CANDIDATES = ['hover:opacity-100', 'group-hover/attachment:opacity-100', 'group-hover/code:opacity-100']

async function utilitiesFor(css: string): Promise<string> {
  const { build } = await compile(css, { base: SRC, onDependency() {} })
  const out = build(CANDIDATES)
  const start = out.indexOf('@layer utilities {')
  expect(start).toBeGreaterThanOrEqual(0)

  return out.slice(start)
}

function gatesHoverOnCapabilityQuery(css: string): boolean {
  const selectors = [
    '.hover\\:opacity-100',
    '.group-hover\\/attachment\\:opacity-100',
    '.group-hover\\/code\\:opacity-100'
  ]

  const gated: boolean[] = []

  postcss.parse(css).walkRules(rule => {
    if (!selectors.some(selector => rule.selector.includes(selector))) {
      return
    }

    let parent: Node | undefined = rule.parent
    let hasHoverMedia = false

    while (parent) {
      if (parent instanceof postcss.AtRule && parent.name === 'media' && /\(\s*hover\s*:\s*hover\s*\)/.test(parent.params)) {
        hasHoverMedia = true
      }

      parent = parent.parent
    }

    gated.push(hasHoverMedia)
  })

  expect(gated).toHaveLength(selectors.length)

  return gated.every(Boolean)
}

describe('hover variant (Windows hover-reveal)', () => {
  it('still wraps hover utilities in the capability query without an override', async () => {
    const utilities = await utilitiesFor('@import "tailwindcss";\n')

    expect(utilities).toContain('group-hover')
    expect(gatesHoverOnCapabilityQuery(utilities)).toBe(true)
  })

  it('does not wrap the app stylesheet hover utilities in the capability query', async () => {
    const utilities = await utilitiesFor('@import "./styles.css";\n')

    expect(utilities).toContain('.group-hover\\/attachment\\:opacity-100')
    expect(utilities).toContain('.group-hover\\/code\\:opacity-100')
    expect(utilities).toContain('.hover\\:opacity-100')
    expect(gatesHoverOnCapabilityQuery(utilities)).toBe(false)
  })
})
